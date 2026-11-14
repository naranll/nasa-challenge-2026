/**
 * Turns pipeline output (Job 2) into what the hover card and infographics show.
 * Every number comes from these files; missing or null means unknown and is hidden, never 0.
 */
import { PLATFORM_IDS, type PlatformId } from "./platforms";

type PerPlatform<T> = Partial<Record<PlatformId, T | null>>;

/** pipeline_stats.json (contracts/README.md). */
export interface PipelineStats {
  schema_version: string;
  synthetic: boolean;
  rows_by_platform: PerPlatform<number>;
  first_detection: PerPlatform<string>;
  last_detection: PerPlatform<string>;
  n_hotspots_total?: number | null;
  years_covered?: [number, number] | null;
}

/** calendar/{region}.json, only the fields the home page reads. */
export interface CalendarFile {
  schema_version: string;
  synthetic: boolean;
  region_id: string;
  months: { ym: string; raw: PerPlatform<number>; is_forecast?: boolean }[];
}

export interface CardStats {
  first: string | null;
  last: string | null;
  count: number | null;
  /** The file confirms 0 rows for this platform (spec §6.3, A33). */
  notInData: boolean;
}

export function cardStats(stats: PipelineStats | null, id: PlatformId): CardStats {
  const count = stats?.rows_by_platform?.[id];
  if (count === 0) return { first: null, last: null, count: null, notInData: true };
  return {
    first: stats?.first_detection?.[id] ?? null,
    last: stats?.last_detection?.[id] ?? null,
    count: typeof count === "number" ? count : null,
    notInData: false,
  };
}

export interface YearPoint {
  year: number;
  count: number;
  /** Fewer than 12 months with a known count for this platform (e.g. 2002, 2026, launch years). */
  partial: boolean;
}

const MONTHS_PER_YEAR = 12;

/** Raw hotspots per platform per year, summed from the calendar's monthly raw counts. */
export function yearlySeries(calendar: CalendarFile): Record<PlatformId, YearPoint[]> {
  const out = {} as Record<PlatformId, YearPoint[]>;
  for (const id of PLATFORM_IDS) {
    const byYear = new Map<number, { count: number; months: number }>();
    for (const m of calendar.months) {
      const v = m.raw?.[id];
      if (m.is_forecast || typeof v !== "number") continue;
      const year = Number(m.ym.slice(0, 4));
      const acc = byYear.get(year) ?? { count: 0, months: 0 };
      byYear.set(year, { count: acc.count + v, months: acc.months + 1 });
    }
    out[id] = [...byYear.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, { count, months }]) => ({ year, count, partial: months < MONTHS_PER_YEAR }));
  }
  return out;
}

export interface TimelineRow {
  id: PlatformId;
  first: string;
  last: string;
  stopped: boolean;
}

/**
 * A platform counts as stopped when its last hotspot is more than this many days older than the
 * newest hotspot of any platform. Measured against the data, not today, so a demo on a later day
 * does not mark everyone stopped. (S-NPP: 12 days in the real data; the others: ≤ 3.)
 */
export const STOPPED_GAP_DAYS = 10;
const DAY_MS = 86_400_000;

export function sensorTimeline(stats: PipelineStats | null): TimelineRow[] {
  if (!stats) return [];
  const rows = PLATFORM_IDS.flatMap((id) => {
    const first = stats.first_detection?.[id];
    const last = stats.last_detection?.[id];
    return first && last ? [{ id, first, last }] : [];
  });
  const newest = Math.max(...rows.map((r) => Date.parse(r.last)));
  return rows.map((r) => ({ ...r, stopped: newest - Date.parse(r.last) > STOPPED_GAP_DAYS * DAY_MS }));
}
