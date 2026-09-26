"use client";

import { useId, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { byGroup, FAMILY_META } from "@/lib/catalog";
import type { Preset, PresetFamily } from "@/lib/types";

/** Kept short so the composer stays one readable column until asked otherwise. */
const COLLAPSED = 10;

interface PresetRailProps {
  family: PresetFamily;
  presets: Preset[];
  value: string | null;
  onChange: (id: string | null) => void;
  /** Camera moves are meaningless on a still, so the rail says so rather than hiding. */
  disabledReason?: string;
  /**
   * Called with the preset under the pointer or focus, and with null when it
   * leaves. The composer wires this on the camera rail so the preview plate
   * performs a move while you are still deciding whether to take it.
   */
  onPreview?: (id: string | null) => void;
}

export function PresetRail({
  family,
  presets,
  value,
  onChange,
  disabledReason,
  onPreview,
}: PresetRailProps) {
  const [expanded, setExpanded] = useState(false);
  const groupId = useId();
  const meta = FAMILY_META[family];

  if (presets.length === 0) return null;

  function toggle(id: string) {
    onChange(value === id ? null : id);
  }

  const collapsedList = presets.slice(0, COLLAPSED);
  const hiddenCount = presets.length - collapsedList.length;
  const chosen = presets.find((preset) => preset.id === value) ?? null;

  return (
    <section
      aria-labelledby={groupId}
      className="border-t border-rule py-3 first:border-t-0 first:pt-0"
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <h3 id={groupId} className="label">
          {meta.label}
        </h3>
        <p className="meta">{disabledReason ?? meta.blurb}</p>
      </div>

      {disabledReason ? null : (
        <>
          {expanded ? (
            <div className="space-y-2.5">
              {byGroup(presets).map(([group, items]) => (
                <div key={group} className="flex flex-wrap items-center gap-1.5">
                  <span className="meta w-full sm:w-auto sm:min-w-28">{group}</span>
                  {items.map((preset) => (
                    <Chip
                      key={preset.id}
                      selected={value === preset.id}
                      onClick={() => toggle(preset.id)}
                      onPreview={
                        onPreview ? (active) => onPreview(active ? preset.id : null) : undefined
                      }
                    >
                      {preset.name}
                    </Chip>
                  ))}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="meta underline underline-offset-4 hover:text-ink"
              >
                Show fewer
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {collapsedList.map((preset) => (
                <Chip
                  key={preset.id}
                  selected={value === preset.id}
                  onClick={() => toggle(preset.id)}
                  onPreview={
                    onPreview ? (active) => onPreview(active ? preset.id : null) : undefined
                  }
                >
                  {preset.name}
                </Chip>
              ))}
              {hiddenCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="meta px-1.5 py-1 underline underline-offset-4 hover:text-ink"
                >
                  +{hiddenCount} more
                </button>
              ) : null}
            </div>
          )}

          {/* The exact text a chip adds, printed on screen rather than kept in
              a tooltip. The height is reserved so choosing never jogs the page. */}
          <p className="meta mt-1.5 min-h-[1.45em] truncate">
            {chosen ? (
              <>
                <span aria-hidden className="text-vermilion">
                  +{" "}
                </span>
                <span className="text-ink">{chosen.fragment}</span>
              </>
            ) : (
              <span aria-hidden>—</span>
            )}
          </p>
        </>
      )}
    </section>
  );
}
