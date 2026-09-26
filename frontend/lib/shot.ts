/**
 * The composer's state, and the URL it can be round-tripped through.
 *
 * "Recreate" on a lookbook plate has to reopen someone else's exact settings
 * in the composer. Encoding them in the query string keeps that a plain link:
 * shareable, back-buttonable, and needing no extra request against a
 * generation the reader may not own.
 */

import { EMPTY_SELECTION, type PresetSelection } from "./catalog";
import type {
  Aspect,
  Catalog,
  Duration,
  Generation,
  Kind,
  PresetFamily,
  Resolution,
} from "./types";

export interface ShotState {
  prompt: string;
  modelId: string;
  selection: PresetSelection;
  aspect: Aspect;
  resolution: Resolution;
  duration: Duration;
  sound: boolean;
  batch: number;
}

export const MAX_PROMPT = 2000;
export const MAX_BATCH = 4;

const ASPECTS: readonly Aspect[] = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"];
const RESOLUTIONS: readonly Resolution[] = ["720p", "1080p", "4k"];
const DURATIONS: readonly Duration[] = [3, 5, 8, 10];

/** Query keys are the family names, so the link reads as the shot list does. */
const FAMILY_KEYS: readonly PresetFamily[] = ["camera", "effect", "film", "palette", "light"];

function pickModel(catalog: Catalog, preferredId: string | null, kind: Kind | null): string {
  if (preferredId && catalog.models.some((model) => model.id === preferredId)) return preferredId;
  const byKind = kind ? catalog.models.find((model) => model.kind === kind) : undefined;
  return byKind?.id ?? catalog.models[0]?.id ?? "";
}

export function defaultShot(catalog: Catalog): ShotState {
  const resolutions = catalog.resolutions.map((option) => option.id);
  return {
    prompt: "",
    modelId: catalog.models[0]?.id ?? "",
    selection: { ...EMPTY_SELECTION },
    aspect: catalog.aspects[0]?.id ?? "16:9",
    resolution: resolutions.includes("1080p") ? "1080p" : (resolutions[0] ?? "1080p"),
    duration: 5,
    sound: false,
    batch: 1,
  };
}

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string | null {
  const value = params[key];
  if (typeof value === "string") return value;
  return Array.isArray(value) ? (value[0] ?? null) : null;
}

function member<T extends string | number>(value: unknown, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/** Builds composer state from a `/create?…` link, ignoring anything unknown. */
export function shotFromParams(params: Params, catalog: Catalog): ShotState {
  const base = defaultShot(catalog);
  const kind = member<Kind>(one(params, "kind"), ["image", "video"]);
  const modelId = pickModel(catalog, one(params, "model"), kind);
  const model = catalog.models.find((entry) => entry.id === modelId);

  const selection: PresetSelection = { ...EMPTY_SELECTION };
  for (const family of FAMILY_KEYS) {
    const id = one(params, family);
    // Only honour an id that exists and really belongs to that family.
    const preset = id ? catalog.presets.find((entry) => entry.id === id) : undefined;
    if (preset && preset.family === family) selection[family] = preset.id;
  }
  // A camera move means nothing without motion, and the backend drops it.
  if (model?.kind === "image") selection.camera = null;

  const duration = Number(one(params, "duration"));

  return {
    prompt: (one(params, "prompt") ?? "").slice(0, MAX_PROMPT),
    modelId,
    selection,
    aspect: member<Aspect>(one(params, "aspect"), ASPECTS) ?? base.aspect,
    resolution: member<Resolution>(one(params, "resolution"), RESOLUTIONS) ?? base.resolution,
    duration: member<Duration>(duration, DURATIONS) ?? base.duration,
    sound: one(params, "sound") === "1",
    batch: base.batch,
  };
}

/** The `/create` link that reopens these exact settings. */
export function shotHref(shot: ShotState, kind: Kind): string {
  const search = new URLSearchParams({
    prompt: shot.prompt,
    kind,
    model: shot.modelId,
    aspect: shot.aspect,
    resolution: shot.resolution,
  });
  for (const family of FAMILY_KEYS) {
    if (family === "camera" && kind === "image") continue;
    const id = shot.selection[family];
    if (id) search.set(family, id);
  }
  if (kind === "video") {
    search.set("duration", String(shot.duration));
    if (shot.sound) search.set("sound", "1");
  }
  return `/create?${search.toString()}`;
}

/** "Recreate": a published shot's settings, reopened in the composer. */
export function recreateHref(generation: Generation): string {
  const selection: PresetSelection = { ...EMPTY_SELECTION };
  for (const family of FAMILY_KEYS) selection[family] = generation[`${family}Id`];

  return shotHref(
    {
      prompt: generation.prompt,
      modelId: generation.modelId,
      selection,
      aspect: member<Aspect>(generation.aspect, ASPECTS) ?? "16:9",
      resolution: member<Resolution>(generation.resolution, RESOLUTIONS) ?? "1080p",
      duration: member<Duration>(generation.duration, DURATIONS) ?? 5,
      sound: generation.sound,
      batch: 1,
    },
    generation.kind,
  );
}
