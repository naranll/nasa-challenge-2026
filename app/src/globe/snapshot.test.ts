import { describe, expect, it } from "vitest";
import { parseCelestrakTle, planSnapshot, type SnapshotConfig } from "./tle";
import { isSatellitesFile } from "./useHomeData";

// Real CelesTrak responses (GP, FORMAT=TLE), fetched 2026-11-15. Epochs are 2026-11-14.
const TERRA = [
  "TERRA                   ",
  "1 25994U 99068A   26318.39030904  .00000351  00000+0  80266-4 0  9993",
  "2 25994  97.9264   1.8351 0003553 107.9618 262.6373 14.61197334431549",
].join("\r\n");
const AQUA = [
  "AQUA                    ",
  "1 27424U 02022A   26318.48237645  .00000799  00000+0  16824-3 0  9992",
  "2 27424  98.4493 290.9370 0001173 107.6453  46.2261 14.62280053305231",
].join("\r\n");

const config: SnapshotConfig = {
  tle_source: { name: "CelesTrak", url: "https://celestrak.org/NORAD/elements/gp.php" },
  platforms: [
    { id: "terra", norad_id: 25994, sensor: "MODIS", launch_date: "1999-12-18", launch_source_url: "https://a", in_reference_chain: false, status_source_url: "https://b" },
    { id: "aqua", norad_id: 27424, sensor: "MODIS", launch_date: "2002-05-04", launch_source_url: "https://c", in_reference_chain: true, status_source_url: "https://d" },
  ],
};
const now = new Date("2026-11-15T00:00:00Z");
const ok = { terra: parseCelestrakTle(TERRA)!, aqua: parseCelestrakTle(AQUA)! };

describe("parseCelestrakTle", () => {
  it("reads the two element lines from a 3-line CRLF response", () => {
    expect(parseCelestrakTle(TERRA)).toEqual({
      line1: "1 25994U 99068A   26318.39030904  .00000351  00000+0  80266-4 0  9993",
      line2: "2 25994  97.9264   1.8351 0003553 107.9618 262.6373 14.61197334431549",
    });
  });

  it("returns null for a CelesTrak error message", () => {
    expect(parseCelestrakTle("No GP data found")).toBeNull();
  });
});

describe("planSnapshot", () => {
  it("writes a new file when every platform has a good TLE", () => {
    const plan = planSnapshot({ config, fetched: ok, existing: null, now });
    expect(plan.action).toBe("write");
    if (plan.action !== "write") return;
    expect(plan.file).toMatchObject({
      schema_version: "0.1",
      synthetic: false,
      generated_at: "2026-11-15T00:00:00.000Z",
      tle_source: config.tle_source,
    });
    expect(plan.file.platforms.map((p) => p.id)).toEqual(["terra", "aqua"]);
    expect(plan.file.platforms[1]).toMatchObject({
      norad_id: 27424,
      launch_date: "2002-05-04",
      tle: { line1: ok.aqua.line1, line2: ok.aqua.line2 },
    });
    // 26318.48237645 = day 318 of 2026 (14 Nov) + 0.48237645 d = 11:34:37.8 UTC
    expect(plan.file.platforms[1].tle.epoch).toMatch(/^2026-11-14T11:34:3[78]/);
    expect(plan.warnings).toEqual([]);
  });

  it("keeps a valid existing file when one platform failed, so the file is never half new", () => {
    const first = planSnapshot({ config, fetched: ok, existing: null, now });
    if (first.action !== "write") throw new Error("setup");
    const plan = planSnapshot({ config, fetched: { terra: ok.terra, aqua: null }, existing: first.file, now });
    expect(plan).toMatchObject({ action: "keep", warnings: expect.arrayContaining([expect.stringContaining("aqua")]) });
  });

  it("fails when a platform failed and there is no valid file to keep", () => {
    const plan = planSnapshot({ config, fetched: { terra: ok.terra, aqua: null }, existing: { junk: true }, now });
    expect(plan.action).toBe("fail");
  });

  it("offline: keeps a valid file, fails without one", () => {
    const first = planSnapshot({ config, fetched: ok, existing: null, now });
    if (first.action !== "write") throw new Error("setup");
    expect(planSnapshot({ config, fetched: null, existing: first.file, now }).action).toBe("keep");
    expect(planSnapshot({ config, fetched: null, existing: null, now }).action).toBe("fail");
  });

  it("warns when a TLE epoch is more than 7 days old", () => {
    const later = new Date("2026-11-25T00:00:00Z");
    const plan = planSnapshot({ config, fetched: ok, existing: null, now: later });
    expect(plan).toMatchObject({ action: "write", warnings: [expect.any(String), expect.any(String)] });
  });
});

describe("isSatellitesFile (browser shape check, spec §11.2)", () => {
  it("accepts the file the script writes, and rejects broken shapes", () => {
    const plan = planSnapshot({ config, fetched: ok, existing: null, now });
    if (plan.action !== "write") throw new Error("setup");
    expect(isSatellitesFile(plan.file)).toBe(true);
    expect(isSatellitesFile({ ...plan.file, platforms: {} } as never)).toBe(false);
    expect(isSatellitesFile({ ...plan.file, platforms: [{ id: "aqua" }] } as never)).toBe(false);
    expect(isSatellitesFile({ ...plan.file, platforms: [] })).toBe(false);
  });
});
