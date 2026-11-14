/**
 * Build-time TLE snapshot (spec §5.2). Downloads the 5 platforms' TLEs from CelesTrak once,
 * checks them, and writes public/data/satellites.json. The browser never calls CelesTrak.
 *
 *   node scripts/tle/fetch_tle.ts            # download, check, write (all or nothing)
 *   node scripts/tle/fetch_tle.ts --offline  # no network: check the existing file only
 *
 * Exit 0 when a valid file exists afterwards (new or kept), 1 otherwise.
 * Also writes fixtures/satellites.json: the same real orbits, marked "synthetic": true
 * because everything in fixtures/ must be (fixtures/check_fixtures.py), so mock-mode dev sees orbits.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCelestrakTle, planSnapshot, type SnapshotConfig, type TlePair } from "../../app/src/globe/tle.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..");
const OUT = join(repo, "public", "data", "satellites.json");
const FIXTURE = join(repo, "fixtures", "satellites.json");
const config = JSON.parse(readFileSync(join(here, "platforms.json"), "utf8")) as SnapshotConfig;

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/** Write via a temp file + rename, so a half-written file never exists. */
function writeAtomic(path: string, doc: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(doc, null, 1)}\n`, "utf8");
  renameSync(tmp, path);
}

async function download(): Promise<Record<string, TlePair | null>> {
  const out: Record<string, TlePair | null> = {};
  for (const p of config.platforms) {
    // One request at a time, to be gentle with CelesTrak. Generic User-Agent, no key.
    const url = `${config.tle_source.url}?CATNR=${p.norad_id}&FORMAT=TLE`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "hotspot-harmonization-tle-snapshot" } });
      out[p.id] = res.ok ? parseCelestrakTle(await res.text()) : null;
      if (!res.ok) console.warn(`${p.id}: HTTP ${res.status}`);
    } catch (e) {
      console.warn(`${p.id}: ${(e as Error).message}`);
      out[p.id] = null;
    }
  }
  return out;
}

const offline = process.argv.includes("--offline");
const fetched = offline ? null : await download();
const plan = planSnapshot({ config, fetched, existing: existsSync(OUT) ? readJson(OUT) : null, now: new Date() });

if (plan.action === "fail") {
  for (const e of plan.errors) console.error(`error: ${e}`);
  process.exit(1);
}
for (const w of plan.warnings) console.warn(`warning: ${w}`);
if (plan.action === "write") {
  writeAtomic(OUT, plan.file);
  console.log(`wrote ${OUT} (${plan.file.platforms.length} platforms)`);
}
const current = readJson(OUT) as object;
writeAtomic(FIXTURE, { ...current, synthetic: true });
console.log(`wrote ${FIXTURE} (same orbits, "synthetic": true)`);
