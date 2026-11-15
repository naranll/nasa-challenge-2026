/**
 * Chapter 1, "Meet the crews". Beat A: a stylized digital globe with hotspots on the left; the five satellites (the
 * supplied cut-outs) enter one at a time from the screen edge on the right, large and frameless, with a one-line
 * caption and a MODIS / VIIRS tag. Beat B: the globe fades back and each crew gets a two-item cartoon explainer
 * (icon + up to six words). Detail lives in "Sources & notes". Reduced motion / ?lite=1: one static frame.
 */
import { SATELLITES, type SatelliteId } from "../components/SatelliteShot";
import { DotGlobe } from "./DotGlobe";
import { Beat, easeOut, Icon, mix, ramp, sceneText, SensorTag, slotOf, win } from "./kit";
import type { StageProps } from "../types";

export const CREW: { id: SatelliteId; sensor: "MODIS" | "VIIRS"; sense: string; use: string; senseIcon: "heat"; useIcon: "map" | "record" | "pair" | "star" }[] = [
  { id: "terra", sensor: "MODIS", sense: "Morning pass, feels infrared heat", use: "Maps active fires", senseIcon: "heat", useIcon: "map" },
  { id: "aqua", sensor: "MODIS", sense: "Afternoon pass, feels infrared heat", use: "Pairs with Terra", senseIcon: "heat", useIcon: "pair" },
  { id: "suomi-npp", sensor: "VIIRS", sense: "Sees heat in finer detail", use: "Pathfinder for VIIRS", senseIcon: "heat", useIcon: "star" },
  { id: "noaa-20", sensor: "VIIRS", sense: "Same sensor, steady watch", use: "Keeps fire maps flowing", senseIcon: "heat", useIcon: "record" },
  { id: "noaa-21", sensor: "VIIRS", sense: "Newest sensor, same view", use: "Carries the record forward", senseIcon: "heat", useIcon: "record" },
];

const A_END = 0.5; // beat A (arrivals) ends here, beat B (explainers) takes the rest

function Caption({ id, sensor }: { id: SatelliteId; sensor: "MODIS" | "VIIRS" }) {
  const s = SATELLITES[id];
  return (
    <figcaption className="crew-cap">
      <span>
        <strong>{s.name}</strong> · <em>{s.nickname.en}</em>
      </span>
      <SensorTag sensor={sensor} />
    </figcaption>
  );
}

export function Ch1Crews({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;

  if (still) {
    return (
      <div className="s1 s1-still">
        <div className="s1-globe" style={{ opacity: 1 }}>
          <DotGlobe angle={0.5} />
        </div>
        <Beat v={1} headline={t("crewsHead")} line={t("crewsLine")} className="beat-top" />
        <ul className="s1-strip">
          {CREW.map((c) => (
            <li key={c.id}>
              <figure>
                <img src={SATELLITES[c.id].src} alt={SATELLITES[c.id].alt.en} loading="lazy" decoding="async" draggable={false} />
                <Caption id={c.id} sensor={c.sensor} />
              </figure>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const a = slotOf(p, 5, 0.02, A_END);
  const b = slotOf(p, 5, A_END + 0.02, 1);
  const inA = p < A_END + 0.01;
  const swing = win(p, A_END - 0.03, A_END + 0.05, 0.04); // brief gap between the beats
  const aVis = inA ? 1 : 0;

  // beat A: slot i enters from the edge (first 35%), holds, leaves (last 25%)
  const enter = easeOut(ramp(a.t, 0, 0.35));
  const leave = ramp(a.t, 0.75, 1);
  const crewA = CREW[a.i];
  const arrive = p < 0.02 ? 0 : enter;
  const x = mix(70, 0, arrive) + mix(0, -10, leave); // vw
  const aOpacity = aVis * arrive * (1 - leave);

  // globe: parallax turn with scroll; fades back in beat B
  const globeBack = ramp(p, A_END - 0.02, A_END + 0.06);
  const angle = 0.4 + p * 1.6;

  // beat B: crew b.i, a small picture and two rows
  const crewB = CREW[b.i];
  const bIn = easeOut(ramp(b.t, 0, 0.3));
  const bOut = ramp(b.t, 0.82, 1);
  const bVis = (inA ? 0 : 1) * bIn * (1 - bOut);

  return (
    <div className="s1">
      <div className="s1-globe" style={{ opacity: mix(1, 0.18, globeBack), transform: `scale(${mix(1, 0.88, globeBack)})` }}>
        <DotGlobe angle={angle} hot={mix(1, 0.5, globeBack)} />
      </div>

      <Beat v={win(p, -0.1, A_END - 0.02, 0.05)} headline={t("crewsHead")} line={t("crewsLine")} className="beat-top" />
      <Beat v={win(p, A_END + 0.02, 1.02, 0.06)} headline={t("crewsHead2")} line={t("crewsLine2")} className="beat-top" />

      {/* beat A: one satellite at a time, from the right edge */}
      <figure className="s1-sat" style={{ opacity: aOpacity, transform: `translate3d(${x}vw, ${Math.sin(p * 40) * 4}px, 0)`, visibility: aOpacity > 0.01 ? "visible" : "hidden" }}>
        <img src={SATELLITES[crewA.id].src} alt={SATELLITES[crewA.id].alt.en} decoding="async" draggable={false} />
        <Caption id={crewA.id} sensor={crewA.sensor} />
      </figure>

      {/* beat B: explainer */}
      <div className="s1-explain" style={{ opacity: bVis * (1 - swing), visibility: bVis > 0.01 ? "visible" : "hidden" }}>
        <figure className="s1-mini" style={{ transform: `translate3d(${(1 - bIn) * -30}px,0,0)` }}>
          <img src={SATELLITES[crewB.id].src} alt={SATELLITES[crewB.id].alt.en} decoding="async" draggable={false} />
          <Caption id={crewB.id} sensor={crewB.sensor} />
        </figure>
        <ul className="s1-rows">
          {[
            { icon: crewB.senseIcon, text: crewB.sense, d: 0.15 },
            { icon: crewB.useIcon, text: crewB.use, d: 0.4 },
          ].map((row) => (
            <li key={row.text} style={{ opacity: ramp(b.t, row.d, row.d + 0.25), transform: `translate3d(${(1 - easeOut(ramp(b.t, row.d, row.d + 0.25))) * 40}px,0,0)` }}>
              <Icon name={row.icon} />
              <span>{row.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
