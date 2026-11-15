/**
 * The story's 3D globe: one react-globe.gl instance that never unmounts. The camera and brightness follow
 * `targetRef`, written by the engine on scroll; React does not rerender per frame. Pointer input is off, so
 * touch and wheel always scroll the page. Loaded as its own chunk. HomeGlobe is not touched.
 */
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { Color, MeshPhongMaterial } from "three";
import earthUrl from "../../globe/assets/earth-day.jpg";
import { useCoarsePointer, useElementSize } from "../../globe/env";
import { MONGOLIA } from "../../globe/geo";
import type { GlobeTarget } from "../types";

interface Props {
  targetRef: RefObject<GlobeTarget>;
  onFallback: () => void;
}

const CONTEXT_RESTORE_WAIT_MS = 3000;
/** Texture multiplier: brightness 0 -> MIN, 1 -> MIN + SPAN. The home globe uses a fixed 0.29. */
const MIN_LIGHT = 0.1;
const LIGHT_SPAN = 0.5;

/** On a tall phone screen, back the camera off so the Earth still fits the width. */
export function fitAltitude(altitude: number, width: number, height: number): number {
  const tall = Math.max(1, height / Math.max(width, 1));
  return (altitude + 1) * Math.max(1, tall * 0.7) - 1;
}

export default function StoryGlobe({ targetRef, onFallback }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const globe = useRef<GlobeMethods | undefined>(undefined);
  const { width, height } = useElementSize(wrap);
  const coarse = useCoarsePointer();
  const [ready, setReady] = useState(false);
  const material = useMemo(() => new MeshPhongMaterial(), []);
  const polygons = useMemo(() => MONGOLIA.features, []);

  useEffect(() => {
    const g = globe.current;
    if (!ready || !g) return;
    const renderer = g.renderer();
    const controls = g.controls();
    controls.enabled = false; // the page scrolls; the globe never grabs the pointer
    controls.autoRotate = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));

    let raf = 0;
    let last = "";
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const t = targetRef.current;
      const key = `${t.lat.toFixed(3)}|${t.lng.toFixed(3)}|${t.altitude.toFixed(3)}|${t.brightness.toFixed(3)}|${width}x${height}`;
      if (key === last) return;
      last = key;
      g.pointOfView({ lat: t.lat, lng: t.lng, altitude: fitAltitude(t.altitude, width, height) }, 0);
      // three-globe nulls the colour when the texture loads, so assign a fresh one instead of mutating.
      material.color = new Color().setScalar(MIN_LIGHT + LIGHT_SPAN * t.brightness);
    };
    raf = requestAnimationFrame(frame);

    let restore: ReturnType<typeof setTimeout> | undefined;
    const canvas = renderer.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      restore = setTimeout(onFallback, CONTEXT_RESTORE_WAIT_MS);
    };
    const onRestored = () => clearTimeout(restore);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(restore);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [ready, coarse, targetRef, material, width, height, onFallback]);

  return (
    <div ref={wrap} className="story-globe-canvas">
      {width > 0 && height > 0 && (
        <Globe
          ref={globe}
          width={width}
          height={height}
          backgroundColor="#000004"
          globeImageUrl={earthUrl}
          globeMaterial={material}
          showAtmosphere={!coarse}
          atmosphereColor="#7ab8ff"
          atmosphereAltitude={0.15}
          polygonsData={polygons}
          polygonCapColor={() => "rgba(255, 214, 140, 0.35)"}
          polygonSideColor={() => "rgba(0, 0, 0, 0)"}
          polygonStrokeColor={() => "#ffe2b0"}
          polygonAltitude={0.006}
          animateIn={false}
          enablePointerInteraction={false}
          rendererConfig={{ antialias: !coarse, powerPreference: "high-performance" }}
          onGlobeReady={() => setReady(true)}
        />
      )}
    </div>
  );
}
