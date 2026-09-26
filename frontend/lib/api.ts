/**
 * The typed gateway client.
 *
 * Two transports share one set of endpoint definitions. In the browser the
 * base is the same-origin `/api` proxy (app/api/[...path]/route.ts), so no
 * cross-origin credentialed request is ever made and GATEWAY_URL never reaches
 * the client bundle. On the server the transport talks to the gateway directly
 * and forwards the incoming cookie header (see lib/api.server.ts).
 *
 * Every call resolves to an ApiResult rather than throwing, because the
 * gateway may simply not be running and the UI has to say so honestly instead
 * of collapsing.
 */

import type {
  Account,
  ApiError,
  ApiResult,
  Aspect,
  AspectOption,
  Catalog,
  CreateGenerationInput,
  Duration,
  DurationOption,
  Generation,
  Kind,
  LikeResult,
  Model,
  Page,
  Plan,
  PlanId,
  Preset,
  PresetFamily,
  Resolution,
  ResolutionOption,
} from "./types";
import { UNREACHABLE } from "./types";

export type Transport = <T>(path: string, init?: RequestInit) => Promise<ApiResult<T>>;

/* -------------------------------------------------------------------------- */
/* Response handling                                                          */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function fail(code: string, message: string, status: number): { ok: false; error: ApiError } {
  return { ok: false, error: { code, message, status } };
}

/** Turns a fetch Response into an ApiResult, tolerating a non-JSON body. */
export async function toResult<T>(res: Response): Promise<ApiResult<T>> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const wrapped = isRecord(body) && isRecord(body.error) ? body.error : null;
    const code = wrapped && typeof wrapped.code === "string" ? wrapped.code : `http_${res.status}`;
    const message =
      wrapped && typeof wrapped.message === "string"
        ? wrapped.message
        : `The gateway returned ${res.status}.`;
    return fail(code, message, res.status);
  }

  return { ok: true, data: body as T };
}

export function unreachable(): { ok: false; error: ApiError } {
  return fail(
    UNREACHABLE,
    "The Kinograde API is not responding. Nothing shown here is live.",
    0,
  );
}

/* -------------------------------------------------------------------------- */
/* Catalogue normalisation                                                    */
/* -------------------------------------------------------------------------- */

const ASPECTS: readonly Aspect[] = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"];
const RESOLUTIONS: readonly Resolution[] = ["720p", "1080p", "4k"];
const DURATIONS: readonly Duration[] = [3, 5, 8, 10];
const PLAN_IDS: readonly PlanId[] = ["free", "studio", "production"];
const FAMILIES: readonly PresetFamily[] = ["camera", "effect", "film", "palette", "light"];

/**
 * Only used for the optimistic cost preview. CONTRACT.md's cost formula has a
 * resolution term but does not publish its values, so if the catalogue does
 * not carry a multiplier we fall back to these and label the number an
 * estimate. The figure that counts is the one Django returns.
 */
const FALLBACK_RESOLUTION_MULTIPLIER: Record<Resolution, number> = {
  "720p": 1,
  "1080p": 1.5,
  "4k": 2.5,
};

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function oneOf<T extends string | number>(value: unknown, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/** Accepts either a bare value (`"16:9"`) or an object (`{ id, label }`). */
function idOf(entry: unknown): unknown {
  return isRecord(entry) ? entry.id : entry;
}

function normaliseModels(raw: unknown): Model[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): Model[] => {
    if (!isRecord(entry)) return [];
    const kind = oneOf<Kind>(entry.kind, ["image", "video"]);
    const id = str(entry.id);
    if (!id || !kind) return [];
    return [
      {
        id,
        name: str(entry.name, id),
        kind,
        tagline: str(entry.tagline),
        cost: num(entry.cost),
        badge: typeof entry.badge === "string" ? entry.badge : null,
        strengths: strings(entry.strengths),
      },
    ];
  });
}

function normalisePresets(raw: unknown): Preset[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): Preset[] => {
    if (!isRecord(entry)) return [];
    const family = oneOf<PresetFamily>(entry.family, FAMILIES);
    const id = str(entry.id);
    if (!id || !family) return [];
    return [
      {
        id,
        family,
        name: str(entry.name, id),
        group: str(entry.group, "Other"),
        fragment: str(entry.fragment),
      },
    ];
  });
}

function normaliseAspects(raw: unknown): AspectOption[] {
  const list = Array.isArray(raw) ? raw : [];
  const found = list.flatMap((entry): AspectOption[] => {
    const id = oneOf<Aspect>(idOf(entry), ASPECTS);
    if (!id) return [];
    return [{ id, label: isRecord(entry) ? str(entry.label, id) : id }];
  });
  return found.length > 0 ? found : ASPECTS.map((id) => ({ id, label: id }));
}

function normaliseResolutions(raw: unknown): ResolutionOption[] {
  const list = Array.isArray(raw) ? raw : [];
  const found = list.flatMap((entry): ResolutionOption[] => {
    const id = oneOf<Resolution>(idOf(entry), RESOLUTIONS);
    if (!id) return [];
    return [
      {
        id,
        label: isRecord(entry) ? str(entry.label, id) : id,
        multiplier: isRecord(entry)
          ? num(entry.multiplier, FALLBACK_RESOLUTION_MULTIPLIER[id])
          : FALLBACK_RESOLUTION_MULTIPLIER[id],
      },
    ];
  });
  return found.length > 0
    ? found
    : RESOLUTIONS.map((id) => ({ id, label: id, multiplier: FALLBACK_RESOLUTION_MULTIPLIER[id] }));
}

function normaliseDurations(raw: unknown): DurationOption[] {
  const list = Array.isArray(raw) ? raw : [];
  const found = list.flatMap((entry): DurationOption[] => {
    const id = oneOf<Duration>(idOf(entry), DURATIONS);
    if (id === null) return [];
    return [{ id, label: isRecord(entry) ? str(entry.label, `${id}s`) : `${id}s` }];
  });
  return found.length > 0 ? found : DURATIONS.map((id) => ({ id, label: `${id}s` }));
}

function normalisePlans(raw: unknown): Plan[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): Plan[] => {
    if (!isRecord(entry)) return [];
    const id = oneOf<PlanId>(entry.id, PLAN_IDS);
    if (!id) return [];
    return [
      {
        id,
        name: str(entry.name, id),
        price: num(entry.price),
        credits: num(entry.credits),
        blurb: str(entry.blurb) || str(entry.tagline),
        features: strings(entry.features),
      },
    ];
  });
}

function normaliseCatalog(raw: unknown): Catalog {
  const source = isRecord(raw) ? raw : {};
  return {
    models: normaliseModels(source.models),
    presets: normalisePresets(source.presets),
    aspects: normaliseAspects(source.aspects),
    resolutions: normaliseResolutions(source.resolutions),
    durations: normaliseDurations(source.durations),
    plans: normalisePlans(source.plans),
  };
}

/* -------------------------------------------------------------------------- */
/* Endpoints                                                                  */
/* -------------------------------------------------------------------------- */

export interface FeedQuery {
  limit?: number;
  cursor?: string | null;
  kind?: Kind | null;
  model?: string | null;
}

function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export interface GatewayApi {
  catalog(): Promise<ApiResult<Catalog>>;
  me(): Promise<ApiResult<Account>>;
  register(input: { email: string; name: string; password: string }): Promise<ApiResult<Account>>;
  login(input: { email: string; password: string }): Promise<ApiResult<Account>>;
  logout(): Promise<ApiResult<{ ok: true }>>;
  generations(params?: { limit?: number; cursor?: string | null }): Promise<ApiResult<Page<Generation>>>;
  createGenerations(input: CreateGenerationInput): Promise<ApiResult<{ items: Generation[] }>>;
  generation(id: string): Promise<ApiResult<{ generation: Generation }>>;
  deleteGeneration(id: string): Promise<ApiResult<{ ok: true; refunded: number }>>;
  feed(params?: FeedQuery): Promise<ApiResult<Page<Generation>>>;
  setLiked(id: string, liked: boolean): Promise<ApiResult<LikeResult>>;
  setPlan(plan: PlanId): Promise<ApiResult<Account>>;
}

/** Unwraps the single-key envelopes the contract uses (`{ account }` etc.). */
function pick<T, K extends string>(result: ApiResult<Record<K, T>>, key: K): ApiResult<T> {
  return result.ok ? { ok: true, data: result.data[key] } : result;
}

export function createApi(send: Transport): GatewayApi {
  return {
    async catalog() {
      const result = await send<unknown>("/catalog");
      return result.ok ? { ok: true, data: normaliseCatalog(result.data) } : result;
    },
    async me() {
      return pick(await send<{ account: Account }>("/auth/me"), "account");
    },
    async register(input) {
      return pick(await send<{ account: Account }>("/auth/register", json(input)), "account");
    },
    async login(input) {
      return pick(await send<{ account: Account }>("/auth/login", json(input)), "account");
    },
    logout() {
      return send<{ ok: true }>("/auth/logout", { method: "POST" });
    },
    generations(params = {}) {
      return send<Page<Generation>>(`/generations${query({ ...params })}`);
    },
    createGenerations(input) {
      return send<{ items: Generation[] }>("/generations", json(input));
    },
    generation(id) {
      return send<{ generation: Generation }>(`/generations/${encodeURIComponent(id)}`);
    },
    deleteGeneration(id) {
      return send<{ ok: true; refunded: number }>(`/generations/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
    feed(params = {}) {
      return send<Page<Generation>>(`/feed${query({ ...params })}`);
    },
    setLiked(id, liked) {
      return send<LikeResult>(`/feed/${encodeURIComponent(id)}/like`, {
        method: liked ? "POST" : "DELETE",
      });
    },
    async setPlan(plan) {
      return pick(await send<{ account: Account }>("/account/plan", json({ plan })), "account");
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Browser transport                                                          */
/* -------------------------------------------------------------------------- */

const browserTransport: Transport = async <T,>(path: string, init?: RequestInit) => {
  try {
    // Same-origin: the session cookie rides along by default and the gateway
    // URL stays on the server.
    const res = await fetch(`/api${path}`, { ...init, cache: "no-store" });
    return await toResult<T>(res);
  } catch {
    return unreachable();
  }
};

/** The client used from Client Components. */
export const api: GatewayApi = createApi(browserTransport);
