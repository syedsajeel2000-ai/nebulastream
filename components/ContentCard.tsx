"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { useToast } from "./Toast";
import { Tilt3D } from "./motion";
import { fmtDuration, fmtTime } from "@/lib/format";

export interface CardItem {
  id: number;
  title: string;
  type: "movie" | "tv";
  genre: string;
  release_year: number;
  rating: number;
  poster: string;
  duration?: number;
  trending?: number;
  featured?: number;
}

export interface CardProgress {
  position: number;
  duration: number;
  completed: boolean;
  label?: string;
}

interface Props {
  item: CardItem;
  progress?: CardProgress;
  inList?: boolean;
  onListChange?: (inList: boolean) => void;
}

export default function ContentCard({ item, progress, inList: inListProp, onListChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [inList, setInList] = useState(Boolean(inListProp));
  const [busy, setBusy] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (inListProp !== undefined) setInList(Boolean(inListProp));
  }, [inListProp]);

  const pct = progress && progress.duration > 0 ? Math.min(100, Math.round((progress.position / progress.duration) * 100)) : 0;

  async function toggleList(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast("Log in to build your list.", "info");
      router.push("/login");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !inList;
    try {
      const res = await fetch("/api/watchlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not update your list.");
      }
      setInList(next);
      onListChange?.(next);
      toast(next ? `Added “${item.title}” to My List` : `Removed “${item.title}” from My List`, next ? "success" : "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  }

  const playHref = `/watch/${item.id}`;

  return (
    <Link
      href={`/title/${item.id}`}
      className="group relative block w-[150px] shrink-0 sm:w-[168px] lg:w-[185px]"
      aria-label={`${item.title} details`}
    >
      <Tilt3D className="group/tilt relative" max={7} scale={1.04}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/8 bg-[#171b28] shadow-lg transition-all duration-300 ease-out group-hover:z-10 group-hover:border-white/25 group-hover:shadow-2xl">
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/art?url=${encodeURIComponent(item.poster)}`}
            alt={`${item.title} poster`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1c2130] to-[#12151f] p-3 text-center">
            <span className="text-sm font-bold text-dim">{item.title}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {item.trending ? <span className="badge badge-accent">Trending</span> : null}
          {item.featured ? <span className="badge badge-gold">Featured</span> : null}
        </div>

        {/* Hover overlay (desktop) */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/45 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
          <div className="flex items-center gap-1.5">
            <span
              role="button"
              tabIndex={0}
              aria-label={`Play ${item.title}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(playHref);
              }}
              onKeyDown={(e) => e.key === "Enter" && router.push(playHref)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-110"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13l11-6.5-11-6.5z" />
              </svg>
            </span>
            <span
              role="button"
              tabIndex={0}
              aria-label={inList ? "Remove from My List" : "Add to My List"}
              onClick={toggleList}
              onKeyDown={(e) => e.key === "Enter" && toggleList(e as unknown as React.MouseEvent)}
              className={`grid h-9 w-9 place-items-center rounded-full border shadow-lg transition hover:scale-110 ${
                inList ? "border-[#e50914] bg-[#e50914] text-white" : "border-white/40 bg-black/50 text-white"
              }`}
            >
              {inList ? "✓" : "＋"}
            </span>
          </div>
          <p className="mt-2 line-clamp-1 text-xs font-bold">{item.title}</p>
          <p className="text-[0.68rem] text-dim">
            {item.genre} · {item.release_year}
            {item.type === "movie" && item.duration ? ` · ${fmtDuration(item.duration)}` : " · Series"}
          </p>
        </div>

        {/* Progress bar */}
        {progress && pct > 0 && (
          <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 pb-1.5 pt-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className={`h-full rounded-full ${progress.completed ? "bg-emerald-400" : "bg-[#e50914]"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
      </Tilt3D>

      {/* Info below poster — always visible (mobile-friendly) */}
      <div className="mt-2 px-0.5">
        <p className="truncate text-sm font-semibold">{item.title}</p>
        <p className="flex items-center gap-1.5 text-[0.7rem] text-dim">
          <span className="font-bold text-[#f5c518]">★ {item.rating.toFixed(1)}</span>
          <span>· {item.release_year}</span>
          <span className="truncate">· {item.genre}</span>
        </p>
        {progress && pct > 0 && (
          <p className="mt-0.5 text-[0.68rem] font-semibold text-dim">
            {progress.completed ? "Completed" : `${pct}% watched${progress.label ? ` · ${progress.label}` : ""}`}
          </p>
        )}
      </div>
    </Link>
  );
}
