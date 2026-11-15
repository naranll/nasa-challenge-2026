/**
 * Chapter 3, "The handover".
 *  A. A year bar for each satellite: its LAUNCH YEAR (from the real satellites.json, claim S-C10) and a bar showing how
 *     long it has worked.
 *  B. A big "Retiring" warning on Terra and Aqua.
 *  C. NOAA-21 highlighted as the youngest, taking over.
 * No retirement or start-of-FIRMS dates are printed: those claims (S-C11, S-C13) are still [verify]. The open items are
 * in Sources & notes. Reduced motion / ?lite=1: the final frame, everything drawn.
 */
import { SATELLITES, type SatelliteId } from "../components/SatelliteShot";
import { Claimed } from "../components/Claimed";
import { useLaunchDates } from "../data/adapters";
import type { PlatformId } from "../../globe/platforms";
import { Beat, easeOut, mix, ramp, sceneText, SensorTag, win } from "./kit";
import type { StageProps } from "../types";

const ROWS: { platform: PlatformId; sat: SatelliteId; sensor: "MODIS" | "VIIRS" }[] = [
  { platform: "terra", sat: "terra", sensor: "MODIS" },
  { platform: "aqua", sat: "aqua", sensor: "MODIS" },
  { platform: "snpp", sat: "suomi-npp", sensor: "VIIRS" },
  { platform: "noaa20", sat: "noaa-20", sensor: "VIIRS" },
  { platform: "noaa21", sat: "noaa-21", sensor: "VIIRS" },
];

/** The year axis runs from this year to the next after the current one, so every bar has room. */
export const AXIS_FROM = 1998;

export function axisTo(now: Date): number {
  return now.getUTCFullYear() + 1;
}

/** Where a bar starts and how wide it is, as shares (0..1) of the axis; null when the launch year is unknown. */
export function barSpan(launchYear: number | null, now: Date, grow: number): { left: number; width: number } | null {
  if (launchYear === null) return null;
  const to = axisTo(now);
  const span = to - AXIS_FROM;
  return { left: (launchYear - AXIS_FROM) / span, width: (Math.max(0, now.getUTCFullYear() + 1 - launchYear) / span) * grow };
}

export function Ch3Handover({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;
  const launches = useLaunchDates();
  const launch = launches.status === "ok" ? launches.data : {};
  const now = new Date();

  const A = still ? 1 : win(p, -0.1, 0.36, 0.06);
  const B = still ? 0 : win(p, 0.33, 0.69, 0.06);
  const C = still ? 0 : ramp(p, 0.66, 0.76);
  const grow = still ? 1 : easeOut(ramp(p, 0.03, 0.3));
  const retire = still ? 1 : ramp(p, 0.34, 0.44); // stamps arrive in B and stay
  const dim = still ? 0 : C; // in C, everything but NOAA-21 steps back

  return (
    <div className="s3">
      <Beat v={A} headline={t("handHeadA")} line={t("handLineA")} />
      <Beat v={B} headline={t("handHeadB")} line={t("handLineB")} />
      <Beat v={C} headline={t("handHeadC")} line={t("handLineC")} />

      <ol className="s3-rows">
        {ROWS.map((r, i) => {
          const year = launch[r.platform] ? Number(launch[r.platform].slice(0, 4)) : null;
          const span = barSpan(year, now, grow);
          const retiring = r.platform === "terra" || r.platform === "aqua";
          const youngest = r.platform === "noaa21";
          const enter = still ? 1 : easeOut(ramp(p, 0.01 + i * 0.03, 0.09 + i * 0.03));
          const hi = youngest ? C : 0;
          return (
            <li
              key={r.platform}
              className={`s3-row${youngest && (C > 0.5 || still) ? " is-youngest" : ""}`}
              style={{ opacity: enter * mix(1, youngest ? 1 : 0.3, dim), transform: `translate3d(${(1 - enter) * 40}px, 0, 0) scale(${1 + hi * 0.03})` }}
              data-sensor={r.sensor.toLowerCase()}
            >
              <img src={SATELLITES[r.sat].src} alt="" decoding="async" draggable={false} />
              <div className="s3-main">
                <div className="s3-name">
                  <strong>{SATELLITES[r.sat].name}</strong>
                  <SensorTag sensor={r.sensor} />
                  {year !== null && (
                    <span className="s3-year">
                      {t("launched")} <Claimed id="S-C10">{year}</Claimed>
                    </span>
                  )}
                </div>
                <div className="s3-track">
                  {span && <div className="s3-bar" style={{ left: `${span.left * 100}%`, width: `${span.width * 100}%` }} />}
                </div>
              </div>
              {retiring && retire > 0.01 && (
                <span className="s3-stamp" style={{ opacity: retire * (1 - 0.5 * dim), transform: `rotate(-4deg) scale(${mix(1.5, 1, easeOut(retire))})` }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12,3 L22,20 H2 Z" />
                    <path d="M12,10 V14" />
                    <circle cx="12" cy="17" r="0.5" fill="currentColor" />
                  </svg>
                  {t("retiring")}
                </span>
              )}
              {youngest && (C > 0.3 || still) && (
                <span className="s3-badge" style={{ opacity: still ? 1 : ramp(C, 0.3, 0.8) }}>
                  ★ {t("youngest")}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="s3-axis" aria-hidden="true">
        {[2000, 2010, 2020].map((y) => (
          <span key={y} style={{ left: `${((y - AXIS_FROM) / (axisTo(now) - AXIS_FROM)) * 100}%` }}>
            {y}
          </span>
        ))}
      </div>
    </div>
  );
}
