/**
 * Deterministic plate art.
 *
 * There is no image model behind this product, so a generation has nothing of
 * its own to show until `mediaUrl` arrives. An abstract colour field does not
 * fill that gap: a caption saying "a lighthouse keeper crossing a flooded pier
 * at dusk" over an orange blur reads as a product that is broken, not as a
 * product being honest. So a plate stands a real photograph in for the render
 * — one fixed frame per seed, from picsum.photos — and then does the thing the
 * product is actually about: it *grades* it, for real, from the settings the
 * user chose.
 *
 * The grade is the same colour science as before. The palette sets the colour
 * script and times the photograph to it, the light sets where the key falls
 * and how hard it falls off, the film stock sets grain, halation, flare and
 * bleed, the effect adds its own incident and overlay, the aspect sets the
 * frame, and the seed decorrelates the rest so two identical recipes still
 * differ. Pick "Neon Noir + Hard Flash + VHS" and the same photograph is a
 * different film from "Golden + Golden Hour + 35mm".
 *
 * The photograph is one layer in the middle of that stack rather than an
 * `<img>` beneath it, which is what lets `background-blend-mode` composite the
 * grade *onto* it instead of merely over it — and which makes failure honest
 * for free: a background image that will not load is simply absent, so the
 * procedural composition underneath it shows through. No broken-image icon,
 * no empty box, and never a request the page waits on.
 *
 * Everything else below is pure arithmetic over a hash of the seed — no
 * Math.random, no Date, no measurement — so a plate is byte-identical on the
 * server and after hydration, and a wall of them reads as a colour script
 * rather than as noise.
 *
 * The output is a single element's worth of layered CSS backgrounds. That was
 * chosen over canvas (per-pixel loops, 20+ of them on screen) and over a
 * per-plate SVG filter (a full-frame feTurbulence region rasterised at device
 * resolution on every tile): gradients are composited by the GPU at any size
 * for free. Only the grain is SVG, and only as one small seamless 120px tile.
 */

import { aspectRatio } from "./catalog";
import type { Kind } from "./types";

/* ------------------------------------------------------------------ hashing */

/** FNV-1a. Small, and identical on the server and in the browser. */
function fnv1a(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A counter-based mixer rather than a stateful PRNG: each derived value draws
 * from its own numbered stream, so adding a layer later cannot shift the values
 * every earlier layer already uses. Integer ops only (Math.imul, >>>), so there
 * is no float rounding for two runtimes to disagree about.
 */
function mix(h: number, stream: number): number {
  let x = (h ^ Math.imul(stream + 1, 0x9e3779b1)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) >>> 0;
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39) >>> 0;
  return (x ^ (x >>> 15)) >>> 0;
}

function unit(h: number, stream: number): number {
  return mix(h, stream) / 0x100000000;
}

function span(h: number, stream: number, lo: number, hi: number): number {
  return lo + unit(h, stream) * (hi - lo);
}

function pick<T>(items: readonly T[], h: number, stream: number): T {
  return items[mix(h, stream) % items.length];
}

function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}

/** CSS ships as a string, so values are rounded to keep it short and stable. */
function n1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

function n2(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

/* ------------------------------------------------------------------- colour */

type Hsl = readonly [h: number, s: number, l: number];

interface Shift {
  h?: number;
  s?: number;
  l?: number;
}

function tone(c: Hsl, alpha = 1, shift: Shift = {}): string {
  const h = (((c[0] + (shift.h ?? 0)) % 360) + 360) % 360;
  const s = clamp(c[1] * (shift.s ?? 1), 0, 100);
  const l = clamp(c[2] + (shift.l ?? 0), 0, 100);
  const head = `hsl(${n1(h)} ${n1(s)}% ${n1(l)}%`;
  return alpha >= 1 ? `${head})` : `${head} / ${n2(clamp(alpha, 0, 1))})`;
}

/* ------------------------------------------------------------------- tables */

/**
 * The colour script. Four tones per palette — deepest shadow, midtone field,
 * fill or bounce, and key — because that is the minimum that reads as a grade
 * rather than as a two-stop gradient. `chroma` scales the whole thing, so
 * bleach bypass and monochrome desaturate without needing their own washed-out
 * hue numbers, and `lift` sets how far off true black the floor sits.
 */
interface ColourScript {
  name: string;
  shadow: Hsl;
  base: Hsl;
  fill: Hsl;
  key: Hsl;
  chroma: number;
  lift: number;
}

const PALETTES: Record<string, ColourScript> = {
  "teal-orange": {
    name: "Teal & Orange",
    shadow: [196, 52, 7],
    base: [194, 38, 20],
    fill: [188, 62, 38],
    key: [24, 92, 62],
    chroma: 1,
    lift: 0,
  },
  "bleach-bypass": {
    name: "Bleach Bypass",
    shadow: [40, 8, 4],
    base: [44, 9, 26],
    fill: [206, 12, 46],
    key: [46, 14, 86],
    chroma: 0.42,
    lift: -2,
  },
  "neon-noir": {
    name: "Neon Noir",
    shadow: [264, 58, 5],
    base: [278, 48, 15],
    fill: [186, 95, 50],
    key: [318, 96, 60],
    chroma: 1.1,
    lift: 0,
  },
  golden: {
    name: "Golden",
    shadow: [26, 46, 6],
    base: [32, 52, 21],
    fill: [14, 76, 40],
    key: [42, 94, 66],
    chroma: 1,
    lift: 1,
  },
  monochrome: {
    name: "Monochrome",
    shadow: [40, 4, 3],
    base: [40, 4, 26],
    fill: [40, 4, 52],
    key: [44, 5, 93],
    chroma: 0.16,
    lift: -1,
  },
  pastel: {
    name: "Pastel",
    shadow: [248, 26, 22],
    base: [214, 32, 47],
    fill: [332, 46, 66],
    key: [34, 60, 83],
    chroma: 0.8,
    lift: 10,
  },
  earth: {
    name: "Earth",
    shadow: [54, 36, 4],
    base: [38, 34, 19],
    fill: [94, 30, 29],
    key: [38, 72, 60],
    chroma: 0.9,
    lift: 1,
  },
  technicolor: {
    name: "Technicolor",
    shadow: [252, 62, 7],
    base: [348, 56, 24],
    fill: [202, 92, 46],
    key: [50, 100, 64],
    chroma: 1.2,
    lift: 0,
  },
};

/**
 * The lighting rig. `x`/`y` are where the key sits in the frame, `hardness`
 * compresses its falloff (a soft box ramps for most of the frame, a bare flash
 * dies within a third of it), and `mass` is the dark foreground shape that
 * gives the plate something to sit in front of.
 */
interface LightRig {
  name: string;
  x: number;
  y: number;
  /** Radius of the key, as a percentage of the frame. */
  spreadX: number;
  spreadY: number;
  hardness: number;
  intensity: number;
  /** Ambient lift across the whole field. */
  ambient: number;
  vignette: number;
  rim: number;
  mass: number;
  /** A second, cooler source. Neon and rim setups are rarely single-source. */
  fill: number;
}

const LIGHTS: Record<string, LightRig> = {
  natural: {
    name: "Natural",
    x: 30, y: 16, spreadX: 130, spreadY: 112,
    hardness: 0.24, intensity: 0.62, ambient: 0.34,
    vignette: 0.3, rim: 0.1, mass: 0.2, fill: 0.4,
  },
  "golden-hour": {
    name: "Golden Hour",
    // Low and nearly off-frame: the sun rakes across the plate rather than
    // sitting in it, so the key is wide, shallow and pinned to one edge.
    x: 4, y: 76, spreadX: 175, spreadY: 64,
    hardness: 0.34, intensity: 0.92, ambient: 0.2,
    vignette: 0.46, rim: 0.36, mass: 0.34, fill: 0.28,
  },
  overcast: {
    name: "Overcast",
    x: 50, y: -6, spreadX: 190, spreadY: 170,
    hardness: 0.04, intensity: 0.46, ambient: 0.58,
    vignette: 0.16, rim: 0.02, mass: 0.12, fill: 0.5,
  },
  "hard-flash": {
    name: "Hard Flash",
    x: 50, y: 44, spreadX: 74, spreadY: 74,
    hardness: 0.88, intensity: 1, ambient: 0.06,
    vignette: 0.8, rim: 0.04, mass: 0.16, fill: 0.1,
  },
  neon: {
    name: "Neon",
    x: 76, y: 30, spreadX: 92, spreadY: 92,
    hardness: 0.58, intensity: 0.9, ambient: 0.16,
    vignette: 0.56, rim: 0.5, mass: 0.3, fill: 0.85,
  },
  candlelit: {
    name: "Candlelit",
    x: 40, y: 60, spreadX: 66, spreadY: 66,
    hardness: 0.56, intensity: 0.84, ambient: 0.04,
    vignette: 0.82, rim: 0.14, mass: 0.34, fill: 0.16,
  },
  rembrandt: {
    name: "Rembrandt",
    x: 32, y: 24, spreadX: 84, spreadY: 94,
    hardness: 0.7, intensity: 0.8, ambient: 0.1,
    vignette: 0.62, rim: 0.14, mass: 0.32, fill: 0.2,
  },
  "rim-light": {
    name: "Rim Light",
    x: 84, y: 40, spreadX: 56, spreadY: 124,
    hardness: 0.8, intensity: 0.82, ambient: 0.08,
    vignette: 0.64, rim: 0.95, mass: 0.42, fill: 0.3,
  },
  silhouette: {
    name: "Silhouette",
    // A bright field with the subject crushed in front of it: here the key is
    // the background, and `mass` does the actual work.
    x: 50, y: 24, spreadX: 170, spreadY: 120,
    hardness: 0.42, intensity: 1, ambient: 0.02,
    vignette: 0.72, rim: 0.85, mass: 0.95, fill: 0.12,
  },
};

/**
 * The stock. Everything here is texture: what the emulsion, the gate and the
 * glass put on top of the light, rather than the light itself.
 */
interface Stock {
  name: string;
  /** Opacity of the tiled grain texture. */
  grain: number;
  /** Tile size in px — Super 8 grain is physically larger on a smaller frame. */
  grainSize: number;
  scanlines: number;
  /** Highlights blooming back into the surrounding image. */
  halation: number;
  /** Anamorphic horizontal streak through the key. */
  flare: number;
  /** Colour fringing at the frame edges. */
  bleed: number;
  /** Atmospheric fog: lifts blacks, lowers contrast. */
  fog: number;
  vignette: number;
  /** A warm yellow age cast. */
  age: number;
}

const STOCKS: Record<string, Stock> = {
  "35mm": {
    name: "35mm", grain: 0.5, grainSize: 130, scanlines: 0,
    halation: 0.38, flare: 0, bleed: 0, fog: 0.05, vignette: 0.08, age: 0,
  },
  anamorphic: {
    name: "Anamorphic", grain: 0.32, grainSize: 150, scanlines: 0,
    halation: 0.52, flare: 1, bleed: 0, fog: 0.04, vignette: 0.16, age: 0,
  },
  "super-8": {
    name: "Super 8", grain: 0.95, grainSize: 74, scanlines: 0.1,
    halation: 0.3, flare: 0, bleed: 0.2, fog: 0.2, vignette: 0.3, age: 0.35,
  },
  imax: {
    name: "IMAX", grain: 0.1, grainSize: 200, scanlines: 0,
    halation: 0.22, flare: 0.15, bleed: 0, fog: 0, vignette: -0.06, age: 0,
  },
  vhs: {
    name: "VHS", grain: 0.55, grainSize: 96, scanlines: 0.62,
    halation: 0.16, flare: 0, bleed: 1, fog: 0.14, vignette: 0.14, age: 0.1,
  },
  documentary: {
    name: "Documentary", grain: 0.36, grainSize: 120, scanlines: 0,
    halation: 0.14, flare: 0, bleed: 0, fog: 0.07, vignette: 0.06, age: 0,
  },
  "studio-clean": {
    name: "Studio Clean", grain: 0.14, grainSize: 160, scanlines: 0,
    halation: 0.26, flare: 0, bleed: 0, fog: 0, vignette: -0.12, age: 0,
  },
  archival: {
    name: "Archival", grain: 0.8, grainSize: 108, scanlines: 0.14,
    halation: 0.2, flare: 0, bleed: 0.3, fog: 0.34, vignette: 0.26, age: 0.75,
  },
};

/**
 * What happens in frame. Most effects only tint and reposition an extra
 * incident glow, but the handful with an unmistakable graphic signature get a
 * real overlay — a halftone screen, a lidar grid, a spark field.
 */
type Overlay = "none" | "halftone" | "grid" | "sparks" | "shatter";

interface EffectMark {
  name: string;
  overlay: Overlay;
  /** Hue rotation applied to the incident glow only, never to the palette. */
  hue: number;
  glow: number;
}

const EFFECTS: Record<string, EffectMark> = {
  comic: { name: "Comic", overlay: "halftone", hue: 0, glow: 0.2 },
  "lidar-transition": { name: "Lidar", overlay: "grid", hue: 150, glow: 0.5 },
  particles: { name: "Particles", overlay: "sparks", hue: 20, glow: 0.6 },
  vanish: { name: "Vanish", overlay: "sparks", hue: 190, glow: 0.45 },
  "burning-man": { name: "Burning Man", overlay: "sparks", hue: 8, glow: 0.9 },
  "smash-and-grab": { name: "Smash", overlay: "shatter", hue: 200, glow: 0.4 },
  "architecture-wave": { name: "Arch Wave", overlay: "grid", hue: 210, glow: 0.3 },
  lsd: { name: "LSD", overlay: "none", hue: 280, glow: 0.85 },
  "blue-depth": { name: "Blue Depth", overlay: "none", hue: 215, glow: 0.7 },
  superstar: { name: "Superstar", overlay: "sparks", hue: 48, glow: 0.7 },
  "frozen-in-motion": { name: "Frozen", overlay: "grid", hue: 195, glow: 0.35 },
};

/**
 * Camera moves, as `[travel angle, energy]`. A move is motion, and motion is
 * the one thing a still plate cannot show — so it becomes a smear of light
 * along the direction of travel, and only on video, where a move means
 * anything at all. Anything not listed falls back to the id's own hash, which
 * keeps unknown or future moves distinct instead of collapsing them to zero.
 */
const CAMERAS: Record<string, readonly [angle: number, energy: number, radial: 0 | 1]> = {
  "dolly-in": [90, 0.35, 1], "dolly-out": [270, 0.35, 1], "super-dolly-in": [90, 0.75, 1],
  "crash-zoom-in": [90, 0.9, 1], "crash-zoom-out": [270, 0.9, 1], "dolly-zoom": [90, 0.6, 1],
  "orbit-360": [0, 0.55, 0], "arc-shot": [10, 0.45, 0], "lazy-susan": [0, 0.3, 0],
  "bullet-time": [0, 0.8, 0], "crane-up": [90, 0.5, 0], "crane-down": [270, 0.5, 0],
  "fpv-drone": [35, 0.95, 1], overhead: [90, 0.25, 0], "earth-zoom-out": [270, 0.7, 1],
  "whip-pan": [0, 1, 0], "tilt-down": [270, 0.35, 0], "pan-left": [180, 0.45, 0],
  "snap-zoom": [90, 0.8, 1], handheld: [8, 0.3, 0], snorricam: [0, 0.6, 0],
  "robo-arm": [25, 0.5, 0], "object-pov": [90, 0.4, 1], "dutch-angle": [24, 0.35, 0],
  "focus-change": [90, 0.2, 1], fisheye: [0, 0.3, 1], hyperlapse: [70, 0.85, 1],
  glam: [12, 0.25, 0],
};

/** `dolly-in` → `Dolly In`, so the slate can print a move without a name table. */
function titleCase(id: string): string {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const PALETTE_IDS = Object.keys(PALETTES);
const LIGHT_IDS = Object.keys(LIGHTS);
const STOCK_IDS = Object.keys(STOCKS);

/* --------------------------------------------------------------- the grain */

/**
 * One small seamless noise tile, not a full-frame filter. `stitchTiles` lets
 * the 120px square repeat without a visible seam, so the browser rasterises
 * feTurbulence once at 120x120 and then repeats the bitmap — the same cost
 * whether the plate is 120px or 1440px wide, and the same cost for the
 * twentieth plate on a page as for the first.
 */
function grainTile(strength: number, seed: number): string {
  // Double quotes inside the SVG, single quotes around the url(): encodeURIComponent
  // escapes `"` but not `'`, so this is the one pairing that survives both a CSS
  // parser and being serialised into a double-quoted HTML style attribute.
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
    '<filter id="g" x="0" y="0" width="100%" height="100%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3"' +
    ` stitchTiles="stitch" seed="${seed}"/>` +
    '<feColorMatrix type="saturate" values="0"/>' +
    "</filter>" +
    `<rect width="120" height="120" filter="url(#g)" opacity="${n2(strength)}"/>` +
    "</svg>";
  return `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;
}

/* ------------------------------------------------------------ the frame */

/**
 * The reference photograph.
 *
 * picsum.photos resolves a seed to one fixed image and crops it to the
 * requested box, so a shot keeps its picture across reloads, across aspects
 * and — the part that matters — between the server render and hydration. The
 * seed is hashed rather than passed through: callers hand this anything from a
 * short id to a whole composed sentence, and only a hash is guaranteed to be a
 * legal path segment.
 *
 * The box is capped at 960 on the long edge: large enough for a full-bleed
 * plate on a laptop, small enough that a twelve-up sheet is not a megabyte a
 * tile.
 */
function photoLayer(seed: string, aw: number, ah: number): Layer {
  const long = 960;
  const landscape = aw >= ah;
  const w = landscape ? long : Math.max(240, Math.round((long * aw) / ah));
  const h = landscape ? Math.max(240, Math.round((long * ah) / aw)) : long;
  const tag = fnv1a(`frame:${seed}`).toString(36);
  return {
    image: `url('https://picsum.photos/seed/kg${tag}/${w}/${h}')`,
    size: "cover",
    position: "50% 50%",
  };
}

/* -------------------------------------------------------------- the layers */

/**
 * One CSS background layer. Kept as a record so the four parallel
 * comma-separated `background-*` lists can never drift out of step.
 */
interface Layer {
  image: string;
  size?: string;
  position?: string;
  blend?: string;
}

export interface PlateInput {
  seed: string;
  paletteId?: string | null;
  lightId?: string | null;
  filmId?: string | null;
  cameraId?: string | null;
  effectId?: string | null;
  kind?: Kind;
  aspect?: string;
}

export interface PlateStyle {
  backgroundColor: string;
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundBlendMode: string;
  aspectRatio: string;
}

export interface Plate {
  /** Ready for `style={{ ... }}` on a single element. */
  style: PlateStyle;
  /** The colour-timing strip printed on the slate. */
  chips: string[];
  /** e.g. `Teal & Orange · Golden Hour · 35mm`. */
  recipe: string;
}

/**
 * The whole plate, from settings plus seed.
 *
 * Preset ids are optional because the contact sheet and the lookbook render a
 * `Generation` without threading its preset columns through; when one is
 * missing it is *chosen* from the seed rather than defaulted, so an
 * unspecified shot still gets a real, distinct and stable grade instead of
 * every plate collapsing onto one look.
 */
export interface PlateBreath {
  /** Period of the resting drift, as a CSS time. */
  duration: string;
  /** A negative delay, so the plate starts part-way through its own cycle. */
  delay: string;
}

/**
 * The resting breath: how long this plate's ambient drift takes, and how far
 * into it the plate already is.
 *
 * Both come from the same seed hash the grade does, on their own streams, so
 * they are stable across server and client and stable across reloads — and,
 * more to the point, *decorrelated between plates*. Twenty plates pulsing in
 * unison would read as a page-wide effect; twenty plates each at their own
 * phase and period read as a room with air in it.
 */
export function plateBreath(seed: string): PlateBreath {
  const h = fnv1a(seed);
  const duration = span(h, 40, 15, 27);
  return {
    duration: `${n1(duration)}s`,
    delay: `${n1(-unit(h, 41) * duration)}s`,
  };
}

export function plate(input: PlateInput): Plate {
  const h = fnv1a(input.seed);

  const script =
    (input.paletteId ? PALETTES[input.paletteId] : undefined) ??
    PALETTES[pick(PALETTE_IDS, h, 1)];
  const rig =
    (input.lightId ? LIGHTS[input.lightId] : undefined) ?? LIGHTS[pick(LIGHT_IDS, h, 2)];
  const stock =
    (input.filmId ? STOCKS[input.filmId] : undefined) ?? STOCKS[pick(STOCK_IDS, h, 3)];
  const mark: EffectMark | undefined = input.effectId ? EFFECTS[input.effectId] : undefined;

  const [aw, ah] = aspectRatio(input.aspect ?? "16:9");
  const wide = aw / ah;

  // Saturation and floor come from the palette and the stock's fog; every
  // colour below is written through these so a grade stays internally
  // consistent instead of each layer inventing its own contrast.
  const c = script.chroma;
  const lift = clamp(script.lift + stock.fog * 9 + rig.ambient * 5, -4, 11);
  const sat = (k: number): Shift => ({ s: c * k, l: lift });

  /* --- framing ---------------------------------------------------------- */

  // A wide frame has lateral room, so the key drifts further off-centre; a tall
  // one has vertical room instead. Without this, every aspect lights
  // identically and only the crop changes.
  const lateral = clamp((wide - 1) * 7, -9, 9);
  const kx = clamp(rig.x + (rig.x < 50 ? -lateral : lateral) + span(h, 10, -11, 11), -12, 112);
  const ky = clamp(rig.y + (wide < 1 ? span(h, 11, -10, 10) : span(h, 11, -6, 6)), -12, 112);

  // Hard light dies fast. `edge` is where the key reaches zero and `core` where
  // it is still at full strength, so a bare flash keeps a hot core and a short
  // ramp while a soft box has no core at all and ramps most of the frame.
  const edge = 82 - rig.hardness * 48;
  const core = rig.hardness * rig.hardness * 26;
  const mid = core + (edge - core) * 0.42;

  // Held well back from where a bare gradient would want it: the photograph
  // underneath already carries its own light, so the rig's job is to push that
  // light around rather than to paint a fresh disc of it over the top. Much
  // above this and a hard flash reads as a blob rather than as a flash.
  const keyAlpha = clamp(rig.intensity * (0.82 - stock.fog * 0.25) * 0.52, 0, 1);
  const spreadX = rig.spreadX * span(h, 12, 0.9, 1.12);
  const spreadY = rig.spreadY * span(h, 13, 0.9, 1.12);

  const layers: Layer[] = [];
  // The procedural composition — the receding planes that make a lit gradient
  // read as a landscape. It sits *below* the photograph, so it is what the
  // plate falls back to when picsum cannot be reached, and is hidden entirely
  // the moment the photograph lands.
  const backdrop: Layer[] = [];

  /* --- texture, topmost ------------------------------------------------- */

  if (stock.grain > 0.01) {
    layers.push({
      // `overlay` rather than `soft-light`: soft-light against a mid-grey noise
      // barely moves the image at all, and the difference between 35mm, Super 8
      // and IMAX has to be visible at a 340px contact-sheet frame.
      image: grainTile(clamp(stock.grain * 0.72, 0, 1), mix(h, 20) % 1000),
      size: `${stock.grainSize}px ${stock.grainSize}px`,
      blend: "overlay",
    });
  }

  if (stock.scanlines > 0.01) {
    const gap = 3 + Math.round(span(h, 21, 0, 1.4));
    layers.push({
      image:
        `repeating-linear-gradient(0deg, hsl(0 0% 0% / ${n2(stock.scanlines * 0.42)}) 0 1px,` +
        ` transparent 1px ${gap}px)`,
      blend: "multiply",
    });
  }

  /* --- glass ------------------------------------------------------------ */

  if (stock.flare > 0.01) {
    const a = stock.flare;
    // An anamorphic flare is one very wide, very short ellipse through the key
    // plus a brighter core inside it. The blue is the lens coating, not the
    // grade, so it is a fixed hue rather than a palette colour.
    layers.push(
      {
        image:
          `radial-gradient(${n1(46 * a)}% ${n1(0.9 * a)}% at ${n1(kx)}% ${n1(ky)}%,` +
          ` hsl(206 100% 92% / ${n2(0.85 * a)}) 0%, hsl(208 100% 78% / ${n2(0.4 * a)}) 40%,` +
          " transparent 72%)",
        blend: "screen",
      },
      {
        image:
          `radial-gradient(${n1(74 * a)}% ${n1(3.4 * a)}% at ${n1(kx)}% ${n1(ky)}%,` +
          ` hsl(210 92% 62% / ${n2(0.42 * a)}) 0%, hsl(214 88% 50% / ${n2(0.16 * a)}) 45%,` +
          " transparent 78%)",
        blend: "screen",
      },
    );
  }

  // Lens vignette sits above the light so it darkens the flare and the key too,
  // the way an optical falloff actually does.
  const vig = clamp(rig.vignette + stock.vignette, 0, 0.95);
  if (vig > 0.01) {
    layers.push({
      image:
        `radial-gradient(${n1(122 - vig * 22)}% ${n1(118 - vig * 20)}% at 50% ${n1(46 + vig * 6)}%,` +
        ` transparent ${n1(30 - vig * 14)}%, hsl(0 0% 0% / ${n2(vig * 0.72)}) 100%)`,
      blend: "multiply",
    });
  }

  // The effect's graphic overlay belongs to the scene, not to the print, so it
  // goes *below* the vignette and is darkened at the frame edges with
  // everything else. Above it, a grid or a halftone tiles the plate corner to
  // corner and reads as wallpaper laid over the image.
  if (mark && mark.overlay !== "none") {
    layers.push(...overlayLayers(mark.overlay, h, script, c));
  }

  if (stock.bleed > 0.01) {
    const b = stock.bleed;
    layers.push(
      {
        image: `linear-gradient(90deg, hsl(342 95% 58% / ${n2(0.2 * b)}) 0%, transparent 26%)`,
        blend: "screen",
      },
      {
        image: `linear-gradient(270deg, hsl(184 95% 58% / ${n2(0.2 * b)}) 0%, transparent 26%)`,
        blend: "screen",
      },
    );
  }

  /* --- motion ----------------------------------------------------------- */

  const move = motion(input, h);
  if (move) {
    const smear = tone(script.key, move.energy * 0.055, { s: c * 0.4, l: lift + 22 });
    const gap = 16 + Math.round(span(h, 25, 0, 18));
    layers.push(
      move.radial
        ? {
            // A move into or out of frame smears into rays from the centre of
            // travel, which is what a conic repeat draws for free.
            image:
              `repeating-conic-gradient(from ${n1(move.angle)}deg at ${n1(kx)}% ${n1(ky)}%,` +
              ` transparent 0deg 2.4deg, ${smear} 2.4deg 3.2deg)`,
            blend: "screen",
          }
        : {
            // A lateral move streaks *parallel* to travel, and a linear
            // gradient's bands run perpendicular to its angle — hence the +90.
            image:
              `repeating-linear-gradient(${n1(move.angle + 90)}deg,` +
              ` transparent 0, ${smear} ${Math.round(gap / 2)}px, transparent ${gap}px)`,
            blend: "screen",
          },
    );
  }

  /* --- light ------------------------------------------------------------ */

  if (stock.halation > 0.01) {
    // Highlights bleeding back into the emulsion: same position as the key,
    // much wider, much weaker, pulled warm.
    layers.push({
      image:
        `radial-gradient(${n1(spreadX * 1.5)}% ${n1(spreadY * 1.5)}% at ${n1(kx)}% ${n1(ky)}%,` +
        ` ${tone(script.key, stock.halation * 0.5, { s: c * 0.8, l: lift + 6 })} 0%,` +
        " transparent 82%)",
      blend: "screen",
    });
  }

  if (rig.rim > 0.02) {
    // The rim hugs the frame edge nearest the key rather than a subject — there
    // is no subject, so the edge is what separates figure from ground.
    const angle = kx > 50 ? 270 : 90;
    layers.push({
      image:
        `linear-gradient(${angle}deg, ${tone(script.key, rig.rim * 0.66, sat(0.7))} 0%,` +
        ` ${tone(script.fill, rig.rim * 0.22, sat(0.9))} ${n1(4 + rig.rim * 5)}%,` +
        ` transparent ${n1(12 + (1 - rig.hardness) * 20)}%)`,
      blend: "screen",
    });
  }

  /* --- depth ------------------------------------------------------------ */

  // Three receding planes rising from the bottom of the frame. They are what
  // turns a lit gradient into a composition: without them every plate is a
  // soft blob, which is exactly the "nothing generated" read we are fixing.
  // They sit *above* the key and multiply, so they occlude the light the way a
  // foreground does, and their opacity climbs toward the viewer — distance
  // reads as lost contrast, which is what aerial perspective actually is.
  for (let i = 0; i < 3; i++) {
    const near = i / 2;
    const alpha = clamp((0.2 + near * 0.48) * (0.62 + rig.mass * 0.66), 0, 0.94);
    const shade = tone(script.shadow, alpha, { s: c, l: script.lift + (1 - near) * 5 });
    const anchor = 101 + span(h, 92 + i, 0, 6);

    // Every third plane, by seed, is a flat mesa rather than a ridge. Three
    // domes in a row read as concentric circles; a hard horizontal edge among
    // them reads as architecture, and keeps the set from having one shape.
    if (mix(h, 96 + i) % 3 === 0) {
      const top = (span(h, 100 + i, 6, 16) + near * 8 + rig.mass * 7) / clamp(wide, 0.7, 1.2);
      backdrop.push({
        image:
          `linear-gradient(${n1(180 + span(h, 104 + i, -3.5, 3.5))}deg,` +
          ` transparent 0 ${n1(100 - top)}%, ${shade} ${n1(101 - top)}%)`,
        blend: "multiply",
      });
      continue;
    }

    const px = span(h, 88 + i, 4, 96);
    // An ellipse is vertical at its own left and right extremes, so a ridge
    // whose flanks land inside the frame draws two hard walls and the whole
    // thing reads as a rectangle. Widening it until both flanks are off-frame
    // leaves only the arc, which is the part that reads as a horizon.
    const rx = Math.max(span(h, 80 + i, 46, 104) + near * 12, px + 8, 108 - px);
    // The radii are percentages of *different* axes, so a shape defined in
    // percent alone turns into a tall lozenge on 9:16 and a flat smear on 21:9.
    // Multiplying by the frame's own ratio keeps the ridge the same shape in
    // pixels whatever the aspect, which is what "the aspect sets the frame"
    // has to mean if the composition is to survive the crop.
    // The floor on `wide` stops a portrait frame from putting the horizon in
    // the bottom tenth and leaving nine tenths of empty sky.
    const ry = clamp(rx * span(h, 84 + i, 0.18, 0.34) * Math.max(wide, 0.95), 10, 56);

    // A 1.5% ramp rather than a hard stop: enough to antialias the edge at any
    // size without softening it back into a blob.
    const shape = `${n1(rx)}% ${n1(ry)}% at ${n1(px)}% ${n1(anchor)}%`;
    backdrop.push({
      image: `radial-gradient(${shape}, ${shade} 0 98.5%, transparent 100%)`,
      blend: "multiply",
    });

    // The nearest ridge catches the key along its edge. The same geometry with
    // one extra stop, so the highlight cannot drift off the shape it belongs to.
    if (i === 2 && rig.rim + rig.intensity > 0.6) {
      backdrop.push({
        image:
          `radial-gradient(${shape}, transparent 0 96.5%,` +
          ` ${tone(script.key, clamp(0.2 + rig.rim * 0.55, 0, 0.8), { s: c * 0.8, l: lift + 12 })} 98.5%,` +
          " transparent 100%)",
        blend: "screen",
      });
    }
  }

  /* --- foreground ------------------------------------------------------- */

  // Over a photograph the receding planes would read as arcs of paint, so the
  // rig's `mass` arrives instead as weight at the bottom of the frame: the
  // unlit foreground the subject is standing in front of. It multiplies above
  // the key, so it occludes the light exactly as the planes do.
  if (rig.mass > 0.05) {
    layers.push({
      image:
        `linear-gradient(to top, ${tone(script.shadow, clamp(rig.mass * 0.78, 0, 0.9), { s: c, l: script.lift })} 0%,` +
        ` ${tone(script.shadow, clamp(rig.mass * 0.3, 0, 0.6), { s: c, l: script.lift + 3 })} ${n1(14 + rig.mass * 16)}%,` +
        ` transparent ${n1(42 + rig.mass * 26)}%)`,
      blend: "multiply",
    });
  }

  const keyCore = tone(script.key, keyAlpha, { s: c * 0.92, l: lift + 4 });
  layers.push({
    image:
      `radial-gradient(${n1(spreadX)}% ${n1(spreadY)}% at ${n1(kx)}% ${n1(ky)}%,` +
      ` ${keyCore} 0%, ${keyCore} ${n1(core)}%,` +
      ` ${tone(script.key, keyAlpha * 0.5, sat(1))} ${n1(mid)}%,` +
      ` transparent ${n1(edge)}%)`,
    blend: "screen",
  });

  if (mark && mark.glow > 0.05) {
    // The incident: a second source the effect brings into frame, placed
    // opposite the key so it reads as a separate event and not a wider key.
    const gx = clamp(100 - kx + span(h, 30, -12, 12), 4, 96);
    const gy = clamp(100 - ky + span(h, 31, -12, 12), 4, 96);
    layers.push({
      image:
        `radial-gradient(${n1(span(h, 32, 44, 72))}% ${n1(span(h, 33, 40, 66))}% ` +
        `at ${n1(gx)}% ${n1(gy)}%,` +
        ` ${tone(script.fill, mark.glow * 0.62, { h: mark.hue, s: c * 1.15, l: lift + 14 })} 0%,` +
        " transparent 68%)",
      blend: "screen",
    });
  }

  if (rig.fill > 0.02) {
    layers.push({
      image:
        `radial-gradient(118% 108% at ${n1(100 - kx)}% ${n1(clamp(100 - ky, 6, 94))}%,` +
        ` ${tone(script.fill, rig.fill * 0.5, sat(0.85))} 0%, transparent 74%)`,
      blend: "screen",
    });
  }

  /* --- atmosphere -------------------------------------------------------- */

  // The haze the planes recede into: brightest at the horizon, gone by the top
  // of the frame. It sits under the planes so the far ones wash out and the
  // near ones do not.
  const hazeAlpha = clamp((0.1 + stock.fog * 0.42 + rig.ambient * 0.14) * 0.62, 0, 0.6);
  layers.push({
    image:
      `linear-gradient(to top, ${tone(script.fill, hazeAlpha * 0.4, sat(0.5))} 0%,` +
      ` ${tone(script.base, hazeAlpha, { s: c * 0.6, l: lift + 14 })} ${n1(span(h, 50, 34, 54))}%,` +
      ` transparent ${n1(span(h, 51, 70, 90))}%)`,
    blend: "screen",
  });

  if (stock.age > 0.02) {
    layers.push({
      image:
        `linear-gradient(hsl(42 62% 58% / ${n2(stock.age * 0.22)}),` +
        ` hsl(30 54% 44% / ${n2(stock.age * 0.22)}))`,
      blend: "overlay",
    });
  }

  /* --- the colour timing, straight onto the photograph ------------------ */

  // Everything above this point is light and texture laid *over* the picture.
  // These two are the timing itself, and they are what makes the same frame
  // unmistakably a different film under a different palette.
  //
  // `color` takes its hue and saturation from this gradient and its luminance
  // from whatever is underneath — which is the definition of a colour grade,
  // and the one blend mode that reaches a photograph's own colours rather than
  // just tinting it. Shadows take the palette's shadow hue, highlights take
  // its key, exactly as the printed chip strip says they will. A desaturated
  // script (monochrome, bleach bypass) carries almost no hue, so the same
  // layer drains the photograph instead of recolouring it — hence the alpha
  // rising as chroma falls.
  const gradeAngle = n1(span(h, 60, 150, 210));

  // Short of 1: a fully replaced hue is a duotone poster rather than a graded
  // frame, and the photograph's own colour is part of what makes it read as a
  // photograph at all.
  const timing = clamp(0.58 + (1 - c) * 0.34, 0.45, 0.92);

  layers.push({
    image:
      `linear-gradient(${gradeAngle}deg, ${tone(script.shadow, timing, { s: c * 1.15, l: lift })} 0%,` +
      ` ${tone(script.base, timing, { s: c * 1.1, l: lift })} 52%,` +
      ` ${tone(script.key, timing, { s: c, l: lift + 6 })} 100%)`,
    blend: "color",
  });

  // And the contrast curve the stock puts on it: the same ramp again, but
  // soft-light, so the shadow end crushes and the key end lifts without the
  // hue moving a second time.
  layers.push({
    image:
      `linear-gradient(${gradeAngle}deg, ${tone(script.shadow, clamp(0.5 + stock.fog * -0.6, 0.12, 0.6), { s: c * 0.4, l: lift })} 0%,` +
      ` transparent 46%,` +
      ` ${tone(script.key, clamp(0.28 + rig.intensity * 0.22, 0, 0.55), { s: c * 0.5, l: lift + 10 })} 100%)`,
    blend: "soft-light",
  });

  /* --- ground ----------------------------------------------------------- */

  // The only theme-aware layer. `--paper` is warm near-black on the dark ground
  // and warm paper in light mode; mixed toward mid-grey (a soft-light no-op) it
  // sinks the plate a touch against ink and lifts it against paper, without
  // moving the hue of the grade.
  const veil = "color-mix(in oklab, var(--paper) 26%, #808080)";
  layers.push({
    image: `linear-gradient(${veil}, ${veil})`,
    blend: "soft-light",
  });

  // The photograph. There is no image model behind this product, so the plate
  // stands a real frame in for the render and grades it for real — a caption
  // and an orange blur have nothing to do with each other, a caption and a
  // photograph at least share a world. The seed picks it, so it is the same
  // picture on the server and after hydration and the same picture tomorrow.
  //
  // It is a background layer rather than an `<img>` on purpose: that is what
  // puts it *inside* the same blend stack as the grade, so every layer above
  // composites onto the photograph instead of merely sitting over it — and a
  // background that fails to load is simply absent, which uncovers the
  // procedural grade below rather than a broken-image icon.
  layers.push(photoLayer(input.seed, aw, ah));

  // Below the photograph: what the plate looks like when there is no
  // photograph. Hidden under a loaded frame, and the whole picture without one.
  layers.push(...backdrop);

  layers.push({
    image:
      `linear-gradient(${n1(span(h, 60, 150, 210))}deg,` +
      ` ${tone(script.shadow, 1, { s: c, l: lift })} 0%,` +
      ` ${tone(script.base, 1, { s: c, l: lift })} 58%,` +
      ` ${tone(script.base, 1, { s: c * 1.1, l: lift + 8 })} 100%)`,
  });

  const chips = [
    tone(script.shadow, 1, { s: c, l: lift }),
    tone(script.base, 1, { s: c, l: lift }),
    tone(script.fill, 1, { s: c, l: lift }),
    tone(script.key, 1, { s: c * 0.9, l: lift }),
    tone(script.key, 1, { s: c * 0.55, l: lift + 16 }),
  ];

  const recipe = [script.name, rig.name, stock.name, mark?.name, move?.name]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  return {
    style: {
      backgroundColor: tone(script.shadow, 1, { s: c, l: lift }),
      backgroundImage: layers.map((l) => l.image).join(", "),
      backgroundSize: layers.map((l) => l.size ?? "auto").join(", "),
      backgroundPosition: layers.map((l) => l.position ?? "0 0").join(", "),
      backgroundBlendMode: layers.map((l) => l.blend ?? "normal").join(", "),
      aspectRatio: `${aw} / ${ah}`,
    },
    chips,
    recipe,
  };
}

interface Motion {
  name: string;
  angle: number;
  energy: number;
  /** A move into or out of the frame smears radially, not along an axis. */
  radial: boolean;
}

/**
 * The camera move, or nothing. An image has no motion to smear, and a shot with
 * no move selected is a locked-off camera — in both cases the plate stays still.
 */
function motion(input: PlateInput, h: number): Motion | null {
  if (input.kind === "image" || !input.cameraId) return null;
  const known = CAMERAS[input.cameraId];
  const own = fnv1a(input.cameraId);
  return {
    name: titleCase(input.cameraId),
    // A touch of per-shot wander so two whip pans are not pixel-identical.
    angle: (known ? known[0] : span(own, 0, 0, 360)) + span(h, 26, -6, 6),
    energy: known ? known[1] : span(own, 1, 0.25, 0.8),
    radial: known ? known[2] === 1 : mix(own, 2) % 2 === 0,
  };
}

/** The graphic overlays. Each is a repeating pattern, so each carries its own size. */
function overlayLayers(overlay: Overlay, h: number, script: ColourScript, c: number): Layer[] {
  switch (overlay) {
    case "halftone": {
      const cell = 5 + Math.round(span(h, 70, 0, 2));
      return [
        {
          image: "radial-gradient(circle, hsl(0 0% 0% / 0.3) 0 24%, transparent 26%)",
          size: `${cell}px ${cell}px`,
          blend: "multiply",
        },
      ];
    }
    case "grid": {
      const cell = 30 + Math.round(span(h, 71, 0, 18));
      const line = tone(script.key, 0.04, { s: c * 0.6, l: 20 });
      return [
        {
          image: `repeating-linear-gradient(0deg, ${line} 0 1px, transparent 1px ${cell}px)`,
          blend: "screen",
        },
        {
          image: `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px ${cell}px)`,
          blend: "screen",
        },
      ];
    }
    case "sparks": {
      // Two dot fields at coprime cell sizes: they never line up, so a cheap
      // repeating gradient stops reading as a regular grid.
      const a = 31 + Math.round(span(h, 72, 0, 13));
      const b = 47 + Math.round(span(h, 73, 0, 19));
      const spark = tone(script.key, 0.55, { s: c * 0.7, l: 26 });
      return [
        {
          image: `radial-gradient(circle at 30% 30%, ${spark} 0 0.6px, transparent 1.4px)`,
          size: `${a}px ${a}px`,
          blend: "screen",
        },
        {
          image: `radial-gradient(circle at 70% 60%, ${spark} 0 0.5px, transparent 1.1px)`,
          size: `${b}px ${b}px`,
          position: `${Math.round(span(h, 74, 0, 12))}px 0`,
          blend: "screen",
        },
      ];
    }
    case "shatter": {
      // Three angled hairline families standing in for a fracture pattern.
      const line = tone(script.key, 0.2, { s: c * 0.4, l: 34 });
      return [22, 68, 116].map((deg, i) => ({
        image:
          `repeating-linear-gradient(${deg + Math.round(span(h, 75 + i, -8, 8))}deg,` +
          ` transparent 0 ${28 + i * 11}px, ${line} ${28 + i * 11}px ${29 + i * 11}px)`,
        blend: "screen",
      }));
    }
    default:
      return [];
  }
}
