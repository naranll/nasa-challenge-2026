/**
 * Chapter 2, "How a satellite feels fire". A bare dark field: no globe, no map, one ember. At most two graphics:
 *  1. A swath sweeps the field (teal = MODIS, then indigo = VIIRS); the same ember lights up as a big MODIS dot and a
 *     small VIIRS triangle. Time-based loop with pause/play.
 *  2. "Same fire, two views": the two marks side by side, each in the size of ground cell that sensor reports.
 * Simplified illustration; no numbers. Reduced motion / ?lite=1: graphic 2 as a still picture.
 */
import { readParam } from "../engine/env";
import { useMemo } from "react";
import { Beat, easeOut, mix, PlayPause, ramp, sceneText, SensorTag, usePlayback, win } from "./kit";
import type { StageProps } from "../types";

const EMBER = { x: 215, y: 150 };
const LOOP_SECONDS = 9;
const BAND_W = 74;

function Triangle({ x, y, r }: { x: number; y: number; r: number }) {
  return <path d={`M${x},${y - r} L${x + r * 0.95},${y + r * 0.78} L${x - r * 0.95},${y + r * 0.78} Z`} fill="var(--story-ember)" stroke="var(--story-viirs-bright)" strokeWidth="3" strokeLinejoin="round" />;
}

function Field({ loop }: { loop: number }) {
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
    <svg className="s2-field" viewBox="0 0 430 300" role="img" aria-label="A band sweeps a dark field. The same fire lights up as a big dot for MODIS and a small triangle for VIIRS." focusable="false">
      <defs>
        <clipPath id="s2-clip">
          <rect x="2" y="2" width="426" height="296" rx="26" />
        </clipPath>
      </defs>
      <rect x="2" y="2" width="426" height="296" rx="26" fill="var(--story-plate)" />
      <g opacity={fade} clipPath="url(#s2-clip)">
        {band(x1, "var(--story-modis)", t1 > 0 && t1 < 1)}
        {band(x2, "var(--story-viirs-bright)", t2 > 0 && t2 < 1)}
        {/* the same fire: a small ember, then the two marks it becomes */}
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

/** Graphic 2: the same fire as each sensor reports it: a big cell and dot, a small cell and triangle, at one scale. */
function TwoViews({ t }: { t: (k: "fireModis" | "fireViirs") => string }) {
  return (
    <div className="s2-views">
      <figure>
        <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <rect x="22" y="22" width="156" height="156" rx="22" fill="var(--story-modis-deep)" fillOpacity="0.3" stroke="var(--story-modis)" strokeWidth="3" />
          <circle cx="100" cy="100" r="46" fill="var(--story-ember)" stroke="var(--story-modis)" strokeWidth="3" />
        </svg>
        <figcaption>
          <SensorTag sensor="MODIS" />
          <span>{t("fireModis").split(" · ")[1]}</span>
        </figcaption>
      </figure>
      <figure>
        <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <rect x="22" y="22" width="156" height="156" rx="22" fill="none" stroke="var(--story-faint)" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
          <rect x="78" y="78" width="44" height="44" rx="8" fill="var(--story-viirs-deep)" fillOpacity="0.3" stroke="var(--story-viirs-bright)" strokeWidth="3" />
          <Triangle x={100} y={100} r={15} />
        </svg>
        <figcaption>
          <SensorTag sensor="VIIRS" />
          <span>{t("fireViirs").split(" · ")[1]}</span>
        </figcaption>
      </figure>
    </div>
  );
}

export function Ch2Fire({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;
  const frozen = useMemo(() => {
    const v = readParam("loop");
    return v !== null && v !== "" && Number.isFinite(Number(v)) ? Math.min(1, Math.max(0, Number(v))) : null;
  }, []);
  const inA = p < 0.52;
  const pb = usePlayback({ still, active: inA, seconds: LOOP_SECONDS, key: "ch2", rest: 0.9, frozen });

  const A = still ? 0 : win(p, -0.1, 0.52, 0.07);
  const B = still ? 1 : ramp(p, 0.5, 0.6);

  return (
    <div className="s2">
      <Beat v={A} headline={t("fireHeadA")} line={t("fireLineA")} />
      <Beat v={B} headline={t("fireHeadB")} line={t("fireLineB")} />
      <div className="s2-g1" style={{ opacity: A, visibility: A > 0.01 ? "visible" : "hidden", transform: `translateY(${(1 - A) * 18}px)` }}>
        <Field loop={pb.phase} />
      </div>
      <div className="s2-g2" style={{ opacity: B, visibility: B > 0.01 ? "visible" : "hidden", transform: `translateY(${(1 - easeOut(B)) * 22}px)` }}>
        <TwoViews t={t} />
      </div>
      {A > 0.3 && pb.canPause && <PlayPause paused={pb.paused} onToggle={pb.toggle} label={pb.paused ? t("play") : t("pause")} />}
    </div>
  );
}
