import { useMemo, type CSSProperties, type ReactNode } from "react";

/* ---------------------------------------------------------------- TrackedCaption */
export interface TrackedCaptionProps {
  children: string;
  as?: "span" | "p" | "div" | "h2" | "h3";
  size?: "micro" | "caption";
  tone?: "cream" | "dim" | "pink" | "lime";
  /** Extra wide tracking for one-word labels. */
  wide?: boolean;
  className?: string;
}

/**
 * Widely tracked UPPERCASE mono. Short labels only: text longer than 40 characters is rendered
 * sentence-case with normal tracking (never shout long Mongolian text).
 */
export function TrackedCaption({ children, as: Tag = "span", size = "caption", tone = "cream", wide = false, className = "" }: TrackedCaptionProps) {
  const long = children.length > 40;
  return (
    <Tag className={`sk-cap sk-cap--${size} sk-cap--${tone} ${wide ? "is-wide" : ""} ${long ? "is-long" : ""} ${className}`}>{children}</Tag>
  );
}

/* ---------------------------------------------------------------- GlyphTile */
export interface GlyphTileProps {
  /** One glyph or tiny inline SVG. Decorative unless you pass `label`. */
  children: ReactNode;
  size?: number;
  tone?: "cream" | "modis" | "viirs" | "fire" | "lime" | "pink";
  /** Accessible name; omit for decorative (aria-hidden). */
  label?: string;
}

/** A tiny glyph in a thin square. */
export function GlyphTile({ children, size = 28, tone = "cream", label }: GlyphTileProps) {
  return (
    <span
      className={`sk-glyph sk-glyph--${tone}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- HairlineFrame */
export interface HairlineFrameProps {
  /** Circle markers at the four corners. Default true. */
  corners?: boolean;
  /** Thin diagonals as [x1,y1,x2,y2] in percent of the frame. */
  diagonals?: Array<[number, number, number, number]>;
  /** Faint hairline grid, cell size in px. 0 = none. */
  grid?: number;
  /** Corner coordinate texts: [top-left, top-right, bottom-left, bottom-right]. */
  coords?: [string?, string?, string?, string?];
  /** Barcode string (seeded pattern) along the bottom edge. */
  barcode?: string;
  /** Inset from the container edge in px. */
  inset?: number;
  className?: string;
}

function barcodeBars(seed: string): number[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const out: number[] = [];
  for (let i = 0; i < 38; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    out.push(1 + (h % 4));
  }
  return out;
}

/**
 * Decorative micro-detail: circle markers, diagonals, coordinates, barcode. Always aria-hidden and
 * pointer-events none; never carries meaning. Place inside a `position: relative` container.
 */
export function HairlineFrame({ corners = true, diagonals = [], grid = 0, coords, barcode, inset = 14, className = "" }: HairlineFrameProps) {
  const bars = useMemo(() => (barcode ? barcodeBars(barcode) : []), [barcode]);
  const style = { "--hf-inset": `${inset}px`, "--hf-grid": `${grid}px` } as CSSProperties;
  return (
    <div className={`sk-frame ${grid ? "has-grid" : ""} ${className}`} style={style} aria-hidden="true">
      {diagonals.length > 0 && (
        <svg className="sk-frame__diag" viewBox="0 0 100 100" preserveAspectRatio="none">
          {diagonals.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      )}
      {corners && (
        <>
          <i className="sk-frame__dot tl" />
          <i className="sk-frame__dot tr" />
          <i className="sk-frame__dot bl" />
          <i className="sk-frame__dot br" />
        </>
      )}
      {coords?.[0] && <span className="sk-frame__coord tl">{coords[0]}</span>}
      {coords?.[1] && <span className="sk-frame__coord tr">{coords[1]}</span>}
      {coords?.[2] && <span className="sk-frame__coord bl">{coords[2]}</span>}
      {coords?.[3] && <span className="sk-frame__coord br">{coords[3]}</span>}
      {bars.length > 0 && (
        <span className="sk-frame__barcode">
          {bars.map((w, i) => (
            <b key={i} style={{ width: w }} />
          ))}
        </span>
      )}
    </div>
  );
}
