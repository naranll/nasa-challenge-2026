/** Pure helpers for chapters 7 and 8: dates, fades, the overlap ratio and the "raw chain" series. */
import type { YearPoint } from "../../globe/homeData";
import type { PlatformId } from "../../globe/platforms";
import { SENSOR_OF } from "../../globe/platforms";
import lifecycle from "./lifecycle.json";
import type { StoryCalendar, YearSeries } from "./series";

export const LIFECYCLE = lifecycle;
export const AXIS = { from: 2000, to: 2028 };

/** "2012" -> 2012, "2002-07" -> 2002.5, "2026-11-02" -> 2026.84 (decimal year, for placing marks on an axis). */
export function decimalYear(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  if (m === undefined) return y;
  const start = Date.UTC(y, 0, 1);
  const at = Date.UTC(y, m - 1, d ?? 1);
  return y + (at - start) / (Date.UTC(y + 1, 0, 1) - start);
}

/** 1 while the platform is in service, easing to `floor` over `span` years after its end. */
export function fadeAt(cursor: number, end: number | null, span = 0.5, floor = 0.35): number {
  if (end === null || cursor <= end) return 1;
  const t = Math.min(1, (cursor - end) / span);
  return 1 - (1 - floor) * t;
}

/** Cursor position (decimal year) for chapter progress: sweeps the axis in the first 90%, then holds. */
export function cursorAt(progress: number, reducedOrLite: boolean): number {
  if (reducedOrLite) return AXIS.to;
  const t = Math.min(1, Math.max(0, progress / 0.9));
  return AXIS.from + t * (AXIS.to - AXIS.from);
}

export interface Overlap {
  /** Sum of VIIRS S-NPP over sum of MODIS Aqua in years where both have a full year of data. */
  ratio: number | null;
  years: number;
}

/** VIIRS (S-NPP) ÷ MODIS (Aqua), raw yearly sums, over the full years both have. Null when they never overlap. */
export function overlapRatio(series: YearSeries): Overlap {
  const aqua = new Map(series.raw.aqua.filter((p) => !p.partial).map((p) => [p.year, p.count]));
  let viirs = 0;
  let modis = 0;
  let years = 0;
  for (const p of series.raw.snpp) {
    const a = aqua.get(p.year);
    if (p.partial || a === undefined) continue;
    viirs += p.count;
    modis += a;
    years++;
  }
  return { ratio: years > 0 && modis > 0 ? viirs / modis : null, years };
}

/** A ratio this close to 1 is not a visible step. */
export const FLAT_RATIO: [number, number] = [0.8, 1.25];
export const isVisibleStep = (ratio: number) => ratio < FLAT_RATIO[0] || ratio > FLAT_RATIO[1];

export interface ChainPoint extends YearPoint {
  platform: PlatformId;
}

/** Yearly raw counts of the reference-chain platform (whatever `chain_platform` says each month), spliced as recorded. */
export function chainRawYearly(cal: StoryCalendar): ChainPoint[] {
  const byYear = new Map<number, { count: number; months: number; votes: Map<PlatformId, number> }>();
  for (const m of cal.months) {
    const chain = (m as { chain_platform?: PlatformId }).chain_platform;
    const v = chain ? m.raw?.[chain] : undefined;
    if (m.is_forecast || !chain || typeof v !== "number") continue;
    const year = Number(m.ym.slice(0, 4));
    const acc = byYear.get(year) ?? { count: 0, months: 0, votes: new Map() };
    acc.count += v;
    acc.months += 1;
    acc.votes.set(chain, (acc.votes.get(chain) ?? 0) + 1);
    byYear.set(year, acc);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, a]) => ({
      year,
      count: a.count,
      partial: a.months < 12,
      platform: [...a.votes.entries()].sort((x, y) => y[1] - x[1])[0][0],
    }));
}

/** The first year the chain switches sensor family (MODIS -> VIIRS): where the raw record has its seam. */
export function seamYear(chain: ChainPoint[]): number | null {
  for (let i = 1; i < chain.length; i++) if (SENSOR_OF[chain[i].platform] !== SENSOR_OF[chain[i - 1].platform]) return chain[i].year;
  return null;
}

/** Wrap a label into lines of at most `max` characters, on word boundaries. */
export function wrapLabel(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > max) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

/** Share (0..1) of node `i` that is drawn, when `n` nodes are drawn one after another as `progress` goes 0..1. */
export function nodeFraction(progress: number, n: number, i: number): number {
  return Math.min(1, Math.max(0, progress * n - i));
}
