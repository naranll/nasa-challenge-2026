/**
 * "How a satellite detects a fire", as a loop anyone can follow. A satellite glides across the sky; a beam sweeps the ground;
 * where the beam crosses a fire, heat waves rise to the sensor; a zoom lens then shows how that sensor marks it:
 * MODIS (teal) lights ONE big pixel and draws a big dot; VIIRS (indigo) lights SEVERAL small pixels and draws a small triangle.
 * Three captions (1 Fly over, 2 Feel the heat, 3 Mark it) light up in turn. Time-based loop; the parent adds pause/play.
 */
import type { CSSProperties } from "react";
import { easeOut, mix, ramp } from "./kit";

const FIRE = { x: 150, y: 246 };
const LENS = { x: 352, y: 168, r: 58 };
const SKY_Y = 52;

function Satellite({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="var(--story-ink)" stroke="var(--story-cream)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <rect x="-26" y="-12" width="52" height="24" rx="5" />
      <path d="M-26,0 H-62 M26,0 H62" />
      <rect x="-86" y="-10" width="26" height="20" rx="2" stroke={color} />
      <rect x="60" y="-10" width="26" height="20" rx="2" stroke={color} />
      <path d="M-73,-10 V10 M73,-10 V10" stroke={color} strokeWidth="1.6" />
      <circle cx="0" cy="0" r="6.5" stroke={color} />
      <path d="M0,-12 V-22" />
      <circle cx="0" cy="-25" r="3" stroke={color} />
    </g>
  );
}

function Flame({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,-30 C4,-18 16,-14 16,-2 A16,16 0 0 1 -16,-2 C-16,-9 -12,-12 -9,-16 C-8,-9 -4,-9 -2,-10 C-4,-18 -3,-24 0,-30 Z" fill="var(--story-ember)" stroke="var(--story-ink)" strokeWidth="2" strokeLinejoin="round" />
    </g>
  );
}

/** The zoom lens: a pixel grid and how each sensor marks the fire inside it. */
function Lens({ viirs, lit }: { viirs: boolean; lit: number }) {
  const { x, y, r } = LENS;
  const color = viirs ? "var(--story-viirs-bright)" : "var(--story-modis)";
  const n = viirs ? 8 : 3;
  const cell = (r * 1.55) / n;
  const x0 = x - (n * cell) / 2;
  const y0 = y - (n * cell) / 2;
  // the lit pixels: one big MODIS pixel (centre) or a small cluster of VIIRS pixels
  const litCells: [number, number][] = viirs ? [[3, 3], [4, 3], [3, 4]] : [[1, 1]];
  const id = viirs ? "lens-v" : "lens-m";
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <circle cx={x} cy={y} r={r - 3} />
        </clipPath>
      </defs>
      <circle cx={x} cy={y} r={r} fill="var(--story-plate)" stroke={color} strokeWidth="3" />
      <g clipPath={`url(#${id})`}>
        {Array.from({ length: n * n }, (_, i) => {
          const cx = i % n;
          const cy = Math.floor(i / n);
          const on = litCells.some(([a, b]) => a === cx && b === cy);
          return <rect key={i} x={x0 + cx * cell} y={y0 + cy * cell} width={cell} height={cell} fill={on ? "var(--story-ember)" : "none"} fillOpacity={on ? lit : 0} stroke={color} strokeOpacity="0.5" strokeWidth="1.4" />;
        })}
        {viirs ? (
          <path d={`M${x - cell * 0.5},${y + cell * 0.2} L${x + cell * 0.5},${y + cell * 0.2} L${x},${y - cell * 0.9} Z`} fill="var(--story-ember)" stroke={color} strokeWidth="2.4" strokeLinejoin="round" opacity={lit} transform={`translate(${cell * 0.5} ${cell * 0.55}) scale(1)`} />
        ) : (
          <circle cx={x} cy={y} r={cell * 0.38} fill="var(--story-ember)" stroke={color} strokeWidth="2.6" opacity={lit} />
        )}
      </g>
    </g>
  );
}

/** `loop` 0..1. Phase A (0..0.5) = MODIS pass, phase B (0.5..1) = VIIRS pass. Returns the SVG and which caption is active. */
export function detectState(loop: number) {
  const viirs = loop >= 0.5;
  const t = viirs ? (loop - 0.5) * 2 : loop * 2; // 0..1 inside the pass
  const fly = ramp(t, 0.05, 0.55); // satellite crosses the sky at an even pace
  const sx = mix(104, 300, fly);
  const near = 1 - Math.min(1, Math.abs(sx - FIRE.x) / 60); // 1 right above the fire
  const heat = ramp(near, 0.3, 0.75);
  const lit = ramp(t, 0.36, 0.5) * (1 - ramp(t, 0.94, 1));
  const out = ramp(t, 0.94, 1) + 0 * easeOut(0);
  return { viirs, t, sx, near, heat, lit, out, step: t < 0.5 ? (heat > 0.05 ? 1 : 0) : t < 0.94 ? 2 : 2 };
}

export function DetectDemo({ loop, labels }: { loop: number; labels: [string, string, string, string, string] }) {
  const s = detectState(loop);
  const color = s.viirs ? "var(--story-viirs-bright)" : "var(--story-modis)";
  const beamW = s.viirs ? 34 : 70; // VIIRS beam is narrower per pixel but we draw the swath width; keep readable
  const wave = (i: number): CSSProperties => ({ opacity: s.heat * (1 - i * 0.2) });
  const step = s.lit > 0.2 ? 2 : s.heat > 0.1 ? 1 : 0;
  return (
    <div className="dd">
      <svg className="dd-svg" viewBox="0 0 440 300" role="img" aria-label={labels[4]} focusable="false">
        <rect x="2" y="2" width="436" height="296" rx="26" fill="var(--story-plate)" />
        {/* sky: orbit line and ground */}
        <path d="M20,60 Q220,22 420,60" fill="none" stroke="var(--story-faint)" strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" />
        <path d="M2,262 Q80,244 150,256 T290,250 T438,262 V274 Q438,298 414,298 H26 Q2,298 2,274 Z" fill="var(--story-modis-deep)" fillOpacity="0.18" stroke="var(--story-hairline)" strokeWidth="2" />
        {/* beam: from the sensor to the ground */}
        <g opacity={1 - s.out}>
          <path d={`M${s.sx},${SKY_Y + 14} L${s.sx - beamW / 2 - 18},258 L${s.sx + beamW / 2 + 18},258 Z`} fill={color} fillOpacity="0.14" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeDasharray="6 7" />
          <Satellite x={s.sx} y={SKY_Y} color={color} />
        </g>
        {/* the fire and its heat rising to the sensor */}
        <Flame x={FIRE.x} y={FIRE.y + 6} s={1.1} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${FIRE.x - 18 + i * 18},${FIRE.y - 38} q-9,-16 0,-32 t0,-32`} fill="none" stroke="var(--story-ember)" strokeWidth="3" strokeLinecap="round" style={wave(i)} />
        ))}
        {/* connector and lens */}
        <path d={`M${FIRE.x + 20},${FIRE.y - 10} Q${FIRE.x + 90},${FIRE.y - 20} ${LENS.x - 52},${LENS.y + 30}`} fill="none" stroke={color} strokeWidth="2.4" strokeDasharray="2 8" strokeLinecap="round" opacity={s.lit > 0.05 ? 0.9 : 0.25} />
        <g opacity={0.35 + 0.65 * Math.max(s.lit, s.heat)}>
          <Lens viirs={s.viirs} lit={s.lit} />
        </g>
        <text x={LENS.x} y={LENS.y + LENS.r + 22} textAnchor="middle" className="dd-cap" fill="var(--story-cream)" opacity={s.lit}>
          {s.viirs ? labels[3] : labels[2]}
        </text>
      </svg>
      <ol className="dd-steps" aria-hidden="true">
        {[labels[0], labels[1], s.viirs ? labels[3] : labels[2]].map((txt, i) => (
          <li key={i} className={step >= i ? "is-on" : ""} data-sensor={s.viirs ? "viirs" : "modis"}>
            <span>{i + 1}</span>
            {txt}
          </li>
        ))}
      </ol>
    </div>
  );
}
