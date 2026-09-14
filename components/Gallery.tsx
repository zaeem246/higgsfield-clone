"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MODELS } from "@/lib/catalog";
import type { Generation } from "@/lib/types";
import { AssetCard, AssetDetail } from "./Asset";
import { Button, Chip, EmptyState, Icon } from "./ui";

type Sort = "popular" | "recent";

/**
 * Masonry wall of generations, shared by Explore and Projects.
 *
 * Masonry rather than a fixed grid because the catalog spans 9:16 to 21:9 — a
 * uniform grid would either crop the anamorphic shots or leave holes under the
 * portrait ones.
 */
export function Gallery({
  items,
  title,
  subtitle,
  emptyTitle,
  emptyBody,
  showSort = true,
}: {
  items: Generation[];
  title: string;
  subtitle?: string;
  emptyTitle: string;
  emptyBody: string;
  showSort?: boolean;
}) {
  const [mode, setMode] = useState<"all" | "video" | "image">("all");
  const [modelId, setModelId] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("popular");
  const [open, setOpen] = useState<Generation | null>(null);

  const visible = useMemo(() => {
    let list = items;
    if (mode !== "all") list = list.filter((i) => i.mode === mode);
    if (modelId) list = list.filter((i) => i.modelId === modelId);
    return [...list].sort((a, b) =>
      sort === "popular" && a.likes !== undefined && b.likes !== undefined
        ? b.likes - a.likes
        : b.createdAt - a.createdAt
    );
  }, [items, mode, modelId, sort]);

  // Only offer model filters for models actually present in this set.
  const models = useMemo(
    () => MODELS.filter((m) => items.some((i) => i.modelId === m.id)),
    [items]
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="display text-2xl font-semibold lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-400">{subtitle}</p>}
      </div>

      {items.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          {(["all", "video", "image"] as const).map((m) => (
            <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
              <span className="capitalize">{m}</span>
            </Chip>
          ))}

          {models.length > 1 && (
            <>
              <span className="mx-1 h-4 w-px bg-ink-700" />
              {models.map((m) => (
                <Chip
                  key={m.id}
                  active={modelId === m.id}
                  onClick={() => setModelId(modelId === m.id ? null : m.id)}
                >
                  {m.name}
                </Chip>
              ))}
            </>
          )}

          {showSort && (
            <div className="ml-auto flex items-center gap-1.5">
              {(["popular", "recent"] as Sort[]).map((s) => (
                <Chip key={s} active={sort === s} onClick={() => setSort(s)}>
                  <span className="capitalize">{s}</span>
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? emptyTitle : "Nothing matches those filters"}
          body={
            items.length === 0
              ? emptyBody
              : "Try clearing the model or media type filter."
          }
          action={
            items.length === 0 ? (
              <Link href="/generate">
                <Button>
                  <Icon name="wand" className="h-4 w-4" />
                  Start generating
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setMode("all");
                  setModelId(null);
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="columns-2 gap-3 md:columns-3 xl:columns-4 [&>*]:mb-3">
          {visible.map((item, i) => (
            <AssetCard key={item.id} item={item} onOpen={setOpen} priority={i < 4} />
          ))}
        </div>
      )}

      <AssetDetail item={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/** Projects wraps Gallery with the user's own set and a live count. */
export function ProjectsGallery({ items }: { items: Generation[] }) {
  const ready = items.filter((i) => i.status === "ready").length;
  return (
    <Gallery
      items={items}
      title="Projects"
      subtitle={
        items.length
          ? `${items.length} generation${items.length === 1 ? "" : "s"} · ${ready} ready`
          : undefined
      }
      emptyTitle="Nothing here yet"
      emptyBody="Everything you generate is saved to this browser. Make your first shot and it will appear here."
      showSort={false}
    />
  );
}
