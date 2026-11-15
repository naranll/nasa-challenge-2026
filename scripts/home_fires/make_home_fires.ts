/**
 * Writes the home globe's hotspot file from the world map's per-continent points files:
 *
 *   node scripts/home_fires/make_home_fires.ts
 *
 *   public/data/world/points_*.json  ->  public/data/home_fires.json   (real)
 *   fixtures/world/points_*.json     ->  fixtures/home_fires.json      (SYNTHETIC, for VITE_MOCK=true)
 *
 * Re-run after etl/build_world_map.py. Exit 1 if a source folder is missing or empty.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildHomeFires, type Ring } from "../../app/src/orbital/data/homeFiresBuild.ts";
import type { WorldPointsFile } from "../../app/src/data/contracts.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..");
/** Every 21st of ~1.2 M world hotspots ≈ 57 000, plus all of Mongolia's. */
const EVERY = 21;

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;

interface Outline {
  features: { geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown } }[];
}
const outline = readJson<Outline>(join(repo, "app", "src", "globe", "assets", "mongolia.json"));
const mongolia: Ring[] = outline.features.flatMap(({ geometry: g }) =>
  g.type === "Polygon" ? (g.coordinates as Ring[]) : (g.coordinates as Ring[][]).flat(),
);

function build(dataDir: string, out: string, synthetic: boolean): boolean {
  const indexPath = join(dataDir, "world", "index.json");
  if (!existsSync(indexPath)) {
    console.error(`missing ${indexPath}`);
    return false;
  }
  const index = readJson<{ continents: { points_file: string }[] }>(indexPath);
  const files = index.continents.map((c) => readJson<WorldPointsFile>(join(dataDir, "world", c.points_file)));
  if (files.length === 0) {
    console.error(`no points files listed in ${indexPath}`);
    return false;
  }
  const doc = buildHomeFires(files, mongolia, EVERY, synthetic);
  writeFileSync(out, JSON.stringify(doc));
  const mn = doc.columns.mn.reduce<number>((a, b) => a + b, 0);
  console.log(`${out}: ${doc.n} of ${doc.source_n} hotspots (${mn} in Mongolia), ${doc.period.start} – ${doc.period.end}`);
  return true;
}

const ok = [
  build(join(repo, "public", "data"), join(repo, "public", "data", "home_fires.json"), false),
  build(join(repo, "fixtures"), join(repo, "fixtures", "home_fires.json"), true),
].every(Boolean);
process.exit(ok ? 0 : 1);
