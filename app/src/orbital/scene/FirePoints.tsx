/**
 * Real fires (data/fires.ts) as one point cloud in the Earth's spinning frame. The data period is replayed
 * in a loop: a fire flashes at the moment FIRMS detected it, then fades to a dim ember, so where and when the
 * dots light up is the data, not chance. Fires under a satellite's beam light up too.
 * One draw call and one shader, whatever the number of fires.
 */
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SATELLITES } from '../data/satellites'
import { sim, useAppStore } from '../store/useAppStore'

/** Real seconds one pass over the whole period takes. */
export const REPLAY_LOOP_S = 60
/** How long (data time) a fresh detection glows: ~1.5 s on screen. */
const FLASH_DATA_HOURS = 6
const SURFACE = 1.004
const N_SAT = SATELLITES.length

const vert = /* glsl */ `
  attribute float aT;
  attribute float aFrp;
  uniform float uTime;
  uniform float uPeriod;
  uniform float uTau;
  uniform float uPx;
  uniform vec3 uScan[${N_SAT}];
  uniform float uScanOn[${N_SAT}];
  varying float vGlow;
  varying float vHot;
  void main() {
    float age = mod(uTime - aT + uPeriod, uPeriod);
    float flash = exp(-age / uTau);
    vec3 n = normalize(position);
    float scan = 0.0;
    for (int i = 0; i < ${N_SAT}; i++) {
      scan = max(scan, uScanOn[i] * smoothstep(0.04, 0.0, distance(n, uScan[i])));
    }
    float strength = clamp(log(1.0 + aFrp) / 5.0, 0.2, 1.0);  // FRP 1 MW → 0.2, ~150 MW → 1
    vHot = max(flash, 0.8 * scan);
    vGlow = 0.22 + 0.78 * vHot;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float near = clamp(3.5 / -mv.z, 0.7, 4.0);  // bigger as the camera dives in
    gl_PointSize = uPx * (2.2 + 8.0 * vHot) * (0.6 + 0.6 * strength) * near;
    gl_Position = projectionMatrix * mv;
  }
`
const frag = /* glsl */ `
  varying float vGlow;
  varying float vHot;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(vec3(0.95, 0.33, 0.07), vec3(1.0, 0.9, 0.62), vHot);
    gl_FragColor = vec4(col, a * vGlow);
  }
`

export default function FirePoints() {
  const fires = useAppStore((s) => s.fires)
  const dpr = useThree((s) => s.viewport.dpr)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uTime: { value: 0 },
          uPeriod: { value: 1 },
          uTau: { value: FLASH_DATA_HOURS * 3600 },
          uPx: { value: 1 },
          uScan: { value: SATELLITES.map(() => new THREE.Vector3()) },
          uScanOn: { value: SATELLITES.map(() => 0) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    if (!fires) return g
    const pos = fires.pos.map((v) => v * SURFACE)
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aT', new THREE.BufferAttribute(fires.t, 1))
    g.setAttribute('aFrp', new THREE.BufferAttribute(fires.frp, 1))
    return g
  }, [fires])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame(({ clock }) => {
    if (!fires) return
    const u = material.uniforms
    sim.fireT = ((clock.elapsedTime * fires.periodS) / REPLAY_LOOP_S) % fires.periodS
    u.uTime.value = sim.fireT
    u.uPeriod.value = fires.periodS
    u.uPx.value = dpr
    SATELLITES.forEach((s, i) => {
      const at = sim.scan[s.id]
      u.uScanOn.value[i] = at ? 1 : 0
      if (at) u.uScan.value[i].copy(at)
    })
  })

  if (!fires || fires.n === 0) return null
  return <points geometry={geometry} material={material} frustumCulled={false} />
}
