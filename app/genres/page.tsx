import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Genres" };

const GENRE_META: Record<string, { icon: string; blurb: string }> = {
  Action: { icon: "💥", blurb: "Chases, fights and near misses" },
  Drama: { icon: "🎭", blurb: "Character-first storytelling" },
  Comedy: { icon: "😂", blurb: "For when you need a laugh" },
  "Sci-Fi": { icon: "🚀", blurb: "Futures, frontiers and what-ifs" },
  Thriller: { icon: "🔪", blurb: "Tension you can feel" },
  Romance: { icon: "💞", blurb: "Love, loss and everything after" },
  Animation: { icon: "🎨", blurb: "Drawn, rendered and imagined" },
  Documentary: { icon: "🎙", blurb: "True stories, told well" },
  Horror: { icon: "👻", blurb: "Lights off recommended" },
  Adventure: { icon: "🧭", blurb: "Journeys worth taking" },
};

export default function GenresPage() {
  const counts = db
    .prepare<[], { genre: string; n: number; movies: number; shows: number }>(
      `SELECT genre,
              COUNT(*) AS n,
              SUM(CASE WHEN type = 'movie' THEN 1 ELSE 0 END) AS movies,
              SUM(CASE WHEN type = 'tv' THEN 1 ELSE 0 END) AS shows
         FROM content GROUP BY genre ORDER BY n DESC`
    )
    .all();

  return (
    <div className="anim-fade-in mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">Browse by Genre</h1>
        <p className="mt-1 text-sm text-dim">Every genre in the catalog, straight from the database.</p>
      </header>

      <div className="stagger grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map((g) => {
          const meta = GENRE_META[g.genre] ?? { icon: "🎬", blurb: "" };
          return (
            <Link
              key={g.genre}
              href={`/genre/${encodeURIComponent(g.genre)}`}
              className="card-surface group flex flex-col gap-1 p-5 transition hover:-translate-y-1 hover:border-[#e50914]/60"
            >
              <span className="text-3xl transition-transform group-hover:scale-110">{meta.icon}</span>
              <span className="mt-1 font-semibold">{g.genre}</span>
              <span className="text-xs text-dim">{meta.blurb}</span>
              <span className="mt-2 text-xs font-bold text-dim">
                {g.movies} movie{g.movies === 1 ? "" : "s"} · {g.shows} show{g.shows === 1 ? "" : "s"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
