/**
 * Home page: Orbital Wildfire — 5 fire-detection satellites (MODIS: Terra, Aqua · VIIRS: Suomi NPP,
 * NOAA-20, NOAA-21) orbiting a stylised Earth. The fires on it are real: NASA FIRMS NRT detections inside
 * Mongolia (data/fires.ts), replayed in a loop.
 *
 * The scene fills the screen. Overlays are positioned inside this box (not the window).
 */
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import './orbital.css'
import Scene from './scene/Scene'
import SensorPanel from './ui/SensorPanel'
import AltitudeBar from './ui/AltitudeBar'
import SatelliteTooltip from './ui/SatelliteTooltip'
import CompareDrawer from './ui/CompareDrawer'
import { sim, useAppStore } from './store/useAppStore'
import { FIRE_FILE, firesInside, isPointsFile } from './data/fires'
import { loadData } from '../data'
import type { WorldPointsFile } from '../data/contracts'
import { ROUTES } from '../routes'

/** Wait this long after the first paint before fetching the 5 MB fire file, so the globe shows first. */
const FIRES_AFTER_MS = 400
const DAY_MS = 86_400_000

const dayLabel = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** The replay's current day, read from the scene's clock without re-rendering React every frame. */
function FireClock() {
  const fires = useAppStore((s) => s.fires)
  const out = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!fires) return
    let shown = -1
    const id = setInterval(() => {
      const day = Math.floor((fires.startMs + sim.fireT * 1000) / DAY_MS)
      if (day !== shown && out.current) {
        shown = day
        out.current.textContent = dayLabel(day * DAY_MS)
      }
    }, 250)
    return () => clearInterval(id)
  }, [fires])
  if (!fires) return null
  return (
    <>
      <br />
      <span className="text-[#F27D26]/80">
        ● {fires.n.toLocaleString('en-GB')} FIRES IN MONGOLIA · NASA FIRMS NRT · {dayLabel(Date.parse(fires.firstDay))} –{' '}
        {dayLabel(Date.parse(fires.lastDay))} · REPLAY <span ref={out} className="text-white/60" /> UTC
      </span>
    </>
  )
}

export default function OrbitalHome() {
  const drawerOpen = useAppStore((s) => s.selectedId !== null)

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

  // Real fires, fetched after the scene is up. If the file fails, the globe simply shows none.
  useEffect(() => {
    let live = true
    const timer = setTimeout(() => {
      loadData<WorldPointsFile>(FIRE_FILE)
        .then((doc) => live && isPointsFile(doc) && useAppStore.getState().setFires(firesInside(doc)))
        .catch(() => undefined)
    }, FIRES_AFTER_MS)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [])

  return (
    <section className="orbital-home relative h-full w-full overflow-hidden" aria-label="Orbital Wildfire">
      <Scene />

      {/* overlays */}
      <div className="pointer-events-none absolute inset-0">
        <SensorPanel />
        <AltitudeBar />
        <p
          className={`absolute bottom-5 left-4 hidden font-mono text-[9.5px] tracking-[0.16em] text-white/30 transition-opacity duration-300 sm:left-10 md:block ${
            drawerOpen ? 'opacity-0' : 'opacity-100'
          }`}
        >
          DRAG · ORBIT &nbsp;&nbsp; SCROLL · ZOOM &nbsp;&nbsp; CLICK SATELLITE · DETAILS
          <br />
          <span className="text-white/20">Orbits stylised · fires are real detections, each flashing when it was seen</span>
          <FireClock />
        </p>
      </div>

      {/* bottom right, while no satellite is open: straight to the dashboard */}
      <AnimatePresence>
        {!drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-4 bottom-4 z-30 sm:right-8 sm:bottom-5"
          >
            <Link
              to={ROUTES.dashboard}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-[#F27D26] px-5 font-mono text-[11px] font-medium tracking-[0.22em] text-[#0B0D13] no-underline shadow-[0_0_32px_-6px_#F27D26AA] transition-[filter,transform] duration-150 hover:-translate-y-px hover:brightness-110"
            >
              ANALYZE →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <SatelliteTooltip />
      <CompareDrawer />
    </section>
  )
}
