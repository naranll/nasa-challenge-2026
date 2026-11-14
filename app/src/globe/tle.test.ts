import { describe, expect, it } from "vitest";
import { tleChecksumOk, validateTle } from "./tle";

// The ISS example TLE from the Wikipedia "Two-line element set" article: a known-good pair.
const ISS_1 = "1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927";
const ISS_2 = "2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537";

describe("tleChecksumOk", () => {
  it("accepts lines whose last digit matches the mod-10 checksum", () => {
    expect(tleChecksumOk(ISS_1)).toBe(true);
    expect(tleChecksumOk(ISS_2)).toBe(true);
  });

  it("rejects a line with one digit changed", () => {
    expect(tleChecksumOk(ISS_1.replace("51782528", "51782529"))).toBe(false);
  });
});

describe("validateTle", () => {
  const nearEpoch = new Date("2008-09-21T00:00:00Z");

  it("finds no problems in a good pair for the right satellite", () => {
    expect(validateTle(ISS_1, ISS_2, 25544, nearEpoch)).toEqual([]);
  });

  it("reports a catalog number that is not the one asked for", () => {
    expect(validateTle(ISS_1, ISS_2, 27424, nearEpoch)).toEqual([expect.stringContaining("catalog")]);
  });

  it("reports a bad checksum, naming the line", () => {
    const bad = ISS_2.replace("51.6416", "51.6417");
    expect(validateTle(ISS_1, bad, 25544, nearEpoch)).toEqual([expect.stringContaining("line 2")]);
  });

  it("reports a pair that cannot be read as two TLE lines", () => {
    expect(validateTle("hello", ISS_2, 25544, nearEpoch).length).toBeGreaterThan(0);
  });
});
