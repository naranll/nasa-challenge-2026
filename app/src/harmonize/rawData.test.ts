import { describe, expect, it } from "vitest";
import type { CalendarFile, PipelineStats } from "../globe/homeData";
import { monthlySeries, regionSummary, satelliteRows, viirsStart } from "./rawData";

const empty = { terra: null, aqua: null, snpp: null, noaa20: null, noaa21: null };
const calendar = (months: CalendarFile["months"]): CalendarFile => ({
  schema_version: "0.1",
  synthetic: false,
  region_id: "mongolia",
  months,
});

describe("monthlySeries", () => {
  it("keeps numbers, drops null and forecast months, sorts by month", () => {
    const s = monthlySeries(
      calendar([
        { ym: "2012-02", raw: { ...empty, aqua: 5, snpp: 20 } },
        { ym: "2012-01", raw: { ...empty, aqua: 4 } },
        { ym: "2012-03", raw: { ...empty, aqua: 9 }, is_forecast: true },
      ]),
    );
    expect(s.aqua).toEqual([
      { ym: "2012-01", count: 4 },
      { ym: "2012-02", count: 5 },
    ]);
    expect(s.snpp).toEqual([{ ym: "2012-02", count: 20 }]);
    expect(s.terra).toEqual([]);
  });
});

describe("regionSummary", () => {
  it("sums all platforms and finds first and last month with hotspots", () => {
    const s = monthlySeries(
      calendar([
        { ym: "2002-07", raw: { ...empty, terra: 0, aqua: 0 } },
        { ym: "2002-08", raw: { ...empty, terra: 2, aqua: 3 } },
        { ym: "2012-02", raw: { ...empty, aqua: 1, snpp: 10 } },
        { ym: "2012-03", raw: { ...empty, aqua: 0, snpp: 0 } },
      ]),
    );
    expect(regionSummary(s)).toEqual({ total: 16, firstYm: "2002-08", lastYm: "2012-02" });
  });

  it("says unknown when there are no hotspots", () => {
    const s = monthlySeries(calendar([{ ym: "2002-07", raw: { ...empty, aqua: 0 } }]));
    expect(regionSummary(s)).toEqual({ total: 0, firstYm: null, lastYm: null });
  });
});

describe("viirsStart", () => {
  it("is the first month any VIIRS platform has a number", () => {
    const s = monthlySeries(
      calendar([
        { ym: "2012-01", raw: { ...empty, aqua: 4 } },
        { ym: "2012-02", raw: { ...empty, aqua: 5, snpp: 0 } },
      ]),
    );
    expect(viirsStart(s)).toBe("2012-02");
    expect(viirsStart(monthlySeries(calendar([])))).toBeNull();
  });
});

describe("satelliteRows", () => {
  it("reads rows and years, null when missing", () => {
    const stats: PipelineStats = {
      schema_version: "0.1",
      synthetic: false,
      rows_by_platform: { aqua: 100 },
      first_detection: { aqua: "2002-07-04" },
      last_detection: { aqua: "2026-11-14" },
    };
    const rows = satelliteRows(stats);
    expect(rows.find((r) => r.id === "aqua")).toEqual({ id: "aqua", rows: 100, firstYear: 2002, lastYear: 2026 });
    expect(rows.find((r) => r.id === "terra")).toEqual({ id: "terra", rows: null, firstYear: null, lastYear: null });
  });
});
