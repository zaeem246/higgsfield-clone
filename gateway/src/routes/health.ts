import { Hono } from "hono";
import { callBackend } from "../lib/backend.js";
import type { AppEnv } from "../middleware/session.js";

export const healthRoutes = new Hono<AppEnv>();

/**
 * Liveness for the gateway itself, plus a read-only opinion on Django.
 * It answers 200 even when the backend is down — this endpoint is what tells
 * an operator *which* tier is broken, so it must not break with it.
 */
healthRoutes.get("/", async (c) => {
  let backendReachable = true;
  try {
    await callBackend({ method: "GET", path: "/health/" });
  } catch {
    backendReachable = false;
  }

  return c.json({
    ok: true,
    service: "gateway",
    uptimeSeconds: Math.round(process.uptime()),
    backend: { reachable: backendReachable },
  });
});
