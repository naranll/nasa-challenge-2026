/**
 * Monthly hotspots for one region, under the Raw / Harmonized switch (PLAN D2).
 * Raw: the counting platform's own count, coloured by sensor, so the jump when VIIRS takes over shows.
 * Harmonized: the one Aqua-equivalent series drawn on top of the faded raw line.
 */
import { useRef } from "react";
import type { CalendarCell, CalendarRow, CalendarView } from "../calendar/calendarData";
import { useElementSize } from "../globe/env";
import { formatNumber } from "../globe/format";
import { SENSOR_COLOR, SENSOR_OF } from "../globe/platforms";
import { useI18n } from "../i18n";

const H = 240;
const M = { top: 14, right: 12, bottom: 26, left: 48 };
export const HARMONIZED_COLOR = "#f2f2f2";
const MAX_X_TICKS = 8;

interface Props {
  raw: CalendarRow[];
  harmonized: CalendarRow[];
  view: CalendarView;
  label: string;
}

type Point = { i: number; cell: CalendarCell };

/** Consecutive known months as separate runs, split where the value is unknown or (raw) the platform changes. */
function runs(cells: CalendarCell[], byPlatform: boolean): Point[][] {
  const out: Point[][] = [];
  let cur: Point[] = [];
  cells.forEach((cell, i) => {
    const prev = cur[cur.length - 1];
    if (cell.value === null || (byPlatform && prev && prev.cell.platform !== cell.platform)) {
      if (cur.length) out.push(cur);
      cur = [];
    }
    if (cell.value !== null) cur.push({ i, cell });
  });
  if (cur.length) out.push(cur);
  return out;
}

const observed = (rows: CalendarRow[]) => rows.flatMap((r) => r.cells).filter((c) => c.inFile && !c.forecast);

export function MonthlyChart({ raw, harmonized, view, label }: Props) {
  const { t, lang } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(box);
  const rawCells = observed(raw);
  const harmCells = observed(harmonized);
  if (rawCells.length === 0) return <p className="chart-note">{t("harm.monthly.empty")}</p>;
  if (width === 0) return <div ref={box} className="monthly-chart" />;

  const max = Math.max(1, ...[...rawCells, ...harmCells].map((c) => c.value ?? 0));
  const n = rawCells.length;
  const w = width - M.left - M.right;
  const h = H - M.top - M.bottom;
  const sx = (i: number) => M.left + (n === 1 ? w / 2 : (i / (n - 1)) * w);
  const sy = (v: number) => M.top + h - (v / max) * h;
  const path = (run: Point[]) => run.map((p) => `${sx(p.i)},${sy(p.cell.value!)}`).join(" ");
  const years = [...new Set(rawCells.map((c) => c.ym.slice(0, 4)))];
  const step = Math.max(1, Math.ceil(years.length / MAX_X_TICKS));
  const ticks = years.filter((_, k) => k % step === 0).map((y) => ({ y, i: rawCells.findIndex((c) => c.ym.startsWith(y)) }));

  return (
    <div ref={box} className="monthly-chart" data-view={view}>
      <svg width={width} height={H} role="img" aria-label={label} className="chart">
        {[0, max].map((v) => (
          <g key={v}>
            <line x1={M.left} x2={M.left + w} y1={sy(v)} y2={sy(v)} className="chart-grid" />
            <text x={M.left - 6} y={sy(v)} dy="0.32em" textAnchor="end" className="chart-tick">
              {formatNumber(v, lang, { notation: "compact" })}
            </text>
          </g>
        ))}
        {ticks.map(({ y, i }) => (
          <text key={y} x={sx(i)} y={H - 8} textAnchor="middle" className="chart-tick">
            {y}
          </text>
        ))}
        <g opacity={view === "harmonized" ? 0.25 : 1}>
          {runs(rawCells, true).map((run) => (
            <polyline
              key={run[0].cell.ym}
              points={path(run)}
              fill="none"
              stroke={run[0].cell.platform ? SENSOR_COLOR[SENSOR_OF[run[0].cell.platform]] : HARMONIZED_COLOR}
              strokeWidth={1.25}
            />
          ))}
        </g>
        {view === "harmonized" &&
          runs(harmCells, false).map((run) => (
            <polyline key={run[0].cell.ym} points={path(run)} fill="none" stroke={HARMONIZED_COLOR} strokeWidth={1.5} />
          ))}
      </svg>
    </div>
  );
}
