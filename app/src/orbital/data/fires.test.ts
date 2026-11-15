import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { WorldPointsFile } from '../../data/contracts'
import type { Ring } from '../../globe/geo'
import { firesInside, insideRings, isPointsFile } from './fires'

const square: Ring[] = [
  [
    [100, 40],
    [110, 40],
    [110, 50],
    [100, 50],
    [100, 40],
  ],
]

function file(points: { lon: number; lat: number; date: number; hhmm: number; frp: number }[]): WorldPointsFile {
  const col = <K extends keyof (typeof points)[0]>(k: K) => points.map((p) => p[k])
  return {
    schema_version: '0.1',
    synthetic: true,
    continent: 'asia',
    n: points.length,
    codes: { platform: ['aqua'], conf: ['nominal'], match_class: ['both'] },
    dates: ['2026-01-01', '2026-01-02'],
    columns: {
      lon: col('lon'),
      lat: col('lat'),
      platform: points.map(() => 0),
      frp: col('frp'),
      conf: points.map(() => 0),
      date: col('date'),
      hhmm: col('hhmm'),
      daynight: points.map(() => 'D' as const),
      match_class: points.map(() => null),
    },
  }
}

describe('fires', () => {
  it('point in polygon', () => {
    expect(insideRings(105, 45, square)).toBe(true)
    expect(insideRings(111, 45, square)).toBe(false)
  })

  it('keeps only points inside, with detection time in seconds after the first day', () => {
    const f = firesInside(
      file([
        { lon: 105, lat: 45, date: 0, hhmm: 130, frp: 12 }, // day 1, 01:30
        { lon: 120, lat: 45, date: 0, hhmm: 0, frp: 5 }, // outside
        { lon: 101, lat: 49, date: 1, hhmm: 1345, frp: 40 }, // day 2, 13:45
      ]),
      square,
    )
    expect(f.n).toBe(2)
    expect([...f.t]).toEqual([90 * 60, 86_400 + (13 * 60 + 45) * 60])
    expect([...f.frp]).toEqual([12, 40])
    expect(f.periodS).toBe(2 * 86_400)
    expect(Math.hypot(f.pos[0], f.pos[1], f.pos[2])).toBeCloseTo(1, 5)
  })

  it('shape check rejects a file with a short column', () => {
    const bad = file([{ lon: 105, lat: 45, date: 0, hhmm: 0, frp: 1 }])
    bad.columns.frp = []
    expect(isPointsFile(bad)).toBe(false)
  })

  const real = join(__dirname, '../../../../public/data/world/points_asia.json')
  it.runIf(existsSync(real))('the real Asia file has fires inside Mongolia', () => {
    const doc = JSON.parse(readFileSync(real, 'utf8')) as WorldPointsFile
    expect(isPointsFile(doc)).toBe(true)
    const f = firesInside(doc)
    expect(f.n).toBeGreaterThan(0)
    expect(Math.max(...f.t)).toBeLessThanOrEqual(f.periodS)
    console.log(`Mongolia fires: ${f.n}, ${f.firstDay} – ${f.lastDay}`)
  })
})
