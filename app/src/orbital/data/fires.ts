/**
 * Real fire detections for the home globe: NASA FIRMS NRT points (world/points_asia.json, MODIS + VIIRS)
 * that fall inside Mongolia's border. Each one flashes at the moment it was detected while the period
 * is replayed in a loop (see scene/FirePoints.tsx).
 */
import type { WorldPointsFile } from '../../data/contracts'
import { MONGOLIA, rings, type Ring } from '../../globe/geo'
import { latLonToVec3 } from '../utils/geo'

export const FIRE_FILE = 'world/points_asia.json'
const DAY_MS = 86_400_000

export interface Fires {
  n: number
  /** Unit vectors in the Earth's own (spinning) frame, xyz per fire. */
  pos: Float32Array
  /** Detection time, seconds after `startMs`. */
  t: Float32Array
  /** Fire radiative power, MW. */
  frp: Float32Array
  /** UTC midnight of the first day in the file. */
  startMs: number
  /** Whole days covered, in seconds. */
  periodS: number
  /** First and last day, as written in the file. */
  firstDay: string
  lastDay: string
}

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

/** The file's points inside `outline` (default: Mongolia), with times relative to the first day. */
export function firesInside(file: WorldPointsFile, outline: Ring[] = rings(MONGOLIA)): Fires {
  const c = file.columns
  const box = bbox(outline)
  const days = [...file.dates].sort()
  const startMs = dayMs(days[0])
  const periodS = (dayMs(days[days.length - 1]) + DAY_MS - startMs) / 1000

  const keep: number[] = []
  for (let i = 0; i < file.n; i++) {
    const lng = c.lon[i]
    const lat = c.lat[i]
    if (lng < box.x0 || lng > box.x1 || lat < box.y0 || lat > box.y1) continue
    if (insideRings(lng, lat, outline)) keep.push(i)
  }

  const pos = new Float32Array(keep.length * 3)
  const t = new Float32Array(keep.length)
  const frp = new Float32Array(keep.length)
  keep.forEach((i, k) => {
    latLonToVec3(c.lat[i], c.lon[i], 1).toArray(pos, k * 3)
    const hhmm = c.hhmm[i]
    const ms = dayMs(file.dates[c.date[i]]) + (Math.floor(hhmm / 100) * 60 + (hhmm % 100)) * 60_000
    t[k] = (ms - startMs) / 1000
    frp[k] = Math.max(0, c.frp[i] ?? 0)
  })
  return { n: keep.length, pos, t, frp, startMs, periodS, firstDay: days[0], lastDay: days[days.length - 1] }
}

/** Shape check: every column the globe reads is there and `n` long. */
export function isPointsFile(doc: WorldPointsFile): boolean {
  const c = doc?.columns
  return (
    typeof doc?.n === 'number' &&
    Array.isArray(doc.dates) &&
    doc.dates.length > 0 &&
    !!c &&
    (['lon', 'lat', 'frp', 'date', 'hhmm'] as const).every((k) => Array.isArray(c[k]) && c[k].length === doc.n)
  )
}
