/**
 * Lazy font loader. Drop .woff2 files in app/src/story/assets/fonts/ and they are registered through the FontFace
 * API the first time the story opens; nothing is downloaded otherwise, and no file means the system stack.
 *
 *   display.woff2   display-italic.woff2   display-300.woff2   (headlines; add a weight to name a weight)
 *   body.woff2      body-italic.woff2
 *   mono.woff2
 *
 * Files must include Cyrillic (Өө Үү) or Mongolian text will fall back to the system font for those letters.
 */
const FILES = import.meta.glob<string>("../assets/fonts/*.woff2", { query: "?url", import: "default" });

export interface FontSlot {
  family: "Story Display" | "Story Body" | "Story Mono";
  style: "normal" | "italic";
  weight: string;
}

const FAMILY = { display: "Story Display", body: "Story Body", mono: "Story Mono" } as const;

/** "display-italic.woff2" -> { family: "Story Display", style: "italic", weight: "400" }; null for unknown names. */
export function slotForFile(path: string): FontSlot | null {
  const m = /([^/\\]+)\.woff2$/.exec(path)?.[1].match(/^(display|body|mono)(-italic)?(?:-(\d{3}))?$/);
  if (!m) return null;
  return { family: FAMILY[m[1] as keyof typeof FAMILY], style: m[2] ? "italic" : "normal", weight: m[3] ?? "400" };
}

let loading: Promise<string[]> | null = null;

/** Registers whatever font files exist. Resolves to the list of loaded file names (empty when there are none). */
export function loadStoryFonts(): Promise<string[]> {
  if (typeof document === "undefined" || !("fonts" in document)) return Promise.resolve([]);
  loading ??= Promise.all(
    Object.entries(FILES).map(async ([path, load]) => {
      const slot = slotForFile(path);
      if (!slot) return null;
      try {
        const face = new FontFace(slot.family, `url(${await load()})`, { style: slot.style, weight: slot.weight, display: "swap" });
        document.fonts.add(await face.load());
        return path;
      } catch {
        return null; // a broken font file must never break the story; the system font stays
      }
    }),
  ).then((names) => names.filter((n): n is string => n !== null));
  return loading;
}
