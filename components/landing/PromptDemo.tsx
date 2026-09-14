"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CAMERA_MOVES,
  EFFECTS,
  LIGHTING,
  creditCost,
  findModel,
  type GenerationSettings,
} from "@/lib/catalog";
import { Poster } from "@/components/Poster";
import { Icon } from "@/components/ui";

/**
 * Playable demo of the core loop, on the landing page.
 *
 * The whole pitch is "you press a button for the shot and the model is told
 * exactly what the camera does" — which is a claim until you can watch the
 * composed prompt change under your hands. Picking a move here rewrites the
 * text sent to the model, re-grades the preview and re-prices the render, live,
 * and "Generate this" carries the exact selection into the real generator.
 */

const SAMPLES = [
  "A lone figure in a red trench coat crossing a flooded Tokyo intersection at night",
  "Ballet dancer suspended mid-leap in an abandoned theatre, dust in the air",
  "Vintage F1 car mid-corner, tyre smoke lit by low afternoon sun",
  "Giant jellyfish drifting between skyscrapers at dusk",
];

/**
 * Flattened in the same order `composePrompt` appends them (look before motion),
 * so what is displayed matches what the generator will actually send.
 */
const ALL_PICKS = [...LIGHTING, ...EFFECTS, ...CAMERA_MOVES];

const PICKS = {
  camera: CAMERA_MOVES.filter((p) =>
    ["crash-zoom-in", "bullet-time", "fpv-drone", "orbit-360", "dolly-zoom", "snorricam"].includes(p.id)
  ),
  effect: EFFECTS.filter((p) =>
    ["vanish", "particles", "frozen-in-motion", "melting", "clones"].includes(p.id)
  ),
  light: LIGHTING.filter((p) =>
    ["golden-hour", "neon", "hard-flash", "rim-light", "silhouette"].includes(p.id)
  ),
};

export function PromptDemo() {
  const [prompt, setPrompt] = useState(SAMPLES[0]);
  const [cameraMoveId, setCamera] = useState<string | null>("crash-zoom-in");
  const [effectId, setEffect] = useState<string | null>(null);
  const [lightingId, setLighting] = useState<string | null>("neon");

  const settings: GenerationSettings = useMemo(
    () => ({
      mode: "video",
      modelId: "seedance-2-5",
      prompt,
      cameraMoveId,
      effectId,
      filmSetupId: null,
      paletteId: null,
      lightingId,
      aspectId: "16:9",
      resolutionId: "1080p",
      duration: 5,
      sound: true,
      quality: "standard",
      batch: 1,
    }),
    [prompt, cameraMoveId, effectId, lightingId]
  );

  const cost = creditCost(settings);
  const model = findModel(settings.modelId);

  // Derive the appended fragments from the selection rather than by slicing the
  // composed string — slicing dropped the separator before the first fragment,
  // so the prompt ran straight into it.
  const chosen = [lightingId, effectId, cameraMoveId];
  const fragments = ALL_PICKS.filter((p) => chosen.includes(p.id)).map(
    (p) => p.promptFragment
  );

  // The preview is keyed on the whole selection, so every change re-grades it.
  const seed = `demo-${cameraMoveId ?? "none"}-${effectId ?? "none"}-${lightingId ?? "none"}`;

  const href = `/generate?${new URLSearchParams({
    prompt,
    mode: "video",
    model: settings.modelId,
    ...(cameraMoveId ? { camera: cameraMoveId } : {}),
    ...(effectId ? { effect: effectId } : {}),
    ...(lightingId ? { light: lightingId } : {}),
  }).toString()}`;

  return (
    <section className="mt-4 overflow-hidden rounded-[18px] border border-ink-100/8 bg-ink-900">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        {/* ----------------------------------------------------- controls */}
        <div className="p-5 sm:p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-acid px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-950">
            <Icon name="camera" className="h-3 w-3" />
            Try it here
          </span>
          <h2 className="headline mt-4 text-3xl sm:text-4xl">
            Direct the shot,
            <br />
            <span className="text-acid">not just the subject</span>
          </h2>

          <label htmlFor="demo-prompt" className="sr-only">
            Prompt
          </label>
          <textarea
            id="demo-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 300))}
            rows={2}
            className="mt-5 w-full resize-none rounded-[10px] border border-ink-700 bg-ink-850 p-3 text-[14px] leading-relaxed outline-none transition-colors placeholder:text-ink-500 focus:border-ink-500"
            placeholder="Describe your scene…"
          />
          <button
            onClick={() => setPrompt(SAMPLES[Math.floor(Math.random() * SAMPLES.length)])}
            className="mt-1.5 text-[12px] text-ink-500 transition-colors hover:text-acid"
          >
            Surprise me →
          </button>

          <Row
            label="Camera move"
            options={PICKS.camera}
            value={cameraMoveId}
            onChange={setCamera}
          />
          <Row label="Effect" options={PICKS.effect} value={effectId} onChange={setEffect} />
          <Row label="Lighting" options={PICKS.light} value={lightingId} onChange={setLighting} />

          {/* The payoff: what your clicks actually send. */}
          <div className="mt-5 rounded-[10px] border border-ink-100/8 bg-ink-950 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              Sent to {model?.name}
            </p>
            <p className="mt-1.5 font-mono text-[12px] leading-relaxed">
              <span className="text-ink-100">{prompt.trim()}</span>
              {fragments.map((frag) => (
                <span key={frag} className="text-acid">
                  , {frag}
                </span>
              ))}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={href}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-acid px-6 text-[14px] font-semibold text-ink-950 transition-all hover:brightness-110"
            >
              <Icon name="wand" className="h-4 w-4" />
              Generate this
            </Link>
            <span className="flex items-center gap-1.5 text-[13px] text-ink-400">
              <Icon name="spark" className="h-3.5 w-3.5 text-acid" />
              {cost} credits · 5s · 1080p
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------ preview */}
        <div className="relative min-h-[280px] border-t border-ink-100/8 lg:border-l lg:border-t-0">
          <Poster seed={seed} aspectId="16:9" sizes={720} className="h-full w-full">
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {[cameraMoveId, effectId, lightingId]
                .filter(Boolean)
                .map((id) => {
                  const p = [...CAMERA_MOVES, ...EFFECTS, ...LIGHTING].find((x) => x.id === id)!;
                  return (
                    <span
                      key={id}
                      className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-acid backdrop-blur"
                    >
                      {p.name}
                    </span>
                  );
                })}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-[11px] uppercase tracking-wide text-white/50">Preview</p>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-white/90">{prompt}</p>
            </div>
          </Poster>
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; name: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Chip active={value === null} onClick={() => onChange(null)}>
          None
        </Chip>
        {options.map((o) => (
          <Chip
            key={o.id}
            active={value === o.id}
            onClick={() => onChange(value === o.id ? null : o.id)}
          >
            {o.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-all duration-150 ${
        active
          ? "border-acid bg-acid text-ink-950 font-medium"
          : "border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100"
      }`}
    >
      {children}
    </button>
  );
}
