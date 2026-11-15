/** Pure: turns a chapter's three keyframes and its progress into the persistent stage's target. */
import { MONGOLIA_CENTER } from "../../globe/geo";
import type { ChapterDef, GlobeFocus, KeyframeSpec, StageTarget } from "../types";
import { clamp01 } from "./layout";

/** Share of a chapter spent flying in from the previous chapter's last keyframe. */
export const FLY_IN = 0.15;

const WORLD_VIEW = { lat: 20, lng: MONGOLIA_CENTER.lng };

export function resolveFocus(focus: GlobeFocus): { lat: number; lng: number } {
  if (focus === "mongolia") return MONGOLIA_CENTER;
  if (focus === "world") return WORLD_VIEW;
  return focus;
}

export function resolveKeyframe(k: KeyframeSpec): StageTarget {
  const { lat, lng } = resolveFocus(k.globe.focus);
  return { globe: { lat, lng, altitude: k.globe.altitude, brightness: k.globe.brightness }, chart: { ...k.chart } };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smooth start and end, so the camera does not lurch when a chapter changes. */
export const ease = (t: number) => t * t * (3 - 2 * t);

/** Interpolate longitude along the short way round the globe. */
export function lerpLng(a: number, b: number, t: number): number {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return a + d * t;
}

export function blend(a: StageTarget, b: StageTarget, t: number): StageTarget {
  return {
    globe: {
      lat: lerp(a.globe.lat, b.globe.lat, t),
      lng: lerpLng(a.globe.lng, b.globe.lng, t),
      altitude: lerp(a.globe.altitude, b.globe.altitude, t),
      brightness: lerp(a.globe.brightness, b.globe.brightness, t),
    },
    chart: {
      visible: lerp(a.chart.visible, b.chart.visible, t),
      reveal: lerp(a.chart.reveal, b.chart.reveal, t),
      harmonize: lerp(a.chart.harmonize, b.chart.harmonize, t),
    },
  };
}

/** Piecewise-linear through keyframes at progress 0, 0.5, 1. */
export function sampleKeyframes(k: ChapterDef["keyframes"], p: number): StageTarget {
  const x = clamp01(p);
  return x <= 0.5 ? blend(k[0], k[1], x * 2) : blend(k[1], k[2], (x - 0.5) * 2);
}

/**
 * The target for chapter `index` at progress `p`. Continuous across chapters: at p = 0 it equals the previous
 * chapter's last keyframe. With reduced motion there is no flight: the target steps between the three keyframes.
 */
export function stageAt(keyframes: ChapterDef["keyframes"][], index: number, p: number, reduced: boolean): StageTarget {
  const k = keyframes[index];
  if (reduced) return k[p < 1 / 3 ? 0 : p < 2 / 3 ? 1 : 2];
  const here = sampleKeyframes(k, p);
  if (index === 0 || p >= FLY_IN) return here;
  const prevEnd = keyframes[index - 1][2];
  return blend(prevEnd, here, ease(p / FLY_IN));
}
