import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { env } from "../env.js";
import type { AppEnv } from "./session.js";

/**
 * Credentialed CORS locked to the one configured frontend origin.
 * A wildcard origin is not an option: the browser refuses `*` together with
 * `credentials: "include"`, which is how the session cookie travels.
 */
export const corsMiddleware: MiddlewareHandler<AppEnv> = cors({
  origin: env.ALLOWED_ORIGIN,
  credentials: true,
  allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type"],
  maxAge: 600,
});
