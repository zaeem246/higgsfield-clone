import { Hono } from "hono";
import { callBackend, respond } from "../lib/backend.js";
import { feedQuery, idParam, parseOrThrow } from "../lib/schema.js";
import { requireSessionToken, type AppEnv } from "../middleware/session.js";

export const feedRoutes = new Hono<AppEnv>();

feedRoutes.get("/", async (c) => {
  const query = parseOrThrow(feedQuery, c.req.query());
  const token = c.get("sessionToken");

  // The feed is public, but `likedByMe` needs the viewer, so pass the token
  // when there is one rather than demanding it.
  const { data } = await callBackend({
    method: "GET",
    path: "/feed/",
    query,
    ...(token !== undefined ? { sessionToken: token } : {}),
  });
  return respond(c, data);
});

feedRoutes.post("/:id/like", async (c) => {
  const { id } = parseOrThrow(idParam, c.req.param());
  const { data } = await callBackend({
    method: "POST",
    path: `/feed/${id}/like/`,
    sessionToken: requireSessionToken(c),
  });
  return respond(c, data);
});

feedRoutes.delete("/:id/like", async (c) => {
  const { id } = parseOrThrow(idParam, c.req.param());
  const { data } = await callBackend({
    method: "DELETE",
    path: `/feed/${id}/like/`,
    sessionToken: requireSessionToken(c),
  });
  return respond(c, data);
});
