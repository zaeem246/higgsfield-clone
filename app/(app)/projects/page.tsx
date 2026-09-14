"use client";

import { ProjectsGallery } from "@/components/Gallery";
import { useStore } from "@/lib/store";

export default function ProjectsPage() {
  const { generations, ready } = useStore();

  if (!ready) {
    return <div className="p-6 text-sm text-ink-400">Loading your projects…</div>;
  }
  return <ProjectsGallery items={generations} />;
}
