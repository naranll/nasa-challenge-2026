/**
 * The story's frame: slides in from the right when it mounts (CSS, works everywhere), always shows the
 * "Skip story → open app" link, and slides out to the right through the View Transitions API when the
 * browser has it. With reduced motion, both directions are a short crossfade.
 */
import type { MouseEvent, ReactNode } from "react";
import { GradientOrb, GrainOverlay, HairlineFrame } from "../skin";
import { useStoryMotion } from "../engine/env";
import { useStoryText } from "../strings";

const APP_HOME = `${import.meta.env.BASE_URL}#/`;

const nextFrames = (n: number) =>
  new Promise<void>((resolve) => {
    const step = (left: number) => (left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
    step(n);
  });

export function SlideShell({ children }: { children: ReactNode }) {
  const s = useStoryText();
  const reduced = useStoryMotion();

  const skip = (e: MouseEvent<HTMLAnchorElement>) => {
    const sameDocument = new URL(APP_HOME, location.href).pathname === location.pathname;
    if (typeof document.startViewTransition !== "function" || !sameDocument || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const html = document.documentElement;
    html.classList.add("story-leaving");
    if (reduced) html.classList.add("story-reduced");
    const done = () => html.classList.remove("story-leaving", "story-reduced");
    const transition = document.startViewTransition(async () => {
      location.hash = "/";
      await nextFrames(2); // let the router render the home page before the "new" snapshot is taken
    });
    transition.finished.then(done, done);
  };

  return (
    <div className={`story-root sk-skin${reduced ? " is-reduced" : ""}`} lang="en">
      <div className="sk-skin-decor" aria-hidden="true">
        <div className="sk-skin-orb">
          <GradientOrb size="min(36vw, 400px)" intensity={0.42} blur={34} spark />
        </div>
        <HairlineFrame corners={false} coords={[undefined, undefined, "47.92°N · 106.92°E", "MODIS · VIIRS"]} barcode="space-khuushuur" inset={18} />
      </div>
      <GrainOverlay position="fixed" opacity={0.09} />
      <div className="story-topbar">
        <a className="story-skip" href={APP_HOME} onClick={skip} aria-label={s("skip.aria")}>
          {s("skip")}
        </a>
      </div>
      <h1 className="story-sr-only">{s("story.title")}</h1>
      {children}
    </div>
  );
}
