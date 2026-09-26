import { gatewayUrl } from "@/lib/api.server";

/**
 * Same-origin proxy to the gateway.
 *
 * The browser is never allowed to make a cross-origin credentialed request, so
 * every `/api/*` call lands here and is replayed server-side. Cookies travel
 * both ways — the session cookie up, any Set-Cookie the gateway issues back
 * down — which keeps the httpOnly session working while GATEWAY_URL stays out
 * of the client bundle entirely.
 */

// Session-dependent and never cacheable.
export const dynamic = "force-dynamic";

/** Hop-by-hop and host-specific headers must not be replayed upstream. */
const STRIPPED = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

async function proxy(request: Request, path: string[]): Promise<Response> {
  const search = new URL(request.url).search;
  const target = `${gatewayUrl()}/api/${path.map(encodeURIComponent).join("/")}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return errorResponse(
      503,
      "gateway_unreachable",
      "The Kinograde API is not responding.",
    );
  }

  const out = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) out.set("content-type", contentType);
  out.set("cache-control", "no-store");
  // getSetCookie keeps multiple Set-Cookie headers separate; joining them into
  // one string would corrupt cookies whose values contain commas.
  for (const cookie of upstream.headers.getSetCookie()) out.append("set-cookie", cookie);

  return new Response(upstream.body, { status: upstream.status, headers: out });
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  return proxy(request, (await context.params).path);
}

export async function POST(request: Request, context: Context): Promise<Response> {
  return proxy(request, (await context.params).path);
}

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return proxy(request, (await context.params).path);
}

export async function PUT(request: Request, context: Context): Promise<Response> {
  return proxy(request, (await context.params).path);
}

export async function DELETE(request: Request, context: Context): Promise<Response> {
  return proxy(request, (await context.params).path);
}
