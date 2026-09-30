import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "./db";
import { createSessionToken, verifySessionToken } from "./security";

export const SESSION_COOKIE = "nebula_session";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production" && process.env.NEBULA_INSECURE_COOKIES !== "1",
  maxAge: 30 * 24 * 60 * 60, // 30 days
};

export interface SessionUser {
  id: number;
  fullName: string;
  username: string;
  email: string;
  tokenVersion: number;
  createdAt: string;
}

export async function setSessionCookie(userId: number, tokenVersion: number): Promise<void> {
  const token = createSessionToken(userId, tokenVersion);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, COOKIE_OPTS);
}

export function sessionCookieHeader(userId: number, tokenVersion: number): string {
  const token = createSessionToken(userId, tokenVersion);
  return serializeCookie(SESSION_COOKIE, token, COOKIE_OPTS);
}

export function clearSessionCookieHeader(): string {
  return serializeCookie(SESSION_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
}

/** Reads and verifies the session cookie against the users table (token version checked). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  const row = db
    .prepare<[number], { id: number; full_name: string; username: string; email: string; token_version: number; created_at: string }>(
      "SELECT id, full_name, username, email, token_version, created_at FROM users WHERE id = ?"
    )
    .get(payload.userId);
  if (!row) return null;
  if ((row.token_version ?? 0) !== payload.tokenVersion) return null; // logged out elsewhere / password change

  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    email: row.email,
    tokenVersion: row.token_version ?? 0,
    createdAt: row.created_at,
  };
}

/** Route-handler guard: returns the user or a ready-to-return 401 response. */
export async function requireUser(): Promise<
  { user: SessionUser; error?: never } | { user?: never; error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      ),
    };
  }
  return { user };
}

function serializeCookie(
  name: string,
  value: string,
  opts: { httpOnly: boolean; sameSite: "lax"; path: string; secure: boolean; maxAge: number }
): string {
  const parts = [
    `${name}=${value}`,
    `Path=${opts.path}`,
    `Max-Age=${opts.maxAge}`,
    opts.sameSite === "lax" ? "SameSite=Lax" : "",
    opts.httpOnly ? "HttpOnly" : "",
    opts.secure ? "Secure" : "",
  ].filter(Boolean);
  return parts.join("; ");
}

/** Bump token_version to invalidate all previously issued sessions for a user. */
export function invalidateUserSessions(userId: number): void {
  db.prepare("UPDATE users SET token_version = COALESCE(token_version, 0) + 1, updated_at = datetime('now') WHERE id = ?").run(
    userId
  );
}
