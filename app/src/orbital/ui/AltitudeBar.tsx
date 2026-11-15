import { useEffect, useRef, useState } from 'react'
import { COLORS } from '../data/satellites'
import {
  MODIS_T,
  VIIRS_T,
  ZONES,
  distToT,
  sim,
  tToDist,
  useAppStore,
  zoneAt,
} from '../store/useAppStore'

// smooth vertical gradient built from zone colours (bottom → top)
const GRADIENT = `linear-gradient(to top,
  #A6613E 0%, #A6613E 7%,
  #31A354 15%, #31A354 22%,
  #2B8CBE 32%, #2B8CBE 41%,
  #13294B 50%, #13294B 56%,
  #090A0F 66%, #090A0F 100%)`

const BRACKET_H = 30

export default function AltitudeBar() {
  const barRef = useRef<HTMLDivElement>(null)
  const bracketRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [zone, setZone] = useState<string>('space')
  const [active, setActive] = useState(false)
  const track = useAppStore((s) => s.track)

  // follow the camera (mouse-wheel zoom etc.) — runs outside React for 60fps
  useEffect(() => {
    let raf = 0
    let lastZone = ''
    const loop = () => {
      if (!dragging.current && bracketRef.current) {
        const t = distToT(sim.camDist)
        bracketRef.current.style.bottom = `${t * 100}%`
        const z = zoneAt(t).key
        if (z !== lastZone) setZone((lastZone = z))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const setFromPointer = (clientY: number) => {
    const r = barRef.current!.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, 1 - (clientY - r.top) / r.height))
    bracketRef.current!.style.bottom = `${t * 100}%`
    sim.zoomTarget = tToDist(t)
    setZone(zoneAt(t).key)
  }

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true
    setActive(true)
    track(null)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setFromPointer(e.clientY)
  }
  const onMove = (e: React.PointerEvent) => dragging.current && setFromPointer(e.clientY)
  const onUp = () => {
    dragging.current = false
    setActive(false)
  }

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowUp' ? 0.04 : e.key === 'ArrowDown' ? -0.04 : 0
    if (!step) return
    e.preventDefault()
    track(null)
    sim.zoomTarget = tToDist(distToT(sim.camDist) + step)
  }

  const currentZone = ZONES.find((z) => z.key === zone)!

  return (
    <div className="pointer-events-auto absolute top-1/2 right-4 z-20 flex h-[75%] -translate-y-1/2 items-stretch gap-3 sm:right-8">
      {/* labels column */}
      <div className="relative hidden w-[150px] sm:block">
        {ZONES.filter((z) => z.key !== 'space').map((z) => (
          <div
            key={z.key}
            className="absolute right-0 translate-y-1/2 text-right font-mono text-[9.5px] uppercase tracking-[0.16em] transition-colors duration-300"
            style={{
              bottom: `${((z.from + z.to) / 2) * 100}%`,
              color: zone === z.key ? '#fff' : 'rgba(255,255,255,0.38)',
            }}
          >
            {z.label}
          </div>
        ))}
        <div
          className="absolute right-0 translate-y-1/2 text-right font-mono text-[11px] font-medium tracking-[0.22em] transition-colors"
          style={{ bottom: '95%', color: zone === 'space' ? '#fff' : 'rgba(255,255,255,0.5)' }}
        >
          IN SPACE
          <div className="text-[9px] tracking-[0.14em] text-white/35">~700–830 km</div>
        </div>
        {[
          { t: VIIRS_T, label: 'VIIRS · 824 km', color: COLORS.VIIRS },
          { t: MODIS_T, label: 'MODIS · 705 km', color: COLORS.MODIS },
        ].map((m) => (
          <div
            key={m.label}
            className="absolute right-0 flex translate-y-1/2 items-center gap-2 font-mono text-[10px] tracking-wider"
            style={{ bottom: `${m.t * 100}%`, color: m.color }}
          >
            {m.label}
            <span className="h-px w-3" style={{ background: m.color }} />
          </div>
        ))}
      </div>

      {/* thin double-arrow scale (from the wireframe) */}
      <div className="relative hidden w-2 flex-col items-center sm:flex">
        <span className="text-[8px] leading-none text-[#5B7CFF]">▲</span>
        <span className="w-px flex-1 bg-gradient-to-b from-[#5B7CFF]/70 via-[#5B7CFF]/30 to-[#5B7CFF]/70" />
        <span className="text-[8px] leading-none text-[#5B7CFF]">▼</span>
      </div>

      {/* the bar itself */}
      <div
        ref={barRef}
        role="slider"
        tabIndex={0}
        aria-label="Camera altitude"
        aria-valuetext={currentZone.label}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
        className="focus-ring relative w-6 cursor-ns-resize touch-none rounded-full"
        style={{
          background: GRADIENT,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 40px -10px rgba(43,140,190,0.35)',
        }}
      >
        {/* altitude markers for the two sensors */}
        {[
          { t: VIIRS_T, c: COLORS.VIIRS },
          { t: MODIS_T, c: COLORS.MODIS },
        ].map((m) => (
          <span
            key={m.t}
            className="absolute -left-1 -right-1 h-[2px] translate-y-1/2 rounded-full"
            style={{ bottom: `${m.t * 100}%`, background: m.c, boxShadow: `0 0 8px ${m.c}` }}
          />
        ))}

        {/* glowing indicator bracket */}
        <div
          ref={bracketRef}
          className="absolute -left-2.5 -right-2.5 translate-y-1/2 rounded-md transition-[box-shadow] duration-300"
          style={{
            height: BRACKET_H,
            bottom: '90%',
            border: '2px solid #F27D26',
            boxShadow: active
              ? '0 0 24px 2px rgba(242,125,38,0.85), inset 0 0 12px rgba(242,125,38,0.5)'
              : '0 0 14px rgba(242,125,38,0.55), inset 0 0 8px rgba(242,125,38,0.25)',
          }}
        >
          <span
            className="glass absolute top-1/2 right-[calc(100%+10px)] -translate-y-1/2 rounded-md px-2 py-1 font-mono text-[10px] whitespace-nowrap text-white transition-opacity duration-200 sm:hidden"
            style={{ opacity: active ? 1 : 0 }}
          >
            {currentZone.label}
          </span>
        </div>
      </div>
    </div>
  )
}
