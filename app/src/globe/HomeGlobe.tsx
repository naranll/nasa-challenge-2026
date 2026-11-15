/**
 * The 3D globe (spec §3–§5). Loaded as its own chunk with React.lazy; only HomeGlobeSection imports it.
 * React renders once; markers, links and tracks move by writing three.js positions every frame (A26).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Points,
  PointsMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { useI18n } from "../i18n";
import earthUrl from "./assets/earth-day.jpg";
import { useElementSize, type SimClock } from "./env";
import { EARTH_RADIUS_KM, MONGOLIA_CENTER } from "./geo";
import { groundTrack, periodMinutes, positionAt } from "./orbit";
import { PLATFORM_DASH, platformsOf, SENSOR_COLOR, SENSORS, type PlatformId } from "./platforms";
import type { Orbit } from "./useHomeData";

export type GlobeMode = "webgl" | "webgl-reduced" | "static";
export type FallbackReason = "no-webgl" | "context-lost" | "low-fps" | "data-error" | "chunk-error";

export interface HomeGlobeProps {
  orbits: Orbit[];
  clock: SimClock;
  autoRotate: boolean;
  coarsePointer: boolean;
  highlighted: PlatformId | null;
  onHover: (id: PlatformId | null) => void;
  /** null = tap/click on empty space. */
  onSelect: (id: PlatformId | null) => void;
  onReady?: (info: { mode: GlobeMode; firstFrameMs: number; platformsVisible: number }) => void;
  onFallback: (reason: FallbackReason) => void;
}

// Look and feel. Camera and timing parameters, not data.
const ROTATION_SECONDS = 120; // A11: one turn in ~2 min
const RESUME_AFTER_MS = 4000; // A11
const OPENCONTROLS_SPEED_PER_TURN = 60; // OrbitControls: speed 1 = one turn per 60 s at 60 fps
const START_ALTITUDE = 2.2; // camera distance in globe radii
const MIN_DISTANCE_FACTOR = 1.35; // A12 zoom limits, × globe radius
const MAX_DISTANCE_FACTOR = 6;
const TRACK_POINTS = 180; // A25
const TRACK_POINTS_REDUCED = 90; // §9.3 adaptive step 3
const HIT_RADIUS_PX = 22; // A29: 44 × 44 px target
const CLICK_SLOP_PX = 6;
const FPS_WINDOW_MS = 5000; // §9.3
const FPS_REDUCE_BELOW = 24;
const FPS_GIVE_UP_BELOW = 15;
const CONTEXT_RESTORE_WAIT_MS = 3000;
const STAR_COUNT = 1500;

interface Live {
  marker: Mesh;
  track: Line;
  trackAt: number;
  pos: Vector3 | null;
  geo: { lat: number; lng: number; alt: number } | null;
}

/** Seeded so the star field looks the same on every load. Decoration, not data. */
function starField(radius: number): Points {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const xyz = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const u = rnd() * 2 - 1;
    const a = rnd() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    xyz.set([radius * s * Math.cos(a), radius * u, radius * s * Math.sin(a)], i * 3);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(xyz, 3));
  return new Points(g, new PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.75 }));
}

export default function HomeGlobe(props: HomeGlobeProps) {
  const { orbits, clock, autoRotate, coarsePointer, highlighted, onHover, onSelect, onReady, onFallback } = props;
  const { t } = useI18n();
  const wrap = useRef<HTMLDivElement>(null);
  const globe = useRef<GlobeMethods | undefined>(undefined);
  const { width, height } = useElementSize(wrap);
  const [ready, setReady] = useState(false);
  const [atmosphere, setAtmosphere] = useState(!coarsePointer);
  const [fps, setFps] = useState<number | null>(null);
  const showFps = typeof location !== "undefined" && location.href.includes("debug=fps");

  // Latest props for the frame loop, without re-running effects.
  const latest = useRef({ highlighted, autoRotate, onHover, onSelect, onReady, onFallback });
  latest.current = { highlighted, autoRotate, onHover, onSelect, onReady, onFallback };

  const material = useMemo(() => new MeshPhongMaterial(), []);

  useEffect(() => {
    const g = globe.current;
    const el = wrap.current;
    if (!ready || !g || !el) return;
    const renderer = g.renderer();
    const controls = g.controls();
    const radius = new Vector3(...Object.values(g.getCoords(0, 0, 0))).length();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.5 : 2));
    controls.autoRotateSpeed = OPENCONTROLS_SPEED_PER_TURN / ROTATION_SECONDS;
    controls.autoRotate = latest.current.autoRotate;
    controls.minDistance = radius * MIN_DISTANCE_FACTOR;
    controls.maxDistance = radius * MAX_DISTANCE_FACTOR;
    controls.enableZoom = coarsePointer; // A13: mouse wheel zooms only after the globe is clicked
    // On a tall phone screen, back the camera off so the whole Earth fits the width.
    const tall = Math.max(1, el.clientHeight / Math.max(el.clientWidth, 1));
    g.pointOfView({ ...MONGOLIA_CENTER, altitude: (START_ALTITUDE + 1) * tall - 1 }, 0);

    // Scene objects: stars, one marker + dashed track per platform, one link line per sensor.
    const group = new Group();
    group.add(starField(radius * 30));
    const live = new Map<PlatformId, Live>();
    for (const o of orbits) {
      if (!o.satrec) continue;
      const color = SENSOR_COLOR[o.sensor];
      const marker = new Mesh(new SphereGeometry(radius * 0.022, 16, 12), new MeshBasicMaterial({ color }));
      const [dash, gap] = PLATFORM_DASH[o.id];
      const track = new Line(
        new BufferGeometry(),
        new LineDashedMaterial({ color, dashSize: (dash * radius) / 100, gapSize: (gap * radius) / 100, transparent: true, opacity: 0.45 }),
      );
      group.add(marker, track);
      live.set(o.id, { marker, track, trackAt: -Infinity, pos: null, geo: null });
    }
    const links = SENSORS.map((sensor) => {
      const ids = platformsOf(sensor).filter((id) => live.has(id));
      const line = new Line(
        new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(ids.length * 3), 3)),
        new LineBasicMaterial({ color: SENSOR_COLOR[sensor], transparent: true, opacity: 0.5 }),
      );
      group.add(line);
      return { ids, line };
    });
    g.scene().add(group);

    let trackPoints = TRACK_POINTS;
    const toVec = (lat: number, lng: number, alt: number) => new Vector3(...Object.values(g.getCoords(lat, lng, alt)));
    const updateTrack = (o: Orbit, l: Live, now: Date) => {
      const pts = groundTrack(o.satrec!, now, trackPoints).map((p) => toVec(p.lat, p.lng, p.altKm / EARTH_RADIUS_KM));
      l.track.geometry.dispose();
      l.track.geometry = new BufferGeometry().setFromPoints(pts);
      l.track.computeLineDistances();
      l.trackAt = now.getTime();
    };

    // Frame loop.
    let raf = 0;
    let running = true;
    let reported = false;
    let frames: number[] = [];
    let windowStart = performance.now();
    let last = windowStart;
    let quality = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      const now = clock.now();
      const hi = latest.current.highlighted;
      for (const o of orbits) {
        const l = live.get(o.id);
        if (!l) continue;
        const p = positionAt(o.satrec!, now);
        l.marker.visible = Boolean(p);
        l.geo = p ? { lat: p.lat, lng: p.lng, alt: p.altKm / EARTH_RADIUS_KM } : null;
        l.pos = l.geo ? toVec(l.geo.lat, l.geo.lng, l.geo.alt) : null;
        if (l.pos) l.marker.position.copy(l.pos);
        // A25: redraw the track every ¼ orbit of simulated time.
        if (now.getTime() - l.trackAt > (periodMinutes(o.satrec!) * 60_000) / 4) updateTrack(o, l, now);
        const m = l.track.material as LineDashedMaterial;
        m.opacity = hi === null ? 0.45 : hi === o.id ? 0.95 : 0.12; // A16
        l.marker.scale.setScalar(hi === o.id ? 1.8 : 1);
      }
      for (const { ids, line } of links) {
        const attr = line.geometry.getAttribute("position") as BufferAttribute;
        const pts = ids.map((id) => live.get(id)!.pos);
        line.visible = pts.length > 1 && pts.every(Boolean);
        pts.forEach((p, i) => p && attr.setXYZ(i, p.x, p.y, p.z));
        attr.needsUpdate = true;
      }

      const tNow = performance.now();
      if (!reported) {
        reported = true;
        latest.current.onReady?.({ mode: "webgl", firstFrameMs: tNow, platformsVisible: [...live.values()].filter((l) => l.pos).length });
      }
      frames.push(tNow - last);
      last = tNow;
      if (tNow - windowStart > FPS_WINDOW_MS) {
        const sorted = [...frames].sort((a, b) => a - b);
        const median = 1000 / sorted[Math.floor(sorted.length / 2)];
        if (showFps) setFps(Math.round(median));
        if (median < FPS_GIVE_UP_BELOW && quality > 0) latest.current.onFallback("low-fps");
        else if (median < FPS_REDUCE_BELOW && quality === 0) {
          quality = 1; // §9.3: atmosphere off, DPR 1, fewer track points
          setAtmosphere(false);
          renderer.setPixelRatio(1);
          trackPoints = TRACK_POINTS_REDUCED;
        }
        frames = [];
        windowStart = tNow;
      }
    };
    raf = requestAnimationFrame(frame);

    // Pause when hidden or scrolled away (§9.3).
    let visible = true;
    const sync = () => {
      const on = visible && document.visibilityState === "visible";
      if (on === running) return;
      running = on;
      if (on) {
        last = performance.now();
        windowStart = last;
        frames = [];
        g.resumeAnimation();
      } else g.pauseAnimation();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);

    // Auto-rotate stops while the user drags and resumes after 4 s (A11).
    let resume: ReturnType<typeof setTimeout> | undefined;
    const onStart = () => {
      clearTimeout(resume);
      controls.autoRotate = false;
    };
    const onEnd = () => {
      clearTimeout(resume);
      resume = setTimeout(() => (controls.autoRotate = latest.current.autoRotate && latest.current.highlighted === null), RESUME_AFTER_MS);
    };
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);

    // Picking: nearest visible marker within the hit radius (A29).
    const cam = g.camera();
    const pick = (clientX: number, clientY: number): PlatformId | null => {
      const box = el.getBoundingClientRect();
      let best: PlatformId | null = null;
      let bestD = HIT_RADIUS_PX;
      for (const [id, l] of live) {
        if (!l.pos || !l.geo || l.pos.dot(cam.position) < radius * radius) continue; // behind the Earth
        const s = g.getScreenCoords(l.geo.lat, l.geo.lng, l.geo.alt);
        const d = Math.hypot(s.x - (clientX - box.left), s.y - (clientY - box.top));
        if (d < bestD) [best, bestD] = [id, d];
      }
      return best;
    };
    let down: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !down) latest.current.onHover(pick(e.clientX, e.clientY));
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
      controls.enableZoom = true;
    };
    const onUp = (e: PointerEvent) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < CLICK_SLOP_PX) latest.current.onSelect(pick(e.clientX, e.clientY));
      down = null;
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      controls.enableZoom = false;
      latest.current.onHover(null);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onLeave);

    // WebGL context loss: wait once for a restore, then give up to the static picture (§11.2).
    const canvas = renderer.domElement;
    let restore: ReturnType<typeof setTimeout> | undefined;
    const onLost = (e: Event) => {
      e.preventDefault();
      restore = setTimeout(() => latest.current.onFallback("context-lost"), CONTEXT_RESTORE_WAIT_MS);
    };
    const onRestored = () => clearTimeout(restore);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resume);
      clearTimeout(restore);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      g.scene().remove(group);
      group.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        (m.material as MeshBasicMaterial | undefined)?.dispose?.();
      });
    };
  }, [ready, orbits, clock, coarsePointer, showFps, material]);

  // Auto-rotate pauses while something is highlighted (spec §6.1).
  useEffect(() => {
    const c = ready ? globe.current?.controls() : undefined;
    if (c) c.autoRotate = autoRotate && highlighted === null;
  }, [ready, autoRotate, highlighted]);

  return (
    <div ref={wrap} className="globe-canvas" role="img" aria-label={t("globe.a11y.canvas_label")}>
      {width > 0 && height > 0 && (
        <Globe
          ref={globe}
          width={width}
          height={height}
          backgroundColor="#000004"
          globeImageUrl={earthUrl}
          globeMaterial={material}
          showAtmosphere={atmosphere}
          atmosphereColor="#7ab8ff"
          atmosphereAltitude={0.15}
          animateIn={false}
          enablePointerInteraction={false}
          rendererConfig={{ antialias: !coarsePointer, powerPreference: "high-performance" }}
          onGlobeReady={() => setReady(true)}
        />
      )}
      {showFps && fps !== null && <output className="globe-fps">{fps}</output>}
    </div>
  );
}
