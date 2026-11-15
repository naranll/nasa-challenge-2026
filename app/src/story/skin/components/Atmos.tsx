import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useSkinMode } from "../motion";

/* ---------------------------------------------------------------- GradientOrb */
export interface GradientOrbProps {
  /** Core colour and outer colour. Default: fire orange to magenta. A third stop is added between. */
  from?: string;
  to?: string;
  /** Optional mid stop (e.g. cobalt or green for the third hue). */
  mid?: string;
  /** Diameter: number = px, string = any CSS length (e.g. "min(70vw, 560px)"). */
  size?: number | string;
  /** 0..1 drift amplitude. 0 = still. Ignored (still) under reduced motion / lite. */
  drift?: number;
  /** 0..1 brightness. */
  intensity?: number;
  /** Blur radius in px of the single blurred layer. Not applied in lite. */
  blur?: number;
  /** Show a SparkFlare at the upper-left of the orb. */
  spark?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * An orb is an OBJECT (sensor, fire, sun), never a page wash. Costs ONE blurred layer;
 * the bright core is a second, un-blurred gradient. Under ?lite=1 the blur is dropped and
 * the orb is a static soft radial gradient.
 */
export function GradientOrb({
  from = "#ff5a1f",
  to = "#1f3fbf",
  mid = "#d62b8f",
  size = 420,
  drift = 0.5,
  intensity = 0.9,
  blur = 28,
  spark = false,
  className = "",
  style,
}: GradientOrbProps) {
  const mode = useSkinMode();
  const d = mode.still ? 0 : drift;
  const s = typeof size === "number" ? `${size}px` : size;
  const vars = {
    "--o-from": from,
    "--o-mid": mid,
    "--o-to": to,
    "--o-size": s,
    "--o-blur": mode.lite ? "0px" : `${blur}px`,
    "--o-int": intensity,
    "--o-drift": `${(d * 26).toFixed(1)}px`,
    ...style,
  } as CSSProperties;
  return (
    <div className={`sk-orb ${d > 0 ? "is-drifting" : ""} ${mode.lite ? "is-lite" : ""} ${className}`} style={vars} aria-hidden="true">
      <div className="sk-orb__body" />
      <div className="sk-orb__core" />
      {spark && <SparkFlare className="sk-orb__spark" size={92} />}
    </div>
  );
}

/* ---------------------------------------------------------------- SparkFlare */
export interface SparkFlareProps {
  size?: number;
  color?: string;
  /** Degrees; the long streak is horizontal at 0. */
  angle?: number;
  /** Slow twinkle. Off under reduced motion / lite. */
  twinkle?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Small lens-flare spark: four-point star, a thin streak and a faint ring. Decorative. */
export function SparkFlare({ size = 64, color = "#fff6dc", angle = -18, twinkle = true, className = "", style }: SparkFlareProps) {
  const mode = useSkinMode();
  return (
    <svg
      className={`sk-spark ${twinkle && !mode.still ? "is-twinkling" : ""} ${className}`}
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      style={{ transform: `rotate(${angle}deg)`, ...style }}
    >
      <defs>
        <radialGradient id="sk-spark-core">
          <stop offset="0" stopColor={color} stopOpacity="1" />
          <stop offset="0.35" stopColor={color} stopOpacity="0.55" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sk-spark-streak" x1="-50" x2="50" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.5" stopColor={color} stopOpacity="0.9" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="-50" y="-0.6" width="100" height="1.2" fill="url(#sk-spark-streak)" />
      <path d="M0 -26 C1.5 -5 5 -1.5 26 0 C5 1.5 1.5 5 0 26 C-1.5 5 -5 1.5 -26 0 C-5 -1.5 -1.5 -5 0 -26Z" fill={color} />
      <circle r="12" fill="url(#sk-spark-core)" />
      <circle r="30" fill="none" stroke={color} strokeOpacity="0.28" strokeWidth="0.6" />
    </svg>
  );
}

/* ---------------------------------------------------------------- GrainOverlay */
export interface GrainOverlayProps {
  /** 0..1. Default 0.14. */
  opacity?: number;
  /** "fixed" covers the viewport; "absolute" covers the nearest positioned parent. */
  position?: "fixed" | "absolute";
}

const GRAIN_URI =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** Static film grain (a tiny tiled SVG noise). No animation, no blur: safe in lite mode. */
export function GrainOverlay({ opacity = 0.14, position = "absolute" }: GrainOverlayProps) {
  return (
    <div
      className="sk-grain"
      aria-hidden="true"
      style={{ position, opacity, backgroundImage: GRAIN_URI } as CSSProperties}
    />
  );
}

/* ---------------------------------------------------------------- Stars */
export interface StarsProps {
  /** How many. Default 70. */
  count?: number;
  seed?: number;
}

/** Sparse static stars for the page background (box-shadow-free: one SVG). */
export function Stars({ count = 70, seed = 7 }: StarsProps) {
  const pts = useMemo(() => {
    let a = seed;
    const rnd = () => {
      a = (a * 1664525 + 1013904223) % 4294967296;
      return a / 4294967296;
    };
    return Array.from({ length: count }, () => ({ x: rnd() * 100, y: rnd() * 100, r: 0.4 + rnd() * rnd() * 1.6, o: 0.25 + rnd() * 0.6 }));
  }, [count, seed]);
  return (
    <svg className="sk-stars" aria-hidden="true" width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r * 0.09} fill="#f3e6c8" opacity={p.o} />
      ))}
    </svg>
  );
}

/* ---------------------------------------------------------------- Scene helper */
/** Optional wrapper: positioned dark stage that stacks stars, children and grain. */
export function SkinStage({ children, tone = "ink", className = "" }: { children: ReactNode; tone?: "ink" | "cobalt"; className?: string }) {
  return (
    <div className={`sk-stage sk-stage--${tone} ${className}`}>
      {tone === "ink" && <Stars />}
      {children}
      <GrainOverlay />
    </div>
  );
}
