/**
 * World map (#34)-ийн цэвэр логик: багануудыг мөр болгох, 180°-ын шилжүүлэлт,
 * equirectangular проекц, hover-ийн spatial grid index. React-гүй, тестлэгдэхүйц.
 */
import type { PlatformKey, WorldConfLevel, WorldContinent, WorldMatchClass, WorldPointsFile } from "../data/contracts";
import { SENSOR_OF, type Sensor } from "../globe/platforms";

/** Нэг hotspot, hover-д харуулах хэлбэрээр. */
export interface WorldPoint {
  lon: number;
  lat: number;
  platform: PlatformKey;
  /** MW */
  frp: number;
  conf: WorldConfLevel;
  /** UTC огноо, "2026-11-05" */
  date: string;
  /** UTC цаг, "03:42" */
  time: string;
  daynight: "D" | "N";
  /** null = match хийгдээгүй (Terra, NOAA-21, эсвэл #37-оос өмнө) */
  matchClass: WorldMatchClass | null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** FIRMS acq_time (342) -> "03:42". */
const hhmmText = (hhmm: number) => `${pad2(Math.floor(hhmm / 100))}:${pad2(hhmm % 100)}`;

/** Баганат файлын i-р мөрийг код тайлж нэг цэг болгоно. Hover-д зөвхөн нэг мөрийг тайлна. */
export function pointAt(file: WorldPointsFile, i: number): WorldPoint {
  const c = file.columns;
  const match = c.match_class[i];
  return {
    lon: c.lon[i],
    lat: c.lat[i],
    platform: file.codes.platform[c.platform[i]],
    frp: c.frp[i],
    conf: file.codes.conf[c.conf[i]],
    date: file.dates[c.date[i]],
    time: hhmmText(c.hhmm[i]),
    daynight: c.daynight[i],
    matchClass: match === null ? null : file.codes.match_class[match],
  };
}

/** [west, south, east, north]. 180°-ыг дамнавал east > 180 байж болно (contracts/README.md). */
export type Bbox = WorldContinent["bbox"];

/** Okabe-Ito өнгө: өнгөний харалган хүнд ч ялгагдана, бараан дэвсгэр дээр тод. Ижил sensor-ын platform-ууд өөр өнгөтэй. */
export const PLATFORM_COLOR: Record<PlatformKey, string> = {
  terra: "#e69f00",
  aqua: "#f0e442",
  snpp: "#009e73",
  noaa20: "#56b4e9",
  noaa21: "#cc79a7",
};

/** x нь [west, east] интервалаас хэр хол гадна байна (дотор = 0). */
const outside = (x: number, [west, , east]: Bbox) => (x < west ? west - x : x > east ? x - east : 0);

/**
 * Цэгийг зурах уртраг. 180°-ыг дамнадаг bbox-д west-ээс баруун талын цэгийг +360°-аар шилжүүлнэ,
 * гэхдээ зөвхөн шилжүүлсэн нь bbox-д ойр бол (≤ 1° ойрын улсаар оноогдсон цэг west-ийн яг гадна байж болно).
 */
export function displayLon(lon: number, bbox: Bbox): number {
  if (bbox[2] <= 180 || lon >= bbox[0]) return lon;
  const shifted = lon + 360;
  return outside(shifted, bbox) < outside(lon, bbox) ? shifted : lon;
}

/** Газрын зургийг (−180..180) ямар шилжүүлэлтээр зурах вэ: bbox-той огтлолцох хуулбар бүр. */
export function worldCopies([west, , east]: Bbox): number[] {
  return [-360, 0, 360].filter((k) => -180 + k < east && 180 + k > west);
}

/** Нэг тивийн equirectangular харагдац: уртраг, өргөрөгт нэг ижил масштаб (px / градус). */
export interface Viewport {
  /** (lon, lat) -> canvas-ийн [x, y] (y доошоо). lon нь displayLon-оор шилжүүлсэн байх ёстой. */
  project: (lon: number, lat: number) => [number, number];
}

/** bbox-ийг width x height canvas-д багтаана: давчуу талдаа `pad` px үлдээж, нөгөө талдаа голлуулна. */
export function fitBbox([west, south, east, north]: Bbox, width: number, height: number, pad: number): Viewport {
  const k = Math.min((width - 2 * pad) / (east - west), (height - 2 * pad) / (north - south));
  const x0 = (width - k * (east - west)) / 2;
  const y0 = (height - k * (north - south)) / 2;
  return { project: (lon, lat) => [x0 + (lon - west) * k, y0 + (north - lat) * k] };
}

export interface HoverGrid {
  /** (x, y)-д хамгийн ойр, `radius` px дотор орших цэгийн дугаар (xs/ys-ийн индекс), байхгүй бол -1. */
  nearest: (x: number, y: number) => number;
}

/**
 * Hover-ийн spatial grid index: canvas-ийг `radius` px нүднүүдэд хувааж, цэг бүрийг нүдэнд нь хийнэ.
 * Хайлт зөвхөн 3 x 3 нүдийг үзнэ, тиймээс хэдэн зуун мянган цэгт ч хурдан.
 * Canvas-аас гадна (эсвэл NaN) цэгийг алгасна. Typed array дээр counting sort, объект үүсгэхгүй.
 */
export function buildHoverGrid(xs: Float32Array, ys: Float32Array, width: number, height: number, radius: number): HoverGrid {
  const cols = Math.max(1, Math.ceil(width / radius));
  const rows = Math.max(1, Math.ceil(height / radius));
  const cellOf = (i: number) => {
    const x = xs[i];
    const y = ys[i];
    if (!(x >= 0 && x <= width && y >= 0 && y <= height)) return -1;
    return Math.min(rows - 1, Math.floor(y / radius)) * cols + Math.min(cols - 1, Math.floor(x / radius));
  };
  // start[c] .. start[c + 1] = c нүдний цэгүүд items дотор.
  const start = new Int32Array(cols * rows + 1);
  const cells = new Int32Array(xs.length);
  for (let i = 0; i < xs.length; i++) {
    cells[i] = cellOf(i);
    if (cells[i] >= 0) start[cells[i] + 1]++;
  }
  for (let c = 0; c < cols * rows; c++) start[c + 1] += start[c];
  const fill = start.slice(0, -1);
  const items = new Int32Array(start[cols * rows]);
  for (let i = 0; i < xs.length; i++) if (cells[i] >= 0) items[fill[cells[i]]++] = i;

  return {
    nearest(x, y) {
      const cx = Math.floor(x / radius);
      const cy = Math.floor(y / radius);
      let best = -1;
      let bestD = radius * radius;
      for (let gy = Math.max(0, cy - 1); gy <= Math.min(rows - 1, cy + 1); gy++) {
        for (let gx = Math.max(0, cx - 1); gx <= Math.min(cols - 1, cx + 1); gx++) {
          const c = gy * cols + gx;
          for (let j = start[c]; j < start[c + 1]; j++) {
            const i = items[j];
            const d = (xs[i] - x) ** 2 + (ys[i] - y) ** 2;
            if (d <= bestD) {
              best = i;
              bestD = d;
            }
          }
        }
      }
      return best;
    },
  };
}

/** Нэг sensor-ын цэгүүд canvas дээр: ids = файл дахь мөрийн дугаар, xs/ys = px (ids-тэй ижил урт). */
export interface ProjectedPoints {
  ids: Int32Array;
  xs: Float32Array;
  ys: Float32Array;
}

/** Сонгосон sensor-ын цэгүүдийг шүүж, 180°-ын шилжүүлэлттэйгээр проекцолно. Зурах болон hover-т хоёуланд нь. */
export function projectPoints(file: WorldPointsFile, sensor: Sensor, bbox: Bbox, view: Viewport): ProjectedPoints {
  const { lon, lat, platform } = file.columns;
  const keep = file.codes.platform.map((p) => SENSOR_OF[p] === sensor);
  const ids: number[] = [];
  for (let i = 0; i < file.n; i++) if (keep[platform[i]]) ids.push(i);
  const xs = new Float32Array(ids.length);
  const ys = new Float32Array(ids.length);
  ids.forEach((i, j) => {
    [xs[j], ys[j]] = view.project(displayLon(lon[i], bbox), lat[i]);
  });
  return { ids: Int32Array.from(ids), xs, ys };
}

type LonLat = [number, number];

/** Natural Earth улсын хилийг ±180°-аар таслахдаа меридиан дагуу ирмэг нэмдэг: тэр нь жинхэнэ хил биш. */
const isCutEdge = (a: LonLat, b: LonLat) => Math.abs(a[0]) >= 179.99 && a[0] === b[0];

/**
 * Хилийн шугам зурахад: ring-ийг ±180°-ын таслалтын ирмэгүүдээр нь хувааж нээлттэй шугамууд болгоно.
 * Ингэснээр 180°-ыг дамнадаг тивд (Чукот, Фижи) меридиан дагуу хуурамч зураас гарахгүй. Будалт (fill) бүтэн ring-ээр хэвээр.
 */
export function borderLines(ring: LonLat[]): LonLat[][] {
  const lines: LonLat[][] = [];
  let line: LonLat[] = [ring[0]];
  for (let j = 1; j < ring.length; j++) {
    if (isCutEdge(ring[j - 1], ring[j])) {
      if (line.length > 1) lines.push(line);
      line = [ring[j]];
    } else line.push(ring[j]);
  }
  if (line.length > 1) lines.push(line);
  return lines;
}
