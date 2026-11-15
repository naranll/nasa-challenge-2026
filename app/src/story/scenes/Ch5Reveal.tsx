/**
 * Chapter 5, "The reveal". The Mongolia outline (the real border already in the repo, globe/assets/mongolia.json)
 * draws itself, then ONE merged set of hotspots ignites inside it (the harmonized, single-kind marks from
 * data/hotspots.ts). Mongolia appears only here. Marks are illustrative and the fixture badge shows while the data is
 * synthetic. Closing link: "See it in Mongolia ›". Reduced motion / ?lite=1: the finished picture.
 */
import { useMemo, useRef } from "react";
import { useElementSize } from "../../globe/env";
import { useHotspots } from "../data/hotspots";
import { fitMap, ignition, outlinePath, sweepU } from "../engine/hero";
import { Beat, easeOut, ramp, sceneText } from "./kit";
import type { StageProps } from "../types";

const APP_DASHBOARD = `${import.meta.env.BASE_URL}#/dashboard`;

export function Ch5Reveal({ progress: p, reduced, lowBandwidth, lang }: StageProps) {
  const t = sceneText(lang);
  const still = reduced || lowBandwidth;
  const box = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(box);
  const hotspots = useHotspots();

  const wide = width >= 900;
  const fit = useMemo(() => {
    if (!width || !height) return null;
    const zone = wide ? { x: width * 0.38, y: height * 0.14, w: width * 0.58, h: height * 0.66 } : { x: 18, y: height * 0.27, w: width - 62, h: height * 0.42 };
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

  const draw = still ? 1 : easeOut(ramp(p, 0.04, 0.4));
  const ignite = still ? 2 : ramp(p, 0.42, 0.82) * 1.25; // 0..1.25: leading edge of the ignition wave
  const head = still ? 1 : ramp(p, 0, 0.08);
  const link = still ? 1 : easeOut(ramp(p, 0.8, 0.92));
  const R = wide ? 6.5 : 5;
  const synthetic = hotspots.status === "ok" && hotspots.data.synthetic;

  return (
    <div className="s5" ref={box}>
      <Beat v={head} headline={t("revHead")} line={t("revLine")} />
      {fit && (
        <svg className="s5-map" width={width} height={height} aria-hidden="true" focusable="false">
          <path d={outline} fill="var(--story-plate)" fillOpacity={0.9 * draw} stroke="none" transform="translate(0 6)" opacity="0.5" />
          <path d={outline} fill="var(--story-plate)" fillOpacity={0.9 * draw} stroke="var(--story-cream)" strokeWidth="3" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          {marks.map((m) => {
            // each mark lights as the wave passes its position along the sweep, with a little stagger of its own
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
      <div className="s5-foot" style={{ opacity: link, transform: `translateY(${(1 - link) * 14}px)`, visibility: link > 0.01 ? "visible" : "hidden" }}>
        <a className="s5-link" href={APP_DASHBOARD}>
          {t("seeIt")} <span aria-hidden="true">›</span>
        </a>
        <span className="s5-badge">{synthetic ? t("fixture") : t("illustrative")}</span>
      </div>
    </div>
  );
}
