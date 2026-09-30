import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { getActiveProfile } from "@/lib/profile";
import {
  getContinueWatching,
  getEpisodeById,
  getContentById,
  getWatchHistory,
  removeHistoryEntry,
  upsertWatchProgress,
} from "@/lib/content";

export const runtime = "nodejs";

const PositionSchema = z.object({
  contentId: z.number().int().positive(),
  episodeId: z.number().int().positive().nullable().optional(),
  position: z.number().min(0).max(60 * 60 * 24),
  duration: z.number().min(0).max(60 * 60 * 24).optional(),
});

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const profile = await getActiveProfile(user.id);

  try {
    const data = PositionSchema.parse(await req.json());
    const content = getContentById(data.contentId);
    if (!content) return NextResponse.json({ error: "That title doesn't exist." }, { status: 404 });

    if (data.episodeId != null) {
      const episode = getEpisodeById(data.episodeId);
      if (!episode || episode.content_id !== content.id)
        return NextResponse.json({ error: "That episode doesn't exist." }, { status: 404 });
    }

    const effectiveDuration =
      data.episodeId != null
        ? getEpisodeById(data.episodeId)!.duration
        : content.duration;
    const completed = data.duration != null && data.duration > 0
      ? data.position / data.duration >= 0.95
      : data.position >= effectiveDuration * 0.95;

    upsertWatchProgress(profile.id, data.contentId, data.episodeId ?? null, data.position, completed);
    return NextResponse.json({ ok: true, completed });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid progress data." }, { status: 400 });
    console.error("[progress POST]", err);
    return NextResponse.json({ error: "Could not save your progress." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const profile = await getActiveProfile(user.id);

  const contentId = Number(req.nextUrl.searchParams.get("contentId") ?? "0");
  const episodeIdRaw = req.nextUrl.searchParams.get("episodeId");
  const episodeId = episodeIdRaw ? Number(episodeIdRaw) : null;

  if (!contentId) {
    const items = getContinueWatching(profile.id, 100);
    return NextResponse.json({ items });
  }

  const entries = getWatchHistory(profile.id, 500).filter(
    (h) => h.item.id === contentId && (episodeId == null || h.episode?.id === episodeId)
  );
  const entry = entries[0];
  return NextResponse.json({
    position: entry?.last_position ?? 0,
    completed: entry?.completed === 1,
  });
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const profile = await getActiveProfile(user.id);

  try {
    const body = z
      .object({ contentId: z.number().int().positive(), episodeId: z.number().int().positive().nullable().optional() })
      .parse(await req.json());
    removeHistoryEntry(profile.id, body.contentId, body.episodeId ?? null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    console.error("[progress DELETE]", err);
    return NextResponse.json({ error: "Could not remove history." }, { status: 500 });
  }
}
