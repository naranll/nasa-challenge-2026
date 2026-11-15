/** Browser checks for the story: reduced motion, low bandwidth, URL helpers. All safe when a browser API is missing. */
import { useEffect, useState } from "react";
import { hasWebGL, useReducedMotion } from "../../globe/env";

/** Reads `name` from the hash query (`#/story?ch=ch7`) first, then from the real query (`story-dev.html?lite=1`). */
export function readParam(name: string): string | null {
  try {
    const hash = location.hash.includes("?") ? location.hash.slice(location.hash.indexOf("?") + 1) : "";
    return new URLSearchParams(hash).get(name) ?? new URLSearchParams(location.search).get(name);
  } catch {
    return null;
  }
}

/** Writes `ch` into the hash query without adding a history entry and without telling the router. */
export function writeChapterParam(id: string): void {
  try {
    const path = location.hash.split("?")[0] || "#";
    const params = new URLSearchParams(location.hash.includes("?") ? location.hash.slice(location.hash.indexOf("?") + 1) : "");
    params.set("ch", id);
    history.replaceState(history.state, "", `${location.pathname}${location.search}${path}?${params}`);
  } catch {
    /* a failed URL update must never break the story */
  }
}

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/** Data Saver on, a 2G connection, no WebGL, or `?lite=1`: the story uses pictures instead of the 3D globe. */
export function detectLowBandwidth(): boolean {
  if (readParam("lite") === "1") return true;
  if (!hasWebGL()) return true;
  const c = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  return Boolean(c?.saveData) || c?.effectiveType === "slow-2g" || c?.effectiveType === "2g";
}

export function useStoryMotion(): boolean {
  const media = useReducedMotion();
  return media || readParam("reduced") === "1";
}

export function useLowBandwidth(): boolean {
  const [lite, setLite] = useState(detectLowBandwidth);
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: EventTarget }).connection;
    if (!c) return;
    const on = () => setLite(detectLowBandwidth());
    c.addEventListener("change", on);
    return () => c.removeEventListener("change", on);
  }, []);
  return lite;
}
