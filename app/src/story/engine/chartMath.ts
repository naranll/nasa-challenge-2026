/** Small pure helpers for the persistent chart. */

/** A round step so that about `count` ticks cover `max`. */
export function niceStep(max: number, count: number): number {
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  return ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
}

/** Push labels apart so they don't overlap; keeps their order and stays inside [min, max]. */
export function spread(ys: number[], gap: number, min: number, max: number): number[] {
  const order = ys.map((y, i) => [y, i] as const).sort((a, b) => a[0] - b[0]);
  const out = [...ys];
  let prev = -Infinity;
  for (const [y, i] of order) {
    out[i] = Math.max(y, prev + gap, min);
    prev = out[i];
  }
  const over = prev - max;
  if (over > 0) for (const [, i] of order) out[i] -= over;
  return out;
}

/** The year nearest to an x position, given the plot's left edge and width. */
export function nearestYear(x: number, left: number, width: number, years: [number, number]): number {
  const [a, b] = years;
  if (b === a || width <= 0) return a;
  const t = Math.min(1, Math.max(0, (x - left) / width));
  return Math.round(a + t * (b - a));
}
