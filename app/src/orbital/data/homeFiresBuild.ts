/**
 * Builds home_fires.json, the home globe's hotspots, from the world map's world/points_{continent}.json.
 * Pure and type-only imports, so scripts/home_fires/make_home_fires.ts can run it with plain Node.
 *
 * Kept: every hotspot inside Mongolia, plus every `every`-th hotspot elsewhere. The points files are
 * sorted by UTC time, so a fixed stride keeps both the time spread and the places, at a fraction of the
 * size (all 1.2 M world hotspots are ~47 MB; this is ~1 MB).
 */
import type { HomeFiresFile, WorldPointsFile } from '../../data/contracts'

export type Ring = [number, number][] // [lng, lat]

export const LONLAT_SCALE = 100 // 0.01° ≈ 1 km, finer than a VIIRS pixel needs here
export const FRP_SCALE = 10 // 0.1 MW
const DAY_MS = 86_400_000

/** Even-odd point-in-polygon over every ring (holes included). */
export function insideRings(lng: number, lat: number, rs: Ring[]): boolean {
  let inside = false
  for (const r of rs) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i]
      const [xj, yj] = r[j]
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
    }
  }
  return inside
}

function bbox(rs: Ring[]) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const r of rs)
    for (const [x, y] of r) {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  return { x0, y0, x1, y1 }
}

const dayMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`)
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export function buildHomeFires(files: WorldPointsFile[], mongolia: Ring[], every: number, synthetic: boolean): HomeFiresFile {
  const days = files.flatMap((f) => f.dates).sort()
  const startMs = dayMs(days[0])
  const box = bbox(mongolia)
  const cols: HomeFiresFile['columns'] = { lon: [], lat: [], t: [], frp: [], mn: [] }
  let sourceN = 0
  let k = 0 // stride counter across all files, so small continents are sampled at the same rate

  for (const f of files) {
    const c = f.columns
    sourceN += f.n
    for (let i = 0; i < f.n; i++) {
      const lng = c.lon[i]
      const lat = c.lat[i]
      const inMn = lng >= box.x0 && lng <= box.x1 && lat >= box.y0 && lat <= box.y1 && insideRings(lng, lat, mongolia)
      const sampled = k++ % every === 0
      if (!inMn && !sampled) continue
      const hhmm = c.hhmm[i]
      const ms = dayMs(f.dates[c.date[i]]) + (Math.floor(hhmm / 100) * 60 + (hhmm % 100)) * 60_000
      cols.lon.push(Math.round(lng * LONLAT_SCALE))
      cols.lat.push(Math.round(lat * LONLAT_SCALE))
      cols.t.push(Math.round((ms - startMs) / 60_000))
      cols.frp.push(Math.round(Math.max(0, c.frp[i] ?? 0) * FRP_SCALE))
      cols.mn.push(inMn ? 1 : 0)
    }
  }

  return {
    schema_version: '0.1',
    synthetic,
    source: 'world/points_{continent}.json (NASA FIRMS NRT: MODIS, VIIRS S-NPP, NOAA-20, NOAA-21)',
    period: { start: days[0], end: days[days.length - 1] },
    sample: { every, mongolia: 'all' },
    source_n: sourceN,
    n: cols.lon.length,
    scale: { lonlat: LONLAT_SCALE, frp: FRP_SCALE },
    columns: cols,
  }
}

/** Seconds from the first day's UTC midnight to the end of the last day. */
export const periodSeconds = (file: HomeFiresFile) => (dayMs(file.period.end) + DAY_MS - dayMs(file.period.start)) / 1000
export { isoDay }
