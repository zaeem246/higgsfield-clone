/**
 * The wire shapes from docs/CONTRACT.md, camelCase, exactly as the gateway
 * serves them. Nothing here is invented by the frontend; if this file and the
 * contract disagree, the contract is right.
 */

export type PlanId = "free" | "studio" | "production";
export type Kind = "image" | "video";
export type PresetFamily = "camera" | "effect" | "film" | "palette" | "light";
export type Aspect = "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9";
export type Resolution = "720p" | "1080p" | "4k";
export type Duration = 3 | 5 | 8 | 10;
export type GenerationStatus = "queued" | "rendering" | "ready" | "failed";

export interface Account {
  id: string;
  email: string;
  name: string;
  plan: PlanId;
  credits: number;
  createdAt: string;
}

export interface Model {
  id: string;
  name: string;
  kind: Kind;
  tagline: string;
  cost: number;
  badge: string | null;
  strengths: string[];
}

export interface Preset {
  id: string;
  family: PresetFamily;
  name: string;
  group: string;
  fragment: string;
}

export interface Generation {
  id: string;
  prompt: string;
  composedPrompt: string;
  kind: Kind;
  modelId: string;
  modelName: string;
  cameraId: string | null;
  effectId: string | null;
  filmId: string | null;
  paletteId: string | null;
  lightId: string | null;
  aspect: string;
  resolution: string;
  duration: number;
  sound: boolean;
  status: GenerationStatus;
  seed: string;
  mediaUrl: string | null;
  creditsSpent: number;
  createdAt: string;
  /** Feed items only; null on the signed-in user's own shots. */
  author: { id: string; name: string } | null;
  likes: number;
  likedByMe: boolean;
}

/**
 * The catalogue's option lists. CONTRACT.md fixes the *values* of aspect,
 * resolution and duration but not the shape of the arrays that carry them, so
 * these are normalised on arrival (see lib/api.ts) and a bare string is
 * accepted as well as an object.
 */
export interface AspectOption {
  id: Aspect;
  label: string;
}

export interface ResolutionOption {
  id: Resolution;
  label: string;
  /** Cost multiplier for the optimistic preview only; Django is authoritative. */
  multiplier: number;
}

export interface DurationOption {
  id: Duration;
  label: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  credits: number;
  blurb: string;
  features: string[];
}

export interface Catalog {
  models: Model[];
  presets: Preset[];
  aspects: AspectOption[];
  resolutions: ResolutionOption[];
  durations: DurationOption[];
  plans: Plan[];
}

/** The body of POST /api/generations. */
export interface CreateGenerationInput {
  prompt: string;
  kind: Kind;
  modelId: string;
  cameraId: string | null;
  effectId: string | null;
  filmId: string | null;
  paletteId: string | null;
  lightId: string | null;
  aspect: Aspect;
  resolution: Resolution;
  duration: Duration;
  sound: boolean;
  batch: number;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface LikeResult {
  liked: boolean;
  likes: number;
}

/** Errors are always `{ error: { code, message } }`; status is added locally. */
export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

/** The gateway could not be reached at all, as opposed to refusing a request. */
export const UNREACHABLE = "gateway_unreachable";
