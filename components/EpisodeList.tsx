"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Episode } from "@/lib/types";

interface Props {
  episodes: Episode[];
  contentId: number;
}

function fmtMin(sec: number): string {
  const m = Math.round((sec || 0) / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

export default function EpisodeList({ episodes, contentId }: Props) {
  const seasons = useMemo(() => {
    const set = new Map<number, Episode[]>();
    for (const ep of episodes) {
      const list = set.get(ep.season_number) ?? [];
      list.push(ep);
      set.set(ep.season_number, list);
    }
    return [...set.entries()].sort((a, b) => a[0] - b[0]).map(([num, eps]) => ({ num, eps }));
  }, [episodes]);

  const [season, setSeason] = useState(seasons[0]?.num ?? 1);
  const current = seasons.find((s) => s.num === season) ?? seasons[0];

  if (seasons.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="section-title mr-2">Episodes</h2>
        {seasons.map((s) => (
          <button
            key={s.num}
            onClick={() => setSeason(s.num)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition ${
              season === s.num
                ? "bg-white text-black"
                : "border border-white/15 bg-white/5 text-dim hover:text-white"
            }`}
          >
            Season {s.num}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-white/8 overflow-hidden rounded-xl border border-white/8 bg-[#12151f]/60">
        {current!.eps.map((ep) => (
          <li key={ep.id}>
            <Link
              href={`/watch/${contentId}?ep=${ep.id}`}
              className="group flex items-center gap-4 p-4 transition hover:bg-white/5"
            >
              <span className="w-6 shrink-0 text-center text-lg font-black text-dim group-hover:text-white">
                {ep.episode_number}
              </span>
              <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-[#1c2130]">
                <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#232937] to-[#171b28] text-xl opacity-70">
                  ▶
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-bold group-hover:text-white">{ep.title}</span>
                  <span className="shrink-0 text-xs text-dim">{fmtMin(ep.duration)}</span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-dim">{ep.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
