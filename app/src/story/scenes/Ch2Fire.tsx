/**
 * Chapter 2. How satellites feel fire, on ONE screen. Middle: the mechanism (a swath sweeps the ground and the same
 * fire lights up as a big MODIS dot and a small VIIRS triangle). Left and right: what each sensor is good at. Below:
 * a history line per satellite: launch year (real data, claim S-C10) and where it stops working (no retirement dates
 * are printed, they are still [verify]). Wide screens show everything at once, entering in turn; phones show the three
 * parts one at a time as you scroll. Reduced motion / ?lite=1: the finished picture (everything on wide screens).
 */
import { useMemo, useRef } from "react";
import { useElementSize } from "../../globe/env";
import { readParam } from "../engine/env";
import { Claimed } from "../components/Claimed";
import { useLaunchDates } from "../data/adapters";
import { decimalYear, LIFECYCLE } from "../data/handover";
import type { PlatformId } from "../../globe/platforms";
import { SENSOR_OF } from "../../globe/platforms";
import type { StageProps } from "../types";
import { Beat, easeOut, Icon, mix, PlayPause, ramp, sceneText, SensorTag, usePlayback, win } from "./kit";

const EMBER = { x: 215, y: 150 };
const BAND_W = 74;

function Triangle({ x, y, r }: { x: number; y: number; r: number }) {
  return <path d={`M${x},${y - r} L${x + r * 0.95},${y + r * 0.78} L${x - r * 0.95},${y + r * 0.78} Z`} fill="var(--story-ember)" stroke="var(--story-viirs-bright)" strokeWidth="3" strokeLinejoin="round" />;
}

export function Field({ loop }: { loop: number }) {
  const t1 = easeOut(ramp(loop, 0.05, 0.4));
  const t2 = easeOut(ramp(loop, 0.45, 0.8));
  const x1 = mix(-110, 520, t1);
  const x2 = mix(-110, 520, t2);
  const modisOn = ramp(x1, EMBER.x - 10, EMBER.x + 30);
  const viirsOn = ramp(x2, EMBER.x - 10, EMBER.x + 30);
  const fade = 1 - ramp(loop, 0.96, 1);
  const band = (x: number, color: string, on: boolean) =>
    on && x > -100 && x < 510 ? (
      <g transform={`translate(${x} 0) skewX(-12)`}>
        <rect x={-BAND_W / 2} y="-10" width={BAND_W} height="320" rx="22" fill={color} fillOpacity="0.16" stroke={color} strokeWidth="3" />
      </g>
    ) : null;
  return (
    <svg className="c2-field" viewBox="0 0 430 300" role="img" aria-label="A band sweeps a dark field. The same fire lights up as a big dot for MODIS and a small triangle for VIIRS." focusable="false">
      <defs>
        <clipPath id="c2-clip">
          <rect x="2" y="2" width="426" height="296" rx="26" />
        </clipPath>
      </defs>
      <rect x="2" y="2" width="426" height="296" rx="26" fill="var(--story-plate)" />
      <g opacity={fade} clipPath="url(#c2-clip)">
        {band(x1, "var(--story-modis)", t1 > 0 && t1 < 1)}
        {band(x2, "var(--story-viirs-bright)", t2 > 0 && t2 < 1)}
        <circle cx={EMBER.x} cy={EMBER.y} r="7" fill="var(--story-ember)" stroke="var(--story-ink)" strokeWidth="2" />
        <g opacity={modisOn} transform={`translate(${EMBER.x} ${EMBER.y}) scale(${mix(0.4, 1, easeOut(modisOn))}) translate(${-EMBER.x} ${-EMBER.y})`}>
          <circle cx={EMBER.x} cy={EMBER.y} r="52" fill="var(--story-ember)" fillOpacity="0.16" />
          <circle cx={EMBER.x} cy={EMBER.y} r="34" fill="var(--story-ember)" stroke="var(--story-modis)" strokeWidth="3" />
        </g>
        <g opacity={viirsOn} transform={`translate(${EMBER.x} ${EMBER.y}) scale(${mix(0.4, 1, easeOut(viirsOn))}) translate(${-EMBER.x} ${-EMBER.y})`}>
          <Triangle x={EMBER.x} y={EMBER.y} r={13} />
        </g>
      </g>
      <rect x="2" y="2" width="426" height="296" rx="26" fill="none" stroke="var(--story-hairline)" strokeWidth="3" />
    </svg>
  );
}

const MODIS_ROWS: { icon: "heat" | "pair" | "record"; text: string }[] = [
  { icon: "heat", text: "Coarser pixels, bigger dots" },
  { icon: "pair", text: "Two satellites: Terra and Aqua" },
  { icon: "record", text: "A long, steady record" },
];
const VIIRS_ROWS: { icon: "heat" | "pair" | "record"; text: string }[] = [
  { icon: "heat", text: "Finer pixels, smaller dots" },
  { icon: "pair", text: "Three satellites fly it" },
  { icon: "record", text: "Newest eyes, still flying" },
];

function Specialty({ sensor, rows }: { sensor: "MODIS" | "VIIRS"; rows: typeof MODIS_ROWS }) {
  return (
    <section className={`c2-card c2-card-${sensor.toLowerCase()}`}>
      <SensorTag sensor={sensor} />
      <ul>
        {rows.map((r) => (
          <li key={r.text}>
            <Icon name={r.icon} />
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const ORDER: { platform: PlatformId; name: string }[] = [
  { platform: "terra", name: "Terra" },
  { platform: "aqua", name: "Aqua" },
  { platform: "snpp", name: "Suomi NPP" },
  { platform: "noaa20", name: "NOAA-20" },
  { platform: "noaa21", name: "NOAA-21" },
];
const AX = { from: 1998, to: 2029 };
const place = (year: number) => ((year - AX.from) / (AX.to - AX.from)) * 100;

/** Launch to stop for each satellite. Stop positions are drawn from the story's lifecycle file but never printed. */
function History({ t, draw }: { t: (k: "c2History" | "c2Launch" | "c2Stop" | "c2RetireSoon" | "c2Ended" | "c2Going") => string; draw: number }) {
  const launches = useLaunchDates();
  const launch = launches.status === "ok" ? launches.data : {};
  const end = (id: PlatformId): { at: number | null; label: "c2RetireSoon" | "c2Ended" | "c2Going" } => {
    const e = (LIFECYCLE.platforms as Record<string, { end?: string; endKind?: string }>)[id];
    if (e?.end) return { at: decimalYear(e.end), label: e.endKind === "planned" ? "c2RetireSoon" : "c2Ended" };
    return { at: null, label: "c2Going" };
  };
  return (
    <section className="c2-history" aria-label={t("c2History")}>
      <ol>
        {ORDER.map((r, i) => {
          const y = launch[r.platform] ? decimalYear(launch[r.platform].slice(0, 10)) : null;
          const e = end(r.platform);
          const stop = e.at ?? AX.to - 0.5;
          const vis = easeOut(ramp(draw, i * 0.1, 0.5 + i * 0.1));
          const sensor = SENSOR_OF[r.platform].toLowerCase();
          return (
            <li key={r.platform} className={`c2-row c2-${sensor}`}>
              <span className="c2-name">{r.name}</span>
              <span className="c2-track">
                {y !== null && (
                  <>
                    <span className="c2-line" style={{ left: `${place(y)}%`, width: `${(place(stop) - place(y)) * vis}%` }} />
                    <span className="c2-dot c2-dot-start" style={{ left: `${place(y)}%`, opacity: vis }} />
                    {vis > 0.9 && <span className={`c2-dot c2-dot-stop${e.at === null ? " is-going" : ""}`} style={{ left: `${place(stop)}%` }} />}
                  </>
                )}
              </span>
              <span className="c2-note">
                {y !== null && (
                  <>
                    {t("c2Launch")} <Claimed id="S-C10">{Math.floor(y)}</Claimed> ·{" "}
                  </>
                )}
                {t(e.label)}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="c2-axis" aria-hidden="true">
        {[2000, 2010, 2020].map((yr) => (
          <span key={yr} style={{ left: `${place(yr)}%` }}>
            {yr}
          </span>
        ))}
      </div>
    </section>
  );
}

export function Ch2Fire({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;
  const box = useRef<HTMLDivElement>(null);
  const { width: w } = useElementSize(box);
  const wide = w >= 900;
  const frozen = useMemo(() => {
    const v = readParam("loop");
    return v !== null && v !== "" && Number.isFinite(Number(v)) ? Math.min(1, Math.max(0, Number(v))) : null;
  }, []);
  const pb = usePlayback({ still, active: true, seconds: 9, key: "c2", rest: 0.9, frozen });

  // Wide: three parts enter in turn and stay. Narrow: one part at a time.
  const vMech = wide ? (still ? 1 : ramp(p, 0.02, 0.16)) : still ? 1 : win(p, -0.1, 0.36, 0.07);
  const vSpec = wide ? (still ? 1 : ramp(p, 0.18, 0.34)) : still ? 0 : win(p, 0.33, 0.69, 0.07);
  const vHist = wide ? (still ? 1 : ramp(p, 0.36, 0.52)) : still ? 0 : ramp(p, 0.66, 0.76);
  const draw = still ? 1 : wide ? ramp(p, 0.4, 0.75) : ramp(p, 0.68, 0.95);
  const show = (v: number) => ({ opacity: v, visibility: v > 0.01 ? ("visible" as const) : ("hidden" as const), transform: `translateY(${(1 - easeOut(v)) * 18}px)` });

  return (
    <div className={`c c2${wide ? " is-wide" : ""}`}>
      <Beat v={still ? 1 : win(p, -0.1, 1.1, 0.06)} headline={t("c2Head")} line={t("c2Line")} />
      <div className="c-body c2-body" ref={box}>
        <div className="c2-top">
          <div className="c2-left" style={show(vSpec)}>
            <Specialty sensor="MODIS" rows={MODIS_ROWS} />
          </div>
          <div className="c2-mid" style={show(vMech)}>
            <Field loop={pb.phase} />
          </div>
          <div className="c2-right" style={show(vSpec)}>
            <Specialty sensor="VIIRS" rows={VIIRS_ROWS} />
          </div>
        </div>
        <div className="c2-bottom" style={show(vHist)}>
          <History t={t} draw={draw} />
        </div>
      </div>
      {vMech > 0.3 && pb.canPause && <PlayPause paused={pb.paused} onToggle={pb.toggle} label={pb.paused ? t("play") : t("pause")} />}
    </div>
  );
}
