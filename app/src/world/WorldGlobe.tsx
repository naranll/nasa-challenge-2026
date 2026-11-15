/**
 * Dashboard-ийн World map, нүүр хуудасны 3D дэлхийтэй ижил загвараар (orbital/scene/EarthBody, Starfield):
 * түүхий hotspot-ыг гэрэлтсэн цэгээр (өнгө = хиймэл дагуул), Harmonize горимд H3 hexagon-ыг ramp өнгөөр.
 * Чирж эргүүлнэ, гүйлгэж ойртуулна, цэг дээр заахад tooltip. Тив солиход камер тэр тив рүү нисдэг.
 */
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { WorldContinent } from "../data/contracts";
import type { Sensor } from "../globe/platforms";
import { useI18n } from "../i18n";
import { EarthBody } from "../orbital/scene/Earth";
import Starfield from "../orbital/scene/Starfield";
import { damp, latLonToVec3 } from "../orbital/utils/geo";
import { buildLonLatIndex, continentView, globeCells, globePoints, type GlobeItems } from "./globeData";
import type { WorldLayer } from "./WorldMapSection";
import { CellTip, PointTip } from "./WorldTips";

const MIN_DIST = 1.18;
const MAX_DIST = 6;
/** Цэгүүд газрын гадаргаас бага зэрэг дээр, hexagon-ууд тэдгээрийн доор. */
const POINT_R = 1.004;
const HEX_R = 1.002;
/** Hover-ийн радиус, CSS px. */
const HOVER_PX = 8;
const TIP_GAP = 14;
const TIP_W = 290;
const TIP_H = 140;
const D2R = Math.PI / 180;

interface Props {
  continent: WorldContinent;
  /** null = тивийн файл ачаалж байна: globe үлдэнэ, цэг л байхгүй. */
  layer: WorldLayer | null;
  sensor: Sensor;
  label: string;
  loadingText: string | null;
}

type Hover = { row: number; j: number; x: number; y: number };

export function WorldGlobe({ continent, layer, sensor, label, loadingText }: Props) {
  const { t } = useI18n();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [recentre, setRecentre] = useState(0);

  const items = useMemo<(GlobeItems & { rings?: [number, number][][] }) | null>(() => {
    if (!layer) return null;
    return layer.kind === "points" ? globePoints(layer.file, sensor, continent) : globeCells(layer.file, sensor, layer.max);
  }, [layer, sensor, continent]);
  const index = useMemo(() => (items ? buildLonLatIndex(items.lons, items.lats) : null), [items]);
  useEffect(() => setHover(null), [items]);

  const box = wrapRef.current?.getBoundingClientRect();
  const w = box?.width ?? 0;
  const h = box?.height ?? 0;
  const tipStyle: React.CSSProperties = hover
    ? {
        ...(hover.x > w - TIP_W ? { right: w - hover.x + TIP_GAP } : { left: hover.x + TIP_GAP }),
        ...(hover.y > h - TIP_H ? { bottom: h - hover.y + TIP_GAP } : { top: hover.y + TIP_GAP }),
      }
    : {};

  return (
    <div className="world-globe" ref={wrapRef} role="img" aria-label={label}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3.2], fov: 45, near: 0.005, far: 400 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => setHover(null)}
      >
        <ambientLight intensity={0.55} color="#9fb4ff" />
        <directionalLight position={[-6, 2, 4]} intensity={0.35} color="#4C7BFF" />
        <Suspense fallback={null}>
          <Starfield />
          <EarthBody emissiveIntensity={0.6}>
            {items?.rings && <HexMesh items={items} rings={items.rings} />}
            {items && <GlobeDots items={items} size={layer?.kind === "cells" ? 4.2 : 3.4} />}
            {hover && items && <HoverRing lon={items.lons[hover.j]} lat={items.lats[hover.j]} />}
          </EarthBody>
          <HitSphere
            onHover={(lon, lat, radiusDeg, x, y) => {
              if (!items || !index) return;
              const j = index.nearest(lon, lat, radiusDeg);
              const row = j < 0 ? -1 : items.ids[j];
              setHover((prev) => ((prev?.row ?? -1) === row ? prev : j < 0 ? null : { row, j, x, y }));
            }}
            onLeave={() => setHover(null)}
          />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={MIN_DIST}
          maxDistance={MAX_DIST}
        />
        <FlyTo continent={continent} nonce={recentre} />
        <KeyLight />
      </Canvas>

      {loadingText && (
        <p className="world-globe-loading" aria-busy="true">
          {loadingText}
        </p>
      )}
      <button type="button" className="world-globe-reset" onClick={() => setRecentre((n) => n + 1)}>
        {t("world.globe.reset")}
      </button>
      <p className="world-globe-hint" aria-hidden="true">
        {t("world.globe.hint")}
      </p>
      {hover && layer && (
        <div className="world-map-tip glass-tip" style={tipStyle}>
          {layer.kind === "points" ? (
            <PointTip file={layer.file} row={hover.row} />
          ) : (
            <CellTip cell={layer.file.cells[hover.row]} sensor={sensor} />
          )}
        </div>
      )}
    </div>
  );
}

const dotVert = /* glsl */ `
  attribute vec3 aColor;
  uniform float uSize;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vFacing;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * world;
    vColor = aColor;
    vFacing = dot(normalize(world.xyz), normalize(cameraPosition - world.xyz));
    // Ойртох тусам томорно, гэхдээ хэт томрохгүй.
    gl_PointSize = uSize * uPixelRatio * clamp(2.4 / -mv.z, 0.55, 2.6);
    gl_Position = projectionMatrix * mv;
  }
`;
const dotFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vFacing;
  void main() {
    if (vFacing < 0.0) discard;
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    // Тод цөм + бараан хүрээ: улбар шар газар дээр ч цэг бүр ялгарна.
    float core = 1.0 - smoothstep(0.24, 0.32, d);
    float edge = 1.0 - smoothstep(0.40, 0.5, d);
    vec3 col = mix(vec3(0.04, 0.05, 0.08), vColor * 1.08, core);
    float a = max(core, edge * 0.8) * smoothstep(0.0, 0.18, vFacing);
    gl_FragColor = vec4(col, a);
  }
`;

/** Бүх цэг нэг draw call-д (Африкт 600 мянга гаруй цэг ч хурдан). */
function GlobeDots({ items, size }: { items: GlobeItems; size: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(items.ids.length * 3);
    const v = new THREE.Vector3();
    for (let j = 0; j < items.ids.length; j++) {
      latLonToVec3(items.lats[j], items.lons[j], POINT_R, v);
      pos[j * 3] = v.x;
      pos[j * 3 + 1] = v.y;
      pos[j * 3 + 2] = v.z;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(items.rgb, 3));
    return g;
  }, [items]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dotVert,
        fragmentShader: dotFrag,
        uniforms: { uSize: { value: size }, uPixelRatio: { value: 1 } },
        transparent: true,
        depthWrite: false,
      }),
    [size],
  );
  material.uniforms.uPixelRatio.value = dpr;
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <points geometry={geometry} material={material} raycast={() => null} />;
}

const hexVert = /* glsl */ `
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const hexFrag = /* glsl */ `
  varying vec3 vColor;
  void main() { gl_FragColor = vec4(vColor, 0.85); }
`;

/** Harmonize горимын H3 hexagon-ууд жинхэнэ хэмжээгээрээ (ойртоход харагдана): нүд бүр төвөөсөө triangle fan. */
function HexMesh({ items, rings }: { items: GlobeItems; rings: [number, number][][] }) {
  const geometry = useMemo(() => {
    let tris = 0;
    for (const r of rings) tris += r.length;
    const pos = new Float32Array(tris * 9);
    const col = new Float32Array(tris * 9);
    const c = new THREE.Vector3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    let k = 0;
    rings.forEach((ring, j) => {
      latLonToVec3(items.lats[j], items.lons[j], HEX_R, c);
      for (let m = 0; m < ring.length; m++) {
        const p = ring[m];
        const q = ring[(m + 1) % ring.length];
        latLonToVec3(p[1], p[0], HEX_R, a);
        latLonToVec3(q[1], q[0], HEX_R, b);
        for (const v of [c, a, b]) {
          pos.set([v.x, v.y, v.z], k * 3);
          col.set(items.rgb.subarray(j * 3, j * 3 + 3), k * 3);
          k++;
        }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    return g;
  }, [items, rings]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: hexVert,
        fragmentShader: hexFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <mesh geometry={geometry} material={material} raycast={() => null} />;
}

const Z = new THREE.Vector3(0, 0, 1);

/** Hover хийсэн цэгийг тойрсон, нүүр хуудасны hotspot шиг лугшдаг цагираг. */
function HoverRing({ lon, lat }: { lon: number; lat: number }) {
  const ring = useRef<THREE.Mesh>(null!);
  const { pos, quat } = useMemo(() => {
    const n = latLonToVec3(lat, lon, 1);
    return { pos: n.clone().multiplyScalar(POINT_R + 0.001), quat: new THREE.Quaternion().setFromUnitVectors(Z, n) };
  }, [lat, lon]);
  useFrame(({ clock, camera }) => {
    const p = (clock.elapsedTime * 1.4) % 1;
    const base = Math.max(0.004, (camera.position.length() - 1) * 0.018);
    ring.current.scale.setScalar(base * (1 + p * 0.8));
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.95 - p * 0.6;
  });
  return (
    <mesh ref={ring} position={pos} quaternion={quat} raycast={() => null}>
      <ringGeometry args={[0.72, 1, 48]} />
      <meshBasicMaterial color="#FFF1D6" transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
}

/**
 * Hover-ийн үл үзэгдэх бөмбөрцөг: курсорын доорх lon/lat-ийг олж, HOVER_PX-ийг тэр зайд градус болгоно.
 * Цэгийг ray-cast хийхгүй: lon/lat index нь 600 мянган цэгт ч хурдан.
 */
function HitSphere({
  onHover,
  onLeave,
}: {
  onHover: (lon: number, lat: number, radiusDeg: number, x: number, y: number) => void;
  onLeave: () => void;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const move = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const p = e.point;
    const r = p.length();
    const lat = Math.asin(p.y / r) / D2R;
    const lon = Math.atan2(-p.z, p.x) / D2R;
    // Дэлгэцийн 1 px ≈ (зай × харах өнцөг) / өндөр радиан.
    const dist = camera.position.distanceTo(p);
    const radPerPx = (2 * dist * Math.tan((camera.fov * D2R) / 2)) / size.height;
    onHover(lon, lat, (HOVER_PX * radPerPx) / D2R, e.offsetX, e.offsetY);
  };
  return (
    <mesh onPointerMove={move} onPointerOut={onLeave}>
      <sphereGeometry args={[1.005, 64, 64]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}

const UP = new THREE.Vector3(0, 1, 0);
const _side = new THREE.Vector3();

/**
 * Нүүр хуудасны CameraRig-тэй ижил: гол гэрэл камертай хамт (харагдацын зүүн дээд талаас) хөдөлнө,
 * тиймээс харж буй тал үргэлж гэрэлтэй. Ойртох тусам эргэлт, zoom зөөлөрнө.
 */
function KeyLight() {
  const key = useRef<THREE.DirectionalLight>(null!);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  useFrame(({ camera }) => {
    _side.crossVectors(camera.position, UP).normalize();
    key.current.position.copy(camera.position).normalize().multiplyScalar(6).addScaledVector(_side, 3.5).addScaledVector(UP, 2.5);
    if (controls) {
      const dist = camera.position.length();
      controls.rotateSpeed = THREE.MathUtils.clamp((dist - 1) * 0.35, 0.04, 0.7);
      controls.zoomSpeed = THREE.MathUtils.clamp((dist - 1) * 0.5, 0.15, 0.9);
    }
  });
  return <directionalLight ref={key} intensity={2.4} color="#FFF4E6" />;
}

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();

/** Тив солигдох (эсвэл "Төвд буцаах" дарах) бүрт камерыг тэр тив рүү зөөлөн нисгэнэ. Хэрэглэгч чирвэл зогсоно. */
function FlyTo({ continent, nonce }: { continent: WorldContinent; nonce: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const target = useRef<{ dir: THREE.Vector3; distance: number } | null>(null);

  useEffect(() => {
    const v = continentView(continent.bbox);
    target.current = { dir: latLonToVec3(v.lat, v.lon, 1), distance: v.distance };
  }, [continent, nonce]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => (target.current = null);
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, dt) => {
    const t = target.current;
    if (!t) return;
    const k = damp(3.2, dt);
    _from.copy(camera.position).normalize();
    _to.copy(_from).lerp(t.dir, k).normalize();
    const len = THREE.MathUtils.lerp(camera.position.length(), t.distance, k);
    camera.position.copy(_to).multiplyScalar(len);
    camera.lookAt(0, 0, 0);
    if (_to.angleTo(t.dir) < 0.002 && Math.abs(len - t.distance) < 0.005) target.current = null;
  });
  return null;
}
