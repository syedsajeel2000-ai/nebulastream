/**
 * One-off research probe: find archive.org items that are (a) not access-restricted
 * and (b) contain a browser-playable MP4, either via direct identifier guesses or
 * via the curated `feature_films` collection filtered by subject.
 *
 * Run: node scripts/probe-candidates.ts
 */
import { writeFileSync } from "node:fs";

interface Hit {
  id: string;
  title: string;
  year: string | number;
  file: string;
  len: string | number;
  size: string | number;
}

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

async function fromIdentifier(identifier: string): Promise<Hit | null> {
  try {
    const m = await meta(identifier);
    if (!m.metadata || m.metadata[RESTRICTED]) return null;
    const file = pickFile(m.files || []);
    if (!file) return null;
    return {
      id: identifier,
      title: String(m.metadata.title || "").slice(0, 70),
      year: m.metadata.year || "",
      file: file.name,
      len: file.length || "",
      size: file.size || "",
    };
  } catch {
    return null;
  }
}

async function search(q: string, rows = 20): Promise<{ identifier: string; title: string }[]> {
  const url =
    "https://archive.org/advancedsearch.php?q=" +
    encodeURIComponent(q) +
    "&fl[]=identifier&fl[]=title&fl[]=year&rows=" +
    rows +
    "&page=1&output=json&sort[]=downloads+desc";
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const j = await r.json();
  return j.response.docs;
}

const GUESSES: Record<string, string[]> = {
  "All Quiet on the Western Front": ["AllQuietontheWesternFront1930", "all-quiet-on-the-western-front", "AllQuietOnTheWesternFront1930"],
  Bataan: ["bataan", "Bataan", "bataan-1943", "Bataan1943"],
  "Sands of Iwo Jima": ["SandsOfIwoJima", "sands-of-iwo-jima", "sandsofiwojima"],
  "Guadalcanal Diary": ["GuadalcanalDiary", "guadalcanal-diary", "guadalcanaldiary"],
  "Wake Island": ["WakeIsland", "wake-island-1942", "WakeIsland1942"],
  Attack: ["attack-1956", "Attack1956", "attack_1956"],
  "The Fighting 69th": ["TheFighting69th", "fighting-69th", "fighting69th"],
  Zulu: ["Zulu1964", "zulu-1964", "Zulu"],
  "Coffee Run": ["coffee-run", "coffee_run", "CoffeeRun"],
  "Glass Half": ["glass-half", "glass_half"],
  Singularity: ["singularity-blender", "BlenderSingularity"],
  Metropolis: ["Metropolis1927", "metropolis", "metropolis-1927"],
  "The Lost World": ["TheLostWorld1925", "the-lost-world-1925", "TheLostWorld"],
  "Things to Come": ["things_to_COME_RMSTR"],
  "Mr. Bug Goes to Town": ["mr_bug_goes_to_town"],
  "The Adventures of Mark Twain": ["the-adventures-of-mark-twain-1985_film"],
  "The Thief of Bagdad": ["TheThiefOfBagdad1924", "the-thief-of-bagdad-1924"],
  "The Mark of Zorro": ["the-mark-of-zorro-1920"],
  "The Black Pirate": ["the-black-pirate-1926"],
  Spring: ["spring_blenderopenmovie"],
  "Sprite Fright": ["sprite-fright-2021"],
  Charge: ["charge-blender-open-movie-1608p"],
  "Agent 327": ["agent327operationbarbershop"],
  "Wing It!": ["wing_it"],
};

async function main() {
  const out: Record<string, Hit | null | string> = {};

  console.log("--- identifier guesses ---");
  for (const [label, ids] of Object.entries(GUESSES)) {
    for (const id of ids) {
      const hit = await fromIdentifier(id);
      if (hit) {
        out[label] = hit;
        console.log(label.padEnd(32), hit.id, "|", hit.title, "|", hit.year, "|", hit.file, "|", hit.len, "s");
        break;
      }
    }
    if (!out[label]) {
      out[label] = "no guess matched";
      console.log(label.padEnd(32), "no guess matched");
    }
  }

  const queries: Record<string, string> = {
    war_subject: 'collection:feature_films AND (subject:war OR subject:combat)',
    action_subject: 'collection:feature_films AND subject:action',
    animation_subject: 'collection:feature_films AND subject:animation AND year:[1930 TO 1950]',
    cc_action_2000s:
      'licenseurl:*creativecommons* AND mediatype:movies AND year:[2000 TO 2026] AND (subject:action OR subject:combat OR subject:war)',
  };

  for (const [label, q] of Object.entries(queries)) {
    console.log("--- " + label + " ---");
    try {
      const docs = await search(q, 25);
      const arr: Hit[] = [];
      for (const d of docs) {
        const hit = await fromIdentifier(d.identifier);
        if (hit) arr.push(hit);
      }
      out[label] = arr as unknown as string;
      for (const h of arr) console.log("  ", h.id, "|", h.title, "|", h.year, "|", h.len, "s");
    } catch (e) {
      console.log("  ERR", (e as Error).message);
    }
  }

  writeFileSync("scripts/research/probe-results.json", JSON.stringify(out, null, 1));
  console.log("saved scripts/research/probe-results.json");
}

main();
