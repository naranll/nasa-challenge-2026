import * as THREE from 'three'

const D2R = Math.PI / 180

/**
 * Lat/lon → unit vector, matching three.js SphereGeometry UVs with an
 * equirectangular texture (lon -180 at u=0, lon 0 at +X, lon 90E at -Z).
 */
export function latLonToVec3(lat: number, lon: number, r = 1, out = new THREE.Vector3()) {
  const la = lat * D2R
  const lo = lon * D2R
  return out.set(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo))
}

/** Position on a circular orbit. angle = argument of latitude (rad). */
export function orbitPosition(
  radius: number,
  inclinationDeg: number,
  raanDeg: number,
  angle: number,
  out = new THREE.Vector3(),
) {
  const i = inclinationDeg * D2R
  const O = raanDeg * D2R
  // in-plane
  const x0 = Math.cos(angle) * radius
  const z0 = Math.sin(angle) * radius
  // tilt about X axis by inclination (equatorial plane is XZ, pole is +Y)
  const y1 = z0 * Math.sin(i)
  const z1 = z0 * Math.cos(i)
  // rotate about Y by RAAN
  const x2 = x0 * Math.cos(O) + z1 * Math.sin(O)
  const z2 = -x0 * Math.sin(O) + z1 * Math.cos(O)
  return out.set(x2, y1, z2)
}

export function orbitPoints(radius: number, inc: number, raan: number, segments = 256) {
  const pts: THREE.Vector3[] = []
  for (let k = 0; k <= segments; k++) pts.push(orbitPosition(radius, inc, raan, (k / segments) * Math.PI * 2))
  return pts
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
/** frame-rate independent damping factor */
export const damp = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt)
