import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getActiveProfile } from "@/lib/profile";
import { isLiked, toggleLike, getContentById } from "@/lib/content";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const profile = await getActiveProfile(user.id);

  const contentId = Number(req.nextUrl.searchParams.get("contentId") ?? "0");
  if (contentId > 0) {
    return NextResponse.json({ liked: isLiked(profile.id, contentId) });
  }
  const likedIds = db
    .prepare<[number], { content_id: number }>("SELECT content_id FROM likes WHERE profile_id = ?")
    .all(profile.id)
    .map((r) => r.content_id);
  return NextResponse.json({ likedIds });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const profile = await getActiveProfile(user.id);

  try {
    const { contentId } = z.object({ contentId: z.number().int().positive() }).parse(await req.json());
    if (!getContentById(contentId)) return NextResponse.json({ error: "That title doesn't exist." }, { status: 404 });
    const { liked } = toggleLike(profile.id, contentId);
    return NextResponse.json({ ok: true, liked });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid content." }, { status: 400 });
    console.error("[likes POST]", err);
    return NextResponse.json({ error: "Could not save your like. Please try again." }, { status: 500 });
  }
}
