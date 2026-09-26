import type { Context, ErrorHandler, NotFoundHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** The single error shape the contract promises the browser. */
export type ApiErrorBody = { error: { code: string; message: string } };

/**
 * An error that already knows how it should look to the client. Anything else
 * reaching the handler is a bug and becomes an opaque 500.
 */
export class ApiError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: string;

  constructor(status: ContentfulStatusCode, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function invalidRequest(message: string): ApiError {
  return new ApiError(400, "invalid_request", message);
}

export function unauthorized(message = "Sign in to continue."): ApiError {
  return new ApiError(401, "unauthenticated", message);
}

function send(c: Context, status: ContentfulStatusCode, code: string, message: string): Response {
  const body: ApiErrorBody = { error: { code, message } };
  return c.json(body, status);
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ApiError) {
    return send(c, err.status, err.code, err.message);
  }

  // Unexpected: log the detail for us, tell the browser nothing.
  console.error(
    JSON.stringify({
      level: "error",
      msg: "unhandled_error",
      path: c.req.path,
      method: c.req.method,
      error: err instanceof Error ? err.stack ?? err.message : String(err),
    }),
  );
  return send(c, 500, "internal_error", "Something went wrong.");
};

export const notFoundHandler: NotFoundHandler = (c) =>
  send(c, 404, "not_found", `No route for ${c.req.method} ${c.req.path}.`);
