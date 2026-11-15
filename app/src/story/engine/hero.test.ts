import { describe, expect, it } from "vitest";
import {
  ASPECT,
  bandCorners,
  bandVisible,
  fitMap,
  flight,
  heroLayout,
  heroState,
  ignite,
  ignition,
  LOOP_REST,
  outlinePath,
  SWEEP_DONE,
  sweepU,
} from "./hero";

describe("swath ignition", () => {
  it("lights a hotspot only after the band's leading edge passes it", () => {
    expect(ignite(0.2, 0.5)).toBe(0);
    expect(ignite(0.5, 0.5)).toBe(0);
    expect(ignite(0.6, 0.5)).toBeGreaterThan(0);
    expect(ignite(SWEEP_DONE, 1)).toBe(1);
  });

  it("gives a mark one ring while it ignites, and none before or after", () => {
    expect(ignition(0)).toEqual({ opacity: 0, ring: 0 });
    expect(ignition(0.5).ring).toBe(0.5);
    expect(ignition(1)).toEqual({ opacity: 1, ring: 0 });
  });

  it("orders marks along the sweep direction, inside 0..1 on the map", () => {
    const rect = { x: 100, y: 100, w: 400, h: 200 };
    expect(sweepU(rect.x, rect.y, rect)).toBeGreaterThanOrEqual(0);
    expect(sweepU(rect.x + rect.w, rect.y + rect.h, rect)).toBeLessThanOrEqual(1);
    expect(sweepU(450, 200, rect)).toBeGreaterThan(sweepU(150, 200, rect));
  });

  it("draws a tilted parallelogram: parallel slanted sides, flat top and bottom", () => {
    const [a, b, c, d] = bandCorners(0.5, { x: 100, y: 100, w: 400, h: 200 });
    expect(a[1]).toBe(b[1]); // top edge flat
    expect(c[1]).toBe(d[1]); // bottom edge flat
    expect(a[0]).not.toBe(d[0]); // sides slant
    expect(b[0] - a[0]).toBeCloseTo(c[0] - d[0], 6); // parallel: same width top and bottom
    expect(bandVisible(0.5)).toBe(true);
    expect(bandVisible(-0.05)).toBe(false);
    expect(bandVisible(SWEEP_DONE)).toBe(false);
  });
});

describe("scenes", () => {
  it("crews: MODIS sweeps first, then VIIRS; marks of the first stay lit", () => {
    const early = heroState("crews", 0.3, 0, false);
    const late = heroState("crews", 0.8, 0, false);
    expect(early.sweep.viirs).toBeLessThan(0.1);
    expect(early.sweep.modis).toBeGreaterThan(0.2);
    expect(late.sweep.modis).toBe(SWEEP_DONE);
    expect(late.sweep.viirs).toBeGreaterThan(early.sweep.viirs);
    expect(heroState("crews", 0.2, 0, false).outline).toBe(1);
  });

  it("crews with reduced motion: everything is already lit, no band", () => {
    const h = heroState("crews", 0.1, 0, true);
    expect(bandVisible(h.sweep.modis) || bandVisible(h.sweep.viirs)).toBe(false);
    expect(h.sweep.modis).toBe(SWEEP_DONE);
  });

  it("handover: map held back behind the chart, a cursor that scrubs through the years", () => {
    const a = heroState("handover", 0.1, 0, false);
    const b = heroState("handover", 0.9, 0, false);
    expect(a.marks.modis).toBeLessThan(1);
    expect(a.cursor).toBeLessThan(b.cursor!);
    expect(heroState("handover", 0.1, 0, true).cursor).toBe(b.cursor);
  });

  it("harmonize: raw marks fall in, uniform marks come out, the line draws, then it fades for the next loop", () => {
    const at = (t: number) => heroState("harmonize", 0, t, false);
    expect(at(0.05).fall).toBe(0);
    expect(at(0.45).fall).toBe(1);
    expect(at(0.45).rise).toBe(0);
    expect(at(0.9).rise).toBe(1);
    expect(at(0.3).chartReveal!).toBeLessThan(at(0.8).chartReveal!);
    expect(at(0.999).chartReveal!).toBeLessThan(0.2);
    expect(at(0.5).pipeline!.progress).toBeGreaterThan(at(0.3).pipeline!.progress);
    expect(at(0.5).looping).toBe(true);
  });

  it("harmonize with reduced motion rests on the finished picture", () => {
    const h = heroState("harmonize", 0, 0.3, true);
    expect(h).toMatchObject({ fall: 1, rise: 1, chartReveal: 1, looping: false });
    expect(h.pipeline!.progress).toBe(5);
    expect(LOOP_REST).toBeLessThan(0.95);
  });

  it("a chapter with no scene shows nothing", () => {
    const h = heroState(undefined, 0.5, 0, false);
    expect(h.outline).toBe(0);
    expect(h.marks).toEqual({ modis: 0, viirs: 0, uniform: 0 });
  });
});

describe("flight", () => {
  it("staggers marks: an early mark has landed while a late one is still on its way", () => {
    expect(flight(0.5, 0)).toBeGreaterThan(flight(0.5, 0.9));
    expect(flight(0, 0.5)).toBe(0);
    expect(flight(1, 1)).toBe(1);
  });
});

describe("layout", () => {
  it("keeps Mongolia's shape and fits the zone", () => {
    const fit = fitMap({ x: 10, y: 20, w: 300, h: 300 });
    expect(fit.rect.w / fit.rect.h).toBeCloseTo(ASPECT, 6);
    expect(fit.rect.w).toBeLessThanOrEqual(300);
    const tall = fitMap({ x: 0, y: 0, w: 300, h: 50 });
    expect(tall.rect.h).toBeLessThanOrEqual(50);
  });

  it("puts the map inside the stage on a phone and on a desktop, for every scene", () => {
    for (const [w, h] of [
      [390, 844],
      [1440, 900],
    ] as const) {
      for (const kind of ["crews", "handover", "harmonize"] as const) {
        const { map, pipe } = heroLayout(kind, w, h);
        expect(map.rect.x, `${kind} ${w}`).toBeGreaterThanOrEqual(0);
        expect(map.rect.x + map.rect.w).toBeLessThanOrEqual(w);
        expect(map.rect.y + map.rect.h).toBeLessThanOrEqual(h);
        expect(Boolean(pipe)).toBe(kind === "harmonize");
        if (pipe) {
          expect(pipe.xs).toHaveLength(5);
          expect(pipe.xs[4] + pipe.nodeW).toBeLessThanOrEqual(w);
          expect(pipe.y - pipe.nodeH / 2).toBeGreaterThan(map.rect.y + map.rect.h); // the pipeline sits below the map
        }
      }
    }
  });

  it("draws the repo's own outline as closed paths, with no fill needed", () => {
    const d = outlinePath(fitMap({ x: 0, y: 0, w: 400, h: 200 }));
    expect(d.startsWith("M")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
  });
});
