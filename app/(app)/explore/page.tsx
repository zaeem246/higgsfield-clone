import type { Metadata } from "next";
import { Gallery } from "@/components/Gallery";
import { COMMUNITY } from "@/lib/seed";

export const metadata: Metadata = {
  title: "Explore — Higgsfield",
  description: "See what the community is making, and recreate any shot with one click.",
};

export default function ExplorePage() {
  return (
    <Gallery
      items={COMMUNITY}
      title="Explore"
      subtitle="Every shot shows the prompt, model and camera move that made it. Open one and hit Recreate to load those exact settings."
      emptyTitle="Nothing to show"
      emptyBody="The community feed is empty."
    />
  );
}
