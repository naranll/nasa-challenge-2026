/** Turns the harmonization data files into what the Harmonizing page shows. Every number comes from a file. */
import type {
  CalendarFile,
  ChainPlatform,
  HexYearHarmFile,
  HexYearRawFile,
  ValidationFile,
  ValidationTest,
} from "../data/contracts";

/**
 * For each year, the reference-chain platform (PLAN D3) that counts most of that year's observed months,
 * read from the calendar's `chain_platform`. A year's raw globe shows this platform's own count.
 */
export function chainPlatformByYear(calendar: CalendarFile): Map<number, ChainPlatform> {
  const tally = new Map<number, Map<ChainPlatform, number>>();
  for (const m of calendar.months) {
    if (m.is_forecast) continue;
    const year = Number(m.ym.slice(0, 4));
    const byPlatform = tally.get(year) ?? new Map<ChainPlatform, number>();
    byPlatform.set(m.chain_platform, (byPlatform.get(m.chain_platform) ?? 0) + 1);
    tally.set(year, byPlatform);
  }
  const out = new Map<number, ChainPlatform>();
  for (const [year, byPlatform] of [...tally].sort(([a], [b]) => a - b)) {
    out.set(year, [...byPlatform].reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0]);
  }
  return out;
}

/** A year where a new platform takes over counting. */
export interface Handover {
  year: number;
  platform: ChainPlatform;
}

/** Years where a new platform takes over counting (the first platform is not a handover). */
export function handovers(chain: Map<number, ChainPlatform>): Handover[] {
  const out: Handover[] = [];
  let prev: ChainPlatform | null = null;
  for (const [year, platform] of [...chain].sort(([a], [b]) => a - b)) {
    if (prev !== null && platform !== prev) out.push({ year, platform });
    prev = platform;
  }
  return out;
}

export interface GlobeCell {
  id: string;
  lat: number;
  lon: number;
  /** Per year (aligned to GlobeYears.years). null = unknown, drawn as nothing, never as 0. */
  raw: (number | null)[];
  harm: (number | null)[];
}

export interface GlobeYears {
  years: number[];
  cells: GlobeCell[];
  /** All cells summed per year; null when no cell has a value that year. */
  totals: { raw: (number | null)[]; harm: (number | null)[] };
  /** The largest single cell-year on either globe: both globes use this one scale (PLAN D12). */
  max: number;
}

function sumKnown(values: (number | null)[]): number | null {
  const known = values.filter((v): v is number => typeof v === "number");
  return known.length === 0 ? null : known.reduce((a, b) => a + b, 0);
}

/** Raw (chain platform's own count, VIIRS = raw pixels) and harmonized counts per hexagon per year. */
export function globeYears(raw: HexYearRawFile, harm: HexYearHarmFile, chain: Map<number, ChainPlatform>): GlobeYears {
  const years = raw.years;
  const harmById = new Map(harm.cells.map((c) => [c.id, c.counts]));
  const harmIndex = new Map(harm.years.map((y, i) => [y, i]));
  const cells = raw.cells.map((c): GlobeCell => {
    const h = harmById.get(c.id);
    return {
      id: c.id,
      lat: c.lat,
      lon: c.lon,
      raw: years.map((y, i) => {
        const platform = chain.get(y);
        return platform ? (c.counts[platform]?.[i] ?? null) : null;
      }),
      harm: years.map((y) => {
        const j = harmIndex.get(y);
        return h && j !== undefined ? (h[j] ?? null) : null;
      }),
    };
  });
  const column = (side: "raw" | "harm", i: number) => cells.map((c) => c[side][i]);
  const all = cells.flatMap((c) => [...c.raw, ...c.harm]).filter((v): v is number => typeof v === "number");
  return {
    years,
    cells,
    totals: { raw: years.map((_, i) => sumKnown(column("raw", i))), harm: years.map((_, i) => sumKnown(column("harm", i))) },
    max: all.length ? Math.max(...all) : 0,
  };
}

/** "3 satellites · 23 years · N hotspots become one series" + the Aqua rebuild error (PLAN D12). */
export interface ResultLine {
  satellites: number | null;
  years: number | null;
  hotspots: number | null;
  wape: number | null;
}

/** The Aqua rebuild test (PLAN D10.1), the headline proof. */
export const AQUA_REBUILD_TEST = "aqua_loyo";

const findTest = (validation: ValidationFile | null, id: string): ValidationTest | null =>
  validation?.tests?.find((t) => t.id === id) ?? null;

const MONTHS_PER_YEAR = 12;

/**
 * Satellites = chain platforms in the observed series; years = calendar years with all months observed;
 * hotspots = each observed month's counting platform's own count, summed (what becomes the one series, D3).
 */
export function resultLine(calendar: CalendarFile | null, validation: ValidationFile | null): ResultLine {
  const observed = calendar?.months.filter((m) => !m.is_forecast && m.harmonized !== null) ?? null;
  const own = observed?.map((m) => m.raw?.[m.chain_platform]).filter((v): v is number => typeof v === "number") ?? [];
  const perYear = new Map<string, number>();
  for (const m of observed ?? []) perYear.set(m.ym.slice(0, 4), (perYear.get(m.ym.slice(0, 4)) ?? 0) + 1);
  return {
    satellites: observed ? new Set(observed.map((m) => m.chain_platform)).size : null,
    years: observed ? [...perYear.values()].filter((n) => n === MONTHS_PER_YEAR).length : null,
    hotspots: own.length ? own.reduce((a, b) => a + b, 0) : null,
    wape: findTest(validation, AQUA_REBUILD_TEST)?.value ?? null,
  };
}

export type MethodTestKey = "aqua_rebuild" | "forward" | "one_ratio" | "noaa20_ratio";

export interface MethodTestRow {
  key: MethodTestKey;
  metric: string | null;
  value: number | null;
  /** one_ratio only: the monthly ratios' error on the same test, to compare against. */
  compareTo: number | null;
}

/** The four validation results of the Method section (PLAN D10, D13), in order. */
export function methodTests(validation: ValidationFile | null): MethodTestRow[] {
  const loyo = findTest(validation, AQUA_REBUILD_TEST);
  const row = (key: MethodTestKey, test: ValidationTest | null, value = test?.value ?? null, compareTo: number | null = null) => ({
    key,
    metric: test?.metric ?? null,
    value,
    compareTo: value === null ? null : compareTo,
  });
  return [
    row("aqua_rebuild", loyo),
    row("forward", findTest(validation, "aqua_forward")),
    row("one_ratio", loyo, loyo?.baseline_value ?? null, loyo?.value ?? null),
    row("noaa20_ratio", findTest(validation, "r2_loyo")),
  ];
}
