/**
 * The no-WebGL picture (spec §11.1, agreed: SVG built from data instead of a screenshot).
 * Earth seen from above Mongolia, land, and each platform's ground track and position
 * at page-open time, from the same TLE snapshot. Also the placeholder while the 3D chunk loads.
 */
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { EARTH_RADIUS_KM, MONGOLIA_CENTER, orthographic, rings, type Outline } from "./geo";
import { groundTrack, positionAt, type GeoPoint } from "./orbit";
import { PLATFORM_DASH, SENSOR_COLOR, type PlatformId } from "./platforms";
import type { Orbit } from "./useHomeData";

const SIZE = 400;
const R = 170;
const C = SIZE / 2;
const TRACK_POINTS = 180;
/** 30 of 400 viewBox units ≈ 25 px radius on a 328 px wide phone picture. */
const HIT_R = 30;

const project = orthographic(MONGOLIA_CENTER.lat, MONGOLIA_CENTER.lng);

/** Points behind the Earth are pulled onto the rim, so filled shapes that cross the horizon stay closed. */
function ringPath(ring: [number, number][]): string {
  return (
    ring
      .map(([lng, lat], i) => {
        let { x, y, z } = project(lat, lng);
        if (z < 0) {
          const len = Math.hypot(x, y) || 1;
          x /= len;
          y /= len;
        }
        return `${i ? "L" : "M"}${(C + R * x).toFixed(1)},${(C - R * y).toFixed(1)}`;
      })
      .join("") + "Z"
  );
}

/** A track as path pieces, split where it goes behind the Earth. */
function trackPath(points: GeoPoint[]): string {
  let d = "";
  let pen = false;
  for (const p of points) {
    const { x, y, z } = project(p.lat, p.lng, 1 + p.altKm / EARTH_RADIUS_KM);
    if (z < 0) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${(C + R * x).toFixed(1)},${(C - R * y).toFixed(1)}`;
    pen = true;
  }
  return d;
}

interface Props {
  orbits: Orbit[];
  at: Date;
  highlighted?: PlatformId | null;
  onSelect?: (id: PlatformId) => void;
  /** Skeleton: shown while the 3D chunk loads (spec §8.3 HomeGlobeSkeleton). */
  loading?: boolean;
}

export function StaticGlobe({ orbits, at, highlighted = null, onSelect, loading = false }: Props) {
  const { t } = useI18n();
  const [land, setLand] = useState<Outline | null>(null);
  useEffect(() => {
    let live = true;
    import("./assets/land.json").then((m) => live && setLand(m.default as Outline), () => {});
    return () => {
      live = false;
    };
  }, []);

  const landPaths = useMemo(() => (land ? rings(land).map(ringPath) : []), [land]);
  const sats = useMemo(
    () =>
      orbits.flatMap((o) => {
        if (!o.satrec) return [];
        const now = positionAt(o.satrec, at);
        const track = trackPath(groundTrack(o.satrec, at, TRACK_POINTS));
        if (!now) return [];
        const p = project(now.lat, now.lng, 1 + now.altKm / EARTH_RADIUS_KM);
        return [{ o, track, x: C + R * p.x, y: C - R * p.y, front: p.z >= 0 }];
      }),
    [orbits, at],
  );

  return (
    <svg
      className="globe-static"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={t(loading ? "globe.loading" : "globe.fallback.static_alt")}
      aria-busy={loading || undefined}
    >
      <defs>
        <radialGradient id="globe-static-ocean" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#1d3557" />
          <stop offset="100%" stopColor="#0a1426" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={R} fill="url(#globe-static-ocean)" />
      <g fill="#2a3a4f" stroke="#3b4f69" strokeWidth={0.5}>
        {landPaths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {sats.map(({ o, track }) => (
        <path
          key={`t-${o.id}`}
          d={track}
          fill="none"
          stroke={SENSOR_COLOR[o.sensor]}
          strokeWidth={highlighted === o.id ? 2 : 1}
          strokeOpacity={highlighted && highlighted !== o.id ? 0.25 : 0.7}
          strokeDasharray={PLATFORM_DASH[o.id].join(" ")}
        />
      ))}
      {sats
        .filter((s) => s.front)
        .map(({ o, x, y }) => (
          <g
            key={`m-${o.id}`}
            onClick={onSelect ? () => onSelect(o.id) : undefined}
            style={onSelect ? { cursor: "pointer" } : undefined}
          >
            {/* Invisible hit area: at least 44 × 44 CSS px at phone width (A29). */}
            {onSelect && <circle cx={x} cy={y} r={HIT_R} fill="transparent" />}
            <circle cx={x} cy={y} r={highlighted === o.id ? 7 : 5} fill={SENSOR_COLOR[o.sensor]} stroke="#05070d" strokeWidth={1.5} />
          </g>
        ))}
    </svg>
  );
}
