import { describe, expect, it } from "vitest";
import { buildSeries, clipSeries, harmonizedYearly, type StoryCalendar } from "./series";

type Raw = Record<"terra" | "aqua" | "snpp" | "noaa20" | "noaa21", number | null>;
const none: Raw = { terra: null, aqua: null, snpp: null, noaa20: null, noaa21: null };
const month = (ym: string, raw: Partial<Raw>, harmonized: number | null, is_forecast = false) => ({
  ym,
  raw: { ...none, ...raw },
  harmonized,
  is_forecast,
});

const cal: StoryCalendar = {
  schema_version: "0.1",
  synthetic: true,
  region_id: "mongolia",
  months: [
    month("2003-01", { terra: 5, aqua: 7 }, 7),
    month("2003-02", { terra: 1, aqua: 3 }, 3),
    month("2004-01", { terra: 2 }, null), // harmonized unknown: skipped, not 0
    month("2004-02", {}, 9, true), // forecast: ignored
  ],
};

describe("series", () => {
  it("sums harmonized by year and skips null and forecast months", () => {
    expect(harmonizedYearly(cal)).toEqual([{ year: 2003, count: 10, partial: true }]);
  });

  it("builds raw per-platform series with the home page's own function", () => {
    const s = buildSeries(cal);
    expect(s.raw.terra).toEqual([
      { year: 2003, count: 6, partial: true },
      { year: 2004, count: 2, partial: true },
    ]);
    expect(s.raw.snpp).toEqual([]);
    expect(s.years).toEqual([2003, 2004]);
  });

  it("has no year range when the file has no data", () => {
    expect(buildSeries({ ...cal, months: [] }).years).toBeNull();
  });

  it("clips a line at a fractional year so it can grow smoothly", () => {
    const pts = [
      { year: 2000, count: 0, partial: false },
      { year: 2002, count: 10, partial: false },
    ];
    expect(clipSeries(pts, 1999)).toEqual([]);
    expect(clipSeries(pts, 2001)).toEqual([pts[0], { year: 2001, count: 5, partial: true }]);
    expect(clipSeries(pts, 2005)).toEqual(pts);
  });
});
