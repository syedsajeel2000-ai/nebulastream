"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { useToast } from "./Toast";
import { fmtDuration } from "@/lib/format";

interface Props {
  contentId: number;
  title: string;
  type: "movie" | "tv";
  description: string;
  genre: string;
  year: number;
  rating: number;
  durationSec: number;
  episodeLabel?: string;
  startAt: number;
  initialInList: boolean;
  nextEpisodeHref: string | null;
  nextEpisodeLabel: string | null;
}

export default function WatchTitleInfo(props: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inList, setInList] = useState(props.initialInList);

  async function toggleList() {
    if (!user) {
      toast("Log in to build your list.", "info");
      return;
    }
    const next = !inList;
    const res = await fetch("/api/watchlist", {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: props.contentId }),
    });
    if (res.ok) {
      setInList(next);
      toast(next ? "Added to My List" : "Removed from My List", next ? "success" : "info");
    } else {
      toast("Could not update your list.", "error");
    }
  }

  return (
    <div>
      {props.episodeLabel && (
        <p className="text-xs font-semibold uppercase tracking-widest text-[#e50914]">{props.episodeLabel}</p>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="hero-title text-2xl sm:text-3xl">{props.title}</h1>
        <Link href={`/title/${props.contentId}`} className="link-dim text-sm font-semibold">
          Title details →
        </Link>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-white/85">
        <span className="font-bold text-[#f5c518]">★ {props.rating.toFixed(1)}</span>
        <span>{props.year}</span>
        <span>{props.type === "tv" ? "Series" : fmtDuration(props.durationSec)}</span>
        <Link href={`/genre/${encodeURIComponent(props.genre)}`} className="rounded-md bg-white/10 px-2 py-0.5 text-xs transition hover:bg-white/20">
          {props.genre}
        </Link>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80">{props.description}</p>

      {props.startAt > 0 && (
        <p className="mt-2 text-xs font-bold text-emerald-300">
          ▸ Resumed from {Math.floor(props.startAt / 60)}:{String(Math.floor(props.startAt % 60)).padStart(2, "0")}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={toggleList} className={`btn !py-2.5 ${inList ? "btn-accent" : "btn-ghost"}`}>
          {inList ? "✓ In My List" : "＋ My List"}
        </button>
        <Link href={`/title/${props.contentId}`} className="btn btn-ghost !py-2.5">
          More Info
        </Link>
        {props.nextEpisodeHref && props.nextEpisodeLabel && (
          <Link href={props.nextEpisodeHref} className="btn btn-outline !py-2.5">
            Next Episode →
          </Link>
        )}
      </div>
    </div>
  );
}
