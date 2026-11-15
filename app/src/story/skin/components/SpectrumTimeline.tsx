import { useMemo, type CSSProperties } from "react";
import type { Sensor } from "../tokens";

export interface TimelineEvent {
  id: string;
  label: string;
  sensor: Sensor;
  kind: "launch" | "retire";
  /** Calendar year. Used for position AND printed only when `verified` is true. */
  year?: number;
  /** Must be true (the claim is checked, not marked [verify] in claims.json) for the year to be printed. */
  verified?: boolean;
}

export interface SpectrumTimelineProps {
  events: TimelineEvent[];
  /** Year range of the bar. Only used to place verified events. */
  range?: [number, number];
  orientation?: "vertical" | "horizontal";
  /** Bar length in px (vertical) or CSS width (horizontal). */
  length?: number;
  /** Accessible summary of the whole timeline. */
  summary: string;
  className?: string;
}

/**
 * Tall spectrum bar as a timeline (teal MODIS era, white where the sensors overlap, indigo VIIRS era),
 * on a faint grid. Markers pair colour with shape: MODIS = circle, VIIRS = triangle; retirement = hollow.
 *
 * Placement: events with `verified: true` and a `year` sit at their true position and print the year.
 * Anything else prints a pink "[ verify ]" placeholder and is spaced evenly in the gaps (order only,
 * not to scale). A figure is never invented.
 */
export function SpectrumTimeline({ events, range = [1999, 2030], orientation = "vertical", length = 560, summary, className = "" }: SpectrumTimelineProps) {
  const placed = useMemo(() => {
    const [a, b] = range;
    const n = events.length;
    return events.map((e, i) => {
      const exact = e.verified === true && typeof e.year === "number";
      const t = exact ? (e.year! - a) / (b - a) : (i + 0.5) / n;
      return { e, exact, t: Math.min(0.98, Math.max(0.02, t)) };
    });
  }, [events, range]);
  const vertical = orientation === "vertical";
  const style = { "--tl-length": vertical ? `${length}px` : "100%" } as CSSProperties;
  return (
    <figure className={`sk-timeline sk-timeline--${orientation} ${className}`} style={style}>
      <figcaption className="sk-sr">{summary}</figcaption>
      <div className="sk-timeline__bar" aria-hidden="true">
        <div className="sk-timeline__grid" />
      </div>
      <ol className="sk-timeline__events">
        {placed.map(({ e, exact, t }) => (
          <li key={e.id} className={`sk-tl-event sk-tl-event--${e.sensor.toLowerCase()} ${e.kind}`} style={{ "--t": `${(t * 100).toFixed(2)}%` } as CSSProperties}>
            <svg className="sk-tl-mark" width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true">
              {e.sensor === "MODIS" ? <circle r="5" /> : <path d="M0 -6 L6 5 L-6 5Z" />}
            </svg>
            <span className="sk-tl-text">
              <span className="sk-tl-name">{e.label}</span>
              <span className="sk-tl-kind">{e.kind === "launch" ? "LAUNCH" : "RETIRES"}</span>
              {exact ? <span className="sk-tl-year">{e.year}</span> : <span className="sk-tl-verify">[ verify ]</span>}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
