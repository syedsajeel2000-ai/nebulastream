/**
 * Verified archive.org sources — MODERN catalog (films released 2016–2026 only).
 * Checked via the archive.org metadata API + ranged GETs (206, video/mp4) at seed time.
 *
 * Licensing (CWI §43): every title is open-licensed —
 *  - Blender Studio open movies (CC BY / CC BY-ND / CC BY-SA)
 *  - NASA mission animations (public domain, US-Government work / CC0)
 *  - Declassified military documentary (CC BY-ND, rights-holder upload)
 */

export const ARCHIVE_BASE = "https://archive.org/download";

/** Modern film sources: { slug → [identifier, file, durationSeconds, license] } */
export const MODERN_SOURCES: Record<string, { id: string; file: string; secs: number; license: string }> = {
  /* --- Blender Studio open movies (CC) --- */
  "caminandes-llamigos": {
    id: "CaminandesLlamigos",
    file: "Caminandes_ Llamigos-1080p.mp4",
    secs: 150,
    license: "CC BY 3.0",
  },
  "agent-327": {
    id: "agent-327-operation-barbershop",
    file: "Agent 327 Operation Barbershop.mp4",
    secs: 232,
    license: "CC BY-ND 4.0",
  },
  hero: { id: "hero_20260106", file: "hero.mp4", secs: 237, license: "CC BY 4.0" },
  spring: { id: "spring_blenderopenmovie", file: "Spring - Blender Open Movie - YouTube.mp4", secs: 464, license: "CC BY 4.0" },
  "coffee-run": { id: "coffee-run", file: "Coffee Run.mp4", secs: 185, license: "CC BY-ND 4.0" },
  "sprite-fright": { id: "sprite-fright-2021", file: "Sprite Fright (2021).mp4", secs: 630, license: "CC BY 4.0" },
  charge: { id: "charge-blender-open-movie-1608p", file: "Charge - Blender Open Movie 1608p.mp4", secs: 263, license: "CC BY 4.0" },
  "wing-it": { id: "wing_it", file: "wing_it.mp4", secs: 238, license: "CC BY 4.0" },
  singularity: { id: "singularity_202608", file: "Singularity.mp4", secs: 99, license: "CC BY-SA 4.0" },

  /* --- NASA 3D mission animations (public domain / CC0) --- */
  "demo-2": {
    id: "NASA_SpaceX_Demo-2_Mission_Animation",
    file: "SPX09_CommercialCrew_MASTER.mp4",
    secs: 180,
    license: "CC0 / Public Domain",
  },
  psyche: {
    id: "nasa-psyche-mission-charting-a-metallic-world",
    file: "NASA Psyche Mission Charting a Metallic World.mp4",
    secs: 149,
    license: "Public Domain",
  },
  capstone: {
    id: "nasas-capstone-flying-a-new-path-to-the-moon",
    file: "NASA's CAPSTONE Flying a New Path to the Moon.mp4",
    secs: 131,
    license: "Public Domain",
  },
  "artemis-ltv": {
    id: "nasa_tv-NASA_Artemis_Lunar_Terrain_Vehicle_Official_NASA_Trailer",
    file: "NASA_Artemis_Lunar_Terrain_Vehicle_Official_NASA_Trailer.mp4",
    secs: 91,
    license: "Public Domain",
  },
  "artemis-ii": {
    id: "nasa_tv-Artemis_II_to_the_Moon_-_Launch_to_Splashdown_NASA_Mission_Animation",
    file: "Artemis_II_to_the_Moon_-_Launch_to_Splashdown_NASA_Mission_Animation.mp4",
    secs: 465,
    license: "Public Domain",
  },

  /* --- Declassified military documentary (modern combat history, CC) --- */
  "tsar-bomba": {
    id: "tsar-bomba-official-full-video",
    file: "50_Megaton_Tsar_Bomb...n_Bomb.mp4",
    secs: 2429,
    license: "CC BY-ND 4.0",
  },
};

/** Official trailer/teaser uploads on YouTube (oEmbed-verified, rights-holder channels), keyed by catalog title. */
export const YT_TRAILERS: Record<string, string> = {
  "Caminandes: Llamigos": "SkVqJ1SGeL0", // Blender (official channel)
  Spring: "WhWc3b3KhnY", // Blender Studio (official channel)
  "Sprite Fright": "_cMxraX_5RE", // Blender Studio (official channel)
  Charge: "UXqq0ZvbOnk", // Blender Studio (official channel)
  "Wing It!": "u9lj-c29dxI", // Blender Studio (official channel)
  "Coffee Run": "PVGeM40dABA", // Blender Studio (official channel)
};

/** Titles with no standalone trailer: a ~90s highlight window [startSec, endSec] onto the film itself. */
export const WINDOW_TRAILERS: Record<string, [number, number]> = {
  Hero: [30, 120],
  Singularity: [8, 95],
  "Agent 327: Operation Barbershop": [20, 110],
  "NASA SpaceX Demo-2 Mission Animation": [15, 105],
  "NASA Psyche Mission: Charting a Metallic World": [10, 100],
  "NASA's CAPSTONE: Flying a New Path to the Moon": [8, 98],
  "NASA Artemis Lunar Terrain Vehicle": [5, 91],
  "Artemis II to the Moon: Launch to Splashdown": [40, 130],
  "Tsar Bomba: Declassified": [120, 210],
};

/** Best trailer URL for a title: official YouTube trailer → highlight window → the film itself. */
export function trailerFor(title: string, video: string): string {
  const yt = YT_TRAILERS[title];
  if (yt) return `https://www.youtube.com/watch?v=${yt}`;
  const w = WINDOW_TRAILERS[title];
  if (w) return `${video}#t=${w[0]},${w[1]}`;
  return video;
}

export function archiveUrl(id: string, file: string): string {
  return `${ARCHIVE_BASE}/${encodeURIComponent(id)}/${file.split("/").map(encodeURIComponent).join("/")}`;
}
