/** TypeScript shapes for contracts/README.md. Add fields as owners add them (additive-only). */

export interface Region {
  region_id: string;
  name_en: string;
  name_mn: string;
  kind: "country" | "aimag" | "capital";
}

export interface RegionsFile {
  schema_version: string;
  synthetic: boolean;
  regions: Region[];
}

export type PlatformKey = "terra" | "aqua" | "snpp" | "noaa20" | "noaa21";
/** The platforms in the reference chain (PLAN D3). */
export type ChainPlatform = "aqua" | "snpp" | "noaa20";

/** One month of calendar/{region_id}.json. null = unknown, never 0. */
export interface CalendarMonth {
  ym: string;
  harmonized: number | null;
  chain_platform: ChainPlatform;
  raw: Partial<Record<PlatformKey, number | null>>;
  baseline?: { median: number | null; p25: number | null; p75: number | null } | null;
  is_forecast: boolean;
  flags: string[];
}

export interface CalendarFile {
  schema_version: string;
  synthetic: boolean;
  region_id: string;
  unit: string;
  reference_years: [number, number];
  months: CalendarMonth[];
}

interface HexCellBase {
  id: string;
  lat: number;
  lon: number;
}

/** hex_year/raw.json: each platform's own count per year, aligned to `years`. */
export interface HexYearRawFile {
  schema_version: string;
  synthetic: boolean;
  resolution: number;
  kind: "raw_pixels";
  years: number[];
  cells: (HexCellBase & { counts: Partial<Record<PlatformKey, (number | null)[]>> })[];
}

/** hex_year/harm.json: one harmonized count per year, aligned to `years`. */
export interface HexYearHarmFile {
  schema_version: string;
  synthetic: boolean;
  resolution: number;
  kind: "aqua_equivalent";
  years: number[];
  cells: (HexCellBase & { counts: (number | null)[] })[];
}

/** validation.json (PLAN D10). */
export interface ValidationTest {
  id: string;
  name_en?: string;
  metric: string;
  value: number | null;
  baseline_value?: number | null;
  per_year?: { year: number; wape: number | null }[];
  note?: string;
}

export interface ValidationFile {
  schema_version: string;
  synthetic: boolean;
  tests: ValidationTest[];
  limitations?: string[];
}

