/**
 * CLI entry: seed the database (`npm run db:seed` / `npm run db:reset`).
 * Catalog and seed() live in `lib/seed.ts` so the app can auto-seed on boot.
 */
import { seed } from "../lib/seed.ts";

seed();
