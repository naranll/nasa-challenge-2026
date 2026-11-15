/**
 * Raw numbers for the Harmonizing page (Job 4), read from calendar/{region}.json and pipeline_stats.json.
 * No numbers are made here: we only sum and pick from the pipeline's files. null = unknown, never 0.
 */
import type { CalendarFile, PipelineStats } from "../globe/homeData";
import { PLATFORM_IDS, type PlatformId } from "../globe/platforms";

export interface MonthPoint {
  ym: string;
  count: number;
}

/** Each platform's raw monthly counts, in month order. Months the platform has no number for are left out. */
export function monthlySeries(calendar: CalendarFile): Record<PlatformId, MonthPoint[]> {
  const months = calendar.months.filter((m) => !m.is_forecast).sort((a, b) => a.ym.localeCompare(b.ym));
  const out = {} as Record<PlatformId, MonthPoint[]>;
  for (const id of PLATFORM_IDS) {
    out[id] = months.flatMap((m) => {
      const v = m.raw?.[id];
      return typeof v === "number" ? [{ ym: m.ym, count: v }] : [];
    });
  }
  return out;
}

export interface RegionSummary {
  /** Sum of every platform's raw count; each satellite's detections count separately. */
  total: number;
  /** First and last month with at least one hotspot; null when there are none. */
  firstYm: string | null;
  lastYm: string | null;
}

export function regionSummary(series: Record<PlatformId, MonthPoint[]>): RegionSummary {
  let total = 0;
  let firstYm: string | null = null;
  let lastYm: string | null = null;
  for (const id of PLATFORM_IDS) {
    for (const p of series[id]) {
      if (p.count <= 0) continue;
      total += p.count;
      if (firstYm === null || p.ym < firstYm) firstYm = p.ym;
      if (lastYm === null || p.ym > lastYm) lastYm = p.ym;
    }
  }
  return { total, firstYm, lastYm };
}

/** First month a VIIRS platform has a number: where the raw jump starts. Taken from the data, not typed in. */
export function viirsStart(series: Record<PlatformId, MonthPoint[]>): string | null {
  const firsts = (["snpp", "noaa20", "noaa21"] as const).map((id) => series[id][0]?.ym).filter((ym): ym is string => !!ym);
  return firsts.length ? firsts.sort()[0] : null;
}

export interface SatelliteRow {
  id: PlatformId;
  rows: number | null;
  firstYear: number | null;
  lastYear: number | null;
}

const yearOf = (iso: string | null | undefined) => (iso ? Number(iso.slice(0, 4)) : null);

export function satelliteRows(stats: PipelineStats): SatelliteRow[] {
  return PLATFORM_IDS.map((id) => {
    const rows = stats.rows_by_platform?.[id];
    return {
      id,
      rows: typeof rows === "number" ? rows : null,
      firstYear: yearOf(stats.first_detection?.[id]),
      lastYear: yearOf(stats.last_detection?.[id]),
    };
  });
}
