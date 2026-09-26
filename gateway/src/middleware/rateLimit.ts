import type { Context, MiddlewareHandler } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";
import { ApiError } from "./error.js";
import type { AppEnv } from "./session.js";

/**
 * In-memory sliding-window limiter, per IP, per limiter instance.
 *
 * In-memory is deliberate: this tier is stateless apart from this, and a single
 * gateway process is the deployment shape. Behind more than one instance the
 * limit becomes per-instance, which is the point at which it should move to a
 * shared store.
 */

const WINDOW_MS = 60_000;
const SWEEP_INTERVAL_MS = 60_000;

type Bucket = { hits: number[] };

function clientIp(c: Context<AppEnv>): string {
  // A reverse proxy rewrites the socket address, so trust its header first.
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded !== undefined) {
    const first = forwarded.split(",")[0]?.trim();
    if (first !== undefined && first.length > 0) return first;
  }

  const real = c.req.header("x-real-ip");
  if (real !== undefined && real.length > 0) return real;

  try {
    const address = getConnInfo(c).remote.address;
    if (address !== undefined) return address;
  } catch {
    // Non-Node runtime: fall through to the shared bucket below.
  }
  return "unknown";
}

export function rateLimit(limitPerMinute: number): MiddlewareHandler<AppEnv> {
  const buckets = new Map<string, Bucket>();

  const sweep = setInterval(() => {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [key, bucket] of buckets) {
      if (bucket.hits.every((at) => at <= cutoff)) buckets.delete(key);
    }
  }, SWEEP_INTERVAL_MS);
  // Never hold the process open just to prune counters.
  sweep.unref?.();

  return async (c, next) => {
    const key = clientIp(c);
    const now = Date.now();
    const cutoff = now - WINDOW_MS;

    const bucket = buckets.get(key) ?? { hits: [] };
    bucket.hits = bucket.hits.filter((at) => at > cutoff);

    if (bucket.hits.length >= limitPerMinute) {
      const oldest = bucket.hits[0] ?? now;
      const retryAfter = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
      buckets.set(key, bucket);
      c.header("Retry-After", String(retryAfter));
      throw new ApiError(429, "rate_limited", `Too many requests. Try again in ${retryAfter}s.`);
    }

    bucket.hits.push(now);
    buckets.set(key, bucket);
    await next();
  };
}
