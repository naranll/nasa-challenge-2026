/**
 * Dashboard-ийн 3D globe (World map)-ын цэвэр логик: цэг/нүдийг lon/lat + өнгөний массив болгох,
 * тивийн төв рүү камер чиглүүлэх, hover-ийн lon/lat grid index. React, three.js-гүй, тестлэгдэхүйц.
 */
import type { WorldCellsFile, WorldContinent, WorldPointsFile } from "../data/contracts";
import { SENSOR_OF, type Sensor } from "../globe/platforms";
import { cellValue, drawnOn, harmColor, NO_RATIO_COLOR } from "./cellsData";
import { PLATFORM_COLOR, type Bbox } from "./worldData";

/** Globe дээр зурах зүйлс: ids = файл дахь мөр/нүдний дугаар, бусад нь ids-тэй ижил урт. rgb нь 0..1, sRGB. */
export interface GlobeItems {
  ids: Int32Array;
  lons: Float32Array;
  lats: Float32Array;
  rgb: Float32Array;
}

/** "#rrggbb" эсвэл "rgb(r, g, b)" -> [r, g, b] 0..1. */
export function cssToRgb(css: string): [number, number, number] {
  if (css.startsWith("#")) {
    const n = parseInt(css.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const m = css.match(/\d+(\.\d+)?/g);
  if (!m || m.length < 3) return [1, 1, 1];
  return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
}

/**
 * Сонгосон sensor-ын түүхий цэгүүд. Олон цэгтэй platform-ыг эхэлж, цөөнийг сүүлд (дээр нь харагдана) —
 * canvas map-тай ижил дараалал.
 */
export function globePoints(file: WorldPointsFile, sensor: Sensor, continent: WorldContinent): GlobeItems {
  const { lon, lat, platform } = file.columns;
  const order = file.codes.platform
    .map((p, code) => ({ p, code }))
    .filter(({ p }) => SENSOR_OF[p] === sensor)
    .sort((a, b) => continent.n_by_platform[b.p] - continent.n_by_platform[a.p]);
  const ids: number[] = [];
  const codeOf: number[] = [];
  for (const { code } of order) {
    for (let i = 0; i < file.n; i++) {
      if (platform[i] === code) {
        ids.push(i);
        codeOf.push(code);
      }
    }
  }
  const colorOf = new Map(order.map(({ p, code }) => [code, cssToRgb(PLATFORM_COLOR[p])]));
  const n = ids.length;
  const out: GlobeItems = {
    ids: Int32Array.from(ids),
    lons: new Float32Array(n),
    lats: new Float32Array(n),
    rgb: new Float32Array(n * 3),
  };
  ids.forEach((i, j) => {
    out.lons[j] = lon[i];
    out.lats[j] = lat[i];
    out.rgb.set(colorOf.get(codeOf[j])!, j * 3);
  });
  return out;
}

/** Harmonize горимын нүднүүд (энэ дэлгэцэд 0 утгатайг алгасна), өнгө нь canvas map-тай ижил log шкал. */
export function globeCells(file: WorldCellsFile, sensor: Sensor, max: number): GlobeItems & { rings: [number, number][][] } {
  const ids: number[] = [];
  file.cells.forEach((c, i) => {
    if (drawnOn(c, sensor)) ids.push(i);
  });
  const n = ids.length;
  const out = {
    ids: Int32Array.from(ids),
    lons: new Float32Array(n),
    lats: new Float32Array(n),
    rgb: new Float32Array(n * 3),
    rings: [] as [number, number][][],
  };
  ids.forEach((i, j) => {
    const c = file.cells[i];
    const v = cellValue(c, sensor);
    out.lons[j] = c.lon;
    out.lats[j] = c.lat;
    out.rgb.set(cssToRgb(v === null ? NO_RATIO_COLOR : harmColor(v, max)), j * 3);
    out.rings.push(c.boundary);
  });
  return out;
}

/** Камер тивийг харах цэг: bbox-ийн төв, ба тивийн хэмжээнээс хамаарсан зай (дэлхийн радиус = 1). */
export function continentView([west, south, east, north]: Bbox): { lat: number; lon: number; distance: number } {
  const span = Math.max(east - west, (north - south) * 1.25);
  return {
    lat: (south + north) / 2,
    lon: (((west + east) / 2 + 540) % 360) - 180,
    distance: Math.min(4, Math.max(1.8, 1.1 + span / 45)),
  };
}

export interface LonLatIndex {
  /** (lon, lat)-д хамгийн ойр, `radiusDeg` градус дотор орших зүйлийн дугаар (lons/lats-ийн индекс), байхгүй бол -1. */
  nearest: (lon: number, lat: number, radiusDeg: number) => number;
}

/** Уртрагийн зөрүү −180..180. */
const dLon = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

/**
 * Hover-ийн spatial index lon/lat градусаар: дэлхийг `cellDeg` нүдэнд хувааж (counting sort, typed array),
 * хайлт нь радиусыг хамарсан нүднүүдийг л үзнэ. Зай нь өргөргийн cos-оор уртрагийг шахсан ойролцоо зай.
 * ±180°-ыг дамнахад баганыг тойруулна.
 */
export function buildLonLatIndex(lons: Float32Array, lats: Float32Array, cellDeg = 0.5): LonLatIndex {
  const cols = Math.ceil(360 / cellDeg);
  const rows = Math.ceil(180 / cellDeg);
  const colOf = (lon: number) => Math.min(cols - 1, Math.floor((((lon + 180) % 360) + 360) % 360 / cellDeg));
  const rowOf = (lat: number) => Math.min(rows - 1, Math.max(0, Math.floor((90 - lat) / cellDeg)));
  const start = new Int32Array(cols * rows + 1);
  const cellIx = new Int32Array(lons.length);
  for (let i = 0; i < lons.length; i++) {
    if (!(Number.isFinite(lons[i]) && Number.isFinite(lats[i]))) {
      cellIx[i] = -1;
      continue;
    }
    cellIx[i] = rowOf(lats[i]) * cols + colOf(lons[i]);
    start[cellIx[i] + 1]++;
  }
  for (let c = 0; c < cols * rows; c++) start[c + 1] += start[c];
  const fill = start.slice(0, -1);
  const items = new Int32Array(start[cols * rows]);
  for (let i = 0; i < lons.length; i++) if (cellIx[i] >= 0) items[fill[cellIx[i]]++] = i;

  return {
    nearest(lon, lat, radiusDeg) {
      const cosLat = Math.max(0.05, Math.cos((lat * Math.PI) / 180));
      const ry = Math.ceil(radiusDeg / cellDeg);
      const rx = Math.min(Math.floor(cols / 2), Math.ceil(radiusDeg / cosLat / cellDeg));
      const cx = colOf(lon);
      const cy = rowOf(lat);
      let best = -1;
      let bestD = radiusDeg * radiusDeg;
      for (let gy = Math.max(0, cy - ry); gy <= Math.min(rows - 1, cy + ry); gy++) {
        for (let k = -rx; k <= rx; k++) {
          const c = gy * cols + (((cx + k) % cols) + cols) % cols;
          for (let j = start[c]; j < start[c + 1]; j++) {
            const i = items[j];
            const d = (dLon(lons[i], lon) * cosLat) ** 2 + (lats[i] - lat) ** 2;
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
