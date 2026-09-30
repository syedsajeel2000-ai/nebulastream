import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { listContent } from "@/lib/content";
import { parseBrowseParams, PAGE_SIZE } from "@/lib/browse";
import BrowseFilters from "@/components/BrowseFilters";
import ResultsGrid from "@/components/ResultsGrid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Browse" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BrowsePage({ searchParams }: Props) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const page = Math.max(1, Number.parseInt(get("page") ?? "1", 10) || 1);

  const filters = parseBrowseParams({
    type: get("type"),
    genre: get("genre"),
    yearGroup: get("yearGroup"),
    minRating: get("minRating"),
    sort: get("sort"),
  });
  const { items, total } = listContent({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qs = (over: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ type: get("type"), genre: get("genre"), yearGroup: get("yearGroup"), minRating: get("minRating"), sort: get("sort") })) {
      if (v) next.set(k, v);
    }
    for (const [k, v] of Object.entries(over)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    return `/browse?${next.toString()}`;
  };

  return (
    <div className="anim-fade-in mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">
          {filters.type === "movie" ? "Movies" : filters.type === "tv" ? "TV Shows" : "Browse All"}
        </h1>
        <p className="mt-1 text-sm text-dim">
          {total} title{total === 1 ? "" : "s"}{filters.genre ? ` in ${filters.genre}` : ""}
          {filters.minRating ? ` rated ${filters.minRating}+` : ""}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <Suspense fallback={<div className="skeleton h-96 rounded-xl" />}>
          <BrowseFilters basePath="/browse" />
        </Suspense>

        <div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-2xl text-dim">🔍</div>
              <h2 className="text-xl font-semibold">No titles found.</h2>
              <p className="mt-1 max-w-sm text-sm text-dim">Try adjusting or clearing your filters to see more results.</p>
              <div className="mt-5 flex gap-3">
                <Link href="/browse" className="btn btn-accent">Clear Filters</Link>
                <Link href="/" className="btn btn-outline">Go Home</Link>
              </div>
            </div>
          ) : (
            <>
              <Suspense fallback={<ResultsSkeleton />}>
                <ResultsGrid items={items} />
              </Suspense>

              {pages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                  {page > 1 && (
                    <Link href={qs({ page: String(page - 1) })} className="btn btn-ghost !py-2 text-sm">
                      ← Prev
                    </Link>
                  )}
                  <span className="px-3 text-sm font-semibold text-dim">
                    Page {page} of {pages}
                  </span>
                  {page < pages && (
                    <Link href={qs({ page: String(page + 1) })} className="btn btn-ghost !py-2 text-sm">
                      Next →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[2/3] rounded-xl" />
          <div className="skeleton mt-2 h-3.5 w-3/4" />
          <div className="skeleton mt-1.5 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
