/**
 * The chapter registry: story order = array order. S-01 uses placeholder stages for every chapter;
 * real chapters replace their entry here as they are built (ch7, ch8 in S-02).
 */
import raw from "../chapters.json";
import type { ChapterDef, KeyframeSpec } from "../types";
import { resolveKeyframe } from "../engine/stageState";
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
  keyframes: KeyframeSpec[];
  en: CopyJson;
  mn: CopyJson | null;
}

/** Real chapter stages by id. Anything not listed here shows the placeholder. */
const STAGES: Partial<Record<string, ChapterDef["Stage"]>> = {};

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
  };
}

export const CHAPTERS: ChapterDef[] = (raw.chapters as unknown as ChapterJson[]).map(build);
