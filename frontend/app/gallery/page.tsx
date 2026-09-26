import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery-grid";
import { PageHeader } from "@/components/page-header";
import { ApiNotice, Notice } from "@/components/ui/notice";
import { currentAccount, serverApi } from "@/lib/api.server";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Images and video other people have generated with Kinograde, each shown with the exact settings that made it. Reuse any of them in one click.",
};

const PAGE_SIZE = 12;

export default async function GalleryPage() {
  const client = await serverApi();
  const [feed, me] = await Promise.all([client.feed({ limit: PAGE_SIZE }), currentAccount()]);

  return (
    <div className="shell pb-14">
      <PageHeader
        kicker="Everyone's work"
        title="Gallery"
        lede="Images and video other people have made here. Each one shows the settings that produced it, and Recreate opens those settings in your own tool so you can change one thing and run it again."
        meta={
          feed.ok
            ? [
                `${feed.data.items.length} ${feed.data.items.length === 1 ? "result" : "results"} loaded`,
                feed.data.nextCursor ? "more on request" : "end of sheet",
              ]
            : undefined
        }
      />

      <div className="pt-6">
        {!feed.ok ? (
          <ApiNotice error={feed.error} />
        ) : feed.data.items.length === 0 ? (
          <Notice title="The gallery is empty.">
            <p>Nothing has been shared yet. Generate something and it will appear here.</p>
          </Notice>
        ) : (
          <GalleryGrid
            initialItems={feed.data.items}
            initialCursor={feed.data.nextCursor}
            signedIn={me.ok}
          />
        )}
      </div>
    </div>
  );
}
