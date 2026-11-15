import { describe, expect, it } from "vitest";
import type { WorldContinent, WorldIndexFile } from "../data/contracts";
import { matchLines } from "./matchData";

const match: NonNullable<WorldIndexFile["match"]> = {
  pair: "noaa20_vs_aqua",
  window_min: 60,
  sensitivity_window_min: 180,
  earth_radius_m: 6371000,
  r_match: "0.5*sqrt(scan^2+track^2)+0.1875 km",
  not_comparable_km: 300,
  iou_cell_resolution: 5,
};

// Ази, fixtures/world/index.json-оос хуулсан тоо (#37): Aqua 26 both, 16 modis_only, 5 not_comparable; NOAA-20 unit 26 / 54 / 21.
const base: WorldContinent = {
  id: "asia",
  name_en: "Asia",
  name_mn: "Ази",
  bbox: [25, -11, 180, 82],
  points_file: "points_asia.json",
  n_points: 0,
  n_by_platform: { terra: 0, aqua: 0, snpp: 0, noaa20: 0, noaa21: 0 },
};
const asia: WorldContinent = {
  ...base,
  iou: 0.2185,
  p_v_given_m: 0.619,
  p_m_given_v: 0.325,
  not_comparable_share: { aqua: 0.1064, noaa20_units: 0.2079 },
  match_counts: {
    aqua: { both: 26, modis_only: 16, not_comparable: 5 },
    noaa20_units: { both: 26, viirs_only: 54, not_comparable: 21 },
  },
};

describe("matchLines (continent match stats -> stats row lines)", () => {
  it("gives no row before #37: no match keys on the continent or no match constants in the index", () => {
    expect(matchLines(base, match)).toBeNull();
    expect(matchLines(asia, undefined)).toBeNull();
  });

  it("states IoU, both probabilities with the counts and the time window behind them, and the Not comparable share", () => {
    expect(matchLines(asia, match)).toEqual([
      { key: "world.stats.iou", ratios: { v: 0.2185 } },
      { key: "world.stats.pvm", shares: { v: 0.619 }, counts: { both: 26, n: 42, window: 60 } },
      { key: "world.stats.pmv", shares: { v: 0.325 }, counts: { both: 26, n: 80, window: 60 } },
      { key: "world.stats.nc", shares: { aqua: 0.1064, units: 0.2079 }, counts: { km: 300, window: 60 } },
    ]);
  });

  it("turns a null value into its own sentence (no 'N/A'), and still states the Not comparable share", () => {
    // Aqua-д харьцуулж болох hotspot огт алга, NOAA-20 талд hotspot огт алга.
    const empty: WorldContinent = {
      ...asia,
      iou: null,
      p_v_given_m: null,
      p_m_given_v: null,
      not_comparable_share: { aqua: 1, noaa20_units: null },
      match_counts: {
        aqua: { both: 0, modis_only: 0, not_comparable: 4 },
        noaa20_units: { both: 0, viirs_only: 0, not_comparable: 0 },
      },
    };
    expect(matchLines(empty, match)).toEqual([
      { key: "world.stats.iou.none" },
      { key: "world.stats.pvm.none" },
      { key: "world.stats.pmv.none" },
      { key: "world.stats.nc", shares: { aqua: 1, units: null }, counts: { km: 300, window: 60 } },
    ]);
  });
});
