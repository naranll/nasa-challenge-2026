import { describe, expect, it } from "vitest";
import type {
  CalendarFile,
  CalendarMonth,
  ChainPlatform,
  HexYearHarmFile,
  HexYearRawFile,
  ValidationFile,
} from "../data/contracts";
import { chainPlatformByYear, globeYears, handovers, methodTests, resultLine } from "./harmonizeData";

/** A month whose counting platform saw `own` hotspots; Terra's 99 is never part of the series. */
function month(ym: string, chain: ChainPlatform, is_forecast = false, own = 10): CalendarMonth {
  return { ym, harmonized: 1, chain_platform: chain, raw: { [chain]: own, terra: 99 }, is_forecast, flags: [] };
}
const months = (year: number, chain: (m: number) => ChainPlatform, count = 12, own = (c: ChainPlatform) => (c === "aqua" ? 10 : 40)) =>
  Array.from({ length: count }, (_, i) => {
    const c = chain(i + 1);
    return month(`${year}-${String(i + 1).padStart(2, "0")}`, c, false, own(c));
  });

function calendar(ms: CalendarMonth[]): CalendarFile {
  return { schema_version: "0.1", synthetic: false, region_id: "mongolia", unit: "aqua_equivalent_hotspots", reference_years: [2003, 2025], months: ms };
}

describe("chainPlatformByYear", () => {
  it("gives the platform that counts most of each year's months (2012: S-NPP from February)", () => {
    const cal = calendar([...months(2011, () => "aqua"), ...months(2012, (m) => (m === 1 ? "aqua" : "snpp"))]);
    expect(chainPlatformByYear(cal)).toEqual(new Map([[2011, "aqua"], [2012, "snpp"]]));
  });

  it("ignores forecast months", () => {
    const cal = calendar([month("2026-10", "snpp"), month("2026-11", "noaa20", true), month("2026-12", "noaa20", true)]);
    expect(chainPlatformByYear(cal).get(2026)).toBe("snpp");
  });
});

describe("globeYears", () => {
  const raw: HexYearRawFile = {
    schema_version: "0.1", synthetic: false, resolution: 5, kind: "raw_pixels", years: [2011, 2012, 2013],
    cells: [
      { id: "a", lat: 47, lon: 100, counts: { aqua: [10, 12, 9], snpp: [null, 48, 40], terra: [11, 11, 11] } },
      { id: "b", lat: 48, lon: 110, counts: { aqua: [2, 0, 1], snpp: [null, 6, null] } },
    ],
  };
  const harm: HexYearHarmFile = {
    schema_version: "0.1", synthetic: false, resolution: 5, kind: "aqua_equivalent", years: [2011, 2012, 2013],
    cells: [
      { id: "b", lat: 48, lon: 110, counts: [2, 1, null] },
      { id: "a", lat: 47, lon: 100, counts: [10, 11, 10] },
    ],
  };
  const chain = new Map<number, ChainPlatform>([[2011, "aqua"], [2012, "snpp"], [2013, "snpp"]]);

  it("shows each year's chain platform on the raw side, so the raw globe jumps when S-NPP takes over", () => {
    const g = globeYears(raw, harm, chain);
    expect(g.years).toEqual([2011, 2012, 2013]);
    expect(g.cells).toEqual([
      { id: "a", lat: 47, lon: 100, raw: [10, 48, 40], harm: [10, 11, 10] },
      { id: "b", lat: 48, lon: 110, raw: [2, 6, null], harm: [2, 1, null] },
    ]);
  });

  it("sums all cells per year, and gives one maximum for both globes so they share a scale", () => {
    const g = globeYears(raw, harm, chain);
    expect(g.totals).toEqual({ raw: [12, 54, 40], harm: [12, 12, 10] });
    expect(g.max).toBe(48);
  });

  it("leaves a year unknown (null) when the calendar has no chain platform for it", () => {
    const g = globeYears(raw, harm, new Map([[2011, "aqua"]]));
    expect(g.cells[0].raw).toEqual([10, null, null]);
    expect(g.totals.raw).toEqual([12, null, null]);
  });
});

describe("resultLine", () => {
  const cal = calendar([
    ...months(2011, () => "aqua"),
    ...months(2012, (m) => (m === 1 ? "aqua" : "snpp")),
    ...months(2013, () => "snpp", 6),
    month("2026-11", "noaa20", false, 30),
    month("2026-12", "noaa20", true, 500),
  ]);
  const validation: ValidationFile = {
    schema_version: "0.1", synthetic: false,
    tests: [
      { id: "aqua_forward", metric: "WAPE", value: 0.2 },
      { id: "aqua_loyo", metric: "WAPE", value: 0.143, baseline_value: 0.19 },
    ],
  };

  it("counts the chain platforms, the full years and the hotspots that make up the series, plus the Aqua rebuild WAPE", () => {
    // 2011: 12 x 10 (Aqua) · 2012: 10 + 11 x 40 · 2013 (half year): 6 x 40 · 2026-11: 30 (NOAA-20). Forecast and Terra never count.
    expect(resultLine(cal, validation)).toEqual({ satellites: 3, years: 2, hotspots: 840, wape: 0.143 });
  });

  it("leaves out (null) what a missing file cannot tell", () => {
    expect(resultLine(cal, null)).toMatchObject({ satellites: 3, wape: null });
    expect(resultLine(null, validation)).toEqual({ satellites: null, years: null, hotspots: null, wape: 0.143 });
  });
});

describe("methodTests", () => {
  const validation: ValidationFile = {
    schema_version: "0.1", synthetic: false,
    tests: [
      { id: "r2_loyo", metric: "WAPE", value: 0.05 },
      { id: "year_rank_spearman", metric: "Spearman", value: 0.99 },
      { id: "aqua_forward", metric: "WAPE", value: 0.2 },
      { id: "aqua_loyo", metric: "WAPE", value: 0.143, baseline_value: 0.19 },
    ],
  };

  it("lists the four Method results in a fixed order; the one-ratio baseline is compared with the monthly ratios", () => {
    expect(methodTests(validation)).toEqual([
      { key: "aqua_rebuild", metric: "WAPE", value: 0.143, compareTo: null },
      { key: "forward", metric: "WAPE", value: 0.2, compareTo: null },
      { key: "one_ratio", metric: "WAPE", value: 0.19, compareTo: 0.143 },
      { key: "noaa20_ratio", metric: "WAPE", value: 0.05, compareTo: null },
    ]);
  });

  it("keeps a row whose result is not in the file, with an unknown (null) value", () => {
    const rows = methodTests({ ...validation, tests: [{ id: "aqua_loyo", metric: "WAPE", value: 0.143 }] });
    expect(rows.map((r) => [r.key, r.value])).toEqual([
      ["aqua_rebuild", 0.143],
      ["forward", null],
      ["one_ratio", null],
      ["noaa20_ratio", null],
    ]);
    expect(methodTests(null).every((r) => r.value === null)).toBe(true);
  });
});

describe("handovers", () => {
  it("lists each year where a new platform starts counting, not the first platform", () => {
    const chain = new Map<number, ChainPlatform>([[2010, "aqua"], [2011, "aqua"], [2012, "snpp"], [2013, "snpp"], [2027, "noaa20"]]);
    expect(handovers(chain)).toEqual([{ year: 2012, platform: "snpp" }, { year: 2027, platform: "noaa20" }]);
  });
});
