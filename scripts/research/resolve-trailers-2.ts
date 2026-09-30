/**
 * Trailer resolution pass 2: smarter searches for films pass 1 missed or got wrong.
 * Uses description-phrase queries, creator filters, and manual identifier guesses.
 *
 * Run: node scripts/resolve-trailers-2.ts
 */
import { writeFileSync } from "node:fs";

const RESTRICTED = "access-restricted-item";

/** films that pass 1 missed or matched to the wrong film */
const FILMS = [
  "D.O.A.",
  "The General",
  "The Stranger",
  "Angel and the Badman",
  "Assignment Outer Space",
  "Grass: A Nation's Battle for Life",
  "Penny Serenade",
  "The Phantom Carriage",
  "Cosmos Laundromat",
  "Sprite Fright",
  "Agent 327 Operation Barbershop",
  "Tears of Steel",
  "Coffee Run",
  "Spring",
  "Charge",
  "Wing It",
  "Princess Iron Fan",
  "Mr. Bug Goes to Town",
  "We Dive at Dawn",
  "In Which We Serve",
  "Blood on the Sun",
  "The Memphis Belle A Story of a Flying Fortress",
  "Drums in the Deep South",
  "The Mark of Zorro",
  "Attack",
  "The Black Pirate",
  "The Lost World",
  "The Fast and the Furious",
  "The Thief of Bagdad",
];

const GUESSES: Record<string, string[]> = {
  "D.O.A.": ["1950.-d.-o.-a.-trailer"],
  "The General": ["the-general-1926-trailer", "TheGeneral1926Trailer", "general-trailer-1926"],
  "Tears of Steel": ["tears-of-steel-official-trailer", "TearsOfSteelTeaser"],
  "Cosmos Laundromat": ["cosmos-laundromat-first-cycle-trailer", "CosmosLaundromatTeaser"],
  "Sprite Fright": ["sprite-fright-official-trailer", "spritefrighttrailer"],
  "Mr. Bug Goes to Town": ["mr-bug-goes-to-town-trailer", "MrBugGoesToTownTrailer"],
  "The Mark of Zorro": ["TheMarkOfZorroTrailer", "mark-of-zorro-trailer"],
  "Penny Serenade": ["PennySerenadeTrailer", "penny-serenade-trailer"],
};

async function meta(identifier: string) {
  const r = await fetch(`https://archive.org/metadata/${identifier}`, { signal: AbortSignal.timeout(15000) });
  return r.json();
}

async function search(q: string, rows = 15) {
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

function pickTrailerFile(files: { name: string; format?: string; length?: string }[]) {
  const mp4s = files.filter(
    (f) => /\.mp4$/i.test(f.name) && !/sample/i.test(f.name) && (!f.format || /h\.?264|MPEG4|480p|720p|1080p/i.test(f.format))
  );
  const withLen = mp4s.map((f) => ({ f, secs: parseFloat(String(f.length || "0")) || 0 }));
  const inRange = withLen.filter((x) => x.secs >= 20 && x.secs <= 420);
  return (inRange[0] || withLen.find((x) => x.secs > 0) || { f: mp4s[0], secs: 0 }).f;
}

async function resolveFromItem(identifier: string) {
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

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
const STOP = new Set(["the", "of", "a", "an", "and", "that", "in", "on", "for", "to", "is", "it", "at", "by", "with", "or"]);
function words(s: string) {
  return norm(s).split(" ").filter((w) => w && !STOP.has(w));
}

/** does the candidate item title (optionally with the film phrase in description) plausibly refer to the film? */
function okMatch(film: string, itemTitle: string, phraseInDesc: boolean): boolean {
  const t = norm(itemTitle);
  const fw = words(film);
  const hits = fw.filter((w) => t.includes(w)).length;
  const strong = hits / fw.length >= 0.6;
  const trailerish = /\b(trailer|teaser|preview|promo|tsr)\b/.test(t);
  if (!trailerish) return false;
  if (phraseInDesc) return true; // film's exact name is in the item's metadata somewhere
  return strong;
}

async function resolveFilm(film: string) {
  // guesses
  for (const g of GUESSES[film] || []) {
    const r = await resolveFromItem(g);
    if (r) return [film, { ...r, via: "guess:" + g }] as const;
  }

  const phrase = JSON.stringify(film);
  const fw = words(film);
  const queries = [
    `title:trailer AND description:${phrase} AND mediatype:movies`,
    `title:teaser AND description:${phrase} AND mediatype:movies`,
    `description:${phrase} AND (title:trailer OR title:teaser OR title:preview) AND mediatype:movies`,
    `(${phrase}) AND title:trailer AND mediatype:movies`,
    `title:(${fw.join(" AND ")}) AND title:trailer AND mediatype:movies`,
  ];
  const seen = new Set<string>();
  const cands: { identifier: string; title: string; desc: boolean }[] = [];
  await Promise.all(
    queries.map(async (q, qi) => {
      try {
        const docs = await search(q, 12);
        for (const d of docs) {
          if (seen.has(d.identifier)) continue;
          seen.add(d.identifier);
          cands.push({ identifier: d.identifier, title: String(d.title), desc: qi < 3 });
        }
      } catch {}
    })
  );

  for (const c of cands) {
    if (!okMatch(film, c.title, c.desc)) continue;
    const r = await resolveFromItem(c.identifier);
    if (r) return [film, { ...r, via: c.identifier }] as const;
  }
  console.log(`NO TRAILER  ${film}  (${cands.length} raw candidates)`);
  return [film, null] as const;
}

async function main() {
  const out: Record<string, unknown> = {};
  let i = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (i < FILMS.length) {
      const film = FILMS[i++];
      const [key, val] = await resolveFilm(film);
      out[key] = val;
      if (val) console.log(`ok  ${film.padEnd(42)} -> ${val.id} | ${val.itemTitle} | ${val.file} | ${val.secs}s`);
    }
  });
  await Promise.all(workers);
  writeFileSync("scripts/research/trailers-resolved-2.json", JSON.stringify(out, null, 1));
  console.log("saved scripts/research/trailers-resolved-2.json");
}

main();
