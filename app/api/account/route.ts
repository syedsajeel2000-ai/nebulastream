import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, sessionCookieHeader, invalidateUserSessions } from "@/lib/session";
import { AuthError, changePassword, getProfilesForUser, updateAccount, getUserById } from "@/lib/users";

export const runtime = "nodejs";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
    profiles: getProfilesForUser(user.id).map(({ id, profile_name, avatar, kids_mode }) => ({
      id,
      profileName: profile_name,
      avatar,
      kidsMode: kids_mode === 1,
    })),
  });
}

const AccountSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80).optional(),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores.")
    .optional(),
  email: z.string().trim().email("Please enter a valid email address.").max(120).optional(),
});

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const data = AccountSchema.parse(await req.json());
    const updated = updateAccount(user.id, data);
    return NextResponse.json({
      ok: true,
      user: { id: updated.id, fullName: updated.full_name, username: updated.username, email: updated.email },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === "EMAIL_TAKEN" ? 409 : 400 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? "Check your input." }, { status: 400 });
    console.error("[account PATCH]", err);
    return NextResponse.json({ error: "Could not save your account changes." }, { status: 500 });
  }
}

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password."),
  newPassword: z.string().min(8, "New password must be at least 8 characters.").max(200),
});

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const data = PasswordSchema.parse(await req.json());
    changePassword(user.id, data.currentPassword, data.newPassword);
    // Invalidate every existing session, then re-issue for this one.
    invalidateUserSessions(user.id);
    const fresh = getUserById(user.id)!;
    return NextResponse.json(
      { ok: true },
      { headers: { "Set-Cookie": sessionCookieHeader(user.id, fresh.token_version) } }
    );
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? "Check your input." }, { status: 400 });
    console.error("[account POST password]", err);
    return NextResponse.json({ error: "Could not change your password." }, { status: 500 });
  }
}
