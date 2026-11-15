import type { Lang } from "../i18n";

/** "2012-02" -> "Feb 2012" (en) or "2012.02" (mn, the usual Mongolian numeric form). */
export function formatMonth(ym: string, lang: Lang): string {
  if (lang === "mn") return ym.replace("-", ".");
  const d = new Date(`${ym}-01T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", timeZone: "UTC" }).format(d);
}
