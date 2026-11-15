/**
 * The persistent "hotspots per year" chart. It lives in the engine and never unmounts; chapters only set its
 * target (visible / reveal / harmonize). Marks: dots = MODIS, triangles = VIIRS, so colour is never the only cue.
 */
import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useElementSize } from "../../globe/env";
import { formatNumber } from "../../globe/format";
import { nameKey, PLATFORM_IDS, SENSOR_COLOR, SENSOR_OF, type PlatformId, type Sensor } from "../../globe/platforms";
import { useI18n } from "../../i18n";
import { Claimed } from "../components/Claimed";
import { clipSeries, type YearSeries } from "../data/series";
import { useStoryText } from "../strings";
import type { ChartTarget } from "../types";
import { nearestYear, niceStep, spread } from "./chartMath";

const M = { top: 10, right: 96, bottom: 22, left: 40 };
const Y_TICKS = 4;
const MAX_X_TICKS = 6;
const LABEL_GAP = 13;
const DASH: Record<PlatformId, string | undefined> = { terra: undefined, aqua: "7 3", snpp: undefined, noaa20: "7 3", noaa21: "2 3" };

/** Dot for MODIS, triangle for VIIRS. Open (filled with the background) for a partial year. */
export function Marker({ sensor, x, y, open, r = 3.5 }: { sensor: Sensor; x: number; y: number; open?: boolean; r?: number }) {
  const color = SENSOR_COLOR[sensor];
  const fill = open ? "var(--bg)" : color;
  if (sensor === "MODIS") return <circle cx={x} cy={y} r={r} fill={fill} stroke={color} strokeWidth={1.5} />;
  const s = r * 1.35;
  return <path d={`M${x},${y - s} L${x + s * 0.95},${y + s * 0.75} L${x - s * 0.95},${y + s * 0.75} Z`} fill={fill} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />;
}

interface Props {
  series: YearSeries | null;
  target: ChartTarget;
  synthetic: boolean;
}

function ChartHeader({ synthetic = false }: { synthetic?: boolean }) {
  const { t } = useI18n();
  const s = useStoryText();
  return (
    <div className="story-chart-head">
      <h3>
        {s("chart.title")}
        {synthetic && <span className="story-synthetic">{s("synthetic.badge")}</span>}
      </h3>
      <ul className="story-legend" aria-label={s("chart.title")}>
        {(["MODIS", "VIIRS"] as const).map((sensor) => (
          <li key={sensor}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <Marker sensor={sensor} x={7} y={7} r={3.2} />
            </svg>
            {t(sensor === "MODIS" ? "globe.sensor.modis" : "globe.sensor.viirs")}
          </li>
        ))}
        <li>
          <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">
            <line x1="1" x2="21" y1="7" y2="7" stroke="var(--fg)" strokeWidth="3" />
          </svg>
          {s("chart.harmonized")}
        </li>
      </ul>
    </div>
  );
}

/** Mounts the measured plot only once there is data: the size hook needs its element to exist on first render. */
export function StageChart({ series, target, synthetic }: Props) {
  const s = useStoryText();
  const shown = target.visible > 0.01;
  if (!series?.years) {
    return (
      <div className="story-chart" style={{ opacity: target.visible, visibility: shown ? "visible" : "hidden" }} aria-hidden={!shown}>
        <ChartHeader />
        <p className="story-note">{s("chart.empty")}</p>
      </div>
    );
  }
  return <ChartBody series={series} years={series.years} target={target} synthetic={synthetic} />;
}

function ChartBody({ series, years, target, synthetic }: { series: YearSeries; years: [number, number]; target: ChartTarget; synthetic: boolean }) {
  const { t, lang } = useI18n();
  const s = useStoryText();
  const plot = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(plot);
  const [hover, setHover] = useState<number | null>(null);
  const shown = target.visible > 0.01;

  const geometry = useMemo(() => {
    const all = [...Object.values(series.raw).flat(), ...series.harmonized];
    const maxCount = Math.max(...all.map((p) => p.count), 1);
    const step = niceStep(maxCount, Y_TICKS);
    return { yMax: Math.ceil(maxCount / step) * step, step };
  }, [series]);

  let max: { year: number; id: PlatformId; count: number } | null = null;
  for (const id of PLATFORM_IDS) for (const p of series.raw[id]) if (!max || p.count > max.count) max = { year: p.year, id, count: p.count };

  const wrapStyle = { opacity: target.visible, visibility: shown ? ("visible" as const) : ("hidden" as const) };
  const header = <ChartHeader synthetic={synthetic} />;

  if (!max) {
    return (
      <div className="story-chart" style={wrapStyle} aria-hidden={!shown}>
        {header}
        <p className="story-note">{s("chart.empty")}</p>
      </div>
    );
  }

  const { yMax, step } = geometry;
  const [x0, x1] = years;
  const w = Math.max(width - M.left - M.right, 10);
  const h = Math.max(height - M.top - M.bottom, 10);
  const sx = (year: number) => M.left + (x1 === x0 ? w / 2 : ((year - x0) / (x1 - x0)) * w);
  const sy = (v: number) => M.top + h - (v / yMax) * h;
  const limit = x0 + target.reveal * (x1 - x0);
  const xStep = Math.max(1, Math.ceil((x1 - x0 + 1) / MAX_X_TICKS));
  const xTicks = Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).filter((y) => (y - x0) % xStep === 0);
  const yTicks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);

  const rawOpacity = 1 - target.harmonize;
  const lines = PLATFORM_IDS.filter((id) => series.raw[id].length > 0).map((id) => ({ id, points: series.raw[id] }));
  // The harmonized label joins the raw labels in one spread, so they can never overlap each other.
  const hEnd = series.harmonized[series.harmonized.length - 1];
  const labelY = spread(
    [...lines.map((l) => sy(l.points[l.points.length - 1].count)), ...(hEnd ? [sy(hEnd.count)] : [])],
    LABEL_GAP,
    M.top,
    M.top + h,
  );
  const polyline = (pts: { year: number; count: number }[]) => pts.map((p) => `${sx(p.year)},${sy(p.count)}`).join(" ");

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setHover(nearestYear(e.clientX - box.left, M.left, w, years));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const cur = hover ?? x1;
    setHover(Math.min(x1, Math.max(x0, cur + (e.key === "ArrowRight" ? 1 : -1))));
  };

  const hoverRows =
    hover === null
      ? []
      : [
          ...(rawOpacity > 0.5
            ? lines.flatMap(({ id, points }) => {
                const p = points.find((q) => q.year === hover);
                return p ? [{ key: id, sensor: SENSOR_OF[id], label: t(nameKey(id)), value: p.count, claim: "S-C01", partial: p.partial }] : [];
              })
            : []),
          ...(target.harmonize > 0.5
            ? series.harmonized.filter((p) => p.year === hover).map((p) => ({ key: "harm", sensor: null, label: s("chart.harmonized"), value: p.count, claim: "S-C02", partial: p.partial }))
            : []),
        ];

  return (
    <div className="story-chart" style={wrapStyle} aria-hidden={!shown}>
      {header}
      <div ref={plot} className="story-chart-plot">
        {width > 0 && height > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            tabIndex={shown ? 0 : -1}
            aria-label={s("chart.summary", { max_year: max.year, max_platform: t(nameKey(max.id)) })}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            onKeyDown={onKey}
            onBlur={() => setHover(null)}
          >
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={M.left} x2={M.left + w} y1={sy(v)} y2={sy(v)} className="story-grid" />
                <text x={M.left - 6} y={sy(v)} dy="0.32em" textAnchor="end" className="story-tick">
                  {formatNumber(v, lang, { notation: "compact" })}
                </text>
              </g>
            ))}
            {xTicks.map((y) => (
              <text key={y} x={sx(y)} y={height - 6} textAnchor="middle" className="story-tick">
                {y}
              </text>
            ))}

            {/* Raw lines: fade out as the harmonized line fades in. */}
            <g opacity={rawOpacity}>
              {lines.map(({ id, points }, i) => {
                const sensor = SENSOR_OF[id];
                const shownPts = clipSeries(points, limit);
                const end = points[points.length - 1];
                return (
                  <g key={id}>
                    {shownPts.length > 1 && (
                      <polyline points={polyline(shownPts)} fill="none" stroke={SENSOR_COLOR[sensor]} strokeWidth={2} strokeDasharray={DASH[id]} strokeLinejoin="round" />
                    )}
                    {points.filter((p) => p.year <= limit).map((p) => (
                      <Marker key={p.year} sensor={sensor} x={sx(p.year)} y={sy(p.count)} open={p.partial} r={2.6} />
                    ))}
                    {limit >= end.year && (
                      <g>
                        <Marker sensor={sensor} x={sx(end.year) + 9} y={labelY[i]} r={2.6} />
                        <text x={sx(end.year) + 18} y={labelY[i]} dy="0.32em" className="story-label">
                          {t(nameKey(id))}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Harmonized line: one line in the text colour, so it reads as "the" series. */}
            <g opacity={target.harmonize}>
              {series.harmonized.length > 0 && (
                <>
                  <polyline points={polyline(clipSeries(series.harmonized, limit))} fill="none" stroke="var(--fg)" strokeWidth={2.75} strokeLinejoin="round" />
                  {limit >= hEnd.year && (
                    <text x={sx(hEnd.year) + 8} y={labelY[lines.length]} dy="0.32em" className="story-label">
                      {s("chart.harmonized_short")}
                    </text>
                  )}
                </>
              )}
            </g>

            {hover !== null && (
              <line x1={sx(hover)} x2={sx(hover)} y1={M.top} y2={M.top + h} className="story-crosshair" />
            )}
          </svg>
        )}
        {hover !== null && hoverRows.length > 0 && (
          <div className="story-tooltip" role="status">
            <strong>{s("chart.hover", { year: hover })}</strong>
            <ul>
              {hoverRows.map((r) => (
                <li key={r.key}>
                  {r.sensor && (
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <Marker sensor={r.sensor} x={6} y={6} r={2.6} open={r.partial} />
                    </svg>
                  )}
                  <span>{r.label}</span>
                  <Claimed id={r.claim}>{formatNumber(r.value, lang)}</Claimed>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <p className="story-note">{s("chart.partial")}</p>
      <table className="story-sr-only">
        <caption>{s("chart.table_caption")}</caption>
        <thead>
          <tr>
            <th>{s("chart.table_year")}</th>
            {lines.map(({ id }) => (
              <th key={id}>{t(nameKey(id))}</th>
            ))}
            <th>{s("chart.harmonized")}</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).map((year) => (
            <tr key={year}>
              <th>{year}</th>
              {lines.map(({ id, points }) => {
                const p = points.find((q) => q.year === year);
                return <td key={id}>{p ? <Claimed id="S-C01">{formatNumber(p.count, lang)}</Claimed> : ""}</td>;
              })}
              <td>
                {(() => {
                  const p = series.harmonized.find((q) => q.year === year);
                  return p ? <Claimed id="S-C02">{formatNumber(p.count, lang)}</Claimed> : "";
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
