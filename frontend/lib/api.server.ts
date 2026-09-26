import { cookies } from "next/headers";
import { cache } from "react";
import { createApi, toResult, unreachable, type GatewayApi, type Transport } from "./api";
import type { Account, ApiResult } from "./types";

/**
 * The server-side gateway client, for Server Components and route handlers.
 *
 * Importing `next/headers` makes this module server-only by construction: a
 * Client Component that reaches for it fails to build rather than leaking
 * GATEWAY_URL into the bundle.
 */

export function gatewayUrl(): string {
  return (process.env.GATEWAY_URL ?? "http://localhost:4000").replace(/\/$/, "");
}

/** Per-request, because the cookie header has to be read inside the request. */
export async function serverApi(): Promise<GatewayApi> {
  const cookieHeader = (await cookies()).toString();
  const base = `${gatewayUrl()}/api`;

  const transport: Transport = async <T,>(path: string, init?: RequestInit) => {
    try {
      const headers = new Headers(init?.headers);
      if (cookieHeader) headers.set("cookie", cookieHeader);
      const res = await fetch(`${base}${path}`, { ...init, headers, cache: "no-store" });
      return await toResult<T>(res);
    } catch {
      return unreachable();
    }
  };

  return createApi(transport);
}

/**
 * The signed-in account for this request. Cached because the layout and the
 * page both need it: without this each render costs two identical /auth/me
 * round trips, which is wasted latency and pushes against the gateway's rate
 * limit for no reason.
 */
export const currentAccount = cache(
  async (): Promise<ApiResult<Account>> => (await serverApi()).me(),
);
