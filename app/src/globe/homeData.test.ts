import { describe, expect, it } from "vitest";
import { cardStats, sensorTimeline, yearlySeries, type CalendarFile, type PipelineStats } from "./homeData";

const stats: PipelineStats = {
  schema_version: "0.1",
  synthetic: false,
  rows_by_platform: { terra: 53194, aqua: 47857, snpp: 178434, noaa20: 50796, noaa21: 0 },
  first_detection: { terra: "2001-03-17", aqua: "2002-07-05", snpp: "2012-02-17", noaa20: "2018-04-04" },
  last_detection: { terra: "2026-11-11", aqua: "2026-11-14", snpp: "2026-11-02", noaa20: "2026-11-13" },
  n_hotspots_total: 330281,
  years_covered: [2001, 2026],
};

describe("cardStats", () => {
  it("gives the data range and raw count for a platform in our data", () => {
    expect(cardStats(stats, "snpp")).toEqual({ first: "2012-02-17", last: "2026-11-02", count: 178434, notInData: false });
  });

  it("says 'not in our data' when the file confirms zero rows (A33)", () => {
    expect(cardStats(stats, "noaa21")).toEqual({ first: null, last: null, count: null, notInData: true });
  });

  it("gives nothing (rows hidden) when the file was not loaded", () => {
    expect(cardStats(null, "aqua")).toEqual({ first: null, last: null, count: null, notInData: false });
  });

  it("treats a missing count as unknown, not zero", () => {
    const partial = { ...stats, rows_by_platform: { aqua: 47857 } };
    expect(cardStats(partial, "terra")).toMatchObject({ count: null, notInData: false });
  });
});

function month(ym: string, raw: CalendarFile["months"][number]["raw"], is_forecast = false) {
  return { ym, raw, is_forecast };
}

describe("yearlySeries", () => {
  const months = [
    // 2011: Aqua has all 12 months (one with 0 fires); S-NPP not launched yet (null).
    ...Array.from({ length: 12 }, (_, i) =>
      month(`2011-${String(i + 1).padStart(2, "0")}`, { aqua: i === 0 ? 0 : 10, snpp: null })),
    // 2012: S-NPP starts in February -> partial year for S-NPP only.
    ...Array.from({ length: 12 }, (_, i) =>
      month(`2012-${String(i + 1).padStart(2, "0")}`, { aqua: 5, snpp: i === 0 ? null : 20 })),
    // A forecast month never counts.
    month("2013-01", { aqua: null, snpp: null }, true),
  ];
  const calendar: CalendarFile = { schema_version: "0.1", synthetic: false, region_id: "mongolia", months };

  it("sums each platform's raw count per year and skips years with no data", () => {
    const series = yearlySeries(calendar);
    expect(series.aqua).toEqual([
      { year: 2011, count: 110, partial: false },
      { year: 2012, count: 60, partial: false },
    ]);
    expect(series.snpp).toEqual([{ year: 2012, count: 220, partial: true }]);
    expect(series.terra).toEqual([]);
  });
});

describe("sensorTimeline", () => {
  it("lists platforms with a data range, and marks one whose data ends well before the others as stopped", () => {
    const rows = sensorTimeline(stats);
    expect(rows.map((r) => r.id)).toEqual(["terra", "aqua", "snpp", "noaa20"]);
    expect(rows.filter((r) => r.stopped).map((r) => r.id)).toEqual(["snpp"]);
    expect(rows.find((r) => r.id === "snpp")).toMatchObject({ first: "2012-02-17", last: "2026-11-02" });
  });

  it("is empty when the file was not loaded", () => {
    expect(sensorTimeline(null)).toEqual([]);
  });
});
