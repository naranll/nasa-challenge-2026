/** TypeScript shapes for contracts/README.md. Add fields as owners add them (additive-only). */

export interface Region {
  region_id: string;
  name_en: string;
  /** null = no Mongolian name in the source data; show name_en. */
  name_mn: string | null;
  kind: "country" | "aimag" | "capital";
  /** ISO 3166-2 code from the boundary file (real data only). */
  iso?: string;
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


/** World map (#31). Continent ids, in the order of world/index.json. */
export type WorldContinentId = "africa" | "asia" | "europe" | "north_america" | "south_america" | "oceania";

/** One continent in world/index.json. */
export interface WorldContinent {
  id: WorldContinentId;
  name_en: string;
  name_mn: string;
  /** [west, south, east, north]. Crossing 180°: east > 180, draw points with lon < west at lon + 360. */
  bbox: [number, number, number, number];
  points_file: string;
  n_points: number;
  n_by_platform: Record<PlatformKey, number>;
  /** #35: Aqua/NOAA-20 ratio used for this continent (own, or world on fallback). null = unknown. */
  r_day?: number | null;
  r_night?: number | null;
  /** #35: this continent's own sums (Aqua pixels, NOAA-20 fire units). */
  n?: WorldRatioCounts;
  /** #35: true = fewer than `harmonization.min_n` on either side; the world ratio is used for that D/N. */
  fallback?: { D: boolean; N: boolean };
  /** #35: "ratio_fallback" when D or N fell back. */
  flags?: string[];
  /** #35: cells_{continent}.json */
  cells_file?: string;
  /** #37: H3 res 5 cells seen by both / cells seen by either (Aqua vs NOAA-20). null = no cells. */
  iou?: number | null;
  /** #37: P(VIIRS | MODIS) = both / (both + modis_only), Aqua pixels, ±60 min. null = nothing to divide. */
  p_v_given_m?: number | null;
  /** #37: P(MODIS | VIIRS) = both / (both + viirs_only), NOAA-20 fire units, ±60 min. */
  p_m_given_v?: number | null;
  /** #37: share of Not comparable on each side (left out of the probabilities). */
  not_comparable_share?: WorldNotComparableShare;
  /** #37: class counts behind the probabilities. */
  match_counts?: {
    aqua: { both: number; modis_only: number; not_comparable: number };
    noaa20_units: { both: number; viirs_only: number; not_comparable: number };
  };
  /** #37: the same numbers with a ±180 min window (Aqua drift). Data only, not shown in the UI. */
  sensitivity_180?: {
    p_v_given_m: number | null;
    p_m_given_v: number | null;
    not_comparable_share: WorldNotComparableShare;
  };
}

/** #37: Not comparable / all, Aqua pixels and NOAA-20 fire units. null = none on that side. */
export interface WorldNotComparableShare {
  aqua: number | null;
  noaa20_units: number | null;
}

/** #35: Σ Aqua pixels and Σ NOAA-20 fire units, day and night. */
export interface WorldRatioCounts {
  D: { aqua: number; noaa20_units: number };
  N: { aqua: number; noaa20_units: number };
}

/** world/index.json: period, sources, dropped counts and the continent list. */
export interface WorldIndexFile {
  schema_version: string;
  synthetic: boolean;
  period: { start: string; end: string };
  time_zone: "UTC";
  sources: string[];
  /** Hotspots left out of every continent, counted. */
  dropped: { antarctica: number; seven_seas: number; no_continent: number };
  continents: WorldContinent[];
  /** #35: Σ Aqua / Σ NOAA-20 fire units over all continents. null = no units. */
  world_ratio?: { D: number | null; N: number | null; n: WorldRatioCounts };
  /** #35: method constants. */
  harmonization?: {
    fire_unit: "h3_res8_x_overpass";
    overpass_gap_min: number;
    min_n: number;
    cell_resolution: number;
    noaa20_vs: "aqua";
  };
  /** #37: match method constants. */
  match?: {
    pair: "noaa20_vs_aqua";
    window_min: number;
    sensitivity_window_min: number;
    earth_radius_m: number;
    r_match: string;
    not_comparable_km: number;
    iou_cell_resolution: number;
  };
}

export type WorldConfLevel = "low" | "nominal" | "high";
export type WorldMatchClass = "both" | "viirs_only" | "modis_only" | "not_comparable";

/** world/points_{continent}.json: one array per column, all of length `n`. Codes index into `codes`. */
export interface WorldPointsFile {
  schema_version: string;
  synthetic: boolean;
  continent: WorldContinentId;
  n: number;
  codes: { platform: PlatformKey[]; conf: WorldConfLevel[]; match_class: WorldMatchClass[] };
  /** UTC dates; `columns.date` indexes into this. */
  dates: string[];
  columns: {
    lon: number[];
    lat: number[];
    platform: number[];
    /** MW */
    frp: number[];
    conf: number[];
    date: number[];
    /** UTC time as FIRMS acq_time: 342 = 03:42. */
    hhmm: number[];
    daynight: ("D" | "N")[];
    /** #37: null = not in the match (Terra, S-NPP, NOAA-21). */
    match_class: (number | null)[];
  };
}

/**
 * home_fires.json: the home globe's hotspots (scripts/home_fires/make_home_fires.ts). Every hotspot inside
 * Mongolia plus every `sample.every`-th one elsewhere, from world/points_{continent}.json. Integer columns.
 */
export interface HomeFiresFile {
  schema_version: string;
  synthetic: boolean;
  source: string;
  /** UTC days, inclusive. */
  period: { start: string; end: string };
  sample: { every: number; mongolia: "all" };
  /** Hotspots in the source files. */
  source_n: number;
  n: number;
  scale: { lonlat: number; frp: number };
  columns: {
    /** degrees × scale.lonlat */
    lon: number[];
    lat: number[];
    /** minutes after period.start 00:00 UTC */
    t: number[];
    /** MW × scale.frp */
    frp: number[];
    /** 1 = inside Mongolia */
    mn: (0 | 1)[];
  };
}

/** One H3 res 5 cell of world/cells_{continent}.json (#35). */
export interface WorldCell {
  /** H3 v4 index. */
  id: string;
  lat: number;
  lon: number;
  /** [lon, lat] vertices. Crossing 180°: negative lons + 360 (like bbox). */
  boundary: [number, number][];
  /** Aqua-equivalent: units_D × r_D + units_N × r_N. null if a needed ratio is null. */
  viirs_harm: number | null;
  /** Aqua pixels. */
  aqua: number;
  noaa20_units: { D: number; N: number };
  /** Ratios used (= index r_day, r_night). */
  r: { D: number | null; N: number | null };
}

/** world/cells_{continent}.json (#35). */
export interface WorldCellsFile {
  schema_version: string;
  synthetic: boolean;
  continent: WorldContinentId;
  resolution: number;
  unit: "aqua_equivalent_hotspots";
  period: { start: string; end: string };
  n: number;
  cells: WorldCell[];
}
