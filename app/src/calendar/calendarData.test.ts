import { describe, expect, it } from "vitest";
import type { CalendarFile, CalendarMonth } from "../data/contracts";
import { calendarGrid, hasValues, sharedMax } from "./calendarData";

const m = (ym: string, over: Partial<CalendarMonth>): CalendarMonth => ({
  ym, harmonized: null, chain_platform: "aqua", raw: {}, is_forecast: false, flags: [], ...over,
});
const cal: CalendarFile = {
  schema_version: "0.1", synthetic: false, region_id: "mongolia", unit: "aqua_equivalent_hotspots", reference_years: [2003, 2025],
  months: [
    m("2011-12", { harmonized: 40, raw: { aqua: 40, terra: 35 } }),
    m("2012-02", { harmonized: 45, chain_platform: "snpp", raw: { aqua: 44, snpp: 150 }, flags: ["chain_switch"] }),
    m("2012-03", { harmonized: 0, chain_platform: "snpp", raw: { aqua: 0, snpp: 0 } }),
    m("2012-04", { chain_platform: "noaa20", is_forecast: true, flags: ["noaa20_derived"] }),
  ],
};

describe("calendarGrid", () => {
  it("has one row per year with 12 months; months not in the file are unknown (null), a real 0 stays 0", () => {
    const g = calendarGrid(cal, "harmonized");
    expect(g.map((r) => r.year)).toEqual([2011, 2012]);
    expect(g[1].cells.map((c) => c.value)).toEqual([null, 45, 0, null, null, null, null, null, null, null, null, null]);
    expect(g[1].cells[0]).toMatchObject({ ym: "2012-01", inFile: false });
  });

  it("raw view shows the chain platform's own count, so the S-NPP jump is visible", () => {
    const g = calendarGrid(cal, "raw");
    expect(g[0].cells[11]).toMatchObject({ ym: "2011-12", value: 40, platform: "aqua" });
    expect(g[1].cells[1]).toMatchObject({ ym: "2012-02", value: 150, platform: "snpp" });
  });

  it("marks forecast months and NOAA-20-derived months", () => {
    const april = calendarGrid(cal, "harmonized")[1].cells[3];
    expect(april).toMatchObject({ inFile: true, forecast: true, noaa20Derived: true, value: null });
  });
});

describe("sharedMax", () => {
  it("is the largest known value across all grids, so two calendars side by side use one colour scale", () => {
    expect(sharedMax([calendarGrid(cal, "raw"), calendarGrid(cal, "harmonized")])).toBe(150);
    expect(sharedMax([])).toBe(0);
  });
});

describe("hasValues", () => {
  it("is false when every harmonized month is null (real data before the ratios exist), so the UI shows a sentence", () => {
    const noHarm: CalendarFile = { ...cal, months: cal.months.map((x) => ({ ...x, harmonized: null })) };
    expect(hasValues(calendarGrid(noHarm, "harmonized"))).toBe(false);
    expect(hasValues(calendarGrid(noHarm, "raw"))).toBe(true);
  });

  it("is true when one month is a real 0", () => {
    const zero: CalendarFile = { ...cal, months: [m("2012-03", { harmonized: 0 })] };
    expect(hasValues(calendarGrid(zero, "harmonized"))).toBe(true);
  });
});
