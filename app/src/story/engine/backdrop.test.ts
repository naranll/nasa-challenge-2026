import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chapterNumber, presence } from "./layout";
import { makeStars, VIEW } from "./Backdrop";
import { rng, seedOf } from "./rng";

describe("backdrop", () => {
  it("makes the same sky every time", () => {
    expect(makeStars(40)).toEqual(makeStars(40));
    expect(rng(1)()).toBe(rng(1)());
  });

  it("keeps every star inside the view and respects the count", () => {
    const stars = makeStars(150);
    expect(stars).toHaveLength(150);
    for (const s of stars) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(VIEW.w);
      expect(s.y).toBeLessThanOrEqual(VIEW.h);
    }
  });

  it("is plain stars: no limb, no glow, no orbit lines, no ember", () => {
    const src = readFileSync(new URL("./Backdrop.tsx", import.meta.url), "utf8");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, ""); // the header comment says what is NOT here
    expect(code).not.toMatch(/limb|glow|orbit|ember|<filter|<radialGradient|ellipse/i);
  });

  it("seeds from text, stably", () => {
    expect(seedOf("modis|cell-1")).toBe(seedOf("modis|cell-1"));
    expect(seedOf("a")).not.toBe(seedOf("b"));
  });
});

describe("layout helpers", () => {
  it("numbers chapters from their id, as the brief does (ch0 ... ch10)", () => {
    expect(chapterNumber("ch7-handover")).toBe("07");
    expect(chapterNumber("ch0-numrug")).toBe("00");
    expect(chapterNumber("ch10-back")).toBe("10");
    expect(chapterNumber("weird")).toBe("--");
  });

  it("maps globe brightness to how much of the 3D globe shows", () => {
    expect(presence(0.2)).toBe(0);
    expect(presence(0.6)).toBe(1);
    expect(presence(0.425)).toBeGreaterThan(0.3);
    expect(presence(0.425)).toBeLessThan(0.7);
  });
});
