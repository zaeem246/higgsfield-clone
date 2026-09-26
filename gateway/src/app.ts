import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { session, type AppEnv } from "./middleware/session.js";
import { accountRoutes } from "./routes/account.js";
import { authRoutes } from "./routes/auth.js";
import { catalogRoutes } from "./routes/catalog.js";
import { feedRoutes } from "./routes/feed.js";
import { generationRoutes } from "./routes/generations.js";
import { healthRoutes } from "./routes/health.js";

const GENERAL_LIMIT_PER_MIN = 60;
const AUTH_LIMIT_PER_MIN = 10;

/** One structured line per request. Never a body, never a header value. */
const requestLog: MiddlewareHandler<AppEnv> = async (c, next) => {
  const startedAt = performance.now();
  await next();
  console.log(
    JSON.stringify({
      level: "info",
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Math.round(performance.now() - startedAt),
    }),
  );
};

export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  // Order matters: log everything including rejections; answer CORS preflights
  // before they can spend rate-limit budget; read the cookie before any route.
  app.use("*", requestLog);
  app.use("*", corsMiddleware);
  app.use("*", rateLimit(GENERAL_LIMIT_PER_MIN));
  app.use("*", session);

  // Credential-guessing is the expensive attack, so the routes that accept
  // credentials get a second, tighter budget. `/auth/me` and `/auth/logout` are
  // deliberately excluded: `me` runs on every server render, so putting it in
  // the credential bucket let ordinary browsing exhaust the allowance meant for
  // brute-force protection, and logging out is not an attack worth throttling.
  app.use("/api/auth/login", rateLimit(AUTH_LIMIT_PER_MIN));
  app.use("/api/auth/register", rateLimit(AUTH_LIMIT_PER_MIN));

  app.route("/api/health", healthRoutes);
  app.route("/api/auth", authRoutes);
  app.route("/api/catalog", catalogRoutes);
  app.route("/api/generations", generationRoutes);
  app.route("/api/feed", feedRoutes);
  app.route("/api/account", accountRoutes);

  return app;
}
