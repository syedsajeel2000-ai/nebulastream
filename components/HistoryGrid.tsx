"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./Toast";
import { fmtTime } from "@/lib/format";
import { historyKey, type HistoryEntry } from "@/lib/types";

export default function HistoryGrid({ entries }: { entries: HistoryEntry[] }) {
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
      toast(`Removed “${entry.item.title}” from history`, "info");
      router.refresh();
    } else {
      toast("Could not remove this entry.", "error");
    }
  }

  function fmtDate(sql: string): string {
    const d = new Date(sql.replace(" ", "T") + (sql.includes("Z") ? "" : "Z"));
    if (Number.isNaN(d.getTime())) return sql;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  return (
    <ul className="divide-y divide-white/8 overflow-hidden rounded-xl border border-white/8 bg-[#12151f]/50">
      {visible.map((entry) => {
        const duration = entry.episode?.duration ?? entry.item.duration;
        const pct = duration > 0 ? Math.min(100, Math.round((entry.last_position / duration) * 100)) : 0;
        const completed = entry.completed === 1;
        return (
          <li key={historyKey(entry)} className="flex items-center gap-4 p-3 transition hover:bg-white/[0.04] sm:p-4">
            <Link href={entry.episode ? `/watch/${entry.item.id}?ep=${entry.episode.id}` : `/watch/${entry.item.id}`} className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/art?url=${encodeURIComponent(entry.item.poster)}`}
                alt=""
                className="h-20 w-14 rounded-lg object-cover sm:h-24 sm:w-16"
              />
              <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/40 text-white opacity-0 transition hover:opacity-100">
                ▶
              </span>
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/title/${entry.item.id}`} className="truncate font-bold hover:text-[#e50914]">
                  {entry.item.title}
                </Link>
                {completed ? (
                  <span className="badge bg-emerald-500/15 text-emerald-300">Completed</span>
                ) : (
                  <span className="badge badge-hd">{pct}% watched</span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-dim">
                {entry.episode
                  ? `S${entry.episode.season_number}:E${entry.episode.episode_number} · ${entry.episode.title} · `
                  : `${entry.item.genre} · ${entry.item.release_year} · `}
                Watched {fmtDate(entry.updated_at)}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${completed ? "bg-emerald-400" : "bg-[#e50914]"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[0.7rem] font-semibold tabular-nums text-dim">
                  {fmtTime(entry.last_position)} / {fmtTime(duration)}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
              <Link
                href={entry.episode ? `/watch/${entry.item.id}?ep=${entry.episode.id}` : `/watch/${entry.item.id}`}
                className="btn btn-ghost !px-3 !py-1.5 text-xs"
              >
                {completed ? "Watch Again" : "Resume"}
              </Link>
              <button
                onClick={() => remove(entry)}
                className="btn btn-ghost !px-3 !py-1.5 text-xs hover:!border-red-400/50 hover:!text-red-300"
                aria-label={`Remove ${entry.item.title} from history`}
              >
                Remove
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
