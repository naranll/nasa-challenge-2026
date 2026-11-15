/**
 * The story's only door to data. Each adapter points at a real artifact path served by the app's loader
 * (fixtures/ in mock mode, public/data/ in real mode). Missing file = "error", never an invented value.
 */
import { useEffect, useState } from "react";
import { loadData } from "../../data";
import type { Loaded } from "../../globe/useHomeData";
import type { StoryCalendar } from "./series";

export const CALENDAR_PATH = "calendar/mongolia.json";

const inflight = new Map<string, Promise<unknown>>();
const resolved = new Map<string, unknown>();

/** One request per path, shared by every chapter; a failed load is forgotten so the next mount can retry. */
function loadOnce<T>(path: string): Promise<T> {
  let p = inflight.get(path) as Promise<T> | undefined;
  if (!p) {
    p = loadData<T>(path).then(
      (data) => {
        resolved.set(path, data);
        return data;
      },
      (err) => {
        inflight.delete(path);
        throw err;
      },
    );
    inflight.set(path, p);
  }
  return p;
}

/** For tests: forget everything that was loaded. */
export function clearStoryDataCache() {
  inflight.clear();
  resolved.clear();
}

export function useStoryFile<T>(path: string): Loaded<T> {
  // A chapter that mounts after the file was loaded starts with the data, so there is no "Loading" flash.
  const [state, setState] = useState<Loaded<T>>(() => (resolved.has(path) ? { status: "ok", data: resolved.get(path) as T } : { status: "loading" }));
  useEffect(() => {
    let live = true;
    loadOnce<T>(path).then(
      (data) => live && setState({ status: "ok", data }),
      () => live && setState({ status: "error" }),
    );
    return () => {
      live = false;
    };
  }, [path]);
  return state;
}

/** A calendar file with months is the minimum the chart needs. */
export const isCalendar = (d: StoryCalendar | null | undefined): d is StoryCalendar => Array.isArray(d?.months) && d.months.length > 0;

export function useCalendar(): Loaded<StoryCalendar> {
  const file = useStoryFile<StoryCalendar>(CALENDAR_PATH);
  if (file.status === "ok" && !isCalendar(file.data)) return { status: "error" };
  return file;
}

/** satellites.json (real, written by scripts/tle/fetch_tle.ts): only the launch dates the story reads. */
export interface LaunchFile {
  platforms: { id: string; launch_date: string | null }[];
}

/** Launch date per platform id; a platform with no confirmed date is simply missing from the map. */
export function useLaunchDates(): Loaded<Record<string, string>> {
  const file = useStoryFile<LaunchFile>("satellites.json");
  if (file.status !== "ok") return file.status === "loading" ? file : { status: "error" };
  const out: Record<string, string> = {};
  for (const p of file.data.platforms ?? []) if (p?.id && typeof p.launch_date === "string") out[p.id] = p.launch_date;
  return { status: "ok", data: out };
}
