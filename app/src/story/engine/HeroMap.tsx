/**
 * The persistent hero layer: a 1px outline of Mongolia, and the hotspots inside it. It never unmounts; scenes only
 * change its HeroState. Ember is used here and nowhere else, and the glow on these marks is the only glow on the page.
 *  - MODIS hotspot: larger dot, soft glow, one pulse ring as it ignites.
 *  - VIIRS hotspot: smaller triangle, denser.
 *  - A swath (thin tilted band, hairline edges) sweeps the map; hotspots ignite as it passes. Teal = MODIS, indigo = VIIRS.
 * Marks are illustrative (data/hotspots.ts); the chapter head carries the badge that says so.
 */
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useElementSize } from "../../globe/env";
import type { Hotspots, Mark } from "../data/hotspots";
import {
  bandCorners,
  bandVisible,
  flight,
  heroLayout,
  ignite,
  ignition,
  lerpLayout,
  outlinePath,
  smooth,
  sweepU,
  type HeroLayout,
  type HeroState,
  type SceneKind,
} from "./hero";
import { clamp01 } from "./layout";

interface Props {
  kind: SceneKind;
  hero: HeroState;
  hotspots: Hotspots | null;
  still: boolean;
  lowBandwidth: boolean;
  /** Names of the pipeline boxes, in order. */
  labels: string[];
}

const TWEEN_MS = 450;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The layout for `kind`, easing from the previous scene's place whenever the scene (or the window) changes. */
function useTweenedLayout(kind: SceneKind, width: number, height: number, still: boolean): HeroLayout | null {
  const target = useMemo(() => (width > 0 && height > 0 ? heroLayout(kind, width, height) : null), [kind, width, height]);
  const [shown, setShown] = useState<HeroLayout | null>(target);
  const current = useRef<HeroLayout | null>(target);
  useEffect(() => {
    if (!target) return;
    const from = current.current;
    if (still || !from) {
      current.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = clamp01((now - start) / TWEEN_MS);
      const next = t >= 1 ? target : lerpLayout(from, target, smooth(t));
      current.current = next;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, still]);
  return shown ?? target;
}

interface Placed {
  mark: Mark;
  x: number;
  y: number;
  u: number;
}

function place(marks: Mark[], layout: HeroLayout): Placed[] {
  return marks.map((mark) => {
    const { x, y } = layout.map.project(mark.lon, mark.lat);
    return { mark, x, y, u: sweepU(x, y, layout.map.rect) };
  });
}

function Dot({ x, y, r, opacity, ring, glow }: { x: number; y: number; r: number; opacity: number; ring: number; glow: boolean }) {
  return (
    <g opacity={opacity}>
      {glow && <circle cx={x} cy={y} r={r * 3.4} fill="url(#hero-glow)" />}
      {ring > 0 && <circle cx={x} cy={y} r={r * (1 + 3.2 * ring)} fill="none" stroke="var(--story-ember)" strokeWidth={1.2} opacity={(1 - ring) * 0.85} />}
      <circle cx={x} cy={y} r={r} fill="var(--story-ember)" />
      <circle cx={x} cy={y} r={r * 0.4} fill="var(--story-ember-core)" />
    </g>
  );
}

function Tri({ x, y, s, opacity, ring, glow }: { x: number; y: number; s: number; opacity: number; ring: number; glow: boolean }) {
  return (
    <g opacity={opacity}>
      {glow && <circle cx={x} cy={y} r={s * 3} fill="url(#hero-glow)" />}
      {ring > 0 && <circle cx={x} cy={y} r={s * (1 + 3.2 * ring)} fill="none" stroke="var(--story-ember)" strokeWidth={1} opacity={(1 - ring) * 0.8} />}
      <path d={`M${x},${y - s} L${x + s * 0.95},${y + s * 0.75} L${x - s * 0.95},${y + s * 0.75} Z`} fill="var(--story-ember)" />
    </g>
  );
}

export const HeroMap = memo(function HeroMap({ kind, hero, hotspots, still, lowBandwidth, labels }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(box);
  const layout = useTweenedLayout(kind, width, height, still);

  const placed = useMemo(
    () =>
      layout && hotspots
        ? { modis: place(hotspots.modis, layout), viirs: place(hotspots.viirs, layout), uniform: place(hotspots.uniform, layout) }
        : null,
    [layout, hotspots],
  );
  const outline = useMemo(() => (layout ? outlinePath(layout.map) : ""), [layout]);

  const wide = layout?.wide ?? false;
  const R = wide ? 6 : 4.6; // MODIS dot radius
  const S = wide ? 3.6 : 2.8; // VIIRS triangle size
  const glow = !lowBandwidth;
  const pipe = layout?.pipe;

  return (
    <div ref={box} className="story-hero" aria-hidden="true">
      {layout && (
        <svg width={width} height={height} focusable="false">
          <defs>
            <radialGradient id="hero-glow">
              <stop offset="0" stopColor="var(--story-ember)" stopOpacity="0.5" />
              <stop offset="0.45" stopColor="var(--story-ember)" stopOpacity="0.14" />
              <stop offset="1" stopColor="var(--story-ember)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path className="story-hero-outline" d={outline} fill="none" stroke="var(--story-faint)" strokeWidth={1} strokeLinejoin="round" style={{ opacity: hero.outline }} />

          {placed && (
            <>
              {/* swath bands sit under the marks */}
              {(["modis", "viirs"] as const).map((k) =>
                bandVisible(hero.sweep[k]) ? (
                  <polygon
                    key={k}
                    points={bandCorners(hero.sweep[k], layout.map.rect, 14)
                      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
                      .join(" ")}
                    fill={k === "modis" ? "var(--story-modis)" : "var(--story-viirs)"}
                    fillOpacity={0.08}
                    stroke={k === "modis" ? "var(--story-modis)" : "var(--story-viirs)"}
                    strokeOpacity={0.65}
                    strokeWidth={1}
                    strokeLinejoin="round"
                  />
                ) : null,
              )}

              <g className="story-hero-marks" style={{ opacity: hero.marks.modis }}>
                {placed.modis.map(({ mark, x, y, u }) => {
                  const lit = ignition(ignite(hero.sweep.modis, u));
                  const f = pipe && hero.fall > 0 ? flight(hero.fall, mark.order) : 0;
                  const px = f ? lerp(x, pipe!.entry.x, f) : x;
                  const py = f ? lerp(y, pipe!.entry.y, f) : y;
                  const opacity = lit.opacity * (1 - clamp01((f - 0.7) / 0.3));
                  return opacity > 0.01 ? <Dot key={mark.id} x={px} y={py} r={R * (1 - 0.6 * f)} opacity={opacity} ring={lit.ring} glow={glow} /> : null;
                })}
              </g>

              <g className="story-hero-marks" style={{ opacity: hero.marks.viirs }}>
                {placed.viirs.map(({ mark, x, y, u }) => {
                  const lit = ignition(ignite(hero.sweep.viirs, u));
                  const f = pipe && hero.fall > 0 ? flight(hero.fall, mark.order) : 0;
                  const px = f ? lerp(x, pipe!.entry.x, f) : x;
                  const py = f ? lerp(y, pipe!.entry.y, f) : y;
                  const opacity = lit.opacity * (1 - clamp01((f - 0.7) / 0.3));
                  return opacity > 0.01 ? <Tri key={mark.id} x={px} y={py} s={S * (1 - 0.6 * f)} opacity={opacity} ring={lit.ring} glow={glow} /> : null;
                })}
              </g>

              {pipe && (
                <g className="story-hero-marks" style={{ opacity: hero.marks.uniform }}>
                  {placed.uniform.map(({ mark, x, y }) => {
                    const f = flight(hero.rise, mark.order);
                    const opacity = clamp01(f / 0.25);
                    return opacity > 0.01 ? (
                      <Dot key={mark.id} x={lerp(pipe.exit.x, x, f)} y={lerp(pipe.exit.y, y, f)} r={R * (0.45 + 0.55 * f)} opacity={opacity} ring={0} glow={glow} />
                    ) : null;
                  })}
                </g>
              )}
            </>
          )}

          {pipe && hero.pipeline && (
            <g className="story-hero-pipe" style={{ opacity: hero.pipeline.show }}>
              {pipe.xs.map((x, i) => {
                const reached = hero.pipeline!.progress - i; // < 0 not yet, 0..1 passing through, > 1 done
                const now = reached > 0 && reached < 1;
                const done = reached >= 1;
                const edge = now ? "var(--story-cream)" : done ? "var(--story-muted)" : "var(--story-orbit)";
                const next = i < pipe.xs.length - 1;
                return (
                  <g key={i}>
                    <rect x={x} y={pipe.y - pipe.nodeH / 2} width={pipe.nodeW} height={pipe.nodeH} rx={2} fill="var(--story-ink)" fillOpacity={0.7} stroke={edge} strokeWidth={now ? 1.5 : 1} />
                    <text x={x + pipe.nodeW / 2} y={pipe.y} textAnchor="middle" dominantBaseline="middle" className={`story-hero-label${now || done ? " is-on" : ""}`}>
                      {labels[i]?.split("\n").map((line, k, all) => (
                        <tspan key={k} x={x + pipe.nodeW / 2} dy={k === 0 ? `${-(all.length - 1) * 0.55}em` : "1.1em"}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                    {next && <path d={`M${x + pipe.nodeW + 2},${pipe.y} L${pipe.xs[i + 1] - 2},${pipe.y}`} stroke={done ? "var(--story-muted)" : "var(--story-orbit)"} strokeWidth={1} />}
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      )}
    </div>
  );
});
