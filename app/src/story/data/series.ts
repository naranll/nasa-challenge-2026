/** Yearly series for the persistent chart. Built only from the calendar file's monthly counts; no numbers typed in. */
import { yearlySeries, type CalendarFile, type YearPoint } from "../../globe/homeData";
import type { PlatformId } from "../../globe/platforms";

type Month = CalendarFile["months"][number];

/** calendar/{region}.json, the fields the story reads (contracts/README.md). */
export interface StoryCalendar extends Omit<CalendarFile, "months"> {
  unit?: string;
  months: (Month & { harmonized?: number | null })[];
}

export interface YearSeries {
  raw: Record<PlatformId, YearPoint[]>;
  harmonized: YearPoint[];
  /** First and last year with any data, or null when the file has none. */
  years: [number, number] | null;
}

const MONTHS_PER_YEAR = 12;

/** Harmonized (Aqua-equivalent) count per year. A month with null/no value is skipped, never counted as 0. */
export function harmonizedYearly(cal: StoryCalendar): YearPoint[] {
  const byYear = new Map<number, { count: number; months: number }>();
  for (const m of cal.months) {
    if (m.is_forecast || typeof m.harmonized !== "number") continue;
    const year = Number(m.ym.slice(0, 4));
    const acc = byYear.get(year) ?? { count: 0, months: 0 };
    byYear.set(year, { count: acc.count + m.harmonized, months: acc.months + 1 });
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, { count, months }]) => ({ year, count, partial: months < MONTHS_PER_YEAR }));
}

export function buildSeries(cal: StoryCalendar): YearSeries {
  const raw = yearlySeries(cal);
  const harmonized = harmonizedYearly(cal);
  const all = [...Object.values(raw).flat(), ...harmonized].map((p) => p.year);
  return { raw, harmonized, years: all.length ? [Math.min(...all), Math.max(...all)] : null };
}

/** Points up to `limit` (a fractional year). The segment that crosses the limit is cut, so a line grows smoothly. */
export function clipSeries(points: YearPoint[], limit: number): { year: number; count: number; partial: boolean }[] {
  const out: { year: number; count: number; partial: boolean }[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.year <= limit) {
      out.push(p);
      continue;
    }
    const prev = points[i - 1];
    if (prev && prev.year < limit) {
      const t = (limit - prev.year) / (p.year - prev.year);
      out.push({ year: limit, count: prev.count + (p.count - prev.count) * t, partial: true });
    }
    break;
  }
  return out;
}
