/**
 * Chapter 1. All five satellites on one page, no Earth graphics. They float loosely at first; as you scroll they
 * glide into two coloured groups: MODIS (teal, circle) and VIIRS (indigo, triangle). Reduced motion / ?lite=1: the
 * sorted final frame.
 */
import { useRef } from "react";
import { useElementSize } from "../../globe/env";
import { SATELLITES, type SatelliteId } from "../components/SatelliteShot";
import type { StageProps } from "../types";
import { Beat, easeOut, mix, ramp, sceneText, SensorTag, win } from "./kit";

type Sensor = "MODIS" | "VIIRS";

/** Kept for the Sources & notes panel. */
export const CREW: { id: SatelliteId; sensor: Sensor; sense: string; use: string; senseIcon: "heat"; useIcon: "map" | "record" | "pair" | "star" }[] = [
  { id: "terra", sensor: "MODIS", sense: "Morning pass, feels infrared heat", use: "Maps active fires", senseIcon: "heat", useIcon: "map" },
  { id: "aqua", sensor: "MODIS", sense: "Afternoon pass, feels infrared heat", use: "Pairs with Terra", senseIcon: "heat", useIcon: "pair" },
  { id: "suomi-npp", sensor: "VIIRS", sense: "Sees heat in finer detail", use: "Pathfinder for VIIRS", senseIcon: "heat", useIcon: "star" },
  { id: "noaa-20", sensor: "VIIRS", sense: "Same sensor, steady watch", use: "Keeps fire maps flowing", senseIcon: "heat", useIcon: "record" },
  { id: "noaa-21", sensor: "VIIRS", sense: "Newest sensor, same view", use: "Carries the record forward", senseIcon: "heat", useIcon: "record" },
];

type Pt = [number, number];
/** Centres as shares of the field: loose arrangement, then grouped (wide screens / phones). */
const LOOSE: Record<SatelliteId, Pt> = { terra: [0.13, 0.36], aqua: [0.36, 0.72], "suomi-npp": [0.52, 0.28], "noaa-20": [0.73, 0.7], "noaa-21": [0.89, 0.34] };
const GROUP_WIDE: Record<SatelliteId, Pt> = { terra: [0.14, 0.52], aqua: [0.34, 0.52], "suomi-npp": [0.6, 0.52], "noaa-20": [0.75, 0.52], "noaa-21": [0.9, 0.52] };
const GROUP_NARROW: Record<SatelliteId, Pt> = { terra: [0.27, 0.27], aqua: [0.73, 0.27], "suomi-npp": [0.17, 0.74], "noaa-20": [0.5, 0.74], "noaa-21": [0.83, 0.74] };
/** Group panels as [left, top, width, height] shares of the field. */
const PANEL_WIDE: Record<Sensor, [number, number, number, number]> = { MODIS: [0.02, 0.16, 0.45, 0.72], VIIRS: [0.51, 0.16, 0.47, 0.72] };
const PANEL_NARROW: Record<Sensor, [number, number, number, number]> = { MODIS: [0.02, 0.04, 0.96, 0.42], VIIRS: [0.02, 0.52, 0.96, 0.44] };

export function Ch1Crews({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;
  const box = useRef<HTMLDivElement>(null);
  const { width: w, height: h } = useElementSize(box);
  const wide = w >= 800;
  const sort = still ? 1 : easeOut(ramp(p, 0.3, 0.72));
  const A = still ? 0 : win(p, -0.1, 0.5, 0.08);
  const B = still ? 1 : ramp(p, 0.5, 0.6);
  const group = wide ? GROUP_WIDE : GROUP_NARROW;
  const panels = wide ? PANEL_WIDE : PANEL_NARROW;
  const size = wide ? Math.min(w * 0.135, 190) : Math.min(w * 0.26, 110);

  return (
    <div className="c c1">
      <Beat v={A} headline={t("c1HeadA")} line={t("c1LineA")} />
      <Beat v={B} headline={t("c1HeadB")} line={t("c1LineB")} />
      <div className="c-body c1-field" ref={box}>
        {(["MODIS", "VIIRS"] as Sensor[]).map((s) => {
          const [l, tp, pw, ph] = panels[s];
          return (
            <div key={s} className={`c1-panel c1-${s.toLowerCase()}`} style={{ left: `${l * 100}%`, top: `${tp * 100}%`, width: `${pw * 100}%`, height: `${ph * 100}%`, opacity: sort }}>
              <SensorTag sensor={s} />
            </div>
          );
        })}
        {w > 0 &&
          CREW.map((c, i) => {
            const a = LOOSE[c.id];
            const g = group[c.id];
            const bob = still ? 0 : Math.sin(p * 18 + i * 1.7) * 6 * (1 - sort);
            const x = mix(a[0], g[0], sort) * w;
            const y = mix(a[1], g[1], sort) * h + bob;
            const sat = SATELLITES[c.id];
            return (
              <figure key={c.id} className={`c1-sat c1-sat-${c.sensor.toLowerCase()}`} style={{ width: size, transform: `translate3d(${x - size / 2}px, ${y - size * 0.35}px, 0)` }}>
                <img src={sat.src} alt={sat.alt.en} decoding="async" draggable={false} />
                <figcaption>{sat.name}</figcaption>
              </figure>
            );
          })}
      </div>
    </div>
  );
}
