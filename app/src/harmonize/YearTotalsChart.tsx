/** Small line chart under each globe (PLAN D12): all hexagons summed per year, current year marked. */
import { useRef } from "react";
import { useElementSize } from "../globe/env";
import { formatNumber } from "../globe/format";
import { useI18n } from "../i18n";

const H = 96;
const M = { top: 10, right: 12, bottom: 18, left: 40 };

interface Props {
  years: number[];
  values: (number | null)[];
  /** Shared by both charts, so equal heights mean equal counts. */
  max: number;
  index: number;
  color: string;
  label: string;
  /** Years where the counting platform changes: dashed vertical line. */
  marks: number[];
}

export function YearTotalsChart({ years, values, max, index, color, label, marks }: Props) {
  const { lang } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(box);
  if (width === 0 || years.length === 0) return <div ref={box} className="year-totals" />;
  const w = width - M.left - M.right;
  const h = H - M.top - M.bottom;
  const top = Math.max(max, 1);
  const sx = (i: number) => M.left + (years.length === 1 ? w / 2 : (i / (years.length - 1)) * w);
  const sy = (v: number) => M.top + h - (v / top) * h;
  // Break the line at unknown years rather than drawing them as 0.
  const segments: string[] = [];
  let cur: string[] = [];
  values.forEach((v, i) => {
    if (v === null) {
      if (cur.length) segments.push(cur.join(" "));
      cur = [];
    } else cur.push(`${sx(i)},${sy(v)}`);
  });
  if (cur.length) segments.push(cur.join(" "));
  const now = values[index];

  return (
    <div ref={box} className="year-totals">
      <svg width={width} height={H} role="img" aria-label={label} className="chart">
        {[0, top].map((v) => (
          <g key={v}>
            <line x1={M.left} x2={M.left + w} y1={sy(v)} y2={sy(v)} className="chart-grid" />
            <text x={M.left - 6} y={sy(v)} dy="0.32em" textAnchor="end" className="chart-tick">
              {formatNumber(v, lang, { notation: "compact" })}
            </text>
          </g>
        ))}
        {marks.map((y) => {
          const i = years.indexOf(y);
          return i < 0 ? null : <line key={y} x1={sx(i)} x2={sx(i)} y1={M.top} y2={M.top + h} className="chart-handover" />;
        })}
        {segments.map((pts) => (
          <polyline key={pts} points={pts} fill="none" stroke={color} strokeWidth={2} />
        ))}
        <line x1={sx(index)} x2={sx(index)} y1={M.top} y2={M.top + h} className="chart-cursor" />
        {now !== null && <circle cx={sx(index)} cy={sy(now)} r={4} fill={color} />}
        <text x={M.left} y={H - 4} className="chart-tick">
          {years[0]}
        </text>
        <text x={M.left + w} y={H - 4} textAnchor="end" className="chart-tick">
          {years[years.length - 1]}
        </text>
      </svg>
    </div>
  );
}
