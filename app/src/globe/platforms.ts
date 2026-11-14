import type { MessageKey } from "../i18n";

/**
 * The 5 platforms and their sensors, kept in code too so the legend still shows when
 * satellites.json fails to load (spec A45). Ids and sensor codes are internal values, not UI text.
 */
export const PLATFORM_IDS = ["terra", "aqua", "snpp", "noaa20", "noaa21"] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];
export type Sensor = "MODIS" | "VIIRS";

export const SENSOR_OF: Record<PlatformId, Sensor> = {
  terra: "MODIS",
  aqua: "MODIS",
  snpp: "VIIRS",
  noaa20: "VIIRS",
  noaa21: "VIIRS",
};

export const SENSORS: readonly Sensor[] = ["MODIS", "VIIRS"];

/**
 * One colour per sensor, shared by globe, card and charts (spec §4.2, A15).
 * Amber vs sky blue: not a red/green pair, both > 7:1 contrast on the #05070d background.
 */
export const SENSOR_COLOR: Record<Sensor, string> = {
  MODIS: "#f5a742",
  VIIRS: "#58b8f5",
};

export function platformsOf(sensor: Sensor): PlatformId[] {
  return PLATFORM_IDS.filter((id) => SENSOR_OF[id] === sensor);
}

export function isPlatformId(x: unknown): x is PlatformId {
  return typeof x === "string" && (PLATFORM_IDS as readonly string[]).includes(x);
}

/**
 * Dash pattern per platform ([dash, gap]): every orbit line is dotted (#10), and platforms with the
 * same sensor differ by pattern, not only colour (spec A16). Units: SVG px / hundredths of a globe radius.
 */
export const PLATFORM_DASH: Record<PlatformId, [number, number]> = {
  terra: [6, 3],
  aqua: [2, 3],
  snpp: [2, 2],
  noaa20: [6, 3],
  noaa21: [1, 4],
};

/** i18n key of a platform's display name. */
export const nameKey = (id: PlatformId) => `globe.platform.${id}.name` as MessageKey;
