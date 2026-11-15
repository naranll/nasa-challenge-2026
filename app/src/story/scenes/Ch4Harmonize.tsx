/**
 * Chapter 4. Our harmonization at the centre: a chart where the jagged raw line becomes one smooth line with an
 * (illustrative) band. The five workflow steps are written around it and light up in order as you scroll.
 * Wide screens: steps left, right and below the figure. Phones: figure on top, steps listed under it.
 * Reduced motion / ?lite=1: the finished figure with every step on.
 */
import { useMemo, useRef } from "react";
import { useElementSize } from "../../globe/env";
import { SENSOR_OF } from "../../globe/platforms";
import { useCalendar } from "../data/adapters";
import { chainRawYearly, type ChainPoint } from "../data/handover";
import { harmonizedYearly } from "../data/series";
import type { StageProps } from "../types";
import { Beat, easeOut, Icon, mix, ramp, sceneText, win } from "./kit";

/** Catmull-Rom to Bezier. `s` = 0 gives straight segments (a jagged line), s = 1 a smooth curve. */
export function smoothPath(pts: [number, number][], s: number): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1: [number, number] = [p1[0] + ((p2[0] - p0[0]) / 6) * s, p1[1] + ((p2[1] - p0[1]) / 6) * s];
    const c2: [number, number] = [p2[0] - ((p3[0] - p1[0]) / 6) * s, p2[1] - ((p3[1] - p1[1]) / 6) * s];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

const W = 400;
const H = 220;
const PAD = { l: 10, r: 10, t: 14, b: 12 };
/** The illustrative band is this share of the line's height on each side. It is not a measured uncertainty. */
export const BAND_SHARE = 0.12;

function Chart({ chain, harm, morph, bandOn }: { chain: ChainPoint[]; harm: { year: number; count: number }[]; morph: number; bandOn: number }) {
  const years = [...chain.map((c) => c.year), ...harm.map((h) => h.year)];
  const x0 = Math.min(...years);
  const x1 = Math.max(...years);
  const max = Math.max(...chain.map((c) => c.count), ...harm.map((h) => h.count), 1);
  const sx = (y: number) => PAD.l + ((y - x0) / Math.max(1, x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);
  const harmAt = new Map(harm.map((h) => [h.year, h.count]));
  const pts = chain.map((c) => [sx(c.year), sy(mix(c.count, harmAt.get(c.year) ?? c.count, morph))] as [number, number]);
  const line = smoothPath(pts, morph);
  const half = (H - PAD.t - PAD.b) * BAND_SHARE * 0.5 * bandOn;
  const upper = pts.map(([x, y]) => [x, y - half] as [number, number]);
  const lower = pts.map(([x, y]) => [x, y + half] as [number, number]);
  const band = `${smoothPath(upper, morph)} L${lower[lower.length - 1][0].toFixed(1)},${lower[lower.length - 1][1].toFixed(1)} ${smoothPath([...lower].reverse(), morph).replace(/^M[^C]*/, "")} Z`;
  return (
    <svg className="c4-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart: a jagged raw line becomes one smooth harmonized line with a band" preserveAspectRatio="none">
      <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="18" fill="var(--story-plate)" stroke="var(--story-hairline)" strokeWidth="3" />
      {bandOn > 0.01 && <path d={band} fill="var(--story-cream)" opacity={0.16 * bandOn} />}
      <g opacity={1 - morph} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {chain.slice(1).map((c, i) => (
          <line key={c.year} x1={pts[i][0]} y1={pts[i][1]} x2={pts[i + 1][0]} y2={pts[i + 1][1]} stroke={SENSOR_OF[c.platform] === "MODIS" ? "var(--story-modis)" : "var(--story-viirs-bright)"} />
        ))}
      </g>
      <path d={line} fill="none" stroke="var(--story-cream)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity={morph} />
    </svg>
  );
}

const STEPS = [
  { k: "collect", d: "c4Collect", area: "a" },
  { k: "align", d: "c4Align", area: "b" },
  { k: "calibrate", d: "c4Calibrate", area: "d" },
  { k: "chain", d: "c4Chain", area: "e" },
  { k: "verify", d: "c4Verify", area: "f" },
] as const;

export function Ch4Harmonize({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;
  const box = useRef<HTMLDivElement>(null);
  const { width: w } = useElementSize(box);
  const wide = w >= 900;
  const calendar = useCalendar();
  const data = useMemo(() => {
    if (calendar.status !== "ok") return null;
    return { chain: chainRawYearly(calendar.data), harm: harmonizedYearly(calendar.data), synthetic: calendar.data.synthetic === true };
  }, [calendar]);

  const head = still ? 1 : win(p, -0.1, 1.1, 0.06);
  const show = still ? 1 : easeOut(ramp(p, 0.02, 0.16));
  const steps = still ? 5 : ramp(p, 0.14, 0.82) * 5; // each step lights as the line is built
  const morph = still ? 1 : easeOut(ramp(p, 0.3, 0.66));
  const bandOn = still ? 1 : ramp(p, 0.66, 0.84);

  return (
    <div className={`c c4${wide ? " is-wide" : ""}`}>
      <Beat v={head} headline={t("c4Head")} line={t("c4Line")} />
      <div className="c-body c4-body" ref={box} style={{ opacity: show }}>
        <div className="c4-center">
          {data ? <Chart chain={data.chain} harm={data.harm} morph={morph} bandOn={bandOn} /> : <p className="c4-empty">…</p>}
          <p className="c4-legend">
            <span className="c4-key c4-raw" /> {t("rawLine")} <span className="c4-key c4-smooth" /> {t("smoothLine")} <span className="c4-key c4-band" /> {t("band")}
            {data?.synthetic && <span className="c4-badge">{t("fixture")}</span>}
          </p>
        </div>
        {STEPS.map((s, i) => {
          const reached = steps - i;
          const on = reached > 0;
          return (
            <section key={s.k} className={`c4-step c4-${s.area}${on ? " is-on" : ""}`} style={{ opacity: mix(0.45, 1, Math.min(1, Math.max(0, reached))), transform: `translateY(${(1 - Math.min(1, Math.max(0, reached + 0.4))) * 10}px)` }}>
              <h3>
                <span className="c4-num">{on && reached >= 1 ? <Icon name="check" /> : i + 1}</span>
                {t(s.k)}
              </h3>
              <p>{t(s.d)}</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
