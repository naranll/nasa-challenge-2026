/**
 * Home page: Orbital Wildfire — 5 fire-detection satellites (MODIS: Terra, Aqua · VIIRS: Suomi NPP,
 * NOAA-20, NOAA-21) orbiting a stylised Earth with illustrative wildfire hotspots.
 *
 * The scene fills the space under the site header. Overlays are positioned inside this box
 * (not the window), so the site header, banner and footer stay visible.
 */
import { useEffect } from 'react'
import './orbital.css'
import Scene from './scene/Scene'
import SensorPanel from './ui/SensorPanel'
import AltitudeBar from './ui/AltitudeBar'
import SatelliteTooltip from './ui/SatelliteTooltip'
import CompareDrawer from './ui/CompareDrawer'
import { useAppStore } from './store/useAppStore'

export default function OrbitalHome() {
  // Esc closes the drawer and releases the camera
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const s = useAppStore.getState()
      s.select(null)
      s.track(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <section className="orbital-home relative h-full w-full overflow-hidden" aria-label="Orbital Wildfire">
      <Scene />

      {/* overlays */}
      <div className="pointer-events-none absolute inset-0">
        <SensorPanel />
        <AltitudeBar />
        <p className="absolute bottom-5 left-4 hidden font-mono text-[9.5px] tracking-[0.16em] text-white/30 sm:left-10 md:block">
          DRAG · ORBIT &nbsp;&nbsp; SCROLL · ZOOM &nbsp;&nbsp; CLICK SATELLITE · DETAILS
          <br />
          <span className="text-white/20">Orbits stylised · hotspot regions illustrative</span>
        </p>
      </div>
      <SatelliteTooltip />
      <CompareDrawer />
    </section>
  )
}
