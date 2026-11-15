/** Raw monthly hotspots per platform, one line each. The VIIRS start is marked from the data (Job 4). */
import { useRef } from "react";
import { useElementSize } from "../globe/env";
import { formatNumber } from "../globe/format";
import { nameKey, PLATFORM_DASH, PLATFORM_IDS, type PlatformId, SENSOR_COLOR, SENSOR_OF } from "../globe/platforms";
import { useI18n } from "../i18n";
import { formatMonth } from "./format";
import type { MonthPoint } from "./rawData";

const H = 320;
const M = { top: 24, right: 84, bottom: 28, left: 48 };
const LABEL_GAP = 13;
const MAX_X_TICKS = 8;
const Y_TICKS = 4;

/** A round step so that about `count` ticks cover `max`. */
function niceStep(max: number, count: number): number {
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  return ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
}

/** Push end labels apart so they don't overlap; keeps their order and stays inside [min, max]. */
function spread(ys: number[], gap: number, min: number, max: number): number[] {
  const order = ys.map((y, i) => [y, i] as const).sort((a, b) => a[0] - b[0]);
  const out = [...ys];
  let prev = -Infinity;
  for (const [y, i] of order) {
    out[i] = Math.max(y, prev + gap, min);
    prev = out[i];
  }
  const over = prev - max;
  if (over > 0) for (const [, i] of order) out[i] -= over;
  return out;
}

/** Months counted from year 0, so months are evenly spaced on the x axis. */
const monthIndex = (ym: string) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;

interface Props {
  series: Record<PlatformId, MonthPoint[]>;
  viirsStart: string | null;
}

export function RawMonthlyChart({ series, viirsStart }: Props) {
  const { t, lang } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(box);

  const lines = PLATFORM_IDS.filter((id) => series[id].length > 0).map((id) => ({ id, points: series[id] }));
  const all = lines.flatMap((l) => l.points);
  if (all.length === 0 || width === 0) return <div ref={box} className="chart-box" />;

  const idx = all.map((p) => monthIndex(p.ym));
  const x0 = Math.min(...idx);
  const x1 = Math.max(...idx);
  const max = Math.max(1, ...all.map((p) => p.count));
  const w = width - M.left - M.right;
  const h = H - M.top - M.bottom;
  const step = niceStep(max, Y_TICKS);
  const yMax = Math.ceil(max / step) * step;
  const sxi = (i: number) => M.left + (x1 === x0 ? w / 2 : ((i - x0) / (x1 - x0)) * w);
  const sx = (ym: string) => sxi(monthIndex(ym));
  const sy = (v: number) => M.top + h - (v / yMax) * h;

  // Year ticks at January; the first tick is the first January inside the data.
  const firstYear = Math.ceil(x0 / 12);
  const lastYear = Math.floor(x1 / 12);
  const yearStep = Math.max(1, Math.ceil((lastYear - firstYear + 1) / MAX_X_TICKS));
  const xTicks: number[] = [];
  for (let y = firstYear; y <= lastYear; y += yearStep) xTicks.push(y);
  const yTicks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);
  const labelY = spread(lines.map((l) => sy(l.points[l.points.length - 1].count)), LABEL_GAP, M.top, M.top + h);
  const summary = viirsStart
    ? t("harmonize.raw.chart.a11y", { month: formatMonth(viirsStart, lang) })
    : t("harmonize.raw.chart.a11y_no_viirs");

  return (
    <div ref={box} className="chart-box">
      <svg width={width} height={H} role="img" aria-label={summary} className="chart">
        <text x={0} y={12} className="chart-axis-label">
          {t("harmonize.raw.chart.axis_count")}
        </text>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={M.left + w} y1={sy(v)} y2={sy(v)} className="chart-grid" />
            <text x={M.left - 6} y={sy(v)} dy="0.32em" textAnchor="end" className="chart-tick">
              {formatNumber(v, lang, { notation: "compact" })}
            </text>
          </g>
        ))}
        {xTicks.map((y) => (
          <text key={y} x={sxi(y * 12)} y={H - 8} textAnchor="middle" className="chart-tick">
            {y}
          </text>
        ))}
        {viirsStart && (
          <g>
            <line x1={sx(viirsStart)} x2={sx(viirsStart)} y1={M.top} y2={M.top + h} className="raw-viirs-mark" />
            <text x={sx(viirsStart) + 4} y={M.top + 10} className="chart-tick raw-viirs-label">
              {t("harmonize.raw.chart.viirs_start", { month: formatMonth(viirsStart, lang) })}
            </text>
          </g>
        )}
        {lines.map(({ id, points }, i) => {
          const color = SENSOR_COLOR[SENSOR_OF[id]];
          const end = points[points.length - 1];
          return (
            <g key={id}>
              <polyline
                points={points.map((p) => `${sx(p.ym)},${sy(p.count)}`).join(" ")}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray={PLATFORM_DASH[id].join(" ")}
                strokeLinejoin="round"
              />
              <text x={sx(end.ym) + 8} y={labelY[i]} dy="0.32em" fill={color} className="chart-label">
                {t(nameKey(id))}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="chart-axis-x">{t("harmonize.raw.chart.axis_month")}</p>
    </div>
  );
}
