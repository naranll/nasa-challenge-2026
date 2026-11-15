import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { MIN_DIST, sim, useAppStore } from '../store/useAppStore'
import { clamp, damp, latLonToVec3 } from '../utils/geo'
import { HOTSPOTS } from '../data/hotspots'

const ORIGIN = new THREE.Vector3()
const _desired = new THREE.Vector3()
const _side = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)
const _q = new THREE.Quaternion()
const _dir = new THREE.Vector3()
const _h = new THREE.Vector3()
const _best = new THREE.Vector3()
const HOTSPOT_LOCAL = HOTSPOTS.map((h) => latLonToVec3(h.lat, h.lon, 1))

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

  useEffect(() => {
    if (!controls) return
    const onStart = () => {
      sim.userInteracting = true
      sim.zoomTarget = null
      if (useAppStore.getState().trackedId) useAppStore.getState().track(null)
    }
    const onEnd = () => (sim.userInteracting = false)
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controls])

  useFrame((_, dt) => {
    if (!controls) return
    const { trackedId } = useAppStore.getState()
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
        // diving toward the surface: swing the view over the nearest fire hotspot
        if (sim.zoomTarget < 1.5 && sim.earth) {
          sim.earth.getWorldQuaternion(_q)
          _dir.copy(camera.position).normalize()
          let best = -2
          for (const h of HOTSPOT_LOCAL) {
            _h.copy(h).applyQuaternion(_q)
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
        if (sim.zoomTarget < 1.5) aligned = _dir.dot(_best) > 0.9995
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
  })

  return <directionalLight ref={key} intensity={2.4} color="#FFF4E6" />
}
