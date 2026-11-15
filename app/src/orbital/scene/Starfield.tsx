import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { makeGlowTexture } from '../utils/textures'

/** Procedural stars + slow-drifting nebula dust. */
export default function Starfield() {
  const dust = useRef<THREE.Group>(null!)
  const tex = useMemo(() => makeGlowTexture('rgba(255,255,255,0.9)', 256), [])
  const clouds = useMemo(() => {
    const palette = ['#3A2A6B', '#1F5368', '#6B2E1A', '#22305E', '#4A2350']
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: 10 }, (_, i) => { // big additive sprites: overdraw, keep few
      const theta = rnd() * Math.PI * 2
      const phi = Math.acos(2 * rnd() - 1)
      const r = 38 + rnd() * 10
      return {
        pos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi) * 0.6,
          r * Math.sin(phi) * Math.sin(theta),
        ),
        scale: 14 + rnd() * 22,
        color: palette[i % palette.length],
        opacity: 0.1 + rnd() * 0.14,
      }
    })
  }, [])

  useFrame((_, dt) => {
    dust.current.rotation.y += dt * 0.004
    dust.current.rotation.x += dt * 0.0012
  })

  return (
    <>
      {/* speed 0: stars hold still, so the only things that flicker are real fires (FirePoints) */}
      <Stars radius={70} depth={50} count={2500} factor={3.2} saturation={0} fade speed={0} />
      <group ref={dust}>
        {clouds.map((c, i) => (
          <sprite key={i} position={c.pos} scale={c.scale}>
            <spriteMaterial
              map={tex}
              color={c.color}
              transparent
              opacity={c.opacity}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        ))}
      </group>
    </>
  )
}
