/**
 * Final source verification for the catalog expansion:
 *  1. For each new film: pick the best h264 MP4 in its archive.org item.
 *  2. For each archive.org trailer: resolve exact filename.
 *  3. Range-GET every archive.org URL (expect 200/206 + video content-type).
 *  4. oEmbed-check every YouTube trailer ID.
 *  5. Print Gung-Ho/Jungle-Book trailer item metadata for manual sanity review.
 *
 * Run: node scripts/verify-sources.ts
 */
import { writeFileSync } from "node:fs";

/** new film → archive.org item id (best mp4 picked automatically) */
const NEW_FILMS: Record<string, string> = {
  Spring: "spring_blenderopenmovie",
  "Sprite Fright": "sprite-fright-2021",
  Charge: "charge-blender-open-movie-1608p",
  "Agent 327": "agent327operationbarbershop",
  "Wing It!": "wing_it",
  "Coffee Run": "coffee-run",
  "Princess Iron Fan": "princess_iron_fan",
  "Mr. Bug Goes to Town": "mr_bug_goes_to_town",
  Bataan: "bataan_202401",
  "Wake Island": "wake-island-1942_202503",
  "Gung Ho!": "Gung_Ho",
  "We Dive at Dawn": "We_Dive_at_Dawn_1943",
  "In Which We Serve": "In_Which_We_Serve",
  "Blood on the Sun": "BloodontheSun",
  "Attack!": "attack-1956",
  "Drums in the Deep South": "Drums_in_the_Deep_South",
  Zulu: "zulu-1964-full-movie",
  "The Memphis Belle: A Story of a Flying Fortress": "TheMemphisBelleAStoryofaFlyingFortress",
  Metropolis: "metropolis-lang",
  "The Thief of Bagdad": "TheThiefOfBagdad1924",
  "The Mark of Zorro": "the-mark-of-zorro-1920",
  "The Black Pirate": "the-black-pirate-1926",
  "The Lost World": "TheLostWorld1925",
  "The Fast and the Furious": "TheFastandtheFuriousJohnIreland1954goofyrip",
  "Captain Kidd": "CaptainKidd_",
  "Jungle Book": "JungleBook",
};

/** film → archive.org trailer item id */
const IA_TRAILERS: Record<string, string> = {
  "The General": "turner_video_18",
  "His Girl Friday": "his-girl-friday_20210811",
  "House on Haunted Hill": "sinema-trailer_house-on-haunted-hill",
  "Night of the Living Dead": "NightOfTheLivingDeadTrailer",
  "Carnival of Souls": "CarnivalOfSoulsTrailer",
  Detour: "movie-trailer-detour-1945-film-noir-cult-classic",
  Suddenly: "suddenly-1954-movie-trailer-frank-sinatra-sterling-hayden",
  "D.O.A.": "1950.-d.-o.-a.-trailer",
  "The Stranger": "turner_video_119",
  "The Last Man on Earth": "sinema-trailer_the-last-man-on-earth",
  "The Little Princess": "the-little-princess-1939-trailer",
  Nosferatu: "NosferatuRestorationTrailer",
  "Gulliver's Travels": "GulliversTravels1939Trailer",
  "The Brain That Wouldn't Die": "TheBrainThatWouldntDie_234",
  "Angel and the Badman": "turner_video_102103",
  "Made for Each Other": "made-for-each-other-1939-orignal-trailer-hq",
  "Assignment Outer Space": "turner_video_11629",
  "The Phantom Planet": "ThePhantomPlanetTrailer_201802",
  "Penny Serenade": "turner_video_80",
  "The Wasp Woman": "MovieTrailerTheWaspWoman1959",
  "Attack of the Giant Leeches": "attack_of_the_giant_leeches_trailer",
  "The Giant Gila Monster": "TheGiantGilaMonster-Trailer",
  "Teenagers from Outer Space": "TeenagersFromOuterSpaceTrailer",
  "Big Buck Bunny": "big-buck-bunny-trailer",
  "Elephants Dream": "Elephants_Dream_teaser_2",
  Sintel: "sintel-movie-trailer",
  Bataan: "BataanTrailer",
  "Wake Island": "WakeIslandTrailer",
  "Gung Ho!": "BugsBunny-WarBonds",
  "In Which We Serve": "turner_video_11519",
  "Blood on the Sun": "turner_video_11531",
  "Drums in the Deep South": "turner_video_11562",
  Zulu: "zulu_20211129",
  Metropolis: "MetropolisRestorationTrailer",
  "The Thief of Bagdad": "turner_video_11482",
  "The Mark of Zorro": "turner_video_17740",
  "The Lost World": "turner_video_11",
  "The Fast and the Furious": "turner_video_11577",
  "Captain Kidd": "captain-kidd-trailer",
  "Jungle Book": "jungle_book",
  "Mr. Bug Goes to Town": "turner_video_19103",
};

/** film → youtube video id (real trailer embeds) */
const YT_TRAILERS: Record<string, string> = {
  "The Phantom Carriage": "DUX2w7TFNHQ",
  "The Black Pirate": "vXaqaOepc-8",
  "Attack!": "_QG3kq0sRqE",
  "Tears of Steel": "RBv9xUdbUXE",
  "Cosmos Laundromat": "Y-rmzh0PI3c",
  "Agent 327": "kiMQdnr4TN0",
};

async function meta(identifier: string) {
  const r = await fetch(`https://archive.org/metadata/${identifier}`, { signal: AbortSignal.timeout(20000) });
  return r.json();
}

function pickBest(files: { name: string; format?: string; source?: string; length?: string; size?: string }[]) {
  const mp4s = files.filter(
    (f) =>
      /\.mp4$/i.test(f.name) &&
      !/sample/i.test(f.name) &&
      (!f.format || /h\.?264|MPEG4|480p|720p|1080p|web video/i.test(f.format)) &&
      (parseInt(String(f.size || "0"), 10) > 1_000_000 || !f.size)
  );
  const score = (f: (typeof mp4s)[number]) => {
    let s = 0;
    if (/512kb|720p|desktop|1500kb/i.test(f.name)) s += 3;
    if (/1080p|1608p/i.test(f.name)) s += 3;
    if (f.source === "original") s += 2;
    if (/\.ia\.mp4$/i.test(f.name)) s += 1; // IA transcode, reliably playable
    if (/256kb|144p|240p/i.test(f.name)) s -= 2;
    return s;
  };
  return mp4s.sort((a, b) => score(b) - score(a))[0];
}

async function rangeOk(url: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const r = await fetch(url, { headers: { Range: "bytes=0-2047" }, redirect: "follow", signal: AbortSignal.timeout(30000) });
    const ct = r.headers.get("content-type") || "";
    const body = await r.arrayBuffer();
    await r.body?.cancel().catch(() => {});
    const ok = (r.status === 200 || r.status === 206) && /video|octet-stream|mp4/i.test(ct) && body.byteLength > 0;
    return { ok, detail: `${r.status} ${ct} ${body.byteLength}B` };
  } catch (e) {
    return { ok: false, detail: "ERR " + (e as Error).message };
  }
}

const dl = (id: string, file: string) =>
  `https://archive.org/download/${id}/${file.split("/").map(encodeURIComponent).join("/")}`;

async function main() {
  const out: { films: Record<string, { id: string; file: string; secs: number }>; iaTrailers: Record<string, { id: string; file: string; secs: number }> } = {
    films: {},
    iaTrailers: {},
  };

  // 1) new films
  console.log("=== NEW FILMS ===");
  for (const [film, id] of Object.entries(NEW_FILMS)) {
    try {
      const m = await meta(id);
      if (!m.metadata || m.metadata["access-restricted-item"]) {
        console.log("RESTRICTED/MISSING", film, id);
        continue;
      }
      const f = pickBest(m.files || []);
      if (!f) {
        console.log("NO MP4", film, id);
        continue;
      }
      const secs = Math.round(parseFloat(String(f.length || "0")) || 0);
      out.films[film] = { id, file: f.name, secs };
      console.log("pick", film.padEnd(46), "|", id, "|", f.name.slice(0, 60), "|", secs + "s");
    } catch (e) {
      console.log("ERR", film, (e as Error).message);
    }
  }

  // 2) IA trailers
  console.log("=== IA TRAILERS ===");
  for (const [film, id] of Object.entries(IA_TRAILERS)) {
    try {
      const m = await meta(id);
      if (!m.metadata || m.metadata["access-restricted-item"]) {
        console.log("RESTRICTED/MISSING", film, id);
        continue;
      }
      const f = pickBest(m.files || []);
      if (!f) {
        console.log("NO MP4", film, id);
        continue;
      }
      const secs = Math.round(parseFloat(String(f.length || "0")) || 0);
      out.iaTrailers[film] = { id, file: f.name, secs };
      console.log("pick", film.padEnd(46), "|", id, "|", f.name.slice(0, 60), "|", secs + "s");
    } catch (e) {
      console.log("ERR", film, (e as Error).message);
    }
  }

  // 3) range checks
  console.log("=== RANGE CHECKS ===");
  let pass = 0;
  let fail = 0;
  const checkJobs: [string, string][] = [];
  for (const v of Object.values(out.films)) checkJobs.push([`film ${v.id}`, dl(v.id, v.file)]);
  for (const v of Object.values(out.iaTrailers)) checkJobs.push([`trailer ${v.id}`, dl(v.id, v.file)]);
  await Promise.all(
    checkJobs.map(async ([label, url]) => {
      const r = await rangeOk(url);
      if (r.ok) pass++;
      else {
        fail++;
        console.log("FAIL", label, "|", r.detail, "|", url.slice(0, 120));
      }
    })
  );
  console.log(`range checks: ${pass} ok, ${fail} failed`);

  // 4) youtube oembed checks
  console.log("=== YOUTUBE CHECKS ===");
  for (const [film, id] of Object.entries(YT_TRAILERS)) {
    try {
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}&format=json`, {
        signal: AbortSignal.timeout(15000),
      });
      const j = r.ok ? await r.json() : null;
      console.log(r.ok ? "ok  " : "FAIL", film.padEnd(24), id, "|", j ? String((j as { title: string }).title).slice(0, 65) : r.status);
    } catch (e) {
      console.log("FAIL", film, id, (e as Error).message);
    }
  }

  // 5) manual-review metadata
  for (const id of ["BugsBunny-WarBonds", "jungle_book", "turner_video_18", "turner_video_11482", "turner_video_11"]) {
    try {
      const m = await meta(id);
      const md = m.metadata || {};
      console.log("REVIEW", id, "| title:", String(md.title).slice(0, 50), "| desc:", String(md.description || "-").replace(/<[^>]+>/g, " ").slice(0, 140));
    } catch {}
  }

  writeFileSync("scripts/research/final-sources.json", JSON.stringify(out, null, 1));
  console.log("saved scripts/research/final-sources.json");
}

main();
