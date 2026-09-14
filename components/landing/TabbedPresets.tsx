"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { groupBy, type Preset } from "@/lib/catalog";
import { Icon } from "@/components/ui";
import { PresetCarousel } from "./PresetCarousel";

/**
 * Preset browser with group tabs.
 *
 * A landing page that only scrolls gives you no way to answer "what kind of
 * moves are there?" without leaving. Filtering by group in place — Push & pull,
 * Orbit, Crane, Spectacle — lets the wall answer it, and each tile still carries
 * its selection straight into the generator.
 */
export function TabbedPresets({
  presets,
  param,
  mode = "video",
  aspect = "3:4",
}: {
  presets: Preset[];
  /**
   * Query-string key the chosen preset is passed under, e.g. "camera" or
   * "effect". A serialisable key rather than a builder function, because this is
   * a Client Component and functions cannot cross that boundary.
   */
  param: "camera" | "effect" | "film" | "palette" | "light";
  mode?: "video" | "image";
  aspect?: string;
}) {
  const groups = useMemo(() => groupBy(presets), [presets]);
  const [active, setActive] = useState<string>("All");

  const shown = active === "All" ? presets : presets.filter((p) => p.group === active);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {["All", ...groups.map(([g]) => g)].map((g) => (
          <button
            key={g}
            onClick={() => setActive(g)}
            aria-pressed={active === g}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-all duration-150 ${
              active === g
                ? "border-acid bg-acid font-medium text-ink-950"
                : "border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100"
            }`}
          >
            {g}{" "}
            <span className={active === g ? "opacity-60" : "text-ink-500"}>
              {g === "All" ? presets.length : presets.filter((p) => p.group === g).length}
            </span>
          </button>
        ))}
      </div>

      {/* Remount on tab change so the row starts back at its left edge. */}
      <PresetCarousel
        key={active}
        aspect={aspect}
        tiles={shown.map((p) => ({
          id: p.id,
          name: p.name,
          meta: p.group,
          href: `/generate?${param}=${p.id}&mode=${mode}`,
        }))}
      />

      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-500">
        <Icon name="chevron" className="h-3 w-3" />
        Scroll the row, or{" "}
        <Link href="/effects" className="text-ink-300 underline underline-offset-2 hover:text-acid">
          browse all {presets.length}
        </Link>
      </p>
    </div>
  );
}
