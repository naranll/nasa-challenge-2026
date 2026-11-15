import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useEffect } from 'react'
import Starfield from './Starfield'
import Earth from './Earth'
import Satellite from './Satellite'
import OrbitPath from './OrbitPath'
import CameraRig from './CameraRig'
import { SATELLITES } from '../data/satellites'
import { MAX_DIST, MIN_DIST, sim, useAppStore } from '../store/useAppStore'

const IDLE_FRAME_MS = 1000 / 30

/**
 * The canvas renders on demand; this asks for a frame at 30 fps while the scene just drifts, and at the
 * display rate while the camera moves (drag, zoom, focus), so motion stays smooth but idle cost halves.
 */
function FrameLimiter() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const fast = sim.userInteracting || sim.zoomTarget !== null || now < sim.fastUntil
      if (fast || now - last >= IDLE_FRAME_MS - 2) {
        last = now
        invalidate()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [invalidate])
  return null
}

export default function Scene() {
  const setHovered = useAppStore((s) => s.setHovered)
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.5]}
      frameloop="demand"
      camera={{ position: [0.9, 1.9, 5.0], fov: 45, near: 0.005, far: 400 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onPointerMissed={() => setHovered(null)}
    >
      <ambientLight intensity={0.4} color="#9fb4ff" />
      <directionalLight position={[-6, -1, -3]} intensity={0.35} color="#4C7BFF" />
      <Suspense fallback={null}>
        <Starfield />
        <Earth />
        {SATELLITES.map((s) => (
          <OrbitPath key={`o-${s.id}`} info={s} />
        ))}
        {SATELLITES.map((s) => (
          <Satellite key={s.id} info={s} />
        ))}
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={MIN_DIST}
        maxDistance={MAX_DIST}
      />
      <CameraRig />
      <FrameLimiter />
    </Canvas>
  )
}
