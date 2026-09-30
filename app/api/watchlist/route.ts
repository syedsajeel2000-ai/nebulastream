import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { getActiveProfile } from "@/lib/profile";
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} from "@/lib/content";

export const runtime = "nodejs";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const profile = await getActiveProfile(user.id);
  return NextResponse.json({ items: getWatchlist(profile.id) });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const profile = await getActiveProfile(user.id);

  try {
    const { contentId } = z.object({ contentId: z.number().int().positive() }).parse(await req.json());
    const result = addToWatchlist(profile.id, contentId);
    return NextResponse.json({ ok: true, inList: true, added: result.added });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid content." }, { status: 400 });
    if (err instanceof Error && err.message === "CONTENT_NOT_FOUND")
      return NextResponse.json({ error: "That title doesn't exist." }, { status: 404 });
    console.error("[watchlist POST]", err);
    return NextResponse.json({ error: "Could not update your list. Please try again." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const profile = await getActiveProfile(user.id);

  try {
    const { contentId } = z.object({ contentId: z.number().int().positive() }).parse(await req.json());
    const result = removeFromWatchlist(profile.id, contentId);
    return NextResponse.json({ ok: true, inList: false, removed: result.removed });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid content." }, { status: 400 });
    console.error("[watchlist DELETE]", err);
    return NextResponse.json({ error: "Could not update your list. Please try again." }, { status: 500 });
  }
}
