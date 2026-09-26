"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { ComposedPrompt } from "@/components/composed-prompt";
import { ContactSheet } from "@/components/contact-sheet";
import { Frame } from "@/components/frame";
import { PresetRail } from "@/components/preset-rail";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { OptionGroup, type Option } from "@/components/ui/option-group";
import { Switch } from "@/components/ui/switch";
import { TweenNumber } from "@/components/ui/tween-number";
import { api } from "@/lib/api";
import { cameraMove } from "@/lib/camera-moves";
import {
  COMPOSE_ORDER,
  composeSegments,
  estimateCost,
  presetIndex,
  presetsOf,
} from "@/lib/catalog";
import { MAX_BATCH, MAX_PROMPT, type ShotState } from "@/lib/shot";
import type { ApiError, Catalog, Generation, Kind } from "@/lib/types";

const POLL_MS = 1600;
/** ~80 seconds of watching before we stop asking and let the reader reload. */
const MAX_POLLS = 50;

const BATCH_OPTIONS: readonly Option<number>[] = Array.from({ length: MAX_BATCH }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

const KIND_OPTIONS: readonly Option<Kind>[] = [
  { value: "image", label: "Still" },
  { value: "video", label: "Motion" },
];

function isPending(generation: Generation): boolean {
  return generation.status === "queued" || generation.status === "rendering";
}

interface ComposerProps {
  catalog: Catalog;
  initialShot: ShotState;
  signedIn: boolean;
}

export function Composer({ catalog, initialShot, signedIn }: ComposerProps) {
  const router = useRouter();
  const promptId = useId();
  const [shot, setShot] = useState<ShotState>(initialShot);
  const [results, setResults] = useState<Generation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);
  // The move under the pointer, if any: hovering a camera chip performs that
  // move on the preview before it has been chosen.
  const [hovered, setHovered] = useState<string | null>(null);
  const [replay, setReplay] = useState(0);

  const index = useMemo(() => presetIndex(catalog.presets), [catalog.presets]);
  const model = catalog.models.find((entry) => entry.id === shot.modelId);
  const kind: Kind = model?.kind ?? "image";
  const resolution = catalog.resolutions.find((entry) => entry.id === shot.resolution);

  const segments = composeSegments(shot.prompt, shot.selection, index, kind);

  // Hovering wins over the selection, and loops for as long as the pointer is
  // there; a committed move plays once and can be replayed on demand.
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

  // Poll every unfinished shot until it resolves. The tick both paces the loop
  // and caps it, so a stalled backend cannot keep the page fetching forever.
  useEffect(() => {
    const pending = results.filter(isPending);
    if (pending.length === 0 || tick >= MAX_POLLS) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const updates = await Promise.all(pending.map((item) => api.generation(item.id)));
      if (cancelled) return;

      const fresh = new Map<string, Generation>();
      for (const update of updates) {
        if (update.ok) fresh.set(update.data.generation.id, update.data.generation);
      }

      setResults((previous) => {
        let changed = false;
        const next = previous.map((item) => {
          const updated = fresh.get(item.id);
          if (updated && updated.status !== item.status) {
            changed = true;
            return updated;
          }
          return item;
        });
        return changed ? next : previous;
      });
      setTick((value) => value + 1);
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [results, tick]);

  function update(patch: Partial<ShotState>) {
    setShot((previous) => ({ ...previous, ...patch }));
  }

  function setKind(next: Kind) {
    if (next === kind) return;
    const first = catalog.models.find((entry) => entry.kind === next);
    if (!first) return;
    // A camera move is meaningless on a still and the backend drops it, so the
    // selection is cleared rather than silently ignored.
    update({
      modelId: first.id,
      selection: next === "image" ? { ...shot.selection, camera: null } : shot.selection,
    });
  }

  async function submit() {
    if (!shot.prompt.trim() || !model) return;
    setSubmitting(true);
    setError(null);

    const created = await api.createGenerations({
      prompt: shot.prompt.trim(),
      kind,
      modelId: model.id,
      cameraId: kind === "video" ? shot.selection.camera : null,
      effectId: shot.selection.effect,
      filmId: shot.selection.film,
      paletteId: shot.selection.palette,
      lightId: shot.selection.light,
      aspect: shot.aspect,
      resolution: shot.resolution,
      duration: shot.duration,
      sound: kind === "video" ? shot.sound : false,
      batch: shot.batch,
    });

    setSubmitting(false);
    if (!created.ok) {
      setError(created.error);
      return;
    }

    setResults((previous) => [...created.data.items, ...previous]);
    setTick(0);
    // Credits are held in the server-rendered header; only a refresh is truthful.
    router.refresh();
  }

  const models = catalog.models.filter((entry) => entry.kind === kind);
  const canSubmit = signedIn && !submitting && shot.prompt.trim().length > 0 && Boolean(model);

  if (catalog.models.length === 0) {
    return (
      <Notice tone="alert" title="The catalogue could not be loaded.">
        <p>
          Models, styles and prices all come from the API, and it is not answering. This page
          cannot be shown with invented options.
        </p>
      </Notice>
    );
  }

  return (
    <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
      <div className="min-w-0">
        {/* Subject ------------------------------------------------------ */}
        <Field
          htmlFor={promptId}
          label="What do you want to see?"
          hint={`${shot.prompt.length} / ${MAX_PROMPT} characters · ${segments.length} parts in the finished prompt`}
        >
          <TextArea
            id={promptId}
            rows={2}
            maxLength={MAX_PROMPT}
            value={shot.prompt}
            onChange={(event) => update({ prompt: event.target.value })}
            placeholder="A man walks a dog along a seawall at first light"
            className="font-mono"
          />
        </Field>

        {/* The composed prompt sits directly under the input. */}
        <div className="mt-3 border border-l-2 border-rule border-l-vermilion bg-raised px-3 py-2.5">
          <p className="label mb-1.5">The prompt this will send</p>
          <ComposedPrompt segments={segments} />
        </div>

        {/* Model -------------------------------------------------------- */}
        <div className="mt-7">
          <div className="mb-2.5 flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-2">
            <h2 className="font-display text-xl leading-none">Model</h2>
            <OptionGroup legend="Medium" value={kind} options={KIND_OPTIONS} onChange={setKind} />
          </div>
          <ModelPicker
            models={models}
            value={shot.modelId}
            onChange={(id) => update({ modelId: id })}
          />
        </div>

        {/* Presets ------------------------------------------------------ */}
        <div className="mt-7">
          <h2 className="mb-2.5 border-b border-rule pb-2 font-display text-xl leading-none">
            How it should look
          </h2>
          <div>
            {COMPOSE_ORDER.map((family) => (
              <PresetRail
                key={family}
                family={family}
                presets={presetsOf(catalog, family)}
                value={shot.selection[family]}
                onChange={(id) =>
                  update({ selection: { ...shot.selection, [family]: id } })
                }
                onPreview={family === "camera" ? setHovered : undefined}
                disabledReason={
                  family === "camera" && kind === "image"
                    ? "Stills have no camera move."
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        {/* Output ------------------------------------------------------- */}
        <div className="mt-7 space-y-4">
          <h2 className="border-b border-rule pb-2 font-display text-xl leading-none">Output</h2>
          <OptionGroup
            legend="Aspect"
            value={shot.aspect}
            options={catalog.aspects.map((entry) => ({ value: entry.id, label: entry.label }))}
            onChange={(value) => update({ aspect: value })}
          />
          <OptionGroup
            legend="Resolution"
            value={shot.resolution}
            options={catalog.resolutions.map((entry) => ({ value: entry.id, label: entry.label }))}
            onChange={(value) => update({ resolution: value })}
          />
          {kind === "video" ? (
            <>
              <OptionGroup
                legend="Duration"
                value={shot.duration}
                options={catalog.durations.map((entry) => ({ value: entry.id, label: entry.label }))}
                onChange={(value) => update({ duration: value })}
              />
              <Switch
                id="composer-sound"
                checked={shot.sound}
                onChange={(checked) => update({ sound: checked })}
                label="Native sound (+15%)"
              />
            </>
          ) : null}
          <OptionGroup
            legend="Batch"
            value={shot.batch}
            options={BATCH_OPTIONS}
            onChange={(value) => update({ batch: value })}
            hint="Variations generated from the same finished prompt."
          />
        </div>
      </div>

      {/* Spend and submit ------------------------------------------------ */}
      <aside className="space-y-4 lg:sticky lg:top-[4.25rem]">
        {/* The preview is the argument. The reference frame is keyed to the
            subject alone, so choosing a palette or a stock regrades *the same
            picture* rather than fetching a different one — which is the only
            way a side-by-side means anything. The camera move is played on it
            too: the one thing a still frame cannot tell you, and the one thing
            the category makes you render blind to find out. */}
        <div className="border border-rule bg-raised">
          <div className="flex items-baseline justify-between gap-3 border-b border-rule px-4 py-2">
            <p className="label">Preview</p>
            <p className="meta">{shot.aspect}</p>
          </div>
          <div className="p-4">
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
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <p className="label text-ink">{move ? move.label : "Locked off"}</p>
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
            <p className="meta mt-1 min-h-[2.9em]">
              {move
                ? move.note
                : kind === "image"
                  ? "A still has no camera move. Switch to motion to choose one."
                  : "No camera move. Hover any of them to watch it play here."}
            </p>
          </div>
        </div>

        <div className="border border-rule bg-raised p-4">
          <p className="label">Estimated spend</p>
          <p className="mt-1.5 flex items-baseline gap-1.5">
            <TweenNumber
              value={cost}
              unitLabel="credits"
              className="font-mono text-[2.75rem] leading-none text-ink"
            />
            <span className="meta">credits</span>
          </p>
          <dl className="mt-3 space-y-1 border-t border-rule pt-3 font-mono text-[0.6875rem] text-graphite">
            <Row term="Model" value={model ? `${model.cost} cr` : "—"} />
            <Row term="Resolution" value={`×${resolution?.multiplier ?? 1}`} />
            {kind === "video" ? (
              <>
                <Row term="Duration" value={`${shot.duration}s`} />
                <Row term="Sound" value={shot.sound ? "×1.15" : "off"} />
              </>
            ) : null}
            <Row term="Batch" value={`×${shot.batch}`} />
          </dl>
          <p className="meta mt-2">
            An estimate. The server prices the job, and its number is the one charged.
          </p>

          <Button size="lg" className="mt-3.5 w-full" onClick={submit} disabled={!canSubmit}>
            {submitting
              ? "Sending…"
              : `Generate${shot.batch > 1 ? ` ${shot.batch} images` : ""}`}
          </Button>

          {!signedIn ? (
            <p className="meta mt-2">
              <Link href="/sign-in" className="text-ink underline underline-offset-4">
                Sign in
              </Link>{" "}
              to spend credits. Setting a shot up costs nothing.
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 border-l-2 border-vermilion pl-2.5 text-xs text-ink">
              {error.message}
            </p>
          ) : null}
        </div>
      </aside>

      {/* Results --------------------------------------------------------- */}
      {results.length > 0 ? (
        <section className="lg:col-span-2" aria-labelledby="results-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4 border-t border-rule pt-4">
            <h2 id="results-heading" className="font-display text-xl leading-none">
              This session
            </h2>
            <p className="label">
              {results.length} {results.length === 1 ? "frame" : "frames"}
            </p>
          </div>
          <ContactSheet items={results} />
        </section>
      ) : null}
    </div>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{term}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

interface ModelPickerProps {
  models: Catalog["models"];
  value: string;
  onChange: (id: string) => void;
}

function ModelPicker({ models, value, onChange }: ModelPickerProps) {
  const name = useId();
  return (
    <fieldset>
      <legend className="sr-only">Model</legend>
      <div className="grid border-t border-l border-rule sm:grid-cols-2">
        {models.map((entry) => {
          const id = `${name}-${entry.id}`;
          const selected = entry.id === value;
          return (
            <div key={entry.id}>
              <input
                type="radio"
                id={id}
                name={name}
                checked={selected}
                onChange={() => onChange(entry.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={`block h-full cursor-pointer border-r border-b border-rule bg-raised px-3 py-2.5 transition-colors peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-vermilion ${
                  selected ? "shadow-[inset_3px_0_0_var(--vermilion)]" : "hover:bg-sunk"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-[0.9375rem] font-medium text-ink">
                    {selected ? <span aria-hidden className="size-1.5 bg-vermilion" /> : null}
                    {entry.name}
                    {entry.badge ? (
                      <span className="meta border border-rule px-1 py-px">{entry.badge}</span>
                    ) : null}
                  </span>
                  <span className="meta shrink-0">{entry.cost} cr</span>
                </span>
                <span className="mt-0.5 block text-[0.8125rem] leading-snug text-graphite">
                  {entry.tagline}
                </span>
                {entry.strengths.length > 0 ? (
                  <span className="meta mt-1 block">{entry.strengths.join(" · ")}</span>
                ) : null}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
