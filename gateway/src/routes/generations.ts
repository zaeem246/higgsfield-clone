import { Hono } from "hono";
import { callBackend, respond } from "../lib/backend.js";
import {
  createGenerationBody,
  idParam,
  listQuery,
  parseOrThrow,
  readJsonBody,
} from "../lib/schema.js";
import { requireSessionToken, type AppEnv } from "../middleware/session.js";

export const generationRoutes = new Hono<AppEnv>();

generationRoutes.get("/", async (c) => {
  const query = parseOrThrow(listQuery, c.req.query());
  const { data } = await callBackend({
    method: "GET",
    path: "/generations/",
    query,
    sessionToken: requireSessionToken(c),
  });
  return respond(c, data);
});

generationRoutes.post("/", async (c) => {
  const body = parseOrThrow(createGenerationBody, await readJsonBody(c));
  // Cost, prompt composition and credit deduction are Django's; forward as-is.
  const { data } = await callBackend({
    method: "POST",
    path: "/generations/",
    body,
    sessionToken: requireSessionToken(c),
  });
  return respond(c, data, 201);
});

generationRoutes.get("/:id", async (c) => {
  const { id } = parseOrThrow(idParam, c.req.param());
  const { data } = await callBackend({
    method: "GET",
    path: `/generations/${id}/`,
    sessionToken: requireSessionToken(c),
  });
  return respond(c, data);
});

generationRoutes.delete("/:id", async (c) => {
  const { id } = parseOrThrow(idParam, c.req.param());
  const { data } = await callBackend({
    method: "DELETE",
    path: `/generations/${id}/`,
    sessionToken: requireSessionToken(c),
  });
  return respond(c, data);
});
