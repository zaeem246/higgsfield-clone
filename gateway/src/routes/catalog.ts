import { Hono } from "hono";
import { callBackend, respond } from "../lib/backend.js";
import type { AppEnv } from "../middleware/session.js";

export const catalogRoutes = new Hono<AppEnv>();

// Public: the composer needs models and presets before anyone signs in.
catalogRoutes.get("/", async (c) => {
  const { data } = await callBackend({ method: "GET", path: "/catalog/" });
  return respond(c, data);
});
