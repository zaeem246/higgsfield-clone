"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Plate, type PlatePhase, type PlatePlay } from "@/components/plate";
import type { GenerationStatus, Kind } from "@/lib/types";

/** How long the plate takes to come up, matching `plate-develop` in globals.css. */
const DEVELOP_MS = 950;

interface FrameProps {
  seed: string;
  aspect: string;
  status: GenerationStatus;
  mediaUrl: string | null;
  /** The shot's settings. Optional: a caller with only a seed still gets a
   *  distinct plate, because lib/plate.ts draws the missing slots from it. */
  paletteId?: string | null;
  lightId?: string | null;
  filmId?: string | null;
  cameraId?: string | null;
  effectId?: string | null;
  kind?: Kind;
  /** Hide the plate's printed slate where the caption is printed beneath it. */
  slate?: boolean;
  /** Plays the frame's camera move. See components/plate.tsx. */
  play?: PlatePlay;
  playToken?: number;
  playMove?: string | null;
  breathe?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * A generation's frame: the plate plus the states only a generation has.
 *
 * The lifecycle is on the picture itself rather than beside it. Queued is a
 * latent plate — dark, desaturated, barely resolved — with a bar of light
 * crossing it; rendering resolves most of the way; and the moment the shot
 * lands, the plate *develops* up to full grade over a beat, with one hairline
 * of vermilion round the frame. A finished render arrives rather than pops
 * into existence, which is the whole difference between watching something
 * happen and watching a placeholder get replaced.
 */
export function Frame({
  seed,
  aspect,
  status,
  mediaUrl,
  paletteId = null,
  lightId = null,
  filmId = null,
  cameraId = null,
  effectId = null,
  kind,
  slate = true,
  play = "off",
  playToken = 0,
  playMove = null,
  breathe = true,
  className = "",
  children,
}: FrameProps) {
  const pending = status === "queued" || status === "rendering";
  const [developing, setDeveloping] = useState(false);
  // Only a shot that was watched through its wait develops. Anything already
  // finished when the page rendered — a lookbook, a shot list — is simply
  // there, and would look absurd flashing in on every scroll.
  const wasPending = useRef(pending);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current || status !== "ready") return;
    wasPending.current = false;
    setDeveloping(true);
    const timer = window.setTimeout(() => setDeveloping(false), DEVELOP_MS);
    return () => window.clearTimeout(timer);
  }, [pending, status]);

  const phase: PlatePhase = pending ? status : developing ? "develop" : "ready";

  return (
    <Plate
      seed={seed}
      aspect={aspect}
      paletteId={paletteId}
      lightId={lightId}
      filmId={filmId}
      cameraId={cameraId}
      effectId={effectId}
      kind={kind}
      // Media that has not landed yet is not media: a queued shot shows the
      // preview even if the backend has already filled the column in.
      mediaUrl={status === "ready" ? mediaUrl : null}
      slate={slate}
      phase={phase}
      play={play}
      playToken={playToken}
      playMove={playMove}
      breathe={breathe}
      className={`${pending ? "sweep" : ""} ${className}`.trim()}
    >
      {status === "failed" ? (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-[var(--paper)]/75 font-mono text-[0.6875rem] tracking-[0.18em] uppercase"
          style={{ color: "var(--vermilion)" }}
        >
          no render
        </span>
      ) : null}

      {children}
    </Plate>
  );
}
