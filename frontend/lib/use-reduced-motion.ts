"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function snapshot(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.(QUERY).matches);
}

/**
 * Whether the reader has asked for reduced motion, live.
 *
 * globals.css is what actually guarantees stillness — the CSS is the contract,
 * and it holds whether or not this hook is used. This exists so the components
 * can stop *doing the work* as well: no camera playback scheduled, no
 * animation restarted, no light rig mounted. The server has no media query to
 * read, so the first paint assumes motion is wanted and the CSS keeps that
 * honest until hydration.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
