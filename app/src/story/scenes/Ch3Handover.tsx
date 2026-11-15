/**
 * Chapter 3. The handover as a small story:
 *  A. Terra and Aqua (MODIS) are retiring soon: they droop, dim and look sad.
 *  B. A mentor (Aqua) passes "the record" to the youngest satellite (NOAA-21): VIIRS carries on alone.
 *  C. "But they are different": the same fire is a big dot for MODIS and a small triangle for VIIRS.
 *  D. A spark grows between them (the next chapter's harmonization). No hands, nothing has to touch.
 * Retirement dates are not printed (still [verify]). Reduced motion / ?lite=1: the final frame (D).
 */
import { useRef } from "react";
import { useElementSize } from "../../globe/env";
import { SATELLITES } from "../components/SatelliteShot";
import { SparkFlare } from "../skin";
import type { StageProps } from "../types";
import { Beat, easeOut, mix, ramp, sceneText, win } from "./kit";

/** Kept for tests and notes: the year axis helpers of the earlier bar chart. */
export const AXIS_FROM = 1998;
export function axisTo(now: Date): number {
  return now.getUTCFullYear() + 1;
}
export function barSpan(launchYear: number | null, now: Date, grow: number): { left: number; width: number } | null {
  if (launchYear === null) return null;
  const span = axisTo(now) - AXIS_FROM;
  return { left: (launchYear - AXIS_FROM) / span, width: (Math.max(0, now.getUTCFullYear() + 1 - launchYear) / span) * grow };
}

function Bubble({ v, children, side }: { v: number; children: string; side: "left" | "right" }) {
  return (
    <p className={`c3-bubble c3-bubble-${side}`} style={{ opacity: v, transform: `translateY(${(1 - easeOut(v)) * 10}px)`, visibility: v > 0.01 ? "visible" : "hidden" }}>
      {children}
    </p>
  );
}

function Tear({ v }: { v: number }) {
  return (
    <svg className="c3-tear" width="16" height="22" viewBox="0 0 16 22" aria-hidden="true" style={{ opacity: v, transform: `translateY(${v * 14}px)` }}>
      <path d="M8,1 C12,8 14,11 14,14 a6,6 0 0 1 -12,0 c0,-3 2,-6 6,-13 Z" fill="var(--story-modis)" fillOpacity="0.8" />
    </svg>
  );
}

export function Ch3Handover({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;
  const box = useRef<HTMLDivElement>(null);
  const { width: w } = useElementSize(box);
  const wide = w >= 800;
  const P = still ? 0.99 : p;

  const A = win(P, -0.1, 0.27, 0.05);
  const B = win(P, 0.25, 0.5, 0.05);
  const C = win(P, 0.48, 0.74, 0.05);
  const D = ramp(P, 0.72, 0.8);
  const sad = ramp(P, 0.05, 0.2); // droop and dim
  const pass = easeOut(ramp(P, 0.3, 0.46)); // the record travels
  const elder = ramp(P, 0.28, 0.4); // Terra leaves, Aqua steps left
  const spark = easeOut(ramp(P, 0.78, 0.96));
  const young = easeOut(ramp(P, 0.24, 0.36));

  // layout in % of the field
  const oldX = mix(wide ? 38 : 40, wide ? 20 : 22, elder); // mentor (Aqua)
  const terraX = wide ? 62 : 68; // Terra stays put and fades
  const youngX = wide ? 80 : 78;
  const size = wide ? "min(26vw, 280px)" : "min(36vw, 150px)";
  const youngSize = wide ? "min(18vw, 190px)" : "min(26vw, 110px)";
  const orbX = mix(oldX + 8, youngX - 6, pass);
  const orbY = 40 - Math.sin(pass * Math.PI) * 14;
  const orbOn = ramp(P, 0.3, 0.34) * (1 - ramp(P, 0.5, 0.56));
  const dull = mix(1, 0.5, sad);

  return (
    <div className="c c3">
      <Beat v={still ? 1 : A} headline={t("c3HeadA")} line={t("c3LineA")} />
      <Beat v={still ? 0 : B} headline={t("c3HeadB")} line={t("c3LineB")} />
      <Beat v={still ? 0 : C} headline={t("c3HeadC")} line={t("c3LineC")} />
      <Beat v={still ? 0 : D} headline={t("c3HeadD")} line={t("c3LineD")} />
      {still && <Beat v={1} headline={t("c3HeadD")} line={t("c3LineD")} className="c3-still-head" />}

      <div className="c-body c3-field" ref={box}>
        {/* the elders: Terra drops out after the handover, Aqua is the mentor */}
        <figure className="c3-sat c3-old" style={{ left: `${terraX}%`, width: size, opacity: mix(1, 0, ramp(P, 0.4, 0.5)) * dull, transform: `translate(-50%, 0) rotate(${sad * 8}deg) translateY(${sad * 10}px)`, filter: `saturate(${mix(1, 0.4, sad)})` }}>
          <img src={SATELLITES.terra.src} alt={SATELLITES.terra.alt.en} decoding="async" draggable={false} />
          <Tear v={ramp(P, 0.12, 0.22) * (1 - ramp(P, 0.3, 0.4))} />
        </figure>
        <figure className="c3-sat c3-old" style={{ left: `${oldX}%`, width: size, opacity: mix(dull, 0.75, ramp(P, 0.5, 0.6)), transform: `translate(-50%, 0) rotate(${sad * (1 - elder) * -7}deg) translateY(${sad * 8 * (1 - elder)}px)`, filter: `saturate(${mix(0.4, 0.7, elder)})` }}>
          <img src={SATELLITES.aqua.src} alt={SATELLITES.aqua.alt.en} decoding="async" draggable={false} />
          <Tear v={ramp(P, 0.1, 0.2) * (1 - ramp(P, 0.3, 0.4))} />
        </figure>
        <Bubble v={win(P, 0.08, 0.26, 0.04) * 0.99} side="left">
          Our watch is ending.
        </Bubble>

        {/* the youngest */}
        <figure className="c3-sat c3-young" style={{ left: `${youngX}%`, width: youngSize, opacity: young, transform: `translate(-50%, 0) scale(${mix(0.85, 1, young)})` }}>
          <img src={SATELLITES["noaa-21"].src} alt={SATELLITES["noaa-21"].alt.en} decoding="async" draggable={false} />
        </figure>
        <Bubble v={win(P, 0.31, 0.46, 0.04)} side="left">
          {t("c3SayOld")}
        </Bubble>
        <Bubble v={win(P, 0.38, 0.52, 0.04)} side="right">
          {t("c3SayYoung")}
        </Bubble>

        {/* B: the record passes from mentor to young */}
        <div className="c3-record" style={{ left: `${orbX}%`, top: `${orbY}%`, opacity: orbOn }} aria-hidden="true">
          <i />
          <span>{t("c3Record")}</span>
        </div>

        {/* C: but they are different */}
        <div className="c3-diff" style={{ opacity: C, visibility: C > 0.01 ? "visible" : "hidden", transform: `translateY(${(1 - easeOut(C)) * 14}px)` }}>
          <figure>
            <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
              <rect x="22" y="22" width="156" height="156" rx="22" fill="var(--story-modis-deep)" fillOpacity="0.3" stroke="var(--story-modis)" strokeWidth="3" />
              <circle cx="100" cy="100" r="46" fill="var(--story-ember)" stroke="var(--story-modis)" strokeWidth="3" />
            </svg>
            <figcaption>MODIS · big dot</figcaption>
          </figure>
          <span className="c3-neq" aria-hidden="true">
            ≠
          </span>
          <figure>
            <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
              <rect x="22" y="22" width="156" height="156" rx="22" fill="none" stroke="var(--story-faint)" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
              <rect x="78" y="78" width="44" height="44" rx="8" fill="var(--story-viirs-deep)" fillOpacity="0.3" stroke="var(--story-viirs-bright)" strokeWidth="3" />
              <path d="M100,85 L114,112 L86,112 Z" fill="var(--story-ember)" stroke="var(--story-viirs-bright)" strokeWidth="3" strokeLinejoin="round" />
            </svg>
            <figcaption>VIIRS · small triangle</figcaption>
          </figure>
        </div>

        {/* D: the spark between them */}
        <div className="c3-spark" style={{ opacity: spark, transform: `translate(-50%, -50%) scale(${mix(0.2, 1, spark)})` }} aria-hidden="true">
          <SparkFlare size={wide ? 260 : 170} color="#ffe6ad" angle={0} />
        </div>
      </div>
    </div>
  );
}
