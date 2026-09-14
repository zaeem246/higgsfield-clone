"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { findModel } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { PLAN_CREDITS, type Account } from "@/lib/types";
import { Button, Icon } from "@/components/ui";

/**
 * Pricing.
 *
 * Structure follows the live page: a left-aligned "Upgrade your plan" header, a
 * plan-audience tab pair, a monthly/annual switch with the saving called out in
 * pink, and cards that lead with what the credits actually buy before the price.
 *
 * Every card renders the SAME feature rows in the same order, from one matrix.
 * That is what keeps the columns aligned — an earlier version gave each tier its
 * own bullet list, so a single wrapping line in one card pushed every row below
 * it out of step with its neighbours. Fixed-height header blocks do the same job
 * above the matrix, so the CTA and the first feature row start on a common
 * baseline in all four columns.
 */

type PlanId = Account["plan"];

interface Tier {
  id: PlanId;
  name: string;
  monthly: number;
  annual: number;
  blurb: string;
  featured?: boolean;
  /** Tint applied behind the card, as on the original's Pro/Max cards. */
  tint?: string;
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    blurb: "Try the whole surface, no card.",
  },
  {
    id: "basic",
    name: "Basic",
    monthly: 9,
    annual: 9,
    blurb: "For first-time AI creators.",
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 29,
    annual: 23,
    blurb: "For everyday AI creation.",
    featured: true,
    tint: "linear-gradient(160deg, rgba(211,252,63,0.10), transparent 62%)",
  },
  {
    id: "max",
    name: "Max",
    monthly: 79,
    annual: 59,
    blurb: "For ambitious AI projects.",
    tint: "linear-gradient(160deg, rgba(255,110,199,0.12), transparent 62%)",
  },
];

/**
 * One row per capability, one value per tier. Rendering from a matrix rather
 * than per-tier lists is what guarantees the columns line up.
 *
 * `true` renders a tick, `false` a muted dash, a string renders as-is.
 */
type Value = string | boolean;

interface Section {
  title: string;
  rows: { label: string; values: Record<PlanId, Value> }[];
}

const SECTIONS: Section[] = [
  {
    title: "Included",
    rows: [
      {
        label: "Camera moves & effects",
        values: { free: "All 52", basic: "All 52", pro: "All 52", max: "All 52" },
      },
      {
        label: "Look controls",
        values: { free: true, basic: true, pro: true, max: true },
      },
      {
        label: "Max resolution",
        values: { free: "1080p", basic: "1080p", pro: "4K", max: "4K" },
      },
      {
        label: "Watermark-free",
        values: { free: false, basic: true, pro: true, max: true },
      },
    ],
  },
  {
    title: "Models",
    rows: [
      {
        label: "Seedance 2.5",
        values: { free: false, basic: false, pro: "Full", max: "Full" },
      },
      {
        label: "Seedance 2.0",
        values: { free: "Preview", basic: "Full", pro: "Full", max: "Full" },
      },
      {
        label: "All image models",
        values: { free: true, basic: true, pro: true, max: true },
      },
    ],
  },
  {
    title: "Workflow",
    rows: [
      {
        label: "Parallel generations",
        values: { free: "1", basic: "2", pro: "Unlimited", max: "Unlimited" },
      },
      {
        label: "Batch size",
        values: { free: "1", basic: "2", pro: "4", max: "4" },
      },
      {
        label: "Queue priority",
        values: { free: "Standard", basic: "Standard", pro: "Priority", max: "Priority" },
      },
      {
        label: "Commercial licence",
        values: { free: false, basic: false, pro: true, max: true },
      },
      {
        label: "Team seats",
        values: { free: false, basic: false, pro: false, max: true },
      },
    ],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [audience, setAudience] = useState<"individual" | "business">("individual");
  const { account, setPlan, ready } = useStore();
  const router = useRouter();

  const choose = (id: PlanId) => {
    if (!account) {
      router.push("/signup");
      return;
    }
    setPlan(id);
  };

  // Translate an allowance into output, the way the live page does.
  const stillCost = findModel("nano-banana-pro")?.cost ?? 2;
  const videoCost = findModel("seedance-2-5")?.cost ?? 17;

  return (
    <div className="p-4 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="display text-3xl font-bold sm:text-4xl">Upgrade your plan</h1>
        <p className="mt-2 max-w-lg text-sm text-ink-400">
          Lock better prices with an upgrade, or scale your creativity on the plan you
          already have. Credits reset monthly and roll over for 30 days.
        </p>

        {/* ------------------------------------------------------------ controls */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-[10px] border border-ink-700 bg-ink-850 p-1">
            {(["individual", "business"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAudience(a)}
                aria-pressed={audience === a}
                className={`rounded-[7px] px-3.5 py-1.5 text-[13px] capitalize transition-colors ${
                  audience === a ? "bg-ink-750 text-ink-100" : "text-ink-400 hover:text-ink-200"
                }`}
              >
                {a} plans
              </button>
            ))}
          </div>

          {/* Real switch, as on the original, rather than two buttons. */}
          <div className="ml-auto flex items-center gap-2.5 rounded-[10px] border border-ink-700 bg-ink-850 px-3 py-2">
            <span className={`text-[13px] ${annual ? "text-ink-500" : "text-ink-100"}`}>
              Monthly
            </span>
            <button
              role="switch"
              aria-checked={annual}
              aria-label="Bill annually"
              onClick={() => setAnnual((a) => !a)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                annual ? "bg-acid" : "bg-ink-600"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-ink-950 transition-transform ${
                  annual ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-[13px] ${annual ? "text-ink-100" : "text-ink-500"}`}>
              Annual
            </span>
            <span className="rounded-[5px] bg-hot/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-hot">
              −25%
            </span>
          </div>
        </div>

        {audience === "business" && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[12px] border border-ink-100/8 bg-ink-850 px-4 py-3.5">
            <p className="text-[13px] text-ink-300">
              Business plans add shared credit pools, SSO, invoicing and a dedicated
              contact.
            </p>
            <Link href="/generate" className="ml-auto">
              <Button size="sm" variant="outline">
                Talk to sales
              </Button>
            </Link>
          </div>
        )}

        {/* --------------------------------------------------------------- cards */}
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {TIERS.map((tier) => {
            const price = annual ? tier.annual : tier.monthly;
            const saving =
              tier.monthly > 0
                ? Math.round(((tier.monthly - tier.annual) / tier.monthly) * 100)
                : 0;
            const credits = PLAN_CREDITS[tier.id];
            const current = ready && account?.plan === tier.id;

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-[16px] border p-5 ${
                  tier.featured ? "border-acid/50" : "border-ink-100/8"
                } bg-ink-850`}
                style={tier.tint ? { backgroundImage: tier.tint } : undefined}
              >
                {tier.featured && (
                  <span className="absolute -top-2.5 left-5 rounded-[5px] bg-acid px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-950">
                    Best value
                  </span>
                )}

                {/* Header block — fixed height so every CTA lands on one line. */}
                <div className="min-h-[58px]">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-bold uppercase tracking-[0.02em]">
                      {tier.name}
                    </h2>
                    {annual && saving > 0 && (
                      <span className="rounded-[5px] bg-hot/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-hot">
                        {saving}% off
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-ink-400">{tier.blurb}</p>
                </div>

                {/* What the credits buy, before the price — as on the original. */}
                <div className="min-h-[104px] rounded-[10px] border border-ink-100/8 bg-ink-900 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[14px] font-semibold tabular-nums">
                    <Icon name="spark" className="h-3.5 w-3.5 text-acid" />
                    {credits.toLocaleString()} credits
                    <span className="font-normal text-ink-500">/mo</span>
                  </p>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-400">
                    = {Math.floor(credits / stillCost).toLocaleString()} stills
                    <br />~ {Math.floor(credits / videoCost).toLocaleString()} five-second
                    videos
                  </p>
                </div>

                {/* Price block — also fixed height. */}
                <div className="min-h-[72px] pt-4">
                  {/* Fixed height: the strikethrough only renders on discounted
                      tiers, and a second baseline-aligned item grows this line box
                      by a pixel, which tips the whole column out of alignment. */}
                  <div className="flex h-[36px] items-baseline gap-2">
                    {annual && tier.monthly > tier.annual && (
                      <span className="text-[17px] font-semibold text-hot line-through decoration-hot/70">
                        ${tier.monthly}
                      </span>
                    )}
                    <span className="text-[32px] font-bold leading-none tabular-nums">
                      ${price}
                    </span>
                    <span className="text-[13px] text-ink-500">/mo</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-500">
                    {tier.monthly === 0
                      ? "Free forever"
                      : !annual
                        ? "billed monthly"
                        : tier.monthly > tier.annual
                          ? `billed annually · saves $${(tier.monthly - tier.annual) * 12}/yr`
                          : "billed annually · same as monthly"}
                  </p>
                </div>

                {current ? (
                  <Button variant="outline" disabled className="w-full">
                    Current plan
                  </Button>
                ) : (
                  <Button
                    variant={tier.featured ? "primary" : "outline"}
                    className="w-full"
                    onClick={() => choose(tier.id)}
                  >
                    {account ? `Switch to ${tier.name}` : "Get started"}
                  </Button>
                )}

                {/* Feature matrix — identical rows in every column. */}
                <div className="mt-5 space-y-4">
                  {SECTIONS.map((section) => (
                    <div key={section.title}>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-500">
                        {section.title}
                      </p>
                      <ul>
                        {section.rows.map((row) => (
                          <li
                            key={row.label}
                            className="flex min-h-[30px] items-center justify-between gap-2 border-b border-ink-100/5 py-1 last:border-0"
                          >
                            <span className="text-[12px] leading-tight text-ink-400">
                              {row.label}
                            </span>
                            <FeatureValue value={row.values[tier.id]} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[12px] text-ink-500">
          This is a rebuild for assessment — switching plans grants demo credits instantly
          and no payment is taken.{" "}
          <Link href="/generate" className="text-ink-300 underline underline-offset-2">
            Back to generating
          </Link>
        </p>
      </div>
    </div>
  );
}

function FeatureValue({ value }: { value: Value }) {
  if (value === true) {
    return <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-acid" />;
  }
  if (value === false) {
    return (
      <span className="shrink-0 text-[12px] text-ink-600" aria-label="Not included">
        —
      </span>
    );
  }
  return (
    <span className="shrink-0 text-right text-[12px] font-medium text-ink-100">
      {value}
    </span>
  );
}
