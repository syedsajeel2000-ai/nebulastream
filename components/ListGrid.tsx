"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ContentCard, { type CardItem } from "./ContentCard";
import { useToast } from "./Toast";

interface Props {
  items: (CardItem & { id: number })[];
  inListIds?: Set<number>;
  showRemove?: boolean;
}

export default function ListGrid({ items, inListIds, showRemove }: Props) {
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const router = useRouter();
  const visible = items.filter((i) => !removed.has(i.id));

  async function removeFromList(contentId: number, title: string) {
    const res = await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId }),
    });
    if (res.ok) {
      setRemoved((s) => new Set(s).add(contentId));
      toast(`Removed “${title}” from My List`, "info");
      router.refresh();
    } else {
      toast("Could not update your list.", "error");
    }
  }

  return (
    <div className="stagger grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {visible.map((item) => (
        <div key={item.id} className="relative">
          <ContentCard item={item} inList={inListIds?.has(item.id) ?? showRemove} />
          {showRemove && (
            <button
              onClick={() => removeFromList(item.id, item.title)}
              className="absolute right-1.5 top-1.5 z-20 grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/75 text-xs backdrop-blur transition hover:scale-110 hover:border-red-400 hover:text-red-300"
              aria-label={`Remove ${item.title} from My List`}
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
