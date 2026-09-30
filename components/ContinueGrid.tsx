"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./Toast";
import { fmtTime } from "@/lib/format";
import { historyKey, type HistoryEntry } from "@/lib/types";

interface Props {
  entries: HistoryEntry[];
  inListSet: Set<number>;
}

export default function ContinueGrid({ entries, inListSet }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();
  const visible = entries.filter((e) => !hidden.has(historyKey(e)));

  async function remove(entry: HistoryEntry) {
    const res = await fetch("/api/progress", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: entry.item.id, episodeId: entry.episode?.id ?? null }),
    });
    if (res.ok) {
      setHidden((s) => new Set(s).add(historyKey(entry)));
      toast(`Removed “${entry.item.title}” from Continue Watching`, "info");
      router.refresh();
    } else {
      toast("Could not remove this title.", "error");
    }
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((entry) => {
        const duration = entry.episode?.duration ?? entry.item.duration;
        const pct = duration > 0 ? Math.min(100, Math.round((entry.last_position / duration) * 100)) : 0;
        const href = entry.episode
          ? `/watch/${entry.item.id}?ep=${entry.episode.id}`
          : `/watch/${entry.item.id}`;
        return (
          <div key={historyKey(entry)} className="card-surface group overflow-hidden transition hover:border-white/20">
            <Link href={href} className="relative block aspect-video overflow-hidden bg-[#1c2130]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/art?url=${encodeURIComponent(entry.item.backdrop)}`}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-black shadow-2xl">▶</span>
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2">
                <span className="mb-1.5 block h-1.5 overflow-hidden rounded-full bg-white/20">
                  <span className="block h-full rounded-full bg-[#e50914]" style={{ width: `${pct}%` }} />
                </span>
                <span className="flex justify-between text-[0.7rem] font-bold text-white/85">
                  <span>{fmtTime(entry.last_position)} / {fmtTime(duration)}</span>
                  <span>{pct}%</span>
                </span>
              </span>
            </Link>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/title/${entry.item.id}`} className="block truncate font-bold hover:text-[#e50914]">
                    {entry.item.title}
                  </Link>
                  <p className="truncate text-xs text-dim">
                    {entry.episode
                      ? `S${entry.episode.season_number}:E${entry.episode.episode_number} · ${entry.episode.title}`
                      : `${entry.item.genre} · ${entry.item.release_year}`}
                  </p>
                </div>
                {inListSet.has(entry.item.id) && <span className="badge badge-accent shrink-0">In List</span>}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Link href={href} className="btn btn-accent !py-2 text-sm">
                  ▶ Resume {pct}%
                </Link>
                <button
                  onClick={() => remove(entry)}
                  className="btn btn-ghost !px-3 !py-2 text-sm"
                  aria-label={`Remove ${entry.item.title} from Continue Watching`}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
