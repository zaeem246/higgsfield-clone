# Higgsfield — rebuild

A rebuild of [higgsfield.ai](https://higgsfield.ai): an AI-native creative suite for
generating cinematic video and images from a prompt, built around the thing that makes
the original distinctive — **one-click camera direction**.

**Live:** https://higgsfieldclone.vercel.app

Not affiliated with Higgsfield, Inc. Built for assessment.

---

## What it does

| Surface | What's there |
| --- | --- |
| `/` | Landing page — the pitch, the preset wall, the model line-up |
| `/signup` | Account creation, 60 free credits |
| `/generate` | **The core.** Prompt → references, film setup, camera, colour palette, lighting, effect → model, resolution, aspect, duration, sound, batch |
| `/explore` | Community feed. Every shot exposes its prompt, model and preset, and can be recreated |
| `/projects` | Everything you've made, filterable |
| `/effects` | The full preset library — 28 camera moves, 24 effects, searchable and grouped |
| `/pricing` | Free / Basic / Pro / Max, monthly-annual toggle, switchable live |

### What I built first, and why

The original spreads across a dozen sub-products (Canvas, Layers, Marketing Studio, MCP,
plugins, a 3D game generator). Cloning that surface area thinly would have produced
something wide and dead.

What actually distinguishes Higgsfield from every other text-to-video tool is the
**camera control layer**: you don't describe a dolly zoom and hope, you press a button
and the model is told precisely what the camera does. So the build order was:

1. **The generator** — the full prompt → preset → render loop, with credits, batches,
   queue states and per-model costs. This is the product.
2. **The preset library** — 52 presets, browsable and searchable, because these are the
   reason people come.
3. **Explore with Recreate** — the feed is a distribution mechanism, and "show the recipe,
   let people fork it" is the loop that makes it compound.
4. **Accounts, credits, pricing** — enough economy for the generator to feel real.

**Deliberately left out:** the sub-studios, the plugin/MCP integrations, video editing and
compositing, team seats, real payments. Each is a product of its own, and none changes
whether the core loop feels good.

### How the original was studied

The signed-in app is behind a login, so I drove a real Chromium session with
Playwright against the live site, dismissed the cookie wall, and read the rendered
generator, pricing and effects pages directly. That is where the model names, the 52
preset names, the tier structure and the credit economics come from — not guesswork.

Three things it corrected in this build:

- **The accent is acid lime**, not the amber I had first assumed.
- **The generator is a centred command bar**, not a left-hand form panel: a row of
  look chips (References, Film setup, Camera, Colour palette, Lighting) above a prompt
  bar, with model, resolution, aspect, duration, sound and batch on a toolbar beneath,
  and the credit cost printed on the Generate button.
- **The credit economics are far cheaper per unit** than I had guessed. The live page
  states 120 credits buys ~60 stills or ~7 five-second videos, so unit costs here were
  rescaled to match (~2 credits a still, ~17 a video).
- **The model line-up is much larger** than the six I first built. The site's own footer
  sitemap lists nine video models (Seedance 2.5 / 2.0, Kling 3.0, Sora 2, Veo 3.1, WAN
  2.6, Grok Imagine 1.5, Gemini Omni Flash, Cinema Studio 4.0) and six image models
  (Nano Banana Pro, Flux 2, Seedream 5, GPT Image 2, Soul, Soul 2.0). All fifteen are in
  the picker, and the aspect set now matches theirs (16:9, 9:16, 1:1, 4:3, 3:4, 21:9).

**Still out of scope, now knowingly rather than by omission:** Audio (a full
text-to-speech and voice-cloning surface), Layers (relight, inpaint, layer
decomposition), Canvas, Marketing Studio, Supercomputer, 3D Jutsu and Academy are each
separate products behind the same nav. None of them changes whether the core generate
loop feels good, which is what this rebuild is about.

### Where this improves on the original

- **The composed prompt is visible.** Before generating, and on every finished asset, you
  can see exactly what the presets appended to your words. The original hides it.
- **Every community post is a working template** — one click loads its exact settings.
- **Cost is quoted before you commit**, and it reacts live to duration, quality and batch.
- **Failed renders refund their credits** rather than silently costing you.
- **Presets carry their prompt fragment** in a tooltip, so the tool teaches you what it's
  doing instead of being a black box.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm start   # production
npm run lint
```

Requires Node 20+. No database, no external services, no keys needed to run.

### Generation: demo and live

The generator is hybrid, and says which mode it's in via a badge in the UI.

- **Demo mode (default).** No key required. Generations run through the real request and
  validation path, then resolve to deterministic poster art derived from a seed. The
  deployed link works for anyone, immediately, at zero cost.
- **Live mode.** Set `AI_GATEWAY_API_KEY` and image generation calls a real provider
  through Vercel AI Gateway. Same code path, same response shape — only the pixels change.

```bash
cp .env.example .env.local   # then add your key
```

Video stays simulated even with a key: real video models need asynchronous job polling,
which a single request cannot honestly model. The UI says so rather than pretending.

If a live request fails, it degrades to demo output and surfaces the provider's error —
it never silently charges you for nothing.

---

## Deploying

Deployed at **https://higgsfieldclone.vercel.app**. Zero-config on Vercel; Next.js is
auto-detected.

```bash
npm i -g vercel
vercel            # preview
vercel --prod     # production
```

Optionally add the key for live generation:

```bash
vercel env add AI_GATEWAY_API_KEY
```

Nothing else needs configuring — no database to provision, no storage to attach.

---

## How it's built

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4.

```
app/
  page.tsx              landing
  signup/               account creation
  (app)/                everything behind the app shell
    generate/           the generator
    explore/ projects/ effects/ pricing/
  api/generate/         hybrid generation endpoint + validation
components/             Generator, Gallery, Asset, PresetPicker, Poster, AppShell, ui
lib/
  catalog.ts            models, 28 camera moves, 24 effects, film setups,
                        palettes, lighting, credit maths
  seed.ts               community feed (deterministic)
  store.tsx             client persistence via useSyncExternalStore
  poster.ts             deterministic poster art
  types.ts
```

### Two decisions worth explaining

**Accounts live in the browser.** There is no database. The live link has to work for any
visitor with no provisioning and no state leaking between strangers, so an account and its
generations are stored in that visitor's own `localStorage`. It is read through
`useSyncExternalStore`, so the server render and first client render agree and React
re-renders once after hydration. Every consumer goes through `useStore()`, so swapping in
a server-backed store is a single-file change. This is a demo account system and the signup
page says so plainly — no passwords, nothing transmitted.

**Poster art is deterministic, not random.** In demo mode there is no render to show, and a
grid of grey boxes would make the product look broken. Each generation derives a stable
cinematic colour grade from its seed and layers a photographic fetch on top. If that fetch
fails the grade remains, so a tile degrades to "stylised" and never to "empty" or a broken
image icon.

---

## Agent capture

Every prompt and end-of-turn response in this repo is captured automatically to
`.agent-logs/` by a Claude Code hook. See **[CAPTURE-TEST.md](CAPTURE-TEST.md)** for how it
works, the race condition it caught, and proof it fires across independent sessions.

`.agent-logs/` is committed on purpose and ships publicly. Only `.agent-logs/.state/` —
the hook's own bookkeeping — is ignored.

---

## Verification

21 end-to-end browser checks pass against a production build, covering signup, credit
deduction, preset search and apply, all five look families, generation queue states,
persistence to Projects, Explore → Recreate round-tripping, plan switching, and absence
of horizontal scroll at 390px. The API's validation is exercised separately: empty prompts, unknown models,
mode/model mismatch, bad aspect ratios, batch clamping and malformed JSON all rejected.

`npm run lint` and `npm run build` are clean.

The same 21 checks were re-run against the live production URL anonymously (no session,
no cookies) and all pass, confirming the link opens for someone who is not the author.

**One Windows note for anyone redeploying:** `vercel deploy --temporary` forces a local
build, and the Vercel Next.js builder creates symlinks that Windows refuses without
Developer Mode (`EPERM: operation not permitted, symlink`). A normal authenticated
`vercel deploy` builds remotely and sidesteps it entirely.
