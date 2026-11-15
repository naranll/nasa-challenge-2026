/**
 * Chapter 7: when each platform started and stopped. A cursor sweeps 2000 to 2028 as the chapter scrolls.
 * Terra and Aqua fade after their planned end, Suomi NPP stops at the end of its FIRMS production, NOAA-21 lights
 * up when it enters FIRMS. Launch dates are read from the real satellites.json; end dates are [verify] (lifecycle.json).
 * Reduced motion and low bandwidth show the final state, drawn once.
 */
import { useRef } from "react";
import { useElementSize } from "../../globe/env";
import { formatDate } from "../../globe/format";
import { nameKey, PLATFORM_IDS, SENSOR_OF, type PlatformId } from "../../globe/platforms";
import { useI18n } from "../../i18n";
import { Marker } from "../engine/StageChart";
import { useLaunchDates } from "../data/adapters";
import { AXIS, cursorAt, decimalYear, fadeAt, LIFECYCLE } from "../data/handover";
import { useStoryText } from "../strings";
import { Claimed } from "./Claimed";

const ROW = 15;
const TOP = 20;
const LEFT = 78;
const RIGHT = 10;
const AXIS_H = 16;
const TICKS = [2000, 2005, 2010, 2015, 2020, 2025];

interface Props {
  progress: number;
  /** Reduced motion or low bandwidth: show the finished picture, no sweep. */
  still: boolean;
  lowBandwidth: boolean;
}

const lifecycle = LIFECYCLE.platforms as Record<string, { end?: string; endKind?: string; firmsStart?: string; claim?: string }>;

export function LifespanTimeline({ progress, still, lowBandwidth }: Props) {
  const { t, lang } = useI18n();
  const s = useStoryText();
  const box = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(box);
  const launches = useLaunchDates();
  const launch = launches.status === "ok" ? launches.data : {};
  const cursor = cursorAt(progress, still);

  const height = TOP + PLATFORM_IDS.length * ROW + AXIS_H;
  const w = Math.max(width - LEFT - RIGHT, 40);
  const x = (year: number) => LEFT + ((Math.min(Math.max(year, AXIS.from), AXIS.to) - AXIS.from) / (AXIS.to - AXIS.from)) * w;

  return (
    <figure className="story-timeline">
      <figcaption className="story-eyebrow-sm">{s("timeline.title")}</figcaption>
      <div ref={box} className="story-timeline-plot">
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={s("timeline.alt")}>
            {!lowBandwidth && (
              <defs>
                <filter id="story-lit" x="-10%" y="-80%" width="120%" height="260%">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
              </defs>
            )}

            {/* year axis */}
            {TICKS.map((y) => (
              <g key={y}>
                <line x1={x(y)} x2={x(y)} y1={TOP - 4} y2={TOP + PLATFORM_IDS.length * ROW} className="story-grid" />
                <text x={x(y)} y={height - 3} textAnchor="middle" className="story-tick">
                  {y}
                </text>
              </g>
            ))}

            {/* step markers: numerals light up as the cursor passes them */}
            {LIFECYCLE.steps.map((st) => {
              const at = decimalYear(st.at);
              const passed = cursor >= at;
              return (
                <g key={st.n} opacity={passed ? 1 : 0.35}>
                  <line x1={x(at)} x2={x(at)} y1={TOP - 8} y2={TOP + PLATFORM_IDS.length * ROW} className="story-step-line" />
                  <circle cx={x(at)} cy={9} r={7} className="story-step-dot" />
                  <text x={x(at)} y={9} dy="0.34em" textAnchor="middle" className="story-step-n">
                    {st.n}
                  </text>
                </g>
              );
            })}

            {PLATFORM_IDS.map((id, i) => {
              const y = TOP + i * ROW + ROW / 2;
              const sensor = SENSOR_OF[id];
              const lc = lifecycle[id] ?? {};
              const start = launch[id] ? decimalYear(launch[id]) : null;
              const end = lc.end ? decimalYear(lc.end) : null;
              const planned = lc.endKind === "planned";
              const firmsStart = lc.firmsStart ? decimalYear(lc.firmsStart) : null;
              const rowOpacity = planned ? fadeAt(cursor, end) : 1;
              const color = sensor === "MODIS" ? "var(--story-modis)" : "var(--story-viirs)";
              const stop = Math.min(cursor, end ?? AXIS.to);
              const lit = firmsStart !== null && cursor >= firmsStart;
              return (
                <g key={id} opacity={rowOpacity}>
                  <Marker sensor={sensor} x={10} y={y} r={3.2} />
                  <text x={22} y={y} dy="0.34em" className="story-label">
                    {t(nameKey(id))}
                  </text>
                  {start !== null ? (
                    <>
                      {cursor >= start && (
                        <>
                          {/* before FIRMS: launched but dim; after: bright */}
                          <rect x={x(start)} y={y - 3} width={Math.max(x(firmsStart !== null ? Math.min(stop, firmsStart) : stop) - x(start), 0)} height={6} rx={1} fill={firmsStart !== null ? "var(--story-viirs-deep)" : color} />
                          {firmsStart !== null && lit && (
                            <>
                              {!lowBandwidth && <rect x={x(firmsStart)} y={y - 3} width={Math.max(x(stop) - x(firmsStart), 0)} height={6} rx={1} fill="var(--story-viirs-bright)" filter="url(#story-lit)" opacity={0.9} />}
                              <rect x={x(firmsStart)} y={y - 3} width={Math.max(x(stop) - x(firmsStart), 0)} height={6} rx={1} fill="var(--story-viirs-bright)" />
                            </>
                          )}
                          <Marker sensor={sensor} x={x(start)} y={y} r={3} />
                        </>
                      )}
                      {id === "snpp" && end !== null && cursor >= end && (
                        <g>
                          <line x1={x(end)} x2={x(end)} y1={y - 7} y2={y + 7} stroke="var(--story-cream)" strokeWidth={1.5} />
                          <text x={x(end) - 5} y={y} dy="0.34em" textAnchor="end" className="story-tick story-halo">
                            {s("timeline.firms_end")}
                          </text>
                        </g>
                      )}
                    </>
                  ) : (
                    launches.status !== "loading" && (
                      <text x={LEFT + 4} y={y} dy="0.34em" className="story-tick">
                        {s("timeline.no_launch")}
                      </text>
                    )
                  )}
                </g>
              );
            })}

            {!still && cursor < AXIS.to && <line x1={x(cursor)} x2={x(cursor)} y1={TOP - 8} y2={TOP + PLATFORM_IDS.length * ROW} className="story-cursor" />}
          </svg>
        )}
      </div>
      <p className="story-note">{s("timeline.verify")}</p>

      {/* The same facts as text, for screen readers. Dates carry their claim IDs. */}
      <ul className="story-sr-only">
        {PLATFORM_IDS.map((id) => {
          const lc = lifecycle[id] ?? {};
          return (
            <li key={id}>
              {t(nameKey(id))}
              {launch[id] && (
                <>
                  : <Claimed id="S-C10">{formatDate(launch[id], lang)}</Claimed>
                </>
              )}
              {lc.end && lc.claim && (
                <>
                  {" → "}
                  <Claimed id={lc.claim}>{lc.end}</Claimed>
                </>
              )}
              {lc.firmsStart && lc.claim && (
                <>
                  {" · "}
                  {s("timeline.lit")} <Claimed id={lc.claim}>{lc.firmsStart}</Claimed>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export type { PlatformId };
