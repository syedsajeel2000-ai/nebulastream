/**
 * User + profile data access and account operations.
 * All writes go to SQLite; passwords are stored as scrypt hashes only.
 */
import crypto from "node:crypto";
import { db } from "./db";
import { hashPassword, verifyPassword } from "./security";

export interface UserRow {
  id: number;
  full_name: string;
  username: string;
  email: string;
  password_hash: string;
  token_version: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: number;
  user_id: number;
  profile_name: string;
  avatar: string;
  kids_mode: number;
  created_at: string;
  updated_at: string;
}

export function getUserById(id: number): UserRow | null {
  return db.prepare<[number], UserRow>("SELECT * FROM users WHERE id = ?").get(id) ?? null;
}

export function findUserByIdentifier(identifier: string): UserRow | null {
  return (
    db
      .prepare<[string, string], UserRow>(
        "SELECT * FROM users WHERE email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE"
      )
      .get(identifier, identifier) ?? null
  );
}

export function findUserByEmail(email: string): UserRow | null {
  return db.prepare<[string], UserRow>("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(email) ?? null;
}

export function findUserByUsername(username: string): UserRow | null {
  return db.prepare<[string], UserRow>("SELECT * FROM users WHERE username = ? COLLATE NOCASE").get(username) ?? null;
}

export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function signupUser(input: {
  fullName: string;
  username: string;
  email: string;
  password: string;
}): UserRow {
  if (findUserByEmail(input.email)) throw new AuthError("EMAIL_TAKEN", "An account with this email already exists.");
  if (findUserByUsername(input.username))
    throw new AuthError("USERNAME_TAKEN", "This username is already taken.");

  const hash = hashPassword(input.password);
  const info = db
    .prepare(
      "INSERT INTO users (full_name, username, email, password_hash) VALUES (?, ?, ?, ?)"
    )
    .run(input.fullName, input.username, input.email, hash);

  const userId = Number(info.lastInsertRowid);

  // Every account starts with a default profile.
  createProfile(userId, { profileName: `${input.fullName.split(" ")[0] || "Main"}`, avatar: "🚀" });

  return getUserById(userId)!;
}

export function loginUser(identifier: string, password: string): UserRow {
  const user = findUserByIdentifier(identifier);
  if (!user) throw new AuthError("INVALID_CREDENTIALS", "Incorrect email/username or password.");
  if (!verifyPassword(password, user.password_hash))
    throw new AuthError("INVALID_CREDENTIALS", "Incorrect email/username or password.");
  return user;
}

export function updateAccount(
  userId: number,
  input: { fullName?: string; username?: string; email?: string }
): UserRow {
  const user = getUserById(userId);
  if (!user) throw new AuthError("NOT_FOUND", "Account not found.");

  if (input.username && input.username.toLowerCase() !== user.username.toLowerCase()) {
    const existing = findUserByUsername(input.username);
    if (existing && existing.id !== userId)
      throw new AuthError("USERNAME_TAKEN", "This username is already taken.");
  }
  if (input.email && input.email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = findUserByEmail(input.email);
    if (existing && existing.id !== userId)
      throw new AuthError("EMAIL_TAKEN", "An account with this email already exists.");
  }

  db.prepare(
    `UPDATE users SET
       full_name = COALESCE(?, full_name),
       username  = COALESCE(?, username),
       email     = COALESCE(?, email),
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(input.fullName ?? null, input.username ?? null, input.email ?? null, userId);

  return getUserById(userId)!;
}

/** Verifies current password before allowing a change; callers invalidate sessions after. */
export function changePassword(userId: number, currentPassword: string, newPassword: string): void {
  const user = getUserById(userId);
  if (!user) throw new AuthError("NOT_FOUND", "Account not found.");
  if (!verifyPassword(currentPassword, user.password_hash))
    throw new AuthError("WRONG_PASSWORD", "Your current password is incorrect.");
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(
    hashPassword(newPassword),
    userId
  );
}

/* ---------------------------------- Profiles --------------------------------- */

export function getProfilesForUser(userId: number): ProfileRow[] {
  return db
    .prepare<[number], ProfileRow>("SELECT * FROM profiles WHERE user_id = ? ORDER BY id")
    .all(userId);
}

export function getProfile(profileId: number): ProfileRow | null {
  return db.prepare<[number], ProfileRow>("SELECT * FROM profiles WHERE id = ?").get(profileId) ?? null;
}

export function createProfile(
  userId: number,
  input: { profileName: string; avatar?: string; kidsMode?: boolean }
): ProfileRow {
  const info = db
    .prepare("INSERT INTO profiles (user_id, profile_name, avatar, kids_mode) VALUES (?, ?, ?, ?)")
    .run(userId, input.profileName, input.avatar ?? "🎬", input.kidsMode ? 1 : 0);
  return getProfile(Number(info.lastInsertRowid))!;
}

export function updateProfile(
  profileId: number,
  userId: number,
  input: { profileName?: string; avatar?: string; kidsMode?: boolean }
): ProfileRow {
  // Ownership check: the profile must belong to this user.
  const existing = getProfile(profileId);
  if (!existing || existing.user_id !== userId) throw new AuthError("NOT_FOUND", "Profile not found.");

  db.prepare(
    `UPDATE profiles SET
       profile_name = COALESCE(?, profile_name),
       avatar       = COALESCE(?, avatar),
       kids_mode    = COALESCE(?, kids_mode),
       updated_at   = datetime('now')
     WHERE id = ?`
  ).run(
    input.profileName ?? null,
    input.avatar ?? null,
    input.kidsMode === undefined ? null : input.kidsMode ? 1 : 0,
    profileId
  );
  return getProfile(profileId)!;
}

export function deleteProfile(profileId: number, userId: number): boolean {
  const existing = getProfile(profileId);
  if (!existing || existing.user_id !== userId) return false;
  db.prepare("DELETE FROM profiles WHERE id = ?").run(profileId);
  return true;
}

/* ------------------------------ Password reset ------------------------------- */

/**
 * Demo reset flow: a single-use token is generated and (in this demo) surfaced
 * back to the user instead of being emailed. Stored server-side as a SHA-256
 * hash with a 30-minute expiry.
 */
export function createPasswordReset(email: string): { token: string; user: UserRow } | null {
  const user = findUserByEmail(email);
  if (!user) return null;
  const raw = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  db.prepare(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, datetime('now', '+30 minutes'))`
  ).run(user.id, tokenHash);
  return { token: raw, user };
}

export function resetPasswordWithToken(token: string, newPassword: string): { ok: boolean; userId?: number } {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const row = db
    .prepare<[string], { user_id: number }>(
      "SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > datetime('now')"
    )
    .get(tokenHash);
  if (!row) return { ok: false };

  const run = db.transaction(() => {
    db.prepare("UPDATE users SET password_hash = ?, token_version = COALESCE(token_version, 0) + 1, updated_at = datetime('now') WHERE id = ?").run(
      hashPassword(newPassword),
      row.user_id
    );
    db.prepare("DELETE FROM password_reset_tokens WHERE token_hash = ?").run(tokenHash);
  });
  run();
  return { ok: true, userId: row.user_id };
}
