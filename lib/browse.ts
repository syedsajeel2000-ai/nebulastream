import type { BrowseFilters, ContentType } from "./content";

export interface BrowseParams {
  type?: string;
  genre?: string;
  yearGroup?: string;
  minRating?: string;
  sort?: string;
  q?: string;
}

export function parseBrowseParams(p: BrowseParams): BrowseFilters {
  const filters: BrowseFilters = {};

  if (p.type === "movie" || p.type === "tv") filters.type = p.type as ContentType;
  if (p.genre) filters.genre = p.genre;

  if (p.yearGroup === "newest") {
    filters.yearFrom = 2024;
  } else if (p.yearGroup === "recent") {
    filters.yearFrom = 2020;
    filters.yearTo = 2023;
  } else if (p.yearGroup === "older") {
    filters.yearFrom = 2016;
    filters.yearTo = 2019;
  }

  const minRating = Number.parseFloat(p.minRating ?? "");
  if (Number.isFinite(minRating) && minRating > 0) filters.minRating = minRating;

  if (p.q) filters.q = p.q;

  if (p.sort === "newest" || p.sort === "rating" || p.sort === "az") {
    filters.sort = p.sort;
  } else {
    filters.sort = "popular";
  }

  return filters;
}

export const PAGE_SIZE = 24;
