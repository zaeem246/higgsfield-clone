# Kinograde

A tool for **composing** a shot rather than gambling on a prompt. You write the
subject, then choose the stock, the grade, the light, the effect and the camera
move — and the interface shows you exactly what those choices add to the prompt
before you spend a credit on it.

**Live:** https://higgsfieldclone.vercel.app

---

## Architecture

Three tiers, three deployables, one direction of traffic.

```
                    ┌──────────────┐
   browser ───────▶ │  frontend/   │  Next.js 16 · TypeScript
                    │              │  rendering only — no secrets, no DB
                    └──────┬───────┘
                           │  server-side proxy, cookies forwarded
                    ┌──────▼───────┐
                    │  gateway/    │  Node · Hono · TypeScript
                    │              │  the httpOnly session cookie lives here;
                    │              │  validation, rate limits, case translation
                    └──────┬───────┘
                           │  X-Gateway-Key + X-Session-Token
                    ┌──────▼───────┐
                    │  backend/    │  Django 5.2 · DRF · Python
                    │              │  users, credits, catalogue, generations
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Postgres    │  Neon (Vercel Marketplace)
                    └──────────────┘
```

### Why it is split this way

**The browser never learns that a session token exists.** It holds an opaque
httpOnly cookie; the gateway is the only tier that turns that into a token and
forwards it. Tokens are therefore unreachable from JavaScript, and the backend
can move, scale or be replaced without the frontend knowing its address.

**Business rules live in exactly one place.** Cost, prompt composition and
credit deduction are Django's, inside a transaction. The frontend may show an
optimistic preview, but the authoritative number is the one that comes back —
so a tampered client cannot buy a render for free.

**The gateway absorbs the boring differences.** Django speaks `snake_case`,
browsers expect `camelCase`; validation, rate limiting and error shaping all
belong at the edge rather than smeared across the other two tiers.

The full specification is in **[docs/CONTRACT.md](docs/CONTRACT.md)**. The
visual direction, and the reasoning behind it, is in
**[docs/DESIGN.md](docs/DESIGN.md)**.

---

## Running it

Three terminals, in this order. Each tier has its own `.env.example` — copy it
to `.env` (`.env.local` for the frontend) and fill it in. `GATEWAY_KEY` must be
identical in the gateway and the backend.

**1. Backend** — Django on `:8000`

```bash
cd backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # macOS/Linux: .venv/bin/python
./.venv/Scripts/python.exe manage.py migrate
./.venv/Scripts/python.exe manage.py seed_catalog
./.venv/Scripts/python.exe manage.py runserver
```

**2. Gateway** — Hono on `:4000`

```bash
cd gateway
npm install
npm run dev
```

**3. Frontend** — Next.js on `:3000`

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

### Database

Postgres is a Neon instance provisioned through the Vercel Marketplace
(`kinograde-db`). `DATABASE_URL` is injected into the project by Vercel; pull it
locally with `vercel env pull .env.local`. There is no SQLite fallback and no
seed-data stand-in — if the database is unreachable the app says so rather than
inventing rows.

---

## Agent capture

Every prompt and end-of-turn response in this repo is captured automatically to
`.agent-logs/` by a Claude Code hook. See **[CAPTURE-TEST.md](CAPTURE-TEST.md)**
for how it works, the two defects it caught in itself, and proof it fires across
independent sessions.

`.agent-logs/` is committed on purpose. Only `.agent-logs/.state/` — the hook's
own bookkeeping — is ignored.
