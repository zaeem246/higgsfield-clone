# Kinograde gateway

Node + Hono + TypeScript. The middle tier from `docs/CONTRACT.md`: it is the
only thing a browser talks to, and the only thing that knows a session token
exists.

```
browser  ──credentialed fetch──▶  gateway  ──X-Gateway-Key + X-Session-Token──▶  Django
         ◀──httpOnly cookie────           ◀────────────── snake_case JSON ──────
```

## What it does

- **Owns the session cookie.** Django returns an opaque token; the gateway puts
  it in `kg_session` (httpOnly, `SameSite=Lax`, `Secure` in production) and
  returns only the account. The token never appears in a response body and is
  never readable from JavaScript.
- **Shapes the wire.** snake_case from Django becomes camelCase for the
  browser, and back again on the way in. One place: `src/lib/case.ts`.
- **Validates everything.** Every body and query string has a zod schema in
  `src/lib/schema.ts`. Invalid input is answered `400 invalid_request` and
  never reaches Django.
- **Protects the backend.** Credentialed CORS pinned to `ALLOWED_ORIGIN`,
  60 requests/minute per IP overall and 10/minute on `/api/auth/*`, a 10s
  timeout on every backend call, and `502 upstream_unavailable` when Django is
  not answering.

It contains **no business logic**. Cost, prompt composition, credits and
refunds are Django's, and are forwarded untouched.

## Running it

```bash
cp .env.example .env     # then fill in GATEWAY_KEY to match the backend
npm install
npm run dev              # tsx watch, http://localhost:4000
```

| Script | Does |
| --- | --- |
| `npm run dev` | watch mode |
| `npm run build` | `tsc` to `dist/` |
| `npm start` | run the build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run smoke` | contract smoke test against a running gateway |

`npm run smoke` exercises register → login → me → catalog → create → list →
feed → like → logout and prints PASS/FAIL per check. If Django is not up it
runs the gateway-only half, says clearly that it skipped the rest, and still
exits 0. It also asserts the cookie flags and that the issued token appears in
no response body.

## Layout

```
src/
  index.ts              bootstrap: env, listen, graceful shutdown
  env.ts                env parsed and frozen at boot; bad config exits 1
  app.ts                middleware order + route mounting + request log
  middleware/
    cors.ts             credentialed CORS pinned to ALLOWED_ORIGIN
    error.ts            ApiError + the single { error: { code, message } } shape
    rateLimit.ts        in-memory sliding window per IP
    session.ts          cookie in, `c.get("sessionToken")` out
  routes/               auth · catalog · generations · feed · account · health
  lib/
    backend.ts          the only module that calls Django
    case.ts             snake_case ↔ camelCase
    schema.ts           zod schemas + request parsing helpers
scripts/smoke.mjs       end-to-end contract check
```

Middleware order, outermost first: request log → CORS (so preflights never
spend rate-limit budget) → general rate limit → session cookie → the extra auth
rate limit → routes.

## Environment

See `.env.example`. `GATEWAY_KEY` must be byte-identical to the backend's;
Django rejects any call without it.

## Decisions worth knowing

- **`GET /api/health` always answers 200**, with `backend.reachable` saying
  whether Django replied. A health endpoint that dies with its dependency
  cannot tell you which tier is broken.
- **Logout clears the cookie even if Django is unreachable.** A stale session
  row is harmless; a browser that cannot sign out is not.
- **Bodies are `.strict()`** — unknown keys are a 400 rather than something
  quietly forwarded upstream.
- **Rate limiting is in-memory**, so the limit is per process. Behind more than
  one instance it needs a shared store.
- **The cookie has a 30-day `Max-Age`.** Django still decides when a session is
  actually dead; a cookie that outlives it simply gets a 401.
