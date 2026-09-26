"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cameraMove } from "@/lib/camera-moves";
import { watchOnScreen } from "@/lib/onscreen";
import { plate, plateBreath } from "@/lib/plate";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Kind } from "@/lib/types";

/**
 * How the plate is behaving, beyond what the grade itself looks like.
 *
 * `queued` and `rendering` hold the grade back so an unfinished shot reads as
 * latent rather than as a finished picture with a label under it; `develop`
 * brings it up, once, when the render lands.
 */
export type PlatePhase = "ready" | "queued" | "rendering" | "develop";

/** Whether — and how often — the camera move plays. */
export type PlatePlay = "off" | "once" | "loop";

export interface PlateProps {
  /** The generation's seed. Two shots with the same settings still differ by it. */
  seed: string;
  aspect?: string;
  paletteId?: string | null;
  lightId?: string | null;
  filmId?: string | null;
  cameraId?: string | null;
  effectId?: string | null;
  kind?: Kind;
  /** Real media, once an image model exists. Takes over completely when set. */
  mediaUrl?: string | null;
  /**
   * Suppresses the printed slate, for the one place that prints its own caption
   * directly beneath the plate and would otherwise say it twice.
   */
  slate?: boolean;
  /**
   * Plays the camera move on the grade. `once` runs it a single time and
   * settles back; `loop` runs it for as long as it is set, which is what a
   * hovered tile wants.
   */
  play?: PlatePlay;
  /** Changing this replays a `once` playback, so a move can be watched again. */
  playToken?: number;
  /**
   * The move to play, when it is not the shot's own. The composer previews the
   * move under the pointer before it has been committed to the shot.
   */
  playMove?: string | null;
  /** The resting drift. On everywhere except where a plate must hold still. */
  breathe?: boolean;
  /** The render lifecycle, if this plate belongs to a generation. */
  phase?: PlatePhase;
  className?: string;
  children?: ReactNode;
}

/**
 * A plate: either the generation's media, or — while there is no image model
 * behind the product — a deterministic reference photograph with the shot's
 * own grade composited onto it. See lib/plate.ts for how it is built, and for
 * what is left showing when the photograph cannot be fetched.
 *
 * The grade sits on its own layer inside the frame, which is what makes the
 * camera moves possible: the frame never moves, and the picture inside it
 * pushes, orbits, cranes and racks exactly as the named move would. At rest
 * that layer breathes, on a period and phase drawn from the seed. Everything
 * is transform and filter, so a wall of these stays on the compositor, and
 * everything parks when the plate scrolls off screen.
 *
 * Under `prefers-reduced-motion` none of it runs: globals.css stops the
 * animations outright, and this component additionally never schedules
 * playback or mounts a light rig.
 */
export function Plate({
  seed,
  aspect = "16:9",
  paletteId = null,
  lightId = null,
  filmId = null,
  cameraId = null,
  effectId = null,
  kind,
  mediaUrl = null,
  slate = true,
  play = "off",
  playToken = 0,
  playMove = null,
  breathe = true,
  phase = "ready",
  className = "",
  children,
}: PlateProps) {
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  const [completed, setCompleted] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const stillness = useReducedMotion();

  const grade = useMemo(
    () => plate({ seed, aspect, paletteId, lightId, filmId, cameraId, effectId, kind }),
    [seed, aspect, paletteId, lightId, filmId, cameraId, effectId, kind],
  );
  const breath = useMemo(() => plateBreath(seed), [seed]);

  // A still has no motion to play, whatever is selected — the backend drops a
  // camera move on an image and so does the plate.
  const move = kind === "image" ? null : cameraMove(playMove ?? cameraId);
  // One identity per playback. Choosing a different move, or asking for the
  // same one again, is a new run — which is how "watch it again" works without
  // any state to reset.
  const run = `${move?.id ?? ""}#${playToken}`;
  const playing = !stillness && move !== null && play !== "off" && completed !== run;

  // Starting a run the element has already animated once: the rule is still
  // attached, so it is rewound through the Web Animations API rather than by
  // tearing it off and forcing a reflow to put it back.
  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    for (const animation of image.getAnimations()) {
      animation.currentTime = 0;
      animation.play();
    }
  }, [run]);

  useEffect(() => {
    const frame = frameRef.current;
    return frame ? watchOnScreen(frame) : undefined;
  }, []);

  function settle(event: AnimationEvent<HTMLDivElement>) {
    // The light rigs bubble their own animations through here, and so does the
    // develop pass; only the named move ending means the move is over.
    if (play === "once" && move && event.animationName === move.anim) setCompleted(run);
  }

  // Real media replaces the preview outright, slate and all. The grade still
  // paints underneath so the tile is never blank while the bytes are in flight.
  const showMedia = Boolean(mediaUrl) && !broken;
  const { aspectRatio, ...paint } = grade.style;

  // The move's timing is set on the frame rather than on the image, so the
  // grade and the light rig that rides with it inherit one clock and cannot
  // drift apart.
  return (
    <div
      ref={frameRef}
      data-phase={phase}
      className={`plate @container ${className}`.trim()}
      style={
        {
          aspectRatio,
          background: paint.backgroundColor,
          ...(move
            ? {
                "--cam-anim": move.anim,
                "--cam-dur": `${move.duration}s`,
                "--cam-ease": move.ease,
                "--cam-iter": play === "loop" ? "infinite" : "1",
              }
            : null),
        } as CSSProperties
      }
    >
      <div
        ref={imageRef}
        aria-hidden
        className="plate-image"
        data-breathe={breathe && !stillness ? "on" : "off"}
        data-cam={playing ? "on" : "off"}
        onAnimationEnd={settle}
        style={
          {
            ...paint,
            "--breathe-dur": breath.duration,
            "--breathe-delay": breath.delay,
          } as CSSProperties
        }
      />

      {playing && move?.sheen ? (
        <span
          aria-hidden
          className="plate-optic"
          data-optic={move.sheen.kind}
          style={{ "--sheen-anim": move.sheen.anim } as CSSProperties}
        />
      ) : null}

      {playing && move?.lens ? <span aria-hidden className="plate-lens" /> : null}

      {phase === "develop" && !stillness ? <span aria-hidden className="plate-arrive" /> : null}

      {showMedia && mediaUrl ? (
        /* Arbitrary remote media the backend chose, not a known-size local
           asset, so Next's optimiser adds cost without adding anything. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : slate ? (
        <PlateSlate recipe={grade.recipe} chips={grade.chips} />
      ) : null}

      {children}
    </div>
  );
}

/**
 * The printed label. Modelled on a colour-timing card rather than an error
 * state: it says in plain words that the picture is a stand-in frame carrying
 * the user's own grade, prints the recipe that graded it and lays the derived
 * tones out as a chip strip — an instrument the product deliberately produced,
 * not an apology for one it could not.
 *
 * Sizes are in `cqw` against the plate itself, so the slate holds its
 * proportions from a 120px contact-sheet frame up to a full-bleed lookbook one.
 */
function PlateSlate({ recipe, chips }: { recipe: string; chips: string[] }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 flex flex-col gap-[1cqw] px-[3.4cqw] pt-[14cqw] pb-[3cqw]"
      style={{
        background:
          "linear-gradient(to top, rgb(0 0 0 / 0.66) 0%, rgb(0 0 0 / 0.34) 46%, transparent 100%)",
      }}
    >
      <div className="flex items-baseline justify-between gap-[3cqw]">
        <span
          className="font-mono whitespace-nowrap text-[rgb(255_252_246/0.94)] uppercase"
          style={{ fontSize: "clamp(7px, 2.5cqw, 11px)", letterSpacing: "0.16em" }}
        >
          Reference frame
        </span>
        <span
          className="hidden font-mono whitespace-nowrap text-[rgb(255_252_246/0.58)] uppercase @min-[300px]:inline"
          style={{ fontSize: "clamp(6px, 2.1cqw, 10px)", letterSpacing: "0.14em" }}
        >
          Your grade — stands in for the render
        </span>
      </div>

      <div className="hidden items-center justify-between gap-[3cqw] @min-[240px]:flex">
        <span
          className="truncate font-mono text-[rgb(255_252_246/0.72)]"
          style={{ fontSize: "clamp(6px, 2.1cqw, 10px)", letterSpacing: "0.05em" }}
        >
          {recipe}
        </span>
        <span aria-hidden className="flex shrink-0 gap-[0.6cqw]">
          {chips.map((chip, i) => (
            <span
              key={i}
              className="block"
              style={{
                background: chip,
                width: "clamp(5px, 2.4cqw, 13px)",
                height: "clamp(5px, 2.4cqw, 13px)",
                boxShadow: "inset 0 0 0 1px rgb(255 252 246 / 0.22)",
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
