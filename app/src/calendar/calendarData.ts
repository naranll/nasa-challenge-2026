/** The calendar heatmap's cells (PLAN §4 Calendar): rows = years, columns = months. */
import type { CalendarFile, ChainPlatform } from "../data/contracts";

/** Raw view = each month's chain platform's own count (D2); Harmonized = Aqua-equivalent count. */
export type CalendarView = "raw" | "harmonized";

export interface CalendarCell {
  ym: string;
  /** null = unknown (not in the file, not observed yet): drawn empty, never as 0. */
  value: number | null;
  platform: ChainPlatform | null;
  inFile: boolean;
  forecast: boolean;
  /** Counted from NOAA-20 (flag `noaa20_derived`): drawn with a dashed edge. */
  noaa20Derived: boolean;
  partialMonth: boolean;
}

export interface CalendarRow {
  year: number;
  cells: CalendarCell[];
}

const MONTHS = 12;

export function calendarGrid(calendar: CalendarFile, view: CalendarView): CalendarRow[] {
  const byYm = new Map(calendar.months.map((m) => [m.ym, m]));
  const years = [...new Set(calendar.months.map((m) => Number(m.ym.slice(0, 4))))].sort((a, b) => a - b);
  return years.map((year) => ({
    year,
    cells: Array.from({ length: MONTHS }, (_, i): CalendarCell => {
      const ym = `${year}-${String(i + 1).padStart(2, "0")}`;
      const m = byYm.get(ym);
      if (!m) return { ym, value: null, platform: null, inFile: false, forecast: false, noaa20Derived: false, partialMonth: false };
      const value = view === "harmonized" ? m.harmonized : (m.raw?.[m.chain_platform] ?? null);
      return {
        ym,
        value: typeof value === "number" ? value : null,
        platform: m.chain_platform,
        inFile: true,
        forecast: m.is_forecast,
        noaa20Derived: m.flags.includes("noaa20_derived"),
        partialMonth: m.flags.includes("partial_month"),
      };
    }),
  }));
}

/** The largest known value in any of the grids: side-by-side calendars share one colour scale. */
export function sharedMax(grids: CalendarRow[][]): number {
  let max = 0;
  for (const g of grids) for (const r of g) for (const c of r.cells) if (c.value !== null && c.value > max) max = c.value;
  return max;
}
