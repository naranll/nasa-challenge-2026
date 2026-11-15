import { describe, expect, it } from "vitest";
import { edgePoints, layoutFigure, NODE_COUNT } from "./WorkflowFigure";
import { autoPosition } from "./SeamSlider";

describe("workflow figure layout", () => {
  it("uses two columns on a phone and four on a wide screen, and fits the width", () => {
    const phone = layoutFigure(358);
    const wide = layoutFigure(830);
    expect(phone.cols).toBe(2);
    expect(wide.cols).toBe(4);
    for (const l of [phone, wide]) {
      expect(l.nodes).toHaveLength(NODE_COUNT);
      for (const n of l.nodes) expect(n.x + l.nodeW).toBeLessThanOrEqual(l.cols === 2 ? 358 : 830);
    }
  });

  it("snakes: the second row runs right to left, so step 5 sits under step 4", () => {
    const { nodes } = layoutFigure(830);
    expect(nodes[3].col).toBe(3);
    expect(nodes[4].col).toBe(3);
    expect(nodes[7].col).toBe(0);
    expect(nodes[4].y).toBeGreaterThan(nodes[3].y);
  });

  it("draws every arrow between the facing edges of consecutive nodes", () => {
    const l = layoutFigure(830);
    const [x1, y1, x2, y2] = edgePoints(l.nodes[0], l.nodes[1], l.nodeW);
    expect(x2).toBeGreaterThan(x1);
    expect(y1).toBe(y2);
    const [dx1, dy1, dx2, dy2] = edgePoints(l.nodes[3], l.nodes[4], l.nodeW);
    expect(dx1).toBe(dx2); // straight down to the next row
    expect(dy2).toBeGreaterThan(dy1);
    const [bx1, , bx2] = edgePoints(l.nodes[4], l.nodes[5], l.nodeW);
    expect(bx2).toBeLessThan(bx1); // second row points left
  });
});

describe("seam slider position", () => {
  it("rests in the middle with reduced motion, and sweeps right as the chapter scrolls", () => {
    expect(autoPosition(0.3, true)).toBe(50);
    expect(autoPosition(0, false)).toBeLessThan(autoPosition(1, false));
    expect(autoPosition(-1, false)).toBe(autoPosition(0, false));
    expect(autoPosition(9, false)).toBe(autoPosition(1, false));
  });
});
