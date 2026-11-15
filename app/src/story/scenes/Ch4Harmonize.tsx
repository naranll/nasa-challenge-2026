/**
 * Chapter 4, "How we harmonize".
 *  A. Two original line-art hands reach toward each other (an homage to the idea of "Creation of Adam", not a trace and
 *     not its figures): left teal = MODIS, right indigo = VIIRS, fingertips almost touching.
 *  B. Warm white light (flat wedges, not ember) streams out of the gap and spreads.
 *  C. The light becomes the composition: five steps (Collect, Align, Clean, Calibrate, Verify) and a raw jagged line that
 *     turns into one smooth line with an (illustrative) band. It loops by itself; there is a pause/play.
 * Reduced motion / ?lite=1: the final frame (C, fully drawn), no motion.
 */
import { useMemo } from "react";
import { readParam } from "../engine/env";
import { useCalendar } from "../data/adapters";
import { chainRawYearly, type ChainPoint } from "../data/handover";
import { harmonizedYearly } from "../data/series";
import { SENSOR_OF } from "../../globe/platforms";
import { Beat, easeOut, Icon, mix, PlayPause, ramp, sceneText, usePlayback, win } from "./kit";
import type { StageProps } from "../types";

const WARM = "#ffe6ad"; // warm white: the light is not ember (ember is fire only)

/** One hand, pointing right, fingertip at (290, 60). Original shapes: sleeve, back of hand, curled fingers, thumb, index. */
function Hand({ stroke, fill, droop }: { stroke: string; fill: string; droop: number }) {
  const p = { stroke, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const, fill, fillOpacity: 0.34 };
  return (
    <g>
      <path d="M2,28 Q-8,74 2,124 L60,114 Q70,74 60,36 Z" {...p} />
      <path d="M60,36 C92,16 152,14 190,34 C202,48 202,94 188,108 C152,126 98,124 60,114 Q70,74 60,36 Z" {...p} />
      <ellipse cx="182" cy="112" rx="24" ry="9.5" {...p} />
      <ellipse cx="184" cy="100" rx="26" ry="9.5" {...p} />
      <ellipse cx="184" cy="88" rx="26" ry="9.5" {...p} />
      <path d="M88,114 C100,142 152,144 176,122 C160,120 142,124 126,114 Z" {...p} />
      <g transform={`rotate(${droop} 176 60)`}>
        <path d="M174,42 C208,42 258,48 288,55 C300,59 300,71 288,75 C258,81 208,86 174,84 Z" {...p} />
        <path d="M206,62 H268" stroke={stroke} strokeWidth="2" opacity="0.45" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

const GAP = 30; // space between the fingertips when the hands have met
const TIP = 290;
const MEET_X = 400 - GAP / 2 - TIP; // left hand's translate when met

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
const H = 200;
const PAD = { l: 8, r: 8, t: 12, b: 10 };
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
  const upper = pts.map(([x, y]) => [x, y - (H - PAD.t - PAD.b) * BAND_SHARE * 0.5 * bandOn] as [number, number]);
  const lower = pts.map(([x, y]) => [x, y + (H - PAD.t - PAD.b) * BAND_SHARE * 0.5 * bandOn] as [number, number]);
  const band = `${smoothPath(upper, morph)} L${lower[lower.length - 1][0].toFixed(1)},${lower[lower.length - 1][1].toFixed(1)} ${smoothPath([...lower].reverse(), morph).replace(/^M[^C]*/, "")} Z`;
  return (
    <svg className="s4-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart: a jagged raw line becomes one smooth harmonized line with a band" preserveAspectRatio="none">
      <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="18" fill="var(--story-plate)" stroke="var(--story-hairline)" strokeWidth="3" />
      {bandOn > 0.01 && <path d={band} fill="var(--story-cream)" opacity={0.16 * bandOn} />}
      {/* raw: coloured by sensor, fades as the line smooths */}
      <g opacity={1 - morph} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {chain.slice(1).map((c, i) => (
          <line key={c.year} x1={pts[i][0]} y1={pts[i][1]} x2={pts[i + 1][0]} y2={pts[i + 1][1]} stroke={SENSOR_OF[c.platform] === "MODIS" ? "var(--story-modis)" : "var(--story-viirs-bright)"} />
        ))}
      </g>
      <path d={line} fill="none" stroke="var(--story-cream)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity={morph} />
    </svg>
  );
}

const STEPS = ["collect", "align", "clean", "calibrate", "verify"] as const;
const LOOP_SECONDS = 9;

export function Ch4Harmonize({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;
  const calendar = useCalendar();
  const data = useMemo(() => {
    if (calendar.status !== "ok") return null;
    return { chain: chainRawYearly(calendar.data), harm: harmonizedYearly(calendar.data), synthetic: calendar.data.synthetic === true };
  }, [calendar]);

  const frozen = useMemo(() => {
    const v = readParam("loop");
    return v !== null && v !== "" && Number.isFinite(Number(v)) ? Math.min(1, Math.max(0, Number(v))) : null;
  }, []);
  const inC = p > 0.56;
  const pb = usePlayback({ still, active: inC, seconds: LOOP_SECONDS, key: "ch4", rest: 0.9, frozen });
  const loop = pb.phase;

  // beats by scroll
  const A = still ? 0 : win(p, -0.1, 0.3, 0.06);
  const B = still ? 0 : win(p, 0.28, 0.6, 0.06);
  const C = still ? 1 : ramp(p, 0.54, 0.64);
  const meet = still ? 1 : easeOut(ramp(p, 0.02, 0.22));
  const hands = still ? 0 : Math.max(A, B * 0.9);
  const tx = mix(-330, MEET_X, meet);
  const grow = still ? 0 : easeOut(ramp(p, 0.3, 0.5));
  const lights = still ? 0 : B * (1 - ramp(p, 0.54, 0.62));

  // loop: steps light up one after another, the line smooths, the band appears
  const stepProgress = still ? 5 : ramp(loop, 0.08, 0.55) * 5;
  const morph = still ? 1 : easeOut(ramp(loop, 0.45, 0.8));
  const bandOn = still ? 1 : ramp(loop, 0.7, 0.85);
  const loopFade = still ? 1 : 1 - ramp(loop, 0.96, 1);

  return (
    <div className="s4">
      <Beat v={A} headline={t("harmHeadA")} line={t("harmLineA")} />
      <Beat v={B} headline={t("harmHeadB")} line={t("harmLineB")} />
      <Beat v={C} headline={t("harmHeadC")} line={t("harmLineC")} />

      {/* A and B: hands and light */}
      <svg className="s4-hands" viewBox="90 90 620 240" style={{ opacity: hands, visibility: hands > 0.01 ? "visible" : "hidden" }} aria-hidden="true" focusable="false">
        <g opacity={lights}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = ((i - 4) / 4) * 1.1 + Math.PI / 2; // fan, mostly sideways and up/down
            const spread = 0.045 + 0.015 * (i % 2);
            const len = 90 + grow * (i % 3 === 0 ? 420 : 300);
            const cx = 400;
            const cy = 206;
            const dir = (ang: number) => [cx + Math.cos(ang) * len, cy - Math.sin(ang) * len];
            const [x1, y1] = dir(a - spread);
            const [x2, y2] = dir(a + spread);
            const [x3, y3] = dir(a + Math.PI - spread);
            const [x4, y4] = dir(a + Math.PI + spread);
            return (
              <g key={i} fill={WARM} opacity={0.34 + 0.12 * (i % 2)}>
                <polygon points={`${cx},${cy} ${x1},${y1} ${x2},${y2}`} />
                <polygon points={`${cx},${cy} ${x3},${y3} ${x4},${y4}`} />
              </g>
            );
          })}
          <circle cx="400" cy="206" r={8 + grow * 30} fill={WARM} opacity={0.9} />
        </g>
        <g transform={`translate(${tx} 150)`}>
          <Hand stroke="var(--story-modis)" fill="var(--story-modis-deep)" droop={7} />
        </g>
        <g transform={`translate(${800 - tx} 150) scale(-1 1)`}>
          <Hand stroke="var(--story-viirs-bright)" fill="var(--story-viirs-deep)" droop={-2} />
        </g>
      </svg>

      {/* C: the composition */}
      <div className="s4-flow" style={{ opacity: C * loopFade, visibility: C > 0.01 ? "visible" : "hidden", transform: `translateY(${(1 - easeOut(C)) * 24}px)` }}>
        {data ? <Chart chain={data.chain} harm={data.harm} morph={morph} bandOn={bandOn} /> : <p className="s4-empty">…</p>}
        <ol className="s4-steps">
          {STEPS.map((k, i) => {
            const reached = stepProgress - i;
            const on = reached > 0;
            return (
              <li key={k} className={on ? "is-on" : ""} style={{ transform: `scale(${mix(0.94, 1, smooth01(reached))})` }}>
                <span className="s4-num">{on && reached >= 1 ? <Icon name="check" /> : i + 1}</span>
                {t(k)}
              </li>
            );
          })}
        </ol>
        <p className="s4-legend">
          <span className="s4-key s4-raw" /> {t("rawLine")} <span className="s4-key s4-smooth" /> {t("smoothLine")} <span className="s4-key s4-band" /> {t("band")}
          {data?.synthetic && <span className="s4-badge">{t("fixture")}</span>}
        </p>
      </div>

      {inC && pb.canPause && <PlayPause paused={pb.paused} onToggle={pb.toggle} label={pb.paused ? t("play") : t("pause")} />}
    </div>
  );
}

const smooth01 = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};
