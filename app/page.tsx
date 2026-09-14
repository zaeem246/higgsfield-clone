import Link from "next/link";
import { CAMERA_MOVES, EFFECTS, MODELS } from "@/lib/catalog";
import { COMMUNITY } from "@/lib/seed";
import { PLAN_CREDITS } from "@/lib/types";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Logo } from "@/components/Logo";
import { Poster } from "@/components/Poster";
import { Icon } from "@/components/ui";
import { PromptDemo } from "@/components/landing/PromptDemo";
import { TabbedPresets } from "@/components/landing/TabbedPresets";
import { InteractiveWall, ProjectCard } from "@/components/landing/InteractiveWall";

/**
 * Landing page.
 *
 * The original is a very long page with a specific rhythm: a 3-up media
 * showcase, a promo panel beside a model grid, then a repeating sequence of
 * "SECTION LABEL → dense media wall → View all", broken up every few sections by
 * a full-bleed coloured panel, and closed by a link grid and a sitemap footer.
 * Section headings are heavy condensed all-caps. That rhythm is reproduced here.
 *
 * The *content* points at what this rebuild actually does. Copying the layout is
 * fidelity; advertising Supercomputer, MCP or a ChatGPT plugin that aren't built
 * here would just be false.
 */

/** Deterministic seed list for a wall. */
const seeds = (prefix: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${prefix}-${i}`);

const SHOWCASE = [
  {
    title: "Camera Moves",
    blurb: `${CAMERA_MOVES.length} cinematic moves, one click each.`,
    href: "/effects",
    seed: "showcase-camera",
  },
  {
    title: "Higgsfield Effects",
    blurb: `${EFFECTS.length} viral transformations, ready to apply.`,
    href: "/effects",
    seed: "showcase-effects",
  },
  {
    title: "Recreate",
    blurb: "Every shot's recipe, one click back into your generator.",
    href: "/explore",
    seed: "showcase-recreate",
  },
];

const FOOTER = [
  {
    title: "Create",
    links: [
      ["AI Video", "/generate?mode=video"],
      ["AI Image", "/generate?mode=image"],
      ["Camera Moves", "/effects"],
      ["Effects", "/effects"],
      ["Recreate", "/explore"],
    ] as [string, string][],
  },
  {
    title: "Video Models",
    links: MODELS.filter((m) => m.mode === "video")
      .slice(0, 6)
      .map((m) => [m.name, `/generate?mode=video&model=${m.id}`] as [string, string]),
  },
  {
    title: "Image Models",
    links: MODELS.filter((m) => m.mode === "image")
      .slice(0, 6)
      .map((m) => [m.name, `/generate?mode=image&model=${m.id}`] as [string, string]),
  },
  {
    title: "Platform",
    links: [
      ["Generate", "/generate"],
      ["Projects", "/projects"],
      ["Pricing", "/pricing"],
      ["Sign up", "/signup"],
    ] as [string, string][],
  },
  {
    title: "Community",
    links: [
      ["Explore", "/explore"],
      ["Presets", "/effects"],
    ] as [string, string][],
  },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-4 sm:px-6">
        <h1 className="sr-only">
          Higgsfield — generate cinematic video and images from a prompt, with
          one-click camera direction
        </h1>

        {/* ------------------------------------------------ 3-up showcase */}
        <section className="grid gap-4 md:grid-cols-3">
          {SHOWCASE.map((item) => (
            <Link key={item.title} href={item.href} className="group block">
              <div className="overflow-hidden rounded-[14px]">
                <Poster
                  seed={item.seed}
                  aspectId="16:9"
                  sizes={720}
                  className="transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <h2 className="headline mt-3 text-[15px]">{item.title}</h2>
              <p className="mt-1 text-[13px] text-ink-400">{item.blurb}</p>
            </Link>
          ))}
        </section>

        {/* -------------------------------------- promo + model grid row */}
        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="relative overflow-hidden rounded-[14px]">
            <div className="absolute inset-0">
              <Poster seed="promo-signup" aspectId="16:9" sizes={900} className="h-full w-full" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/92 via-ink-950/70 to-transparent" />
            <div className="relative p-6 sm:p-8">
              <h2 className="headline text-3xl sm:text-4xl">
                Sign up and get your
                <br />
                <span className="text-acid">free credits</span>
              </h2>
              <ul className="mt-4 space-y-1.5">
                {[
                  `${PLAN_CREDITS.free} credits, no card`,
                  `All ${CAMERA_MOVES.length + EFFECTS.length} presets unlocked`,
                  `Every one of the ${MODELS.length} models`,
                ].map((line) => (
                  <li key={line} className="flex items-center gap-2 text-[13px] text-ink-200">
                    <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-acid" />
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-6 inline-flex h-11 items-center rounded-full bg-acid px-6 text-[14px] font-semibold text-ink-950 transition-all hover:brightness-110"
              >
                Sign up and start generating
              </Link>
            </div>
          </div>

          <div className="grid auto-rows-min grid-cols-2 gap-3 sm:grid-cols-3">
            {MODELS.slice(0, 6).map((m) => (
              <Link
                key={m.id}
                href={`/generate?mode=${m.mode}&model=${m.id}`}
                className="group flex flex-col rounded-[12px] border border-ink-100/8 bg-ink-850 p-3.5 transition-colors hover:border-ink-500"
              >
                <div className="flex items-start justify-between">
                  <Icon name={m.mode} className="h-4 w-4 text-ink-300" />
                  <span className="rounded-[5px] bg-ink-800 px-1.5 py-0.5 text-[10px] capitalize text-ink-400">
                    {m.mode}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold">{m.name}</span>
                  {m.badge && (
                    <span
                      className={`rounded-[4px] px-1 py-px text-[9px] font-bold uppercase ${
                        m.badge === "new" ? "bg-acid text-ink-950" : "bg-hot/20 text-hot"
                      }`}
                    >
                      {m.badge === "new" ? "New" : "Top"}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-400">
                  {m.tagline}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Playable demo of the core loop, in place of a static pitch panel. */}
        <PromptDemo />

        {/* ---------------------------------------------- repeating walls */}
        <section className="mt-12">
          <SectionHead
            label="Visual effects"
            cta={{ label: "View all presets", href: "/effects" }}
          />
          <div className="mt-5">
            <TabbedPresets
              presets={EFFECTS}
              param="effect"
            />
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[18px] border border-ink-100/8 bg-ink-900 p-5 sm:p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-acid px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-950">
            <Icon name="camera" className="h-3 w-3" />
            Signature
          </span>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="headline text-3xl text-acid sm:text-4xl">
                Higgsfield Camera Moves
              </h2>
              <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-ink-300">
                {CAMERA_MOVES.length} moves across push, orbit, crane, pan, rig and lens.
                Filter by how the camera behaves, then send one straight to the generator.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <TabbedPresets
              presets={CAMERA_MOVES}
              param="camera"
            />
          </div>
        </section>

        <WallSection
          label="Seedance 2.5"
          cta={{ label: "View all of Seedance 2.5", href: "/generate?mode=video&model=seedance-2-5" }}
          tiles={seeds("seedance", 24)}
        />

        {/* ------------------------------------------- community projects */}
        <section className="mt-12">
          <SectionHead
            label="Explore the inside of every project"
            cta={{ label: "Explore community", href: "/explore" }}
          />
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {COMMUNITY.slice(0, 12).map((item) => (
              <ProjectCard
                key={item.id}
                seed={item.seed}
                author={item.author}
                prompt={item.prompt}
              />
            ))}
          </div>
        </section>

        {/* ------------------------------------------------- lime panel */}
        <section
          className="mt-12 overflow-hidden rounded-[18px] px-6 py-16 text-center"
          style={{
            backgroundImage:
              "radial-gradient(120% 100% at 50% 0%, #d3fc3f 0%, #7ea81f 34%, #16210a 74%, #07070a 100%)",
          }}
        >
          <h2 className="headline mx-auto text-4xl text-ink-950 sm:text-6xl">
            Direct the shot,
            <br />
            not just the subject
          </h2>
          <p className="mt-4 text-[14px] font-medium text-ink-950/75">
            {PLAN_CREDITS.free} free credits. No card, no install.
          </p>
          <Link
            href="/generate"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-ink-950 px-7 text-[15px] font-semibold text-ink-100 transition-opacity hover:opacity-90"
          >
            <Icon name="wand" className="h-4 w-4" />
            Start generating free
          </Link>
        </section>

        <WallSection
          label="Nano Banana Pro"
          cta={{ label: "View all of Nano Banana Pro", href: "/generate?mode=image&model=nano-banana-pro" }}
          tiles={seeds("nanobanana", 24)}
        />

        {/* --------------------------------------------- one prompt panel */}
        <section
          className="mt-12 overflow-hidden rounded-[18px] px-6 py-16 sm:px-10"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #0d1b3d 0%, #16265a 45%, #0a0f22 100%)",
          }}
        >
          <h2 className="headline max-w-lg text-4xl sm:text-5xl">
            One prompt.
            <br />
            Every format.
          </h2>
          <p className="mt-4 max-w-md text-[14px] text-ink-300">
            Six aspect ratios, three resolutions, four durations — switch any of them
            without rewriting a word, and the credit cost updates before you commit.
          </p>
          <Link
            href="/generate"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-ink-100 px-6 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-white"
          >
            Try it
          </Link>
        </section>

        <WallSection
          label="Higgsfield Soul"
          cta={{ label: "View all of Soul", href: "/generate?mode=image&model=soul" }}
          tiles={seeds("soul", 24)}
        />

        {/* ------------------------------------------ more features grid */}
        <section className="mt-14">
          <h2 className="headline text-center text-2xl sm:text-3xl">
            Explore more AI features
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
            {[...CAMERA_MOVES.slice(0, 14), ...EFFECTS.slice(0, 11)].map((p) => (
              <Link
                key={p.id}
                href={`/effects`}
                className="truncate border-b border-ink-100/5 py-2 text-[12px] text-ink-400 transition-colors hover:text-acid"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

/** Small all-caps label on the left, lime pill CTA on the right. */
function SectionHead({
  label,
  cta,
}: {
  label: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="headline text-[15px] sm:text-[17px]">{label}</h2>
      <Link
        href={cta.href}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-acid px-4 text-[12px] font-semibold text-ink-950 transition-all hover:brightness-110"
      >
        {cta.label}
        <Icon name="arrow-up-right" className="h-3 w-3" />
      </Link>
    </div>
  );
}


function WallSection({
  label,
  cta,
  tiles,
}: {
  label: string;
  cta: { label: string; href: string };
  tiles: string[];
}) {
  return (
    <section className="mt-12">
      <SectionHead label={label} cta={cta} />
      <div className="mt-5">
        <InteractiveWall tiles={tiles} label={label} href={cta.href} />
      </div>
    </section>
  );
}


function SiteHeader() {
  const left = [
    { label: "Explore", href: "/explore", active: true },
    { label: "Image", href: "/generate?mode=image" },
    { label: "Video", href: "/generate?mode=video" },
    { label: "Presets", href: "/effects" },
    { label: "Projects", href: "/projects" },
  ];
  const tagged = [
    { label: "Camera Moves", href: "/effects", tag: "New" },
    { label: "Effects", href: "/effects", tag: "Free" },
    { label: "Recreate", href: "/explore", tag: null },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/8 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo className="h-7 w-7" />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-4 overflow-x-auto text-[13px] md:flex">
          {left.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`shrink-0 transition-colors ${
                item.active ? "font-medium text-acid" : "text-ink-300 hover:text-ink-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <span className="h-4 w-px shrink-0 bg-ink-700" />
          {tagged.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex shrink-0 items-center gap-1.5 text-ink-300 transition-colors hover:text-ink-100"
            >
              {item.label}
              {item.tag && (
                <span className="rounded-[4px] bg-acid px-1 py-px text-[9px] font-bold uppercase text-ink-950">
                  {item.tag}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/pricing"
            className="hidden items-center gap-1.5 rounded-full border border-ink-700 px-3 py-1.5 text-[13px] font-medium transition-colors hover:border-ink-500 sm:flex"
          >
            <Icon name="spark" className="h-3.5 w-3.5" />
            Pricing
            <span className="rounded-[4px] bg-hot px-1 py-px text-[9px] font-bold uppercase leading-tight text-white">
              30% off
            </span>
          </Link>
          <Link
            href="/generate"
            className="hidden text-[13px] font-medium text-ink-100 transition-colors hover:text-acid sm:block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-acid px-4 py-1.5 text-[13px] font-semibold text-ink-950 transition-all hover:brightness-110"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-ink-100/8 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="headline text-2xl text-ink-300 sm:text-3xl">
          AI-native
          <br />
          creative suite
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {FOOTER.map((col) => (
            <div key={col.title}>
              <h3 className="text-[12px] font-semibold text-ink-100">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[12.5px] text-ink-400 transition-colors hover:text-ink-100"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-ink-100/8 pt-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" />
            <span className="text-[13px] font-medium">Higgsfield</span>
          </div>
          <p className="text-[12px] leading-relaxed text-ink-500 sm:ml-auto sm:text-right">
            An independent rebuild of higgsfield.ai, built for assessment.
            <br className="hidden sm:block" /> Not affiliated with Higgsfield, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
