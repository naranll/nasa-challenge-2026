/** Loads the home page's three data files. Each can fail on its own; the page hides only what needs it. */
import { useEffect, useState } from "react";
import type { SatRec } from "satellite.js";
import { loadData } from "../data";
import type { CalendarFile, PipelineStats } from "./homeData";
import { makeSatrec, tleState, type TleState } from "./orbit";
import { PLATFORM_IDS, SENSOR_OF, type PlatformId, type Sensor } from "./platforms";
import type { SatellitePlatform, SatellitesFile } from "./tle";

export type Loaded<T> = { status: "loading" } | { status: "ok"; data: T } | { status: "error" };

/** One platform as the globe, legend and card see it. Built even without satellites.json (spec A45). */
export interface Orbit {
  id: PlatformId;
  sensor: Sensor;
  /** null: no orbit file, bad TLE, or TLE too old to draw (spec §5.5). */
  satrec: SatRec | null;
  meta: SatellitePlatform | null;
  tle: TleState | null;
}

export interface SatellitesInfo {
  orbits: Orbit[];
  /** The CelesTrak name and snapshot date for the credit line; null when the file did not load. */
  source: { name: string; date: string } | null;
}

async function loadWithRetry<T>(path: string): Promise<T> {
  try {
    return await loadData<T>(path);
  } catch {
    return loadData<T>(path); // spec §11.2: one retry
  }
}

/** A file that loads but has the wrong shape counts as not loaded (spec §11.2 schema check). */
function useFile<T>(path: string, isValid: (doc: T) => boolean = () => true): Loaded<T> {
  const [state, setState] = useState<Loaded<T>>({ status: "loading" });
  useEffect(() => {
    let live = true;
    loadWithRetry<T>(path).then(
      (data) => live && setState(isValid(data) ? { status: "ok", data } : { status: "error" }),
      () => live && setState({ status: "error" }),
    );
    return () => {
      live = false;
    };
  }, [path]); // isValid is a module-level function, stable across renders
  return state;
}

export function buildOrbits(file: SatellitesFile | null, at: Date): SatellitesInfo {
  const platforms = Array.isArray(file?.platforms) ? file.platforms : [];
  const orbits = PLATFORM_IDS.map((id): Orbit => {
    const meta = platforms.find((p) => p?.id === id) ?? null;
    if (!meta?.tle) return { id, sensor: SENSOR_OF[id], satrec: null, meta, tle: null };
    const tle = tleState(meta.tle.epoch, at);
    const satrec = tle.kind === "stale" ? null : makeSatrec(meta.tle);
    return { id, sensor: SENSOR_OF[id], satrec, meta, tle: satrec ? tle : { kind: "stale" } };
  });
  const source = file?.tle_source?.name && file.generated_at ? { name: file.tle_source.name, date: file.generated_at } : null;
  return { orbits, source };
}

const isTle = (t: unknown) => {
  const x = t as { line1?: unknown; line2?: unknown; epoch?: unknown } | null;
  return typeof x?.line1 === "string" && typeof x.line2 === "string" && typeof x.epoch === "string";
};

/** Shape check for satellites.json; the loader already checks schema_version and the synthetic flag. */
export function isSatellitesFile(doc: SatellitesFile): boolean {
  return (
    typeof doc?.tle_source?.name === "string" &&
    typeof doc.generated_at === "string" &&
    Array.isArray(doc.platforms) &&
    doc.platforms.length > 0 &&
    doc.platforms.every((p) => typeof p?.id === "string" && isTle(p.tle))
  );
}

export function useHomeData() {
  const satellites = useFile<SatellitesFile>("satellites.json", isSatellitesFile);
  const stats = useFile<PipelineStats>("pipeline_stats.json");
  const calendar = useFile<CalendarFile>("calendar/mongolia.json");
  return { satellites, stats, calendar };
}
