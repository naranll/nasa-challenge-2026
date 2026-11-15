import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { COLORS, type SatelliteInfo } from '../data/satellites'
import { HOTSPOTS } from '../data/hotspots'
import { latLonToVec3, orbitPosition, damp } from '../utils/geo'
import { makeGlowTexture, makePanelTexture } from '../utils/textures'
import { sim, useAppStore } from '../store/useAppStore'

const HOTSPOT_LOCAL = HOTSPOTS.map((h) => latLonToVec3(h.lat, h.lon, 1))
const SCAN_COS = Math.cos((12 * Math.PI) / 180)
const DOWN = new THREE.Vector3(0, -1, 0)

const beamVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const beamFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float y = vUv.y;                       // 1 at satellite, 0 at ground
    float body = 0.10 + 0.30 * y;
    float stripes = smoothstep(0.55, 1.0, sin(y * 34.0 + uTime * 5.0)) * 0.35;
    float ground = smoothstep(0.12, 0.0, y) * 0.5;
    gl_FragColor = vec4(uColor, (body + stripes + ground) * uOpacity);
  }
`

/* temp vectors (shared, scene is single-threaded) */
const _q = new THREE.Quaternion()
const _w = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _vel = new THREE.Vector3()
const _x = new THREE.Vector3()
const _y = new THREE.Vector3()
const _z = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _cam = new THREE.Vector3()

export default function Satellite({ info }: { info: SatelliteInfo }) {
  const color = COLORS[info.sensor]
  const group = useRef<THREE.Group>(null!)
  const beam = useRef<THREE.Mesh>(null!)
  const footprint = useRef<THREE.Mesh>(null!)
  const label = useRef<HTMLDivElement>(null)
  const state = useRef({
    angle: (info.orbit.phaseDeg * Math.PI) / 180,
    speedFactor: 1,
    opacity: 1,
    beam: 0,
    target: new THREE.Vector3(),
    hover: 0,
  })

  const setHovered = useAppStore((s) => s.setHovered)
  const setPointer = useAppStore((s) => s.setPointer)
  const track = useAppStore((s) => s.track)
  const select = useAppStore((s) => s.select)

  const mats = useMemo(() => {
    const panelTex = makePanelTexture(color)
    const body = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.55,
      roughness: 0.35,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.22,
      transparent: true,
    })
    const foil = new THREE.MeshStandardMaterial({
      color: '#C9A13B',
      metalness: 0.9,
      roughness: 0.3,
      emissive: '#3a2a08',
      transparent: true,
    })
    const panel = new THREE.MeshStandardMaterial({
      map: panelTex,
      metalness: 0.3,
      roughness: 0.4,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.18,
      transparent: true,
    })
    const dark = new THREE.MeshStandardMaterial({ color: '#202634', metalness: 0.6, roughness: 0.5, transparent: true })
    const halo = new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const beamMat = new THREE.ShaderMaterial({
      vertexShader: beamVert,
      fragmentShader: beamFrag,
      uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 }, uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
    const foot = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
    return { body, foil, panel, dark, halo, beamMat, foot, solid: [body, foil, panel, dark] }
  }, [color])

  // cone with apex at origin pointing down -Y, base at y=-1
  const coneGeo = useMemo(() => new THREE.ConeGeometry(1, 1, 40, 1, true).translate(0, -0.5, 0), [])
  const haloRef = useRef<THREE.Sprite>(null!)

  useFrame(({ clock, camera }, dt) => {
    const s = state.current
    const { filter, hoveredId, trackedId } = useAppStore.getState()
    const isHovered = hoveredId === info.id
    const isTracked = trackedId === info.id
    const active = filter === 'ALL' || filter === info.sensor

    // --- orbital motion (slows down while hovered) ---
    s.speedFactor += ((isHovered ? 0.18 : 1) - s.speedFactor) * damp(5, dt)
    s.angle += info.orbit.speed * s.speedFactor * dt
    const { radius, inclinationDeg, raanDeg } = info.orbit
    const pos = orbitPosition(radius, inclinationDeg, raanDeg, s.angle, group.current.position)
    orbitPosition(radius, inclinationDeg, raanDeg, s.angle + 0.01, _vel).sub(pos).normalize()
    // orientation: +X along velocity, +Y away from Earth (instrument faces nadir), Z = wings
    _y.copy(pos).normalize()
    _x.copy(_vel)
    _z.crossVectors(_x, _y).normalize()
    _x.crossVectors(_y, _z).normalize()
    _m.makeBasis(_x, _y, _z)
    group.current.quaternion.setFromRotationMatrix(_m)
    ;(sim.satPos[info.id] ??= new THREE.Vector3()).copy(pos)

    // --- filter opacity (15% when the other sensor is selected) ---
    s.opacity += ((active ? 1 : 0.15) - s.opacity) * damp(6, dt)
    s.hover += ((isHovered || isTracked ? 1 : 0) - s.hover) * damp(8, dt)
    for (const m of mats.solid) {
      m.opacity = s.opacity
      m.depthWrite = s.opacity > 0.9
    }
    mats.halo.opacity = s.opacity * (0.28 + 0.45 * s.hover)
    haloRef.current.scale.setScalar(0.26 + 0.12 * s.hover)
    group.current.scale.setScalar(1.3 * (1 + 0.15 * s.hover))

    // --- scanning beam toward a hotspot under the ground track ---
    let best = -1
    let bestDot = SCAN_COS
    if (sim.earth) {
      sim.earth.getWorldQuaternion(_q)
      _dir.copy(pos).normalize()
      for (let i = 0; i < HOTSPOT_LOCAL.length; i++) {
        _w.copy(HOTSPOT_LOCAL[i]).applyQuaternion(_q)
        const d = _w.dot(_dir)
        if (d > bestDot) {
          bestDot = d
          best = i
        }
      }
    }
    if (best >= 0 && active) {
      _w.copy(HOTSPOT_LOCAL[best]).applyQuaternion(_q)
      s.target.copy(_w)
      sim.hotspotHeat[best] = 1
    }
    s.beam += ((best >= 0 && active ? 1 : 0) - s.beam) * damp(4, dt)
    const b = beam.current
    b.visible = s.beam > 0.01
    footprint.current.visible = b.visible
    if (b.visible) {
      _w.copy(s.target).sub(pos)
      const len = _w.length()
      b.position.copy(pos)
      b.quaternion.setFromUnitVectors(DOWN, _w.normalize())
      const baseR = info.sensor === 'VIIRS' ? 0.085 : 0.07
      b.scale.set(baseR, len, baseR)
      mats.beamMat.uniforms.uOpacity.value = s.beam * s.opacity
      mats.beamMat.uniforms.uTime.value = clock.elapsedTime
      const f = footprint.current
      f.position.copy(s.target).multiplyScalar(1.003)
      f.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _dir.copy(s.target).normalize())
      const pulse = 1 + 0.15 * Math.sin(clock.elapsedTime * 6)
      f.scale.setScalar(baseR * pulse)
      mats.foot.opacity = 0.55 * s.beam * s.opacity
    }

    // --- label: hide when the satellite is behind the Earth ---
    if (label.current) {
      _cam.copy(camera.position)
      _w.copy(pos).sub(_cam)
      const len = _w.length()
      _w.divideScalar(len)
      const bq = _cam.dot(_w)
      const disc = bq * bq - (_cam.lengthSq() - 1)
      let hidden = false
      if (disc > 0) {
        const tHit = -bq - Math.sqrt(disc)
        hidden = tHit > 0 && tHit < len
      }
      label.current.style.opacity = String(hidden ? 0 : Math.max(0.2, s.opacity) * (0.75 + 0.25 * s.hover))
    }
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setPointer(e.nativeEvent.clientX, e.nativeEvent.clientY)
    setHovered(info.id, true)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    if (useAppStore.getState().hoveredId === info.id) setHovered(null)
    document.body.style.cursor = ''
  }
  const onMove = (e: ThreeEvent<PointerEvent>) => setPointer(e.nativeEvent.clientX, e.nativeEvent.clientY)
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    // the satellite flies out from under the cursor while tracking, so clear the hover now
    setHovered(null)
    select(info.id)
    track(info.id)
  }

  const isModis = info.sensor === 'MODIS'

  return (
    <>
      <group ref={group}>
        {/* generous invisible hit-area so small models are easy to hover */}
        <mesh onPointerOver={onOver} onPointerOut={onOut} onPointerMove={onMove} onClick={onClick}>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <sprite ref={haloRef} material={mats.halo} />

        {isModis ? (
          // EOS-style bus (Terra / Aqua): tall box, gold foil, one long solar wing + antenna boom
          <group scale={0.9}>
            <mesh material={mats.body}>
              <boxGeometry args={[0.08, 0.075, 0.06]} />
            </mesh>
            <mesh material={mats.foil} position={[0, -0.045, 0]}>
              <boxGeometry args={[0.06, 0.018, 0.05]} />
            </mesh>
            <mesh material={mats.dark} position={[0, 0, 0.042]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.03, 6]} />
            </mesh>
            <mesh material={mats.panel} position={[0, 0, 0.17]}>
              <boxGeometry args={[0.075, 0.004, 0.25]} />
            </mesh>
            {/* high-gain antenna */}
            <mesh material={mats.dark} position={[0.0, 0.0, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.003, 0.003, 0.05, 6]} />
            </mesh>
            <mesh material={mats.body} position={[0, 0.0, -0.09]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.025, 0.012, 16, 1, true]} />
            </mesh>
          </group>
        ) : (
          // JPSS-style bus (Suomi NPP / NOAA-20 / NOAA-21): compact body, twin wings
          <group scale={0.9}>
            <mesh material={mats.body}>
              <boxGeometry args={[0.07, 0.055, 0.055]} />
            </mesh>
            <mesh material={mats.foil} position={[0.0, -0.038, 0]}>
              <boxGeometry args={[0.045, 0.02, 0.04]} />
            </mesh>
            {/* VIIRS rotating telescope (nadir) */}
            <mesh material={mats.dark} position={[0.02, -0.052, 0]}>
              <cylinderGeometry args={[0.009, 0.009, 0.012, 12]} />
            </mesh>
            {[1, -1].map((side) => (
              <group key={side}>
                <mesh material={mats.dark} position={[0, 0, side * 0.04]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.003, 0.003, 0.025, 6]} />
                </mesh>
                <mesh material={mats.panel} position={[0, 0, side * 0.12]}>
                  <boxGeometry args={[0.055, 0.004, 0.15]} />
                </mesh>
              </group>
            ))}
          </group>
        )}

        <Html position={[0, 0.15, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div ref={label} className="sat-label" style={{ color }}>
            <span className="sat-label-num">{info.number}</span>
            {info.name}
          </div>
        </Html>
      </group>

      <mesh ref={beam} geometry={coneGeo} material={mats.beamMat} visible={false} renderOrder={2} />
      <mesh ref={footprint} material={mats.foot} visible={false}>
        <ringGeometry args={[0.55, 1, 48]} />
      </mesh>
    </>
  )
}
