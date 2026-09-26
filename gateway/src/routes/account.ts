import { Hono } from "hono";
import { callBackend, respond } from "../lib/backend.js";
import { accountPlanBody, parseOrThrow, readJsonBody } from "../lib/schema.js";
import { requireSessionToken, type AppEnv } from "../middleware/session.js";

export const accountRoutes = new Hono<AppEnv>();

accountRoutes.post("/plan", async (c) => {
  const body = parseOrThrow(accountPlanBody, await readJsonBody(c));
  const { data } = await callBackend({
    method: "POST",
    path: "/account/plan/",
    body,
    sessionToken: requireSessionToken(c),
  });
  return respond(c, data);
});
