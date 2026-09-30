/**
 * Research probe: modern (2016-2026) open-license film candidates.
 * One-off research tool (see README "research tools" note).
 *
 * Pools:
 *  - DVIDS / Department of Defense uploads (US Gov public domain) — modern military/combat
 *  - NASA mission animations (public domain) — modern 3D CG
 *  - Missing Blender open movies (Coffee Run, Project Gold)
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function search(q: string, rows = 40): Promise<{ identifier: string; title: string; year: string; licenseurl: string; downloads: number }[]> {
  const url =
    "https://archive.org/services/search/v1/scrape?q=" +
    encodeURIComponent(q) +
    "&fields=identifier,title,year,licenseurl,downloads&count=100";
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 30000);
  try {
    const r = await fetch(url, { signal: c.signal });
    clearTimeout(t);
    const j = (await r.json()) as { items?: { identifier: string; title?: string; year?: string; licenseurl?: string; downloads?: string }[] };
    return (j.items ?? []).map((d) => ({
      identifier: d.identifier,
      title: d.title ?? "",
      year: d.year ?? "",
      licenseurl: d.licenseurl ?? "",
      downloads: Number(d.downloads ?? 0),
    }));
  } catch (e) {
    clearTimeout(t);
    console.log("SEARCH ERR", q.slice(0, 60), (e as Error).message);
    return [];
  }
}

async function meta(id: string): Promise<string> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 20000);
    const r = await fetch("https://archive.org/metadata/" + id, { signal: c.signal });
    clearTimeout(t);
    const j = (await r.json()) as {
      metadata?: { identifier?: string; title?: string; year?: string; date?: string; licenseurl?: string };
      files?: { name?: string; format?: string; length?: string }[];
    };
    const m = j.metadata;
    if (!m || !m.identifier) return `${id} | MISSING`;
    const vids = (j.files ?? []).filter((f) => /\.(mp4|m4v|webm|ogv)$/i.test(f.name ?? ""));
    const best = vids.sort((a, b) => (Number(b.length ?? 0) || 0) - (Number(a.length ?? 0) || 0))[0];
    return `${id} | ${(m.title ?? "").slice(0, 50)} | ${m.year ?? m.date ?? ""} | ${(m.licenseurl ?? "nolic").slice(0, 50)} | ${vids.length}v | best=${best?.name ?? "-"} len=${best?.length ?? "-"}`;
  } catch (e) {
    return `${id} | ERR ${(e as Error).message}`;
  }
}

async function main() {
  const queries = [
    'mediatype:movies AND (creator:DVIDS OR creator:"Department of Defense") AND year:[2016 TO 2026]',
    'mediatype:movies AND (collection:dvidsmilitary OR subject:dvids) AND year:[2016 TO 2026]',
    'mediatype:movies AND title:(dvids) AND year:[2016 TO 2026]',
    'mediatype:movies AND creator:NASA AND year:[2016 TO 2026] AND title:(animation OR animated OR mission)',
    '(identifier:*coffee-run* OR identifier:*coffee_run* OR identifier:*project-gold* OR identifier:*projectgold*) AND mediatype:movies',
  ];
  const seen = new Set<string>();
  for (const q of queries) {
    console.log("\n### " + q.slice(0, 80));
    const res = await search(q, 40);
    for (const d of res) {
      if (seen.has(d.identifier)) continue;
      seen.add(d.identifier);
      console.log(`  ${d.identifier} | ${d.title.slice(0, 55)} | ${d.year} | ${d.downloads} | ${(d.licenseurl || "nolic").slice(0, 48)}`);
    }
    await sleep(4000);
  }
  console.log("\n### total unique: " + seen.size);
}

await main();

export {};
