import type { Context } from "hono";
import { env } from "../env.js";
import { ApiError } from "../middleware/error.js";
import { toCamelCase, toSnakeCase, type JsonValue } from "./case.js";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * The only module that talks to Django.
 *
 * It owns the shared-secret header, the session header, the timeout, the
 * case translation and the error normalisation — so no route handler ever
 * constructs a backend URL or sees a snake_case payload.
 */

const TIMEOUT_MS = 10_000;

type QueryValue = string | number | boolean | undefined;

export type BackendCall = {
  method: "GET" | "POST" | "DELETE";
  /** Path under the Django API base, e.g. `/auth/login`. */
  path: string;
  /** camelCase body; converted to snake_case before sending. */
  body?: JsonValue;
  query?: Readonly<Record<string, QueryValue>>;
  /** Session token from the cookie. Omitted for anonymous calls. */
  sessionToken?: string;
};

export type BackendResult = {
  status: number;
  /** camelCase JSON, or `null` for an empty body (e.g. 204). */
  data: JsonValue;
};

const API_BASE = "/api/v1";

function buildUrl(path: string, query?: Readonly<Record<string, QueryValue>>): string {
  const url = new URL(`${API_BASE}${path}`, `${env.backendOrigin}/`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Django may answer with the contract's `{error:{code,message}}`, with DRF's
 * `{detail: "..."}`, or with something unhelpful. Collapse all three.
 */
function normaliseUpstreamError(status: number, data: JsonValue): ApiError {
  const httpStatus = (status >= 400 && status <= 599 ? status : 502) as ContentfulStatusCode;

  if (isRecord(data)) {
    const wrapped = data["error"];
    if (isRecord(wrapped)) {
      const code = typeof wrapped["code"] === "string" ? wrapped["code"] : "upstream_error";
      const message =
        typeof wrapped["message"] === "string" ? wrapped["message"] : "The request could not be completed.";
      return new ApiError(httpStatus, code, message);
    }
    if (typeof data["detail"] === "string") {
      return new ApiError(httpStatus, status === 401 ? "unauthenticated" : "upstream_error", data["detail"]);
    }
  }

  return new ApiError(httpStatus, "upstream_error", `Backend responded with ${status}.`);
}

async function readJson(response: Response): Promise<JsonValue> {
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    throw new ApiError(502, "upstream_unavailable", "The backend returned a malformed response.");
  }
}

export async function callBackend(call: BackendCall): Promise<BackendResult> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    // Proves the call came from the gateway; Django rejects anything without it.
    "X-Gateway-Key": env.GATEWAY_KEY,
  };
  if (call.sessionToken !== undefined) headers["X-Session-Token"] = call.sessionToken;

  const init: RequestInit = {
    method: call.method,
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  };

  if (call.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(toSnakeCase(call.body));
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(call.path, call.query), init);
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === "TimeoutError";
    throw new ApiError(
      502,
      "upstream_unavailable",
      timedOut ? "The backend took too long to respond." : "The backend is unavailable.",
    );
  }

  const raw = await readJson(response);
  const data = toCamelCase(raw);

  if (!response.ok) throw normaliseUpstreamError(response.status, data);

  return { status: response.status, data };
}

/**
 * Pull a session token out of a Django auth response and hand back the rest.
 * Django is the only place the token exists in a body; it stops here.
 */
export function splitSessionToken(data: JsonValue): { token: string; account: JsonValue } {
  if (!isRecord(data)) {
    throw new ApiError(502, "upstream_error", "The backend returned an unexpected auth response.");
  }

  // `token` is the contract's name; `sessionToken` is tolerated so a backend
  // that spells the field out does not break sign-in.
  const candidate = data["token"] ?? data["sessionToken"];
  if (typeof candidate !== "string" || candidate.length === 0) {
    throw new ApiError(502, "upstream_error", "The backend did not return a session token.");
  }

  const account = data["account"];
  if (account === undefined) {
    throw new ApiError(502, "upstream_error", "The backend did not return an account.");
  }

  return { token: candidate, account };
}

/**
 * Send already-camelCased backend data on to the browser.
 *
 * `c.body` rather than `c.json`: Hono infers a literal type from `c.json`, and
 * inferring it over the recursive `JsonValue` exhausts TypeScript's depth
 * budget. The wire format is identical.
 */
export function respond(c: Context, data: JsonValue, status: ContentfulStatusCode = 200): Response {
  return c.body(JSON.stringify(data), status, { "Content-Type": "application/json" });
}
