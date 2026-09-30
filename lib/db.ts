import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * SQLite (better-sqlite3) — the single source of truth for all app data.
 *
 * - WAL journal + NORMAL sync: durable yet fast for a Next.js server process.
 * - foreign_keys enforced on every connection (referential integrity).
 * - Prepared statements everywhere (SQL-injection safe, fast).
 */

const DATA_DIR = process.env.NEBULA_DATA_DIR ?? path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = path.join(DATA_DIR, "nebula.db");

function createConnection(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  return db;
}

// Survive Next.js dev-server hot reloads without leaking file handles.
const globalForDb = globalThis as unknown as { __nebulaDb?: Database.Database };

export const db: Database.Database =
  globalForDb.__nebulaDb ?? (globalForDb.__nebulaDb = createConnection());

export type Tx = Database.Transaction;

/* ------------------------------ Schema / migrations ----------------------------- */

const SCHEMA_VERSION = 2;

const MIGRATIONS: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name     TEXT NOT NULL,
      username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS profiles (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      profile_name TEXT NOT NULL,
      avatar       TEXT NOT NULL DEFAULT '🚀',
      kids_mode    INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS content (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT NOT NULL,
      description   TEXT NOT NULL,
      type          TEXT NOT NULL CHECK (type IN ('movie','tv')),
      genre         TEXT NOT NULL,
      release_year  INTEGER NOT NULL,
      duration      INTEGER NOT NULL,
      rating        REAL NOT NULL,
      poster        TEXT NOT NULL,
      backdrop      TEXT NOT NULL,
      trailer_url   TEXT,
      video_url     TEXT NOT NULL,
      featured      INTEGER NOT NULL DEFAULT 0,
      trending      INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS episodes (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id     INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
      season_number  INTEGER NOT NULL,
      episode_number INTEGER NOT NULL,
      title          TEXT NOT NULL,
      description    TEXT NOT NULL DEFAULT '',
      duration       INTEGER NOT NULL,
      video_url      TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS cast_members (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      role       TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS watch_history (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id   INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      content_id   INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
      episode_id   INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      last_position REAL NOT NULL DEFAULT 0,
      completed    INTEGER NOT NULL DEFAULT 0,
      watched_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (profile_id, content_id, episode_id)
    )`,
    `CREATE TABLE IF NOT EXISTS watchlist (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (profile_id, content_id)
    )`,
    `CREATE TABLE IF NOT EXISTS likes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (profile_id, content_id)
    )`,
    // Indexes for the frequent query paths (search, filters, joins).
    `CREATE INDEX IF NOT EXISTS idx_content_type     ON content(type)`,
    `CREATE INDEX IF NOT EXISTS idx_content_genre    ON content(genre)`,
    `CREATE INDEX IF NOT EXISTS idx_content_year     ON content(release_year)`,
    `CREATE INDEX IF NOT EXISTS idx_content_rating   ON content(rating)`,
    `CREATE INDEX IF NOT EXISTS idx_content_featured ON content(featured)`,
    `CREATE INDEX IF NOT EXISTS idx_content_trending ON content(trending)`,
    `CREATE INDEX IF NOT EXISTS idx_content_title    ON content(title COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS idx_episodes_content ON episodes(content_id)`,
    `CREATE INDEX IF NOT EXISTS idx_history_profile  ON watch_history(profile_id)`,
    `CREATE INDEX IF NOT EXISTS idx_watchlist_profile ON watchlist(profile_id)`,
    `CREATE INDEX IF NOT EXISTS idx_likes_profile    ON likes(profile_id)`,
    `CREATE INDEX IF NOT EXISTS idx_cast_content ON cast_members(content_id)`,
    `CREATE INDEX IF NOT EXISTS idx_cast_name    ON cast_members(name COLLATE NOCASE)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id, profile_name)`,
  ],
  2: [
    // License attribution per title (v3 seed: modern CC-licensed open movies)
    `ALTER TABLE content ADD COLUMN license TEXT`,
  ],
};

export function migrate(target = SCHEMA_VERSION): void {
  const row = db
    .prepare<[], { user_version: number }>("PRAGMA user_version")
    .get();
  const current = row?.user_version ?? 0;

  if (current >= target) return;

  const run = db.transaction(() => {
    for (let v = current + 1; v <= target; v++) {
      const statements = MIGRATIONS[v];
      if (!statements) continue;
      for (const sql of statements) db.exec(sql);
    }
    db.pragma(`user_version = ${target}`);
  });
  run();
}

migrate();

/**
 * Auto-seed an empty database (fresh deploy / fresh volume).
 * Keeps `npm run db:seed` for manual use; this just guarantees the catalog
 * exists on first boot (e.g. Vercel) without extra setup steps.
 */
if (
  process.env.NEBULA_AUTO_SEED !== "0" &&
  (db.prepare("SELECT COUNT(*) n FROM content").get() as { n: number }).n === 0
) {
  // Import lazily so this module has no hard dependency on the seed module.
  import("./seed.ts")
    .then((m) => m.seed())
    .then(() => console.log("[nebula] auto-seeded empty database"))
    .catch((e) => console.error("[nebula] auto-seed failed:", e));
}

/** Small helpers used across the query layer. */
export function nowISO(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export { Database };
