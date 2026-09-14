import type { Duration, Mode, Quality } from "./catalog";

export type GenerationStatus = "queued" | "rendering" | "ready" | "failed";

export interface Generation {
  id: string;
  /** What the user typed, without preset fragments. */
  prompt: string;
  /** What was actually sent to the model. */
  composedPrompt: string;
  mode: Mode;
  modelId: string;
  cameraMoveId: string | null;
  effectId: string | null;
  aspectId: string;
  duration: Duration;
  quality: Quality;
  status: GenerationStatus;
  /** Seed drives the deterministic poster art, so a result always looks the same. */
  seed: string;
  /** Set when a real provider returned media; null in demo mode. */
  mediaUrl: string | null;
  createdAt: number;
  credits: number;
  error?: string;
  /** Present on community items only. */
  author?: string;
  likes?: number;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  plan: "free" | "basic" | "pro" | "max";
  credits: number;
  createdAt: number;
}

export const PLAN_CREDITS: Record<Account["plan"], number> = {
  free: 60,
  basic: 120,
  pro: 600,
  max: 1800,
};
