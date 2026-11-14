/** Infographic 1 (spec §7.2): raw hotspots per platform per year, from calendar/mongolia.json. */
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { ROUTES } from "../routes";
import { useElementSize } from "./env";
import { formatNumber } from "./format";
import type { YearPoint } from "./homeData";
import { nameKey, PLATFORM_IDS, type PlatformId, SENSOR_COLOR, SENSOR_OF } from "./platforms";

const H = 280;
const M = { top: 22, right: 84, bottom: 28, left: 44 };
const LABEL_GAP = 13;
const MAX_X_TICKS = 7;
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

export function PerYearChart({ series }: { series: Record<PlatformId, YearPoint[]> }) {
  const { t, lang } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(box);

  const lines = PLATFORM_IDS.filter((id) => series[id].length > 0).map((id) => ({ id, points: series[id] }));
  let max: (YearPoint & { id: PlatformId }) | null = null;
  for (const l of lines) for (const p of l.points) if (!max || p.count > max.count) max = { ...p, id: l.id };
  if (!max || width === 0) return <div ref={box} className="chart-box" />;

  const years = [...new Set(lines.flatMap((l) => l.points.map((p) => p.year)))].sort((a, b) => a - b);
  const x0 = years[0];
  const x1 = years[years.length - 1];
  const w = width - M.left - M.right;
  const h = H - M.top - M.bottom;
  const step = niceStep(max.count, Y_TICKS);
  const yMax = Math.ceil(max.count / step) * step;
  const sx = (year: number) => M.left + (x1 === x0 ? w / 2 : ((year - x0) / (x1 - x0)) * w);
  const sy = (v: number) => M.top + h - (v / yMax) * h;
  const xStep = Math.max(1, Math.ceil(years.length / MAX_X_TICKS));
  const xTicks = years.filter((y) => (y - x0) % xStep === 0);
  const yTicks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);
  const labelY = spread(lines.map((l) => sy(l.points[l.points.length - 1].count)), LABEL_GAP, M.top, M.top + h);
  const summary = t("home.info.per_year.a11y_summary", { max_year: max.year, max_platform: t(nameKey(max.id)) });

  return (
    <div ref={box} className="chart-box">
      <svg width={width} height={H} role="img" aria-label={summary} className="chart">
        <text x={0} y={12} className="chart-axis-label">
          {t("home.info.per_year.axis_count")}
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
          <text key={y} x={sx(y)} y={H - 8} textAnchor="middle" className="chart-tick">
            {y}
          </text>
        ))}
        {lines.map(({ id, points }, i) => {
          const color = SENSOR_COLOR[SENSOR_OF[id]];
          const end = points[points.length - 1];
          return (
            <g key={id}>
              <polyline points={points.map((p) => `${sx(p.year)},${sy(p.count)}`).join(" ")} fill="none" stroke={color} strokeWidth={2} />
              {points.map((p) => (
                <circle
                  key={p.year}
                  cx={sx(p.year)}
                  cy={sy(p.count)}
                  r={p.partial ? 3.5 : 2.5}
                  fill={p.partial ? "var(--bg)" : color}
                  stroke={color}
                  strokeWidth={1.5}
                />
              ))}
              <text x={sx(end.year) + 8} y={labelY[i]} dy="0.32em" fill={color} className="chart-label">
                {t(nameKey(id))}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="chart-axis-x">{t("home.info.per_year.axis_year")}</p>
    </div>
  );
}

export function PerYearNote() {
  const { t } = useI18n();
  return (
    <p className="chart-note">
      <span className="chart-partial-key" aria-hidden="true" /> {t("home.info.per_year.partial_year")}
      <br />
      {t("home.info.per_year.note")} <Link to={ROUTES.harmonizing}>{t("home.info.per_year.note_link")}</Link>
    </p>
  );
}
