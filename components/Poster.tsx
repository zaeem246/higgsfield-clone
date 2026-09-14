"use client";

import { useState } from "react";
import { palette, photoUrl } from "@/lib/poster";
import type { GenerationStatus } from "@/lib/types";

/**
 * The media tile every generation is shown through.
 *
 * Renders the deterministic gradient immediately, then fades a photographic
 * layer in on top once it loads. If that fetch fails the gradient simply stays,
 * so a tile is never blank and never shows a broken-image glyph.
 */
export function Poster({
  seed,
  aspectId,
  status = "ready",
  className = "",
  sizes = 600,
  children,
}: {
  seed: string;
  aspectId: string;
  status?: GenerationStatus;
  className?: string;
  /** Longest edge requested from the photo layer. */
  sizes?: number;
  children?: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const p = palette(seed);

  const [w, h] = aspectId.split(":").map(Number);
  const ratio = w && h ? w / h : 1;
  const pw = Math.round(ratio >= 1 ? sizes : sizes * ratio);
  const ph = Math.round(ratio >= 1 ? sizes / ratio : sizes);

  const rendering = status === "queued" || status === "rendering";

  return (
    <div
      className={`relative overflow-hidden grain bg-ink-800 ${className}`}
      style={{ aspectRatio: `${w} / ${h}`, background: p.background }}
    >
      {!failed && !rendering && (
        /* Plain <img>: the source is an external generator, not a known-size
           asset, so Next's optimiser adds cost without adding anything here. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl(seed, pw, ph)}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ filter: "saturate(1.05) contrast(1.06)" }}
        />
      )}

      {/* Grade pass: pushes every photo toward the tile's own colour script so
          a mixed grid still reads as one coherent wall. */}
      {!rendering && (
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-soft-light opacity-70"
          style={{ background: p.background }}
        />
      )}

      {rendering && (
        <div className="absolute inset-0 overflow-hidden sweep opacity-60" aria-hidden />
      )}

      {/* Bottom scrim so overlaid text stays legible on any image. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/55 to-transparent"
      />

      {children}
    </div>
  );
}
