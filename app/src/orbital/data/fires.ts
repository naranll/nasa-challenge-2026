/**
 * Real hotspots for the home globe: home_fires.json (NASA FIRMS NRT, MODIS + VIIRS), made by
 * scripts/home_fires/make_home_fires.ts from the world map's points files: every hotspot in Mongolia
 * plus an even sample of the rest of the world. Each one flashes at the moment it was detected while
 * the period is replayed in a loop (see scene/FirePoints.tsx).
 */
import type { HomeFiresFile } from '../../data/contracts'
import { latLonToVec3 } from '../utils/geo'
import { periodSeconds } from './homeFiresBuild'

export const FIRE_FILE = 'home_fires.json'
/** Satellite beams and the dive-to-surface swing search this many hotspots (CPU, every frame), not all. */
export const BEAM_TARGETS = 3000

export interface Fires {
  n: number
  /** Unit vectors in the Earth's own (spinning) frame, xyz per hotspot. */
  pos: Float32Array
  /** Detection time, seconds after `startMs`. */
  t: Float32Array
  /** Fire radiative power, MW. */
  frp: Float32Array
  /** Hotspots the beams can lock on to: all of Mongolia's, then the strongest elsewhere. */
  beam: Uint32Array
  /** UTC midnight of the first day. */
  startMs: number
  /** Whole days covered, in seconds. */
  periodS: number
  firstDay: string
  lastDay: string
  inMongolia: number
  /** The file keeps every `every`-th hotspot outside Mongolia. */
  every: number
}

export function firesFromFile(doc: HomeFiresFile): Fires {
  const c = doc.columns
  const n = doc.n
  const pos = new Float32Array(n * 3)
  const t = new Float32Array(n)
  const frp = new Float32Array(n)
  const ll = doc.scale.lonlat
  for (let i = 0; i < n; i++) {
    latLonToVec3(c.lat[i] / ll, c.lon[i] / ll, 1).toArray(pos, i * 3)
    t[i] = c.t[i] * 60
    frp[i] = c.frp[i] / doc.scale.frp
  }
  const mn: number[] = []
  const rest: number[] = []
  for (let i = 0; i < n; i++) (c.mn[i] ? mn : rest).push(i)
  rest.sort((a, b) => frp[b] - frp[a])
  const beam = Uint32Array.from([...mn, ...rest].slice(0, Math.max(BEAM_TARGETS, mn.length)))
  return {
    n,
    pos,
    t,
    frp,
    beam,
    startMs: Date.parse(`${doc.period.start}T00:00:00Z`),
    periodS: periodSeconds(doc),
    firstDay: doc.period.start,
    lastDay: doc.period.end,
    inMongolia: mn.length,
    every: doc.sample.every,
  }
}

/** Shape check: every column the globe reads is there and `n` long. */
export function isHomeFiresFile(doc: HomeFiresFile): boolean {
  const c = doc?.columns
  return (
    typeof doc?.n === 'number' &&
    typeof doc.period?.start === 'string' &&
    typeof doc.period?.end === 'string' &&
    typeof doc.scale?.lonlat === 'number' &&
    typeof doc.scale?.frp === 'number' &&
    !!c &&
    (['lon', 'lat', 't', 'frp', 'mn'] as const).every((k) => Array.isArray(c[k]) && c[k].length === doc.n)
  )
}
