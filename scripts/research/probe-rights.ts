/**
 * One-off research probe #2: (1) prefix-search archive.org for famous war films
 * whose identifiers we couldn't guess, (2) dump rights/license metadata for the
 * shortlist of candidate new titles.
 *
 * Run: node scripts/probe-rights.ts
 */
import { writeFileSync } from "node:fs";

const RESTRICTED = "access-restricted-item";

async function meta(identifier: string) {
  const r = await fetch(`https://archive.org/metadata/${identifier}`, {
    signal: AbortSignal.timeout(15000),
  });
  return r.json();
}

function pickFile(files: { name: string; format?: string; source?: string; length?: string; size?: string }[]) {
  const mp4s = files.filter(
    (f) =>
      /\.mp4$/i.test(f.name) &&
      !/sample/i.test(f.name) &&
      (!f.format || /h\.?264|MPEG4|480p|720p|1080p/i.test(f.format))
  );
  return (
    mp4s.find((f) => /512kb|desktop|1500kb/i.test(f.name)) ||
    mp4s.find((f) => f.source === "original") ||
    mp4s[0]
  );
}

async function search(q: string, rows = 25) {
  const url =
    "https://archive.org/advancedsearch.php?q=" +
    encodeURIComponent(q) +
    "&fl[]=identifier&fl[]=title&fl[]=year&rows=" +
    rows +
    "&page=1&output=json&sort[]=downloads+desc";
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const j = await r.json();
  return j.response.docs as { identifier: string; title: string; year?: string }[];
}

const PREFIX_QUERIES: Record<string, string> = {
  "All Quiet on the Western Front": "identifier:(allquiet*) AND mediatype:movies",
  Bataan: "identifier:(bataan*) AND mediatype:movies",
  "Sands of Iwo Jima": "identifier:(sandsofiwojima* OR sands-of-iwo-jima*) AND mediatype:movies",
  "Guadalcanal Diary": "identifier:(guadalcanal*) AND mediatype:movies",
  "Wake Island": "identifier:(wakeisland* OR wake-island*) AND mediatype:movies",
  "The Fighting 69th": "identifier:(fighting69th* OR fighting-69th*) AND mediatype:movies",
  Zulu: "identifier:(zulu*) AND year:1964 AND mediatype:movies",
  Metropolis: "identifier:(metropolis*) AND year:1927 AND mediatype:movies",
};

/** shortlist of already-found candidates to dump rights info for */
const SHORTLIST = [
  "attack-1956",
  "Gung_Ho",
  "We_Dive_at_Dawn_1943",
  "In_Which_We_Serve",
  "BloodontheSun",
  "BattleofBloodIsland",
  "Drums_in_the_Deep_South",
  "they_raid_by_night",
  "TheMemphisBelleAStoryofaFlyingFortress",
  "BattleshipPotemkin",
  "princess_iron_fan",
  "mr_bug_goes_to_town",
  "the-adventures-of-mark-twain-1985_film",
  "TheFastandtheFuriousJohnIreland1954goofyrip",
  "CaptainKidd_",
  "JungleBook",
  "hot_rod_girl_1956",
  "BillytheKidReturns",
  "TheThiefOfBagdad1924",
  "the-mark-of-zorro-1920",
  "the-black-pirate-1926",
  "TheLostWorld1925",
  "spring_blenderopenmovie",
  "sprite-fright-2021",
  "charge-blender-open-movie-1608p",
  "agent327operationbarbershop",
  "wing_it",
  "coffee-run",
];

async function main() {
  const found: Record<string, unknown> = {};

  console.log("===== prefix searches =====");
  for (const [label, q] of Object.entries(PREFIX_QUERIES)) {
    try {
      const docs = await search(q, 15);
      const hits: unknown[] = [];
      for (const d of docs) {
        const m = await meta(d.identifier);
        if (!m.metadata || m.metadata[RESTRICTED]) continue;
        const file = pickFile(m.files || []);
        if (!file) continue;
        const secs = parseFloat(String(file.length || "0"));
        if (!secs || secs < 1800) continue; // features only
        hits.push({
          id: d.identifier,
          title: String(m.metadata.title || "").slice(0, 70),
          year: m.metadata.year || d.year || "",
          file: file.name,
          len: file.length,
          rights: m.metadata.rights || m.metadata.licenseurl || "",
        });
      }
      found[label] = hits;
      console.log("== " + label);
      if (!hits.length) console.log("   (none)");
      for (const h of hits as { id: string; title: string; year: string; file: string; len: string }[])
        console.log("   ", h.id, "|", h.title, "|", h.year, "|", h.len, "s");
    } catch (e) {
      console.log("== " + label + " ERR " + (e as Error).message);
    }
  }

  console.log("===== rights of shortlist =====");
  const rights: Record<string, unknown> = {};
  for (const id of SHORTLIST) {
    try {
      const m = await meta(id);
      const md = m.metadata || {};
      const info = {
        title: md.title,
        year: md.year,
        rights: md.rights || "",
        licenseurl: md.licenseurl || "",
        collections: Array.isArray(md.collection) ? md.collection.join(",") : md.collection || "",
        subject: Array.isArray(md.subject) ? md.subject.slice(0, 8).join(",") : md.subject || "",
        rating: md.rating || "",
      };
      rights[id] = info;
      console.log(
        id.padEnd(42),
        "| rights:",
        String(info.rights || "-").slice(0, 40),
        "| lic:",
        String(info.licenseurl || "-").slice(0, 50),
        "| subj:",
        String(info.subject).slice(0, 50)
      );
    } catch (e) {
      console.log(id.padEnd(42), "ERR " + (e as Error).message);
    }
  }

  writeFileSync("scripts/research/probe-rights-results.json", JSON.stringify({ found, rights }, null, 1));
  console.log("saved scripts/research/probe-rights-results.json");
}

main();
