/**
 * Client-safe shared types (no database imports — safe for browser bundles).
 */

export type ContentType = "movie" | "tv";

export interface ContentItem {
  id: number;
  title: string;
  description: string;
  type: ContentType;
  genre: string;
  release_year: number;
  duration: number;
  rating: number;
  poster: string;
  backdrop: string;
  trailer_url: string | null;
  video_url: string;
  featured: number;
  trending: number;
  /** Short license label, e.g. "Public Domain" or "CC BY" (null = public domain defaults) */
  license: string | null;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: number;
  content_id: number;
  season_number: number;
  episode_number: number;
  title: string;
  description: string;
  duration: number;
  video_url: string;
}

export interface HistoryEntry {
  item: ContentItem;
  episode: Episode | null;
  last_position: number;
  completed: number;
  watched_at: string;
  updated_at: string;
}

/** Stable React key for a history entry (per item+episode). */
export function historyKey(e: HistoryEntry): string {
  return `${e.item.id}-${e.episode?.id ?? "movie"}`;
}
