import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlanPicker } from "@/components/plan-picker";
import { ApiNotice, Notice } from "@/components/ui/notice";
import { currentAccount, serverApi } from "@/lib/api.server";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "What it costs to generate an image or a video. Three plans, priced in credits, switchable at any time.",
};

export default async function PricingPage() {
  const client = await serverApi();
  const [catalog, me] = await Promise.all([client.catalog(), currentAccount()]);

  return (
    <div className="shell pb-14">
      <PageHeader
        kicker="What it costs to generate"
        title="Priced in credits"
        lede="One credit is one standard image. Video costs more, a bigger size multiplies it, sound adds fifteen per cent — and the price is printed on screen before you spend anything."
        meta={
          catalog.ok
            ? [
                `${catalog.data.plans.length} plans`,
                "1 credit = 1 standard image",
                "switch at any time",
              ]
            : undefined
        }
      />

      <div className="pt-6">
        {!catalog.ok ? (
          <ApiNotice error={catalog.error} />
        ) : catalog.data.plans.length === 0 ? (
          <Notice title="No plans are published.">
            <p>The catalogue answered without any plans, so there is nothing to choose between.</p>
          </Notice>
        ) : (
          <PlanPicker
            plans={catalog.data.plans}
            currentPlan={me.ok ? me.data.plan : null}
            signedIn={me.ok}
          />
        )}
      </div>
    </div>
  );
}
