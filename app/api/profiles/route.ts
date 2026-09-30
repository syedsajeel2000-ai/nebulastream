import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { AVATARS, createProfile, getActiveProfile, setActiveProfileCookie } from "@/lib/profile";
import { AuthError, deleteProfile, getProfilesForUser, updateProfile } from "@/lib/users";

export const runtime = "nodejs";

const CreateSchema = z.object({
  profileName: z.string().trim().min(1, "Profile name is required.").max(40),
  avatar: z.string().max(8).optional(),
  kidsMode: z.boolean().optional(),
  select: z.boolean().optional(),
});

const UpdateSchema = z.object({
  id: z.number().int().positive(),
  profileName: z.string().trim().min(1).max(40).optional(),
  avatar: z.string().max(8).optional(),
  kidsMode: z.boolean().optional(),
  select: z.boolean().optional(),
});

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json({ profiles: getProfilesForUser(user.id) });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const data = CreateSchema.parse(await req.json());
    const existing = getProfilesForUser(user.id);
    if (existing.length >= 5)
      return NextResponse.json({ error: "You can have up to 5 profiles." }, { status: 400 });

    const profile = createProfile(user.id, {
      profileName: data.profileName,
      avatar: data.avatar && AVATARS.includes(data.avatar) ? data.avatar : "🎬",
      kidsMode: data.kidsMode,
    });
    if (data.select) await setActiveProfileCookie(profile.id);
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message ?? "Check your input." }, { status: 400 });
    console.error("[profiles POST]", err);
    return NextResponse.json({ error: "Could not create the profile." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const data = UpdateSchema.parse(await req.json());
    const { select, ...updates } = data;
    const profile = updateProfile(data.id, user.id, updates);
    if (select) await setActiveProfileCookie(data.id);
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message ?? "Check your input." }, { status: 400 });
    console.error("[profiles PATCH]", err);
    return NextResponse.json({ error: "Could not save profile changes." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { id } = z.object({ id: z.number().int().positive() }).parse(await req.json());
    const profiles = getProfilesForUser(user.id);
    if (profiles.length <= 1)
      return NextResponse.json({ error: "You need at least one profile." }, { status: 400 });

    const active = await getActiveProfile(user.id);
    const deleted = deleteProfile(id, user.id);
    if (!deleted) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

    if (active.id === id) await setActiveProfileCookie(profiles.find((p) => p.id !== id)!.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    console.error("[profiles DELETE]", err);
    return NextResponse.json({ error: "Could not delete the profile." }, { status: 500 });
  }
}
