/**
 * Trailer resolution pass 3: dump known trailer-uploaders' catalogs, then per
 * film list ALL archive.org items matching the title (any kind), flagging ones
 * that look like trailers (trailer keyword or short runtime).
 *
 * Run: node scripts/resolve-trailers-3.ts
 */
import { writeFileSync } from "node:fs";

const RESTRICTED = "access-restricted-item";

const FILMS = [
  "The General",
  "The Stranger",
  "Angel and the Badman",
  "Assignment Outer Space",
  "Grass A Nation's Battle for Life",
  "Penny Serenade",
  "The Phantom Carriage",
  "Cosmos Laundromat",
  "Sprite Fright",
  "Agent 327 Operation Barbershop",
  "Coffee Run",
  "Spring",
  "Charge",
  "Wing It",
  "Tears of Steel",
  "Princess Iron Fan",
  "Mr. Bug Goes to Town",
  "We Dive at Dawn",
  "In Which We Serve",
  "Blood on the Sun",
  "The Memphis Belle A Story of a Flying Fortress",
  "Drums in the Deep South",
  "Attack",
  "The Black Pirate",
  "The Lost World",
  "The Fast and the Furious",
  "The Thief of Bagdad",
  "The Mark of Zorro",
];

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
  return (j.response?.docs || []) as { identifier: string; title: string }[];
}

const STOP = new Set(["the", "of", "a", "an", "and", "that", "in", "on", "for", "to", "is", "it", "at", "by", "with", "or"]);
function words(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w && !STOP.has(w));
}

async function main() {
  // 1) uploader dumps
  console.log("===== sinema-trailer_* =====");
  const sinema = await search("identifier:sinema-trailer* AND mediatype:movies", 200);
  console.log(sinema.map((d) => d.identifier).join("\n"));
  console.log("===== movie-trailer-* =====");
  const mt = await search("identifier:movie-trailer* AND mediatype:movies", 100);
  console.log(mt.map((d) => d.identifier).join("\n"));
  writeFileSync(
    "scripts/research/trailer-uploader-dump.json",
    JSON.stringify({ sinema: sinema.map((d) => d.identifier), movieTrailer: mt.map((d) => d.identifier) }, null, 1)
  );

  // 2) per-film candidates
  const out: Record<string, unknown> = {};
  let i = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (i < FILMS.length) {
      const film = FILMS[i++];
      const fw = words(film);
      const queries = [`title:(${fw.join(" AND ")}) AND mediatype:movies`, `title:(${JSON.stringify(film)}) AND mediatype:movies`];
      const seen = new Set<string>();
      const docs: { identifier: string; title: string }[] = [];
      for (const q of queries) {
        try {
          for (const d of await search(q, 15)) {
            if (!seen.has(d.identifier)) {
              seen.add(d.identifier);
              docs.push(d);
            }
          }
        } catch {}
      }
      const cands: unknown[] = [];
      for (const d of docs.slice(0, 10)) {
        try {
          const m = await meta(d.identifier);
          if (!m.metadata || m.metadata[RESTRICTED]) continue;
          const files = (m.files || []).filter(
            (f: { name: string }) => /\.mp4$/i.test(f.name) && !/sample/i.test(f.name)
          );
          if (!files.length) continue;
          const f = files.find((x: { name: string; length?: string }) => (parseFloat(String(x.length || "0")) || 0) <= 420) || files[0];
          const secs = parseFloat(String(f.length || "0")) || 0;
          const t = String(m.metadata.title || d.title);
          const hit = fw.filter((w) => t.toLowerCase().includes(w)).length / fw.length;
          const looksTrailer = /\b(trailer|teaser|preview|promo|original theatrical|advertisement|tsr)\b/i.test(t);
          cands.push({
            id: d.identifier,
            title: t.slice(0, 70),
            secs: Math.round(secs),
            file: f.name,
            hit: Math.round(hit * 10) / 10,
            trailerish: looksTrailer,
          });
        } catch {}
      }
      // sort: trailer keyword first, then title-match, then short
      cands.sort((a: any, b: any) => b.trailerish - a.trailerish || b.hit - a.hit || a.secs - b.secs);
      out[film] = cands;
      console.log(`== ${film}`);
      for (const c of cands as any[]) {
        console.log(
          `   ${(c.trailerish ? "T" : " ")} ${String(c.hit).padEnd(3)} ${String(c.secs).padStart(5)}s  ${c.id.slice(0, 55)} | ${c.title}`
        );
      }
    }
  });
  await Promise.all(workers);
  writeFileSync("scripts/research/trailers-pass3.json", JSON.stringify(out, null, 1));
  console.log("saved scripts/research/trailers-pass3.json");
}

main();
