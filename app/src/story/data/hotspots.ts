/**
 * Illustrative hotspot marks for the hero map. They are NOT detections: each mark is drawn at a seeded random spot
 * inside a cell of hex_year/{raw,harm}.json, and its number follows the cell's count, scaled down by DETECTIONS_PER_MARK.
 * Same file, same marks, every load. The page always says "illustrative" next to them.
 */
import { MONGOLIA, rings, type Ring } from "../../globe/geo";
import type { Loaded } from "../../globe/useHomeData";
import type { PlatformId } from "../../globe/platforms";
import { rng, seedOf } from "../engine/rng";
import { useStoryFile } from "./adapters";
import { useMemo } from "react";

export const RAW_PATH = "hex_year/raw.json";
export const HARM_PATH = "hex_year/harm.json";

/** One mark stands for about this many detections. Keeps the picture readable; the ratio between sensors is kept. */
export const DETECTIONS_PER_MARK = 16;

export interface HexRaw {
  synthetic?: boolean;
  years: number[];
  cells: { id: string; lat: number; lon: number; counts: Partial<Record<PlatformId, (number | null)[]>> }[];
}
export interface HexHarm {
  synthetic?: boolean;
  years: number[];
  cells: { id: string; lat: number; lon: number; counts: (number | null)[] }[];
}

export interface Mark {
  id: string;
  lon: number;
  lat: number;
  /** 0..1, fixed per mark: staggers when it takes off in the harmonize animation. */
  order: number;
}

export interface Hotspots {
  year: number;
  modis: Mark[];
  viirs: Mark[];
  /** The harmonized (Aqua-equivalent) map: one kind of mark. */
  uniform: Mark[];
  synthetic: boolean;
}

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

/** Even-odd point-in-polygon over every ring of the outline. */
export function insideOutline(lon: number, lat: number, outline: Ring[] = rings(MONGOLIA)): boolean {
  let inside = false;
  for (const ring of outline) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

/** Half the grid spacing, from the cells themselves (the fixture is a 2 degree grid), within sane limits. */
export function cellHalf(cells: { lat: number; lon: number }[]): number {
  const gaps: number[] = [];
  for (const axis of ["lat", "lon"] as const) {
    const v = [...new Set(cells.map((c) => c[axis]))].sort((a, b) => a - b);
    for (let i = 1; i < v.length; i++) gaps.push(v[i] - v[i - 1]);
  }
  const step = gaps.length ? Math.min(...gaps) : 0.2;
  return Math.min(1, Math.max(0.05, step / 2));
}

/** The newest year in which the cells hold a MODIS and a VIIRS count. */
export function pickYear(raw: HexRaw): number {
  const has = (ids: PlatformId[], i: number) => raw.cells.some((c) => ids.some((id) => isNum(c.counts[id]?.[i])));
  for (let i = raw.years.length - 1; i >= 0; i--) if (has(["aqua", "terra"], i) && has(["snpp", "noaa20", "noaa21"], i)) return raw.years[i];
  return raw.years[raw.years.length - 1];
}

function marksFor(cells: { id: string; lat: number; lon: number }[], countOf: (i: number) => number, tag: string, half: number, outline: Ring[]): Mark[] {
  const out: Mark[] = [];
  cells.forEach((cell, i) => {
    if (!insideOutline(cell.lon, cell.lat, outline)) return;
    const rand = rng(seedOf(`${tag}|${cell.id}`));
    const n = Math.floor(countOf(i) / DETECTIONS_PER_MARK + rand());
    for (let k = 0; k < n; k++) {
      for (let attempt = 0; attempt < 24; attempt++) {
        const lon = cell.lon + (rand() * 2 - 1) * half;
        const lat = cell.lat + (rand() * 2 - 1) * half;
        if (!insideOutline(lon, lat, outline)) continue;
        out.push({ id: `${tag}-${cell.id}-${k}`, lon, lat, order: rand() });
        break;
      }
    }
  });
  return out;
}

export function buildHotspots(raw: HexRaw, harm: HexHarm, outline: Ring[] = rings(MONGOLIA)): Hotspots {
  const year = pickYear(raw);
  const yi = raw.years.indexOf(year);
  const half = cellHalf(raw.cells);
  const modisCount = (c: HexRaw["cells"][number]) => c.counts.aqua?.[yi] ?? c.counts.terra?.[yi] ?? 0;
  const viirsCount = (c: HexRaw["cells"][number]) => Math.max(0, ...(["snpp", "noaa20", "noaa21"] as const).map((id) => c.counts[id]?.[yi]).filter(isNum));
  const hi = harm.years.indexOf(year);
  return {
    year,
    modis: marksFor(raw.cells, (i) => modisCount(raw.cells[i]) || 0, "modis", half, outline),
    viirs: marksFor(raw.cells, (i) => viirsCount(raw.cells[i]), "viirs", half, outline),
    uniform: marksFor(harm.cells, (i) => (hi >= 0 && isNum(harm.cells[i].counts[hi]) ? harm.cells[i].counts[hi]! : 0), "uniform", cellHalf(harm.cells), outline),
    synthetic: raw.synthetic === true || harm.synthetic === true,
  };
}

/** Loads both hex files; either one failing means no marks (the outline and the story still show). */
export function useHotspots(): Loaded<Hotspots> {
  const raw = useStoryFile<HexRaw>(RAW_PATH);
  const harm = useStoryFile<HexHarm>(HARM_PATH);
  return useMemo<Loaded<Hotspots>>(() => {
    if (raw.status === "error" || harm.status === "error") return { status: "error" };
    if (raw.status !== "ok" || harm.status !== "ok") return { status: "loading" };
    if (!Array.isArray(raw.data?.cells) || !Array.isArray(harm.data?.cells)) return { status: "error" };
    return { status: "ok", data: buildHotspots(raw.data, harm.data) };
  }, [raw, harm]);
}
