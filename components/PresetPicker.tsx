"use client";

import { useEffect, useMemo, useState } from "react";
import { groupBy, type Preset } from "@/lib/catalog";
import { Poster } from "./Poster";
import { Icon } from "./ui";

interface Props {
  open: boolean;
  title: string;
  presets: Preset[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}

/**
 * Modal browser for camera moves and effects.
 *
 * A select element would hide 50-odd presets behind a scroll, and these are
 * visual choices — you pick "Crash Zoom In" because you can see what it does.
 * So: searchable, grouped, and every option carries a thumbnail.
 */
export function PresetPicker(props: Props) {
  // Mounting the body only while open means its search box resets naturally on
  // each open, instead of being cleared by an effect after the fact.
  if (!props.open) return null;
  return <PresetPickerBody {...props} />;
}

function PresetPickerBody({
  title,
  presets,
  selectedId,
  onSelect,
  onClose,
}: Omit<Props, "open">) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // Stop the page behind the dialog from scrolling.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[16px] border border-ink-100/10 bg-ink-900 sm:rounded-[16px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-ink-100/8 p-4">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <div className="ml-auto flex items-center gap-2">
            {selectedId && (
              <button
                onClick={() => {
                  onSelect(null);
                  onClose();
                }}
                className="rounded-[6px] px-2.5 py-1.5 text-[13px] text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-[6px] p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-ink-100/8 p-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search presets…"
            className="h-10 w-full rounded-[8px] border border-ink-700 bg-ink-850 px-3 text-sm outline-none transition-colors placeholder:text-ink-500 focus:border-ink-500"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {groups.length === 0 && (
            <p className="py-12 text-center text-sm text-ink-400">
              No presets match “{query}”.
            </p>
          )}

          {groups.map(([group, items]) => (
            <section key={group} className="mb-6 last:mb-0">
              <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500">
                {group}
              </h3>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {items.map((p) => {
                  const active = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelect(p.id);
                        onClose();
                      }}
                      title={p.promptFragment}
                      className={`group relative overflow-hidden rounded-[10px] border text-left transition-colors ${
                        active ? "border-acid" : "border-ink-100/8 hover:border-ink-500"
                      }`}
                    >
                      <Poster seed={p.id} aspectId="16:9" sizes={320}>
                        <div className="absolute inset-x-0 bottom-0 p-2">
                          <p className="text-[12px] font-medium leading-tight text-white">
                            {p.name}
                          </p>
                        </div>
                        {active && (
                          <div className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-acid text-ink-950">
                            <Icon name="check" className="h-3 w-3" />
                          </div>
                        )}
                      </Poster>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
