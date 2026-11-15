import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

/** JS easing functions matching the CSS curves in tokens.css (for canvas / manual tweens). */
export const easing = {
  /** Soft expo-out. */
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  /** Gentle overshoot, settles at 1. */
  spring: (t: number) => {
    const c1 = 1.1;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
} as const;

export interface SkinMode {
  /** prefers-reduced-motion: show the static final state. */
  reduced: boolean;
  /** ?lite=1: static images, no blur layers. */
  lite: boolean;
  /** reduced || lite: nothing should animate. */
  still: boolean;
}

function readLite(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("lite") === "1";
  } catch {
    return false;
  }
}

/** Reads both switches once and follows changes to the OS motion setting. */
export function useSkinMode(): SkinMode {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== "undefined" && typeof matchMedia === "function"
      ? matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  const [lite] = useState<boolean>(() => (typeof window !== "undefined" ? readLite() : false));
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return { reduced, lite, still: reduced || lite };
}

export interface RevealOptions {
  /** Stagger delay in ms. */
  delay?: number;
  /** IntersectionObserver threshold. Default 0.2. */
  threshold?: number;
  /** Reveal once (default) or toggle with visibility. */
  once?: boolean;
  /** Start the reveal from this offset in px. Default 18. */
  rise?: number;
}

/**
 * Staggered reveal on scroll-into-view. Spread `props` on the element:
 *   const r = useReveal({ delay: 120 }); <h2 ref={r.ref} {...r.props}>
 * Under reduced motion or ?lite=1 the element renders in its final state immediately.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(opts: RevealOptions = {}) {
  const { delay = 0, threshold = 0.2, once = true, rise = 18 } = opts;
  const mode = useSkinMode();
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (mode.still) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            if (once) io.disconnect();
          } else if (!once) setSeen(false);
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mode.still, threshold, once]);
  const shown = mode.still || seen;
  const style = { "--sk-delay": `${delay}ms`, "--sk-rise": `${rise}px` } as CSSProperties;
  return {
    ref,
    shown,
    props: { className: "sk-reveal", "data-shown": shown ? "true" : "false", style },
  };
}

/**
 * Tiny pointer + scroll parallax. Writes --sk-px / --sk-py (pointer, -1..1 scaled by strength px)
 * and --sk-sy (scroll, px) onto the element; use them in transform: translate3d(...) in CSS.
 * `strength` is the maximum offset in px (keep it under ~14: "tiny"). Disabled when still.
 */
export function useParallax<T extends HTMLElement = HTMLElement>(strength = 8): RefObject<T | null> {
  const mode = useSkinMode();
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || mode.still) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.setProperty("--sk-px", `${(cx * strength).toFixed(2)}px`);
      el.style.setProperty("--sk-py", `${(cy * strength).toFixed(2)}px`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      kick();
    };
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.setProperty("--sk-sy", `${(-mid * 0.04).toFixed(1)}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [mode.still, strength]);
  return ref;
}
