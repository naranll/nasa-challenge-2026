/**
 * The persistent background of the story: plain stars, nothing else. No Earth limb, no glow, no orbit lines, no
 * ember: the only glow on the page belongs to hotspots (HeroMap). Decoration only (aria-hidden).
 * Reduced motion and low bandwidth get a still, cheaper version: no twinkle, fewer stars.
 */
import { rng } from "./rng";

export interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
  twinkle: boolean;
}

export const VIEW = { w: 1600, h: 1000 };

export function makeStars(count: number, seed = 7): Star[] {
  const rand = rng(seed);
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(rand() * VIEW.w),
    y: Math.round(rand() * VIEW.h),
    r: 0.5 + rand() * 0.9,
    o: 0.2 + rand() * 0.6,
    twinkle: i % 6 === 0,
  }));
}

interface Props {
  reduced: boolean;
  lowBandwidth: boolean;
}

export function Backdrop({ reduced, lowBandwidth }: Props) {
  const still = reduced || lowBandwidth;
  const stars = makeStars(lowBandwidth ? 60 : 170);
  return (
    <svg
      className={`story-backdrop${still ? " is-still" : ""}`}
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g className="story-stars">
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--story-cream)" opacity={s.o} className={s.twinkle && !still ? "twinkle" : undefined} />
        ))}
      </g>
    </svg>
  );
}
