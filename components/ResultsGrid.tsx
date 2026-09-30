"use client";

import ContentCard, { type CardItem } from "./ContentCard";
import { useAuth } from "@/lib/auth-client";
import { useEffect, useState } from "react";

type Item = CardItem & { id: number };

export default function ResultsGrid({ items }: { items: Item[] }) {
  const { user } = useAuth();
  const [inListSet, setInListSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) {
      setInListSet(new Set());
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/watchlist", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { items: { id: number }[] };
        if (!cancelled) setInListSet(new Set(data.items.map((i) => i.id)));
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="stagger grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} inList={inListSet.has(item.id)} />
      ))}
    </div>
  );
}
