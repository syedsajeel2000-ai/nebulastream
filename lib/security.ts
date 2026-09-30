/**
 * Security primitives: scrypt password hashing + HMAC-signed session tokens.
 * No secrets are ever embedded in source — the session secret lives in .env.
 */
import crypto from "node:crypto";

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384; // N — modest so dev logins stay snappy

function b64url(buf: Uint8Array): string {
  return Buffer.from(buf).toString("base64url");
}

/* --------------------------------- Passwords -------------------------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST });
  return `scrypt$${SCRYPT_COST}$${salt.toString("base64url")}$${b64url(key)}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, costStr, saltB64, keyB64] = stored.split("$");
    if (scheme !== "scrypt") return false;
    const N = Number.parseInt(costStr, 10);
    if (!Number.isFinite(N) || N < 16384) return false;
    const salt = Buffer.from(saltB64, "base64url");
    const expected = Buffer.from(keyB64, "base64url");
    const actual = crypto.scryptSync(password, salt, expected.length, { N });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/* --------------------------------- Sessions --------------------------------- */

export interface SessionPayload {
  userId: number;
  tokenVersion: number;
  exp: number; // epoch ms
  iat: number; // epoch ms
  sessionId: string;
}

function b64urlJson(obj: unknown): string {
  return b64url(Buffer.from(JSON.stringify(obj), "utf8"));
}

export function sessionSecret(): string {
  // Lazy import: avoids pulling server-only env into client bundles.
  const secret = process.env.SESSION_SECRET ?? process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    // Dev fallback so the app runs out of the box; production must set SESSION_SECRET.
    return "nebula-dev-secret-do-not-use-in-production";
  }
  return secret;
}

export function createSessionToken(userId: number, tokenVersion: number): string {
  const now = Date.now();
  const payload: SessionPayload = {
    userId,
    tokenVersion,
    iat: now,
    exp: now + 30 * 24 * 60 * 60 * 1000, // 30 days
    sessionId: crypto.randomBytes(12).toString("base64url"),
  };
  const body = b64urlJson(payload);
  const sig = crypto
    .createHmac("sha256", sessionSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto
    .createHmac("sha256", sessionSecret())
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.userId !== "number" || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Opaque, single-use tokens for the demo password-reset flow. */
export function createResetToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
