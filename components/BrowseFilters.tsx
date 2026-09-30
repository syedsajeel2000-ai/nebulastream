"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const GENRES = ["Action", "Drama", "Comedy", "Sci-Fi", "Thriller", "Romance", "Animation", "Documentary", "Horror", "Adventure"];
const SORTS: [string, string][] = [
  ["popular", "Popular"],
  ["newest", "Newest"],
  ["rating", "Highest Rated"],
  ["az", "A–Z"],
];
const RATINGS: [string, string][] = [
  ["8", "8+ Stellar"],
  ["7", "7+ Great"],
  ["6", "6+ Good"],
];
const YEAR_GROUPS: [string, string][] = [
  ["newest", "2024–2026"],
  ["recent", "2020–2023"],
  ["older", "2016–2019"],
];

export default function BrowseFilters({
  basePath,
  lockedType,
  extraParams,
}: {
  basePath: string;
  lockedType?: "movie" | "tv";
  extraParams?: Record<string, string>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      for (const [k, v] of Object.entries(extraParams ?? {})) next.set(k, v);
      router.push(`${basePath}?${next.toString()}`, { scroll: false });
    },
    [params, router, basePath, extraParams]
  );

  const activeCount = ["genre", "minRating", "yearGroup", "sort"].filter((k) => params.get(k)).length +
    (params.get("q") ? 1 : 0);

  const group = (label: string, children: React.ReactNode) => (
    <div className="border-b border-white/8 py-4 last:border-0">
      <h3 className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-widest text-dim">{label}</h3>
      {children}
    </div>
  );

  const chip = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-left text-sm font-semibold transition ${
      active ? "bg-white text-black" : "border border-white/12 bg-white/5 text-dim hover:border-white/30 hover:text-white"
    }`;

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen((o) => !o)} className="btn btn-outline mb-4 w-full lg:hidden">
        Filters & Sort {activeCount > 0 ? `(${activeCount})` : ""} {open ? "▲" : "▼"}
      </button>

      <aside className={`card-surface mb-6 p-4 lg:sticky lg:top-20 lg:mb-0 lg:block ${open ? "block" : "hidden"}`}>
        {!lockedType && group("Type", (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setParam("type", null)} className={chip(!params.get("type"))}>All</button>
            <button onClick={() => setParam("type", "movie")} className={chip(params.get("type") === "movie")}>Movies</button>
            <button onClick={() => setParam("type", "tv")} className={chip(params.get("type") === "tv")}>TV Shows</button>
          </div>
        ))}

        {group("Genre", (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setParam("genre", null)} className={chip(!params.get("genre"))}>All</button>
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setParam("genre", params.get("genre") === g ? null : g)}
                className={chip(params.get("genre") === g)}
              >
                {g}
              </button>
            ))}
          </div>
        ))}

        {group("Year", (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setParam("yearGroup", null)} className={chip(!params.get("yearGroup"))}>Any</button>
            {YEAR_GROUPS.map(([v, label]) => (
              <button key={v} onClick={() => setParam("yearGroup", params.get("yearGroup") === v ? null : v)} className={chip(params.get("yearGroup") === v)}>
                {label}
              </button>
            ))}
          </div>
        ))}

        {group("Rating", (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setParam("minRating", null)} className={chip(!params.get("minRating"))}>Any</button>
            {RATINGS.map(([v, label]) => (
              <button key={v} onClick={() => setParam("minRating", params.get("minRating") === v ? null : v)} className={chip(params.get("minRating") === v)}>
                {label}
              </button>
            ))}
          </div>
        ))}

        {group("Sort By", (
          <div className="flex flex-wrap gap-2">
            {SORTS.map(([v, label]) => (
              <button key={v} onClick={() => setParam("sort", v)} className={chip((params.get("sort") ?? "popular") === v)}>
                {label}
              </button>
            ))}
          </div>
        ))}

        {activeCount > 0 && (
          <button onClick={() => router.push(basePath)} className="mt-3 text-sm font-bold text-[#e50914] transition hover:text-[#ff3b30]">
            Clear all filters ✕
          </button>
        )}
      </aside>
    </>
  );
}
