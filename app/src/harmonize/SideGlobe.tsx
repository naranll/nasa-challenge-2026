/**
 * One of the two Harmonizing globes (PLAN D12). Loaded as its own chunk with React.lazy.
 * Hexagons are drawn as columns: height and colour = that year's count, on the scale both globes share.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { Color, MeshPhongMaterial } from "three";
import { rampColor } from "../calendar/scale";
import earthUrl from "../globe/assets/earth-day.jpg";
import { useElementSize } from "../globe/env";
import { MONGOLIA_CENTER } from "../globe/geo";
import { useI18n } from "../i18n";
import type { CameraSync, Side } from "./cameraSync";
import type { GlobeCell } from "./harmonizeData";

export type GlobeFallbackReason = "context-lost" | "low-fps" | "chunk-error";

// Look and feel, not data.
const START_ALTITUDE = 0.7; // camera distance in globe radii: Mongolia fills the view
const MAX_COLUMN = 0.25; // tallest column, in globe radii
const MIN_COLUMN = 0.004;
const COLUMN_RADIUS_DEG = 0.45;
const MERGE_ABOVE = 1500; // many columns: merge into one mesh (no transitions) to stay smooth
const DIM_EARTH = 0x4a4a4a;
const FPS_WINDOW_MS = 5000;
const FPS_GIVE_UP_BELOW = 15;
const SLOW_WINDOWS_TO_GIVE_UP = 2;
const PAUSED_GAP_MS = 250; // a frame this late means the window was hidden or throttled
const CONTEXT_RESTORE_WAIT_MS = 3000;

interface Props {
  side: Side;
  cells: GlobeCell[];
  yearIndex: number;
  max: number;
  sync: CameraSync;
  coarsePointer: boolean;
  reducedMotion: boolean;
  onFallback: (reason: GlobeFallbackReason) => void;
}

interface Column {
  lat: number;
  lng: number;
  value: number;
}

export default function SideGlobe({ side, cells, yearIndex, max, sync, coarsePointer, reducedMotion, onFallback }: Props) {
  const { t } = useI18n();
  const wrap = useRef<HTMLDivElement>(null);
  const globe = useRef<GlobeMethods | undefined>(undefined);
  const { width, height } = useElementSize(wrap);
  const [ready, setReady] = useState(false);
  const material = useMemo(() => new MeshPhongMaterial(), []);
  const latest = useRef(onFallback);
  latest.current = onFallback;

  const columns = useMemo(
    () =>
      cells.flatMap((c): Column[] => {
        const v = c[side][yearIndex];
        return typeof v === "number" && v > 0 ? [{ lat: c.lat, lng: c.lon, value: v }] : [];
      }),
    [cells, side, yearIndex],
  );

  useEffect(() => {
    const g = globe.current;
    const el = wrap.current;
    if (!ready || !g || !el) return;
    const renderer = g.renderer();
    const controls = g.controls();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.5 : 2));
    material.color = new Color(DIM_EARTH);
    controls.autoRotate = false;
    controls.enableZoom = coarsePointer;
    g.pointOfView({ ...MONGOLIA_CENTER, altitude: START_ALTITUDE }, 0);
    sync.register(side, g);

    // The globe the user touches leads the camera; the other follows.
    const lead = () => {
      sync.lead(side);
      controls.enableZoom = true;
    };
    const leave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") controls.enableZoom = false;
    };
    el.addEventListener("pointerdown", lead);
    el.addEventListener("wheel", lead, { passive: true });
    el.addEventListener("pointerleave", leave);

    // Too slow or lost context: the page switches to the calendars (PLAN D12 fallback).
    // Measured only while the globe is on screen; long gaps are a paused or throttled window, not slow drawing.
    let raf = 0;
    let frames: number[] = [];
    let windowStart = performance.now();
    let last = windowStart;
    let onScreen = true;
    let slowWindows = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const gap = now - last;
      last = now;
      if (!onScreen || document.visibilityState !== "visible" || gap > PAUSED_GAP_MS) {
        windowStart = now;
        frames = [];
        return;
      }
      frames.push(gap);
      if (now - windowStart > FPS_WINDOW_MS) {
        const sorted = [...frames].sort((a, b) => a - b);
        const slow = 1000 / sorted[Math.floor(sorted.length / 2)] < FPS_GIVE_UP_BELOW;
        slowWindows = slow ? slowWindows + 1 : 0;
        if (slowWindows >= SLOW_WINDOWS_TO_GIVE_UP) latest.current("low-fps");
        frames = [];
        windowStart = now;
      }
    };
    raf = requestAnimationFrame(frame);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
    });
    io.observe(el);
    const canvas = renderer.domElement;
    let restore: ReturnType<typeof setTimeout> | undefined;
    const onLost = (e: Event) => {
      e.preventDefault();
      restore = setTimeout(() => latest.current("context-lost"), CONTEXT_RESTORE_WAIT_MS);
    };
    const onRestored = () => clearTimeout(restore);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      clearTimeout(restore);
      sync.register(side, null);
      el.removeEventListener("pointerdown", lead);
      el.removeEventListener("wheel", lead);
      el.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [ready, side, sync, coarsePointer, material]);

  return (
    <div ref={wrap} className="side-globe-canvas" role="img" aria-label={t(side === "raw" ? "harm.globe.raw.a11y" : "harm.globe.harm.a11y")}>
      {width > 0 && height > 0 && (
        <Globe
          ref={globe}
          width={width}
          height={height}
          backgroundColor="#000004"
          globeImageUrl={earthUrl}
          globeMaterial={material}
          showAtmosphere={!coarsePointer}
          atmosphereColor="#7ab8ff"
          atmosphereAltitude={0.12}
          pointsData={columns}
          pointLat="lat"
          pointLng="lng"
          pointAltitude={(d) => Math.max(MIN_COLUMN, ((d as Column).value / Math.max(max, 1)) * MAX_COLUMN)}
          pointRadius={COLUMN_RADIUS_DEG}
          pointColor={(d) => rampColor((d as Column).value, max)}
          pointsMerge={columns.length > MERGE_ABOVE}
          pointsTransitionDuration={reducedMotion ? 0 : 400}
          animateIn={false}
          enablePointerInteraction={false}
          onZoom={(pov) => sync.moved(side, pov)}
          rendererConfig={{ antialias: !coarsePointer, powerPreference: "high-performance" }}
          onGlobeReady={() => setReady(true)}
        />
      )}
    </div>
  );
}
