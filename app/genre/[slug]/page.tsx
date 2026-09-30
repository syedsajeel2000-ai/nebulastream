import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { listContent } from "@/lib/content";
import { parseBrowseParams, PAGE_SIZE } from "@/lib/browse";
import BrowseFilters from "@/components/BrowseFilters";
import ResultsGrid from "@/components/ResultsGrid";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const KNOWN = ["Action", "Drama", "Comedy", "Sci-Fi", "Thriller", "Romance", "Animation", "Documentary", "Horror", "Adventure"];

function titleize(slug: string): string {
  return KNOWN.find((g) => g.toLowerCase() === decodeURIComponent(slug).toLowerCase()) ?? decodeURIComponent(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${titleize(slug)} Movies & Shows` };
}

export default async function GenrePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const genre = titleize(slug);
  const page = Math.max(1, Number.parseInt(get("page") ?? "1", 10) || 1);

  const filters = parseBrowseParams({
    type: get("type"),
    yearGroup: get("yearGroup"),
    minRating: get("minRating"),
    sort: get("sort"),
    genre,
  });

  const { items, total } = listContent({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const movies = items.filter((i) => i.type === "movie");
  const shows = items.filter((i) => i.type === "tv");

  return (
    <div className="anim-fade-in mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#e50914]">Genre</p>
        <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{genre}</h1>
        <p className="mt-1 text-sm text-dim">
          {total} title{total === 1 ? "" : "s"} — {movies.length} movie{movies.length === 1 ? "" : "s"}, {shows.length} TV show{shows.length === 1 ? "" : "s"} on this page
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <Suspense fallback={<div className="skeleton h-96 rounded-xl" />}>
          <BrowseFilters basePath={`/genre/${encodeURIComponent(genre)}`} extraParams={{ genre }} />
        </Suspense>

        <div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-2xl text-dim">🎭</div>
              <h2 className="text-xl font-semibold">No titles found in {genre}.</h2>
              <div className="mt-5 flex gap-3">
                <Link href="/genres" className="btn btn-accent">All Genres</Link>
                <Link href="/browse" className="btn btn-outline">Browse All</Link>
              </div>
            </div>
          ) : (
            <>
              <ResultsGrid items={items} />
              {total > PAGE_SIZE && (
                <p className="mt-8 text-center text-sm text-dim">
                  Showing {items.length} of {total} titles —{" "}
                  <Link href={`/browse?genre=${encodeURIComponent(genre)}`} className="font-bold text-[#e50914]">
                    see all in Browse
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
