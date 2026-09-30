import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getContinueWatching,
  getEpisodeById,
  getEpisodes,
  getContentById,
  getWatchlist,
  listContent,
} from "@/lib/content";
import { getCurrentUser } from "@/lib/session";
import { getActiveProfile } from "@/lib/profile";
import VideoPlayer from "@/components/VideoPlayer";
import { fmtDuration } from "@/lib/format";
import WatchTitleInfo from "@/components/WatchTitleInfo";
import ContentRow from "@/components/ContentRow";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ep?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = getContentById(Number(id));
  return { title: item ? `Watch ${item.title}` : "Watch" };
}

export default async function WatchPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { ep } = await searchParams;
  const contentId = Number(id);
  if (!Number.isInteger(contentId) || contentId <= 0) notFound();

  const item = getContentById(contentId);
  if (!item) notFound();

  const user = await getCurrentUser();
  const profile = user ? await getActiveProfile(user.id) : null;

  const episodes = item.type === "tv" ? getEpisodes(contentId) : [];
  const episode = ep ? getEpisodeById(Number(ep)) : null;
  const validEpisode =
    episode && episode.content_id === contentId
      ? episode
      : episodes.length > 0
        ? undefined /* pick latest progress or first below */
        : null;

  // Determine which episode to resume (or first unwatched / first overall).
  let currentEpisode = validEpisode ?? null;
  if (item.type === "tv" && !currentEpisode && episodes.length > 0) {
    const progress = profile
      ? getContinueWatching(profile.id, 500).find((h) => h.item.id === contentId && h.episode)
      : null;
    currentEpisode = progress?.episode ?? episodes[0];
  }

  const resumeEntry = profile
    ? getContinueWatching(profile.id, 500).find((h) =>
        h.episode ? h.episode.id === currentEpisode?.id : !h.episode && h.item.id === contentId
      )
    : null;

  const videoUrl = currentEpisode?.video_url ?? item.video_url;
  const startAt = resumeEntry && resumeEntry.completed !== 1 ? Math.floor(resumeEntry.last_position) : 0;
  const durationForProgress = currentEpisode?.duration ?? item.duration;

  const nextEpisode =
    currentEpisode && episodes.length > 0
      ? episodes.find(
          (e) =>
            e.season_number === currentEpisode!.season_number &&
            e.episode_number === currentEpisode!.episode_number + 1
        ) ??
        episodes.find((e) => e.season_number === (currentEpisode?.season_number ?? 0) + 1 && e.episode_number === 1)
      : null;

  const related = listContent({ genre: item.genre, limit: 12 }).items.filter((c) => c.id !== item.id);
  const inListSet = new Set(profile ? getWatchlist(profile.id).map((c) => c.id) : []);

  const progressMap: Record<number, { position: number; duration: number; completed: boolean }> = {};
  if (profile) {
    for (const h of getContinueWatching(profile.id, 500)) {
      if (h.episode) continue;
      progressMap[h.item.id] = {
        position: h.last_position,
        duration: h.item.duration || 1,
        completed: h.completed === 1,
      };
    }
  }

  return (
    <div className="anim-fade-in">
      <div className="mx-auto max-w-[1400px] px-0 pb-16 sm:px-6 lg:px-10">
        <div className="sm:pt-6">
          <VideoPlayer
            src={videoUrl}
            poster={item.backdrop}
            startAt={startAt}
            contentId={contentId}
            episodeId={currentEpisode?.id ?? null}
          />
        </div>

        <div className="grid gap-8 px-4 pt-6 sm:px-0 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <WatchTitleInfo
              contentId={item.id}
              title={item.title}
              type={item.type}
              description={currentEpisode?.description || item.description}
              genre={item.genre}
              year={item.release_year}
              rating={item.rating}
              durationSec={durationForProgress}
              episodeLabel={
                currentEpisode ? `S${currentEpisode.season_number}:E${currentEpisode.episode_number} · ${currentEpisode.title}` : undefined
              }
              startAt={startAt}
              initialInList={inListSet.has(item.id)}
              nextEpisodeHref={nextEpisode ? `/watch/${item.id}?ep=${nextEpisode.id}` : null}
              nextEpisodeLabel={nextEpisode ? `S${nextEpisode.season_number}:E${nextEpisode.episode_number} · ${nextEpisode.title}` : null}
            />

            {episodes.length > 0 && (
              <div className="mt-8">
                <h2 className="section-title mb-3">Episodes</h2>
                <ul className="divide-y divide-white/8 overflow-hidden rounded-xl border border-white/8 bg-[#12151f]/60">
                  {episodes.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/watch/${item.id}?ep=${e.id}`}
                        className={`flex items-center gap-4 p-4 transition hover:bg-white/5 ${
                          currentEpisode?.id === e.id ? "bg-white/5" : ""
                        }`}
                      >
                        <span className={`w-6 text-center text-lg font-semibold ${currentEpisode?.id === e.id ? "text-[#e50914]" : "text-dim"}`}>
                          {e.episode_number}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="truncate text-sm font-bold">{e.title}</span>
                            <span className="shrink-0 text-xs text-dim">
                              {fmtDuration(e.duration)}
                            </span>
                          </span>
                          <span className="mt-0.5 line-clamp-1 block text-xs text-dim">{e.description}</span>
                        </span>
                        {currentEpisode?.id === e.id && (
                          <span className="badge badge-accent shrink-0">Now Playing</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Up next */}
          <aside>
            <h2 className="section-title mb-3">Up Next</h2>
            {nextEpisode ? (
              <Link
                href={`/watch/${item.id}?ep=${nextEpisode.id}`}
                className="card-surface block overflow-hidden p-4 transition hover:border-white/20"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-[#e50914]">Next Episode</p>
                <p className="mt-1.5 font-bold">S{nextEpisode.season_number}:E{nextEpisode.episode_number} — {nextEpisode.title}</p>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-dim">{nextEpisode.description}</p>
                <span className="btn btn-accent mt-3 !py-2 text-sm">Play Next →</span>
              </Link>
            ) : (
              <p className="text-sm text-dim">
                {item.type === "tv"
                  ? "You've reached the last available episode."
                  : "Enjoy the rest of the film!"}
              </p>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <div className="mt-12 px-4 sm:px-0">
            <ContentRow title="More Like This" items={related} inListSet={inListSet} progressMap={progressMap} />
          </div>
        )}
      </div>
    </div>
  );
}
