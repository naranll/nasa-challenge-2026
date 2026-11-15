import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { HomeFiresFile, WorldPointsFile } from '../../data/contracts'
import { firesFromFile, isHomeFiresFile } from './fires'
import { buildHomeFires, insideRings, periodSeconds, type Ring } from './homeFiresBuild'

const square: Ring[] = [
  [
    [100, 40],
    [110, 40],
    [110, 50],
    [100, 50],
    [100, 40],
  ],
]

function points(rows: { lon: number; lat: number; date: number; hhmm: number; frp: number }[]): WorldPointsFile {
  const col = <K extends keyof (typeof rows)[0]>(k: K) => rows.map((p) => p[k])
  return {
    schema_version: '0.1',
    synthetic: true,
    continent: 'asia',
    n: rows.length,
    codes: { platform: ['aqua'], conf: ['nominal'], match_class: ['both'] },
    dates: ['2026-01-01', '2026-01-02'],
    columns: {
      lon: col('lon'),
      lat: col('lat'),
      platform: rows.map(() => 0),
      frp: col('frp'),
      conf: rows.map(() => 0),
      date: col('date'),
      hhmm: col('hhmm'),
      daynight: rows.map(() => 'D' as const),
      match_class: rows.map(() => null),
    },
  }
}

describe('home fires', () => {
  it('point in polygon', () => {
    expect(insideRings(105, 45, square)).toBe(true)
    expect(insideRings(111, 45, square)).toBe(false)
  })

  it('keeps everything inside the outline and every n-th hotspot outside it', () => {
    const doc = buildHomeFires(
      [
        points([
          { lon: 120, lat: 45, date: 0, hhmm: 0, frp: 5 }, // outside, k=0 → sampled
          { lon: 105, lat: 45, date: 0, hhmm: 130, frp: 12.34 }, // inside, day 1 01:30
          { lon: 121, lat: 45, date: 0, hhmm: 0, frp: 5 }, // outside, k=2 → dropped
          { lon: 122, lat: 45, date: 1, hhmm: 1345, frp: 40 }, // outside, k=3 → sampled, day 2 13:45
        ]),
      ],
      square,
      3,
      true,
    )
    expect(doc.n).toBe(3)
    expect(doc.source_n).toBe(4)
    expect(doc.columns.mn).toEqual([0, 1, 0])
    expect(doc.columns.t).toEqual([0, 90, 1440 + 13 * 60 + 45])
    expect(doc.columns.frp[1]).toBe(123)
    expect(periodSeconds(doc)).toBe(2 * 86_400)
    expect(isHomeFiresFile(doc)).toBe(true)

    const f = firesFromFile(doc)
    expect([...f.t]).toEqual([0, 90 * 60, (1440 + 13 * 60 + 45) * 60])
    expect(f.frp[1]).toBeCloseTo(12.3, 5)
    expect(f.beam[0]).toBe(1) // Mongolia (inside) first
    expect(f.inMongolia).toBe(1)
    expect(Math.hypot(f.pos[0], f.pos[1], f.pos[2])).toBeCloseTo(1, 5)
  })

  it('shape check rejects a short column', () => {
    const doc = buildHomeFires([points([{ lon: 105, lat: 45, date: 0, hhmm: 0, frp: 1 }])], square, 1, true)
    doc.columns.frp = []
    expect(isHomeFiresFile(doc)).toBe(false)
  })

  const real = join(__dirname, '../../../../public/data/home_fires.json')
  it.runIf(existsSync(real))('the real file is valid and covers the world plus all of Mongolia', () => {
    const doc = JSON.parse(readFileSync(real, 'utf8')) as HomeFiresFile
    expect(isHomeFiresFile(doc)).toBe(true)
    expect(doc.synthetic).toBe(false)
    const f = firesFromFile(doc)
    expect(f.n).toBeGreaterThan(10_000)
    expect(f.inMongolia).toBeGreaterThan(0)
    expect(Math.max(...f.t)).toBeLessThanOrEqual(f.periodS)
  })
})
