import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.NEBULA_DATA_DIR ?? path.join(process.cwd(), "data");
for (const suffix of ["", "-wal", "-shm"]) {
  const p = path.join(dataDir, `nebula.db${suffix}`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
console.log("Database deleted. Seeding fresh…");

const { seed } = await import("../lib/seed.ts");
seed();
