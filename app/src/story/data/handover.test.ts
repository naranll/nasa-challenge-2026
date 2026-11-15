import { describe, expect, it } from "vitest";
import { AXIS, chainRawYearly, cursorAt, decimalYear, fadeAt, isVisibleStep, nodeFraction, overlapRatio, seamYear, wrapLabel, LIFECYCLE } from "./handover";
import { buildSeries, type StoryCalendar } from "./series";

type Raw = Record<"terra" | "aqua" | "snpp" | "noaa20" | "noaa21", number | null>;
const none: Raw = { terra: null, aqua: null, snpp: null, noaa20: null, noaa21: null };
const month = (ym: string, chain: "aqua" | "snpp", raw: Partial<Raw>, harmonized: number | null) => ({ ym, chain_platform: chain, raw: { ...none, ...raw }, harmonized, is_forecast: false });

/** Two full years where Aqua = 10 per month and S-NPP = 30 per month (a clear 3x step), plus a chain switch. */
const cal = (): StoryCalendar => ({
  schema_version: "0.1",
  synthetic: true,
  region_id: "mongolia",
  months: [2012, 2013].flatMap((y) =>
    Array.from({ length: 12 }, (_, i) => month(`${y}-${String(i + 1).padStart(2, "0")}`, y === 2012 ? "aqua" : "snpp", { aqua: 10, snpp: 30 }, 10)),
  ),
});

describe("dates", () => {
  it("turns ISO dates into decimal years", () => {
    expect(decimalYear("2012")).toBe(2012);
    expect(decimalYear("2002-07")).toBeCloseTo(2002.5, 1);
    expect(decimalYear("2026-11-02")).toBeCloseTo(2026.84, 2);
  });

  it("every step and platform date in lifecycle.json is inside the axis", () => {
    for (const s of LIFECYCLE.steps) {
      expect(decimalYear(s.at)).toBeGreaterThanOrEqual(AXIS.from);
      expect(decimalYear(s.at)).toBeLessThan(AXIS.to);
    }
  });

  it("steps are in date order and numbered 1..n", () => {
    const at = LIFECYCLE.steps.map((s) => decimalYear(s.at));
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(LIFECYCLE.steps.map((s) => s.n)).toEqual(LIFECYCLE.steps.map((_, i) => i + 1));
  });
});

describe("timeline motion", () => {
  it("fades a platform after its end, never to nothing", () => {
    expect(fadeAt(2020, 2027)).toBe(1);
    expect(fadeAt(2027.25, 2027)).toBeLessThan(1);
    expect(fadeAt(2030, 2027)).toBeCloseTo(0.35);
    expect(fadeAt(2030, null)).toBe(1);
  });

  it("sweeps the axis with progress, and shows the final state for reduced motion or low bandwidth", () => {
    expect(cursorAt(0, false)).toBe(AXIS.from);
    expect(cursorAt(1, false)).toBe(AXIS.to);
    expect(cursorAt(0.2, true)).toBe(AXIS.to);
  });
});

describe("overlap ratio and seam", () => {
  it("computes VIIRS over MODIS from full years, only where both exist", () => {
    const o = overlapRatio(buildSeries(cal()));
    expect(o.ratio).toBeCloseTo(3, 6);
    expect(o.years).toBe(2);
    expect(isVisibleStep(o.ratio!)).toBe(true);
  });

  it("reports no ratio when the sensors never overlap, and treats a ratio near 1 as no visible step", () => {
    const c = cal();
    c.months = c.months.map((m) => ({ ...m, raw: { ...m.raw, snpp: null } }));
    expect(overlapRatio(buildSeries(c)).ratio).toBeNull();
    expect(isVisibleStep(1.05)).toBe(false);
  });

  it("builds the raw chain as recorded and finds where the sensor family changes", () => {
    const chain = chainRawYearly(cal());
    expect(chain.map((p) => [p.year, p.count, p.platform])).toEqual([
      [2012, 120, "aqua"],
      [2013, 360, "snpp"],
    ]);
    expect(seamYear(chain)).toBe(2013);
  });
});

describe("workflow figure", () => {
  it("wraps labels on word boundaries", () => {
    expect(wrapLabel("Aqua-referenced ratios", 15)).toEqual(["Aqua-referenced", "ratios"]);
    expect(wrapLabel("Gap mask", 20)).toEqual(["Gap mask"]);
  });

  it("draws nodes one after another", () => {
    expect(nodeFraction(0, 8, 0)).toBe(0);
    expect(nodeFraction(0.5, 8, 3)).toBe(1);
    expect(nodeFraction(0.5, 8, 4)).toBe(0);
    expect(nodeFraction(1, 8, 7)).toBe(1);
    expect(nodeFraction(0.0625, 8, 0)).toBeCloseTo(0.5);
  });
});
