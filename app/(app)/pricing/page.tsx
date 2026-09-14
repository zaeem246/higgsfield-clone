"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { findModel } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { PLAN_CREDITS, type Account } from "@/lib/types";
import { Badge, Button, Icon } from "@/components/ui";

/**
 * Tiers, prices and framing follow the live pricing page: Basic / Pro / Max,
 * a monthly-annual toggle with the discount called out, and — the detail worth
 * copying — every allowance translated into actual generations, because
 * "600 credits" means nothing until you know what it buys.
 */
interface Tier {
  id: Account["plan"];
  name: string;
  monthly: number;
  annual: number;
  blurb: string;
  perks: string[];
  limits?: string[];
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    blurb: "Try the whole surface, no card.",
    perks: [
      "All 28 camera moves and 24 effects",
      "Every look control",
      "720p and 1080p",
    ],
    limits: ["Watermarked exports", "One generation at a time"],
  },
  {
    id: "basic",
    name: "Basic",
    monthly: 9,
    annual: 9,
    blurb: "For first-time AI creators.",
    perks: ["No watermark", "Up to 2 parallel generations", "All image models"],
    limits: ["No Seedance 2.5", "No 4K"],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 29,
    annual: 23,
    blurb: "For everyday AI creation.",
    perks: [
      "Full Seedance line-up",
      "4K renders",
      "Unlimited parallel generations",
      "Batch up to 4",
      "Commercial licence",
    ],
    featured: true,
  },
  {
    id: "max",
    name: "Max",
    monthly: 79,
    annual: 59,
    blurb: "For ambitious AI projects.",
    perks: [
      "Everything in Pro",
      "Longest durations",
      "Early access to new models",
      "Priority queue",
      "Team seats",
    ],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const { account, setPlan, ready } = useStore();
  const router = useRouter();

  const choose = (id: Account["plan"]) => {
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
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 text-center">
          <h1 className="display text-3xl font-bold uppercase sm:text-4xl">Pricing</h1>
          <p className="mx-auto mt-2.5 max-w-md text-sm text-ink-400">
            Credits buy generations. Plans reset monthly and unused credits roll over for
            30 days.
          </p>

          <div className="mt-5 inline-flex items-center gap-1 rounded-full border border-ink-700 bg-ink-850 p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                !annual ? "bg-ink-100 text-ink-950" : "text-ink-400"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                annual ? "bg-ink-100 text-ink-950" : "text-ink-400"
              }`}
            >
              Annual
              <span className={annual ? "text-acid-deep" : "text-acid"}>−25%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {TIERS.map((tier) => {
            const price = annual ? tier.annual : tier.monthly;
            const credits = PLAN_CREDITS[tier.id];
            const current = ready && account?.plan === tier.id;

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-[14px] border p-5 ${
                  tier.featured
                    ? "border-acid/45 bg-acid/[0.04]"
                    : "border-ink-100/8 bg-ink-850"
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-2.5 left-5">
                    <Badge tone="accent">Best value</Badge>
                  </div>
                )}

                <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]">
                  {tier.name}
                </h2>
                <p className="mt-1 text-[12px] text-ink-400">{tier.blurb}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tabular-nums">${price}</span>
                  <span className="text-[13px] text-ink-500">/mo</span>
                </div>
                {annual && tier.monthly > tier.annual && (
                  <p className="mt-0.5 text-[11px] text-ink-500">
                    billed annually · saves ${(tier.monthly - tier.annual) * 12}/yr
                  </p>
                )}

                {/* What the credits actually buy */}
                <div className="mt-4 rounded-[9px] border border-ink-100/8 bg-ink-900 px-3 py-2.5">
                  <p className="text-[13px] font-medium tabular-nums">
                    {credits.toLocaleString()} credits
                    <span className="text-ink-500">/mo</span>
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
                    = {Math.floor(credits / stillCost)} stills
                    <br />~ {Math.floor(credits / videoCost)} five-second videos
                  </p>
                </div>

                <ul className="mt-4 flex-1 space-y-1.5">
                  {tier.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-2 text-[12.5px] text-ink-200"
                    >
                      <Icon
                        name="check"
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-acid"
                      />
                      {perk}
                    </li>
                  ))}
                  {tier.limits?.map((limit) => (
                    <li
                      key={limit}
                      className="flex items-start gap-2 text-[12.5px] text-ink-500"
                    >
                      <Icon name="close" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {limit}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
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
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-center text-[12px] text-ink-500">
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
