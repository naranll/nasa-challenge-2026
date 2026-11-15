/**
 * Chapter 3, "The two crews". A large satellite picture in the foreground; the Mongolia outline and its hotspots
 * sit behind (hero layer). The MODIS swath ignites a few large dots, then the VIIRS swath ignites many small
 * triangles. The scroll drives it (see heroState); this stage only swaps the pictures between the two crews.
 */
import { SatImage } from "../components/SatImage";
import type { StageProps } from "../types";

const SWAP = [0.46, 0.56];
const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

export function Ch3Crews({ progress, reduced, lowBandwidth }: StageProps) {
  const still = reduced || lowBandwidth;
  // With reduced motion the whole picture is already drawn, so the foreground is the last crew's picture.
  const toViirs = still ? 1 : smooth((progress - SWAP[0]) / (SWAP[1] - SWAP[0]));
  const layer = (visible: number) => ({ opacity: visible, visibility: visible > 0.01 ? ("visible" as const) : ("hidden" as const) });
  return (
    <div className="story-crews">
      <div className="story-crew" style={layer(1 - toViirs)} data-crew="modis">
        <SatImage id="terra" large />
        <SatImage id="aqua" large />
      </div>
      <div className="story-crew" style={layer(toViirs)} data-crew="viirs">
        <SatImage id="snpp" large />
        <SatImage id="noaa20" large />
        <SatImage id="noaa21" large />
      </div>
    </div>
  );
}
