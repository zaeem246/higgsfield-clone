import { Hono } from "hono";
import { callBackend, respond, splitSessionToken } from "../lib/backend.js";
import { loginBody, parseOrThrow, readJsonBody, registerBody } from "../lib/schema.js";
import {
  clearSessionCookie,
  requireSessionToken,
  setSessionCookie,
  type AppEnv,
} from "../middleware/session.js";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", async (c) => {
  const body = parseOrThrow(registerBody, await readJsonBody(c));
  const { data } = await callBackend({ method: "POST", path: "/auth/register", body });

  // The token goes into the cookie and nowhere else; only the account is returned.
  const { token, account } = splitSessionToken(data);
  setSessionCookie(c, token);
  return respond(c, { account }, 201);
});

authRoutes.post("/login", async (c) => {
  const body = parseOrThrow(loginBody, await readJsonBody(c));
  const { data } = await callBackend({ method: "POST", path: "/auth/login", body });

  const { token, account } = splitSessionToken(data);
  setSessionCookie(c, token);
  return respond(c, { account });
});

authRoutes.post("/logout", async (c) => {
  const token = c.get("sessionToken");

  if (token !== undefined) {
    try {
      await callBackend({ method: "POST", path: "/auth/logout", sessionToken: token });
    } catch {
      // The browser must end up signed out even if Django is unreachable;
      // a stale row there is harmless, a stuck cookie here is not.
    }
  }

  clearSessionCookie(c);
  return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
  const { data } = await callBackend({
    method: "GET",
    path: "/auth/me",
    sessionToken: requireSessionToken(c),
  });
  return respond(c, data);
});
