"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CAMERA_MOVES, EFFECTS, groupBy, type Preset } from "@/lib/catalog";
import { Poster } from "@/components/Poster";
import { Chip, Icon } from "@/components/ui";

type Tab = "camera" | "effects";

/**
 * The preset library as a browsable page rather than only a picker inside the
 * generator — this is the part of Higgsfield people come to look at, so it
 * deserves its own surface and its own URL.
 */
export default function EffectsPage() {
  const [tab, setTab] = useState<Tab>("camera");
  const [query, setQuery] = useState("");

  const presets = tab === "camera" ? CAMERA_MOVES : EFFECTS;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? presets.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.group.toLowerCase().includes(q) ||
            p.promptFragment.toLowerCase().includes(q)
        )
      : presets;
    return groupBy(filtered);
  }, [presets, query]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="display text-2xl font-semibold lg:text-3xl">Presets</h1>
        <p className="mt-1.5 max-w-xl text-sm text-ink-400">
          {CAMERA_MOVES.length} camera moves and {EFFECTS.length} effects. One click
          buys a cinematic move without prompt engineering — pick one and it is appended
          to your prompt for you.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Chip active={tab === "camera"} onClick={() => setTab("camera")}>
          Camera moves
        </Chip>
        <Chip active={tab === "effects"} onClick={() => setTab("effects")}>
          Effects
        </Chip>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="ml-auto h-9 w-full rounded-[8px] border border-ink-700 bg-ink-850 px-3 text-[13px] outline-none transition-colors placeholder:text-ink-500 focus:border-ink-500 sm:w-56"
        />
      </div>

      {groups.length === 0 && (
        <p className="py-16 text-center text-sm text-ink-400">
          No presets match “{query}”.
        </p>
      )}

      {groups.map(([group, items]) => (
        <section key={group} className="mb-8 last:mb-0">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500">
            {group}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((p) => (
              <PresetTile key={p.id} preset={p} kind={tab} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PresetTile({ preset, kind }: { preset: Preset; kind: Tab }) {
  const href = `/generate?${new URLSearchParams({
    prompt: "",
    mode: kind === "camera" ? "video" : "video",
    [kind === "camera" ? "camera" : "effect"]: preset.id,
  })
    .toString()
    .replace("prompt=&", "")}`;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-[12px] border border-ink-100/8 transition-colors hover:border-ink-500"
    >
      <Poster seed={preset.id} aspectId="16:9" sizes={400}>
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <p className="text-[13px] font-medium leading-tight text-white">{preset.name}</p>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-white/55">
            {preset.promptFragment}
          </p>
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <Icon name="wand" className="h-3 w-3" />
          Use
        </div>
      </Poster>
    </Link>
  );
}
