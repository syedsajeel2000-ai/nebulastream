import { NextRequest, NextResponse } from "next/server";
import { listContent } from "@/lib/content";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (!q) return NextResponse.json({ results: [] });

  const { items } = listContent({ q, limit: 8, sort: "rating" });
  return NextResponse.json({
    results: items.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      genre: c.genre,
      release_year: c.release_year,
      poster: c.poster,
    })),
  });
}
