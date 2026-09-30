import { NextResponse } from "next/server";
import { clearSessionCookieHeader, getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user: user ? { id: user.id, fullName: user.fullName, username: user.username, email: user.email } : null });
}

export async function DELETE() {
  // Logout handled here too, so the demo auth REST surface is complete.
  return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookieHeader() } });
}
