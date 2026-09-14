"use client";

import Link from "next/link";
import { Poster } from "@/components/Poster";
import { Icon } from "@/components/ui";

/**
 * Dense media wall whose tiles respond to the cursor.
 *
 * Keeps the original's wall-of-media density — a uniform grid of 24 squares,
 * a count that divides evenly by every column number used here, so no
 * breakpoint gets a ragged last row — while making each tile a live target
 * rather than a screenshot: it lifts, dims, names itself and offers the action
 * it will perform.
 */
export function InteractiveWall({
  tiles,
  label,
  href,
}: {
  tiles: string[];
  /** What a tile represents, e.g. "Seedance 2.5". */
  label: string;
  href: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
      {tiles.map((seed) => (
        <Link
          key={seed}
          href={href}
          aria-label={`Generate with ${label}`}
          className="group/tile relative overflow-hidden rounded-[10px] border border-ink-100/8 transition-colors duration-200 hover:border-acid/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
        >
          <Poster
            seed={seed}
            aspectId="1:1"
            sizes={320}
            className="transition-transform duration-500 group-hover/tile:scale-[1.08]"
          >
            <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover/tile:bg-black/50" />
            <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-acid px-2.5 py-1 text-[10px] font-semibold text-ink-950 opacity-0 transition-opacity duration-200 group-hover/tile:opacity-100">
              <Icon name="wand" className="h-2.5 w-2.5" />
              Try
            </span>
          </Poster>
        </Link>
      ))}
    </div>
  );
}

/** Community card with a hover reveal for the recreate action. */
export function ProjectCard({
  seed,
  author,
  prompt,
}: {
  seed: string;
  author?: string;
  prompt: string;
}) {
  return (
    <Link
      href="/explore"
      className="group/proj block overflow-hidden rounded-[12px] border border-ink-100/8 bg-ink-850 transition-colors hover:border-ink-500"
    >
      <div className="relative">
        <Poster
          seed={seed}
          aspectId="16:9"
          sizes={420}
          className="transition-transform duration-500 group-hover/proj:scale-[1.04]"
        >
          <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover/proj:bg-black/55" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 opacity-0 transition-opacity duration-200 group-hover/proj:opacity-100">
            <p className="line-clamp-3 text-center text-[11px] leading-snug text-white/90">
              {prompt}
            </p>
            <span className="flex items-center gap-1 rounded-full bg-acid px-2.5 py-1 text-[10px] font-semibold text-ink-950">
              <Icon name="recreate" className="h-2.5 w-2.5" />
              Recreate
            </span>
          </div>
        </Poster>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-acid" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium">@{author}</span>
        <span className="shrink-0 rounded-full bg-ink-800 px-1.5 py-0.5 text-[9px] text-ink-400">
          Public
        </span>
      </div>
    </Link>
  );
}
