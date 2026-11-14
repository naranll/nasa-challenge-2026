/** Mongolia's outline and the flat (orthographic) projection used by the no-WebGL picture. */
import mongolia from "./assets/mongolia.json";

export type Ring = [number, number][]; // [lng, lat]
export interface Outline {
  type: "FeatureCollection";
  features: { geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown } }[];
}

export const MONGOLIA = mongolia as Outline;
export const EARTH_RADIUS_KM = 6371;

/** Every outer and inner ring of an outline, as [lng, lat] lists. */
export function rings(outline: Outline): Ring[] {
  return outline.features.flatMap(({ geometry: g }) =>
    g.type === "Polygon" ? (g.coordinates as Ring[]) : (g.coordinates as Ring[][]).flat(),
  );
}

/** Centre of Mongolia's bounding box: where the camera and the flat picture look. */
export const MONGOLIA_CENTER = (() => {
  const pts = rings(MONGOLIA).flat();
  const lngs = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  return { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 };
})();

const RAD = Math.PI / 180;

/**
 * Orthographic view centred on (lat0, lng0). Returns unit-disc x/y (y up) and z (> 0 = facing us).
 * `r` scales points above the surface (1 + altitude / Earth radius).
 */
export function orthographic(lat0: number, lng0: number) {
  const sin0 = Math.sin(lat0 * RAD);
  const cos0 = Math.cos(lat0 * RAD);
  return (lat: number, lng: number, r = 1) => {
    const phi = lat * RAD;
    const dl = (lng - lng0) * RAD;
    const x = Math.cos(phi) * Math.sin(dl);
    const y = cos0 * Math.sin(phi) - sin0 * Math.cos(phi) * Math.cos(dl);
    const z = sin0 * Math.sin(phi) + cos0 * Math.cos(phi) * Math.cos(dl);
    return { x: x * r, y: y * r, z };
  };
}
