/**
 * Chapter 5, "Tested on Mongolia's data". The Mongolia outline draws itself and one merged set of hotspots ignites inside
 * it; one big button routes to the app's harmony page, where the proof lives. Marks are illustrative; the fixture badge
 * shows while the data is synthetic. Reduced motion / ?lite=1: the finished picture.
 */
import { useMemo, useRef } from "react";
import { useElementSize } from "../../globe/env";
import { useHotspots } from "../data/hotspots";
import { fitMap, ignition, outlinePath, sweepU } from "../engine/hero";
import { ROUTES } from "../../routes";
import type { StageProps } from "../types";
import { Beat, easeOut, ramp, sceneText } from "./kit";

const APP_HARMONY = `${import.meta.env.BASE_URL}#${ROUTES.harmonizing}`;

export function Ch5Reveal({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;
  const box = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(box);
  const hotspots = useHotspots();
  const wide = width >= 900;

  const fit = useMemo(() => {
    if (!width || !height) return null;
    const zone = wide ? { x: width * 0.14, y: height * 0.25, w: width * 0.72, h: height * 0.5 } : { x: 14, y: height * 0.27, w: width - 28, h: height * 0.34 };
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

  const draw = still ? 1 : easeOut(ramp(p, 0.03, 0.3));
  const ignite = still ? 2 : ramp(p, 0.28, 0.6) * 1.25;
  const head = still ? 1 : ramp(p, 0, 0.06);
  const link = still ? 1 : easeOut(ramp(p, 0.82, 0.94));
  const R = wide ? 6 : 4.5;

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
              <g key={m.id} opacity={g.opacity}>
                {g.ring > 0 && <circle cx={m.x} cy={m.y} r={R * (1 + 2.2 * g.ring)} fill="none" stroke="var(--story-ember)" strokeWidth="2" opacity={1 - g.ring} />}
                <circle cx={m.x} cy={m.y} r={R * (0.6 + 0.4 * g.opacity)} fill="var(--story-ember)" stroke="var(--story-ink)" strokeWidth="2" />
              </g>
            ) : null;
          })}
        </svg>
      )}

      <div className="c5-foot" style={{ opacity: link, transform: `translateY(${(1 - link) * 14}px)`, visibility: link > 0.01 ? "visible" : "hidden" }}>
        <a className="c5-link" href={APP_HARMONY}>
          {t("seeIt")} <span aria-hidden="true">›</span>
        </a>
      </div>
    </div>
  );
}
