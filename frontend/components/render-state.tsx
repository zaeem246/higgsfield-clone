import type { GenerationStatus } from "@/lib/types";

const STAGES = ["queued", "rendering", "ready"] as const;

/** How far the lifecycle bar has travelled at each stage. */
const PROGRESS: Record<(typeof STAGES)[number], number> = {
  queued: 0.18,
  rendering: 0.6,
  ready: 1,
};

/**
 * The render lifecycle, printed rather than spun.
 *
 * Three named stages with the reached one inked in and breathing, over a
 * hairline bar that travels queued → rendering → ready. A waiting reader can
 * see which stage they are on and that it is moving, which an indeterminate
 * circle never tells them. Under reduced motion the pulse and the run stop and
 * the bar simply sits at its stage.
 */
export function RenderState({ status }: { status: GenerationStatus }) {
  if (status === "failed") {
    return (
      <div className="min-w-0">
        <p className="label text-vermilion" role="status">
          Failed — no charge
        </p>
        <span aria-hidden className="mt-1.5 block h-px w-full bg-vermilion/50" />
      </div>
    );
  }

  const reached = STAGES.indexOf(status);
  const settled = status === "ready";

  return (
    <div className="min-w-0">
      <p className="label flex items-center gap-1.5" role="status">
        {STAGES.map((stage, i) => (
          <span key={stage} className="flex items-center gap-1.5">
            {i > 0 ? (
              <span aria-hidden className={i <= reached ? "text-graphite" : "opacity-40"}>
                →
              </span>
            ) : null}
            <span
              className={
                i === reached
                  ? `text-vermilion${settled ? "" : " stage-live"}`
                  : i < reached
                    ? "text-graphite"
                    : "opacity-40"
              }
            >
              {stage}
            </span>
          </span>
        ))}
      </p>
      <span
        aria-hidden
        data-stage={status}
        className="stage-bar mt-1.5 block h-px w-full"
      >
        <i style={{ transform: `scaleX(${PROGRESS[status]})` }} />
      </span>
    </div>
  );
}
