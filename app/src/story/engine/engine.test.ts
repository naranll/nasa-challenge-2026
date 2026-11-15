import { describe, expect, it } from "vitest";
import type { StageTarget } from "../types";
import { nearestYear, niceStep, spread } from "./chartMath";
import { chapterRanges, clamp01, locate, scrolledVh } from "./layout";
import { blend, ease, FLY_IN, lerpLng, resolveFocus, sampleKeyframes, stageAt } from "./stageState";

const target = (lat: number, harmonize = 0): StageTarget => ({
  globe: { lat, lng: 0, altitude: 2, brightness: 0.5 },
  chart: { visible: 1, reveal: 1, harmonize, steps: 0 },
});
const kf = (a: number, b: number, c: number): [StageTarget, StageTarget, StageTarget] => [target(a), target(b), target(c)];

describe("layout", () => {
  it("chapters follow each other; the last one loses the 100 vh that scrolls the stage away", () => {
    expect(chapterRanges([200, 200, 300])).toEqual([
      { start: 0, end: 200 },
      { start: 200, end: 400 },
      { start: 400, end: 600 },
    ]);
  });

  it("locates the chapter and progress for a scroll offset", () => {
    const r = chapterRanges([200, 200, 300]);
    expect(locate(r, 0)).toEqual({ index: 0, progress: 0 });
    expect(locate(r, 100)).toEqual({ index: 0, progress: 0.5 });
    expect(locate(r, 200)).toEqual({ index: 1, progress: 0 });
    expect(locate(r, 500)).toEqual({ index: 2, progress: 0.5 });
  });

  it("clamps before the first chapter and after the pinned range", () => {
    const r = chapterRanges([200, 300]);
    expect(locate(r, -50)).toEqual({ index: 0, progress: 0 });
    expect(locate(r, 9999)).toEqual({ index: 1, progress: 1 });
    expect(clamp01(2)).toBe(1);
  });

  it("converts a container position to viewport heights scrolled", () => {
    expect(scrolledVh(-800, 800)).toBe(100);
    expect(scrolledVh(0, 800)).toBeCloseTo(0);
    expect(scrolledVh(-10, 0)).toBe(0);
  });
});

describe("stageState", () => {
  it("interpolates piecewise through the three keyframes", () => {
    const k = kf(0, 10, 40);
    expect(sampleKeyframes(k, 0).globe.lat).toBe(0);
    expect(sampleKeyframes(k, 0.25).globe.lat).toBe(5);
    expect(sampleKeyframes(k, 0.5).globe.lat).toBe(10);
    expect(sampleKeyframes(k, 1).globe.lat).toBe(40);
  });

  it("is continuous across a chapter boundary: starts where the previous chapter ended", () => {
    const all = [kf(0, 10, 40), kf(70, 80, 90)];
    expect(stageAt(all, 1, 0, false).globe.lat).toBe(40);
    expect(stageAt(all, 1, FLY_IN, false).globe.lat).toBeCloseTo(sampleKeyframes(all[1], FLY_IN).globe.lat);
    expect(stageAt(all, 1, 1, false).globe.lat).toBe(90);
  });

  it("with reduced motion the target steps between keyframes, with no flight", () => {
    const all = [kf(0, 10, 40), kf(70, 80, 90)];
    expect(stageAt(all, 1, 0, true).globe.lat).toBe(70);
    expect(stageAt(all, 1, 0.5, true).globe.lat).toBe(80);
    expect(stageAt(all, 1, 0.9, true).globe.lat).toBe(90);
  });

  it("blends the chart's harmonize value", () => {
    expect(blend(target(0, 0), target(0, 1), 0.25).chart.harmonize).toBe(0.25);
  });

  it("turns longitude the short way round", () => {
    expect(lerpLng(170, -170, 0.5)).toBe(180);
    expect(lerpLng(-170, 170, 0.5)).toBe(-180);
  });

  it("eases between 0 and 1 and resolves camera focus", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(resolveFocus({ lat: 1, lng: 2 })).toEqual({ lat: 1, lng: 2 });
    expect(resolveFocus("mongolia").lat).toBeGreaterThan(40);
  });
});

describe("chartMath", () => {
  it("picks a round tick step", () => {
    expect(niceStep(950, 4)).toBe(500);
    expect(niceStep(100, 4)).toBe(50);
  });

  it("spreads labels apart, in order, inside the bounds", () => {
    const out = spread([10, 11, 12], 13, 0, 100);
    expect(out[1] - out[0]).toBeGreaterThanOrEqual(13);
    expect(out[2] - out[1]).toBeGreaterThanOrEqual(13);
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0);
  });

  it("finds the nearest year to a pointer position", () => {
    expect(nearestYear(0, 40, 200, [2000, 2020])).toBe(2000);
    expect(nearestYear(140, 40, 200, [2000, 2020])).toBe(2010);
    expect(nearestYear(999, 40, 200, [2000, 2020])).toBe(2020);
    expect(nearestYear(50, 40, 200, [2005, 2005])).toBe(2005);
  });
});
