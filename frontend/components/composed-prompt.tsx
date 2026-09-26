"use client";

import { useEffect, useRef, useState } from "react";
import type { PromptSegment } from "@/lib/catalog";

/**
 * The composed prompt, sitting directly beneath the input so cause and effect
 * are adjacent. A fragment that has just been added animates in on its own;
 * the rest stay put, which is what makes it legible as "that preset did this".
 */
export function ComposedPrompt({ segments }: { segments: PromptSegment[] }) {
  const [fresh, setFresh] = useState<readonly string[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const signature = segments.map((segment) => segment.key).join("|");

  useEffect(() => {
    const keys = signature ? signature.split("|") : [];
    const added = keys.filter((key) => !seen.current.has(key));
    // Forget removed keys, so re-adding the same preset animates again.
    seen.current = new Set(keys);

    if (added.length === 0) return;
    setFresh(added);
    const timer = window.setTimeout(() => setFresh([]), 400);
    return () => window.clearTimeout(timer);
  }, [signature]);

  if (segments.length === 0) {
    return (
      <p className="font-mono text-[0.8125rem] leading-relaxed text-graphite">
        Your finished prompt appears here as you write and choose.
      </p>
    );
  }

  return (
    <p className="font-mono text-[0.8125rem] leading-relaxed text-ink">
      {segments.map((segment, index) => (
        <span key={segment.key} className={fresh.includes(segment.key) ? "land" : undefined}>
          {index > 0 ? <span className="text-graphite">, </span> : null}
          {segment.text}
        </span>
      ))}
    </p>
  );
}
