import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import type { Line2, LineMaterial } from 'three-stdlib'
import { COLORS, type SatelliteInfo } from '../data/satellites'
import { orbitPoints, damp } from '../utils/geo'
import { useAppStore } from '../store/useAppStore'

export default function OrbitPath({ info }: { info: SatelliteInfo }) {
  const pts = useMemo(
    () => orbitPoints(info.orbit.radius, info.orbit.inclinationDeg, info.orbit.raanDeg),
    [info],
  )
  const core = useRef<Line2>(null!)
  const glow = useRef<Line2>(null!)
  const o = useRef(0.4)

  useFrame((_, dt) => {
    const { filter, hoveredId, trackedId } = useAppStore.getState()
    const focus = hoveredId === info.id || trackedId === info.id
    let target = filter === 'ALL' ? 0.38 : filter === info.sensor ? 0.85 : 0.06
    if (focus) target = 1
    o.current += (target - o.current) * damp(6, dt)
    ;(core.current.material as LineMaterial).opacity = o.current
    ;(glow.current.material as LineMaterial).opacity = o.current * 0.16
  })

  const color = COLORS[info.sensor]
  return (
    <group>
      <Line ref={glow} points={pts} color={color} lineWidth={6} transparent depthWrite={false} />
      <Line ref={core} points={pts} color={color} lineWidth={1.3} transparent depthWrite={false} />
    </group>
  )
}
