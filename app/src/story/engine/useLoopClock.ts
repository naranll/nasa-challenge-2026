/**
 * A looping phase 0..1 for time-driven scenes. Runs only while `running`; stops (and keeps its place) when paused.
 * It updates React state at `fps`, not every frame, and a tab that was in the background does not jump ahead.
 */
import { useEffect, useRef, useState } from "react";

export function useLoopClock(running: boolean, seconds: number, resetKey: string, fps = 30): number {
  const [phase, setPhase] = useState(0);
  const at = useRef(0);

  // A new chapter starts its loop from the beginning.
  useEffect(() => {
    at.current = 0;
    setPhase(0);
  }, [resetKey]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let drawn = 0;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      at.current = (at.current + dt / seconds) % 1;
      if (now - drawn >= 1000 / fps) {
        drawn = now;
        setPhase(at.current);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running, seconds, fps]);

  return phase;
}
