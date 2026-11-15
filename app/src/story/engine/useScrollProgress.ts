/**
 * Scroll position of the story, as viewport heights scrolled past the top of the container.
 * The page scrolls natively: this only listens, it never hijacks wheel or touch.
 */
import { useEffect, useState, type RefObject } from "react";
import { clamp01, scrolledVh } from "./layout";

/**
 * One passive scroll listener plus a ResizeObserver, coalesced to one update per animation frame.
 * The viewport height is read from `unit` (an element that is 100dvh tall, so it matches the CSS that sizes the
 * chapters), falling back to window.innerHeight. That keeps the maths right while mobile toolbars come and go.
 */
export function useScrolledVh(ref: RefObject<HTMLElement | null>, unit?: RefObject<HTMLElement | null>): number {
  const [vh, setVh] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const viewport = unit?.current?.clientHeight || window.innerHeight;
      const next = scrolledVh(el.getBoundingClientRect().top, viewport);
      setVh((cur) => (Math.abs(cur - next) < 0.05 ? cur : next));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    if (unit?.current) ro.observe(unit.current);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
    };
  }, [ref, unit]);
  return vh;
}

/** 0..1 progress of a segment that starts `startVh` into the story and lasts `lengthVh`. */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  segment: { startVh: number; lengthVh: number },
  unit?: RefObject<HTMLElement | null>,
): number {
  const vh = useScrolledVh(ref, unit);
  return clamp01((vh - segment.startVh) / segment.lengthVh);
}
