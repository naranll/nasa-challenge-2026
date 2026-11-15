/**
 * Colour-blind-safe sequential ramp (cividis-like, PLAN §4 Calendar): dark blue -> grey -> yellow.
 * Used by the calendars and the globes so one colour means one count everywhere on a page.
 */
const STOPS: [number, number, number][] = [
  [0, 34, 78],
  [56, 66, 108],
  [102, 105, 112],
  [152, 149, 117],
  [207, 196, 104],
  [255, 234, 70],
];

/** Colour for `value` on a 0..max linear scale. */
export function rampColor(value: number, max: number): string {
  const t = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const x = t * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x));
  const f = x - i;
  const c = STOPS[i].map((a, k) => Math.round(a + (STOPS[i + 1][k] - a) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** CSS gradient of the whole ramp, for legends. */
export const RAMP_GRADIENT = `linear-gradient(to right, ${STOPS.map((c) => `rgb(${c.join(", ")})`).join(", ")})`;

/**
 * Same ramp on a square-root scale, for the calendar: one record month would otherwise turn every
 * other month the same dark blue. The legend marks max / 4 at the middle of the ramp.
 */
export function sqrtRampColor(value: number, max: number): string {
  return rampColor(Math.sqrt(Math.max(0, value)), Math.sqrt(Math.max(0, max)));
}
