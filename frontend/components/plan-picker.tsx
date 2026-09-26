"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Plan, PlanId } from "@/lib/types";

interface PlanPickerProps {
  plans: Plan[];
  currentPlan: PlanId | null;
  signedIn: boolean;
}

export function PlanPicker({ plans, currentPlan, signedIn }: PlanPickerProps) {
  const router = useRouter();
  const [plan, setPlan] = useState(currentPlan);
  const [busyId, setBusyId] = useState<PlanId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function choose(id: PlanId) {
    setBusyId(id);
    setMessage(null);
    const result = await api.setPlan(id);
    setBusyId(null);

    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }
    setPlan(result.data.plan);
    setMessage(`You are on ${result.data.plan}. Balance: ${result.data.credits} credits.`);
    router.refresh();
  }

  return (
    <div>
      <div className="grid gap-px border border-rule bg-rule lg:grid-cols-3">
        {plans.map((entry) => {
          const current = entry.id === plan;
          return (
            <article
              key={entry.id}
              className={`flex flex-col bg-raised p-4 ${
                current ? "shadow-[inset_0_3px_0_var(--vermilion)]" : ""
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-[1.75rem] leading-none">{entry.name}</h2>
                {current ? <span className="label text-vermilion">Current</span> : null}
              </div>

              <p className="mt-2.5 font-mono text-[2.25rem] leading-none text-ink">
                ${entry.price}
                {entry.price > 0 ? <span className="text-base text-graphite"> / mo</span> : null}
              </p>
              <p className="meta mt-1">{entry.credits} credits a month</p>

              {entry.blurb ? (
                <p className="mt-2.5 text-[0.875rem] leading-snug text-graphite">{entry.blurb}</p>
              ) : null}

              {entry.features.length > 0 ? (
                <ul className="mt-3 flex-1 space-y-1.5 border-t border-rule pt-3 text-[0.875rem]">
                  {entry.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <span aria-hidden className="mt-2 size-1 shrink-0 bg-vermilion" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4 md:mt-auto md:pt-4">
                {signedIn ? (
                  <Button
                    variant={current ? "outline" : "primary"}
                    size="md"
                    className="w-full"
                    disabled={current || busyId !== null}
                    onClick={() => choose(entry.id)}
                  >
                    {current
                      ? "Your plan"
                      : busyId === entry.id
                        ? "Switching…"
                        : `Switch to ${entry.name}`}
                  </Button>
                ) : (
                  <ButtonLink
                    href="/sign-up"
                    variant={entry.price === 0 ? "outline" : "primary"}
                    size="md"
                    className="w-full"
                  >
                    Create an account
                  </ButtonLink>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {message ? (
        <p role="status" className="mt-5 border-l-2 border-vermilion pl-2.5 text-sm text-ink">
          {message}
        </p>
      ) : null}
    </div>
  );
}
