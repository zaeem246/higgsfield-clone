"use client";

import Link from "next/link";
import { useState } from "react";
import { Plate } from "@/components/plate";
import { cameraMove } from "@/lib/camera-moves";
import { byGroup } from "@/lib/catalog";
import type { Preset } from "@/lib/types";

/**
 * The deck is a test chart, and a test chart has to hold everything but the
 * one variable still.
 *
 * Every plate is lit and stocked identically — a Rembrandt key, which puts one
 * compact highlight off-centre with the rest of the frame falling away, and an
 * anamorphic stock, whose flare draws a bright line straight through it. Those
 * are the landmarks: the key, the flare and the dark ridge along the bottom.
 * Watching where the three of them go is how you tell an orbit from a pan. Each *group* then gets its own colour script and its own
 * seed, so the wall has six looks on it rather than one, and any two tiles you
 * can see at once differ only in what the camera did.
 */
const DECK_LIGHT = "rembrandt";
const DECK_FILM = "anamorphic";

const DECK_PALETTES: Record<string, string> = {
  "Push & pull": "golden",
  "Orbit & arc": "teal-orange",
  "Crane & drone": "neon-noir",
  "Pan & tilt": "earth",
  "Rig & feel": "technicolor",
  Lens: "bleach-bypass",
};

/**
 * The camera catalogue, playable.
 *
 * Every other preset family can be judged from a still. A camera move cannot —
 * which is exactly why the category makes you pick one blind and pay to find
 * out what it was. Here you point at it and it performs.
 *
 * Each tile is a link into the composer with that move already loaded, so
 * keyboard focus is a real affordance rather than a `tabIndex` bolted on, and
 * tabbing through the deck plays all 28 in order.
 */
export function CameraDeck({ presets }: { presets: Preset[] }) {
  return (
    <>
      {byGroup(presets).map(([group, items]) => (
        <div key={group} className="pt-4">
          <h3 className="label mb-2">{group}</h3>
          <ul className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((preset) => (
              <CameraTile key={preset.id} preset={preset} group={group} />
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

/**
 * One move. Its hover state is local, so pointing at a tile costs one render
 * rather than twenty-eight.
 */
function CameraTile({ preset, group }: { preset: Preset; group: string }) {
  const [active, setActive] = useState(false);
  const move = cameraMove(preset.id);

  return (
    <li>
      <Link
        href={`/create?kind=video&camera=${preset.id}`}
        onPointerEnter={() => setActive(true)}
        onPointerLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className="group block rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vermilion"
      >
        <Plate
          seed={`kinograde-deck-${group}`}
          aspect="16:9"
          paletteId={DECK_PALETTES[group] ?? "teal-orange"}
          lightId={DECK_LIGHT}
          filmId={DECK_FILM}
          cameraId={preset.id}
          kind="video"
          slate={false}
          className="plate-lift"
          play={move && active ? "loop" : "off"}
        />
        <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-rule pt-1.5">
          <p className="text-[0.875rem] font-medium text-ink">{preset.name}</p>
          <p className={`meta shrink-0 ${active ? "text-vermilion" : "opacity-0"}`} aria-hidden>
            playing
          </p>
        </div>
        <p className="meta mt-1">{preset.fragment}</p>
        {move ? <p className="meta mt-1 text-ink/70">{move.note}</p> : null}
      </Link>
    </li>
  );
}
