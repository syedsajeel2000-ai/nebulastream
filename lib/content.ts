/**
 * Content query layer — every read here is a real SQLite query (no hardcoded
 * frontend arrays). Server-side only; shared types live in lib/types.ts.
 */
import { db } from "./db";
import type { ContentType, ContentItem, Episode, HistoryEntry } from "./types";

export type { ContentType, ContentItem, Episode, HistoryEntry };
export { historyKey } from "./types";

export interface CastMember {
  name: string;
  role: string;
}

/* ------------------------------- Basic getters ------------------------------ */

export function getContentById(id: number): ContentItem | null {
  const row = db
    .prepare<[number], ContentItem>("SELECT * FROM content WHERE id = ?")
    .get(id);
  return row ?? null;
}

export function getEpisodes(contentId: number): Episode[] {
  return db
    .prepare<[number], Episode>(
      "SELECT * FROM episodes WHERE content_id = ? ORDER BY season_number, episode_number"
    )
    .all(contentId);
}

export function getEpisodeById(id: number): Episode | null {
  return db.prepare<[number], Episode>("SELECT * FROM episodes WHERE id = ?").get(id) ?? null;
}

export function getCast(contentId: number): CastMember[] {
  return db
    .prepare<[number], CastMember>("SELECT name, role FROM cast_members WHERE content_id = ? ORDER BY sort_order")
    .all(contentId);
}

/* --------------------------------- Listings --------------------------------- */

export interface BrowseFilters {
  type?: ContentType;
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  q?: string;
  sort?: "popular" | "newest" | "rating" | "az";
  limit?: number;
  offset?: number;
}

export function listContent(f: BrowseFilters): { items: ContentItem[]; total: number } {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (f.type) {
    where.push("type = ?");
    params.push(f.type);
  }
  if (f.genre) {
    where.push("genre = ?");
    params.push(f.genre);
  }
  if (f.yearFrom) {
    where.push("release_year >= ?");
    params.push(f.yearFrom);
  }
  if (f.yearTo) {
    where.push("release_year <= ?");
    params.push(f.yearTo);
  }
  if (f.minRating) {
    where.push("rating >= ?");
    params.push(f.minRating);
  }
  if (f.q) {
    // Search across title, genre (incl. normalized, e.g. "scifi" → "Sci-Fi") and cast names.
    const like = `%${f.q}%`;
    const normalized = `%${f.q.replace(/[-\s]/g, "")}%`;
    where.push(
      `(title LIKE ? COLLATE NOCASE 
        OR genre LIKE ? COLLATE NOCASE 
        OR REPLACE(genre, '-', '') LIKE ? COLLATE NOCASE 
        OR id IN (
          SELECT content_id FROM cast_members WHERE name LIKE ? COLLATE NOCASE
        ))`
    );
    params.push(like, like, normalized, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderBy =
    f.sort === "newest"
      ? "release_year DESC, id DESC"
      : f.sort === "rating"
        ? "rating DESC, release_year DESC"
        : f.sort === "az"
          ? "title COLLATE NOCASE ASC"
          : "(featured * 2 + trending) DESC, rating DESC"; // popular

  const limit = Math.min(f.limit ?? 24, 100);
  const offset = Math.max(f.offset ?? 0, 0);

  const total = (
    db.prepare<(string | number)[], { n: number }>(`SELECT COUNT(*) AS n FROM content ${whereSql}`).get(...params)
      ?.n ?? 0
  ) as number;

  const items = db
    .prepare<(string | number)[], ContentItem>(
      `SELECT * FROM content ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  return { items, total };
}

export interface HomeRow {
  key: string;
  title: string;
  items: ContentItem[];
}

export interface CatalogStats {
  titles: number;
  episodes: number;
  genres: number;
}

/** Live catalog counters for the homepage showcase section. */
export function getCatalogStats(): CatalogStats {
  const titles = (db.prepare("SELECT COUNT(*) n FROM content").get() as { n: number }).n;
  const episodes = (db.prepare("SELECT COUNT(*) n FROM episodes").get() as { n: number }).n;
  const genres = (db.prepare("SELECT COUNT(DISTINCT genre) n FROM content").get() as { n: number }).n;
  return { titles, episodes, genres };
}

export function getHomeRows(profileId: number | null): HomeRow[] {
  const rows: HomeRow[] = [];

  const featured = db
    .prepare<[], ContentItem>("SELECT * FROM content WHERE featured = 1 ORDER BY rating DESC LIMIT 12")
    .all();
  if (featured.length) rows.push({ key: "featured", title: "Featured", items: featured });

  const trending = db
    .prepare<[], ContentItem>("SELECT * FROM content WHERE trending = 1 ORDER BY rating DESC LIMIT 12")
    .all();
  if (trending.length) rows.push({ key: "trending", title: "Trending Now", items: trending });

  const popularMovies = db
    .prepare<[], ContentItem>(
      "SELECT * FROM content WHERE type = 'movie' ORDER BY rating DESC LIMIT 12"
    )
    .all();
  if (popularMovies.length) rows.push({ key: "popular-movies", title: "Popular Movies", items: popularMovies });

  const popularTV = db
    .prepare<[], ContentItem>("SELECT * FROM content WHERE type = 'tv' ORDER BY rating DESC LIMIT 12")
    .all();
  if (popularTV.length) rows.push({ key: "popular-tv", title: "Popular TV Shows", items: popularTV });

  const newReleases = db
    .prepare<[], ContentItem>("SELECT * FROM content ORDER BY release_year DESC, id DESC LIMIT 12")
    .all();
  if (newReleases.length) rows.push({ key: "new-releases", title: "New Releases", items: newReleases });

  for (const genre of ["Action", "Drama", "Sci-Fi", "Comedy"]) {
    const items = db
      .prepare<[string], ContentItem>("SELECT * FROM content WHERE genre = ? ORDER BY rating DESC LIMIT 12")
      .all(genre);
    if (items.length) rows.push({ key: `genre-${genre.toLowerCase()}`, title: genre, items });
  }

  if (profileId) {
    const continueWatching = getContinueWatching(profileId, 12);
    if (continueWatching.length)
      rows.push({ key: "continue-watching", title: "Continue Watching", items: continueWatching.map((r) => r.item) });

    const myList = getWatchlist(profileId);
    if (myList.length) rows.push({ key: "my-list", title: "My List", items: myList });

    const recommended = getRecommendations(profileId, 12);
    if (recommended.length)
      rows.push({ key: "recommended", title: "Recommended For You", items: recommended });
  }

  return rows;
}

/** Partially-watched items for Continue Watching (completed items excluded). */
export function getContinueWatching(profileId: number, limit = 20): HistoryEntry[] {
  const rows = db
    .prepare<[number, number], 
      ContentItem & {
        ep_id: number | null;
        ep_season: number | null;
        ep_number: number | null;
        ep_title: string | null;
        ep_desc: string | null;
        ep_duration: number | null;
        ep_video: string | null;
        last_position: number;
        completed: number;
        watched_at: string;
        updated_at: string;
      }>(
      `SELECT c.*, h.last_position, h.completed, h.watched_at, h.updated_at,
              e.id AS ep_id, e.season_number AS ep_season, e.episode_number AS ep_number,
              e.title AS ep_title, e.description AS ep_desc, e.duration AS ep_duration, e.video_url AS ep_video
         FROM watch_history h
         JOIN content c ON c.id = h.content_id
         LEFT JOIN episodes e ON e.id = h.episode_id
        WHERE h.profile_id = ? AND h.completed = 0
        ORDER BY h.updated_at DESC
        LIMIT ?`
    )
    .all(profileId, limit);

  return rows.map((r) => ({
    item: toContent(r),
    episode:
      r.ep_id != null
        ? {
            id: r.ep_id,
            content_id: r.id,
            season_number: r.ep_season!,
            episode_number: r.ep_number!,
            title: r.ep_title!,
            description: r.ep_desc ?? "",
            duration: r.ep_duration!,
            video_url: r.ep_video!,
          }
        : null,
    last_position: r.last_position,
    completed: r.completed,
    watched_at: r.watched_at,
    updated_at: r.updated_at,
  }));
}

/** Full history including completed items. */
export function getWatchHistory(profileId: number, limit = 100): HistoryEntry[] {
  const rows = db
    .prepare<[number, number], 
      ContentItem & {
        ep_id: number | null;
        ep_season: number | null;
        ep_number: number | null;
        ep_title: string | null;
        ep_desc: string | null;
        ep_duration: number | null;
        ep_video: string | null;
        last_position: number;
        completed: number;
        watched_at: string;
        updated_at: string;
      }>(
      `SELECT c.*, h.last_position, h.completed, h.watched_at, h.updated_at,
              e.id AS ep_id, e.season_number AS ep_season, e.episode_number AS ep_number,
              e.title AS ep_title, e.description AS ep_desc, e.duration AS ep_duration, e.video_url AS ep_video
         FROM watch_history h
         JOIN content c ON c.id = h.content_id
         LEFT JOIN episodes e ON e.id = h.episode_id
        WHERE h.profile_id = ?
        ORDER BY h.updated_at DESC
        LIMIT ?`
    )
    .all(profileId, limit);

  return rows.map((r) => ({
    item: toContent(r),
    episode:
      r.ep_id != null
        ? {
            id: r.ep_id,
            content_id: r.id,
            season_number: r.ep_season!,
            episode_number: r.ep_number!,
            title: r.ep_title!,
            description: r.ep_desc ?? "",
            duration: r.ep_duration!,
            video_url: r.ep_video!,
          }
        : null,
    last_position: r.last_position,
    completed: r.completed,
    watched_at: r.watched_at,
    updated_at: r.updated_at,
  }));
}

/** Records/updates playback position; marks completed at >=95% of duration. */
export function upsertWatchProgress(
  profileId: number,
  contentId: number,
  episodeId: number | null,
  positionSec: number,
  completed: boolean
): void {
  db.prepare(
    `INSERT INTO watch_history (profile_id, content_id, episode_id, last_position, completed, watched_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT (profile_id, content_id, episode_id)
     DO UPDATE SET
       last_position = excluded.last_position,
       completed     = excluded.completed,
       updated_at    = datetime('now')`
  ).run(profileId, contentId, episodeId, Math.max(0, positionSec), completed ? 1 : 0);
}

export function removeHistoryEntry(profileId: number, contentId: number, episodeId: number | null): void {
  if (episodeId != null) {
    db.prepare("DELETE FROM watch_history WHERE profile_id = ? AND content_id = ? AND episode_id = ?").run(
      profileId,
      contentId,
      episodeId
    );
  } else {
    db.prepare("DELETE FROM watch_history WHERE profile_id = ? AND content_id = ?").run(profileId, contentId);
  }
}

/* ---------------------------------- Watchlist -------------------------------- */

export function getWatchlist(profileId: number): ContentItem[] {
  return db
    .prepare<[number], ContentItem>(
      `SELECT c.* FROM watchlist w JOIN content c ON c.id = w.content_id
        WHERE w.profile_id = ? ORDER BY w.created_at DESC`
    )
    .all(profileId);
}

export function isInWatchlist(profileId: number, contentId: number): boolean {
  return (
    db
      .prepare<[number, number], { n: number }>(
        "SELECT COUNT(*) AS n FROM watchlist WHERE profile_id = ? AND content_id = ?"
      )
      .get(profileId, contentId)!.n > 0
  );
}

export function addToWatchlist(profileId: number, contentId: number): { added: boolean } {
  const exists = db
    .prepare("SELECT 1 FROM content WHERE id = ?")
    .get(contentId);
  if (!exists) throw new Error("CONTENT_NOT_FOUND");
  const res = db
    .prepare(
      `INSERT OR IGNORE INTO watchlist (profile_id, content_id) VALUES (?, ?)`
    )
    .run(profileId, contentId);
  return { added: res.changes > 0 };
}

export function removeFromWatchlist(profileId: number, contentId: number): { removed: boolean } {
  const res = db
    .prepare("DELETE FROM watchlist WHERE profile_id = ? AND content_id = ?")
    .run(profileId, contentId);
  return { removed: res.changes > 0 };
}

/* ------------------------------------ Likes ---------------------------------- */

export function isLiked(profileId: number, contentId: number): boolean {
  return (
    db
      .prepare<[number, number], { n: number }>(
        "SELECT COUNT(*) AS n FROM likes WHERE profile_id = ? AND content_id = ?"
      )
      .get(profileId, contentId)!.n > 0
  );
}

export function toggleLike(profileId: number, contentId: number): { liked: boolean } {
  if (isLiked(profileId, contentId)) {
    db.prepare("DELETE FROM likes WHERE profile_id = ? AND content_id = ?").run(profileId, contentId);
    return { liked: false };
  }
  const exists = db.prepare("SELECT 1 FROM content WHERE id = ?").get(contentId);
  if (!exists) throw new Error("CONTENT_NOT_FOUND");
  db.prepare("INSERT OR IGNORE INTO likes (profile_id, content_id) VALUES (?, ?)").run(profileId, contentId);
  return { liked: true };
}

/* ------------------------------- Recommendations ----------------------------- */

/**
 * Weighted genre-affinity recommender.
 * Signals: watch history (heaviest), likes, watchlist. Falls back to
 * popular/genre content for cold-start profiles.
 */
export function getRecommendations(profileId: number, limit = 12): ContentItem[] {
  const affinity = db
    .prepare<[number, number, number], { genre: string; score: number }>(
      `SELECT c.genre,
              SUM(
                CASE
                  WHEN h.completed = 1 THEN 2.0
                  WHEN h.last_position > 0 THEN 3.0
                  ELSE 1.0
                END
                +
                CASE WHEN l.id IS NOT NULL THEN 2.0 ELSE 0 END
                +
                CASE WHEN w.id IS NOT NULL THEN 1.5 ELSE 0 END
              ) AS score
         FROM content c
         LEFT JOIN watch_history h ON h.content_id = c.id AND h.profile_id = ?
         LEFT JOIN likes l         ON l.content_id = c.id AND l.profile_id = ?
         LEFT JOIN watchlist w     ON w.content_id = c.id AND w.profile_id = ?
        WHERE (h.id IS NOT NULL OR l.id IS NOT NULL OR w.id IS NOT NULL)
        GROUP BY c.genre
        ORDER BY score DESC
        LIMIT 5`
    )
    .all(profileId, profileId, profileId);

  if (affinity.length === 0) return [];

  const genres = affinity.map((a) => a.genre);
  const placeholders = genres.map(() => "?").join(",");

  return db
    .prepare<(string | number)[], ContentItem>(
      `SELECT * FROM content
        WHERE genre IN (${placeholders})
          AND id NOT IN (SELECT content_id FROM watch_history WHERE profile_id = ?)
          AND id NOT IN (SELECT content_id FROM watchlist    WHERE profile_id = ?)
        ORDER BY rating DESC
        LIMIT ?`
    )
    .all(...(genres as string[]), profileId, profileId, limit);
}

/* ----------------------------------- Helpers ---------------------------------- */

interface HistoryJoinedRow extends ContentItem {
  ep_id: number | null;
  ep_season: number | null;
  ep_number: number | null;
  ep_title: string | null;
  ep_desc: string | null;
  ep_duration: number | null;
  ep_video: string | null;
  last_position: number;
  completed: number;
  watched_at: string;
  updated_at: string;
}

function toContent(r: HistoryJoinedRow): ContentItem {
  const content: ContentItem = {
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    genre: r.genre,
    release_year: r.release_year,
    duration: r.duration,
    rating: r.rating,
    poster: r.poster,
    backdrop: r.backdrop,
    trailer_url: r.trailer_url,
    video_url: r.video_url,
    featured: r.featured,
    trending: r.trending,
    license: (r as HistoryJoinedRow & { license?: string | null }).license ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
  return content;
}
