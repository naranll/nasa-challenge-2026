export interface Hotspot {
  name: string
  lat: number
  lon: number
  /** 0..1 — size/brightness of the pulse */
  intensity: number
}

/** Stylised fire-prone regions (illustrative, not live FIRMS data). */
export const HOTSPOTS: Hotspot[] = [
  { name: 'Amazon basin', lat: -9, lon: -62, intensity: 1 },
  { name: 'Brazilian Cerrado', lat: -13, lon: -47, intensity: 0.8 },
  { name: 'Central African savanna', lat: 6.5, lon: 22, intensity: 1 },
  { name: 'Angola / Zambia miombo', lat: -12, lon: 22, intensity: 0.9 },
  { name: 'West African Sahel', lat: 10.5, lon: 2, intensity: 0.6 },
  { name: 'California', lat: 39.5, lon: -121.5, intensity: 0.8 },
  { name: 'Alberta / British Columbia', lat: 56, lon: -118, intensity: 0.85 },
  { name: 'Yakutia, Siberia', lat: 62, lon: 129, intensity: 0.9 },
  { name: 'Dornod steppe, Mongolia', lat: 47.8, lon: 114.5, intensity: 0.7 },
  { name: 'Northern Australia', lat: -15, lon: 133, intensity: 0.85 },
  { name: 'SE Australia', lat: -36.5, lon: 148, intensity: 0.6 },
  { name: 'Kalimantan, Borneo', lat: -1.5, lon: 113.5, intensity: 0.75 },
  { name: 'Myanmar / Thailand', lat: 20, lon: 97.5, intensity: 0.7 },
  { name: 'Mediterranean (Greece)', lat: 38.5, lon: 22.5, intensity: 0.55 },
]
