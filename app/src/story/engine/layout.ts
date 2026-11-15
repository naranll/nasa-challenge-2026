/** Pure scroll maths: where each chapter starts, and which one a scroll position falls in. */

export interface Range {
  /** Scroll offset (in viewport heights, from the top of the story) where the chapter starts. */
  start: number;
  /** Where it ends. */
  end: number;
}

/** The stage is pinned for (total - 1) viewport heights; the last 100 vh scrolls it away. */
export const EXIT_VH = 100;

export function chapterRanges(lengthsVh: number[]): Range[] {
  let start = 0;
  return lengthsVh.map((len, i) => {
    const isLast = i === lengthsVh.length - 1;
    const end = start + (isLast ? Math.max(len - EXIT_VH, 1) : len);
    const r = { start, end };
    start += len;
    return r;
  });
}

export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Which chapter a scroll offset (in vh) is in, and progress 0..1 inside it. */
export function locate(ranges: Range[], scrolledVh: number): { index: number; progress: number } {
  if (ranges.length === 0) return { index: 0, progress: 0 };
  let index = 0;
  for (let i = 0; i < ranges.length; i++) if (scrolledVh >= ranges[i].start) index = i;
  const { start, end } = ranges[index];
  return { index, progress: clamp01((scrolledVh - start) / (end - start)) };
}

/** "ch7-handover" -> "07". Chapters are numbered from their id, as in the brief (ch0 ... ch10). */
export function chapterNumber(id: string): string {
  const n = /^ch(\d+)/.exec(id)?.[1];
  return n === undefined ? "--" : n.padStart(2, "0");
}

/** How much of the 3D globe shows (1) versus the flat Earth limb of the backdrop (0), from globe brightness. */
export function presence(brightness: number): number {
  const t = clamp01((brightness - 0.3) / 0.25);
  return t * t * (3 - 2 * t);
}

/** How far the top of the story has scrolled above the top of the viewport, in vh. */
export function scrolledVh(containerTop: number, viewportHeight: number): number {
  return viewportHeight > 0 ? -containerTop / (viewportHeight / 100) : 0;
}
