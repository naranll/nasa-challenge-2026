import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HOTSPOTS } from '../data/hotspots'
import { latLonToVec3, damp } from '../utils/geo'
import { makeGlowTexture } from '../utils/textures'
import { sim } from '../store/useAppStore'

const Z = new THREE.Vector3(0, 0, 1)

export default function Hotspots() {
  const glow = useMemo(() => makeGlowTexture(), [])
  const items = useMemo(
    () =>
      HOTSPOTS.map((h, i) => {
        const n = latLonToVec3(h.lat, h.lon, 1)
        return {
          ...h,
          i,
          pos: n.clone().multiplyScalar(1.004),
          quat: new THREE.Quaternion().setFromUnitVectors(Z, n),
          phase: Math.random() * Math.PI * 2,
        }
      }),
    [],
  )
  const cores = useRef<THREE.Sprite[]>([])
  const rings = useRef<THREE.Mesh[]>([])
  const rings2 = useRef<THREE.Mesh[]>([])
  const heat = useRef(HOTSPOTS.map(() => 0))

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    items.forEach((h, i) => {
      // smooth the heat the satellites write into sim.hotspotHeat
      heat.current[i] += (sim.hotspotHeat[i] - heat.current[i]) * damp(6, dt)
      sim.hotspotHeat[i] = Math.max(0, sim.hotspotHeat[i] - dt * 1.5)
      const hot = heat.current[i]

      const flicker = 0.85 + 0.15 * Math.sin(t * 7 + h.phase) * Math.sin(t * 3.1 + h.phase * 2)
      const core = cores.current[i]
      if (core) {
        const s = (0.045 + 0.04 * h.intensity) * (1 + hot * 0.9) * flicker
        core.scale.setScalar(s)
        ;(core.material as THREE.SpriteMaterial).opacity = 0.75 + 0.25 * hot
      }
      const p = ((t * 0.45 + h.phase / (Math.PI * 2)) % 1 + 1) % 1
      const r = rings.current[i]
      if (r) {
        r.scale.setScalar(0.012 + p * (0.05 + hot * 0.05))
        ;(r.material as THREE.MeshBasicMaterial).opacity = (1 - p) * (0.55 + hot * 0.45)
      }
      const r2 = rings2.current[i]
      if (r2) {
        r2.scale.setScalar(0.03 + hot * 0.05)
        ;(r2.material as THREE.MeshBasicMaterial).opacity = hot * 0.9
      }
    })
  })

  return (
    <group>
      {items.map((h, i) => (
        <group key={h.name} position={h.pos} quaternion={h.quat}>
          <sprite ref={(el) => void (el && (cores.current[i] = el))}>
            <spriteMaterial
              map={glow}
              color="#FF7A2A"
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
          <mesh ref={(el) => void (el && (rings.current[i] = el))}>
            <ringGeometry args={[0.8, 1, 48]} />
            <meshBasicMaterial
              color="#FF9A4D"
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* white-hot ring that lights up while a satellite beam is scanning */}
          <mesh ref={(el) => void (el && (rings2.current[i] = el))}>
            <ringGeometry args={[0.9, 1, 48]} />
            <meshBasicMaterial
              color="#FFF1D6"
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
