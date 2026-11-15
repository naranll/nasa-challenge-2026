/** Loads the two files the raw view reads. Each can fail on its own; the page hides only what needs it. */
import { useEffect, useState } from "react";
import { loadData } from "../data";
import type { CalendarFile, PipelineStats } from "../globe/homeData";

export type Loaded<T> = { status: "loading" } | { status: "ok"; data: T } | { status: "error" };

function useFile<T>(path: string, isValid: (doc: T) => boolean): Loaded<T> {
  const [state, setState] = useState<Loaded<T>>({ status: "loading" });
  useEffect(() => {
    let live = true;
    setState({ status: "loading" });
    loadData<T>(path).then(
      (data) => live && setState(isValid(data) ? { status: "ok", data } : { status: "error" }),
      () => live && setState({ status: "error" }),
    );
    return () => {
      live = false;
    };
  }, [path]); // isValid is a module-level function, stable across renders
  return state;
}

const isCalendar = (d: CalendarFile) => Array.isArray(d?.months);
const isStats = (d: PipelineStats) => typeof d?.rows_by_platform === "object" && d.rows_by_platform !== null;

/** For now the page shows Mongolia as one region; aimags come later. */
export const REGION_ID = "mongolia";

export function useCalendar() {
  return useFile<CalendarFile>(`calendar/${REGION_ID}.json`, isCalendar);
}

export function useStats() {
  return useFile<PipelineStats>("pipeline_stats.json", isStats);
}
