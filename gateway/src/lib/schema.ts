import type { Context } from "hono";
import { z } from "zod";
import { invalidRequest } from "../middleware/error.js";

/**
 * Every request body and query string in the contract, in one file.
 * Bodies are `.strict()`: unknown keys are a client bug, and refusing them here
 * stops arbitrary fields being smuggled through to Django.
 */

export const ASPECTS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"] as const;
export const RESOLUTIONS = ["720p", "1080p", "4k"] as const;
export const DURATIONS = [3, 5, 8, 10] as const;
export const KINDS = ["image", "video"] as const;
export const PLANS = ["free", "studio", "production"] as const;

const email = z.string().trim().min(1, "email is required").email("email must be a valid address");
const password = z.string().min(8, "password must be at least 8 characters").max(128);
const presetId = z.string().trim().min(1).max(128).nullish();

export const registerBody = z
  .object({
    email,
    name: z.string().trim().min(1, "name is required").max(120),
    password,
  })
  .strict();

export const loginBody = z
  .object({
    email,
    // Length rules are for *choosing* a password; an existing one is checked by
    // Django, so only require that something was sent.
    password: z.string().min(1, "password is required").max(128),
  })
  .strict();

export const createGenerationBody = z
  .object({
    prompt: z.string().trim().min(1, "prompt is required").max(2000),
    kind: z.enum(KINDS),
    modelId: z.string().trim().min(1, "modelId is required").max(128),
    cameraId: presetId,
    effectId: presetId,
    filmId: presetId,
    paletteId: presetId,
    lightId: presetId,
    aspect: z.enum(ASPECTS),
    resolution: z.enum(RESOLUTIONS),
    duration: z
      .union([z.literal(3), z.literal(5), z.literal(8), z.literal(10)])
      .optional(),
    sound: z.boolean().optional(),
    batch: z.number().int().min(1).max(4),
  })
  .strict();

export const accountPlanBody = z.object({ plan: z.enum(PLANS) }).strict();

const limit = z.coerce.number().int().min(1).max(100).optional();
const cursor = z.string().trim().min(1).max(512).optional();

export const listQuery = z.object({ limit, cursor }).strict();

export const feedQuery = z
  .object({
    limit,
    cursor,
    kind: z.enum(KINDS).optional(),
    model: z.string().trim().min(1).max(128).optional(),
  })
  .strict();

export const idParam = z.object({ id: z.string().uuid("id must be a UUID") }).strict();

export type RegisterBody = z.infer<typeof registerBody>;
export type LoginBody = z.infer<typeof loginBody>;
export type CreateGenerationBody = z.infer<typeof createGenerationBody>;
export type AccountPlanBody = z.infer<typeof accountPlanBody>;
export type ListQuery = z.infer<typeof listQuery>;
export type FeedQuery = z.infer<typeof feedQuery>;

// --- request parsing -------------------------------------------------------

/** Validate, or fail the request with the contract's 400 shape. */
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (result.success) return result.data as z.infer<T>;

  const issue = result.error.issues[0];
  const where = issue !== undefined && issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
  const detail = issue !== undefined ? issue.message : "Request failed validation.";
  throw invalidRequest(`${where}${detail}`);
}

/** A JSON body, or a 400 — never a stack trace from JSON.parse. */
export async function readJsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw invalidRequest("Body must be valid JSON.");
  }
}
