/**
 * World map Harmonize горим (#36)-ын цэвэр логик: H3 res 5 hexagon-ы өнгөний шкал, проекц, hover.
 * React-гүй, тестлэгдэхүйц.
 */
import { rampColor } from "../calendar/scale";
import type { WorldCell, WorldCellsFile } from "../data/contracts";
import type { Sensor } from "../globe/platforms";
import { buildHoverGrid, displayLon, type Bbox, type Viewport } from "./worldData";

/**
 * Хоёр дэлгэцийн нэг max: тивийн бүх нүдний `viirs_harm` ба `aqua`-ийн аль их нь.
 * Ингэснээр VIIRS ↔ MODIS сэлгэхэд нэг өнгө нэг тоог илэрхийлнэ.
 */
export function harmMax(cells: readonly WorldCell[]): number {
  let max = 0;
  for (const c of cells) max = Math.max(max, c.viirs_harm ?? 0, c.aqua);
  return max;
}

/**
 * Харьцаа мэдэгдэхгүй (viirs_harm = null) нүдний өнгө. Ramp-д байхгүй өнгө (Okabe-Ito ягаан) тул
 * ямар нэг тоо гэж андуурагдахгүй; Harmonize горимд platform-ын өнгө харагдахгүй тул давхцахгүй.
 */
export const NO_RATIO_COLOR = "#cc79a7";

/** Aqua-equivalent утгын өнгө: calendar-ийн ramp дээр log1p(v) / log1p(max). */
export function harmColor(value: number, max: number): string {
  return rampColor(Math.log1p(Math.max(0, value)), Math.log1p(Math.max(0, max)));
}

/** Тухайн дэлгэцийн утга: VIIRS = Aqua-equivalent (`viirs_harm`), MODIS = Aqua hotspot (× 1). null = харьцаа мэдэгдэхгүй. */
export const cellValue = (cell: WorldCell, sensor: Sensor): number | null =>
  sensor === "VIIRS" ? cell.viirs_harm : cell.aqua;

/** Нүд энэ дэлгэцэд зурагдах уу: 0 = hotspot алга = дэвсгэр. null (харьцаа мэдэгдэхгүй) зурагдана. */
export const drawnOn = (cell: WorldCell, sensor: Sensor): boolean => cellValue(cell, sensor) !== 0;

/** Нэг дэлгэцийн hexagon-ууд canvas дээр. ids = файл дахь нүдний дугаар; бусад нь ids-тэй ижил урт. */
export interface ProjectedCells {
  ids: Int32Array;
  /** Төв, px */
  xs: Float32Array;
  ys: Float32Array;
  /** Дэлгэцийн утга, null бол NaN. */
  values: Float64Array;
  /** Хилийн оройнууд [x0, y0, x1, y1, ...], px */
  polys: Float32Array[];
}

/** lon-ийг ±360°-аар шилжүүлж `ref`-д хамгийн ойр хуулбарыг авна. */
const nearCopy = (lon: number, ref: number) => lon + 360 * Math.round((ref - lon) / 360);

/**
 * Сонгосон дэлгэцийн нүднүүдийг проекцолно. Энэ дэлгэцэд 0 утгатай нүдийг алгасна (hotspot алга = дэвсгэр).
 * 180°-ыг дамнахад төвийг displayLon-оор, хилийн орой бүрийг төвд хамгийн ойр хуулбараар зурна:
 * хил нь ETL-д шилжсэн эсэхээс үл хамааран hexagon бүтэн хэвээр.
 */
export function projectCells(file: WorldCellsFile, sensor: Sensor, bbox: Bbox, view: Viewport): ProjectedCells {
  const ids: number[] = [];
  file.cells.forEach((c, i) => {
    if (drawnOn(c, sensor)) ids.push(i);
  });
  const xs = new Float32Array(ids.length);
  const ys = new Float32Array(ids.length);
  const values = new Float64Array(ids.length);
  const polys = ids.map((i, j) => {
    const c = file.cells[i];
    const lon = displayLon(c.lon, bbox);
    [xs[j], ys[j]] = view.project(lon, c.lat);
    values[j] = cellValue(c, sensor) ?? NaN;
    const poly = new Float32Array(c.boundary.length * 2);
    c.boundary.forEach(([vLon, vLat], k) => {
      [poly[2 * k], poly[2 * k + 1]] = view.project(nearCopy(vLon, lon), vLat);
    });
    return poly;
  });
  return { ids: Int32Array.from(ids), xs, ys, values, polys };
}

/** (x, y) нь polygon дотор уу (ray casting). */
function insidePoly(poly: Float32Array, x: number, y: number): boolean {
  let inside = false;
  const n = poly.length / 2;
  for (let a = 0, b = n - 1; a < n; b = a++) {
    const [xa, ya, xb, yb] = [poly[2 * a], poly[2 * a + 1], poly[2 * b], poly[2 * b + 1]];
    if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
  }
  return inside;
}

export interface CellHover {
  /** (x, y) дээрх hexagon-ы дугаар (ProjectedCells-ийн индекс), байхгүй бол -1. */
  at: (x: number, y: number) => number;
}

/**
 * Hexagon-ы hover: төвүүдийн spatial grid index + point-in-polygon.
 * H3 нүд нь төвийнхөө Voronoi нүдтэй ойролцоо тул курсорт хамгийн ойр төв = курсорын доорх hexagon.
 * Курсор тэр нүдний хил дотор, эсвэл (курсороос жижиг нүдний хувьд) төвөөс `radius` px дотор байвал олдоно.
 */
export function buildCellHover(cells: ProjectedCells, width: number, height: number, radius: number): CellHover {
  // Grid-ийн радиус = хамгийн том hexagon-ы төвөөс оройн зай, ингэснээр том нүдний булан ч хайлтад орно.
  let reach = radius;
  cells.polys.forEach((poly, j) => {
    for (let k = 0; k < poly.length; k += 2) {
      reach = Math.max(reach, Math.hypot(poly[k] - cells.xs[j], poly[k + 1] - cells.ys[j]));
    }
  });
  const grid = buildHoverGrid(cells.xs, cells.ys, width, height, reach);
  return {
    at(x, y) {
      const j = grid.nearest(x, y);
      if (j < 0) return -1;
      const close = Math.hypot(cells.xs[j] - x, cells.ys[j] - y) <= radius;
      return close || insidePoly(cells.polys[j], x, y) ? j : -1;
    },
  };
}
