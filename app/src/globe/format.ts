import type { Lang } from "../i18n";

const LOCALE: Record<Lang, string> = { en: "en-GB", mn: "mn-MN" };

/** "2026-11-02" -> a locale date. Dates in the data are calendar dates, so format in UTC (spec A32). */
export function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  const fmt = new Intl.DateTimeFormat(LOCALE[lang], { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  // Some browsers ship without Mongolian date names and silently fall back to English;
  // then use the usual Mongolian numeric form, YYYY.MM.DD.
  if (lang === "mn" && !fmt.resolvedOptions().locale.startsWith("mn")) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;
  }
  return fmt.format(d);
}

export function formatNumber(n: number, lang: Lang, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(LOCALE[lang], options).format(n);
}
