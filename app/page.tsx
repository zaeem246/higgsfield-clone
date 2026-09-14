import Link from "next/link";
import { CAMERA_MOVES, EFFECTS, MODELS } from "@/lib/catalog";
import { COMMUNITY } from "@/lib/seed";
import { PLAN_CREDITS } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Poster } from "@/components/Poster";
import { Badge, Button, Icon } from "@/components/ui";

const HERO = COMMUNITY.slice(0, 10);
const FEATURED_MOVES = [
  "crash-zoom-in",
  "bullet-time",
  "fpv-drone",
  "orbit-360",
  "snorricam",
  "dolly-zoom",
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* ------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        {/* Media wall. Dimmed enough that the headline always wins, but not so far
            that the product’s own output stops being the backdrop. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 grid grid-cols-3 gap-2 p-2 opacity-75 sm:grid-cols-4 lg:grid-cols-5"
        >
          {HERO.map((item, i) => (
            <Poster
              key={item.id}
              seed={item.seed}
              aspectId="9:16"
              sizes={360}
              className={`rounded-[10px] ${i % 3 === 1 ? "mt-10" : i % 3 === 2 ? "mt-4" : ""}`}
            />
          ))}
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-ink-950/55 via-ink-950/80 to-ink-950"
        />

        <div className="relative mx-auto max-w-4xl px-5 pb-20 pt-24 text-center sm:pt-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-100/12 bg-ink-900/70 px-3 py-1.5 text-[12px] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Seedance 2.5 is live — the most advanced video model
          </div>

          <h1 className="display text-5xl font-semibold sm:text-6xl lg:text-7xl">
            Direct the shot,
            <br />
            not just the subject.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ink-300 sm:text-base">
            {CAMERA_MOVES.length} cinematic camera moves and {EFFECTS.length} viral
            effects, one click each. Write a prompt, choose how the camera behaves, and
            generate video or stills that look shot rather than sampled.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link href="/generate">
              <Button size="lg" className="w-full sm:w-auto">
                <Icon name="wand" className="h-4 w-4" />
                Start generating free
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Explore community
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-[12px] text-ink-500">
            {PLAN_CREDITS.free} free credits — about 30 stills or 3 video takes. No card.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- camera */}
      <section className="border-t border-ink-100/8 px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge tone="accent">The difference</Badge>
              <h2 className="display mt-3 text-3xl font-semibold sm:text-4xl">
                Camera moves, not prompt roulette
              </h2>
              <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-ink-400">
                Every other generator makes you describe a dolly zoom and hope. Here it is
                a button, and the model is told precisely what the camera does.
              </p>
            </div>
            <Link
              href="/effects"
              className="text-[13px] text-ink-300 transition-colors hover:text-acid"
            >
              See all {CAMERA_MOVES.length + EFFECTS.length} presets →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {FEATURED_MOVES.map((id) => {
              const move = CAMERA_MOVES.find((m) => m.id === id)!;
              return (
                <Link
                  key={id}
                  href={`/generate?camera=${id}&mode=video`}
                  className="group overflow-hidden rounded-[12px] border border-ink-100/8 transition-colors hover:border-ink-500"
                >
                  <Poster seed={id} aspectId="3:4" sizes={340}>
                    <div className="absolute inset-x-0 bottom-0 p-2.5">
                      <p className="text-[13px] font-medium text-white">{move.name}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/50">
                        {move.group}
                      </p>
                    </div>
                  </Poster>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- models */}
      <section className="border-t border-ink-100/8 px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="display text-3xl font-semibold sm:text-4xl">
            {MODELS.length} models, one surface
          </h2>
          <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-ink-400">
            Switch model without relearning anything. Presets, aspect ratios and credits
            behave the same everywhere.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODELS.map((m) => (
              <div
                key={m.id}
                className="rounded-[14px] border border-ink-100/8 bg-ink-850 p-4"
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name={m.mode}
                    className="h-4 w-4 text-acid"
                  />
                  <span className="text-[14px] font-medium">{m.name}</span>
                  {m.badge && (
                    <Badge tone={m.badge === "new" ? "accent" : "neutral"}>{m.badge}</Badge>
                  )}
                </div>
                <p className="mt-1.5 text-[13px] text-ink-400">{m.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.strengths.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-ink-800 px-2 py-0.5 text-[11px] text-ink-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[12px] tabular-nums text-ink-500">
                  from {m.cost} credits
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- feed cta */}
      <section className="border-t border-ink-100/8 px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="display text-3xl font-semibold sm:text-4xl">
                Every shot shows its recipe
              </h2>
              <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-ink-400">
                Open anything in the feed to see the prompt, model and camera move behind
                it — then hit Recreate to load those exact settings into your own
                generator.
              </p>
            </div>
            <Link href="/explore">
              <Button variant="outline">Open Explore</Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {COMMUNITY.slice(10, 20).map((item) => (
              <Link
                key={item.id}
                href="/explore"
                className="overflow-hidden rounded-[12px] border border-ink-100/8 transition-colors hover:border-ink-500"
              >
                <Poster seed={item.seed} aspectId="1:1" sizes={320}>
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <p className="line-clamp-2 text-[11px] leading-snug text-white/90">
                      {item.prompt}
                    </p>
                  </div>
                </Poster>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/8 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="text-[15px] font-semibold tracking-tight">Higgsfield</span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-4 overflow-x-auto text-[13px] text-ink-400 md:flex">
          <Link href="/explore" className="shrink-0 text-acid">
            Explore
          </Link>
          <Link
            href="/generate?mode=image"
            className="shrink-0 transition-colors hover:text-ink-100"
          >
            Image
          </Link>
          <Link
            href="/generate?mode=video"
            className="shrink-0 transition-colors hover:text-ink-100"
          >
            Video
          </Link>
          <Link
            href="/effects"
            className="flex shrink-0 items-center gap-1.5 transition-colors hover:text-ink-100"
          >
            Effects
            <span className="rounded-[4px] bg-acid px-1 py-px text-[9px] font-bold uppercase text-ink-950">
              Free
            </span>
          </Link>
          <Link href="/projects" className="shrink-0 transition-colors hover:text-ink-100">
            Projects
          </Link>
          <Link href="/pricing" className="shrink-0 transition-colors hover:text-ink-100">
            Pricing
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/generate" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Sign up free</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-ink-100/8 px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Logo className="h-5 w-5" />
          <span className="text-[13px] font-medium">Higgsfield</span>
        </div>
        <p className="text-[12px] leading-relaxed text-ink-500 sm:ml-auto sm:text-right">
          An independent rebuild of higgsfield.ai, built for assessment.
          <br className="hidden sm:block" /> Not affiliated with Higgsfield, Inc.
        </p>
      </div>
    </footer>
  );
}
