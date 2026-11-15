import { describe, expect, it } from "vitest";
import { rampColor } from "../calendar/scale";
import type { WorldCell, WorldCellsFile } from "../data/contracts";
import { buildCellHover, harmColor, harmMax, projectCells } from "./cellsData";
import { fitBbox } from "./worldData";

const cell = (over: Partial<WorldCell>): WorldCell => ({
  id: "85000000fffffff",
  lat: 0,
  lon: 0,
  boundary: [],
  viirs_harm: 0,
  aqua: 0,
  noaa20_units: { D: 0, N: 0 },
  r: { D: 0.5, N: 0.5 },
  ...over,
});

// Calendar-ийн ramp-ын хоёр үзүүр.
const BOTTOM = rampColor(0, 1);
const TOP = rampColor(1, 1);

describe("harmonized colour scale (log1p, one max for both sensors)", () => {
  it("paints 0 with the bottom of the ramp and the max with the top", () => {
    expect(harmColor(0, 99)).toBe(BOTTOM);
    expect(harmColor(99, 99)).toBe(TOP);
  });

  it("is a log1p scale: log1p(v) / log1p(max) along the calendar ramp", () => {
    // max = 99: log1p(99) = ln 100. v = 9: ln 10 = хагас нь, тэгэхээр ramp-ын яг дунд.
    expect(harmColor(9, 99)).toBe(rampColor(0.5, 1));
    // Шугаман шкалд 9/99 ≈ 0.09 байх байсан: log нь жижиг утгыг ялгана.
    expect(harmColor(9, 99)).not.toBe(rampColor(9, 99));
  });

  it("clamps above the max and paints everything with the bottom when the max is 0", () => {
    expect(harmColor(500, 99)).toBe(TOP);
    expect(harmColor(0, 0)).toBe(BOTTOM);
  });

  it("takes one max over both screens: the larger of viirs_harm and aqua in any cell", () => {
    const cells = [
      cell({ viirs_harm: 12.5, aqua: 3 }),
      cell({ viirs_harm: 0.4, aqua: 20 }),
      cell({ viirs_harm: null, aqua: 1 }),
    ];
    expect(harmMax(cells)).toBe(20);
    expect(harmMax([cell({ viirs_harm: 31.2, aqua: 0 })])).toBe(31.2);
    expect(harmMax([])).toBe(0);
  });

  it("gives the same colour to the same value on the VIIRS and the MODIS screen", () => {
    const cells = [cell({ viirs_harm: 6, aqua: 2 }), cell({ viirs_harm: 1, aqua: 6 })];
    const max = harmMax(cells);
    expect(harmColor(cells[0].viirs_harm!, max)).toBe(harmColor(cells[1].aqua, max));
  });
});

// 10 px/° харагдац, Далайн орны bbox (180°-ыг дамнана).
const OCEANIA: [number, number, number, number] = [170, -20, 190, 0];
const view = fitBbox(OCEANIA, 200, 200, 0);
const square = (lon: number, lat: number, h: number): [number, number][] => [
  [lon - h, lat - h], [lon + h, lat - h], [lon + h, lat + h], [lon - h, lat + h],
];
const cellsFile = (cells: WorldCell[]): WorldCellsFile => ({
  schema_version: "0.1",
  synthetic: true,
  continent: "oceania",
  resolution: 5,
  unit: "aqua_equivalent_hotspots",
  period: { start: "", end: "" },
  n: cells.length,
  cells,
});

describe("projectCells (one screen's hexagons)", () => {
  const file = cellsFile([
    cell({ lon: 175, lat: -10, boundary: square(175, -10, 0.5), viirs_harm: 2.5, aqua: 0 }),
    cell({ lon: 176, lat: -10, boundary: square(176, -10, 0.5), viirs_harm: 0, aqua: 4 }),
    cell({ lon: 177, lat: -10, boundary: square(177, -10, 0.5), viirs_harm: null, aqua: 1 }),
  ]);

  it("VIIRS shows viirs_harm and MODIS shows aqua; a cell that is 0 on this screen is not drawn", () => {
    const v = projectCells(file, "VIIRS", OCEANIA, view);
    expect([...v.ids]).toEqual([0, 2]);
    expect([...v.values]).toEqual([2.5, NaN]); // null = тооцох боломжгүй
    const m = projectCells(file, "MODIS", OCEANIA, view);
    expect([...m.ids]).toEqual([1, 2]);
    expect([...m.values]).toEqual([4, 1]);
  });

  it("projects the centre and the boundary", () => {
    const m = projectCells(file, "MODIS", OCEANIA, view);
    expect([m.xs[0], m.ys[0]]).toEqual([60, 100]);
    expect([...m.polys[0]]).toEqual([55, 105, 65, 105, 65, 95, 55, 95]);
  });

  it("draws a cell west of 180° next to its neighbours, whether or not its boundary is already shifted", () => {
    const f = cellsFile([
      // Төв -179.5, хил нь +360-аар шилжсэн (ETL-ийн cell_boundary).
      cell({ lon: -179.5, lat: -10, boundary: square(180.5, -10, 0.5), aqua: 1 }),
      // Хилийн зарим орой шилжээгүй.
      cell({ lon: 179.9, lat: -5, boundary: [[179.6, -5], [-179.8, -5], [179.9, -4.7]], aqua: 1 }),
    ]);
    const m = projectCells(f, "MODIS", OCEANIA, view);
    expect(m.xs[0]).toBeCloseTo(105, 5);
    expect([...m.polys[0]].filter((_, k) => k % 2 === 0).map((x) => Math.round(x))).toEqual([100, 110, 110, 100]);
    expect([...m.polys[1]].filter((_, k) => k % 2 === 0).map((x) => Math.round(x))).toEqual([96, 102, 99]);
  });
});

describe("buildCellHover (centre grid index + point in polygon)", () => {
  const file = cellsFile([
    cell({ lon: 175, lat: -10, boundary: square(175, -10, 0.5), aqua: 1 }),
    cell({ lon: 176, lat: -10, boundary: square(176, -10, 0.5), aqua: 2 }),
    // Жижиг нүд: 0.1° = 1 px, хил нь курсорт хэт жижиг.
    cell({ lon: 180, lat: -15, boundary: square(180, -15, 0.05), aqua: 3 }),
  ]);
  const p = projectCells(file, "MODIS", OCEANIA, view);
  const hover = buildCellHover(p, 200, 200, 6);

  it("finds the hexagon under the cursor, also near its corner", () => {
    expect(hover.at(50, 100)).toBe(0);
    expect(hover.at(54.5, 104.5)).toBe(0); // төвөөс 6.4 px (радиусаас гадна), гэхдээ хил дотор
    expect(hover.at(56, 96)).toBe(1);
  });

  it("finds a hexagon smaller than the cursor within the hover radius", () => {
    expect(hover.at(103, 152)).toBe(2); // хилээс гадна, төвөөс 3.6 px
  });

  it("returns -1 over empty sea, also inside a big cell's radius but outside its boundary", () => {
    expect(hover.at(150, 50)).toBe(-1);
    expect(hover.at(50, 106.5)).toBe(-1); // 0-р нүдний төвөөс 6.5 px, хилээс гадна
  });
});
