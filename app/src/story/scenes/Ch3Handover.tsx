/**
 * Chapter 3, as a text-message chat. Top left: Terra and Aqua, with a bubble to their right: "We are retiring."
 * Then, below them, the three VIIRS satellites appear with their bubble: "Wait, this early?! I don't know how to
 * handle this alone!" Then our team's fusion icon appears at the left with its bubble: "I have an idea. Let's
 * harmonize!". Each bubble shows typing dots first, like texting. At the end the whole chat scrolls away toward the
 * next chapter. No retirement dates are printed (still [verify]). Reduced motion / ?lite=1: the whole chat at once.
 */
import { SATELLITES, type SatelliteId } from "../components/SatelliteShot";
import type { StageProps } from "../types";
import { Beat, easeOut, ramp, sceneText, win } from "./kit";

/** Kept for tests and notes: the year-axis helpers of the earlier bar chart. */
export const AXIS_FROM = 1998;
export function axisTo(now: Date): number {
  return now.getUTCFullYear() + 1;
}
export function barSpan(launchYear: number | null, now: Date, grow: number): { left: number; width: number } | null {
  if (launchYear === null) return null;
  const span = axisTo(now) - AXIS_FROM;
  return { left: (launchYear - AXIS_FROM) / span, width: (Math.max(0, now.getUTCFullYear() + 1 - launchYear) / span) * grow };
}

/** Our team's fusion icon: a MODIS circle and a VIIRS circle overlapping into white light, with a small spark. */
export function FusionIcon({ size = 110 }: { size?: number }) {
  return (
    <svg className="c3-fusion" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Our team's fusion icon: two overlapping circles that make white light">
      <defs>
        <clipPath id="fusion-clip">
          <circle cx="46" cy="64" r="34" />
        </clipPath>
      </defs>
      <circle cx="46" cy="64" r="34" fill="var(--story-modis)" fillOpacity="0.28" stroke="var(--story-modis)" strokeWidth="3.5" />
      <circle cx="74" cy="64" r="34" fill="var(--story-viirs-bright)" fillOpacity="0.28" stroke="var(--story-viirs-bright)" strokeWidth="3.5" />
      <circle cx="74" cy="64" r="34" fill="#fff6dc" fillOpacity="0.92" clipPath="url(#fusion-clip)" />
      <path d="M60,36 C61,50 66,55 80,56 C66,58 61,63 60,78 C59,63 54,58 40,56 C54,55 59,50 60,36 Z" fill="#fff6dc" stroke="var(--story-ink)" strokeWidth="2" strokeLinejoin="round" transform="translate(0 8) scale(1)" />
    </svg>
  );
}

function Typing() {
  return (
    <span className="c3-typing" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function Message({ v, side, children }: { v: number; side: "modis" | "viirs" | "team"; children: string }) {
  const typing = v < 0.5;
  const pop = easeOut(ramp(v, 0.1, 0.9));
  return (
    <p className={`c3-bubble c3-bubble-${side}${typing ? " is-typing" : ""}`} style={{ opacity: ramp(v, 0, 0.2), transform: `scale(${0.8 + 0.2 * pop}) translateX(${(1 - pop) * -14}px)` }}>
      {typing ? <Typing /> : children}
    </p>
  );
}

function Avatars({ ids, v, size }: { ids: SatelliteId[]; v: number; size: "pair" | "trio" }) {
  const a = easeOut(ramp(v, 0, 0.5));
  return (
    <div className={`c3-av c3-av-${size}`} style={{ opacity: a, transform: `translateX(${(1 - a) * -24}px)` }}>
      {ids.map((id) => (
        <figure key={id}>
          <img src={SATELLITES[id].src} alt={SATELLITES[id].alt.en} decoding="async" draggable={false} />
          <figcaption>{SATELLITES[id].name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function Ch3Handover({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;
  const r1 = still ? 1 : ramp(p, 0.04, 0.26);
  const r2 = still ? 1 : ramp(p, 0.3, 0.52);
  const r3 = still ? 1 : ramp(p, 0.58, 0.8);
  const away = still ? 0 : ramp(p, 0.9, 1);
  const rise = (v: number) => ({ opacity: v > 0 ? 1 : 0, visibility: v > 0.005 ? ("visible" as const) : ("hidden" as const), transform: `translateY(${(1 - easeOut(ramp(v, 0, 0.35))) * 26}px)` });

  return (
    <div className="c c3">
      <Beat v={still ? 0 : win(p, -0.1, 0.56, 0.05)} headline={t("c3HeadA")} line={t("c3LineA")} />
      <Beat v={still ? 1 : ramp(p, 0.56, 0.66) * (1 - away)} headline={t("c3HeadB")} line={t("c3LineB")} />
      <div className="c-body c3-chat" style={{ transform: `translateY(${-away * 60}dvh)`, opacity: 1 - away * 0.9 }}>
        <section className="c3-row" style={rise(r1)}>
          <Avatars ids={["terra", "aqua"]} v={r1} size="pair" />
          <Message v={ramp(r1, 0.35, 1)} side="modis">
            {t("c3Msg1")}
          </Message>
        </section>
        <section className="c3-row" style={rise(r2)}>
          <Avatars ids={["suomi-npp", "noaa-20", "noaa-21"]} v={r2} size="trio" />
          <Message v={ramp(r2, 0.35, 1)} side="viirs">
            {t("c3Msg2")}
          </Message>
        </section>
        <section className="c3-row" style={rise(r3)}>
          <div className="c3-av c3-av-team" style={{ opacity: easeOut(ramp(r3, 0, 0.5)), transform: `translateX(${(1 - easeOut(ramp(r3, 0, 0.5))) * -24}px)` }}>
            <FusionIcon />
            <span>{t("c3Team")}</span>
          </div>
          <Message v={ramp(r3, 0.35, 1)} side="team">
            {t("c3Msg3")}
          </Message>
        </section>
      </div>
    </div>
  );
}
