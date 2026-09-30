/**
 * Trailer resolution pass 4: (a) search IA `turner_video_*` trailer uploads by
 * title, (b) search Wikimedia Commons for trailer videos of each remaining film.
 *
 * Run: node scripts/resolve-trailers-4.ts
 */
import { writeFileSync } from "node:fs";

const FILMS = [
  "The General",
  "The Stranger",
  "Angel and the Badman",
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
  "Assignment Outer Space",
  "Mr. Bug Goes to Town",
];

async function iaSearch(q: string, rows = 12) {
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

async function iaMeta(identifier: string) {
  const r = await fetch(`https://archive.org/metadata/${identifier}`, { signal: AbortSignal.timeout(15000) });
  return r.json();
}

/** Commons video search → direct file URL */
async function commonsSearch(query: string) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search" +
    "&gsrnamespace=6&gsrlimit=8&gsrsearch=" +
    encodeURIComponent(query) +
    "&prop=imageinfo&iiprop=url%7Csize%7Cmime";
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const j = await r.json();
  const pages = j.query?.pages ? Object.values(j.query.pages) : [];
  const out: { title: string; url: string; mime: string; size: number; dur?: number }[] = [];
  for (const p of pages as any[]) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    if (!/video|ogg|webm/i.test(ii.mime || "")) continue;
    out.push({ title: p.title, url: ii.url, mime: ii.mime, size: ii.size, dur: ii.duration });
  }
  return out;
}

function secsOf(file: { length?: string }) {
  return parseFloat(String(file.length || "0")) || 0;
}

async function main() {
  const out: Record<string, unknown> = {};
  let i = 0;
  const workers = Array.from({ length: 5 }, async () => {
    while (i < FILMS.length) {
      const film = FILMS[i++];
      const cands: { via: string; id: string; title: string; file?: string; secs?: number; url?: string }[] = [];

      // (a) turner_video trailers by title
      try {
        const words = film.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/);
        const docs = await iaSearch(`identifier:turner_video* AND title:(${words.join(" AND ")}) AND mediatype:movies`, 8);
        for (const d of docs.slice(0, 3)) {
          const m = await iaMeta(d.identifier);
          if (!m.metadata || m.metadata["access-restricted-item"]) continue;
          const mp4s = (m.files || []).filter((f: { name: string }) => /\.mp4$/i.test(f.name));
          const f = mp4s.find((x: { length?: string }) => secsOf(x) >= 20 && secsOf(x) <= 420) || mp4s[0];
          if (f) cands.push({ via: "turner", id: d.identifier, title: String(m.metadata.title || ""), file: f.name, secs: secsOf(f) });
        }
      } catch {}

      // (b) Commons
      try {
        const cq = `filetype:video trailer "${film.replace(/A Nation's Battle for Life/, "")}"`;
        for (const c of await commonsSearch(cq)) {
          cands.push({ via: "commons", id: c.title, title: c.title, url: c.url, secs: Math.round(c.dur || 0) });
        }
      } catch {}

      out[film] = cands;
      console.log(`== ${film}`);
      for (const c of cands) console.log(`   [${c.via}] ${c.secs}s ${c.id.slice(0, 60)} | ${c.title.slice(0, 60)}${c.file ? " | " + c.file.slice(0, 50) : ""}`);
      if (!cands.length) console.log("   (none)");
    }
  });
  await Promise.all(workers);
  writeFileSync("scripts/research/trailers-pass4.json", JSON.stringify(out, null, 1));
  console.log("saved scripts/research/trailers-pass4.json");
}

main();
