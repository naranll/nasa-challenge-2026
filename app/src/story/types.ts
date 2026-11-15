/** Shared types for the /story page. Nothing here touches the rest of the app. */
import type { FC } from "react";
import type { Lang } from "../i18n";

export type { Lang };

/** Where the persistent globe looks and how bright it is. */
export interface GlobeTarget {
  lat: number;
  lng: number;
  /** Camera distance above the surface in globe radii (react-globe.gl "altitude"). */
  altitude: number;
  /** 0 = very dark, 1 = full texture. */
  brightness: number;
}

/** State of the persistent "detections per year" chart. */
export interface ChartTarget {
  /** 0 = hidden, 1 = fully visible. */
  visible: number;
  /** 0..1: how much of the year axis has been drawn, left to right. */
  reveal: number;
  /** 0 = every platform's own raw count, 1 = the single harmonized line. */
  harmonize: number;
}

export interface StageTarget {
  globe: GlobeTarget;
  chart: ChartTarget;
}

/** JSON-friendly camera focus. Real coordinates are added per chapter once their data exists. */
export type GlobeFocus = "mongolia" | "world" | { lat: number; lng: number };

export interface KeyframeSpec {
  globe: { focus: GlobeFocus; altitude: number; brightness: number };
  chart: ChartTarget;
}

export interface StageProps {
  /** 0..1 progress through this chapter. */
  progress: number;
  reduced: boolean;
  lang: Lang;
  lowBandwidth: boolean;
}

export interface ChapterCopy {
  headline: string;
  body: string;
  caption?: string;
}

/** The chapter contract (brief §4) plus `alt` and `keyframes`, added so chapters can steer the persistent stage. */
export type ChapterDef = {
  id: string;
  /** Scroll distance in viewport heights. The last chapter also holds the 100 vh that scrolls the stage away. */
  lengthVh: number;
  copy: (lang: Lang) => ChapterCopy;
  alt: (lang: Lang) => string;
  /** Persistent-stage targets at chapter progress 0, 0.5 and 1. */
  keyframes: [StageTarget, StageTarget, StageTarget];
  Stage: FC<StageProps>;
  /** Artifact paths this chapter reads (never hard-coded numbers). */
  data: string[];
  /** Claim IDs (claims.json) for every number on screen. */
  claims: string[];
};
