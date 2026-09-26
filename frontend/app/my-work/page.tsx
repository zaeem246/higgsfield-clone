import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ShotsList } from "@/components/shots-list";
import { ButtonLink } from "@/components/ui/button";
import { ApiNotice, Notice } from "@/components/ui/notice";
import { currentAccount, serverApi } from "@/lib/api.server";

export const metadata: Metadata = {
  title: "My work",
  description:
    "Everything you have generated, newest first, with the settings and the cost of each one.",
};

const PAGE_SIZE = 12;

export default async function MyWorkPage() {
  const client = await serverApi();
  const me = await currentAccount();

  if (!me.ok) {
    return (
      <div className="shell pb-14">
        <PageHeader
          kicker="Your generations"
          title="My work"
          lede="Everything you have generated, kept in one place with the settings that made it."
        />
        <div className="pt-6">
          {me.error.status === 401 ? (
            <Notice title="Sign in to see your work.">
              <p className="mb-5">
                Your results are tied to your account, not to this browser. Nothing is stored here.
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/sign-in">Sign in</ButtonLink>
                <ButtonLink href="/sign-up" variant="outline">
                  Create an account
                </ButtonLink>
              </div>
            </Notice>
          ) : (
            <ApiNotice error={me.error} />
          )}
        </div>
      </div>
    );
  }

  const shots = await client.generations({ limit: PAGE_SIZE });

  return (
    <div className="shell pb-14">
      <PageHeader
        kicker="Your generations"
        title="My work"
        lede="Everything you have generated, newest first, with the settings printed underneath. Deleting one that failed refunds its credits."
        meta={
          shots.ok
            ? [
                `${shots.data.items.length} ${shots.data.items.length === 1 ? "result" : "results"} loaded`,
                shots.data.nextCursor ? "more on request" : "end of sheet",
              ]
            : undefined
        }
        aside={
          <p className="font-mono text-sm text-graphite">
            <span className="text-ink">{me.data.credits}</span> credits · {me.data.plan}
          </p>
        }
      />

      <div className="pt-6">
        {!shots.ok ? (
          <ApiNotice error={shots.error} />
        ) : shots.data.items.length === 0 ? (
          <Notice title="You have not made anything yet.">
            <p className="mb-5">Start with the first one — trying the tool costs nothing.</p>
            <ButtonLink href="/create">Create something</ButtonLink>
          </Notice>
        ) : (
          <ShotsList initialItems={shots.data.items} initialCursor={shots.data.nextCursor} />
        )}
      </div>
    </div>
  );
}
