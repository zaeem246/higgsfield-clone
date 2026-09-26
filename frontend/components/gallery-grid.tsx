"use client";

import Link from "next/link";
import { useState } from "react";
import { Frame } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cameraMove } from "@/lib/camera-moves";
import { recreateHref } from "@/lib/shot";
import type { Generation } from "@/lib/types";

interface GalleryGridProps {
  initialItems: Generation[];
  initialCursor: string | null;
  signedIn: boolean;
}

/**
 * One result in the feed. Hovering it lifts it off the ground and performs the
 * camera move the shot was actually made with — the move is stored on the
 * generation, so the feed is a catalogue of moves as much as of grades. Its
 * own hover state lives here rather than in the grid so that pointing at one
 * image does not re-render the other nineteen.
 */
function GalleryTile({ item }: { item: Generation }) {
  const [hovered, setHovered] = useState(false);
  const move = item.kind === "video" ? cameraMove(item.cameraId) : null;

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
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
        className="plate-lift"
        play={move && hovered ? "loop" : "off"}
      />
      {move ? (
        <p className="meta mt-1.5 flex items-baseline justify-between gap-3">
          <span className={hovered ? "text-ink" : undefined}>{move.label}</span>
          <span aria-hidden className={hovered ? "text-vermilion" : "opacity-0"}>
            playing
          </span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * The public feed: large images, the prompt set as a serif caption, credited
 * to its author. Liking is optimistic and rolls back if the API disagrees,
 * because the round trip is long enough to feel broken otherwise.
 */
export function GalleryGrid({ initialItems, initialCursor, signedIn }: GalleryGridProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggleLike(item: Generation) {
    const next = !item.likedByMe;
    setItems((previous) =>
      previous.map((entry) =>
        entry.id === item.id
          ? { ...entry, likedByMe: next, likes: entry.likes + (next ? 1 : -1) }
          : entry,
      ),
    );

    const result = await api.setLiked(item.id, next);
    if (result.ok) {
      setItems((previous) =>
        previous.map((entry) =>
          entry.id === item.id
            ? { ...entry, likedByMe: result.data.liked, likes: result.data.likes }
            : entry,
        ),
      );
      return;
    }

    setItems((previous) => previous.map((entry) => (entry.id === item.id ? item : entry)));
    setMessage(result.error.message);
  }

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    const result = await api.feed({ cursor });
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }
    setItems((previous) => [...previous, ...result.data.items]);
    setCursor(result.data.nextCursor);
  }

  return (
    <div>
      <ul className="gap-x-6 md:columns-2 xl:columns-3">
        {items.map((item) => (
          <li key={item.id} className="mb-8 break-inside-avoid">
            <figure>
              <GalleryTile item={item} />

              <figcaption className="mt-2.5 border-t border-rule pt-2">
                <p className="font-display text-[1.375rem] leading-tight text-ink">{item.prompt}</p>
                <p className="meta mt-1.5">
                  {item.author?.name ?? "Anonymous"} · {item.modelName} · {item.aspect} ·{" "}
                  {item.resolution}
                  {item.kind === "video" ? ` · ${item.duration}s` : ""}
                  {item.kind === "video" && item.sound ? " · sound" : ""} · #{item.seed.slice(0, 6)}
                </p>

                <div className="mt-2 flex items-center gap-4">
                  {signedIn ? (
                    <button
                      type="button"
                      onClick={() => toggleLike(item)}
                      aria-pressed={item.likedByMe}
                      className={`springy flex items-center gap-1.5 font-mono text-xs ${
                        item.likedByMe ? "text-vermilion" : "text-graphite hover:text-ink"
                      }`}
                    >
                      <span aria-hidden>{item.likedByMe ? "◆" : "◇"}</span>
                      <span>
                        {item.likes} <span className="sr-only">likes;</span>
                        {item.likedByMe ? " liked" : " like"}
                      </span>
                    </button>
                  ) : (
                    <Link
                      href="/sign-in"
                      className="font-mono text-xs text-graphite hover:text-ink"
                    >
                      ◇ {item.likes} · sign in to like
                    </Link>
                  )}

                  <Link
                    href={recreateHref(item)}
                    className="springy font-mono text-xs text-ink underline decoration-vermilion decoration-2 underline-offset-4"
                  >
                    Recreate
                  </Link>
                </div>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {message ? (
        <p role="alert" className="mt-5 border-l-2 border-vermilion pl-2.5 text-sm text-ink">
          {message}
        </p>
      ) : null}

      {cursor ? (
        <div className="mt-6 flex justify-center border-t border-rule pt-5">
          <Button variant="outline" size="lg" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Show more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
