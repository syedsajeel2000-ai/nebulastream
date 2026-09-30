import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCast,
  getContentById,
  getEpisodes,
  listContent,
  isInWatchlist,
  isLiked,
  getContinueWatching,
  upsertWatchProgress,
} from "@/lib/content";
import { getCurrentUser } from "@/lib/session";
import { getActiveProfile } from "@/lib/profile";
import TitleActions from "@/components/TitleActions";
import EpisodeList from "@/components/EpisodeList";
import ContentRow from "@/components/ContentRow";
import TrailerButton from "@/components/TrailerButton";
import { fmtDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const item = getContentById(Number(id));
  return { title: item ? item.title : "Title not found" };
}

export default async function TitlePage({ params }: Params) {
  const { id } = await params;
  const contentId = Number(id);
  if (!Number.isInteger(contentId) || contentId <= 0) notFound();

  const item = getContentById(contentId);
  if (!item) notFound();

  const user = await getCurrentUser();
  const profile = user ? await getActiveProfile(user.id) : null;

  // Record an "opened" history stub so progress shows up before any playback.
  if (profile && !isInWatchlist(profile.id, contentId)) {
    const existing = getContinueWatching(profile.id, 500).some((h) => h.item.id === contentId && !h.episode);
    if (!existing) {
      upsertWatchProgress(profile.id, contentId, null, 0, false);
    }
  }

  const cast = getCast(contentId);
  const episodes = item.type === "tv" ? getEpisodes(contentId) : [];
  const inList = profile ? isInWatchlist(profile.id, contentId) : false;
  const liked = profile ? isLiked(profile.id, contentId) : false;

  const similar = listContent({ genre: item.genre, limit: 12 }).items.filter((c) => c.id !== item.id);
  const director = cast.find((c) => c.role.toLowerCase() === "director") ?? null;
  const actors = cast.filter((c) => c !== director);

  const resume = profile
    ? getContinueWatching(profile.id, 500).find((h) => h.item.id === contentId && !h.episode)
    : null;
  const pct =
    resume && item.duration > 0
      ? Math.min(100, Math.round((resume.last_position / item.duration) * 100))
      : 0;

  return (
    <div className="anim-fade-in">
      {/* Backdrop */}
      <section className="relative h-[52vh] min-h-[360px] w-full overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/art?url=${encodeURIComponent(item.backdrop)}`}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-[#0a0c14]/60 to-[#0a0c14]/25" />
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
        <div className="-mt-40 relative z-10 flex flex-col gap-8 sm:flex-row">
          {/* Poster */}
          <div className="w-44 shrink-0 sm:w-56">
            <div className="overflow-hidden rounded-2xl border border-white/15 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/art?url=${encodeURIComponent(item.poster)}`}
                alt={`${item.title} poster`}
                className="aspect-[2/3] w-full object-cover"
              />
            </div>
            {item.trailer_url && <TrailerButton url={item.trailer_url} title={item.title} />}
          </div>

          {/* Main info */}
          <div className="min-w-0 flex-1 pb-2">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="badge badge-accent">{item.type === "tv" ? "TV Series" : "Movie"}</span>
              <span className="badge badge-hd">{item.license ?? "Public Domain"}</span>
              {item.trending ? <span className="badge badge-accent">Trending</span> : null}
              {item.featured ? <span className="badge badge-gold">Featured</span> : null}
            </div>

            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{item.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-white/85">
              <span className="font-bold text-[#f5c518]">★ {item.rating.toFixed(1)}</span>
              <span>{item.release_year}</span>
              <span>
                {item.type === "tv"
                  ? `${new Set(episodes.map((e) => e.season_number)).size} season${new Set(episodes.map((e) => e.season_number)).size === 1 ? "" : "s"} · ${episodes.length} episodes`
                  : fmtDuration(item.duration)}
              </span>
              <Link href={`/genre/${encodeURIComponent(item.genre)}`} className="rounded-md bg-white/10 px-2 py-0.5 text-xs transition hover:bg-white/20">
                {item.genre}
              </Link>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">{item.description}</p>

            {resume && pct > 0 && !resume.completed && (
              <div className="mt-4 max-w-md">
                <div className="mb-1 flex justify-between text-[0.7rem] font-bold text-dim">
                  <span>Resume from {Math.floor(resume.last_position / 60)}:{String(Math.floor(resume.last_position % 60)).padStart(2, "0")}</span>
                  <span>{pct}% watched</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-[#e50914]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            <div className="mt-6">
              <TitleActions contentId={item.id} title={item.title} initialInList={inList} initialLiked={liked} />
            </div>

            {/* Cast & crew */}
            <div className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
              <div>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-dim">Cast</h3>
                <p className="leading-relaxed text-white/85">
                  {actors.length
                    ? actors.map((a, i) => (
                        <span key={a.name}>
                          <span className="font-semibold">{a.name}</span>
                          <span className="text-dim"> as {a.role}</span>
                          {i < actors.length - 1 ? ", " : ""}
                        </span>
                      ))
                    : "Cast information not available."}
                </p>
              </div>
              <div>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-dim">Director</h3>
                <p className="text-white/85">{director?.name ?? "Not listed"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes */}
        {item.type === "tv" && episodes.length > 0 && (
          <div className="mt-12">
            <EpisodeList episodes={episodes} contentId={item.id} />
          </div>
        )}

        {/* Similar titles */}
        {similar.length > 0 && (
          <div className="mt-14">
            <ContentRow title={`More Like ${item.title}`} items={similar} inListSet={new Set()} />
          </div>
        )}
      </div>
    </div>
  );
}
