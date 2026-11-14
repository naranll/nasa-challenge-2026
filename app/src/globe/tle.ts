import { propagate, twoline2satrec } from "satellite.js";

/**
 * TLE checks and the satellites.json snapshot rules, shared by the browser and scripts/tle.
 * Only imports satellite.js, so Node can run it directly from scripts/tle (type stripping).
 */

/** Mod-10 checksum of a TLE line: digits count as their value, "-" counts as 1, the rest as 0. */
export function tleChecksumOk(line: string): boolean {
  if (line.length !== 69) return false;
  let sum = 0;
  for (const ch of line.slice(0, 68)) {
    if (ch >= "0" && ch <= "9") sum += Number(ch);
    else if (ch === "-") sum += 1;
  }
  return sum % 10 === Number(line[68]);
}

/** Everything wrong with a TLE pair for satellite `noradId` at time `at`. Empty = usable. */
export function validateTle(line1: string, line2: string, noradId: number, at: Date): string[] {
  const problems: string[] = [];
  for (const [n, line] of [[1, line1], [2, line2]] as const) {
    if (line.length !== 69 || !line.startsWith(`${n} `)) problems.push(`line ${n} is not a TLE line`);
    else if (!tleChecksumOk(line)) problems.push(`line ${n} checksum is wrong`);
  }
  if (problems.length > 0) return problems;

  const ids = [line1, line2].map((l) => Number(l.slice(2, 7)));
  if (ids.some((id) => id !== noradId)) problems.push(`catalog number ${ids[0]} is not ${noradId}`);

  const satrec = twoline2satrec(line1, line2);
  if (satrec.error !== 0) return [...problems, `SGP4 could not read the pair (error ${satrec.error})`];
  const pv = propagate(satrec, at);
  const p = pv?.position;
  if (!p || ![p.x, p.y, p.z].every(Number.isFinite)) problems.push(`SGP4 gives no position at ${at.toISOString()}`);
  return problems;
}

export interface TlePair {
  line1: string;
  line2: string;
}

/** Static facts about one platform. Every date and URL here must have a source. */
export interface PlatformMeta {
  id: string;
  norad_id: number;
  sensor: "MODIS" | "VIIRS";
  launch_date: string | null;
  launch_source_url: string | null;
  in_reference_chain: boolean;
  status_source_url: string | null;
}

export interface SnapshotConfig {
  tle_source: { name: string; url: string };
  platforms: PlatformMeta[];
}

export interface SatellitePlatform extends PlatformMeta {
  tle: TlePair & { epoch: string };
}

/** public/data/satellites.json (contracts/README.md). Orbits and static metadata only, no hotspot numbers. */
export interface SatellitesFile {
  schema_version: string;
  synthetic: boolean;
  generated_at: string;
  tle_source: { name: string; url: string };
  platforms: SatellitePlatform[];
}

export const SATELLITES_SCHEMA_VERSION = "0.1";
/** Older TLEs still draw, but the build warns (spec §5.5). */
export const TLE_WARN_AGE_DAYS = 7;
const DAY_MS = 86_400_000;
const JD_UNIX_EPOCH = 2440587.5;

/** The element lines from a CelesTrak FORMAT=TLE response (optional name line, CRLF or LF). */
export function parseCelestrakTle(text: string): TlePair | null {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd());
  const line1 = lines.find((l) => l.startsWith("1 "));
  const line2 = lines.find((l) => l.startsWith("2 "));
  return line1 && line2 ? { line1, line2 } : null;
}

/** The TLE epoch as a Date (from SGP4's Julian date). */
export function tleEpoch(line1: string, line2: string): Date {
  return new Date((twoline2satrec(line1, line2).jdsatepoch - JD_UNIX_EPOCH) * DAY_MS);
}

/** What is wrong with a parsed satellites.json. Empty = usable. `noradIds` = the platforms it must have. */
export function satellitesFileProblems(doc: unknown, at: Date, noradIds?: Record<string, number>): string[] {
  const d = doc as Partial<SatellitesFile> | null;
  if (typeof d !== "object" || d === null) return ["not a JSON object"];
  if (typeof d.schema_version !== "string") return ["missing schema_version"];
  if (!Array.isArray(d.platforms)) return ["missing platforms"];
  const problems: string[] = [];
  if (d.synthetic !== false) problems.push('must say "synthetic": false');
  for (const [id, norad] of Object.entries(noradIds ?? {})) {
    const p = d.platforms.find((x) => x?.id === id);
    if (!p?.tle) problems.push(`${id}: missing`);
    else problems.push(...validateTle(p.tle.line1, p.tle.line2, norad, at).map((m) => `${id}: ${m}`));
  }
  return problems;
}

export type SnapshotPlan =
  | { action: "write"; file: SatellitesFile; warnings: string[] }
  | { action: "keep"; warnings: string[] }
  | { action: "fail"; errors: string[] };

/**
 * Decide what scripts/tle does (spec §5.2, A22): all platforms new, or all kept.
 * `fetched` = TLE per platform id (null = that download failed); null overall = offline.
 */
export function planSnapshot(args: {
  config: SnapshotConfig;
  fetched: Record<string, TlePair | null> | null;
  existing: unknown;
  now: Date;
}): SnapshotPlan {
  const { config, fetched, existing, now } = args;
  const noradIds = Object.fromEntries(config.platforms.map((p) => [p.id, p.norad_id]));

  const problems: string[] = [];
  if (fetched === null) problems.push("offline: nothing downloaded");
  else {
    for (const p of config.platforms) {
      const tle = fetched[p.id];
      if (!tle) problems.push(`${p.id}: download failed`);
      else problems.push(...validateTle(tle.line1, tle.line2, p.norad_id, now).map((m) => `${p.id}: ${m}`));
    }
  }

  if (problems.length === 0 && fetched) {
    const platforms = config.platforms.map((p) => {
      const { line1, line2 } = fetched[p.id]!;
      return { ...p, tle: { line1, line2, epoch: tleEpoch(line1, line2).toISOString() } };
    });
    const warnings = platforms
      .filter((p) => now.getTime() - Date.parse(p.tle.epoch) > TLE_WARN_AGE_DAYS * DAY_MS)
      .map((p) => `${p.id}: TLE epoch ${p.tle.epoch} is more than ${TLE_WARN_AGE_DAYS} days old`);
    const file: SatellitesFile = {
      schema_version: SATELLITES_SCHEMA_VERSION,
      synthetic: false,
      generated_at: now.toISOString(),
      tle_source: config.tle_source,
      platforms,
    };
    return { action: "write", file, warnings };
  }

  const existingProblems = existing == null ? ["no existing file"] : satellitesFileProblems(existing, now, noradIds);
  if (existingProblems.length === 0) {
    return { action: "keep", warnings: [...problems, "kept the existing satellites.json unchanged"] };
  }
  return { action: "fail", errors: [...problems, ...existingProblems.map((m) => `existing file: ${m}`)] };
}
