/** Browser capability checks and small hooks shared by the home page parts. */
import { useEffect, useState, type RefObject } from "react";

/** Spec §11.2: check WebGL before loading the three.js chunk at all. */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function useMedia(query: string): boolean {
  const get = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const on = () => setMatches(mql.matches);
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");
export const useCoarsePointer = () => useMedia("(pointer: coarse)");

/** The element's content box size, kept current with ResizeObserver (no layout shift). */
export function useElementSize(ref: RefObject<HTMLElement | null>): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** Simulated clock (spec §5.4, A17): starts at the real time, then runs `timeScale` times faster. */
export interface SimClock {
  timeScale: number;
  now(): Date;
}

export function createSimClock(timeScale: number, start = Date.now(), perf: () => number = () => performance.now()): SimClock {
  const p0 = perf();
  return { timeScale, now: () => new Date(start + (perf() - p0) * timeScale) };
}
