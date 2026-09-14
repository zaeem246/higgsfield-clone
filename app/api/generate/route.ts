import { NextResponse } from "next/server";
import {
  ASPECT_RATIOS,
  composePrompt,
  creditCost,
  findModel,
  type GenerationSettings,
} from "@/lib/catalog";

/**
 * Generation endpoint.
 *
 * Hybrid by design. With a provider key present it really generates; without
 * one it returns queued placeholders the client renders as deterministic poster
 * art. The deployed link therefore works for anyone who opens it, and turns
 * real the moment a key is added — no code change, no second code path in the
 * UI, because both branches return the same shape.
 */

export const maxDuration = 300;

/** Our catalog names map onto whatever the gateway actually serves. */
const PROVIDER_MODEL: Record<string, string> = {
  soul: "openai/gpt-image-1",
  "soul-2": "openai/gpt-image-1",
  "gpt-image-2": "openai/gpt-image-1",
  "nano-banana-pro": "google/gemini-2.5-flash-image",
  "seedream-5": "google/gemini-2.5-flash-image",
  "flux-2": "black-forest-labs/flux-1.1-pro",
};

type Body = GenerationSettings & {
  /** How many reference images the user attached, for reporting only. */
  referenceCount?: number;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const invalid = validate(body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const prompt = composePrompt(body);
  const batch = Math.min(Math.max(1, body.batch), 4);
  const key = process.env.AI_GATEWAY_API_KEY;

  // Video needs async job polling that a single request cannot honestly model,
  // so it stays simulated even when a key is present rather than pretending.
  const canGoLive = Boolean(key) && body.mode === "image" && body.modelId in PROVIDER_MODEL;

  const base = {
    prompt: body.prompt,
    composedPrompt: prompt,
    credits: creditCost({ ...body, batch }),
  };

  if (!canGoLive) {
    return NextResponse.json({
      mode: "demo" as const,
      reason: reasonForDemo(key, body),
      items: Array.from({ length: batch }, (_, i) => ({
        seed: seed(prompt, i),
        mediaUrl: null,
        status: "queued" as const,
      })),
      ...base,
    });
  }

  try {
    const items = await Promise.all(
      Array.from({ length: batch }, (_, i) => renderImage(prompt, body, key!, i))
    );
    return NextResponse.json({ mode: "live" as const, items, ...base });
  } catch (err) {
    // A provider failure must not cost the user their credits or their prompt,
    // so fall back to demo output and say what happened.
    return NextResponse.json({
      mode: "demo" as const,
      reason: err instanceof Error ? err.message : "Provider request failed.",
      items: Array.from({ length: batch }, (_, i) => ({
        seed: seed(prompt, i),
        mediaUrl: null,
        status: "queued" as const,
      })),
      ...base,
    });
  }
}

/** Reports which mode the deployment is in, so the UI can be upfront about it. */
export async function GET() {
  return NextResponse.json({
    mode: process.env.AI_GATEWAY_API_KEY ? "live" : "demo",
    liveModes: process.env.AI_GATEWAY_API_KEY ? ["image"] : [],
  });
}

async function renderImage(
  prompt: string,
  body: Body,
  key: string,
  index: number
): Promise<{ seed: string; mediaUrl: string | null; status: "ready" | "failed" }> {
  const res = await fetch("https://ai-gateway.vercel.sh/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: PROVIDER_MODEL[body.modelId],
      prompt,
      n: 1,
      size: sizeFor(body.aspectId),
      quality: body.quality === "high" ? "high" : "medium",
    }),
    signal: AbortSignal.timeout(180_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Gateway responded ${res.status}. ${detail.slice(0, 180)}`.trim()
    );
  }

  const json = (await res.json()) as {
    data?: { url?: string; b64_json?: string }[];
  };
  const first = json.data?.[0];
  const url = first?.url ?? (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : null);

  return {
    seed: seed(prompt, index),
    mediaUrl: url,
    status: url ? "ready" : "failed",
  };
}

/** The provider only accepts a few sizes; pick the nearest to our ratio. */
function sizeFor(aspectId: string): string {
  const [w, h] = aspectId.split(":").map(Number);
  if (!w || !h) return "1024x1024";
  const r = w / h;
  if (r > 1.15) return "1536x1024";
  if (r < 0.87) return "1024x1536";
  return "1024x1024";
}

function seed(prompt: string, index: number): string {
  return `${prompt.slice(0, 48).replace(/\s+/g, "-").toLowerCase()}-${Date.now().toString(36)}-${index}`;
}

function reasonForDemo(key: string | undefined, body: Body): string {
  if (body.referenceCount) {
    return `Reference images are not applied in demo mode (${body.referenceCount} attached).`;
  }
  if (!key) return "No provider key configured — showing demo output.";
  if (body.mode === "video") return "Video generation runs in demo mode.";
  return "This model has no live provider mapping — showing demo output.";
}

function validate(body: Body): string | null {
  if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
    return "A prompt is required.";
  }
  if (body.prompt.length > 2000) return "Prompt is too long (2000 characters max).";
  const model = findModel(body.modelId);
  if (!model) return "Unknown model.";
  if (model.mode !== body.mode) return "That model does not support this mode.";
  if (!ASPECT_RATIOS.some((a) => a.id === body.aspectId)) return "Unknown aspect ratio.";
  return null;
}
