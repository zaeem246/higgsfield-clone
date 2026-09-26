import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { env } from "../env.js";
import { unauthorized } from "./error.js";

/**
 * The session cookie is the gateway's private business: it is read here,
 * turned into a context value, and never reaches a response body.
 */

export type AppEnv = {
  Variables: {
    sessionToken: string | undefined;
  };
};

// Django decides when a session actually dies; this only stops the browser
// holding a cookie forever. An expired-but-present cookie just yields a 401.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function cookieOptions(): Parameters<typeof setCookie>[3] {
  return {
    httpOnly: true,
    sameSite: "Lax",
    // Secure would make the cookie undeliverable over plain-http localhost,
    // so it is switched on exactly where the site is served over TLS.
    secure: env.isProduction,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}

/** Lifts the cookie into `c.get("sessionToken")` for every downstream handler. */
export const session: MiddlewareHandler<AppEnv> = async (c, next) => {
  const raw = getCookie(c, env.SESSION_COOKIE_NAME);
  c.set("sessionToken", raw !== undefined && raw.length > 0 ? raw : undefined);
  await next();
};

/** The token for routes that cannot run without one. */
export function requireSessionToken(c: Context<AppEnv>): string {
  const token = c.get("sessionToken");
  if (token === undefined) throw unauthorized();
  return token;
}

export function setSessionCookie(c: Context<AppEnv>, token: string): void {
  setCookie(c, env.SESSION_COOKIE_NAME, token, cookieOptions());
}

export function clearSessionCookie(c: Context<AppEnv>): void {
  deleteCookie(c, env.SESSION_COOKIE_NAME, { path: "/", secure: env.isProduction });
}
