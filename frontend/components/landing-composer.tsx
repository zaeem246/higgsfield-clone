"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ComposedPrompt } from "@/components/composed-prompt";
import { Frame } from "@/components/frame";
import { PresetRail } from "@/components/preset-rail";
import { buttonClass } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";
import { TweenNumber } from "@/components/ui/tween-number";
import { cameraMove } from "@/lib/camera-moves";
import {
  COMPOSE_ORDER,
  composeSegments,
  estimateCost,
  presetIndex,
  presetsOf,
} from "@/lib/catalog";
import type { PresetFamily } from "@/lib/types";
import { defaultShot, shotHref, type ShotState } from "@/lib/shot";
import type { Catalog, Kind } from "@/lib/types";

/**
 * The prompt the demo opens on. Chosen, not invented: the reference frame is
 * picked by a hash of this exact string, so the line and the picture it pulls
 * were matched to each other deliberately. Change the wording and the demo
 * opens on a different photograph.
 */
const EXAMPLE = "A man walks a dog along a seawall at first light";

/**
 * The demo opens with three choices already stamped, rather than on a blank
 * set of rails. An empty state proves nothing: the point being made is that
 * *these* choices produced *this* picture, and a visitor has to be able to see
 * a graded frame before they will believe that clearing one changes it.
 */
const OPENING: Partial<Record<PresetFamily, string>> = {
  film: "35mm",
  palette: "teal-orange",
  light: "golden-hour",
};

/**
 * The landing demo. It is the real tool's core — same composition order, same
 * arithmetic, same components — wired to a link instead of a render, so the
 * claim made in the headline is something a stranger can put their hands on
 * within a few seconds of arriving, rather than a screenshot of a product.
 */
export function LandingComposer({ catalog }: { catalog: Catalog }) {
  const [shot, setShot] = useState<ShotState>(() => {
    const base = defaultShot(catalog);
    const selection: Record<PresetFamily, string | null> = { ...base.selection };
    // Only stamp what this catalogue actually serves; the demo must never show
    // an option the API has not published.
    for (const [family, id] of Object.entries(OPENING) as [PresetFamily, string][]) {
      if (catalog.presets.some((preset) => preset.id === id && preset.family === family)) {
        selection[family] = id;
      }
    }
    return { ...base, prompt: EXAMPLE, selection };
  });

  // The camera move under the pointer. The point of the demo is that you can
  // watch a move before signing up for anything.
  const [hovered, setHovered] = useState<string | null>(null);
  const [replay, setReplay] = useState(0);

  const index = useMemo(() => presetIndex(catalog.presets), [catalog.presets]);
  const model = catalog.models.find((entry) => entry.id === shot.modelId);
  const kind: Kind = model?.kind ?? "image";
  const resolution = catalog.resolutions.find((entry) => entry.id === shot.resolution);

  const segments = composeSegments(shot.prompt, shot.selection, index, kind);

  const chosenMove = kind === "video" ? shot.selection.camera : null;
  const previewMove = hovered ?? chosenMove;
  const move = cameraMove(previewMove);
  const cost = estimateCost({
    model,
    resolution,
    duration: shot.duration,
    sound: shot.sound,
    batch: shot.batch,
  });

  return (
    <div className="border border-rule bg-raised">
      <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
        <p className="label">Try it — change anything</p>
        <p className="font-mono text-[0.6875rem] text-graphite">{model?.name ?? "—"}</p>
      </div>

      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 p-3.5 md:p-4">
          <Field htmlFor="demo-subject" label="What do you want to see?">
            <TextArea
              id="demo-subject"
              rows={2}
              maxLength={240}
              value={shot.prompt}
              onChange={(event) => setShot({ ...shot, prompt: event.target.value })}
              className="font-mono"
            />
          </Field>

          <div className="mt-3 border border-l-2 border-rule border-l-vermilion bg-sunk px-3 py-2.5">
            <p className="label mb-1.5">The prompt this will send</p>
            <ComposedPrompt segments={segments} />
          </div>

          <div className="mt-1.5">
            {COMPOSE_ORDER.filter((family) => family !== "camera" || kind === "video").map(
              (family) => (
                <PresetRail
                  key={family}
                  family={family}
                  presets={presetsOf(catalog, family)}
                  value={shot.selection[family]}
                  onChange={(id) =>
                    setShot({ ...shot, selection: { ...shot.selection, [family]: id } })
                  }
                  onPreview={family === "camera" ? setHovered : undefined}
                />
              ),
            )}
          </div>
        </div>

        <div className="border-t border-rule p-3.5 md:border-t-0 md:border-l md:p-4">
          {/* The preview is the argument: change a style and the same picture
              is regraded in front of you, because the frame is built from the
              same selection the prompt is. The photograph is keyed to the
              subject alone, so only the grade moves. Its own slate is off —
              the caption below already says what it is. */}
          <Frame
            seed={shot.prompt || "kinograde"}
            aspect={shot.aspect}
            status="ready"
            mediaUrl={null}
            paletteId={shot.selection.palette}
            lightId={shot.selection.light}
            filmId={shot.selection.film}
            cameraId={shot.selection.camera}
            effectId={shot.selection.effect}
            kind={kind}
            slate={false}
            playMove={previewMove}
            playToken={replay}
            play={move ? (hovered ? "loop" : "once") : "off"}
          />
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <p className="label text-ink">{move ? move.label : "Preview"}</p>
            {move ? (
              <button
                type="button"
                onClick={() => setReplay((value) => value + 1)}
                className="meta underline underline-offset-4 hover:text-ink"
              >
                Play again
              </button>
            ) : null}
          </div>
          <p className="meta mt-0.5 min-h-[2.9em]">
            {move
              ? move.note
              : `${shot.aspect} · ${shot.resolution} · ${kind === "video" ? "video" : "image"} · a reference frame with your grade on it.`}
          </p>

          <p className="label mt-3">Spend</p>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <TweenNumber
              value={cost}
              unitLabel="credits"
              className="font-mono text-3xl leading-none text-ink"
            />
            <span className="meta">cr</span>
          </p>

          <Link href={shotHref(shot, kind)} className={buttonClass("primary", "md", "mt-3 w-full")}>
            Open this in Create
          </Link>
          <p className="meta mt-1.5">
            Takes these exact settings with you. Nothing is charged until you generate.
          </p>
        </div>
      </div>
    </div>
  );
}
