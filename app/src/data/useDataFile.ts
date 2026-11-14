/** Load one contract file in a component. Each file can fail on its own; the page hides only what needs it. */
import { useEffect, useState } from "react";
import { loadData } from ".";

export type Loaded<T> = { status: "loading" } | { status: "ok"; data: T } | { status: "error" };

/** `path` null = nothing to load yet. A failed load is retried once. */
export function useDataFile<T>(path: string | null): Loaded<T> {
  const [state, setState] = useState<{ path: string | null; loaded: Loaded<T> }>({ path, loaded: { status: "loading" } });
  useEffect(() => {
    if (path === null) return;
    let live = true;
    setState({ path, loaded: { status: "loading" } });
    loadData<T>(path)
      .catch(() => loadData<T>(path))
      .then(
        (data) => live && setState({ path, loaded: { status: "ok", data } }),
        (err) => {
          console.error(err);
          if (live) setState({ path, loaded: { status: "error" } });
        },
      );
    return () => {
      live = false;
    };
  }, [path]);
  return state.path === path ? state.loaded : { status: "loading" };
}

export const dataOf = <T,>(l: Loaded<T>): T | null => (l.status === "ok" ? l.data : null);
