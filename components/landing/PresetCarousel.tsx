"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Poster } from "@/components/Poster";
import { Icon } from "@/components/ui";

export interface CarouselTile {
  id: string;
  /** Shown on hover. Omit for decorative walls. */
  name?: string;
  meta?: string;
  href: string;
}

/**
 * Horizontally scrollable media row.
 *
 * The original's walls are live video that reacts under the cursor; a static
 * grid of stills reads as a screenshot of a product rather than the product.
 * This restores the two interactions that matter: the row scrolls (drag, wheel,
 * arrows or keyboard) and each tile reveals what it is and what it will do.
 */
export function PresetCarousel({
  tiles,
  aspect = "3:4",
  size = 200,
}: {
  tiles: CarouselTile[];
  aspect?: string;
  size?: number;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    sync();
    const el = track.current;
    if (!el) return;
    // Observe the children as well as the track: when the tiles are swapped out
    // the track's own box never resizes, so watching it alone leaves the
    // end-of-row state stale and the arrows wrongly disabled.
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    for (const child of el.children) ro.observe(child);
    // Late-loading images can widen the row after the observers have settled.
    const t = setTimeout(sync, 400);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [sync, tiles.length]);

  const nudge = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 240), behavior: "smooth" });
  };

  return (
    <div className="group/car relative">
      <div
        ref={track}
        onScroll={sync}
        tabIndex={0}
        role="region"
        aria-label="Preset carousel, scrollable"
        className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid [&::-webkit-scrollbar]:hidden"
      >
        {tiles.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className="group/tile relative w-[46%] shrink-0 snap-start overflow-hidden rounded-[12px] border border-ink-100/8 transition-colors hover:border-acid/60 sm:w-[30%] lg:w-[15.6%]"
          >
            <Poster
              seed={t.id}
              aspectId={aspect}
              sizes={size}
              className="transition-transform duration-500 group-hover/tile:scale-[1.06]"
            >
              {/* Dim pass so the reveal reads on any image. */}
              <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover/tile:bg-black/45" />

              {t.name && (
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="text-[12px] font-semibold leading-tight text-white">
                    {t.name}
                  </p>
                  {t.meta && (
                    <p className="mt-0.5 text-[9.5px] uppercase tracking-wide text-white/50">
                      {t.meta}
                    </p>
                  )}
                </div>
              )}

              {/* Reveal: what clicking does. */}
              <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 translate-y-1 items-center gap-1.5 rounded-full bg-acid px-3.5 py-1.5 text-[12px] font-semibold text-ink-950 opacity-0 transition-all duration-200 group-hover/tile:translate-y-[-50%] group-hover/tile:opacity-100">
                <Icon name="wand" className="h-3 w-3" />
                Try it
              </span>
            </Poster>
          </Link>
        ))}
      </div>

      <Arrow side="left" hidden={atStart} onClick={() => nudge(-1)} />
      <Arrow side="right" hidden={atEnd} onClick={() => nudge(1)} />
    </div>
  );
}

function Arrow({
  side,
  hidden,
  onClick,
}: {
  side: "left" | "right";
  hidden: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      tabIndex={hidden ? -1 : 0}
      className={`absolute top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-ink-100/12 bg-ink-950/85 text-ink-100 backdrop-blur transition-all duration-200 hover:bg-ink-800 ${
        side === "left" ? "left-2" : "right-2"
      } ${
        hidden
          ? "pointer-events-none opacity-0"
          : "opacity-70 group-hover/car:opacity-100"
      }`}
    >
      <Icon
        name="chevron"
        className={`h-4 w-4 ${side === "left" ? "rotate-180" : ""}`}
      />
    </button>
  );
}
