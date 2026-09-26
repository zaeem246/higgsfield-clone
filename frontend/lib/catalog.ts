/**
 * Pure helpers over the catalogue. The catalogue *data* now comes from
 * GET /api/catalog; what lives here is the shape of it and the arithmetic the
 * UI does to preview a shot before Django rules on it.
 */

import type {
  Catalog,
  Kind,
  Model,
  Preset,
  PresetFamily,
  ResolutionOption,
} from "./types";

/** Which family occupies which slot on the composer, and what to call it. */
export const FAMILY_META: Record<PresetFamily, { label: string; blurb: string }> = {
  film: { label: "Film stock", blurb: "What it looks like it was shot on." },
  palette: { label: "Colour", blurb: "The colours the picture is graded to." },
  light: { label: "Lighting", blurb: "Where the light comes from." },
  effect: { label: "Effect", blurb: "What happens in the frame." },
  camera: { label: "Camera move", blurb: "How the camera moves. Video only." },
};

/**
 * CONTRACT.md fixes the composition order: subject, film, palette, light,
 * effect, camera — camera last so the motion instruction sits next to the
 * action. The composer shows the families in this order too, so what you read
 * on screen is the order the model reads.
 */
export const COMPOSE_ORDER: readonly PresetFamily[] = [
  "film",
  "palette",
  "light",
  "effect",
  "camera",
];

export type PresetSelection = Record<PresetFamily, string | null>;

export const EMPTY_SELECTION: PresetSelection = {
  camera: null,
  effect: null,
  film: null,
  palette: null,
  light: null,
};

export function presetIndex(presets: Preset[]): Map<string, Preset> {
  return new Map(presets.map((preset) => [preset.id, preset]));
}

export function presetsOf(catalog: Catalog, family: PresetFamily): Preset[] {
  return catalog.presets.filter((preset) => preset.family === family);
}

/** Presets grouped by their `group` label, insertion-ordered as served. */
export function byGroup(presets: Preset[]): [string, Preset[]][] {
  const groups = new Map<string, Preset[]>();
  for (const preset of presets) {
    const bucket = groups.get(preset.group);
    if (bucket) bucket.push(preset);
    else groups.set(preset.group, [preset]);
  }
  return [...groups];
}

export interface PromptSegment {
  /** Stable across renders so a newly added fragment can animate in alone. */
  key: string;
  text: string;
}

/**
 * The composed prompt, as segments so the UI can animate one fragment landing
 * without re-animating the rest. A camera move on an image is dropped: it
 * means nothing without motion, and Django drops it too.
 */
export function composeSegments(
  subject: string,
  selection: PresetSelection,
  index: Map<string, Preset>,
  kind: Kind,
): PromptSegment[] {
  const segments: PromptSegment[] = [];
  const trimmed = subject.trim();
  if (trimmed) segments.push({ key: "subject", text: trimmed });

  for (const family of COMPOSE_ORDER) {
    if (family === "camera" && kind === "image") continue;
    const id = selection[family];
    const fragment = id ? index.get(id)?.fragment : undefined;
    if (fragment) segments.push({ key: id as string, text: fragment });
  }
  return segments;
}

export function joinSegments(segments: PromptSegment[]): string {
  return segments.map((segment) => segment.text).join(", ");
}

/**
 * Optimistic cost preview, following CONTRACT.md's formula. Video multiplies
 * by duration/5 and by 1.15 with sound; the batch multiplies the rounded
 * single-shot cost. Django is authoritative — this only sets expectations.
 */
export function estimateCost(input: {
  model: Model | undefined;
  resolution: ResolutionOption | undefined;
  duration: number;
  sound: boolean;
  batch: number;
}): number {
  const { model, resolution, duration, sound, batch } = input;
  if (!model) return 0;
  const isVideo = model.kind === "video";
  const single =
    model.cost *
    (resolution?.multiplier ?? 1) *
    (isVideo ? duration / 5 : 1) *
    (isVideo && sound ? 1.15 : 1);
  return Math.round(single) * batch;
}

/** `"16:9"` → `[16, 9]`, falling back to square for anything unparseable. */
export function aspectRatio(aspect: string): [number, number] {
  const [w, h] = aspect.split(":").map(Number);
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? [w, h] : [1, 1];
}
