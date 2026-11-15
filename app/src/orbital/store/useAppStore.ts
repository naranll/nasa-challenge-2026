import { create } from 'zustand'
import * as THREE from 'three'
import type { Filter } from '../data/satellites'
import { HOTSPOTS } from '../data/hotspots'

interface AppState {
  filter: Filter
  hoveredId: string | null
  /** true when the hover came from the 3D scene (shows the cursor tooltip) */
  hoverFrom3D: boolean
  pointer: { x: number; y: number }
  trackedId: string | null
  selectedId: string | null
  setFilter: (f: Filter) => void
  toggleFilter: (f: Exclude<Filter, 'ALL'>) => void
  setHovered: (id: string | null, from3D?: boolean) => void
  setPointer: (x: number, y: number) => void
  track: (id: string | null) => void
  select: (id: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  filter: 'ALL',
  hoveredId: null,
  hoverFrom3D: false,
  pointer: { x: 0, y: 0 },
  trackedId: null,
  selectedId: null,
  setFilter: (filter) => set({ filter }),
  toggleFilter: (f) => set({ filter: get().filter === f ? 'ALL' : f }),
  setHovered: (hoveredId, from3D = false) => set({ hoveredId, hoverFrom3D: from3D }),
  setPointer: (x, y) => set({ pointer: { x, y } }),
  track: (trackedId) => {
    if (trackedId) sim.zoomTarget = null
    set({ trackedId })
  },
  select: (selectedId) => set({ selectedId }),
}))

/**
 * Mutable per-frame simulation state shared between the 3D scene and the DOM
 * overlays. Kept outside React so 60fps updates don't trigger re-renders.
 */
export const sim = {
  /** world positions of every satellite, updated each frame */
  satPos: {} as Record<string, THREE.Vector3>,
  /** 0..1 heat of each hotspot (boosted while a beam scans it) */
  hotspotHeat: HOTSPOTS.map(() => 0),
  /** the spinning earth group (for hotspot world positions) */
  earth: null as THREE.Object3D | null,
  /** camera distance from Earth centre */
  camDist: 4.4,
  /** desired camera distance requested by the altitude bar */
  zoomTarget: null as number | null,
  /** set by the CameraRig when the user drags the 3D view */
  userInteracting: false,
}

/* ---------- Altitude bar ⇄ camera distance mapping ---------- */

/** Zones of the right-hand bar, bottom (t=0) → top (t=1). */
export const ZONES = [
  { key: 'earth', label: 'Earth surface', from: 0, to: 0.12, color: '#A6613E' },
  { key: 'bio', label: 'Biosphere · canopy', from: 0.12, to: 0.27, color: '#31A354' },
  { key: 'atmo', label: 'Troposphere · Stratosphere', from: 0.27, to: 0.45, color: '#2B8CBE' },
  { key: 'thermo', label: 'Mesosphere · Thermosphere', from: 0.45, to: 0.6, color: '#13294B' },
  { key: 'space', label: 'In space', from: 0.6, to: 1, color: '#090A0F' },
] as const

export const MIN_DIST = 1.09
export const MAX_DIST = 7

// (t on bar, camera distance) — markers for MODIS/VIIRS sit exactly at their orbit radius.
export const MODIS_T = 0.68
export const VIIRS_T = 0.77
const KEYS: [number, number][] = [
  [0, MIN_DIST],
  [0.12, 1.14],
  [0.27, 1.22],
  [0.45, 1.33],
  [0.6, 1.46],
  [MODIS_T, 1.6],
  [VIIRS_T, 1.78],
  [1, MAX_DIST],
]

export function tToDist(t: number) {
  t = Math.min(1, Math.max(0, t))
  for (let i = 1; i < KEYS.length; i++) {
    const [t1, d1] = KEYS[i]
    const [t0, d0] = KEYS[i - 1]
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0)
      return Math.exp(Math.log(d0) + (Math.log(d1) - Math.log(d0)) * k)
    }
  }
  return MAX_DIST
}

export function distToT(d: number) {
  d = Math.min(MAX_DIST, Math.max(MIN_DIST, d))
  for (let i = 1; i < KEYS.length; i++) {
    const [t1, d1] = KEYS[i]
    const [t0, d0] = KEYS[i - 1]
    if (d <= d1) {
      const k = (Math.log(d) - Math.log(d0)) / (Math.log(d1) - Math.log(d0))
      return t0 + (t1 - t0) * k
    }
  }
  return 1
}

export const zoneAt = (t: number) => ZONES.find((z) => t >= z.from && t <= z.to) ?? ZONES[ZONES.length - 1]
