import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { listContent } from "@/lib/content";
import { parseBrowseParams, PAGE_SIZE } from "@/lib/browse";
import BrowseFilters from "@/components/BrowseFilters";
import ResultsGrid from "@/components/ResultsGrid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const q = (get("q") ?? "").trim();
  const page = Math.max(1, Number.parseInt(get("page") ?? "1", 10) || 1);

  const filters = parseBrowseParams({
    type: get("type"),
    genre: get("genre"),
    yearGroup: get("yearGroup"),
    minRating: get("minRating"),
    sort: get("sort"),
    q: q || undefined,
  });
  const { items, total } = listContent({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });

  const qs = (over: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    for (const [k, v] of Object.entries({ type: get("type"), genre: get("genre"), yearGroup: get("yearGroup"), minRating: get("minRating"), sort: get("sort") })) {
      if (v) next.set(k, v);
    }
    for (const [k, v] of Object.entries(over)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    return `/search?${next.toString()}`;
  };

  return (
    <div className="anim-fade-in mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#e50914]">Search</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {q ? (
            <>
              Results for <span className="text-[#e50914]">“{q}”</span>
            </>
          ) : (
            "Search NebulaStream"
          )}
        </h1>
        <p className="mt-1 text-sm text-dim">
          {q ? `${total} title${total === 1 ? "" : "s"} found` : "Search by title, genre, or cast member."}
        </p>
      </header>

      {!q ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-2xl">🔍</div>
          <p className="text-sm text-dim">Try searching for a movie, a TV show, a genre like “Sci-Fi”, or an actor’s name.</p>
          <Link href="/browse" className="btn btn-accent mt-5">Browse All</Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <Suspense fallback={<div className="skeleton h-96 rounded-xl" />}>
            <BrowseFilters basePath="/search" extraParams={{ q }} />
          </Suspense>

          <div>
            {items.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-2xl text-dim">🎬</div>
                <h2 className="text-xl font-semibold">No titles found.</h2>
                <p className="mt-1 max-w-sm text-sm text-dim">
                  Nothing matched “{q}”. Try a different title, genre, or actor — or browse the full catalog.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href={`/search?q=${encodeURIComponent(q)}`} className="btn btn-accent">Clear Search</Link>
                  <Link href="/browse" className="btn btn-outline">Browse All</Link>
                </div>
              </div>
            ) : (
              <Suspense fallback={<GridSkeleton />}>
                <ResultsGrid items={items} />
              </Suspense>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[2/3] rounded-xl" />
          <div className="skeleton mt-2 h-3.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}
