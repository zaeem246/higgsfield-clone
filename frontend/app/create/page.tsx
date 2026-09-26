import type { Metadata } from "next";
import { Composer } from "@/components/composer";
import { PageHeader } from "@/components/page-header";
import { ApiNotice } from "@/components/ui/notice";
import { currentAccount, serverApi } from "@/lib/api.server";
import { shotFromParams } from "@/lib/shot";

export const metadata: Metadata = {
  title: "Create",
  description:
    "Generate an image or a video: write what you want to see, choose the film stock, colour, lighting, effect and camera move, and read the finished prompt and its price before you spend anything.",
};

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const client = await serverApi();
  const [catalog, me] = await Promise.all([client.catalog(), currentAccount()]);
  const params = await searchParams;

  return (
    <div className="shell pb-14">
      <PageHeader
        kicker="Generate an image or a video"
        title="Create"
        lede="Write what you want to see, then choose how it should look and how the camera should move. The finished prompt and the price update as you go, and nothing is charged until you press generate."
        meta={
          catalog.ok
            ? [
                `${catalog.data.models.length} models`,
                `${catalog.data.presets.length} styles and moves`,
                "subject · film stock · colour · lighting · effect · camera",
              ]
            : undefined
        }
        aside={
          me.ok ? (
            <p className="font-mono text-sm text-graphite">
              <span className="text-ink">{me.data.credits}</span> credits · {me.data.plan}
            </p>
          ) : null
        }
      />

      <div className="pt-6">
        {catalog.ok ? (
          <Composer
            catalog={catalog.data}
            initialShot={shotFromParams(params, catalog.data)}
            signedIn={me.ok}
          />
        ) : (
          <ApiNotice error={catalog.error} />
        )}
      </div>
    </div>
  );
}
