"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ContactSheet } from "@/components/contact-sheet";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Generation } from "@/lib/types";

interface ShotsListProps {
  initialItems: Generation[];
  initialCursor: string | null;
}

export function ShotsList({ initialItems, initialCursor }: ShotsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    const result = await api.deleteGeneration(id);
    setDeletingId(null);

    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }

    setItems((previous) => previous.filter((item) => item.id !== id));
    setMessage(
      result.data.refunded > 0
        ? `Removed. ${result.data.refunded} credits refunded.`
        : "Removed.",
    );
    // A refund changes the balance the server-rendered header is showing.
    if (result.data.refunded > 0) router.refresh();
  }

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    const result = await api.generations({ cursor });
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }
    setItems((previous) => [...previous, ...result.data.items]);
    setCursor(result.data.nextCursor);
  }

  return (
    <div>
      <ContactSheet items={items} onDelete={remove} deletingId={deletingId} />

      {message ? (
        <p role="status" className="mt-5 border-l-2 border-vermilion pl-2.5 text-sm text-ink">
          {message}
        </p>
      ) : null}

      {cursor ? (
        <div className="mt-6 flex justify-center border-t border-rule pt-5">
          <Button variant="outline" size="lg" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Show older"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
