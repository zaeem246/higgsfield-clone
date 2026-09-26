/**
 * The 28 camera moves, made playable.
 *
 * The product's argument is that you *compose* a shot rather than roll dice on
 * a prompt — and a camera move is the one part of that composition a still
 * plate cannot show. So each move gets a real animation: the plate's image
 * layer is driven by a hand-cut keyframe set in globals.css that performs the
 * move, then returns to rest. Someone clicking through the catalogue should be
 * able to tell a crane from a whip pan without reading the label.
 *
 * Every animation is transform + filter only, so 20 of them on screen stay on
 * the compositor. Every one begins and ends at the identity transform, which
 * buys three things: no jump when playback starts, no pop when it ends, and a
 * seamless loop while a tile is hovered.
 *
 * This file is the *table*; `app/camera-moves.css` holds the keyframes, paired
 * by `anim`. The ids are the catalogue's own, so a move the catalogue adds and
 * this file does not know simply does not play — it never borrows another
 * move's motion and lies about what it is showing.
 */

/** A light element that rides along with the move, for the ones that need one. */
export type SheenKind = "bar" | "counter" | "rack" | "flare" | "vertigo";

export interface CameraMove {
  id: string;
  /** Printed under the plate while the move plays. */
  label: string;
  /** One line describing what the lens actually does. */
  note: string;
  /** The `@keyframes` name in globals.css. */
  anim: string;
  /** Seconds. */
  duration: number;
  /** The move's overall timing function; several keyframes override it locally. */
  ease: string;
  /** Adds a key-light element on top of the plate, animated with the move. */
  sheen?: { kind: SheenKind; anim: string };
  /** A circular lens mask — the fisheye's tell. */
  lens?: boolean;
}

const EASE_SMOOTH = "cubic-bezier(0.45, 0, 0.35, 1)";
const EASE_OUT = "cubic-bezier(0.2, 0.7, 0.2, 1)";
const EASE_SWING = "cubic-bezier(0.55, 0, 0.45, 1)";

/** Ordered as the catalogue orders them. */
const MOVES: readonly CameraMove[] = [
  {
    id: "dolly-in",
    label: "Dolly In",
    note: "The camera body travels forward. Steady, unhurried, real perspective.",
    anim: "cam-dolly-in",
    duration: 2.8,
    ease: EASE_SMOOTH,
  },
  {
    id: "dolly-out",
    label: "Dolly Out",
    note: "Takes position close, then withdraws at a constant walking pace.",
    anim: "cam-dolly-out",
    duration: 3,
    ease: EASE_SMOOTH,
  },
  {
    id: "super-dolly-in",
    label: "Super Dolly In",
    note: "The same push, accelerating, far further, with speed on the edges.",
    anim: "cam-super-dolly-in",
    duration: 2.3,
    ease: "cubic-bezier(0.6, 0, 0.75, 0.45)",
  },
  {
    id: "crash-zoom-in",
    label: "Crash Zoom In",
    note: "A lens, not a dolly: a violent hit into frame that overshoots and settles.",
    anim: "cam-crash-zoom-in",
    duration: 1.6,
    ease: EASE_OUT,
  },
  {
    id: "crash-zoom-out",
    label: "Crash Zoom Out",
    note: "Snaps tight, then rips back to wide and bounces once on the stop.",
    anim: "cam-crash-zoom-out",
    duration: 1.6,
    ease: EASE_OUT,
  },
  {
    id: "dolly-zoom",
    label: "Dolly Zoom",
    note: "Vertigo. The subject holds its size while the perspective collapses around it.",
    anim: "cam-dolly-zoom",
    duration: 3.4,
    ease: EASE_SWING,
    sheen: { kind: "vertigo", anim: "cam-sheen-vertigo" },
  },
  {
    id: "orbit-360",
    label: "Orbit 360",
    note: "A full circle around the subject; the key light travels all the way round with it.",
    anim: "cam-orbit-360",
    duration: 5.2,
    ease: EASE_SWING,
    sheen: { kind: "bar", anim: "cam-sheen-orbit" },
  },
  {
    id: "arc-shot",
    label: "Arc Shot",
    note: "A quarter of an orbit, rising as it goes. One direction only.",
    anim: "cam-arc-shot",
    duration: 3.4,
    ease: EASE_SWING,
    sheen: { kind: "bar", anim: "cam-sheen-arc" },
  },
  {
    id: "lazy-susan",
    label: "Lazy Susan",
    note: "A turntable: dead-constant rate, no acceleration anywhere in it.",
    anim: "cam-lazy-susan",
    duration: 6.6,
    ease: "linear",
    sheen: { kind: "bar", anim: "cam-sheen-orbit" },
  },
  {
    id: "bullet-time",
    label: "Bullet Time",
    note: "Frozen — then the rig whips around the stopped moment and freezes again.",
    anim: "cam-bullet-time",
    duration: 3.6,
    ease: EASE_SMOOTH,
    sheen: { kind: "flare", anim: "cam-sheen-bullet" },
  },
  {
    id: "crane-up",
    label: "Crane Up",
    note: "The whole camera rises on the arm; the ground drops away beneath it.",
    anim: "cam-crane-up",
    duration: 3.6,
    ease: EASE_SWING,
  },
  {
    id: "crane-down",
    label: "Crane Down",
    note: "Descends to the floor and ends looking slightly up. The rise, inverted.",
    anim: "cam-crane-down",
    duration: 3.6,
    ease: EASE_SWING,
  },
  {
    id: "fpv-drone",
    label: "FPV Drone",
    note: "Rolling, yawing and diving at once — never level for more than a beat.",
    anim: "cam-fpv-drone",
    duration: 2.9,
    ease: EASE_SWING,
  },
  {
    id: "overhead",
    label: "Overhead",
    note: "Tips to a bird's eye and glides; the ground plane keystones hard.",
    anim: "cam-overhead",
    duration: 4.4,
    ease: EASE_SWING,
  },
  {
    id: "earth-zoom-out",
    label: "Earth Zoom Out",
    note: "One enormous pull-back that starts fast and spends four seconds decelerating.",
    anim: "cam-earth-zoom-out",
    duration: 4.6,
    ease: "linear",
  },
  {
    id: "whip-pan",
    label: "Whip Pan",
    note: "Across the frame and back in a fifth of a second, everything smeared.",
    anim: "cam-whip-pan",
    duration: 1.3,
    ease: "linear",
  },
  {
    id: "tilt-down",
    label: "Tilt Down",
    note: "A pivot, not a move: the body stays put and the lens drops its eyeline.",
    anim: "cam-tilt-down",
    duration: 2.9,
    ease: EASE_SWING,
  },
  {
    id: "pan-left",
    label: "Pan Left",
    note: "A level pivot to the left at a constant rate. The frame slides right.",
    anim: "cam-pan-left",
    duration: 3.3,
    ease: "linear",
  },
  {
    id: "snap-zoom",
    label: "Snap Zoom",
    note: "Two mechanical steps in, each with a dead stop. No blur, no bounce.",
    anim: "cam-snap-zoom",
    duration: 1.8,
    ease: EASE_OUT,
  },
  {
    id: "handheld",
    label: "Handheld",
    note: "Operator breath: an irregular, never-repeating drift with no pattern to lock onto.",
    anim: "cam-handheld",
    duration: 7.4,
    ease: "linear",
  },
  {
    id: "snorricam",
    label: "Snorricam",
    note: "Rigged to the subject: the subject is nailed down and the world swings behind them.",
    anim: "cam-snorricam",
    duration: 3.8,
    ease: EASE_SWING,
    sheen: { kind: "counter", anim: "cam-sheen-counter" },
  },
  {
    id: "robo-arm",
    label: "Robo Arm",
    note: "Programmed motion control: move, stop, move, stop. Exact and repeatable.",
    anim: "cam-robo-arm",
    duration: 3.8,
    ease: EASE_SWING,
  },
  {
    id: "object-pov",
    label: "Object POV",
    note: "The camera *is* the thing: a lurching wide-angle first person with roll.",
    anim: "cam-object-pov",
    duration: 2.7,
    ease: EASE_SWING,
  },
  {
    id: "dutch-angle",
    label: "Dutch Angle",
    note: "One decisive roll onto the horizon, held there, then levelled.",
    anim: "cam-dutch-angle",
    duration: 3,
    ease: EASE_SWING,
  },
  {
    id: "focus-change",
    label: "Focus Change",
    note: "A rack: the far plane goes soft as the near one comes up sharp, then back.",
    anim: "cam-focus-change",
    duration: 3,
    ease: EASE_SWING,
    sheen: { kind: "rack", anim: "cam-sheen-rack" },
  },
  {
    id: "fisheye",
    label: "Fisheye",
    note: "An 8mm circular lens: the middle bulges, the corners fall away, the whip is extreme.",
    anim: "cam-fisheye",
    duration: 3.6,
    ease: EASE_SWING,
    lens: true,
  },
  {
    id: "hyperlapse",
    label: "Hyperlapse",
    note: "Every frame a footstep. Long forward travel, stepped rather than smooth.",
    anim: "cam-hyperlapse",
    duration: 3.1,
    ease: "steps(17, jump-end)",
  },
  {
    id: "glam",
    label: "Glam",
    note: "A slow beauty push with the key sweeping across and the highlights blooming.",
    anim: "cam-glam",
    duration: 4.6,
    ease: EASE_SWING,
    sheen: { kind: "bar", anim: "cam-sheen-glam" },
  },
];

const BY_ID: ReadonlyMap<string, CameraMove> = new Map(MOVES.map((move) => [move.id, move]));

/**
 * The move for an id, or null. A move we have no animation for simply does not
 * play: an unrecognised id must never fall back to another move's motion, or
 * the catalogue would lie about what it is showing.
 */
export function cameraMove(id: string | null | undefined): CameraMove | null {
  return id ? (BY_ID.get(id) ?? null) : null;
}
