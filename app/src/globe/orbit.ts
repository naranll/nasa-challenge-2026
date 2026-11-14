/** Browser-side orbit maths with satellite.js (spec §5.4, §5.5). No WebGL needed. */
import { degreesLat, degreesLong, eciToGeodetic, gstime, propagate, twoline2satrec, type SatRec } from "satellite.js";
import { TLE_WARN_AGE_DAYS, type TlePair } from "./tle";

export interface GeoPoint {
  lat: number;
  lng: number;
  altKm: number;
}

export type TleState = { kind: "fresh" } | { kind: "aging"; days: number } | { kind: "stale" };

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;
/** Spec A27: up to 7 days normal (same limit the build warns at), 7–30 days "approximate", over 30 days hidden. */
const TLE_STALE_DAYS = 30;

export function makeSatrec(tle: TlePair): SatRec | null {
  try {
    const satrec = twoline2satrec(tle.line1, tle.line2);
    return satrec.error === 0 && Number.isFinite(satrec.no) && satrec.no > 0 ? satrec : null;
  } catch {
    return null;
  }
}

/** Sub-satellite point and height, or null when SGP4 has no position (decayed, bad TLE). */
export function positionAt(satrec: SatRec, at: Date): GeoPoint | null {
  const pv = propagate(satrec, at);
  const eci = pv?.position;
  if (!eci || ![eci.x, eci.y, eci.z].every(Number.isFinite)) return null;
  const geo = eciToGeodetic(eci, gstime(at));
  const point = { lat: degreesLat(geo.latitude), lng: degreesLong(geo.longitude), altKm: geo.height };
  return [point.lat, point.lng, point.altKm].every(Number.isFinite) ? point : null;
}

/** Orbital period in minutes (satrec.no is the mean motion in radians per minute). */
export function periodMinutes(satrec: SatRec): number {
  return (2 * Math.PI) / satrec.no;
}

/** Earth-fixed ground track from half an orbit before `at` to half an orbit after (spec A25). */
export function groundTrack(satrec: SatRec, at: Date, points: number): GeoPoint[] {
  const periodMs = periodMinutes(satrec) * MINUTE_MS;
  const start = at.getTime() - periodMs / 2;
  const step = periodMs / (points - 1);
  const track: GeoPoint[] = [];
  for (let i = 0; i < points; i++) {
    const p = positionAt(satrec, new Date(start + i * step));
    if (p) track.push(p);
  }
  return track;
}

export function tleState(epochIso: string, at: Date): TleState {
  const ageDays = (at.getTime() - Date.parse(epochIso)) / DAY_MS;
  if (!Number.isFinite(ageDays) || ageDays > TLE_STALE_DAYS) return { kind: "stale" };
  if (ageDays > TLE_WARN_AGE_DAYS) return { kind: "aging", days: Math.floor(ageDays) };
  return { kind: "fresh" };
}
