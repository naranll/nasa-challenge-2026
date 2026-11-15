import type { CSSProperties, ReactNode } from "react";

export type SatelliteId = "terra" | "aqua" | "snpp" | "noaa20" | "noaa21";

const NAMES: Record<SatelliteId, string> = { terra: "Terra", aqua: "Aqua", snpp: "Suomi NPP", noaa20: "NOAA-20", noaa21: "NOAA-21" };

/** Generated art (WebP) in assets/art/<id>.webp is picked up automatically when present. */
const ART = import.meta.glob("../../assets/art/*.webp", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const ART_BY_ID: Partial<Record<string, string>> = Object.fromEntries(Object.entries(ART).map(([p, u]) => [p.split("/").pop()!.replace(".webp", ""), u]));
/** Ids that have generated art (so the preview can say which are generated vs SVG fallback). */
export const generatedArtIds = Object.keys(ART_BY_ID);

const C = "#19d9ee"; // cyan line
const W = "#f4f1e8"; // white line

/** Flat two-colour 3px line art, no faces. Fallback when no generated WebP exists. */
function Art({ id }: { id: SatelliteId }) {
  const body = (
    <>
      <rect x="82" y="64" width="56" height="72" rx="6" fill="none" stroke={W} />
      <path d="M82 84h56M82 116h56" stroke={C} />
    </>
  );
  const panel = (x: number, w: number) => (
    <g stroke={C} fill="none">
      <rect x={x} y="70" width={w} height="60" rx="2" />
      <path d={`M${x + w / 3} 70v60M${x + (2 * w) / 3} 70v60M${x} 100h${w}`} strokeWidth="2" />
    </g>
  );
  return (
    <svg viewBox="0 0 220 200" className="sk-sat__art" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {id === "terra" && (
        <>
          {panel(142, 70)}
          <path d="M138 100h4" stroke={W} />
          {body}
          <circle cx="110" cy="48" r="10" stroke={W} />
          <path d="M110 58v6" stroke={W} />
        </>
      )}
      {id === "aqua" && (
        <>
          {panel(8, 70)}
          <path d="M78 100h4" stroke={W} />
          {body}
          <path d="M96 64c0-18 28-18 28 0" stroke={W} />
          <path d="M110 46v-14" stroke={C} />
          <circle cx="110" cy="28" r="4" stroke={C} />
        </>
      )}
      {id === "snpp" && (
        <>
          {panel(150, 62)}
          {body}
          <circle cx="110" cy="46" r="14" stroke={W} />
          <path d="M104 46h12M110 40v12" stroke={C} strokeWidth="2" />
          <path d="M82 150l-18 22M138 150l18 22" stroke={W} />
        </>
      )}
      {id === "noaa20" && (
        <>
          {panel(10, 66)}
          {panel(144, 66)}
          <path d="M76 100h6M138 100h6" stroke={W} />
          {body}
          <path d="M96 64l-6-20h40l-6 20" stroke={W} />
          <circle cx="110" cy="40" r="4" stroke={C} />
        </>
      )}
      {id === "noaa21" && (
        <>
          {panel(10, 66)}
          {panel(144, 66)}
          <path d="M76 100h6M138 100h6" stroke={W} />
          {body}
          <path d="M96 64l-6-20h40l-6 20" stroke={W} />
          <path d="M110 36l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" stroke={C} strokeWidth="2" />
        </>
      )}
      <path d="M90 152c10 8 30 8 40 0" stroke={C} strokeDasharray="1 7" />
    </svg>
  );
}

export interface CartoonSatelliteProps {
  id: SatelliteId;
  /** Override image (e.g. a generated WebP URL). Otherwise assets/art/<id>.webp, else the SVG fallback. */
  src?: string;
  /** Rendered width in px. */
  size?: number;
  /** Short speech bubble (<= 14 words). */
  bubble?: string;
  /** Circle inset panel content (e.g. a tiny orbit or pixel diagram). */
  inset?: ReactNode;
  /** Print the "stylized illustration" label (default true; required wherever the art appears). */
  label?: boolean;
  className?: string;
}

/** Flat two-colour satellite character. Always labelled "stylized illustration". No faces. */
export function CartoonSatellite({ id, src, size = 220, bubble, inset, label = true, className = "" }: CartoonSatelliteProps) {
  const url = src ?? ART_BY_ID[id];
  const name = NAMES[id];
  return (
    <figure className={`sk-sat ${className}`} style={{ width: size } as CSSProperties}>
      <div className="sk-sat__stage">
        {url ? <img className="sk-sat__img" src={url} alt={`${name}, stylized illustration`} width={size} loading="lazy" decoding="async" /> : <div role="img" aria-label={`${name}, stylized illustration`}><Art id={id} /></div>}
        {bubble && <p className="sk-sat__bubble">{bubble}</p>}
        {inset && <div className="sk-sat__inset">{inset}</div>}
      </div>
      {label && <figcaption className="sk-sat__cap">{name} · stylized illustration</figcaption>}
    </figure>
  );
}
