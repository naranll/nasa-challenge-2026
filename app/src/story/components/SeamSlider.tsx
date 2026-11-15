/**
 * Chapter 8, the Seam Slider (a minimal local version; none exists in the app yet). One chart, two records: to the
 * left of the handle the raw record as the reference chain recorded it (coloured by sensor, so the seam shows),
 * to the right the harmonized record. Drag the plot or use the range input (keyboard and screen readers).
 * Built from the calendar file; a seam/seam_demo.json is not in the repo. Uncertainty is not drawn.
 */
import { useId, useMemo, useRef, useState, type PointerEvent } from "react";
import { useElementSize } from "../../globe/env";
import { formatNumber } from "../../globe/format";
import { SENSOR_OF } from "../../globe/platforms";
import { useI18n } from "../../i18n";
import { Marker } from "../engine/StageChart";
import { niceStep } from "../engine/chartMath";
import { useCalendar } from "../data/adapters";
import { chainRawYearly, seamYear } from "../data/handover";
import { harmonizedYearly } from "../data/series";
import { useStoryText } from "../strings";
import { Claimed } from "./Claimed";

const M = { top: 18, right: 12, bottom: 22, left: 42 };
const SENSOR_VAR = { MODIS: "var(--story-modis)", VIIRS: "var(--story-viirs)" } as const;

/** Where the handle rests while the chapter scrolls and the visitor has not touched it. */
export function autoPosition(progress: number, still: boolean): number {
  if (still) return 50;
  return 15 + 70 * Math.min(1, Math.max(0, progress));
}

interface SliderData {
  chain: ReturnType<typeof chainRawYearly>;
  harmonized: ReturnType<typeof harmonizedYearly>;
  x0: number;
  x1: number;
  yMax: number;
  step: number;
  seam: number | null;
  synthetic: boolean;
}

/** Loads and shapes the data. The measured plot mounts only once there is data (the size hook needs its element). */
export function SeamSlider({ progress, still }: { progress: number; still: boolean }) {
  const s = useStoryText();
  const calendar = useCalendar();

  const data = useMemo((): SliderData | null => {
    if (calendar.status !== "ok") return null;
    const chain = chainRawYearly(calendar.data);
    const harmonized = harmonizedYearly(calendar.data);
    const years = [...chain, ...harmonized].map((p) => p.year);
    if (!years.length) return null;
    const max = Math.max(...chain.map((p) => p.count), ...harmonized.map((p) => p.count), 1);
    const step = niceStep(max, 4);
    return { chain, harmonized, x0: Math.min(...years), x1: Math.max(...years), yMax: Math.ceil(max / step) * step, step, seam: seamYear(chain), synthetic: calendar.data.synthetic === true };
  }, [calendar]);

  if (!data) return <p className="story-note">{calendar.status === "loading" ? s("loading") : s("slider.empty")}</p>;
  return <SliderBody data={data} progress={progress} still={still} />;
}

function SliderBody({ data, progress, still }: { data: SliderData; progress: number; still: boolean }) {
  const { lang } = useI18n();
  const s = useStoryText();
  const uid = useId().replace(/:/g, "");
  const box = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(box);
  const [touched, setTouched] = useState<number | null>(null);

  const pos = touched ?? autoPosition(progress, still);
  const w = Math.max(width - M.left - M.right, 10);
  const h = Math.max(height - M.top - M.bottom, 10);
  const span = Math.max(data.x1 - data.x0, 1);
  const sx = (year: number) => M.left + ((year - data.x0) / span) * w;
  const sy = (v: number) => M.top + h - (v / data.yMax) * h;
  const xh = M.left + (pos / 100) * w;
  const yearAt = Math.round(data.x0 + (pos / 100) * span);
  const rawAt = data.chain.find((p) => p.year === yearAt);
  const harmAt = data.harmonized.find((p) => p.year === yearAt);
  const yTicks = Array.from({ length: Math.round(data.yMax / data.step) + 1 }, (_, i) => i * data.step);
  const xStep = Math.max(1, Math.ceil((span + 1) / 6));
  const xTicks = Array.from({ length: span + 1 }, (_, i) => data.x0 + i).filter((y) => (y - data.x0) % xStep === 0);

  const rawSegments = data.chain.slice(1).map((p, i) => ({ from: data.chain[i], to: p }));
  const harmPoints = data.harmonized.map((p) => `${sx(p.year)},${sy(p.count)}`).join(" ");

  const setFromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setTouched(Math.min(100, Math.max(0, ((e.clientX - box.left - M.left) / w) * 100)));
  };

  const rawLines = (opacity: number, clip: string) => (
    <g opacity={opacity} clipPath={`url(#${clip})`}>
      {rawSegments.map(({ from, to }) => (
        <line key={to.year} x1={sx(from.year)} y1={sy(from.count)} x2={sx(to.year)} y2={sy(to.count)} stroke={SENSOR_VAR[SENSOR_OF[to.platform]]} strokeWidth={1.4} />
      ))}
      {data.chain.map((p) => (
        <Marker key={p.year} sensor={SENSOR_OF[p.platform]} x={sx(p.year)} y={sy(p.count)} r={2.2} open={p.partial} />
      ))}
    </g>
  );
  const harmLine = (opacity: number, clip: string) => (
    <g opacity={opacity} clipPath={`url(#${clip})`}>
      <polyline points={harmPoints} fill="none" stroke="var(--story-cream)" strokeWidth={2} strokeLinejoin="round" />
    </g>
  );

  return (
    <figure className="story-slider">
      <figcaption className="story-eyebrow-sm">
        {s("slider.label")}
        {data.synthetic && <span className="story-synthetic">{s("synthetic.badge")}</span>}
      </figcaption>
      <div ref={box} className="story-slider-plot">
        {width > 0 && height > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={s("slider.summary")}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setFromPointer(e);
            }}
            onPointerMove={(e) => e.buttons > 0 && setFromPointer(e)}
          >
            <defs>
              <clipPath id={`${uid}-l`}>
                <rect x={0} y={0} width={xh} height={height} />
              </clipPath>
              <clipPath id={`${uid}-r`}>
                <rect x={xh} y={0} width={Math.max(width - xh, 0)} height={height} />
              </clipPath>
            </defs>
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

            {/* each record faint everywhere, bright on its own side of the handle */}
            {rawLines(0.18, `${uid}-r`)}
            {harmLine(0.18, `${uid}-l`)}
            {rawLines(1, `${uid}-l`)}
            {harmLine(1, `${uid}-r`)}

            {data.seam !== null && (
              <g>
                <line x1={sx(data.seam)} x2={sx(data.seam)} y1={M.top} y2={M.top + h} className="story-crosshair" />
                <text x={sx(data.seam) + 4} y={M.top + h - 6} className="story-label">
                  {s("slider.seam")} <Claimed id="S-C16" as="tspan">{data.seam}</Claimed>
                </text>
              </g>
            )}

            <line x1={xh} x2={xh} y1={M.top - 6} y2={M.top + h} stroke="var(--story-cream)" strokeWidth={1.5} />
            <circle cx={xh} cy={M.top + h / 2} r={7} fill="var(--story-ink)" stroke="var(--story-cream)" strokeWidth={1.5} />
            <text x={Math.max(xh - 6, M.left + 60)} y={10} textAnchor="end" className="story-label">
              {s("slider.raw")}
            </text>
            <text x={Math.min(xh + 6, width - 70)} y={10} className="story-label">
              {s("slider.harmonized")}
            </text>
          </svg>
        )}
      </div>

      <input
        type="range"
        className="story-range"
        min={0}
        max={100}
        step={1}
        value={Math.round(pos)}
        aria-label={s("slider.aria")}
        aria-valuetext={String(yearAt)}
        onChange={(e) => setTouched(Number(e.target.value))}
      />
      <p className="story-readout" role="status">
        {yearAt}
        {rawAt && (
          <>
            {" · "}
            {s("slider.raw")} <Claimed id="S-C16">{formatNumber(rawAt.count, lang)}</Claimed>
          </>
        )}
        {harmAt && (
          <>
            {" · "}
            {s("slider.harmonized")} <Claimed id="S-C16">{formatNumber(harmAt.count, lang)}</Claimed>
          </>
        )}
      </p>
      <p className="story-note">{s("slider.note")}</p>
    </figure>
  );
}
