/**
 * The chapter registry: story order = array order. S-01 uses placeholder stages for every chapter;
 * real chapters replace their entry here as they are built (ch7, ch8 in S-02).
 */
import raw from "../chapters.json";
import type { ChapterDef, KeyframeSpec } from "../types";
import { resolveKeyframe } from "../engine/stageState";
import { Ch3Crews } from "./Ch3Crews";
import { Ch1Crews } from "../scenes/Ch1Crews";
import { Ch2Fire } from "../scenes/Ch2Fire";
import { Ch3Handover } from "../scenes/Ch3Handover";
import { Ch4Harmonize } from "../scenes/Ch4Harmonize";
import { Ch5Reveal } from "../scenes/Ch5Reveal";
import { Ch1Notes, Ch2Notes, Ch3Notes, Ch4Notes, Ch5Notes } from "../scenes/notes";
import { Ch7Handover } from "./Ch7Handover";
import { Ch8Harmonization } from "./Ch8Harmonization";
import { CrewsNotes, HandoverNotes, HarmonizeNotes } from "./notes";
import { Placeholder } from "./Placeholder";

interface CopyJson {
  headline: string;
  body: string;
  caption?: string;
  alt: string;
}

interface ChapterJson {
  id: string;
  lengthVh: number;
  data: string[];
  claims: string[];
  chartHeightDvh?: number;
  chartStyle?: "bare";
  own?: boolean;
  scene?: ChapterDef["scene"];
  keyframes: KeyframeSpec[];
  en: CopyJson;
  mn: CopyJson | null;
}

/** Real chapter stages by id. Anything not listed here shows the placeholder. */
const STAGES: Partial<Record<string, ChapterDef["Stage"]>> = {
  "ch1-crews": Ch1Crews,
  "ch2-fire": Ch2Fire,
  "ch3-handover": Ch3Handover,
  "ch4-harmonize": Ch4Harmonize,
  "ch5-reveal": Ch5Reveal,
  "ch3-crews": Ch3Crews,
  "ch7-handover": Ch7Handover,
  "ch8-harmonization": Ch8Harmonization,
};

/** Material for the "Sources & notes" panel, by chapter id. */
const NOTES: Partial<Record<string, ChapterDef["Notes"]>> = {
  "ch1-crews": Ch1Notes,
  "ch2-fire": Ch2Notes,
  "ch3-handover": Ch3Notes,
  "ch4-harmonize": Ch4Notes,
  "ch5-reveal": Ch5Notes,
  "ch3-crews": CrewsNotes,
  "ch7-handover": HandoverNotes,
  "ch8-harmonization": HarmonizeNotes,
};

/**
 * The five chapters of the story, in order. Every other entry in chapters.json (ch0-numrug ... ch10-back, the earlier
 * ch3-crews / ch7-handover / ch8-harmonization drafts) stays in the files but is NOT registered, so it is not shown.
 */
export const REGISTERED = ["ch1-crews", "ch2-fire", "ch3-handover", "ch4-harmonize", "ch5-reveal"] as const;

function build(c: ChapterJson): ChapterDef {
  const pick = (lang: "en" | "mn") => (lang === "mn" && c.mn ? c.mn : c.en);
  return {
    id: c.id,
    lengthVh: c.lengthVh,
    copy: (lang) => {
      const { headline, body, caption } = pick(lang);
      return { headline, body, caption };
    },
    alt: (lang) => pick(lang).alt,
    keyframes: c.keyframes.map(resolveKeyframe) as ChapterDef["keyframes"],
    Stage: STAGES[c.id] ?? Placeholder,
    data: c.data,
    claims: c.claims,
    chartHeightDvh: c.chartHeightDvh,
    chartStyle: c.chartStyle,
    scene: c.scene,
    own: c.own,
    Notes: NOTES[c.id],
  };
}

const ALL = raw.chapters as unknown as ChapterJson[];

/** The registered chapters, in REGISTERED order. */
export const CHAPTERS: ChapterDef[] = REGISTERED.map((id) => ALL.find((c) => c.id === id)).filter((c): c is ChapterJson => c !== undefined).map(build);

/** Ids of chapters that exist in chapters.json but are not registered. */
export const UNREGISTERED: string[] = ALL.map((c) => c.id).filter((id) => !(REGISTERED as readonly string[]).includes(id));
