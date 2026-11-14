import { describe, expect, it } from "vitest";
import { groundTrack, makeSatrec, positionAt, tleState } from "./orbit";

// Aqua, CelesTrak 2026-11-15 (epoch 2026-11-14T11:34Z).
const AQUA = {
  line1: "1 27424U 02022A   26318.48237645  .00000799  00000+0  16824-3 0  9992",
  line2: "2 27424  98.4493 290.9370 0001173 107.6453  46.2261 14.62280053305231",
};
const KM_IN_DEG = 1 / 111; // 1 km of latitude in degrees, the spec A47 tolerance

describe("positionAt", () => {
  // Expected values: Python sgp4 2.27 + WGS84 geodetic conversion, computed independently (spec A47).
  it.each([
    ["2026-11-15T00:00:00Z", -2.977, -122.1903, 689.5],
    ["2026-11-15T06:30:00Z", -18.0032, 142.6316, 693.29],
  ])("at %s matches an independent SGP4 within 1 km", (iso, lat, lng, altKm) => {
    const p = positionAt(makeSatrec(AQUA)!, new Date(iso))!;
    expect(Math.abs(p.lat - lat)).toBeLessThan(KM_IN_DEG);
    expect(Math.abs(p.lng - lng)).toBeLessThan(KM_IN_DEG / Math.cos((lat * Math.PI) / 180));
    expect(Math.abs(p.altKm - altKm)).toBeLessThan(1);
  });

  it("gives no satrec for a TLE SGP4 cannot read", () => {
    expect(makeSatrec({ line1: AQUA.line1, line2: "2 27424 garbage" })).toBeNull();
  });
});

describe("groundTrack", () => {
  it("covers half an orbit before and after now, ending at the satellite's position", () => {
    const satrec = makeSatrec(AQUA)!;
    const at = new Date("2026-11-15T00:00:00Z");
    const track = groundTrack(satrec, at, 181);
    expect(track).toHaveLength(181);
    const mid = track[90];
    const now = positionAt(satrec, at)!;
    expect(mid.lat).toBeCloseTo(now.lat, 6);
    // A sun-synchronous polar orbit reaches beyond ±80° latitude within one orbit (inclination 98.4°).
    expect(Math.max(...track.map((p) => p.lat))).toBeGreaterThan(80);
    expect(Math.min(...track.map((p) => p.lat))).toBeLessThan(-80);
  });
});

describe("tleState (spec §5.5)", () => {
  const epoch = "2026-11-14T11:34:37Z";
  it("is fresh up to 7 days", () => {
    expect(tleState(epoch, new Date("2026-11-20T00:00:00Z"))).toEqual({ kind: "fresh" });
  });
  it("is aging between 7 and 30 days, with whole days of age", () => {
    expect(tleState(epoch, new Date("2026-11-26T12:00:00Z"))).toEqual({ kind: "aging", days: 12 });
  });
  it("is stale after 30 days", () => {
    expect(tleState(epoch, new Date("2026-12-20T00:00:00Z"))).toEqual({ kind: "stale" });
  });
});
