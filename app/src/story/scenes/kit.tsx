/**
 * Shared pieces of the five scenes: scroll-to-beat helpers (soft easing, staggered entrances), the beat text block, a
 * pause/play control, small cartoon icons and the scene text. Look: rounded shapes, flat fills, 3px outlines, soft
 * shadows (no glow). Motion: scroll-linked through `progress` (native scrolling, nothing hijacked); time-based loops
 * are driven by usePlayback and always have a pause/play.
 */
import { useState, type CSSProperties, type ReactNode } from "react";
import type { Lang } from "../types";
import { useLoopClock } from "../engine/useLoopClock";
import { clamp01 } from "../engine/layout";

export const smooth = (t: number) => t * t * (3 - 2 * t);
/** Soft ease-out: quick start, long gentle landing (premium scroll-story feel). */
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const ramp = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** 1 while `p` is inside [a, b], easing in over `fade` at the start and out over `fade` at the end. */
export function win(p: number, a: number, b: number, fade = 0.04): number {
  return smooth(ramp(p, a, a + fade)) * (1 - smooth(ramp(p, b - fade, b)));
}

/** Index of the slot `p` is in, for `n` equal slots from `from` to `to` (clamped), and the progress inside it. */
export function slotOf(p: number, n: number, from = 0, to = 1): { i: number; t: number } {
  const x = clamp01((p - from) / (to - from)) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return { i, t: x >= n ? 1 : x - i };
}

// ---- scene text: English now; Mongolian is added key by key and falls back to English until then -------------------

export const EN = {
  // chapter 1
  crewsHead: "Meet the crews",
  crewsLine: "Five satellites watch Earth's heat from space.",
  crewsHead2: "What each crew does",
  crewsLine2: "They feel heat and help track fires.",
  // chapter 2
  fireHeadA: "Satellites feel heat from above",
  fireLineA: "A swath sweeps the ground and flags hot spots.",
  fireHeadB: "Same fire, two views",
  fireLineB: "MODIS shows a big dot. VIIRS shows a smaller one.",
  fireModis: "MODIS · big dot",
  fireViirs: "VIIRS · small triangle",
  // chapter 3
  handHeadA: "Five satellites, years of watching",
  handLineA: "Each bar shows how long a satellite has worked.",
  handHeadB: "Terra and Aqua are retiring",
  handLineB: "Their long watch is nearing its end.",
  handHeadC: "NOAA-21 takes over",
  handLineC: "The youngest crew carries the record forward.",
  retiring: "Retiring",
  youngest: "Youngest",
  launched: "Launched",
  // chapter 4
  harmHeadA: "Two sensors, one record",
  harmLineA: "They see fire differently. We bring them together.",
  harmHeadB: "Light from the gap",
  harmLineB: "Where they meet, one clear picture appears.",
  harmHeadC: "Five steps, one clean line",
  harmLineC: "Raw counts become a smooth, comparable record.",
  collect: "Collect",
  align: "Align",
  clean: "Clean",
  calibrate: "Calibrate",
  verify: "Verify",
  rawLine: "Raw",
  smoothLine: "Harmonized",
  band: "Uncertainty (illustrative)",
  // chapter 5
  revHead: "One record. One Mongolia.",
  revLine: "Every sensor, merged into a single set of fires.",
  seeIt: "See it in Mongolia",
  // shared
  pause: "Pause",
  play: "Play",
  fixture: "synthetic / illustrative",
  illustrative: "illustrative",
} as const;

export type SceneKey = keyof typeof EN;
const MN: Partial<Record<SceneKey, string>> = {}; // needs-native-proof: nothing written yet, so English shows

export function sceneText(lang: Lang) {
  return (k: SceneKey): string => (lang === "mn" ? (MN[k] ?? EN[k]) : EN[k]);
}

// ---- beat text -------------------------------------------------------------------------------------------------

/**
 * One headline (<= 8 words) and at most one line (<= 14 words). `v` is the beat's visibility 0..1: the headline rises
 * in first, the line follows a moment later.
 */
export function Beat({ v, headline, line, className = "" }: { v: number; headline: string; line?: string; className?: string }) {
  const rise = (a: number, b: number): CSSProperties => ({
    opacity: ramp(v, a, b),
    transform: `translateY(${(1 - easeOut(ramp(v, a, b))) * 16}px)`,
  });
  return (
    <div className={`beat ${className}`} style={{ visibility: v > 0.01 ? "visible" : "hidden" }} aria-hidden="true">
      <h2 style={rise(0, 0.6)}>{headline}</h2>
      {line && <p style={rise(0.3, 0.9)}>{line}</p>}
    </div>
  );
}

// ---- playback ----------------------------------------------------------------------------------------------------

/**
 * Time-based loop with a pause/play. `still` (reduced motion or ?lite=1) means a static final frame: phase = `rest`.
 * `frozen` is the ?loop=0.3 preview helper.
 */
export function usePlayback(opts: { still: boolean; active: boolean; seconds: number; key: string; rest?: number; frozen?: number | null }) {
  const { still, active, seconds, key, rest = 0.9, frozen = null } = opts;
  const [paused, setPaused] = useState(false);
  const phase = useLoopClock(active && !still && !paused && frozen === null, seconds, key);
  return { phase: still ? rest : (frozen ?? phase), paused, toggle: () => setPaused((p) => !p), canPause: !still && active };
}

export function PlayPause({ paused, onToggle, label }: { paused: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" className="playpause" onClick={onToggle} aria-pressed={paused} aria-label={label} title={label}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        {paused ? <path d="M4,2 L15,9 L4,16 Z" /> : <path d="M3.5,2 H7 V16 H3.5 Z M11,2 H14.5 V16 H11 Z" />}
      </svg>
    </button>
  );
}

/** A small pill naming the sensor: dot + teal for MODIS, triangle + indigo for VIIRS (never colour alone). */
export function SensorTag({ sensor }: { sensor: "MODIS" | "VIIRS" }) {
  return (
    <span className={`tag tag-${sensor.toLowerCase()}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        {sensor === "MODIS" ? <circle cx="6" cy="6" r="4" /> : <path d="M6,1.5 L10.5,10 L1.5,10 Z" />}
      </svg>
      {sensor}
    </span>
  );
}

// ---- icons (24px, rounded, 3px-style outlines scaled down) ------------------------------------------------------------

type IconName = "heat" | "map" | "record" | "pair" | "star" | "flame" | "check";

export function Icon({ name }: { name: IconName }): ReactNode {
  const common = { width: 34, height: 34, viewBox: "0 0 24 24", fill: "none", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "heat":
      return (
        <svg {...common} className="icon icon-teal">
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <circle cx="12" cy="17.5" r="3.5" fill="currentColor" />
          <path d="M18,6 q2,2 0,4 M20.5,4.5 q3,3.5 0,7" />
        </svg>
      );
    case "map":
      return (
        <svg {...common} className="icon icon-cream">
          <path d="M12,21 C6,14 5,11 5,9 a7,7 0 0 1 14,0 c0,2 -1,5 -7,12 Z" />
          <circle cx="12" cy="9" r="2.5" fill="currentColor" />
        </svg>
      );
    case "record":
      return (
        <svg {...common} className="icon icon-cream">
          <path d="M3,20 H21 M3,20 V4" />
          <path d="M6,15 l4,-4 3,3 6,-7" />
        </svg>
      );
    case "pair":
      return (
        <svg {...common} className="icon icon-indigo">
          <circle cx="8" cy="12" r="4.5" />
          <circle cx="16" cy="12" r="4.5" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} className="icon icon-indigo">
          <path d="M12,3 l2.7,5.8 6.3,.8 -4.6,4.3 1.2,6.3 L12,17.2 6.4,20.2 7.6,13.9 3,9.6 l6.3,-.8 Z" fill="currentColor" />
        </svg>
      );
    case "flame":
      return (
        <svg {...common} className="icon icon-ember">
          <path d="M12,3 c1,4 5,5.5 5,10.5 a5,5 0 0 1 -10,0 c0,-2 1,-3 2,-4 c0,2 1,2.5 2,2.5 c-1,-3 0,-6 1,-9 Z" fill="currentColor" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} className="icon icon-teal">
          <circle cx="12" cy="12" r="9" />
          <path d="M8,12.5 l3,3 5,-6" />
        </svg>
      );
  }
}
