import type { CSSProperties, ReactNode } from "react";
import { SparkFlare } from "./Atmos";

export interface TwoHandsProps {
  /** Content in the gap between the fingertips (a light burst). Default: a SparkFlare. */
  children?: ReactNode;
  /** Line colours: left hand, right hand. Default cyan + cream. */
  left?: string;
  right?: string;
  /** Width in px. Height follows (5:2). */
  width?: number;
  className?: string;
}

/**
 * Original line art: two hands reaching toward each other, fingertips almost touching, a slot of
 * light between. A nod to the idea of the Creation of Adam, not a trace and not its figures:
 * simplified geometric hands, one relaxed and one firm.
 */
export function TwoHands({ children, left = "#19d9ee", right = "#f3e6c8", width = 640, className = "" }: TwoHandsProps) {
  const hand = (color: string, tipY: number) => (
    <g stroke={color} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {/* forearm and wrist cuff */}
      <path d="M0 120C50 120 90 116 128 112" />
      <path d="M0 186C50 186 92 180 132 172" />
      <path d="M116 109C123 130 124 152 128 176" />
      {/* back of hand into the index finger (tip height differs: relaxed vs firm) */}
      <path d={`M128 112C160 100 196 98 226 102L292 ${tipY}`} />
      <path d={`M292 ${tipY}C302 ${tipY + 3} 301 ${tipY + 16} 291 ${tipY + 17}L232 134`} />
      {/* three curled fingers */}
      <path d="M232 134C256 132 262 150 244 156" />
      <path d="M240 156C262 156 266 174 246 178" />
      <path d="M244 178C262 180 262 196 240 198" />
      {/* palm edge and thumb */}
      <path d="M240 198C196 208 156 196 132 172" />
      <path d="M170 150C180 128 214 126 226 138" />
    </g>
  );
  return (
    <div className={`sk-hands ${className}`} style={{ width, "--hands-w": `${width}px` } as CSSProperties} role="img" aria-label="Two hands reaching toward each other, stylized illustration">
      <svg viewBox="0 0 640 250" className="sk-hands__svg" aria-hidden="true">
        {hand(left, 126)}
        {/* mirrored, slightly higher, finger straight */}
        <g transform="translate(640 -16) scale(-1 1)">{hand(right, 108)}</g>
      </svg>
      <div className="sk-hands__slot">{children ?? <SparkFlare size={Math.round(width * 0.18)} angle={0} />}</div>
    </div>
  );
}
