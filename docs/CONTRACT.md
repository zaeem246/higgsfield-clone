# Kinograde — system contract

Three tiers, three deployables. This file is the single source of truth every
tier builds against. If an implementation disagrees with this document, the
document is right.

```
frontend/   Next.js 16 + TypeScript   the only tier a browser talks to
gateway/    Node + Hono + TypeScript  session cookies, validation, rate limits
backend/    Django 5.2 + DRF          data, business rules, Postgres (Neon)
```

**Traffic only ever flows one way:** browser → gateway → Django → Postgres.
The frontend never holds a Django URL and never sees a session token. Django is
never exposed to a browser.

---

## Responsibilities

| Tier | Owns | Must never |
| --- | --- | --- |
| frontend | Rendering, optimistic UI, routing | Talk to Django; read/write cookies for auth; hold secrets |
| gateway | The httpOnly session cookie, request/response shaping, input validation, rate limiting | Contain business rules; talk to Postgres |
| backend | Users, credits, catalogue, generations, likes, all invariants | Trust any caller without the gateway key |

**Why a gateway at all:** it is the only tier that knows the session token
exists. The browser gets an opaque httpOnly cookie, Django gets a header. That
keeps tokens out of JavaScript entirely, and means the backend can move or
scale without the frontend knowing.

---

## Authentication

1. Browser posts credentials to the gateway.
2. Gateway forwards to Django, which verifies the password and creates a
   `Session` row, returning an opaque token.
3. Gateway puts that token in an **httpOnly, SameSite=Lax, Secure** cookie
   named `kg_session` and returns only the account to the browser.
4. On every later request the gateway reads the cookie and sends
   `X-Session-Token: <token>` to Django.

Every gateway → Django request also carries `X-Gateway-Key: <shared secret>`.
Django rejects anything without it, so the API cannot be called directly even
if its URL leaks.

Passwords: Django's default PBKDF2 hasher. Never logged, never returned.

---

## Gateway API — what the browser calls

Base: `/api`. All JSON. Errors are always `{ "error": { "code": "...", "message": "..." } }`.

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{ email, name, password }` | `{ account }` + sets cookie |
| POST | `/api/auth/login` | `{ email, password }` | `{ account }` + sets cookie |
| POST | `/api/auth/logout` | — | `{ ok: true }` + clears cookie |
| GET | `/api/auth/me` | — | `{ account }` or `401` |
| GET | `/api/catalog` | — | `{ models, presets, aspects, resolutions, durations, plans }` |
| GET | `/api/generations` | `?limit&cursor` | `{ items, nextCursor }` |
| POST | `/api/generations` | see **Create** below | `{ items }` |
| GET | `/api/generations/:id` | — | `{ generation }` |
| DELETE | `/api/generations/:id` | — | `{ ok: true, refunded }` |
| GET | `/api/feed` | `?limit&cursor&kind&model` | `{ items, nextCursor }` |
| POST | `/api/feed/:id/like` | — | `{ liked, likes }` |
| DELETE | `/api/feed/:id/like` | — | `{ liked, likes }` |
| POST | `/api/account/plan` | `{ plan }` | `{ account }` |

### Create a generation

```jsonc
POST /api/generations
{
  "prompt":     "string, 1..2000",
  "kind":       "image" | "video",
  "modelId":    "string",
  "cameraId":   "string | null",   // video only
  "effectId":   "string | null",
  "filmId":     "string | null",
  "paletteId":  "string | null",
  "lightId":    "string | null",
  "aspect":     "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9",
  "resolution": "720p" | "1080p" | "4k",
  "duration":   3 | 5 | 8 | 10,    // video only
  "sound":      true,              // video only
  "batch":      1..4
}
```

Django is authoritative for **cost, prompt composition and credit deduction**.
The frontend may show an optimistic preview using catalogue data, but the number
that counts is the one that comes back.

---

## Shared shapes

```ts
type Account = {
  id: string; email: string; name: string;
  plan: "free" | "studio" | "production";
  credits: number; createdAt: string;
};

type Model = {
  id: string; name: string; kind: "image" | "video";
  tagline: string; cost: number; badge: string | null; strengths: string[];
};

type Preset = {
  id: string; family: "camera" | "effect" | "film" | "palette" | "light";
  name: string; group: string; fragment: string;
};

type Generation = {
  id: string; prompt: string; composedPrompt: string;
  kind: "image" | "video"; modelId: string; modelName: string;
  cameraId: string | null; effectId: string | null;
  filmId: string | null; paletteId: string | null; lightId: string | null;
  aspect: string; resolution: string; duration: number; sound: boolean;
  status: "queued" | "rendering" | "ready" | "failed";
  seed: string; mediaUrl: string | null;
  creditsSpent: number; createdAt: string;
  author: { id: string; name: string } | null;  // feed only
  likes: number; likedByMe: boolean;
};
```

`snake_case` in Postgres and Django. `camelCase` over the wire — the **gateway**
does that translation so neither neighbour has to care.

---

## Django API — what the gateway calls

Base: `/api/v1`. Same resources, snake_case, no cookies.

**Auth response shape — both tiers must agree exactly.** `register` and `login`
return the session token *alongside* the account, because the gateway needs the
token to set its cookie and the browser must never see it:

```jsonc
// 201 for register, 200 for login
{
  "token": "<opaque session token>",
  "account": { "id": "...", "email": "...", "name": "...",
               "plan": "free", "credits": 240, "created_at": "..." }
}
```

The gateway strips `token`, sets the cookie, and forwards only `account`. If
either field is missing the gateway returns 502 naming what was absent.

Every other Django response is forwarded verbatim (after case conversion), so
Django alone owns cost, prompt composition and credits.

| Method | Path |
| --- | --- |
| POST | `/api/v1/auth/register` · `/login` · `/logout` |
| GET | `/api/v1/auth/me` |
| GET | `/api/v1/catalog/` |
| GET/POST | `/api/v1/generations/` |
| GET/DELETE | `/api/v1/generations/<uuid>/` |
| GET | `/api/v1/feed/` |
| POST/DELETE | `/api/v1/feed/<uuid>/like/` |
| POST | `/api/v1/account/plan/` |
| GET | `/api/v1/health/` |

---

## Business rules — Django enforces, nobody else

- Credits are deducted **inside the same transaction** that inserts the
  generations. A request that cannot afford its batch is rejected whole, with
  `402 insufficient_credits`; partial batches never happen.
- Deleting a `failed` generation refunds its credits. Deleting a `ready` one
  does not.
- A camera move on an `image` is dropped, not stored — it means nothing without
  motion.
- Prompt composition order is fixed: **subject, film, palette, light, effect,
  camera**. Camera last, so the motion instruction sits next to the action.
- Cost: `round(model.cost × resolution × qualityless × duration/5 × sound) × batch`,
  where video multiplies by `duration/5` and by `1.15` when sound is on.

---

## Environment

Each tier has its own `.env.example`, committed; real `.env` files never are.

| Tier | Variables |
| --- | --- |
| backend | `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, `GATEWAY_KEY`, `CORS_ALLOWED_ORIGINS` |
| gateway | `PORT`, `BACKEND_URL`, `GATEWAY_KEY`, `SESSION_COOKIE_NAME`, `ALLOWED_ORIGIN`, `NODE_ENV` |
| frontend | `NEXT_PUBLIC_APP_NAME`, `GATEWAY_URL` (server-side only) |

`GATEWAY_KEY` must be identical in gateway and backend. `DATABASE_URL` comes
from the provisioned Neon resource (`kinograde-db`).
