/**
 * Chapter 8, "Figure 1": the harmonization workflow, paper style (light plate, ink hairlines, numbered caption).
 * Eight nodes are drawn one after another, each followed by its arrow. Two columns on a phone, four on a wide
 * screen; the path snakes so every arrow still points to the next step. A simplified illustration, not to scale.
 * Reduced motion and low bandwidth show the finished figure.
 */
import { useRef } from "react";
import { useElementSize } from "../../globe/env";
import { useCalendar } from "../data/adapters";
import { nodeFraction, wrapLabel } from "../data/handover";
import { useStoryText, type StoryKey } from "../strings";

export const NODE_COUNT = 8;
const PAD = 12;
const GAP_X = 28;
const GAP_Y = 30;
const NODE_H = 54;
const CHAR_W = 5.4; // approx. width of a 9.5px mono character

export interface NodePos {
  i: number;
  x: number;
  y: number;
  col: number;
  row: number;
}

export interface FigureLayout {
  cols: number;
  nodeW: number;
  height: number;
  nodes: NodePos[];
}

/** Snake layout: row 0 runs left to right, row 1 right to left, and so on. */
export function layoutFigure(width: number, n = NODE_COUNT): FigureLayout {
  const cols = width >= 560 ? 4 : 2;
  const nodeW = (width - 2 * PAD - (cols - 1) * GAP_X) / cols;
  const rows = Math.ceil(n / cols);
  const nodes = Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / cols);
    const k = i % cols;
    const col = row % 2 === 0 ? k : cols - 1 - k;
    return { i, row, col, x: PAD + col * (nodeW + GAP_X), y: PAD + row * (NODE_H + GAP_Y) };
  });
  return { cols, nodeW, height: PAD * 2 + rows * NODE_H + (rows - 1) * GAP_Y, nodes };
}

/** The arrow from node `a` to node `b`: a straight line between their facing edges. */
export function edgePoints(a: NodePos, b: NodePos, nodeW: number): [number, number, number, number] {
  if (a.row !== b.row) return [a.x + nodeW / 2, a.y + NODE_H, b.x + nodeW / 2, b.y]; // down to the next row
  return b.col > a.col ? [a.x + nodeW, a.y + NODE_H / 2, b.x, b.y + NODE_H / 2] : [a.x, a.y + NODE_H / 2, b.x + nodeW, b.y + NODE_H / 2];
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function WorkflowFigure({ progress, still }: { progress: number; still: boolean }) {
  const s = useStoryText();
  const box = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(box);
  const calendar = useCalendar();
  const unit = calendar.status === "ok" ? calendar.data.unit : undefined;
  const p = still ? 1 : progress;
  const layout = width > 0 ? layoutFigure(width) : null;
  const chars = layout ? Math.max(8, Math.floor((layout.nodeW - 34) / CHAR_W)) : 20;

  return (
    <figure className="story-figure">
      <div ref={box} className="story-figure-plate">
        {layout && (
          <svg width={width} height={layout.height} role="img" aria-label={s("figure.alt")}>
            {layout.nodes.map((n) => {
              // Each node takes 70% of its slot to draw, its arrow the other 30%.
              const slot = nodeFraction(p, NODE_COUNT, n.i);
              const f = clamp01(slot / 0.7);
              const e = clamp01((slot - 0.7) / 0.3);
              const next = layout.nodes[n.i + 1];
              const lines = wrapLabel(s(`node.${n.i + 1}` as StoryKey), chars).slice(0, 3);
              const out = n.i === 6; // the harmonized series is the figure's result
              return (
                <g key={n.i}>
                  <rect x={n.x} y={n.y} width={layout.nodeW} height={NODE_H} rx={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - f} className={out ? "fig-node fig-out" : "fig-node"} />
                  <g opacity={clamp01((f - 0.55) / 0.45)}>
                    <text x={n.x + 7} y={n.y + 12} className="fig-n">
                      {n.i + 1}
                    </text>
                    <text x={n.x + layout.nodeW / 2} y={n.y + NODE_H / 2 - ((lines.length - 1) * 11) / 2 + 3} textAnchor="middle" className="fig-label">
                      {lines.map((line, k) => (
                        <tspan key={k} x={n.x + layout.nodeW / 2} dy={k === 0 ? 0 : 11}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                  {next &&
                    (() => {
                      const [x1, y1, x2, y2] = edgePoints(n, next, layout.nodeW);
                      const horizontal = y1 === y2;
                      const dir = horizontal ? Math.sign(x2 - x1) : 1;
                      const head = horizontal ? `M${x2 - dir * 5},${y2 - 3} L${x2},${y2} L${x2 - dir * 5},${y2 + 3}` : `M${x2 - 3},${y2 - 5} L${x2},${y2} L${x2 + 3},${y2 - 5}`;
                      return (
                        <g>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - e} className="fig-edge" />
                          <path d={head} fill="none" className="fig-edge" opacity={e >= 1 ? 1 : 0} />
                        </g>
                      );
                    })()}
                </g>
              );
            })}
          </svg>
        )}
      </div>
      <figcaption className="story-figure-caption">
        <strong>{s("figure.label")}</strong> {s("figure.caption")}
        {unit && <> {s("figure.unit", { unit })}</>}
      </figcaption>
    </figure>
  );
}
