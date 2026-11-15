import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { MIN_DIST, sim, useAppStore } from '../store/useAppStore'
import { clamp, damp } from '../utils/geo'

const ORIGIN = new THREE.Vector3()
const _desired = new THREE.Vector3()
const _side = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)
const _q = new THREE.Quaternion()
const _dir = new THREE.Vector3()
const _h = new THREE.Vector3()
const _best = new THREE.Vector3()
const _local = new THREE.Vector3()

/**
 * Where the opened satellite sits on screen, as a fraction of the canvas: top right, clear of the
 * altitude bar, while its drawer is bottom left (ui/CompareDrawer.tsx), so the two never cover each other.
 */
const FOCUS_AT_WIDE = { x: 0.64, y: 0.3 }
const FOCUS_AT_NARROW = { x: 0.6, y: 0.22 } // phones: the drawer is a full-width bottom sheet
const NARROW_PX = 640

/**
 * Drives the camera on top of OrbitControls:
 *  - follows a tracked satellite
 *  - applies zoom requests from the altitude bar
 *  - publishes the camera distance for the altitude bar
 */
export default function CameraRig() {
  const camera = useThree((s) => s.camera)
  const key = useRef<THREE.DirectionalLight>(null!)
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null
  const size = useThree((s) => s.size)
  const offset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!controls) return
    const onStart = () => {
      sim.userInteracting = true
      sim.zoomTarget = null
      if (useAppStore.getState().trackedId) useAppStore.getState().track(null)
    }
    const onEnd = () => {
      sim.userInteracting = false
      sim.fastUntil = performance.now() + 1200 // let the damping settle at full rate
    }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controls])

  useFrame((_, dt) => {
    if (!controls) return
    const { trackedId, selectedId, fires } = useAppStore.getState()
    const sp = trackedId ? sim.satPos[trackedId] : undefined
    // minDistance is measured to controls.target, which is the satellite while tracking
    controls.minDistance = sp ? 0.25 : MIN_DIST

    if (sp) {
      // sit just outside & beside the satellite, looking at it with Earth behind
      _side.crossVectors(sp, UP).normalize()
      _desired
        .copy(sp)
        .multiplyScalar(1 + 1.35 / sp.length())
        .addScaledVector(_side, 0.75)
        .addScaledVector(UP, 0.2)
      camera.position.lerp(_desired, damp(3, dt))
      controls.target.lerp(sp, damp(5, dt))
    } else {
      controls.target.lerp(ORIGIN, damp(3, dt))
      if (sim.zoomTarget !== null) {
        // diving toward the surface: swing the view over the nearest real fire (data/fires.ts)
        const swing = sim.zoomTarget < 1.5 && sim.earth && fires && fires.n > 0
        if (swing) {
          sim.earth!.getWorldQuaternion(_q)
          _dir.copy(camera.position).normalize()
          let best = -2
          for (let i = 0; i < fires.n; i++) {
            _h.copy(_local.fromArray(fires.pos, i * 3)).applyQuaternion(_q)
            const d = _h.dot(_dir)
            if (d > best) {
              best = d
              _best.copy(_h)
            }
          }
          const len = camera.position.length()
          _dir.lerp(_best, damp(1.6, dt)).normalize()
          camera.position.copy(_dir).multiplyScalar(len)
        }
        let aligned = true
        if (swing) aligned = _dir.dot(_best) > 0.9995
        const d = camera.position.length()
        const nd = d + (sim.zoomTarget - d) * damp(7, dt)
        camera.position.setLength(nd)
        if (Math.abs(nd - sim.zoomTarget) < 0.0015 && aligned) sim.zoomTarget = null
      }
    }

    const dist = camera.position.length()
    sim.camDist = dist
    // key light rides with the camera (upper-left of the view) — stylised, always-lit hemisphere
    _side.crossVectors(camera.position, UP).normalize()
    key.current.position.copy(camera.position).normalize().multiplyScalar(6).addScaledVector(_side, 3.5).addScaledVector(UP, 2.5)
    // gentler rotation when skimming the surface
    controls.rotateSpeed = clamp((dist - 1) * 0.35, 0.04, 0.7)
    controls.zoomSpeed = clamp((dist - 1) * 0.5, 0.15, 0.9)
    controls.update()

    // Opened + tracked satellite: slide the view centre (where the satellite is) to the top right.
    // A camera view offset, not a CSS move: the stars stay whole and hover picking stays exact.
    const cam = camera as THREE.PerspectiveCamera
    const { width: w, height: h } = size
    const spot = w < NARROW_PX ? FOCUS_AT_NARROW : FOCUS_AT_WIDE
    const on = sp && selectedId === trackedId
    const tx = on ? (spot.x - 0.5) * w : 0
    const ty = on ? (spot.y - 0.5) * h : 0
    const o = offset.current
    const k = damp(3.2, dt)
    o.x += (tx - o.x) * k
    o.y += (ty - o.y) * k
    if (Math.hypot(tx - o.x, ty - o.y) < 0.5) [o.x, o.y] = [tx, ty]
    if (o.x === 0 && o.y === 0) {
      if (cam.view?.enabled) cam.clearViewOffset()
    } else {
      cam.setViewOffset(w, h, -o.x, -o.y, w, h) // every frame: also keeps it right after a resize
      if (o.x !== tx || o.y !== ty) sim.fastUntil = Math.max(sim.fastUntil, performance.now() + 100)
    }
  })

  return <directionalLight ref={key} intensity={2.4} color="#FFF4E6" />
}
