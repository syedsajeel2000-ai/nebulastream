/**
 * One-off research probe #3: for every movie in the catalog (existing + planned
 * additions), find a standalone trailer item on archive.org, resolve it to a
 * browser-playable MP4, and save the mapping for review.
 *
 * Run: node scripts/resolve-trailers.ts
 */
import { writeFileSync } from "node:fs";

const RESTRICTED = "access-restricted-item";
const STOP = new Set(["the", "of", "a", "an", "and", "that", "in", "on", "for", "to", "is", "it", "at", "by", "with", "or"]);

const FILMS = [
  // existing
  "The General",
  "His Girl Friday",
  "House on Haunted Hill",
  "Night of the Living Dead",
  "Carnival of Souls",
  "Detour",
  "Suddenly",
  "D.O.A.",
  "The Stranger",
  "The Last Man on Earth",
  "The Little Princess",
  "Nosferatu",
  "Gulliver's Travels",
  "The Brain That Wouldn't Die",
  "Angel and the Badman",
  "Made for Each Other",
  "Assignment Outer Space",
  "The Phantom Planet",
  "Grass: A Nation's Battle for Life",
  "Penny Serenade",
  "The Wasp Woman",
  "Attack of the Giant Leeches",
  "The Giant Gila Monster",
  "Teenagers from Outer Space",
  "The Phantom Carriage",
  "Big Buck Bunny",
  "Elephants Dream",
  "Sintel",
  "Tears of Steel",
  "Cosmos Laundromat",
  // new: 3D animated / animation
  "Spring",
  "Sprite Fright",
  "Charge",
  "Agent 327 Operation Barbershop",
  "Wing It",
  "Coffee Run",
  "Princess Iron Fan",
  "Mr. Bug Goes to Town",
  // new: combat / war
  "Bataan",
  "Wake Island",
  "Gung Ho",
  "We Dive at Dawn",
  "In Which We Serve",
  "Blood on the Sun",
  "Attack",
  "Drums in the Deep South",
  "Zulu",
  "The Memphis Belle A Story of a Flying Fortress",
  // new: action / adventure
  "Metropolis",
  "The Thief of Bagdad",
  "The Mark of Zorro",
  "The Black Pirate",
  "The Lost World",
  "The Fast and the Furious",
  "Captain Kidd",
  "Jungle Book",
];

/** known-good or needed identifier guesses per film (tried first) */
const GUESSES: Record<string, string[]> = {
  "The General": ["the-general-trailer", "TheGeneralTrailer", "general-1926-trailer"],
  "Tears of Steel": ["tears-of-steel-trailer", "TearsOfSteelTrailer", "tearsofsteeltrailer", "Tears-of-Steel-Official-Trailer"],
  "Cosmos Laundromat": ["cosmos-laundromat-trailer", "CosmosLaundromatTrailer", "cosmoslaundromattrailer"],
  Nosferatu: ["NosferatuTrailer", "nosferatu-trailer"],
  Spring: ["spring-trailer", "SpringTrailer"],
  "Sprite Fright": ["sprite-fright-trailer", "SpriteFrightTrailer"],
  Charge: ["charge-trailer", "ChargeTrailer"],
  "Wing It": ["wing-it-trailer", "WingItTrailer"],
  "Coffee Run": ["coffee-run-trailer", "CoffeeRunTrailer"],
  "Agent 327 Operation Barbershop": ["agent-327-trailer", "Agent327Trailer"],
  Metropolis: ["metropolis-trailer", "MetropolisTrailer"],
  Zulu: ["zulu-trailer", "ZuluTrailer"],
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(s: string): string[] {
  return norm(s).split(" ").filter((w) => w && !STOP.has(w));
}

async function meta(identifier: string) {
  const r = await fetch(`https://archive.org/metadata/${identifier}`, { signal: AbortSignal.timeout(15000) });
  return r.json();
}

async function search(q: string, rows = 12) {
  const url =
    "https://archive.org/advancedsearch.php?q=" +
    encodeURIComponent(q) +
    "&fl[]=identifier&fl[]=title&rows=" +
    rows +
    "&page=1&output=json&sort[]=downloads+desc";
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const j = await r.json();
  return j.response.docs as { identifier: string; title: string }[];
}

function pickTrailerFile(files: { name: string; format?: string; source?: string; length?: string }[]) {
  const mp4s = files.filter(
    (f) => /\.mp4$/i.test(f.name) && !/sample/i.test(f.name) && (!f.format || /h\.?264|MPEG4|480p|720p|1080p|web video/i.test(f.format))
  );
  const withLen = mp4s.map((f) => ({ f, secs: parseFloat(String(f.length || "0")) || 0 }));
  const inRange = withLen.filter((x) => x.secs >= 20 && x.secs <= 420);
  return (inRange[0] || withLen.find((x) => x.secs > 0) || { f: mp4s[0], secs: 0 }).f;
}

async function resolveFromItem(identifier: string): Promise<{ id: string; itemTitle: string; file: string; secs: number } | null> {
  try {
    const m = await meta(identifier);
    if (!m.metadata || m.metadata[RESTRICTED]) return null;
    const file = pickTrailerFile(m.files || []);
    if (!file) return null;
    return {
      id: identifier,
      itemTitle: String(m.metadata.title || "").slice(0, 70),
      file: file.name,
      secs: parseFloat(String(file.length || "0")) || 0,
    };
  } catch {
    return null;
  }
}

function scoreItem(film: string, itemTitle: string): number {
  const t = norm(itemTitle);
  if (!/\b(trailer|teaser|preview|promo)\b/.test(t)) return 0;
  const fw = words(film);
  const hit = fw.filter((w) => t.includes(w)).length;
  return hit / fw.length;
}

async function resolveFilm(film: string) {
  // 1) identifier guesses first
  let chosen = null as Awaited<ReturnType<typeof resolveFromItem>>;
  for (const g of GUESSES[film] || []) {
    const r = await resolveFromItem(g);
    if (r) {
      chosen = r;
      break;
    }
  }

  // 2) title searches + scoring
  if (!chosen) {
    const fw = words(film);
    const queries = [
      `title:(${JSON.stringify(film)}) AND (title:trailer OR title:teaser) AND mediatype:movies`,
      `title:(${fw.join(" AND ")} AND trailer) AND mediatype:movies`,
      `title:(${fw.join(" AND ")} AND teaser) AND mediatype:movies`,
    ];
    const seen = new Set<string>();
    const cands: { identifier: string; title: string; score: number }[] = [];
    await Promise.all(
      queries.map(async (q) => {
        try {
          const docs = await search(q, 10);
          for (const d of docs) {
            if (seen.has(d.identifier)) continue;
            seen.add(d.identifier);
            const s = scoreItem(film, String(d.title));
            if (s >= 0.6) cands.push({ identifier: d.identifier, title: String(d.title), score: s });
          }
        } catch {}
      })
    );
    cands.sort((a, b) => b.score - a.score);
    for (const c of cands.slice(0, 3)) {
      const r = await resolveFromItem(c.identifier);
      if (r) {
        chosen = r;
        break;
      }
    }
    if (!chosen) {
      console.log(
        `NO TRAILER  ${film}` +
          (cands.length ? `  (candidates had no usable mp4: ${cands[0].identifier})` : "")
      );
      return [film, null] as const;
    }
  }
  console.log(`ok  ${film.padEnd(42)} -> ${chosen.id} | ${chosen.itemTitle} | ${chosen.file} | ${chosen.secs}s`);
  return [film, chosen] as const;
}

async function main() {
  const out: Record<string, unknown> = {};
  let i = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (i < FILMS.length) {
      const film = FILMS[i++];
      const [key, val] = await resolveFilm(film);
      out[key] = val;
    }
  });
  await Promise.all(workers);
  writeFileSync("scripts/research/trailers-resolved.json", JSON.stringify(out, null, 1));
  console.log("saved scripts/research/trailers-resolved.json");
}

main();
