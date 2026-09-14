"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import {
  ASPECT_RATIOS,
  CAMERA_MOVES,
  COLOR_PALETTES,
  DURATIONS,
  EFFECTS,
  FILM_SETUPS,
  LIGHTING,
  RESOLUTIONS,
  composePrompt,
  creditCost,
  findModel,
  findPreset,
  modelsForMode,
  type Duration,
  type GenerationSettings,
  type Mode,
  type Preset,
} from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { Generation } from "@/lib/types";
import { AssetDetail } from "./Asset";
import { Poster } from "./Poster";
import { PresetPicker } from "./PresetPicker";
import { Badge, Button, Icon } from "./ui";

const STARTERS = [
  "A lone figure in a red trench coat crossing a flooded Tokyo intersection at night, neon reflections",
  "Vintage F1 car mid-corner, tyre smoke lit by low afternoon sun",
  "Ballet dancer suspended mid-leap in an abandoned theatre, dust in the air",
  "Giant jellyfish drifting between skyscrapers at dusk",
  "Editorial portrait, wet hair, harsh single flash against raw concrete",
];

const DEFAULTS: GenerationSettings = {
  mode: "video",
  modelId: "seedance-2-5",
  prompt: "",
  cameraMoveId: null,
  effectId: null,
  filmSetupId: null,
  paletteId: null,
  lightingId: null,
  aspectId: "16:9",
  resolutionId: "1080p",
  duration: 5,
  sound: true,
  quality: "standard",
  batch: 1,
};

/** The look families, in the order the live product lays them out. */
const FAMILIES = [
  { key: "filmSetupId", label: "Film setup", presets: FILM_SETUPS, videoOnly: false },
  { key: "cameraMoveId", label: "Camera", presets: CAMERA_MOVES, videoOnly: true },
  { key: "paletteId", label: "Color palette", presets: COLOR_PALETTES, videoOnly: false },
  { key: "lightingId", label: "Lighting", presets: LIGHTING, videoOnly: false },
  { key: "effectId", label: "Effect", presets: EFFECTS, videoOnly: false },
] as const;

type FamilyKey = (typeof FAMILIES)[number]["key"];

/**
 * Builds the opening form state from "Recreate" / "Use preset" links.
 *
 * Everything is validated rather than trusted: a hand-edited URL naming a model
 * that does not exist, or an image model in video mode, falls back to a coherent
 * default instead of putting the form into a state that cannot be submitted.
 */
function fromParams(params: ReadonlyURLSearchParams): GenerationSettings {
  if (params.size === 0) return DEFAULTS;

  const mode: Mode = params.get("mode") === "image" ? "image" : "video";
  const requested = findModel(params.get("model") ?? "");
  const aspect = params.get("aspect");
  const duration = Number(params.get("duration"));
  const valid = (id: string | null, list: Preset[]) =>
    id && list.some((p) => p.id === id) ? id : null;

  return {
    mode,
    modelId:
      requested && requested.mode === mode ? requested.id : modelsForMode(mode)[0].id,
    prompt: (params.get("prompt") ?? "").slice(0, 2000),
    cameraMoveId: mode === "video" ? valid(params.get("camera"), CAMERA_MOVES) : null,
    effectId: valid(params.get("effect"), EFFECTS),
    filmSetupId: valid(params.get("film"), FILM_SETUPS),
    paletteId: valid(params.get("palette"), COLOR_PALETTES),
    lightingId: valid(params.get("light"), LIGHTING),
    aspectId: ASPECT_RATIOS.some((a) => a.id === aspect) ? aspect! : "16:9",
    resolutionId: "1080p",
    duration: (DURATIONS as readonly number[]).includes(duration)
      ? (duration as Duration)
      : 5,
    sound: mode === "video",
    quality: "standard",
    batch: 1,
  };
}

export function Generator() {
  const router = useRouter();
  const params = useSearchParams();
  const { account, ready, generations, addGenerations, updateGeneration, removeGeneration } =
    useStore();

  // Initialised straight from the URL rather than copied in by an effect.
  // useSearchParams forces this subtree to render on the client, so there is no
  // server pass to disagree with.
  const [settings, setSettings] = useState<GenerationSettings>(() => fromParams(params));
  const [picker, setPicker] = useState<FamilyKey | null>(null);
  const [refs, setRefs] = useState<{ id: string; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<Generation | null>(null);
  const [serverMode, setServerMode] = useState<"live" | "demo" | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  // Object URLs for reference previews are not reclaimed on their own, and the
  // list is tracked in a ref (mutated only in handlers) so unmount can revoke
  // every one without re-running on each change and freeing URLs still in use.
  const liveUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = liveUrls;
    return () => urls.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  // Say up front whether this deployment really generates.
  useEffect(() => {
    fetch("/api/generate")
      .then((r) => r.json())
      .then((d) => setServerMode(d.mode))
      .catch(() => setServerMode("demo"));
  }, []);

  // Settings are already loaded; strip the query string so a refresh cannot
  // re-apply a stale preset link over edits made since.
  const arrivedWithParams = useRef(params.size > 0);
  useEffect(() => {
    if (arrivedWithParams.current) {
      arrivedWithParams.current = false;
      router.replace("/generate", { scroll: false });
    }
  }, [router]);

  const patch = useCallback(
    (next: Partial<GenerationSettings>) => setSettings((s) => ({ ...s, ...next })),
    []
  );

  const switchMode = (mode: Mode) => {
    const model = modelsForMode(mode)[0];
    patch({
      mode,
      modelId: model.id,
      // Camera moves and an audio bed only mean something on video.
      cameraMoveId: mode === "image" ? null : settings.cameraMoveId,
      sound: mode === "video" ? settings.sound : false,
      aspectId: mode === "video" ? "16:9" : "3:4",
    });
  };

  const cost = creditCost(settings);
  const credits = account?.credits ?? 0;
  const affordable = credits >= cost;
  const hasPrompt = settings.prompt.trim().length > 0;
  const canSubmit = ready && Boolean(account) && hasPrompt && affordable && !busy;
  const preview = useMemo(() => composePrompt(settings), [settings]);
  const activeFamily = FAMILIES.find((f) => f.key === picker);

  const addRefs = (files: FileList | null) => {
    if (!files) return;
    const picked = [...files]
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 50 - refs.length)
      .map((f) => ({
        id: `${f.name}-${f.size}-${Math.random()}`,
        url: URL.createObjectURL(f),
      }));
    liveUrls.current.push(...picked.map((p) => p.url));
    setRefs((r) => [...r, ...picked]);
  };

  const clearRefs = () => {
    liveUrls.current.forEach((u) => URL.revokeObjectURL(u));
    liveUrls.current = [];
    setRefs([]);
  };

  /** Demo renders resolve on a timer; live ones arrive already finished. */
  const simulate = useCallback(
    (id: string, mode: Mode) => {
      const t1 = setTimeout(() => updateGeneration(id, { status: "rendering" }), 500);
      const t2 = setTimeout(
        () => updateGeneration(id, { status: "ready" }),
        mode === "video" ? 3200 + Math.random() * 1800 : 1600 + Math.random() * 1200
      );
      timers.current.push(t1, t2);
    },
    [updateGeneration]
  );

  const generate = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setNotice(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, referenceCount: refs.length }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNotice(data.error ?? "Generation failed.");
        return;
      }

      const stamp = Date.now();
      const items: Generation[] = data.items.map(
        (
          item: { seed: string; mediaUrl: string | null; status: Generation["status"] },
          i: number
        ) => ({
          id: `g_${stamp.toString(36)}_${i}`,
          prompt: settings.prompt.trim(),
          composedPrompt: data.composedPrompt,
          mode: settings.mode,
          modelId: settings.modelId,
          cameraMoveId: settings.cameraMoveId,
          effectId: settings.effectId,
          aspectId: settings.aspectId,
          duration: settings.duration,
          quality: settings.quality,
          status: item.status,
          seed: item.seed,
          mediaUrl: item.mediaUrl,
          createdAt: stamp + i,
          credits: Math.round(cost / settings.batch),
        })
      );

      addGenerations(items, cost);
      if (data.mode === "demo") {
        items.forEach((g) => simulate(g.id, settings.mode));
        if (data.reason) setNotice(data.reason);
      }
    } catch {
      setNotice("Could not reach the generator. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 lg:py-10">
      {/* ------------------------------------------------------------- header */}
      <div className="mb-6 flex items-center justify-center gap-3">
        <h1 className="display text-center text-2xl font-bold uppercase tracking-[0.02em] text-ink-300 sm:text-3xl">
          Bring your stories to life
        </h1>
        {serverMode && (
          <Badge tone={serverMode === "live" ? "live" : "neutral"}>
            {serverMode === "live" ? "Live" : "Demo"}
          </Badge>
        )}
      </div>

      {/* --------------------------------------------------------- look chips */}
      <div className="mb-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <ReferenceChip refs={refs} onAdd={addRefs} onClear={clearRefs} />
        {FAMILIES.filter((f) => !(f.videoOnly && settings.mode === "image")).map((f) => (
          <LookChip
            key={f.key}
            label={f.label}
            preset={findPreset(settings[f.key])}
            onClick={() => setPicker(f.key)}
            onClear={() => patch({ [f.key]: null } as Partial<GenerationSettings>)}
          />
        ))}
      </div>

      {/* -------------------------------------------------------- command bar */}
      <div className="flex items-stretch gap-2">
        {/* Mode rail, vertical on the left edge as on the original */}
        <div className="flex shrink-0 flex-col gap-1 rounded-[12px] border border-ink-100/8 bg-ink-850 p-1">
          {(["image", "video"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              aria-pressed={settings.mode === m}
              className={`flex h-[52px] w-[54px] flex-col items-center justify-center gap-1 rounded-[9px] text-[10px] font-medium capitalize transition-colors ${
                settings.mode === m
                  ? "bg-ink-750 text-ink-100"
                  : "text-ink-500 hover:text-ink-200"
              }`}
            >
              <Icon name={m} className="h-4 w-4" />
              {m}
            </button>
          ))}
        </div>

        <div className="min-w-0 flex-1 rounded-[12px] border border-ink-100/8 bg-ink-850">
          <div className="flex items-start gap-2 p-2.5">
            <textarea
              value={settings.prompt}
              onChange={(e) => patch({ prompt: e.target.value.slice(0, 2000) })}
              rows={2}
              placeholder="Describe your scene — subject, setting, light, mood…"
              className="min-h-[56px] w-full flex-1 resize-none bg-transparent px-1 py-1 text-[14px] leading-relaxed outline-none placeholder:text-ink-500"
            />

            {!ready ? (
              <Button disabled size="lg" className="shrink-0">
                Loading
              </Button>
            ) : !account ? (
              <Link href="/signup" className="shrink-0">
                <GenerateButton label="Sign up" cost={cost} />
              </Link>
            ) : !affordable ? (
              <Link href="/pricing" className="shrink-0">
                <GenerateButton label="Upgrade" cost={cost} muted />
              </Link>
            ) : (
              <button
                onClick={generate}
                disabled={!canSubmit}
                className="shrink-0 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <GenerateButton label={busy ? "Sending" : "Generate"} cost={cost} />
              </button>
            )}
          </div>

          {/* ------------------------------------------------------- toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-ink-100/8 px-2.5 py-2">
            <Menu label={findModel(settings.modelId)?.name ?? "Model"} icon="layers" wide>
              {(close) =>
                modelsForMode(settings.mode).map((m) => (
                  <MenuItem
                    key={m.id}
                    active={m.id === settings.modelId}
                    onClick={() => {
                      patch({ modelId: m.id });
                      close();
                    }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">{m.name}</span>
                      <span className="block truncate text-[11px] text-ink-500">
                        {m.tagline}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-ink-500">
                      {m.cost}cr
                    </span>
                  </MenuItem>
                ))
              }
            </Menu>

            <Menu label={settings.resolutionId}>
              {(close) =>
                RESOLUTIONS.map((r) => (
                  <MenuItem
                    key={r.id}
                    active={r.id === settings.resolutionId}
                    onClick={() => {
                      patch({ resolutionId: r.id });
                      close();
                    }}
                  >
                    <span className="flex-1 text-[13px]">{r.label}</span>
                    <span className="text-[11px] text-ink-500">×{r.multiplier}</span>
                  </MenuItem>
                ))
              }
            </Menu>

            <Menu label={settings.aspectId}>
              {(close) =>
                ASPECT_RATIOS.map((a) => (
                  <MenuItem
                    key={a.id}
                    active={a.id === settings.aspectId}
                    onClick={() => {
                      patch({ aspectId: a.id });
                      close();
                    }}
                  >
                    <span className="flex-1 text-[13px]">{a.label}</span>
                    <span className="text-[11px] text-ink-500">{a.use}</span>
                  </MenuItem>
                ))
              }
            </Menu>

            {settings.mode === "video" && (
              <>
                <Menu label={`${settings.duration}s`}>
                  {(close) =>
                    DURATIONS.map((d) => (
                      <MenuItem
                        key={d}
                        active={d === settings.duration}
                        onClick={() => {
                          patch({ duration: d });
                          close();
                        }}
                      >
                        <span className="flex-1 text-[13px]">{d} seconds</span>
                      </MenuItem>
                    ))
                  }
                </Menu>

                <button
                  onClick={() => patch({ sound: !settings.sound })}
                  aria-pressed={settings.sound}
                  title="Generated audio bed"
                  className={`flex h-8 items-center gap-1.5 rounded-[7px] border px-2.5 text-[12px] transition-colors ${
                    settings.sound
                      ? "border-ink-600 text-ink-100"
                      : "border-ink-700 text-ink-500"
                  }`}
                >
                  <Icon
                    name={settings.sound ? "sound-on" : "sound-off"}
                    className="h-3.5 w-3.5"
                  />
                  {settings.sound ? "On" : "Off"}
                </button>
              </>
            )}

            {/* Batch stepper */}
            <div className="flex h-8 items-center gap-1 rounded-[7px] border border-ink-700 px-1">
              <button
                onClick={() => patch({ batch: Math.max(1, settings.batch - 1) })}
                disabled={settings.batch <= 1}
                aria-label="Fewer takes"
                className="grid h-6 w-6 place-items-center rounded-[5px] text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100 disabled:opacity-35"
              >
                <Icon name="minus" className="h-3 w-3" />
              </button>
              <span className="min-w-[28px] text-center text-[12px] tabular-nums text-ink-200">
                {settings.batch}/4
              </span>
              <button
                onClick={() => patch({ batch: Math.min(4, settings.batch + 1) })}
                disabled={settings.batch >= 4}
                aria-label="More takes"
                className="grid h-6 w-6 place-items-center rounded-[5px] text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100 disabled:opacity-35"
              >
                <Icon name="plus" className="h-3 w-3" />
              </button>
            </div>

            <button
              onClick={() =>
                patch({ prompt: STARTERS[Math.floor(Math.random() * STARTERS.length)] })
              }
              className="ml-auto text-[12px] text-ink-500 transition-colors hover:text-acid"
            >
              Surprise me →
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <p className="mt-2.5 rounded-[8px] border border-acid/25 bg-acid/8 px-3 py-2 text-[12px] text-acid">
          {notice}
        </p>
      )}

      {/* Composed prompt — shows exactly what the presets appended */}
      {hasPrompt && preview !== settings.prompt.trim() && (
        <div className="mt-2.5 rounded-[10px] border border-ink-100/8 bg-ink-900 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-500">
            Sent to model
          </p>
          <p className="mt-1 font-mono text-[11.5px] leading-relaxed text-ink-300">
            {preview}
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------ results */}
      <div className="mt-8">
        {generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-5 flex -space-x-6">
              {["opening-shot-a", "opening-shot-b", "opening-shot-c"].map((s, i) => (
                <div
                  key={s}
                  className="w-24 overflow-hidden rounded-[10px] border border-ink-100/10 shadow-2xl"
                  style={{ transform: `rotate(${(i - 1) * 7}deg)` }}
                >
                  <Poster seed={s} aspectId="9:16" sizes={240} />
                </div>
              ))}
            </div>
            <h2 className="display text-xl font-semibold">Direct the shot</h2>
            <p className="mt-2 max-w-sm text-sm text-ink-400">
              Write a prompt, set the look, and generate. Everything you make lands here
              and in Projects.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">
                Your generations
                <span className="ml-2 text-[13px] font-normal text-ink-500">
                  {generations.length}
                </span>
              </h2>
              <Link
                href="/projects"
                className="text-[13px] text-ink-400 transition-colors hover:text-ink-100"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {generations.map((g) => (
                <ResultTile
                  key={g.id}
                  item={g}
                  onOpen={() => g.status === "ready" && setOpen(g)}
                  onRemove={() => removeGeneration(g.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {activeFamily && (
        <PresetPicker
          open
          title={activeFamily.label}
          presets={activeFamily.presets as unknown as Preset[]}
          selectedId={settings[activeFamily.key]}
          onSelect={(id) => patch({ [activeFamily.key]: id } as Partial<GenerationSettings>)}
          onClose={() => setPicker(null)}
        />
      )}
      <AssetDetail item={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------- pieces */

function GenerateButton({
  label,
  cost,
  muted,
}: {
  label: string;
  cost: number;
  muted?: boolean;
}) {
  return (
    <span
      className={`flex h-[56px] min-w-[104px] flex-col items-center justify-center rounded-[9px] px-4 text-[13px] font-semibold uppercase tracking-wide transition-all ${
        muted ? "bg-ink-700 text-ink-200" : "bg-acid text-ink-950 hover:brightness-110"
      }`}
    >
      {label}
      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium normal-case opacity-70">
        <Icon name="spark" className="h-3 w-3" />
        {cost}
      </span>
    </span>
  );
}

/** A look family chip: thumbnail, family name, and the chosen value. */
function LookChip({
  label,
  preset,
  onClick,
  onClear,
}: {
  label: string;
  preset?: Preset;
  onClick: () => void;
  onClear: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-[10px] border p-1.5 transition-colors ${
        preset ? "border-acid/45 bg-acid/[0.06]" : "border-ink-100/8 bg-ink-850"
      }`}
    >
      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="h-8 w-8 shrink-0 overflow-hidden rounded-[6px]">
          <Poster seed={preset?.id ?? `empty-${label}`} aspectId="1:1" sizes={64} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] text-ink-500">{label}</span>
          <span className="block truncate text-[12px] font-medium text-ink-100">
            {preset?.name ?? "Auto"}
          </span>
        </span>
      </button>
      {preset && (
        <button
          onClick={onClear}
          aria-label={`Clear ${label}`}
          className="mr-0.5 shrink-0 text-ink-500 transition-colors hover:text-ink-100"
        >
          <Icon name="close" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function ReferenceChip({
  refs,
  onAdd,
  onClear,
}: {
  refs: { id: string; url: string }[];
  onAdd: (files: FileList | null) => void;
  onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      className={`flex items-center gap-2 rounded-[10px] border p-1.5 transition-colors ${
        refs.length ? "border-acid/45 bg-acid/[0.06]" : "border-ink-100/8 bg-ink-850"
      }`}
    >
      <button
        onClick={() => input.current?.click()}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[6px] bg-ink-800">
          {refs[0] ? (
            // Local object URL for a file the user just picked; nothing for the
            // image optimiser to do here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={refs[0].url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon name="plus" className="h-4 w-4 text-ink-400" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] text-ink-500">References</span>
          <span className="block truncate text-[12px] font-medium text-ink-100">
            {refs.length}/50
          </span>
        </span>
      </button>
      {refs.length > 0 && (
        <button
          onClick={onClear}
          aria-label="Clear references"
          className="mr-0.5 shrink-0 text-ink-500 transition-colors hover:text-ink-100"
        >
          <Icon name="close" className="h-3.5 w-3.5" />
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Toolbar dropdown. Closes on outside click and on Escape. */
function Menu({
  label,
  icon,
  wide,
  children,
}: {
  label: string;
  icon?: string;
  wide?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-[7px] border border-ink-700 px-2.5 text-[12px] text-ink-100 transition-colors hover:border-ink-500"
      >
        {icon && <Icon name={icon} className="h-3.5 w-3.5 text-ink-400" />}
        {label}
        <Icon name="chevron" className="h-3 w-3 rotate-90 text-ink-500" />
      </button>

      {open && (
        <div
          className={`absolute bottom-full left-0 z-40 mb-1.5 overflow-hidden rounded-[10px] border border-ink-100/10 bg-ink-850 py-1 shadow-2xl ${
            wide ? "w-[260px]" : "w-[190px]"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-ink-800 ${
        active ? "text-acid" : "text-ink-100"
      }`}
    >
      {children}
      {active && <Icon name="check" className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );
}

function ResultTile({
  item,
  onOpen,
  onRemove,
}: {
  item: Generation;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const model = findModel(item.modelId);
  const busy = item.status === "queued" || item.status === "rendering";

  return (
    <div className="group relative rise">
      <button
        onClick={onOpen}
        disabled={busy}
        className="block w-full overflow-hidden rounded-[12px] border border-ink-100/8 text-left disabled:cursor-progress"
      >
        <Poster seed={item.seed} aspectId={item.aspectId} status={item.status} sizes={500}>
          {busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-acid pulse-dot" />
              <span className="text-[11px] font-medium capitalize text-white/85">
                {item.status}
              </span>
            </div>
          )}
          {!busy && (
            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <p className="line-clamp-2 text-[12px] leading-snug text-white/95">
                {item.prompt}
              </p>
              {model && <p className="mt-1 text-[10px] text-white/55">{model.name}</p>}
            </div>
          )}
        </Poster>
      </button>

      {!busy && (
        <button
          onClick={onRemove}
          aria-label="Delete generation"
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 opacity-0 backdrop-blur transition-opacity hover:bg-black/85 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Icon name="close" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
