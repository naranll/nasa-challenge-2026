/**
 * Chapter 5. "We tested it on Mongolia", with the Numrug case, all on one page. Centre: the Mongolia outline with one
 * merged set of hotspots and a pin for Numrug. One card tells what the test was (its result is a pink placeholder until
 * the real result is in), one card tells the case. Wide screens show everything at once; phones show the map and swap the
 * cards by scroll. Marks are illustrative; the fixture badge shows while data is synthetic. Reduced motion / ?lite=1:
 * the finished page.
 */
import { useMemo, useRef } from "react";
import { useElementSize } from "../../globe/env";
import { useHotspots } from "../data/hotspots";
import { fitMap, ignition, outlinePath, sweepU } from "../engine/hero";
import type { StageProps } from "../types";
import { Beat, easeOut, ramp, sceneText, win } from "./kit";

const APP_DASHBOARD = `${import.meta.env.BASE_URL}#/dashboard`;
/** Approximate location of the Numrug protected area (east Mongolia). NOT surveyed: shown as "approximate", [verify]. */
const NUMRUG = { lon: 118.6, lat: 47.9 };

export function Ch5Reveal({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;
  const box = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(box);
  const hotspots = useHotspots();
  const wide = width >= 900;

  const fit = useMemo(() => {
    if (!width || !height) return null;
    const zone = wide ? { x: width * 0.3, y: height * 0.27, w: width * 0.4, h: height * 0.5 } : { x: 14, y: height * 0.27, w: width - 28, h: height * 0.26 };
    return fitMap(zone);
  }, [width, height, wide]);
  const outline = useMemo(() => (fit ? outlinePath(fit) : ""), [fit]);
  const marks = useMemo(() => {
    if (!fit || hotspots.status !== "ok") return [];
    return hotspots.data.uniform.map((m) => {
      const { x, y } = fit.project(m.lon, m.lat);
      return { id: m.id, x, y, u: sweepU(x, y, fit.rect), order: m.order };
    });
  }, [fit, hotspots]);
  const pin = fit ? fit.project(NUMRUG.lon, NUMRUG.lat) : null;

  const draw = still ? 1 : easeOut(ramp(p, 0.03, 0.3));
  const ignite = still ? 2 : ramp(p, 0.28, 0.6) * 1.25;
  const head = still ? 1 : ramp(p, 0, 0.06);
  const test = wide ? (still ? 1 : ramp(p, 0.5, 0.62)) : still ? 0 : win(p, 0.42, 0.7, 0.06);
  const cas = wide ? (still ? 1 : ramp(p, 0.64, 0.76)) : still ? 1 : ramp(p, 0.68, 0.78);
  const pinOn = still ? 1 : ramp(p, 0.64, 0.74);
  const link = still ? 1 : easeOut(ramp(p, 0.82, 0.94));
  const R = wide ? 6 : 4.5;
  const synthetic = hotspots.status === "ok" && hotspots.data.synthetic;
  const rise = (v: number) => ({ opacity: v, visibility: v > 0.01 ? ("visible" as const) : ("hidden" as const), transform: `translateY(${(1 - easeOut(v)) * 16}px)` });

  return (
    <div className={`c c5${wide ? " is-wide" : ""}`} ref={box}>
      <Beat v={head} headline={t("c5Head")} line={t("c5Line")} />
      {fit && (
        <svg className="c5-map" width={width} height={height} aria-hidden="true" focusable="false">
          <path d={outline} fill="var(--story-plate)" fillOpacity={0.9 * draw} stroke="none" transform="translate(0 6)" opacity="0.5" />
          <path d={outline} fill="var(--story-plate)" fillOpacity={0.9 * draw} stroke="var(--story-cream)" strokeWidth="3" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          {marks.map((m) => {
            const i = ramp(ignite, m.u * 0.8 + m.order * 0.15, m.u * 0.8 + m.order * 0.15 + 0.14);
            const g = ignition(i);
            return g.opacity > 0.01 ? (
              <g key={m.id} opacity={g.opacity * (1 - 0.5 * pinOn)}>
                {g.ring > 0 && <circle cx={m.x} cy={m.y} r={R * (1 + 2.2 * g.ring)} fill="none" stroke="var(--story-ember)" strokeWidth="2" opacity={1 - g.ring} />}
                <circle cx={m.x} cy={m.y} r={R * (0.6 + 0.4 * g.opacity)} fill="var(--story-ember)" stroke="var(--story-ink)" strokeWidth="2" />
              </g>
            ) : null;
          })}
          {pin && pinOn > 0.01 && (
            <g opacity={pinOn}>
              <circle cx={pin.x} cy={pin.y} r={14 + 10 * (1 - pinOn)} fill="none" stroke="var(--story-ember)" strokeWidth="3" />
              <circle cx={pin.x} cy={pin.y} r="6" fill="var(--story-ember)" stroke="var(--story-ink)" strokeWidth="2" />
              <text x={pin.x - 22} y={pin.y - 22} textAnchor="end" className="c5-pin">
                {t("c5Pin")}
              </text>
            </g>
          )}
        </svg>
      )}

      <section className="c5-card c5-test" style={rise(test)} aria-hidden={test < 0.5}>
        <h3>{t("c5TestTitle")}</h3>
        <ul>
          <li>{t("c5Test1")}</li>
          <li>{t("c5Test2")}</li>
          <li>
            <span className="c5-ph">[ {t("c5Result")} ]</span>
          </li>
        </ul>
      </section>
      <section className="c5-card c5-case" style={rise(cas)} aria-hidden={cas < 0.5}>
        <h3>{t("c5CaseTitle")}</h3>
        <ul>
          <li>
            {t("c5Case1")} <span className="c5-ph">[ verify ]</span>
          </li>
          <li>
            {t("c5Case2")} <span className="c5-ph">[ verify ]</span>
          </li>
          <li>{t("c5Case3")}</li>
        </ul>
      </section>

      <div className="c5-foot" style={{ opacity: link, transform: `translateY(${(1 - link) * 14}px)`, visibility: link > 0.01 ? "visible" : "hidden" }}>
        <a className="c5-link" href={APP_DASHBOARD}>
          {t("seeIt")} <span aria-hidden="true">›</span>
        </a>
        <span className="c5-badge">{synthetic ? t("fixture") : t("illustrative")}</span>
      </div>
    </div>
  );
}
