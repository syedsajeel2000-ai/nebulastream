# NebulaStream — Netflix-Inspired Streaming Platform 🎬

A **fully functional**, Netflix-inspired streaming platform built with **Next.js 15 + SQLite (better-sqlite3)**.
Every button works: real auth, real search, real filters, real playback, real progress tracking, real recommendations —
all backed by a relational SQLite database.

> **Content licensing:** the catalog is **all-modern, open-license only — 15 films released 2016–2026**:
> **9 Blender Studio open movies** (*Caminandes: Llamigos*, *Agent 327*, *Hero*, *Spring*, *Coffee Run*,
> *Sprite Fright*, *Charge*, *Wing It!*, *Singularity* — CC BY / BY-ND / BY-SA), **5 NASA 3D mission
> animations** (*SpaceX Demo-2*, *Psyche*, *CAPSTONE*, *Artemis LTV*, *Artemis II* — public domain / CC0)
> and 1 declassified military documentary (*Tsar Bomba: Declassified*, CC BY-ND). **Every title carries a
> trailer**: an official rights-holder YouTube upload or a highlight clip cut from the film itself. Each title
> shows an accurate license chip (Public Domain / CC BY / CC BY-ND / CC BY-SA). Catalog synopses and artwork
> are written for this project; no copyrighted Netflix or studio media is used anywhere. No Netflix code or
> media is used anywhere.

---

## ✨ Features

**Authentication**
- Sign up (name / username / email / password + confirmation, all validated)
- Login with email **or** username · Logout · scrypt password hashing · HMAC-signed session cookies
- Forgot-password demo flow with single-use, 30-minute reset tokens (clearly labelled as demo — no fake "email sent" claims)
- Change password (invalidates other sessions) · edit name/username/email

**Browsing & Discovery**
- Cinematic hero + 12 dynamic home rows (Featured, Trending, Popular Movies/TV, New Releases, genres, Continue Watching, My List, Recommended For You)
- Browse with **functional filters**: type (movie/TV), 10 genres, year groups, minimum rating — plus **sorting** (popular / newest / rated / A–Z) and pagination
- Search across **title, genre and cast** with live autocomplete suggestions
- Per-genre pages (`/genre/action`, …) with live counts
- Title pages with cast, director, trailer modal (YouTube / archive video / highlight clip), similar titles and (for shows) season/episode lists

**Playback**
- Custom HTML5 player: play/pause, seek, volume, mute, ±10s, fullscreen, playback speed (0.5×–2×), time display, buffering & error states, keyboard shortcuts (space/k, ←/→, m, f)
- **Resume**: playback position autosaves to SQLite every ~10s, on pause and on exit — reopening resumes from the saved second
- TV shows track progress **per episode**; Next-Episode queue; Related titles

**Your Space**
- **My List** — add/remove, persists across refresh, logout and server restart
- **Continue Watching** — progress bars, percentage, one-click Resume; completed titles leave automatically
- **Watch History** — dates, progress, completed badges, remove-from-history
- **Likes** — one click to like/unlike; feeds recommendations

**Profiles & Recommendations**
- Up to 5 profiles per account (avatars, Kids mode) — each with **independent** history, progress, list, likes and recommendations
- Weighted genre-affinity recommender (watching > likes > list) with cold-start fallback

**Quality**
- Responsive from 320px to ultrawide · dark cinematic design system · premium animations honoring `prefers-reduced-motion`
- Skeleton loaders, empty states, friendly error handling everywhere
- Prepared statement SQLite access — no SQL injection, no secrets in source, no hashes to the client

---

## 🧱 Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, React 19, Server Components) |
| Language | TypeScript (strict) |
| Database | **SQLite** via `better-sqlite3` (WAL, foreign keys, prepared statements) |
| Styling | Tailwind CSS v4 + custom design tokens |
| Typography | **Clash Display** (display) · **Inter Variable** (body) · **Syne** (brand) — self-hosted woff2 in `public/fonts` |
| Validation | Zod (all API inputs) |
| Auth | scrypt hashes + HMAC session cookies (httpOnly) |

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create the database, run migrations and seed demo content
npm run db:reset        # (or `npm run db:seed` on an existing DB)

# 3. Start the dev server
npm run dev             # → http://localhost:3000
```

**Demo accounts** (created by the seed):

| Email | Username | Password |
| --- | --- | --- |
| demo@nebula.test | `demo` | `demo1234` |
| scifi@nebula.test | `scifi` | `scifi1234` |

Or create your own account via **Sign Up** — it's fully functional.

### Environment variables

Copy `.env.example` → `.env.local` and set:

- `SESSION_SECRET` — HMAC secret for session tokens. Generate with
  `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
  (A dev fallback keeps the app runnable without it; **always set it in production**.)
- `NEBULA_DATA_DIR` *(optional)* — directory for the SQLite file (default `./data`; `/tmp/nebula-data` on Vercel).
- `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` *(optional)* — Turso cloud database. When set, the local
  SQLite file becomes an **embedded replica**: reads stay local, writes replicate to Turso so accounts,
  watchlists and history **persist across serverless cold starts**. Create one via the Turso integration
  on Vercel (`vercel install turso/database`) — it sets both variables for you — or with the Turso CLI.
  Unset = plain local SQLite file.

No API keys are required — artwork is proxied server-side via `/api/art`, and every video is a full-length public-domain or Creative-Commons film/episode hosted by the Internet Archive (streamed with HTTP range requests, so seeking works).

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | Strict TypeScript check |
| `npm run db:seed` | Apply migrations + seed demo catalog |
| `npm run db:reset` | Delete DB, re-migrate, re-seed |

`scripts/archive-sources.ts` is the single source of truth for video/trailer URLs (archive.org identifiers,
official YouTube trailer IDs, highlight time-windows); `scripts/db-seed.ts` builds the catalog from it.
One-off research tools used to discover and rights-verify sources live in `scripts/research/` (kept for
reproducibility — they re-probe archive.org metadata, licenseurl fields and trailer candidates; the catalog
uses the modern-only 2016–2026 selection per project direction).

---

## 🗄️ Database

SQLite file at `data/nebula.db` (WAL mode, `foreign_keys = ON`). Migrations run automatically on first boot
(`PRAGMA user_version` tracks the schema version; on Turso replicas a `_nebula_meta` table is used instead,
since remote databases reject PRAGMA writes).

On Vercel the database is a **Turso cloud DB with embedded replicas** (`@libsql`'s better-sqlite3-compatible
driver): every serverless instance keeps a local read copy in `/tmp`, writes go to the Turso primary and
replicate back — data survives cold starts and is shared across instances. The database auto-migrates and
auto-seeds itself on first boot (empty → seeded).

```
users ─┬─< profiles ─┬─< watch_history >─┬─< content ─< episodes
       │             ├─< watchlist     ──┤        └─< cast_members
       └─< password_reset_tokens    └─< likes ────────┘
```

**Tables:** `users`, `profiles`, `content`, `episodes`, `cast_members`, `watch_history`,
`watchlist`, `likes`, `password_reset_tokens` — with foreign keys, unique constraints
(`UNIQUE(profile_id, content_id, episode_id)` etc.) and indexes on every hot query path
(title, genre, year, rating, featured/trending, profile joins).

**Every mutation hits SQLite:** signup → `INSERT users` · login → `SELECT users` · watchlist add/remove →
`INSERT/DELETE watchlist` · like → `INSERT/DELETE likes` · playback → `UPSERT watch_history` ·
search/filter/recommendations → parameterized `SELECT`s. Nothing lives in localStorage or in-memory arrays.

### Seed data

`scripts/db-seed.ts` inserts **15 modern titles (2016–2026, movies)**, **34 cast entries** (including a
• director row per title), a `trailer_url` for every title, featured/trending flags and 2 demo users —
enough to make every row, genre and recommender come alive. Sources and trailer URLs live in
`scripts/archive-sources.ts` (archive.org identifiers, official YouTube trailer IDs, and highlight time-windows).

---

## 🧪 Manual Test Matrix (all passing)

- **Auth:** signup → auto-login → logout → login (email *and* username) · duplicate email/username rejected · forgot-password reset works end-to-end
- **Persistence:** list/watch progress survive refresh, logout/login and full server restart
- **Progress:** watch ~30s → leave → Resume continues from the saved second; ≥95% marks Completed and leaves Continue Watching
- **Isolation:** two users' histories/lists/likes/recommendations are strictly separated (per-profile foreign keys; API reads session only)
- **Search:** by title ("Starfall"), genre ("Sci-Fi"), cast ("Dana Reyes") · empty state shows *No titles found* + Clear Search/Browse All
- **Filters:** type/genre/year/rating/sort all update SQLite results; pagination works
- **Player:** play/pause/seek/volume/mute/fullscreen/speed/keyboard · error + retry state
- **Responsive:** verified at 320, 375, 425, 768, 1024, 1280, 1440+ — hamburger nav, touch-friendly cards, no overflow

---

## 📦 Production & Deployment

```bash
npm run build
npm start        # serves on PORT (default 3000)
```

- Set `SESSION_SECRET` in the environment.
- Mount `data/` on a persistent volume (or set `NEBULA_DATA_DIR`) so the SQLite file survives redeploys.
- Behind TLS, cookies are automatically `Secure`; for local production tests without TLS set `NEBULA_INSECURE_COOKIES=1`.
- Run `npm run db:seed` once on first deploy (idempotent).

---

## 📱 Social

Just completed my Netflix Clone! Now streaming movies and TV shows with ease. 🎬🚀

Clone Link: [Clone Link]
GitHub Repository: [GitHub Link]

\#rehancodingwithai #codingwithai #WebDevelopment #Streaming #NetflixClone
