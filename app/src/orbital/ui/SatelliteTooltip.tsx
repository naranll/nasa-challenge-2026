import { AnimatePresence, motion } from 'framer-motion'
import { COLORS, getSat } from '../data/satellites'
import { useAppStore } from '../store/useAppStore'

const W = 260
const H = 150

export default function SatelliteTooltip() {
  const hoveredId = useAppStore((s) => s.hoveredId)
  const pointer = useAppStore((s) => s.pointer)
  const from3D = useAppStore((s) => s.hoverFrom3D)
  const sat = getSat(hoveredId)

  // keep the card on-screen
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  let x = pointer.x + 18
  let y = pointer.y + 18
  if (x + W > vw - 12) x = pointer.x - W - 18
  if (y + H > vh - 12) y = pointer.y - H - 18

  // the side-panel list also sets hoveredId; the cursor card is only for 3D hovers
  const show = sat && from3D

  return (
    <AnimatePresence>
      {show && sat && (
        <motion.div
          key={sat.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16 }}
          className="glass pointer-events-none fixed z-40 rounded-xl p-3.5"
          style={{ left: x, top: y, width: W }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-white">{sat.name}</span>
            <span
              className="rounded-full px-2 py-0.5 font-mono text-[9.5px] font-medium tracking-[0.18em]"
              style={{ background: `${COLORS[sat.sensor]}22`, color: COLORS[sat.sensor] }}
            >
              {sat.sensor}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-[11px]">
            <dt className="text-white/40">ALTITUDE</dt>
            <dd className="text-right text-white/90">{sat.altitudeKm} km</dd>
            <dt className="text-white/40">RESOLUTION</dt>
            <dd className="text-right text-white/90">{sat.resolution}</dd>
          </dl>
          <p className="mt-3 border-t border-white/10 pt-2.5 text-[12px] leading-snug text-white/75 italic">
            {sat.advantage}
          </p>
          <p className="mt-2 font-mono text-[9px] tracking-wider text-white/35">CLICK FOR BAND COMPARISON</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
