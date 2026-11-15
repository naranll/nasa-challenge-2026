import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import Starfield from './Starfield'
import Earth from './Earth'
import Satellite from './Satellite'
import OrbitPath from './OrbitPath'
import CameraRig from './CameraRig'
import { SATELLITES } from '../data/satellites'
import { MAX_DIST, MIN_DIST, useAppStore } from '../store/useAppStore'

export default function Scene() {
  const setHovered = useAppStore((s) => s.setHovered)
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0.9, 1.9, 5.0], fov: 45, near: 0.005, far: 400 }}
      gl={{ antialias: true, alpha: true }}
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
    </Canvas>
  )
}
