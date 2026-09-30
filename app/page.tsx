import Link from "next/link";
import { getHomeRows, getContentById, getContinueWatching, getWatchlist, getCatalogStats, type ContentItem } from "@/lib/content";
import { getCurrentUser } from "@/lib/session";
import { getActiveProfile } from "@/lib/profile";
import HomeHero from "@/components/HomeHero";
import ContentRow from "@/components/ContentRow";
import ProjectShowcase from "@/components/ProjectShowcase";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const profile = user ? await getActiveProfile(user.id) : null;

  const rows = getHomeRows(profile?.id ?? null);
  const heroSource = rows.find((r) => r.key === "featured")?.items ?? [];
  const hero = heroSource.length
    ? heroSource[Math.floor(Math.random() * Math.min(3, heroSource.length))]
    : null;

  const historyEntries = profile ? getContinueWatching(profile.id, 20) : [];
  const listItems = profile ? getWatchlist(profile.id) : [];

  const progressMap: Record<number, { position: number; duration: number; completed: boolean; label?: string }> = {};
  for (const h of historyEntries) {
    if (h.episode) continue;
    const total = h.item.duration || 1;
    progressMap[h.item.id] = {
      position: h.last_position,
      duration: total,
      completed: h.completed === 1,
    };
  }
  const inListSet = new Set(listItems.map((c) => c.id));

  return (
    <div className="anim-fade-in">
      <HomeHero item={hero} progress={progressMap[hero?.id ?? -1]} />

      <div className="relative z-10 mx-auto -mt-10 max-w-[1500px] px-4 pb-16 sm:px-6 lg:px-10 lg:-mt-24">
        <ContentRow title="Continue Watching" items={rows.find((r) => r.key === "continue-watching")?.items} progressMap={progressMap} inListSet={inListSet} />
        <ContentRow title="Trending Now" items={rows.find((r) => r.key === "trending")?.items} inListSet={inListSet} />
        <ContentRow title="Featured" items={rows.find((r) => r.key === "featured")?.items} inListSet={inListSet} />
        <ContentRow title="Popular Movies" items={rows.find((r) => r.key === "popular-movies")?.items} inListSet={inListSet} />
        <ContentRow title="Popular TV Shows" items={rows.find((r) => r.key === "popular-tv")?.items} inListSet={inListSet} />
        <ContentRow title="New Releases" items={rows.find((r) => r.key === "new-releases")?.items} inListSet={inListSet} />
        <ContentRow title="Action" items={rows.find((r) => r.key === "genre-action")?.items} inListSet={inListSet} />
        <ContentRow title="Drama" items={rows.find((r) => r.key === "genre-drama")?.items} inListSet={inListSet} />
        <ContentRow title="Sci-Fi" items={rows.find((r) => r.key === "genre-sci-fi")?.items} inListSet={inListSet} />
        <ContentRow title="Comedy" items={rows.find((r) => r.key === "genre-comedy")?.items} inListSet={inListSet} />
        <ContentRow title="My List" items={rows.find((r) => r.key === "my-list")?.items} inListSet={inListSet} />
        <ContentRow title="Recommended For You" items={rows.find((r) => r.key === "recommended")?.items} inListSet={inListSet} />

        <ProjectShowcase stats={getCatalogStats()} />

        <section className="card-surface mt-14 flex flex-col items-center gap-4 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Ready to explore everything?</h2>
          <p className="max-w-xl text-sm text-dim">
            Browse the full catalog by genre, type, rating and year — or search for a specific title, actor or genre.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/browse" className="btn btn-accent">
              Browse All Titles
            </Link>
            <Link href="/genres" className="btn btn-outline">
              Explore Genres
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return [];
}

// Re-export so tree-shaking keeps getContentById referenced for sitemap tooling.
void getContentById;
void ({} as ContentItem | null);
