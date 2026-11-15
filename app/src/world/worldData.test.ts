import { describe, expect, it } from "vitest";
import type { WorldPointsFile } from "../data/contracts";
import { borderLines, buildHoverGrid, displayLon, fitBbox, pointAt, projectPoints, worldCopies } from "./worldData";

// Жижиг гараар бичсэн points файл: 3 мөр, NOAA-20 / Aqua / Terra.
const file: WorldPointsFile = {
  schema_version: "0.1",
  synthetic: true,
  continent: "oceania",
  n: 3,
  codes: {
    platform: ["terra", "aqua", "snpp", "noaa20", "noaa21"],
    conf: ["low", "nominal", "high"],
    match_class: ["both", "viirs_only", "modis_only", "not_comparable"],
  },
  dates: ["2026-11-05", "2026-11-06"],
  columns: {
    lon: [150.5, -179.5, 120],
    lat: [-30.25, -16.5, -20],
    platform: [3, 1, 0],
    frp: [12.35, 0.96, 4],
    conf: [2, 0, 1],
    date: [0, 1, 1],
    hhmm: [342, 1832, 5],
    daynight: ["N", "D", "D"],
    match_class: [0, 3, null],
  },
};

describe("pointAt (columns -> one row)", () => {
  it("decodes the codes, the UTC date and the acq_time into one hotspot", () => {
    expect(pointAt(file, 0)).toEqual({
      lon: 150.5, lat: -30.25, platform: "noaa20", frp: 12.35, conf: "high",
      date: "2026-11-05", time: "03:42", daynight: "N", matchClass: "both",
    });
    expect(pointAt(file, 1)).toMatchObject({ platform: "aqua", conf: "low", date: "2026-11-06", time: "18:32", matchClass: "not_comparable" });
  });

  it("pads a short acq_time and keeps a missing match class as null", () => {
    expect(pointAt(file, 2)).toMatchObject({ platform: "terra", time: "00:05", matchClass: null });
  });
});

// fixtures/world/index.json-ийн bbox-ууд.
const AFRICA: [number, number, number, number] = [-17.6, -34.8, 51.1, 37.4];
const OCEANIA: [number, number, number, number] = [113.3, -46.6, 180.2, -2.5];
const EUROPE: [number, number, number, number] = [-54.5, 2.1, 190.1, 81.3];

describe("180° crossing", () => {
  it("draws a point west of the antimeridian at lon + 360 when the bbox crosses 180°", () => {
    expect(displayLon(-179.5, OCEANIA)).toBe(180.5);
    expect(displayLon(150, OCEANIA)).toBe(150);
    expect(displayLon(-175, EUROPE)).toBe(185); // Чукот
  });

  it("keeps a point just outside the west edge where it is (nearest copy), and never shifts a bbox that does not cross", () => {
    expect(displayLon(-55, EUROPE)).toBe(-55); // ≤ 1° ойрын улсаар оноогдсон цэг
    expect(displayLon(-18, AFRICA)).toBe(-18);
    expect(displayLon(-179, [-171.8, 7.2, -12.2, 83.6])).toBe(-179);
  });

  it("draws the land once, or twice (shifted +360°) for a bbox that crosses 180°", () => {
    expect(worldCopies(AFRICA)).toEqual([0]);
    expect(worldCopies(OCEANIA)).toEqual([0, 360]);
    expect(worldCopies(EUROPE)).toEqual([0, 360]);
  });
});

describe("fitBbox (equirectangular view of one continent)", () => {
  it("uses one scale for lon and lat, fits the narrow side and centres the other", () => {
    // 20° x 10° bbox, 400 x 100 px: 10 px/° (өндөр нь хязгаарлана), 200 px өргөн, хоёр талд 100 px зай.
    const v = fitBbox([0, 0, 20, 10], 400, 100, 0);
    expect(v.project(0, 10)).toEqual([100, 0]); // баруун хойд булан
    expect(v.project(20, 0)).toEqual([300, 100]); // зүүн өмнөд булан
    expect(v.project(10, 5)).toEqual([200, 50]);
  });

  it("keeps a padding on the limiting side", () => {
    const v = fitBbox([0, 0, 20, 10], 400, 120, 10);
    expect(v.project(0, 10)).toEqual([100, 10]);
    expect(v.project(20, 0)).toEqual([300, 110]);
  });

  it("projects a shifted lon (> 180) inside a bbox that crosses 180°", () => {
    const v = fitBbox([170, -10, 190, 0], 200, 100, 0);
    expect(v.project(displayLon(-175, [170, -10, 190, 0]), -5)).toEqual([150, 50]);
  });
});

describe("buildHoverGrid (spatial grid index for hover)", () => {
  // 100 x 100 px canvas, hover-ийн радиус 6 px.
  const xs = Float32Array.from([10, 14, 50, 60, -20, 99]);
  const ys = Float32Array.from([10, 10, 50, 50, 5, 99]);
  const grid = buildHoverGrid(xs, ys, 100, 100, 6);

  it("returns the nearest point within the radius", () => {
    expect(grid.nearest(11, 10)).toBe(0);
    expect(grid.nearest(13, 11)).toBe(1);
  });

  it("finds a point in the neighbouring cell (across a cell edge)", () => {
    // 6 px нүд: (50, 50) нь (8, 8) нүдэнд, курсор (47, 47) нь (7, 7) нүдэнд.
    expect(grid.nearest(47, 47)).toBe(2);
  });

  it("returns -1 over an empty area and for a point just outside the radius", () => {
    expect(grid.nearest(30, 80)).toBe(-1);
    expect(grid.nearest(55, 57)).toBe(-1); // (50, 50)-аас 7.07 px, (60, 50)-аас 8.6 px
  });

  it("skips points outside the canvas and keeps the canvas edge reachable", () => {
    expect(grid.nearest(0, 5)).toBe(-1); // (-20, 5) нь canvas-аас гадна
    expect(grid.nearest(99.5, 99.5)).toBe(5);
  });
});

describe("projectPoints (one sensor at a time)", () => {
  const bbox = [113.3, -46.6, 180.2, -2.5] as [number, number, number, number];
  const v = fitBbox(bbox, 669, 441, 0); // 10 px/°

  it("keeps only the selected sensor's hotspots, in file order", () => {
    expect([...projectPoints(file, "VIIRS", bbox, v).ids]).toEqual([0]); // NOAA-20
    expect([...projectPoints(file, "MODIS", bbox, v).ids]).toEqual([1, 2]); // Aqua, Terra
  });

  it("projects each kept hotspot, with the 180° shift", () => {
    const p = projectPoints(file, "MODIS", bbox, v);
    // Aqua, lon -179.5 -> 180.5, өөрөөр хэлбэл west-ээс 67.2° зүүн тийш.
    expect(p.xs[0]).toBeCloseTo(672, 0);
    expect(p.ys[0]).toBeCloseTo(140, 0); // -2.5-аас 14° өмнө
    expect(p.xs[1]).toBeCloseTo(67, 0); // Terra, lon 120
  });
});

describe("borderLines (no fake border along the 180° cut)", () => {
  it("drops the edge Natural Earth adds along ±180° and keeps the real border as open lines", () => {
    // Чукотын хэлбэртэй ring: 180° дээр таслагдсан, меридиан дагуух (180, 64) -> (180, 68) ирмэгтэй.
    const ring: [number, number][] = [[170, 64], [180, 64], [180, 68], [172, 69], [170, 64]];
    expect(borderLines(ring)).toEqual([
      [[170, 64], [180, 64]],
      [[180, 68], [172, 69], [170, 64]],
    ]);
  });

  it("keeps a ring that does not touch ±180° whole", () => {
    const ring: [number, number][] = [[10, 0], [20, 0], [20, 10], [10, 0]];
    expect(borderLines(ring)).toEqual([ring]);
  });
});
