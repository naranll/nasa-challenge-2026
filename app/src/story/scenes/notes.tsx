/**
 * "Sources & notes" for the five chapters. The screens carry a headline, one line and a few icon + short phrase items;
 * every detail, caveat and open [verify] item is here instead.
 */
import { WorkflowFigure } from "../components/WorkflowFigure";
import { Claimed } from "../components/Claimed";
import { DETECTIONS_PER_MARK } from "../data/hotspots";
import { LIFECYCLE } from "../data/handover";
import { BAND_SHARE } from "./Ch4Harmonize";
import { CREW } from "./Ch1Crews";
import { SATELLITES } from "../components/SatelliteShot";

const open = (text: string) => (
  <li key={text}>
    <strong>[verify]</strong> {text}
  </li>
);

export function Ch1Notes() {
  return (
    <>
      <h4>What each crew does</h4>
      <ul>
        {CREW.map((c) => (
          <li key={c.id}>
            <strong>{SATELLITES[c.id].name}</strong> ({c.sensor}, “{SATELLITES[c.id].nickname.en}”): {c.sense.toLowerCase()}; {c.use.toLowerCase()}.
          </li>
        ))}
      </ul>
      <h4>Open items</h4>
      <ul>
        {open("“Morning pass” and “afternoon pass” follow the nicknames in the project brief. Local overpass times are not shown until checked against NASA.")}
        {open("“Finer detail” for VIIRS compares its pixel size with MODIS. No pixel sizes are printed until sourced.")}
        {open("Nicknames (“the morning veteran” and so on) are the brief's own wording, not official names.")}
      </ul>
      <h4>Pictures</h4>
      <p>
        The satellites are stylized illustrations made from NASA 3D models (Terra, Aqua, Suomi NPP) and agency renders (NOAA-20, NOAA-21). Credit NASA and NOAA wherever this is published; no logo implies endorsement. The dot globe is
        decoration: its hotspots are scattered at random and are not real detections.
      </p>
    </>
  );
}

export function Ch2Notes() {
  return (
    <>
      <h4>What the picture shows</h4>
      <p>
        A simplified illustration. The band is a swath, the strip of ground a sensor sees on one pass. The same fire is reported by MODIS as one larger mark and by VIIRS as a smaller one, because VIIRS looks at the ground in finer
        cells. Sizes are not to scale and no numbers are shown.
      </p>
      <h4>Open items</h4>
      <ul>
        {open("Pixel size and swath width of each sensor: add only with a NASA source and a claim ID.")}
        {open("Why a fire stands out in the ~4 µm band against ~11 µm (the physics) is in the unregistered earlier chapter 5 and is not part of this story yet.")}
      </ul>
    </>
  );
}

const PLATFORM_NAMES: Record<string, string> = { terra: "Terra", aqua: "Aqua", snpp: "Suomi NPP", noaa20: "NOAA-20", noaa21: "NOAA-21" };

export function Ch3Notes() {
  const lc = LIFECYCLE.platforms as Record<string, { end?: string; firmsStart?: string; claim?: string }>;
  return (
    <>
      <h4>What is on screen</h4>
      <p>
        Each bar runs from the satellite's launch year to the current year. Launch years come from the real satellites.json (<Claimed id="S-C10">claim S-C10</Claimed>, sources recorded in docs/claims.md). “Retiring” and
        “Youngest” carry no dates.
      </p>
      <h4>Open items: dates kept off the screen</h4>
      <ul>
        {(["terra", "aqua"] as const).map((id) =>
          lc[id]?.end ? open(`${PLATFORM_NAMES[id]} planned end of service: ${lc[id].end} (from the project brief). Claim S-C11.`) : null,
        )}
        {lc.snpp?.end && open(`Suomi NPP production in FIRMS ended ${lc.snpp.end}. Claim S-C12.`)}
        {lc.noaa21?.firmsStart && open(`NOAA-21 in FIRMS since ${lc.noaa21.firmsStart} per the brief; the synthetic pipeline fixture lists 2023-03 as its first detection. Check which is right before printing either. Claim S-C13.`)}
        {open("“Retiring” is shown for Terra and Aqua because both are expected to end service soon; confirm the wording against the NASA notices.")}
      </ul>
    </>
  );
}

export function Ch4Notes() {
  return (
    <>
      <h4>Hands, light, flow</h4>
      <p>
        The two hands are original line art, an homage to the idea of two figures reaching toward each other, not a copy of any artwork. Teal is MODIS, indigo is VIIRS. The warm white light is decoration, not data.
      </p>
      <h4>The chart</h4>
      <p>
        Raw = the reference-chain platform's own yearly counts as recorded, coloured by sensor (<Claimed id="S-C16">claim S-C16</Claimed>); the jump is where the sensor changes. The smooth line is the harmonized series (
        <Claimed id="S-C02">claim S-C02</Claimed>). The band is <strong>illustrative</strong>: a band about {Math.round(BAND_SHARE * 100)}% of the chart height drawn around the line, not a measured uncertainty. Data: fixture calendar/mongolia.json, synthetic until the
        real file exists.
      </p>
      <h4>The five steps</h4>
      <p>Collect (ingest and common format) · Align (match to the Aqua reference) · Clean (gap mask, filters, de-duplication) · Calibrate (ratios) · Verify (validation). The grouping of the eight steps below into five is a simplification; confirm it with the pipeline owner.</p>
      <WorkflowFigure progress={1} still />
    </>
  );
}

export function Ch5Notes() {
  return (
    <>
      <h4>What is on screen</h4>
      <p>
        The outline is Mongolia's border from the repository's globe/assets/mongolia.json. The orange marks are <strong>illustrative</strong>: each is drawn at a seeded random spot inside a cell of the harmonized hex grid and stands
        for about {DETECTIONS_PER_MARK} detections. They are not real detection positions (<Claimed id="S-C17">claim S-C17</Claimed>). The data is a synthetic fixture until the real hex_year files exist.
      </p>
      <h4>Where it leads</h4>
      <p>“See it in Mongolia” opens the app's dashboard (#/dashboard). Mongolia appears only in this chapter.</p>
    </>
  );
}
