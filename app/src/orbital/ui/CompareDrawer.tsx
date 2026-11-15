import { AnimatePresence, motion } from 'framer-motion'
import { BANDS, COLORS, SENSOR_SUMMARY, getSat, type Sensor } from '../data/satellites'
import { useAppStore } from '../store/useAppStore'
import { SiteNav } from '../../components/SiteNav'

/** 1 km MODIS pixel with the ~2.67 × 2.67 VIIRS 375 m pixels that fit inside it. */
function PixelCompare({ sensor }: { sensor: Sensor }) {
  const S = 96
  const v = S * (375 / 1000)
  const lines = []
  for (let k = 1; k * v < S; k++) lines.push(k * v)
  const modisOn = sensor === 'MODIS'
  return (
    <svg width={S + 2} height={S + 2} viewBox={`-1 -1 ${S + 2} ${S + 2}`} className="shrink-0">
      <rect
        x={0}
        y={0}
        width={S}
        height={S}
        fill={modisOn ? `${COLORS.MODIS}26` : 'transparent'}
        stroke={COLORS.MODIS}
        strokeWidth={modisOn ? 2 : 1}
        opacity={modisOn ? 1 : 0.5}
      />
      {lines.map((p) => (
        <g key={p} stroke={COLORS.VIIRS} strokeWidth={modisOn ? 0.6 : 1} opacity={modisOn ? 0.35 : 0.9}>
          <line x1={p} y1={0} x2={p} y2={S} />
          <line x1={0} y1={p} x2={S} y2={p} />
        </g>
      ))}
      {!modisOn && <rect x={0} y={0} width={v} height={v} fill={`${COLORS.VIIRS}55`} />}
      {/* a small fire */}
      <circle cx={v * 0.55} cy={v * 0.5} r={4} fill="#FF7A2A" />
      <circle cx={v * 0.55} cy={v * 0.5} r={9} fill="#FF7A2A" opacity={0.25} />
    </svg>
  )
}

export default function CompareDrawer() {
  const selectedId = useAppStore((s) => s.selectedId)
  const trackedId = useAppStore((s) => s.trackedId)
  const select = useAppStore((s) => s.select)
  const track = useAppStore((s) => s.track)
  // Opened from the scene: bottom left. Tracked from the sensor list: beside the satellite, which the camera centres.
  const fromList = selectedId === null && trackedId !== null
  const sat = getSat(selectedId ?? trackedId)
  const close = () => (fromList ? track(null) : select(null))

  return (
    <AnimatePresence>
      {sat && (
        <motion.section
          key={sat.id}
          initial={{ opacity: 0, x: fromList ? 40 : -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: fromList ? 40 : -40 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          // bottom left; CameraRig holds the satellite itself at the top right, apart from this
          className={`glass pointer-events-auto absolute z-30 max-h-[calc(100%-24px)] overflow-y-auto rounded-2xl p-5 ${
            fromList
              ? 'bottom-3 left-3 w-[min(560px,calc(100%-24px))] md:top-1/2 md:bottom-auto md:left-[calc(50%+110px)] md:w-[min(540px,calc(50%-190px))] md:-translate-y-1/2'
              : 'bottom-3 left-3 w-[min(560px,calc(100%-24px))] sm:bottom-5 sm:left-10'
          }`}
          role="dialog"
          aria-label={`${sat.name} thermal band comparison`}
        >
          <header className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className="grid h-6 w-6 place-items-center rounded-full border font-mono text-[11px]"
                  style={{ borderColor: COLORS[sat.sensor], color: COLORS[sat.sensor] }}
                >
                  {sat.number}
                </span>
                <h2 className="text-[19px] font-semibold text-white">{sat.name}</h2>
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[9.5px] tracking-[0.18em]"
                  style={{ background: `${COLORS[sat.sensor]}22`, color: COLORS[sat.sensor] }}
                >
                  {sat.sensor}
                </span>
              </div>
              <p className="mt-1.5 font-mono text-[10.5px] tracking-wide text-white/45">
                {sat.altitudeKm} km · launched {sat.launched} · overpass {sat.overpass} · {sat.product}
              </p>
            </div>
            <button
              onClick={close}
              className="focus-ring -mt-1 -mr-1 grid h-8 w-8 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          <div className="mt-4 flex gap-5">
            <div className="min-w-0 flex-1">
              <div className="mb-2 font-mono text-[9.5px] tracking-[0.22em] text-white/40">
                THERMAL BANDS USED FOR FIRE DETECTION
              </div>
              <table className="w-full font-mono text-[11px]">
                <tbody>
                  {BANDS[sat.sensor].map((b) => (
                    <tr key={b.name} className="border-t border-white/[0.07]">
                      <td className="py-1.5 pr-3 font-medium" style={{ color: COLORS[sat.sensor] }}>
                        {b.name}
                      </td>
                      <td className="py-1.5 pr-3 text-white/85">{b.wavelength}</td>
                      <td className="py-1.5 pr-3 text-white/60">{b.resolution}</td>
                      <td className="hidden py-1.5 font-sans text-[11.5px] text-white/55 sm:table-cell">{b.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[12px] leading-snug text-white/75">
                <span className="text-white">+ </span>
                {SENSOR_SUMMARY[sat.sensor].strength}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-white/50">
                <span>− </span>
                {SENSOR_SUMMARY[sat.sensor].tradeoff}
              </p>
            </div>

            <div className="hidden flex-col items-center gap-2 sm:flex">
              <PixelCompare sensor={sat.sensor} />
              <div className="w-[110px] text-center font-mono text-[9.5px] leading-snug text-white/45">
                <span style={{ color: COLORS.MODIS }}>1 km</span> MODIS pixel ≈ 7 ×{' '}
                <span style={{ color: COLORS.VIIRS }}>375 m</span> VIIRS
              </div>
            </div>
          </div>

          <footer className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3">
            <span className="font-mono text-[9.5px] tracking-wider text-white/35">
              {SENSOR_SUMMARY[sat.sensor].pixel.toUpperCase()}
            </span>
            <button
              onClick={() => track(trackedId === sat.id ? null : sat.id)}
              className="focus-ring rounded-full border px-3.5 py-1.5 font-mono text-[10px] tracking-[0.2em] transition-colors"
              style={{
                borderColor: `${COLORS[sat.sensor]}66`,
                color: COLORS[sat.sensor],
                background: trackedId === sat.id ? `${COLORS[sat.sensor]}1f` : 'transparent',
              }}
            >
              {trackedId === sat.id ? '● TRACKING — RELEASE' : '◎ TRACK IN ORBIT'}
            </button>
          </footer>

          {/* the site's page links and language switch (there is no site header) */}
          <SiteNav />
        </motion.section>
      )}
    </AnimatePresence>
  )
}
