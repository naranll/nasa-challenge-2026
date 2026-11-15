/**
 * The story's only door to data. Each adapter points at a real artifact path served by the app's loader
 * (fixtures/ in mock mode, public/data/ in real mode). Missing file = "error", never an invented value.
 */
import { useEffect, useState } from "react";
import { loadData } from "../../data";
import type { Loaded } from "../../globe/useHomeData";
import type { StoryCalendar } from "./series";

export const CALENDAR_PATH = "calendar/mongolia.json";

export function useStoryFile<T>(path: string): Loaded<T> {
  const [state, setState] = useState<Loaded<T>>({ status: "loading" });
  useEffect(() => {
    let live = true;
    loadData<T>(path).then(
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
