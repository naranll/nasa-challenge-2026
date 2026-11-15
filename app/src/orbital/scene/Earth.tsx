import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { makeEarthTextures } from '../utils/textures'
import { sim } from '../store/useAppStore'
import Hotspots from './Hotspots'

const atmosphereVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const atmosphereFrag = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uPower;
  uniform float uStrength;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(1.0 - abs(dot(vNormal, vView)), uPower);
    vec3 col = mix(uColorA, uColorB, f);
    gl_FragColor = vec4(col, f * uStrength);
  }
`

export default function Earth() {
  const spin = useRef<THREE.Group>(null!)
  const gl = useThree((s) => s.gl)
  const { map, emissive } = useMemo(() => makeEarthTextures(gl.capabilities.getMaxAnisotropy()), [gl])

  const rimMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVert,
        fragmentShader: atmosphereFrag,
        uniforms: {
          uColorA: { value: new THREE.Color('#2B8CBE') },
          uColorB: { value: new THREE.Color('#9FE3FF') },
          uPower: { value: 3.2 },
          uStrength: { value: 0.75 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
      }),
    [],
  )
  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVert,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            float f = pow(max(0.0, 0.72 - abs(dot(vNormal, vView))), 2.4);
            gl_FragColor = vec4(uColor, f * 0.9);
          }
        `,
        uniforms: { uColor: { value: new THREE.Color('#3FA6D9') } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    [],
  )

  useFrame((_, dt) => {
    spin.current.rotation.y += dt * 0.035
    sim.earth = spin.current
  })

  return (
    // axial tilt
    <group rotation={[0, 0, (23.4 * Math.PI) / 180]}>
      <group ref={spin} rotation={[0, -1.2, 0]}>
        <mesh>
          <sphereGeometry args={[1, 128, 128]} />
          <meshStandardMaterial
            map={map}
            emissiveMap={emissive}
            emissive="#FF7A33"
            emissiveIntensity={0.75}
            roughness={0.82}
            metalness={0.05}
          />
        </mesh>
        <Hotspots />
      </group>
      {/* thin rim light + soft outer halo */}
      <mesh scale={1.004} material={rimMat}>
        <sphereGeometry args={[1, 96, 96]} />
      </mesh>
      <mesh scale={1.075} material={haloMat}>
        <sphereGeometry args={[1, 96, 96]} />
      </mesh>
    </group>
  )
}
