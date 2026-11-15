import { AnimatePresence, motion } from 'framer-motion'
import { COLORS, bySensor, type Sensor } from '../data/satellites'
import { useAppStore } from '../store/useAppStore'

function SensorButton({ sensor, tagline }: { sensor: Sensor; tagline: string }) {
  const filter = useAppStore((s) => s.filter)
  const toggle = useAppStore((s) => s.toggleFilter)
  const trackedId = useAppStore((s) => s.trackedId)
  const track = useAppStore((s) => s.track)
  const select = useAppStore((s) => s.select)
  const setHovered = useAppStore((s) => s.setHovered)
  const color = COLORS[sensor]
  const active = filter === sensor
  const dimmed = filter !== 'ALL' && !active
  const sats = bySensor(sensor)

  return (
    <motion.div animate={{ opacity: dimmed ? 0.4 : 1 }} transition={{ duration: 0.4 }}>
      <button
        onClick={() => toggle(sensor)}
        className="focus-ring group relative flex w-full items-center justify-between rounded-2xl px-5 py-3.5 text-left transition-all duration-300"
        style={{
          background: active ? color : `${color}14`,
          border: `1px solid ${active ? color : `${color}55`}`,
          color: active ? '#0B0D13' : color,
          boxShadow: active ? `0 0 32px -6px ${color}AA` : 'none',
        }}
        aria-pressed={active}
      >
        <span>
          <span className="block text-[22px] font-semibold leading-none tracking-[0.08em]">{sensor}</span>
          <span className="mt-1.5 block font-mono text-[10px] tracking-wider opacity-70">{tagline}</span>
        </span>
        <span className="font-mono text-[11px] opacity-70">{sats.length} SAT</span>
      </button>

      <AnimatePresence initial={false}>
        {active && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden pl-3"
          >
            <div className="pt-3" />
            {sats.map((s, i) => {
              const tracked = trackedId === s.id
              return (
                <motion.li
                  key={s.id}
                  initial={{ x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.06 * i + 0.1 }}
                >
                  <button
                    onClick={() => {
                      track(tracked ? null : s.id)
                      if (!tracked) select(null)
                    }}
                    onMouseEnter={() => setHovered(s.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="focus-ring group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="font-mono text-[11px] opacity-50">—</span>
                    <span
                      className="grid h-5 w-5 place-items-center rounded-full border font-mono text-[10px]"
                      style={{ borderColor: color, color, background: tracked ? `${color}33` : 'transparent' }}
                    >
                      {s.number}
                    </span>
                    <span className="flex-1 text-[14px] text-white/85">{s.name}</span>
                    <span
                      className="font-mono text-[9px] tracking-widest transition-opacity"
                      style={{ color, opacity: tracked ? 1 : 0 }}
                    >
                      ● TRACKING
                    </span>
                    {!tracked && (
                      <span className="font-mono text-[9px] tracking-widest text-white/40 opacity-0 transition-opacity group-hover:opacity-100">
                        FOCUS →
                      </span>
                    )}
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function SensorPanel() {
  const filter = useAppStore((s) => s.filter)
  const setFilter = useAppStore((s) => s.setFilter)
  const track = useAppStore((s) => s.track)

  return (
    <aside className="pointer-events-auto absolute top-1/2 left-4 z-20 flex w-[min(250px,calc(100%-120px))] -translate-y-1/2 flex-col gap-5 sm:left-10">
      <header className="mb-2">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-white/45">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F27D26] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F27D26]" />
          </span>
          ORBITAL WILDFIRE
        </div>
        <h1 className="mt-2 text-[15px] font-medium leading-snug text-white/80">
          Satellite fire-detection sensors
        </h1>
      </header>

      <SensorButton sensor="MODIS" tagline="TERRA · AQUA" />
      <SensorButton sensor="VIIRS" tagline="NPP · NOAA-20 · NOAA-21" />

      <AnimatePresence>
        {filter !== 'ALL' && (
          <motion.button
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onClick={() => {
              setFilter('ALL')
              track(null)
            }}
            className="focus-ring self-start rounded-full border border-white/15 px-4 py-1.5 font-mono text-[10px] tracking-[0.25em] text-white/60 transition-colors hover:border-white/40 hover:text-white"
          >
            ↺ ALL SENSORS
          </motion.button>
        )}
      </AnimatePresence>
    </aside>
  )
}
