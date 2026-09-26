# Kinograde — backend (Django 5.2 + DRF)

The data tier. It owns users, credits, the catalogue, generations and likes,
and it is the only tier allowed to decide what a shot costs or what its prompt
says. Only the gateway talks to it: every request must carry
`X-Gateway-Key`, and requests made on behalf of a person also carry
`X-Session-Token`. See `../docs/CONTRACT.md` — where this README and the
contract disagree, the contract is right.

## Run it

```bash
cd backend
python -m venv .venv                      # already present in this checkout
./.venv/Scripts/python.exe -m pip install -r requirements.txt
cp .env.example .env                      # then fill in the real values
./.venv/Scripts/python.exe manage.py migrate
./.venv/Scripts/python.exe manage.py seed_catalog
./.venv/Scripts/python.exe manage.py runserver 127.0.0.1:8000
```

`manage.py`, `wsgi.py` and `asgi.py` default to `config.settings.dev`.
Production sets `DJANGO_SETTINGS_MODULE=config.settings.prod`, which turns
debug off, hardens the cookies and expects TLS to be terminated by a proxy
(`X-Forwarded-Proto`). `manage.py check --deploy` passes clean under `prod`.

An admin login for `/admin/`:

```bash
./.venv/Scripts/python.exe manage.py createsuperuser
```

### Environment

`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`,
`GATEWAY_KEY`, `CORS_ALLOWED_ORIGINS` — see `.env.example`. `GATEWAY_KEY` must
match the gateway's. `.env` is never committed.

### Seeding

`seed_catalog` upserts 15 models and 77 presets from
`apps/catalog/seed_data.py`, which is a transcription of the frontend's
original `lib/catalog.ts`. It is idempotent, so it is safe to run on every
deploy. Output options (aspects, resolutions, durations) and plans are code,
not rows — `apps/catalog/constants.py`.

## Layout

```
config/
  settings/{base,dev,prod}.py   env-driven settings; base reads .env
  urls.py                       everything under /api/v1/, plus /admin/
core/                           shared, app-agnostic infrastructure
  authentication.py             X-Session-Token -> user
  permissions.py                X-Gateway-Key (global) and session checks
  exceptions.py                 every error as {"error": {code, message}}
  pagination.py                 (created_at, id) cursor -> {items, next_cursor}
  views.py                      /api/v1/health/
apps/accounts/                  User (uuid pk, email login, plan, credits), Session
apps/catalog/                   Model, Preset, the catalogue endpoint, seed_catalog
apps/studio/                    Generation, Like, the studio and feed endpoints
```

Each app is thin views over `services.py` (writes) and `selectors.py` (reads);
serializers do the validating. Business rules live in services and nowhere
else.

## Endpoints

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | `{email, name, password}` | `201 {token, account}` |
| POST | `/api/v1/auth/login` | `{email, password}` | `{token, account}` |
| POST | `/api/v1/auth/logout` | — | `{ok}` |
| GET | `/api/v1/auth/me` | — | `{account}` |
| GET | `/api/v1/catalog/` | — | `{models, presets, aspects, resolutions, durations, plans}` |
| GET | `/api/v1/generations/` | `?limit&cursor` | `{items, next_cursor}` |
| POST | `/api/v1/generations/` | create body | `201 {items}` |
| GET | `/api/v1/generations/<uuid>/` | — | `{generation}` |
| DELETE | `/api/v1/generations/<uuid>/` | — | `{ok, refunded}` |
| GET | `/api/v1/feed/` | `?limit&cursor&kind&model` | `{items, next_cursor}` |
| POST/DELETE | `/api/v1/feed/<uuid>/like/` | — | `{liked, likes}` |
| POST | `/api/v1/account/plan/` | `{plan}` | `{account}` |
| GET | `/api/v1/health/` | — | `{status, database}` |

`token` is for the gateway alone: it becomes the httpOnly cookie and must never
reach a browser. The feed is readable without a session (`liked_by_me` is then
false); everything else under `/generations/`, `/account/` and `/auth/me`
requires one.

## Rules this tier enforces

- **Cost** — `round(model.cost × resolution × duration/5 × sound) × batch`,
  where `duration/5` and the 1.15 sound surcharge apply to video only.
  Resolution multipliers: 720p 0.6, 1080p 1, 4k 2.2. Computed in `Decimal` and
  rounded half-up so it matches the frontend's optimistic quote exactly.
- **Composition** — subject, film, palette, light, effect, camera. Camera last,
  and dropped entirely on an image.
- **Credits** — deducted in the same transaction as the insert, with
  `SELECT … FOR UPDATE` on the user row. An unaffordable batch is rejected
  whole: `402 {"error": {"code": "insufficient_credits", …}}`, nothing written.
- **Refunds** — deleting a `failed` generation returns its credits; deleting a
  `ready` one does not.
- **Errors** — always `{"error": {"code", "message"}}`, including 500s.

## Known limitations

- There is no render worker on this tier, so a generation is created `ready`
  with `media_url` null; the UI draws its poster from `seed`. `queued`,
  `rendering` and `failed` exist in the model for when one arrives, and can be
  set from the admin.
- `duration` is stored as `0` and `sound` as `false` on images, for the same
  reason a camera move is dropped there.
