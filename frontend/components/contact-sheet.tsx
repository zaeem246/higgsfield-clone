"use client";

import { Frame } from "@/components/frame";
import { RenderState } from "@/components/render-state";
import type { Generation } from "@/lib/types";

function frameNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** `2026-09-25T…` → `25.09.26`, printed like a slate rather than a sentence. */
function slateDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${String(date.getFullYear()).slice(2)}`;
}

interface ContactSheetProps {
  items: Generation[];
  /** Offset for the printed frame numbers when a sheet continues another. */
  startIndex?: number;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}

/**
 * How generations are shown: numbered frames with every setting printed
 * underneath in small mono, a hairline between rows. A contact sheet, not a
 * masonry wall — and nothing is hidden behind a hover.
 */
export function ContactSheet({
  items,
  startIndex = 0,
  onDelete,
  deletingId = null,
}: ContactSheetProps) {
  return (
    <ol className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <li key={item.id} className="border-t border-rule pt-3">
          <Frame
            seed={item.seed}
            aspect={item.aspect}
            status={item.status}
            mediaUrl={item.mediaUrl}
            paletteId={item.paletteId}
            lightId={item.lightId}
            filmId={item.filmId}
            cameraId={item.cameraId}
            effectId={item.effectId}
            kind={item.kind}
          >
            <span className="absolute top-1.5 left-1.5 bg-[var(--paper)] px-1.5 py-0.5 font-mono text-[0.625rem] tracking-[0.12em] text-ink">
              {frameNumber(startIndex + index)}
            </span>
          </Frame>

          <div className="mt-2.5">
            <div className="flex items-start justify-between gap-3">
              <RenderState status={item.status} />
              <span className="meta shrink-0 text-ink">{item.creditsSpent} cr</span>
            </div>

            <p className="mt-2 line-clamp-2 text-[0.8125rem] leading-snug text-ink">
              {item.prompt}
            </p>

            <p className="meta mt-1.5">{slate(item).join(" · ")}</p>

            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                disabled={deletingId === item.id}
                className="meta mt-1.5 underline underline-offset-4 hover:text-ink disabled:opacity-50"
              >
                {deletingId === item.id ? "Removing…" : "Remove"}
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Everything that identifies a frame a week later, printed rather than hovered. */
function slate(item: Generation): string[] {
  const fields = [item.modelName, item.aspect, item.resolution];
  if (item.kind === "video") {
    fields.push(`${item.duration}s`);
    if (item.sound) fields.push("sound");
  }
  fields.push(`#${item.seed.slice(0, 6)}`, slateDate(item.createdAt));
  return fields;
}
