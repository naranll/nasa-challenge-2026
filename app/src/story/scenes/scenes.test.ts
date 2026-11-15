import { describe, expect, it } from "vitest";
import { CHAPTERS, REGISTERED, UNREGISTERED } from "../chapters/index";
import { EN } from "./kit";
import { smoothPath } from "./Ch4Harmonize";
import { axisTo, AXIS_FROM, barSpan } from "./Ch3Handover";
import { slotOf, win } from "./kit";

const words = (s: string) => s.trim().split(/\s+/).length;

describe("the five-chapter story", () => {
  it("registers exactly five chapters, in order, so the rail has five dots", () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual([...REGISTERED]);
    expect(CHAPTERS).toHaveLength(5);
    expect(CHAPTERS.every((c) => c.own)).toBe(true);
  });

  it("keeps every other chapter in chapters.json but unregistered", () => {
    expect(UNREGISTERED).toContain("ch0-numrug");
    expect(UNREGISTERED).toContain("ch7-handover");
    expect(UNREGISTERED).toContain("ch10-back");
    expect(UNREGISTERED.some((id) => (REGISTERED as readonly string[]).includes(id))).toBe(false);
  });

  it("limits text: headlines <= 8 words, lines <= 14 words", () => {
    for (const [k, v] of Object.entries(EN)) {
      if (/Head/.test(k)) expect(words(v), k).toBeLessThanOrEqual(8);
      if (/Line/.test(k)) expect(words(v), k).toBeLessThanOrEqual(14);
    }
    for (const c of CHAPTERS) {
      const t = c.copy("en");
      expect(words(t.headline), c.id).toBeLessThanOrEqual(8);
      expect(words(t.body), c.id).toBeLessThanOrEqual(14);
    }
  });

  it("every chapter has notes for the Sources & notes panel", () => {
    for (const c of CHAPTERS) expect(c.Notes, c.id).toBeDefined();
  });
});

describe("scene maths", () => {
  it("turns a jagged line into a smooth one: tension 0 is straight, 1 is curved", () => {
    const pts: [number, number][] = [[0, 0], [10, 10], [20, 0], [30, 10]];
    expect(smoothPath(pts, 0)).not.toContain("NaN");
    expect(smoothPath(pts, 0)).toMatch(/^M0.0,0.0C0.0,0.0 10.0,10.0 10.0,10.0/);
    expect(smoothPath(pts, 1)).not.toBe(smoothPath(pts, 0));
  });

  it("places a bar by launch year and says nothing when the year is unknown", () => {
    const now = new Date("2026-11-15T00:00:00Z");
    const b = barSpan(2002, now, 1)!;
    expect(b.left).toBeCloseTo((2002 - AXIS_FROM) / (axisTo(now) - AXIS_FROM));
    expect(b.left + b.width).toBeCloseTo(1);
    expect(barSpan(2002, now, 0)!.width).toBe(0);
    expect(barSpan(null, now, 1)).toBeNull();
  });

  it("splits a progress range into equal slots and eases a window", () => {
    expect(slotOf(0.2, 5, 0, 0.5)).toEqual({ i: 2, t: 0 });
    expect(slotOf(5, 5)).toEqual({ i: 4, t: 1 });
    expect(win(0.5, 0.2, 0.8)).toBe(1);
    expect(win(0.1, 0.2, 0.8)).toBe(0);
  });
});
