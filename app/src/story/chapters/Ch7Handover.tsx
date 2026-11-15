/**
 * Chapter 7, "The handover". The persistent chart is now one ember line that runs straight through the changes of
 * satellite. In front of the map, three pictures: Terra and Aqua dim as their service ends, NOAA-21 lights up when it
 * enters FIRMS. The lifespan table, step keys and ratio note are gone from the screen; they live in "Sources & notes".
 */
import { SatImage } from "../components/SatImage";
import { decimalYear, fadeAt, LIFECYCLE } from "../data/handover";
import { handoverYear, smooth } from "../engine/hero";
import type { StageProps } from "../types";

const lifecycle = LIFECYCLE.platforms as Record<string, { end?: string; firmsStart?: string }>;
const END = { terra: decimalYear(lifecycle.terra.end ?? "2027-01"), aqua: decimalYear(lifecycle.aqua.end ?? "2027-09") };
const NOAA21_IN = decimalYear(lifecycle.noaa21.firmsStart ?? "2024-01");
const LIGHT_SPAN = 0.6; // years over which NOAA-21 lights up

/** Brightness (0..1) of the three pictures at a decimal year. Pure. */
export function handoverLight(year: number): { terra: number; aqua: number; noaa21: number } {
  return {
    terra: fadeAt(year, END.terra, 0.5, 0),
    aqua: fadeAt(year, END.aqua, 0.5, 0),
    noaa21: smooth(Math.min(1, Math.max(0, (year - NOAA21_IN) / LIGHT_SPAN))),
  };
}

export function Ch7Handover({ progress, reduced, lowBandwidth }: StageProps) {
  const still = reduced || lowBandwidth;
  const light = handoverLight(handoverYear(progress, still));
  return (
    <div className="story-handover">
      <SatImage id="terra" light={light.terra} />
      <SatImage id="aqua" light={light.aqua} />
      <SatImage id="noaa21" light={light.noaa21} />
    </div>
  );
}
