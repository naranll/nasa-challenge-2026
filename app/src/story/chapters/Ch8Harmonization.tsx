/**
 * Chapter 8, "How we harmonize". The scene is the hero layer: sparse large dots (MODIS) and dense small triangles
 * (VIIRS) fall into a five-box pipeline and leave as one uniform hotspot map, while the persistent chart draws one
 * smooth line. It loops by itself (see heroState); the pause control is in the engine. This stage has nothing of its own
 * to draw, so it stays empty. The detailed workflow (Figure 1) is in "Sources & notes".
 */
import type { StageProps } from "../types";

export function Ch8Harmonization(_props: StageProps) {
  return null;
}
