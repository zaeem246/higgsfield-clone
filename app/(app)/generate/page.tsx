import { Suspense } from "react";
import type { Metadata } from "next";
import { Generator } from "@/components/Generator";

export const metadata: Metadata = {
  title: "Generate — Higgsfield",
  description: "Write a prompt, pick a camera move, and generate cinematic video or images.",
};

export default function GeneratePage() {
  return (
    // The generator reads "Recreate" settings from the query string, so it must
    // sit behind a Suspense boundary.
    <Suspense fallback={<div className="p-6 text-sm text-ink-400">Loading generator…</div>}>
      <Generator />
    </Suspense>
  );
}
