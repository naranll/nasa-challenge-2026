import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildHotspots, cellHalf, DETECTIONS_PER_MARK, insideOutline, pickYear, type HexHarm, type HexRaw } from "./hotspots";

const read = <T,>(file: string) => JSON.parse(readFileSync(new URL(`../../../../fixtures/hex_year/${file}`, import.meta.url), "utf8")) as T;
const raw = read<HexRaw>("raw.json");
const harm = read<HexHarm>("harm.json");

describe("illustrative hotspots", () => {
  const h = buildHotspots(raw, harm);

  it("are the same on every load", () => {
    expect(buildHotspots(raw, harm)).toEqual(h);
  });

  it("all lie inside Mongolia's outline (the repo's own border, nothing drawn by hand)", () => {
    for (const m of [...h.modis, ...h.viirs, ...h.uniform]) expect(insideOutline(m.lon, m.lat), m.id).toBe(true);
  });

  it("show a few MODIS dots, many more VIIRS triangles, and one uniform map", () => {
    expect(h.modis.length).toBeGreaterThan(10);
    expect(h.viirs.length).toBeGreaterThan(h.modis.length * 2);
    expect(h.uniform.length).toBeGreaterThan(10);
    expect(h.synthetic).toBe(true);
  });

  it("scale with the fixture's counts, not with made-up numbers", () => {
    const yi = raw.years.indexOf(h.year);
    const total = raw.cells.reduce((a, c) => a + (c.counts.aqua?.[yi] ?? 0), 0);
    expect(h.modis.length).toBeLessThanOrEqual(Math.ceil(total / DETECTIONS_PER_MARK) + raw.cells.length);
  });

  it("have unique ids and a stagger value in 0..1", () => {
    const all = [...h.modis, ...h.viirs, ...h.uniform];
    expect(new Set(all.map((m) => m.id)).size).toBe(all.length);
    for (const m of all) {
      expect(m.order).toBeGreaterThanOrEqual(0);
      expect(m.order).toBeLessThan(1);
    }
  });

  it("make nothing out of a file with no cells (the outline still shows)", () => {
    const empty = buildHotspots({ years: [2020], cells: [] }, { years: [2020], cells: [] });
    expect(empty.modis).toEqual([]);
    expect(empty.viirs).toEqual([]);
  });
});

describe("helpers", () => {
  it("reads the grid spacing from the cells, within sane limits", () => {
    expect(cellHalf(raw.cells)).toBe(1);
    expect(cellHalf([{ lat: 1, lon: 1 }])).toBe(0.1);
    expect(cellHalf([{ lat: 1, lon: 1 }, { lat: 1.001, lon: 1 }])).toBe(0.05);
  });

  it("picks the newest year with both a MODIS and a VIIRS count", () => {
    expect(pickYear(raw)).toBeGreaterThanOrEqual(2020);
    const gap: HexRaw = { years: [2020, 2021], cells: [{ id: "a", lat: 1, lon: 1, counts: { aqua: [5, 6], noaa20: [7, null] } }] };
    expect(pickYear(gap)).toBe(2020);
  });

  it("tells inside from outside", () => {
    expect(insideOutline(105, 47)).toBe(true);
    expect(insideOutline(0, 0)).toBe(false);
  });
});
