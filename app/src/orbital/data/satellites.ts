export type Sensor = 'MODIS' | 'VIIRS'
export type Filter = 'ALL' | Sensor

export const COLORS = {
  MODIS: '#E8D595', // Warm Sand / Amber Gold
  VIIRS: '#98D8E8', // Electric Cyan / Ice Blue
  land: '#F27D26',
  landDeep: '#E05A1B',
  ocean: '#1A1E29',
  fire: '#FF6A1F',
} as const

export interface Band {
  name: string
  wavelength: string
  resolution: string
  role: string
}

export interface SatelliteInfo {
  id: string
  number: number
  name: string
  sensor: Sensor
  altitudeKm: number
  launched: string
  overpass: string
  product: string
  resolution: string
  advantage: string
  /** Stylised scene parameters (Earth radius = 1) */
  orbit: {
    radius: number
    inclinationDeg: number
    raanDeg: number
    phaseDeg: number
    /** radians per second of scene time */
    speed: number
  }
}

/** Visual orbit radii — exaggerated so orbits read clearly, but VIIRS stays higher than MODIS. */
export const MODIS_R = 1.6
export const VIIRS_R = 1.78

export const SATELLITES: SatelliteInfo[] = [
  {
    id: 'npp',
    number: 1,
    name: 'Suomi NPP',
    sensor: 'VIIRS',
    altitudeKm: 824,
    launched: 'Oct 2011',
    overpass: '~13:30 / 01:30 local',
    product: 'VNP14IMG',
    resolution: '375 m I-band',
    advantage: 'Detects smaller, low-intensity fires',
    orbit: { radius: VIIRS_R, inclinationDeg: 98.7, raanDeg: 18, phaseDeg: 0, speed: 0.16 },
  },
  {
    id: 'noaa20',
    number: 2,
    name: 'NOAA-20',
    sensor: 'VIIRS',
    altitudeKm: 824,
    launched: 'Nov 2017',
    overpass: '~13:30 / 01:30 local',
    product: 'VJ114IMG',
    resolution: '375 m I-band',
    advantage: 'Half an orbit ahead of Suomi NPP — fills revisit gaps',
    orbit: { radius: VIIRS_R, inclinationDeg: 98.7, raanDeg: 62, phaseDeg: 120, speed: 0.16 },
  },
  {
    id: 'noaa21',
    number: 3,
    name: 'NOAA-21',
    sensor: 'VIIRS',
    altitudeKm: 824,
    launched: 'Nov 2022',
    overpass: '~13:30 / 01:30 local',
    product: 'VJ214IMG',
    resolution: '375 m I-band',
    advantage: 'Newest JPSS platform — continuity of 375 m fire record',
    orbit: { radius: VIIRS_R, inclinationDeg: 98.7, raanDeg: 106, phaseDeg: 240, speed: 0.16 },
  },
  {
    id: 'terra',
    number: 4,
    name: 'Terra',
    sensor: 'MODIS',
    altitudeKm: 705,
    launched: 'Dec 1999',
    overpass: '~10:30 / 22:30 local',
    product: 'MOD14',
    resolution: '1 km thermal bands',
    advantage: 'High-frequency diurnal cycle tracking (morning pass)',
    orbit: { radius: MODIS_R, inclinationDeg: 98.2, raanDeg: -38, phaseDeg: 60, speed: 0.19 },
  },
  {
    id: 'aqua',
    number: 5,
    name: 'Aqua',
    sensor: 'MODIS',
    altitudeKm: 705,
    launched: 'May 2002',
    overpass: '~13:30 / 01:30 local',
    product: 'MYD14',
    resolution: '1 km thermal bands',
    advantage: 'Afternoon pass — 20+ year consistent fire record',
    orbit: { radius: MODIS_R, inclinationDeg: 98.2, raanDeg: 148, phaseDeg: 200, speed: 0.19 },
  },
]

export const BANDS: Record<Sensor, Band[]> = {
  MODIS: [
    { name: 'Band 21', wavelength: '3.96 µm', resolution: '1 km', role: 'High-saturation MIR — main fire band' },
    { name: 'Band 22', wavelength: '3.96 µm', resolution: '1 km', role: 'Low-saturation MIR — sensitive channel' },
    { name: 'Band 31', wavelength: '11.0 µm', resolution: '1 km', role: 'Thermal IR — background & clouds' },
  ],
  VIIRS: [
    { name: 'I4', wavelength: '3.74 µm', resolution: '375 m', role: 'MIR imagery band — primary detection' },
    { name: 'I5', wavelength: '11.45 µm', resolution: '375 m', role: 'Thermal IR — background contrast' },
    { name: 'M13', wavelength: '4.05 µm', resolution: '750 m', role: 'Dual-gain — fire radiative power' },
  ],
}

export const SENSOR_SUMMARY: Record<Sensor, { pixel: string; strength: string; tradeoff: string }> = {
  MODIS: {
    pixel: '1 km pixel at nadir',
    strength: 'Morning + afternoon passes; the long 2000→ record used for trends.',
    tradeoff: 'Coarser pixel — small or cool fires can be missed.',
  },
  VIIRS: {
    pixel: '375 m pixel at nadir (~7× smaller area)',
    strength: 'Finer pixel picks up small, low-intensity and night-time fires.',
    tradeoff: 'Afternoon/night passes only; shorter record (2012→).',
  },
}

export const bySensor = (s: Sensor) => SATELLITES.filter((x) => x.sensor === s)
export const getSat = (id: string | null) => SATELLITES.find((s) => s.id === id) ?? null
