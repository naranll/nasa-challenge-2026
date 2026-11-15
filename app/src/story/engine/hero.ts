/**
 * The persistent hero layer's maths: where Mongolia sits on screen, what each scene asks the layer to show, and how a
 * satellite swath ignites hotspots. Pure, so it is unit-tested. Drawing is in HeroMap.tsx.
 */
import { MONGOLIA, MONGOLIA_CENTER, rings } from "../../globe/geo";
import { clamp01 } from "./layout";

export type SceneKind = "crews" | "handover" | "harmonize";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What a scene asks the hero layer to show right now. */
export interface HeroState {
  /** 0..1 opacity of the Mongolia outline. */
  outline: number;
  /** Swath position per sensor across the map: < 0 not started, 0..1 sweeping, >= SWEEP_DONE finished (all lit). */
  sweep: { modis: number; viirs: number };
  /** Opacity multiplier of each kind of mark. */
  marks: { modis: number; viirs: number; uniform: number };
  /** Harmonize flight: raw marks fly into the pipeline (fall), uniform marks fly out of it (rise). Both 0..1. */
  fall: number;
  rise: number;
  /** The five pipeline boxes: opacity and how far the data has travelled through them (0..5); null = no pipeline. */
  pipeline: { show: number; progress: number } | null;
  /** Overrides the persistent chart's reveal (0..1); null leaves the keyframes in charge. */
  chartReveal: number | null;
  /** Handover: the year the chart cursor and the satellite pictures are at; null = no cursor. */
  cursor: number | null;
  /** True while a scene is time-driven (it loops by itself). */
  looping: boolean;
}

export const SWEEP_DONE = 1.25;
/** Width of a swath band and of the ignition zone just behind its leading edge, in map-widths along the sweep. */
export const BAND = 0.13;
export const IGNITE_SPAN = 0.07;
/** Tilt of the swath band from vertical, in degrees. */
export const TILT_DEG = 14;

export const LOOP_SECONDS = 11;
/** Where the harmonize loop rests when motion is reduced: everything has come out of the pipeline. */
export const LOOP_REST = 0.9;

/** The handover scene scrubs from here to there as the chapter scrolls. */
export const HANDOVER_YEARS: [number, number] = [2020, 2028];
export const handoverYear = (p: number, still: boolean) => (still ? HANDOVER_YEARS[1] : mix(HANDOVER_YEARS[0], HANDOVER_YEARS[1], ramp(p, 0.1, 0.9)));

const ramp = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);

const NONE: HeroState = {
  outline: 0,
  sweep: { modis: -1, viirs: -1 },
  marks: { modis: 0, viirs: 0, uniform: 0 },
  fall: 0,
  rise: 0,
  pipeline: null,
  chartReveal: null,
  cursor: null,
  looping: false,
};

/** The state a scene wants at chapter progress `p` (0..1) and loop phase `loop` (0..1, harmonize only). */
export function heroState(kind: SceneKind | undefined, p: number, loop: number, still: boolean): HeroState {
  if (!kind) return NONE;
  if (kind === "crews") {
    if (still) return { ...NONE, outline: 1, sweep: { modis: SWEEP_DONE, viirs: SWEEP_DONE }, marks: { modis: 1, viirs: 1, uniform: 0 } };
    return {
      ...NONE,
      outline: ramp(p, 0, 0.06),
      sweep: { modis: mix(-0.05, SWEEP_DONE, ramp(p, 0.08, 0.42)), viirs: mix(-0.05, SWEEP_DONE, ramp(p, 0.56, 0.92)) },
      marks: { modis: 1, viirs: 1, uniform: 0 },
    };
  }
  if (kind === "handover") {
    // The record is the hero here: every hotspot is already lit, held back so the line in front reads first.
    return { ...NONE, outline: 0.55, sweep: { modis: SWEEP_DONE, viirs: SWEEP_DONE }, marks: { modis: 0.4, viirs: 0.4, uniform: 0 }, cursor: handoverYear(p, still) };
  }
  const t = still ? LOOP_REST : clamp01(loop);
  const end = 1 - ramp(t, 0.95, 1);
  return {
    outline: 1,
    sweep: { modis: SWEEP_DONE, viirs: SWEEP_DONE },
    marks: { modis: 1, viirs: 1, uniform: end },
    fall: ramp(t, 0.16, 0.42),
    rise: ramp(t, 0.58, 0.84),
    pipeline: { show: 1, progress: still ? 5 : ramp(t, 0.26, 0.7) * 5 },
    chartReveal: Math.min(ramp(t, 0.6, 0.9), end),
    cursor: null,
    looping: !still,
  };
}

/** Ignition of a mark at normalised sweep position `u` (0..1): 0 before the swath's leading edge reaches it, 1 once past. */
export function ignite(sweep: number, u: number): number {
  return clamp01((sweep - u) / IGNITE_SPAN);
}

/** Opacity and ring of an igniting hotspot: it fades in while the band passes, with one ring that expands and fades. */
export function ignition(i: number): { opacity: number; ring: number } {
  return { opacity: smooth(clamp01(i / 0.45)), ring: i > 0 && i < 1 ? i : 0 };
}

/** Where a mark is while flying between two points, staggered by its `order`. f = 0 at the start, 1 at the end. */
export function flight(progress: number, order: number): number {
  return smooth(clamp01((progress - order * 0.5) / 0.5));
}

// ---- where things are on screen ------------------------------------------------------------------------------

const COS_LAT = Math.cos((MONGOLIA_CENTER.lat * Math.PI) / 180);

/** Bounding box of the outline in degrees. */
export const BOX = (() => {
  const pts = rings(MONGOLIA).flat();
  const lons = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  return { minLon: Math.min(...lons), maxLon: Math.max(...lons), minLat: Math.min(...lats), maxLat: Math.max(...lats) };
})();

/** Width / height of Mongolia on a flat map (longitude shrunk by cos of the middle latitude). */
export const ASPECT = ((BOX.maxLon - BOX.minLon) * COS_LAT) / (BOX.maxLat - BOX.minLat);

export interface MapFit {
  rect: Rect;
  /** Pixels per degree of latitude. */
  scale: number;
  project(lon: number, lat: number): { x: number; y: number };
}

/** A map fit from the rectangle Mongolia occupies (its shape is fixed by ASPECT). */
export function fitFromRect(rect: Rect): MapFit {
  const scale = rect.h / (BOX.maxLat - BOX.minLat);
  return { rect, scale, project: (lon, lat) => ({ x: rect.x + (lon - BOX.minLon) * COS_LAT * scale, y: rect.y + (BOX.maxLat - lat) * scale }) };
}

/** Fit Mongolia inside `zone`, centred, keeping its shape. */
export function fitMap(zone: Rect): MapFit {
  const w = Math.min(zone.w, zone.h * ASPECT);
  const h = w / ASPECT;
  return fitFromRect({ x: zone.x + (zone.w - w) / 2, y: zone.y + (zone.h - h) / 2, w, h });
}

/** The sweep direction: a unit vector across the map, tilted TILT_DEG from horizontal. */
const TILT = (TILT_DEG * Math.PI) / 180;
const DIR = { x: Math.cos(TILT), y: Math.sin(TILT) };

/** Normalised position (0..1) of a point along the sweep direction, across the map rectangle. */
export function sweepU(x: number, y: number, rect: Rect): number {
  const corners = [
    [rect.x, rect.y],
    [rect.x + rect.w, rect.y],
    [rect.x, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h],
  ].map(([cx, cy]) => cx * DIR.x + cy * DIR.y);
  const lo = Math.min(...corners);
  const hi = Math.max(...corners);
  return ((x * DIR.x + y * DIR.y) - lo) / (hi - lo);
}

/** The parallelogram of a swath band whose leading edge is at `sweep`, as four [x, y] corners (hairline edges). */
export function bandCorners(sweep: number, rect: Rect, pad = 16): [number, number][] {
  const corners = [
    [rect.x, rect.y],
    [rect.x + rect.w, rect.y],
    [rect.x, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h],
  ].map(([cx, cy]) => cx * DIR.x + cy * DIR.y);
  const lo = Math.min(...corners);
  const hi = Math.max(...corners);
  const edge = (u: number, y: number) => {
    const raw = lo + u * (hi - lo);
    return [(raw - y * DIR.y) / DIR.x, y] as [number, number];
  };
  const top = rect.y - pad;
  const bottom = rect.y + rect.h + pad;
  const lead = sweep;
  const trail = sweep - BAND;
  return [edge(trail, top), edge(lead, top), edge(lead, bottom), edge(trail, bottom)];
}

/** A band is drawn while any part of it is over the map. */
export const bandVisible = (sweep: number) => sweep > 0 && sweep < 1 + BAND;

export interface PipeLayout {
  y: number;
  nodeW: number;
  nodeH: number;
  xs: number[];
  /** Where raw marks fall in and where uniform marks come out. */
  entry: { x: number; y: number };
  exit: { x: number; y: number };
}

export function pipeLayout(x0: number, x1: number, y: number, nodeH: number, gap: number, n = 5): PipeLayout {
  const nodeW = (x1 - x0 - (n - 1) * gap) / n;
  const xs = Array.from({ length: n }, (_, i) => x0 + i * (nodeW + gap));
  return { y, nodeW, nodeH, xs, entry: { x: xs[0] + nodeW / 2, y: y - nodeH / 2 }, exit: { x: xs[n - 1] + nodeW / 2, y: y - nodeH / 2 } };
}

export interface HeroLayout {
  wide: boolean;
  map: MapFit;
  pipe?: PipeLayout;
}

export const WIDE_FROM = 900;

/** Screen layout of the hero layer for a scene (the stylesheet places the text, chart and satellite pictures to match). */
/** On a phone the chapter dots sit at the right edge, so the map and pipeline stop short of them. */
const PHONE_X = { left: 16, right: 40 };

export function heroLayout(kind: SceneKind, w: number, h: number): HeroLayout {
  const wide = w >= WIDE_FROM;
  const px = PHONE_X.left;
  const pw = w - PHONE_X.left - PHONE_X.right;
  if (kind === "crews") {
    const zone = wide ? { x: w * 0.4, y: h * 0.1, w: w * 0.54, h: h * 0.42 } : { x: px, y: h * 0.29, w: pw, h: h * 0.22 };
    return { wide, map: fitMap(zone) };
  }
  if (kind === "handover") {
    const zone = wide ? { x: 40, y: h * 0.36, w: Math.min(w * 0.33, 480), h: h * 0.28 } : { x: px, y: h * 0.27, w: pw, h: h * 0.18 };
    return { wide, map: fitMap(zone) };
  }
  const zone = wide ? { x: w * 0.4, y: h * 0.07, w: w * 0.54, h: h * 0.36 } : { x: px, y: h * 0.27, w: pw, h: h * 0.2 };
  const pipe = wide ? pipeLayout(w * 0.4, w * 0.94, h * 0.53, 50, 16) : pipeLayout(px, w - PHONE_X.right, h * 0.58, 44, 8);
  return { wide, map: fitMap(zone), pipe };
}

/** In-between layout while the map moves from one scene's place to the next (t = 0..1). The pipeline appears in place. */
export function lerpLayout(a: HeroLayout, b: HeroLayout, t: number): HeroLayout {
  const r = (k: keyof Rect) => mix(a.map.rect[k], b.map.rect[k], t);
  const pipe = b.pipe && a.pipe ? { ...b.pipe, y: mix(a.pipe.y, b.pipe.y, t), xs: b.pipe.xs.map((x, i) => mix(a.pipe!.xs[i], x, t)), nodeW: mix(a.pipe.nodeW, b.pipe.nodeW, t) } : b.pipe;
  if (pipe && b.pipe) {
    pipe.entry = { x: pipe.xs[0] + pipe.nodeW / 2, y: pipe.y - pipe.nodeH / 2 };
    pipe.exit = { x: pipe.xs[pipe.xs.length - 1] + pipe.nodeW / 2, y: pipe.y - pipe.nodeH / 2 };
  }
  return { wide: b.wide, map: fitFromRect({ x: r("x"), y: r("y"), w: r("w"), h: r("h") }), pipe };
}

/** Outline path in screen pixels. */
export function outlinePath(fit: MapFit): string {
  return rings(MONGOLIA)
    .map((ring) => ring.map(([lon, lat], i) => {
      const { x, y } = fit.project(lon, lat);
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join("") + "Z")
    .join("");
}
