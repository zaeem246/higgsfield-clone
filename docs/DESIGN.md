# Kinograde — design direction

The brief changed: 8x want our own design choices, not a clone. So this is a
deliberate move **away** from the category default — and away from what this
repo previously contained.

## The problem with the obvious answer

Every AI generation tool looks the same: near-black canvas, one neon accent
(lime, violet or cyan), tight sans-serif, glassmorphic panels, a wall of
autoplaying video. Higgsfield, Runway, Pika, Luma, Krea — swap the logos and
you could not tell them apart. Building that again says nothing about taste.

## The position

**Kinograde is a director's tool, not a content firehose.** The product's actual
argument is that you *compose a shot* — subject, stock, grade, light, motion —
rather than rolling the dice on a prompt. So the interface should feel like the
things directors actually work with: a shot list, a contact sheet, a lookbook,
grease pencil on a printed still.

That gives a design language nobody else in the category is using.

### Principles

1. **A warm dark room, not a blue void.** The ground is a warm near-black
   (`#14120E`) — the colour of a grading suite, not of every other AI tool's
   blue-black. Work is judged against dark in every edit bay there has ever
   been, and the plates carry all the colour. A warm paper light mode exists and
   is equally considered, but dark is the default and the one we design first.
2. **Editorial typography.** A real display serif for headings, set large and
   tight, with a clean grotesque for UI. Numerals are tabular everywhere.
3. **One accent, used sparingly.** Vermilion — the colour of a grease pencil
   and film leader. It marks the current shot, the spend, the primary action.
   Nothing else is chromatic; the user's own media supplies all other colour.
4. **The grid is visible, and it is dense.** Thin rules, aligned baselines,
   and confident information density — this is a professional tool, not a
   landing page with a lot of air. Panels sit close, metadata is printed in
   small mono rather than hidden behind hover, and a screen earns its scroll.
   Structure is the aesthetic, rather than decoration laid on top.
5. **Motion explains, never decorates.** Things move to show cause and effect —
   a preset lands in the prompt, a cost recalculates, a render resolves. No
   animation exists purely to be seen.

## Tokens

```
Ink      #14120E   ground (default)
Raised   #1C1915   panels, one step up from the ground
Bone     #F2EDE3   text on dark
Vermilion#E85A2A   the only accent — brighter on dark than it was on paper
Graphite #8A8377   secondary text
Rule     #2E2920   hairlines
```

Light mode inverts to warm paper (`#F6F3EC` ground, `#17140F` ink), never a
cold grey-white. Both themes are warm; neither has a blue cast.

**Type:** Instrument Serif (display) + Geist (UI) + Geist Mono (prompts,
numbers, technical readouts). Prompts are always monospace — they are code.

## The plates

No render is produced — there is no image model behind this — so a plate must be
*obviously* a grade preview rather than a picture pretending to be a render.
Flat colour fields read as unfinished; these must read as deliberate.

Each plate is generated from the shot's own settings, so two different
compositions cannot look the same:

- **Palette** sets the colour script — teal/orange, bleach bypass and neon noir
  each produce visibly different plates.
- **Light** sets where the key falls and how hard the falloff is: golden hour
  rakes from one edge, hard flash blows a hot centre, silhouette crushes to rim.
- **Film setup** sets the texture: 35mm gets grain, Super 8 gets heavier grain
  and gate weave, IMAX is clean, VHS gets scanlines and chroma bleed.
- **Aspect** sets the frame, and the seed decorrelates everything else so two
  shots with identical settings still differ.

They carry a printed label saying what they are. An honest, art-directed
placeholder beats a dishonest fake.

## Motion

- **Entrance:** staggered, 40ms apart, 8px rise, `cubic-bezier(.2,.7,.2,1)`.
  Runs once per element via IntersectionObserver, never on every scroll.
- **Preset applied:** the fragment animates into the composed prompt and the
  cost counter tweens to its new value rather than snapping.
- **Render lifecycle:** queued → rendering → ready is a visible state machine
  with a sweep, not a spinner.
- **Hover:** springy, 150ms, scale ≤ 1.03. Buttons depress 1px.
- **Route changes:** View Transitions where supported.
- Everything respects `prefers-reduced-motion` — all of the above collapses to
  instant.

## Layout ideas specific to this product

- **The composer** is a single focused column, like a shot list entry, not a
  sidebar of form fields. The composed prompt sits directly beneath the input,
  updating live, so cause and effect are adjacent.
- **The contact sheet** is how generations are shown: numbered frames, printed
  metadata, a thin rule between rows.
- **The lookbook** is the public feed: large plates, prompt set as a caption in
  serif, credited to its author.

## Explicitly rejected

Dark-by-default, neon accents, glassmorphism, gradient blobs, marquee logo
strips, "AI-native" as a headline, and any layout that is recognisably the
original site's.
