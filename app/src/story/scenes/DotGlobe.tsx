/**
 * A stylized digital globe: a flat disc covered in dots (no coastlines, no country outlines, no glow). Hotspots are
 * scattered ember dots. It turns slowly with `angle` (radians), driven by scroll for a gentle parallax.
 */
import { memo, useMemo } from "react";
import { rng } from "../engine/rng";

const N = 560;
const R = 170;
const C = 200;
const TILT = 0.38;

interface P {
  x: number;
  y: number;
  z: number;
}

/** Fibonacci sphere: evenly spread points, same every load. */
const POINTS: P[] = Array.from({ length: N }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / N;
  const r = Math.sqrt(1 - y * y);
  const a = i * Math.PI * (3 - Math.sqrt(5));
  return { x: Math.cos(a) * r, y, z: Math.sin(a) * r };
});

/** Hotspots as fixed points on the sphere (scattered, seeded). */
export const HOTSPOTS: P[] = (() => {
  const rand = rng(11);
  return Array.from({ length: 22 }, () => {
    const y = rand() * 1.6 - 0.8;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    return { x: Math.cos(a) * r, y, z: Math.sin(a) * r };
  });
})();

function project(p: P, angle: number) {
  const x1 = p.x * Math.cos(angle) + p.z * Math.sin(angle);
  const z1 = -p.x * Math.sin(angle) + p.z * Math.cos(angle);
  const y2 = p.y * Math.cos(TILT) - z1 * Math.sin(TILT);
  const z2 = p.y * Math.sin(TILT) + z1 * Math.cos(TILT);
  return { sx: C + x1 * R, sy: C - y2 * R, z: z2 };
}

export const DotGlobe = memo(function DotGlobe({ angle, hot = 1 }: { angle: number; hot?: number }) {
  const dots = useMemo(() => POINTS.map((p) => project(p, angle)).filter((q) => q.z > 0.02), [angle]);
  const fires = useMemo(() => HOTSPOTS.map((p) => project(p, angle)).filter((q) => q.z > 0.15), [angle]);
  return (
    <svg className="dotglobe" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <circle cx={C} cy={C + 6} r={R} fill="#000" opacity="0.32" />
      <circle cx={C} cy={C} r={R} fill="var(--story-plate)" stroke="var(--story-faint)" strokeWidth="3" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.sx} cy={d.sy} r={0.9 + d.z * 1.6} fill="var(--story-cream)" opacity={0.14 + d.z * 0.34} />
      ))}
      {fires.map((d, i) => (
        <circle key={i} cx={d.sx} cy={d.sy} r={(3 + d.z * 2.4) * (0.4 + 0.6 * hot)} fill="var(--story-ember)" stroke="var(--story-ink)" strokeWidth="1.5" opacity={hot} />
      ))}
    </svg>
  );
});
