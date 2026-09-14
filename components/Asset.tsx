"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { findModel, findPreset } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { Generation } from "@/lib/types";
import { Poster } from "./Poster";
import { Badge, Button, Icon } from "./ui";

/* --------------------------------------------------------------------- card */

export function AssetCard({
  item,
  onOpen,
  priority,
}: {
  item: Generation;
  onOpen: (item: Generation) => void;
  priority?: boolean;
}) {
  const { likes, toggleLike } = useStore();
  const model = findModel(item.modelId);
  const camera = findPreset(item.cameraMoveId);
  const effect = findPreset(item.effectId);
  const liked = likes.includes(item.id);

  return (
    <div className="group relative break-inside-avoid">
      <button
        onClick={() => onOpen(item)}
        className="block w-full overflow-hidden rounded-[14px] border border-ink-100/8 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
        aria-label={`Open generation: ${item.prompt.slice(0, 60)}`}
      >
        <Poster
          seed={item.seed}
          aspectId={item.aspectId}
          status={item.status}
          sizes={priority ? 900 : 600}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        >
          {/* Top-left: what made it */}
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {model && (
              <span className="rounded-full bg-black/65 px-2 py-1 text-[10px] font-medium backdrop-blur">
                {model.name}
              </span>
            )}
            {camera && (
              <span className="rounded-full bg-black/65 px-2 py-1 text-[10px] font-medium text-acid backdrop-blur">
                {camera.name}
              </span>
            )}
          </div>

          {/* Duration / type marker, always visible so the grid is scannable */}
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium backdrop-blur">
            <Icon name={item.mode === "video" ? "video" : "image"} className="h-3 w-3" />
            {item.mode === "video" ? `${item.duration}s` : "Still"}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="line-clamp-2 text-[13px] leading-snug text-white/95">
              {item.prompt}
            </p>
            {(item.author || effect) && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/60">
                {item.author && <span>@{item.author}</span>}
                {effect && <span className="text-acid/80">{effect.name}</span>}
              </div>
            )}
          </div>
        </Poster>
      </button>

      {item.likes !== undefined && (
        <button
          onClick={() => toggleLike(item.id)}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1.5 text-[11px] font-medium backdrop-blur transition-colors hover:bg-black/75"
        >
          <Icon
            name="heart"
            className={`h-3.5 w-3.5 ${liked ? "fill-red-400 text-red-400" : "text-white/80"}`}
          />
          {(item.likes + (liked ? 1 : 0)).toLocaleString()}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- detail */

export function AssetDetail({
  item,
  onClose,
}: {
  item: Generation | null;
  onClose: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Stop the page behind the dialog from scrolling.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [item, onClose]);

  if (!item) return null;

  const model = findModel(item.modelId);
  const camera = findPreset(item.cameraMoveId);
  const effect = findPreset(item.effectId);

  /** Loads this generation's exact settings back into the generator. */
  const recreate = () => {
    const params = new URLSearchParams({
      prompt: item.prompt,
      mode: item.mode,
      model: item.modelId,
      aspect: item.aspectId,
      duration: String(item.duration),
    });
    if (item.cameraMoveId) params.set("camera", item.cameraMoveId);
    if (item.effectId) params.set("effect", item.effectId);
    router.push(`/generate?${params.toString()}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generation detail"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[16px] border border-ink-100/10 bg-ink-900 md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-h-0 flex-1 items-center justify-center bg-black p-3">
          <Poster
            seed={item.seed}
            aspectId={item.aspectId}
            status={item.status}
            sizes={1200}
            className="max-h-[70vh] w-auto max-w-full rounded-[10px]"
          />
        </div>

        <div className="w-full shrink-0 overflow-y-auto border-t border-ink-100/8 p-5 md:w-[340px] md:border-l md:border-t-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {model && <Badge tone="accent">{model.name}</Badge>}
              <Badge>{item.mode === "video" ? `${item.duration}s video` : "Image"}</Badge>
              <Badge>{item.aspectId}</Badge>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 -mt-1 rounded-[6px] p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-ink-100">{item.prompt}</p>

          {(camera || effect) && (
            <div className="mt-4 space-y-2">
              {camera && <DetailRow label="Camera" value={camera.name} />}
              {effect && <DetailRow label="Effect" value={effect.name} />}
            </div>
          )}

          <div className="mt-4 rounded-[10px] border border-ink-100/8 bg-ink-850 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500">
              Full prompt sent
            </p>
            <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-ink-300">
              {item.composedPrompt}
            </p>
          </div>

          {item.author && (
            <p className="mt-4 text-[13px] text-ink-400">
              Created by <span className="text-ink-100">@{item.author}</span>
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <Button onClick={recreate} className="flex-1">
              <Icon name="recreate" className="h-4 w-4" />
              Recreate
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-500">
            Loads these exact settings into the generator
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-ink-500">{label}</span>
      <span className="text-ink-100">{value}</span>
    </div>
  );
}
