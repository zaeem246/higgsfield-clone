import Link from "next/link";
import { Frame } from "@/components/frame";
import { LandingComposer } from "@/components/landing-composer";
import { ButtonLink } from "@/components/ui/button";
import { ApiNotice } from "@/components/ui/notice";
import { Reveal } from "@/components/ui/reveal";
import { serverApi } from "@/lib/api.server";

/**
 * The mechanism, in three moves. This sits directly above the working demo
 * rather than anywhere else on the page: the steps are only worth reading if
 * the thing they describe is the next thing you can touch.
 */
const STEPS: readonly { n: string; heading: string; body: string }[] = [
  {
    n: "01",
    heading: "Write it",
    body: "Say what is in the shot, in one line. “A man walks a dog along a seawall at first light.”",
  },
  {
    n: "02",
    heading: "Direct it",
    body: "Pick the film stock, the colour, the lighting, an effect and how the camera moves. Every choice is optional and every one is shown to you.",
  },
  {
    n: "03",
    heading: "Generate it",
    body: "Kinograde builds the full prompt out of your choices, prints what it will cost, and generates the image or the video.",
  },
];

/**
 * The fold's proof. One photograph, one prompt, three sets of choices — the
 * product's entire claim, made with pictures rather than with a sentence about
 * pictures. The seed is shared on purpose: it is the *same* frame in all three,
 * so the only thing that moved is the grade.
 */
const SAME_SHOT = "A man walks a dog along a seawall at first light";

const THREE_WAYS: readonly {
  label: string;
  paletteId: string;
  lightId: string;
  filmId: string;
}[] = [
  { label: "Teal & Orange · Golden Hour · 35mm", paletteId: "teal-orange", lightId: "golden-hour", filmId: "35mm" },
  { label: "Neon Noir · Hard Flash · VHS", paletteId: "neon-noir", lightId: "hard-flash", filmId: "vhs" },
  { label: "Monochrome · Rembrandt · Archival", paletteId: "monochrome", lightId: "rembrandt", filmId: "archival" },
];

const ARGUMENT: readonly { n: string; heading: string; body: string }[] = [
  {
    n: "01",
    heading: "One prompt box is not enough.",
    body: "A single sentence cannot hold the subject, the look, the lighting and the camera move at once. Kinograde splits them into separate choices, so you can change one without rewriting the rest.",
  },
  {
    n: "02",
    heading: "You read it before you pay for it.",
    body: "The finished prompt sits under the box and rewrites itself as you choose. The price moves with it. Nothing is charged until you have seen both.",
  },
  {
    n: "03",
    heading: "Everything you make is kept in order.",
    body: "Results arrive numbered, with their settings printed underneath — model, size, seed, cost — so you can still tell two versions apart a week later.",
  },
];

const ORDER: readonly { slot: string; example: string }[] = [
  { slot: "Subject", example: "a lighthouse keeper walks the gallery at dawn" },
  { slot: "Film stock", example: "shot on 35mm Kodak Vision3" },
  { slot: "Colour", example: "cold blue shadows, warm sodium highlights" },
  { slot: "Lighting", example: "low backlight through sea haze" },
  { slot: "Effect", example: "gulls scattering into frame" },
  { slot: "Camera", example: "slow dolly in" },
];

export default async function LandingPage() {
  const client = await serverApi();
  const [catalog, feed] = await Promise.all([client.catalog(), client.feed({ limit: 3 })]);
  // Null rather than a boolean, so the demo below cannot be rendered without it.
  const catalogue = catalog.ok && catalog.data.models.length > 0 ? catalog.data : null;

  return (
    <div className="shell">
      {/* Hero ------------------------------------------------------------ */}
      <section className="border-b border-rule pt-8 pb-6 md:pt-11 md:pb-7">
        <Reveal index={0}>
          <p className="label">Kinograde — AI image and video generation</p>
        </Reveal>
        <Reveal index={1}>
          {/* Deliberately smaller than the type scale would allow. A headline
              that fills the viewport on its own pushes the thing it is
              describing below the fold, and the demo *is* the argument. */}
          <h1 className="display mt-3 max-w-4xl text-[clamp(2.375rem,6vw,4.5rem)]">
            AI images and video you direct, not just describe.
          </h1>
        </Reveal>
        <Reveal index={2}>
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <p className="max-w-xl text-[1.0625rem] leading-snug text-graphite">
              Type a prompt, then choose the film stock, the colour, the lighting and the camera
              move. Kinograde composes all of it into one instruction, shows you what it costs, and
              generates the shot.
            </p>
            <div className="flex shrink-0 flex-wrap gap-2.5">
              <ButtonLink href="/create" size="lg">
                Start creating
              </ButtonLink>
              <ButtonLink href="/gallery" variant="outline" size="lg">
                See examples
              </ButtonLink>
            </div>
          </div>
        </Reveal>
        <Reveal index={3}>
          <p className="meta mt-5 border-t border-rule pt-2.5">
            {catalogue
              ? `${catalogue.models.length} image and video models · ${catalogue.presets.length} styles, looks and camera moves · ${catalogue.aspects.length} sizes · priced in credits, printed before you spend`
              : "Models, styles and prices are served live by the API · nothing on this page is invented"}
          </p>
        </Reveal>

        <Reveal index={4}>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="label">One prompt, three sets of choices</span>
            <span className="font-mono text-[0.8125rem] text-ink">&ldquo;{SAME_SHOT}&rdquo;</span>
          </p>
        </Reveal>
        <ul className="mt-2 grid gap-x-4 gap-y-4 sm:grid-cols-3">
          {THREE_WAYS.map((look, i) => (
            <li key={look.label}>
              <Reveal index={4 + i}>
                <Frame
                  seed={SAME_SHOT}
                  aspect="16:9"
                  status="ready"
                  mediaUrl={null}
                  paletteId={look.paletteId}
                  lightId={look.lightId}
                  filmId={look.filmId}
                  kind="image"
                  slate={false}
                />
                <p className="meta mt-1.5">{look.label}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works, then the thing itself ----------------------------- */}
      <section className="band-tight" aria-labelledby="demo-heading">
        <Reveal index={0}>
          <h2 id="demo-heading" className="display text-[clamp(1.875rem,4vw,2.75rem)]">
            How it works — try it right here.
          </h2>
          <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-snug text-graphite">
            {catalogue
              ? "The panel below is the real tool, running on the live catalogue. Change a style and the picture is regraded in front of you. Point at a camera move and it plays. Nothing is charged and no account is needed to look."
              : "The tool below runs on the live catalogue, which is not answering — so there is nothing here to try rather than a mock-up of one."}
          </p>
        </Reveal>

        <ol className="mt-4 grid gap-px bg-rule sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.n} className="bg-paper">
              <Reveal index={i} className="flex h-full gap-3 px-3 py-3 sm:px-4">
                <p className="meta shrink-0 pt-1 text-vermilion">{step.n}</p>
                <div className="min-w-0">
                  <h3 className="font-display text-[1.5rem] leading-none">{step.heading}</h3>
                  <p className="mt-1.5 text-[0.875rem] leading-snug text-graphite">{step.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal index={1} className="mt-4">
          {catalogue ? (
            <LandingComposer catalog={catalogue} />
          ) : (
            <ApiNotice
              error={
                catalog.ok
                  ? { code: "empty_catalog", message: "The catalogue is empty.", status: 200 }
                  : catalog.error
              }
            />
          )}
        </Reveal>
      </section>

      {/* The argument, beside the sentence it produces -------------------- */}
      <section className="band border-t border-rule" aria-labelledby="argument-heading">
        <h2 id="argument-heading" className="sr-only">
          Why choose the shot instead of typing one sentence
        </h2>
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="grid gap-px self-start bg-rule">
            {ARGUMENT.map((item, i) => (
              <Reveal key={item.n} index={i} className="bg-paper">
                <article className="flex gap-4 py-3.5 pr-2">
                  <p className="meta shrink-0 pt-1 text-vermilion">{item.n}</p>
                  <div className="min-w-0">
                    <h3 className="font-display text-[1.6rem] leading-none">{item.heading}</h3>
                    <p className="mt-1.5 text-[0.875rem] leading-snug text-graphite">{item.body}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="min-w-0">
            <Reveal index={0}>
              <h3 className="display text-[clamp(1.875rem,4vw,2.5rem)]">
                This is the prompt it writes for you.
              </h3>
              <p className="mt-2 max-w-lg text-[0.9375rem] leading-snug text-graphite">
                Your six choices become one sentence, always in this order — subject first, camera
                last, so the motion sits next to the action instead of buried mid-paragraph. You can
                read every word of it before you spend anything.
              </p>
            </Reveal>
            <ol className="mt-4">
              {ORDER.map((row, i) => (
                <li key={row.slot} className="border-t border-rule last:border-b">
                  <Reveal
                    index={i}
                    className="grid grid-cols-[1.75rem_1fr] items-baseline gap-x-3 gap-y-0.5 py-2 sm:grid-cols-[1.75rem_5.5rem_1fr]"
                  >
                    <span className="meta">{String(i + 1).padStart(2, "0")}</span>
                    <span className="label">{row.slot}</span>
                    <span className="col-start-2 font-mono text-[0.8125rem] text-ink sm:col-start-3">
                      {row.example}
                    </span>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Gallery strip --------------------------------------------------- */}
      <section className="band border-t border-rule" aria-labelledby="recent-heading">
        <Reveal index={0}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="recent-heading" className="display text-[clamp(1.875rem,4vw,2.75rem)]">
              Made with Kinograde.
            </h2>
            <Link
              href="/gallery"
              className="font-mono text-[0.8125rem] text-ink underline decoration-vermilion decoration-2 underline-offset-4"
            >
              See the gallery
            </Link>
          </div>
        </Reveal>

        {!feed.ok ? (
          <Reveal index={1}>
            <ApiNotice error={feed.error} />
          </Reveal>
        ) : feed.data.items.length === 0 ? (
          <Reveal index={1}>
            <p className="border border-rule bg-raised px-4 py-4 text-sm text-graphite">
              Nothing has been shared yet. The first one could be yours.
            </p>
          </Reveal>
        ) : (
          <ul className="grid gap-x-4 gap-y-6 sm:grid-cols-3">
            {feed.data.items.map((item, i) => (
              <li key={item.id}>
                <Reveal index={i}>
                  {/* A uniform crop: a strip of mismatched frames reads
                      as broken alignment rather than as a contact strip. */}
                  <Frame
                    seed={item.seed}
                    aspect="4:3"
                    status={item.status}
                    mediaUrl={item.mediaUrl}
                    paletteId={item.paletteId}
                    lightId={item.lightId}
                    filmId={item.filmId}
                    cameraId={item.cameraId}
                    effectId={item.effectId}
                    kind={item.kind}
                  />
                  <p className="mt-2 border-t border-rule pt-1.5 font-display text-[1.25rem] leading-tight">
                    {item.prompt}
                  </p>
                  <p className="meta mt-1">
                    {item.author?.name ?? "Anonymous"} · {item.modelName} · {item.aspect}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Close ------------------------------------------------------------ */}
      <section className="band border-t border-rule">
        <Reveal index={0}>
          <div className="flex flex-col items-start gap-5 md:flex-row md:items-end md:justify-between">
            <p className="display max-w-2xl text-[clamp(2rem,5.5vw,3.5rem)]">
              A free account, no card, and somewhere to keep everything you make.
            </p>
            <ButtonLink href="/sign-up" size="lg">
              Create an account
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
