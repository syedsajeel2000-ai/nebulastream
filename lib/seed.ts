/**
 * Catalog + seeding — REAL, legally streamable MODERN content (2016–2026).
 *
 * Catalog: open-license films only — Blender Studio open movies (CC BY / BY-ND /
 * BY-SA), NASA 3D mission animations (public domain) and one declassified
 * military documentary (CC BY-ND), all streamed directly from archive.org.
 * Every title has a verified trailer (official YouTube upload from the
 * rights-holder channel, or a ~90s highlight window onto the film itself).
 * Posters/backdrops are deterministic placeholder art.
 */
import { db, migrate } from "./db.ts";
import { hashPassword } from "./security.ts";
import { MODERN_SOURCES, archiveUrl, trailerFor } from "../scripts/archive-sources.ts";

migrate();

const S = MODERN_SOURCES;

/* --------------------------------- Modern catalog (2016–2026) ---------------------------------- */

interface SeedItem {
  title: string;
  description: string;
  type: "movie" | "tv";
  genre: string;
  release_year: number;
  rating: number;
  featured?: boolean;
  trending?: boolean;
  video: string;
  /** Movie runtime in seconds (TV shows use per-episode durations). */
  duration?: number;
  cast: [string, string][];
  director: string;
  /** License label, e.g. "CC BY 4.0". Defaults to "Public Domain" when omitted. */
  license?: string;
  /** episodes: [season][episode] = { title, duration, video } */
  seasons?: { title: string; desc: string; dur: number; video: string }[][];
}

const CATALOG: SeedItem[] = [
  {
    title: "Caminandes: Llamigos",
    description:
      "Koro the llama faces his ultimate rival on a frozen Patagonian highway — an icy penguin who guards the last patch of grass. The third Caminandes short is a wordless slapstick duel, rendered to gleaming perfection.",
    type: "movie",
    genre: "Animation",
    release_year: 2016,
    rating: 7.5,
    featured: true,
    video: archiveUrl(S["caminandes-llamigos"].id, S["caminandes-llamigos"].file),
    duration: S["caminandes-llamigos"].secs,
    license: S["caminandes-llamigos"].license,
    cast: [
      ["Pablo Vazquez", "Animation & Design"],
      ["Blender Foundation", "Production"],
    ],
    director: "Pablo Vazquez",
  },
  {
    title: "Agent 327: Operation Barbershop",
    description:
      "In a turtle-souped-up Amsterdam, secret agent 327 walks into a barbershop where nothing — not the customers, not the chairs, not the razors — is what it seems. A Chinatown-noir teaser for a full feature, packed with slapstick espionage.",
    type: "movie",
    genre: "Action",
    release_year: 2017,
    rating: 7.4,
    trending: true,
    video: archiveUrl(S["agent-327"].id, S["agent-327"].file),
    duration: S["agent-327"].secs,
    license: S["agent-327"].license,
    cast: [
      ["Blender Animation Studio", "Animation Studio"],
      ["Martin Lodewijk", "Original Comic"],
    ],
    director: "Colin Levy",
  },
  {
    title: "Hero",
    description:
      "A lone figure moves through a burning world rendered entirely with Blender's Grease Pencil — every flame, ember and sword-stroke drawn live in 3D space. A landmark showcase of hand-drawn-meets-3D filmmaking.",
    type: "movie",
    genre: "Animation",
    release_year: 2018,
    rating: 7.2,
    video: archiveUrl(S.hero.id, S.hero.file),
    duration: S.hero.secs,
    license: S.hero.license,
    cast: [
      ["Blender Studio", "Grease Pencil Team"],
    ],
    director: "Daniel Martinez Lara",
  },
  {
    title: "Spring",
    description:
      "A shepherd girl and her dog face ancient spirits in the mountains to bring spring back to the valley below — but the last spirit demands a price. A painterly fairy tale and the first open movie made with Blender 2.8.",
    type: "movie",
    genre: "Adventure",
    release_year: 2019,
    rating: 7.6,
    featured: true,
    video: archiveUrl(S.spring.id, S.spring.file),
    duration: S.spring.secs,
    license: S.spring.license,
    cast: [
      ["Blender Studio", "Animation Studio"],
    ],
    director: "Andy Goralczyk",
  },
  {
    title: "Coffee Run",
    description:
      "Fueled by caffeine, a young woman runs through the bittersweet memories of her past relationship — every cup unlocking another piece of the story she's trying to outrun. A stylized, heartfelt chase through a city of coffee.",
    type: "movie",
    genre: "Drama",
    release_year: 2020,
    rating: 6.8,
    video: archiveUrl(S["coffee-run"].id, S["coffee-run"].file),
    duration: S["coffee-run"].secs,
    license: S["coffee-run"].license,
    cast: [
      ["Blender Animation Studio", "Animation Studio"],
    ],
    director: "Hjalti Hjálmarsson",
  },
  {
    title: "NASA SpaceX Demo-2 Mission Animation",
    description:
      "NASA and SpaceX's fully animated walkthrough of the historic Demo-2 mission — from Falcon 9 liftoff to Crew Dragon docking with the International Space Station and splashdown. The film that previewed the return of crewed launches from US soil.",
    type: "movie",
    genre: "Documentary",
    release_year: 2020,
    rating: 7.3,
    video: archiveUrl(S["demo-2"].id, S["demo-2"].file),
    duration: S["demo-2"].secs,
    license: S["demo-2"].license,
    cast: [
      ["NASA", "Production"],
      ["SpaceX", "Animation"],
    ],
    director: "NASA & SpaceX",
  },
  {
    title: "Sprite Fright",
    description:
      "A group of mischievous teens on a camping trip pick the wrong forest to litter in — the sprites that live there turn their prank war lethal in this 80s-inspired horror comedy. Cozy campfire vibes with sharp, slasher-smart comic timing.",
    type: "movie",
    genre: "Horror",
    release_year: 2021,
    rating: 7.4,
    trending: true,
    video: archiveUrl(S["sprite-fright"].id, S["sprite-fright"].file),
    duration: S["sprite-fright"].secs,
    license: S["sprite-fright"].license,
    cast: [
      ["Matthew Luhn", "Director"],
      ["Blender Studio", "Animation Studio"],
    ],
    director: "Matthew Luhn",
  },
  {
    title: "NASA Psyche Mission: Charting a Metallic World",
    description:
      "Ride along with NASA's Psyche spacecraft on its journey to a metal-rich asteroid thought to be the exposed core of a shattered protoplanet — a fully animated preview of the mission to a world never seen up close.",
    type: "movie",
    genre: "Documentary",
    release_year: 2021,
    rating: 7.0,
    video: archiveUrl(S.psyche.id, S.psyche.file),
    duration: S.psyche.secs,
    license: S.psyche.license,
    cast: [["NASA Jet Propulsion Laboratory", "Production"]],
    director: "NASA JPL",
  },
  {
    title: "Charge",
    description:
      "In an energy-starved dystopia an old destitute man breaks into a battery factory — and walks straight into a deadly security droid with nowhere to run. A dialogue-free chase short that hits like a thriller.",
    type: "movie",
    genre: "Sci-Fi",
    release_year: 2022,
    rating: 7.0,
    trending: true,
    video: archiveUrl(S.charge.id, S.charge.file),
    duration: S.charge.secs,
    license: S.charge.license,
    cast: [["Blender Studio", "Animation Studio"]],
    director: "Blender Studio",
  },
  {
    title: "NASA's CAPSTONE: Flying a New Path to the Moon",
    description:
      "A microwave-oven-sized CubeSat takes a groundbreaking ballistic lunar transfer to test the near-rectilinear halo orbit that will house Gateway, humanity's future lunar station — animated end to end by NASA.",
    type: "movie",
    genre: "Documentary",
    release_year: 2022,
    rating: 6.9,
    video: archiveUrl(S.capstone.id, S.capstone.file),
    duration: S.capstone.secs,
    license: S.capstone.license,
    cast: [["NASA", "Production"]],
    director: "NASA",
  },
  {
    title: "Wing It!",
    description:
      "A cat and a dog — polar opposites sharing one apartment — battle over territory, comfort and the last treat in this stylized 2D-look cartoon from Blender Studio. Chaos escalates until both learn the cost of going it alone.",
    type: "movie",
    genre: "Comedy",
    release_year: 2023,
    rating: 6.9,
    video: archiveUrl(S["wing-it"].id, S["wing-it"].file),
    duration: S["wing-it"].secs,
    license: S["wing-it"].license,
    cast: [["Blender Studio", "Animation Studio"]],
    director: "Blender Studio",
  },
  {
    title: "NASA Artemis Lunar Terrain Vehicle",
    description:
      "NASA's official animated trailer for the Lunar Terrain Vehicle — the crewed rover that will drive astronauts across the lunar south pole as they build a lasting presence on the Moon for the Artemis generation.",
    type: "movie",
    genre: "Documentary",
    release_year: 2024,
    rating: 7.1,
    video: archiveUrl(S["artemis-ltv"].id, S["artemis-ltv"].file),
    duration: S["artemis-ltv"].secs,
    license: S["artemis-ltv"].license,
    cast: [["NASA", "Production"]],
    director: "NASA",
  },
  {
    title: "Tsar Bomba: Declassified",
    description:
      "The complete declassified record of the largest explosion in human history — the Soviet Union's 50-megaton test over Novaya Zemlya, restored and released in 2020. Raw, chilling footage of the most powerful weapon ever detonated.",
    type: "movie",
    genre: "Documentary",
    release_year: 2020,
    rating: 7.8,
    trending: true,
    video: archiveUrl(S["tsar-bomba"].id, S["tsar-bomba"].file),
    duration: S["tsar-bomba"].secs,
    license: S["tsar-bomba"].license,
    cast: [["Russian State Archive", "Declassified Footage"]],
    director: "Unknown (declassified footage)",
  },
  {
    title: "Artemis II to the Moon: Launch to Splashdown",
    description:
      "NASA's full mission animation for Artemis II — the first crewed flight around the Moon in over fifty years. Follow four astronauts from SLS launch and Orion solar-array deployment to lunar flyby and Pacific splashdown.",
    type: "movie",
    genre: "Documentary",
    release_year: 2025,
    rating: 7.4,
    video: archiveUrl(S["artemis-ii"].id, S["artemis-ii"].file),
    duration: S["artemis-ii"].secs,
    license: S["artemis-ii"].license,
    cast: [["NASA", "Production"]],
    director: "NASA",
  },
  {
    title: "Singularity",
    description:
      "A painterly space adventure set in a universe before the beginning of our time — Blender Studio's latest open movie pushes stylized rendering, painterly animation and 4K HDR into breathtaking new territory.",
    type: "movie",
    genre: "Sci-Fi",
    release_year: 2026,
    rating: 7.5,
    featured: true,
    trending: true,
    video: archiveUrl(S.singularity.id, S.singularity.file),
    duration: S.singularity.secs,
    license: S.singularity.license,
    cast: [["Blender Studio", "Animation Studio"]],
    director: "Blender Studio",
  },
];

/* -------------------------------------- Seed -------------------------------------- */

export function seed(): void {
  const existing = (db.prepare("SELECT COUNT(*) n FROM content").get() as { n: number }).n;
  if (existing > 0) {
    console.log(`Database already seeded (${existing} titles). Skipping.`);
    return;
  }

  const insertContent = db.prepare(
    `INSERT INTO content (title, description, type, genre, release_year, duration, rating,
                          poster, backdrop, trailer_url, video_url, featured, trending, license)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertCast = db.prepare(
    "INSERT INTO cast_members (content_id, name, role, sort_order) VALUES (?, ?, ?, ?)"
  );
  const insertEpisode = db.prepare(
    `INSERT INTO episodes (content_id, season_number, episode_number, title, description, duration, video_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const poster = (title: string) =>
    `https://picsum.photos/seed/${encodeURIComponent(title)}/342/513`;
  const backdrop = (title: string) =>
    `https://picsum.photos/seed/${encodeURIComponent(title)}-bd/1280/720`;

  const run = db.transaction(() => {
    for (const item of CATALOG) {
      const info = insertContent.run(
        item.title,
        item.description,
        item.type,
        item.genre,
        item.release_year,
        item.duration ?? 0,
        item.rating,
        poster(item.title),
        backdrop(item.title),
        trailerFor(item.title, item.video),
        item.video,
        item.featured ? 1 : 0,
        item.trending ? 1 : 0,
        item.license ?? "Public Domain"
      );
      const contentId = Number(info.lastInsertRowid);

      item.cast.forEach(([name, role], i) => {
        insertCast.run(contentId, name, role, i);
      });

      // Director as its own cast row so the title page's
      // `cast.find(c => c.role.toLowerCase() === "director")` lookup resolves.
      if (item.director) {
        insertCast.run(contentId, item.director, "director", item.cast.length);
      }

      if (item.type === "tv" && item.seasons) {
        item.seasons.forEach((season, si) => {
          season.forEach((ep, ei) => {
            insertEpisode.run(contentId, si + 1, ei + 1, ep.title, ep.desc, ep.dur, ep.video);
          });
        });
      }
    }

    /* ------------------------------ Demo accounts ------------------------------ */

    const demoUsers = [
      { fullName: "Demo User", username: "demo", email: "demo@nebula.test", password: "demo1234", profile: "Demo" },
      { fullName: "Sci Fi Fan", username: "scifi", email: "scifi@nebula.test", password: "scifi1234", profile: "Sci-Fi" },
    ];
    for (const u of demoUsers) {
      if (!db.prepare("SELECT 1 FROM users WHERE email = ? COLLATE NOCASE").get(u.email)) {
        const info = db
          .prepare("INSERT INTO users (full_name, username, email, password_hash) VALUES (?, ?, ?, ?)")
          .run(u.fullName, u.username, u.email, hashPassword(u.password));
        db.prepare("INSERT INTO profiles (user_id, profile_name, avatar) VALUES (?, ?, ?)").run(
          Number(info.lastInsertRowid),
          u.profile,
          "🎬"
        );
      }
    }
  });

  run();

  const counts = {
    content: (db.prepare("SELECT COUNT(*) n FROM content").get() as { n: number }).n,
    episodes: (db.prepare("SELECT COUNT(*) n FROM episodes").get() as { n: number }).n,
    cast: (db.prepare("SELECT COUNT(*) n FROM cast_members").get() as { n: number }).n,
    users: (db.prepare("SELECT COUNT(*) n FROM users").get() as { n: number }).n,
  };
  console.log(
    `Seeded: ${counts.content} titles (${counts.episodes} episodes, ${counts.cast} cast members, ${counts.users} users). Modern open-license films only (2016–2026): Blender open movies + NASA mission animations + declassified military history, every title with a trailer.`
  );
}
