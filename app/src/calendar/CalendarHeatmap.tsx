/** Calendar heatmap (PLAN §4 Calendar): rows = years, columns = months, darker = fewer hotspots. */
import { useMemo } from "react";
import { formatNumber } from "../globe/format";
import { nameKey } from "../globe/platforms";
import { useI18n, type Lang } from "../i18n";
import "./calendar.css";
import { hasValues, type CalendarRow, type CalendarView } from "./calendarData";
import { RAMP_GRADIENT, rampColor } from "./scale";

const MONTH_INDEXES = Array.from({ length: 12 }, (_, i) => i);

function monthNames(lang: Lang): string[] {
  const fmt = new Intl.DateTimeFormat(lang === "mn" ? "mn-MN" : "en-GB", { month: "short", timeZone: "UTC" });
  return MONTH_INDEXES.map((i) => {
    const d = new Date(0); // any year: only the month name is used
    d.setUTCMonth(i, 15);
    return fmt.format(d);
  });
}

interface Props {
  rows: CalendarRow[];
  view: CalendarView;
  /** Shared scale maximum, so calendars side by side are comparable. */
  max: number;
  title: string;
}

export function CalendarHeatmap({ rows, view, max, title }: Props) {
  const { t, lang } = useI18n();
  const months = useMemo(() => monthNames(lang), [lang]);
  const describe = (c: CalendarRow["cells"][number]) => {
    if (c.forecast) return t("cal.cell.forecast", { ym: c.ym });
    if (c.value === null) return t("cal.cell.unknown", { ym: c.ym });
    const n = formatNumber(c.value, lang);
    return view === "raw" && c.platform
      ? t("cal.cell.raw", { ym: c.ym, n, platform: t(nameKey(c.platform)) })
      : t("cal.cell.harmonized", { ym: c.ym, n });
  };

  // Contract rule 4: unknown is not zero, and the UI says so in words instead of drawing an empty grid.
  if (!hasValues(rows)) {
    return (
      <figure className="calendar" data-view={view} data-no-values>
        <figcaption>{title}</figcaption>
        <p className="chart-note" role="note">
          {t(view === "harmonized" ? "cal.empty.harmonized" : "cal.empty.raw")}
        </p>
      </figure>
    );
  }

  return (
    <figure className="calendar" data-view={view}>
      <figcaption>{title}</figcaption>
      <div className="calendar-scroll">
        <table className="calendar-grid">
          <thead>
            <tr>
              <th scope="col" className="calendar-corner">
                <span className="sr-only">{t("cal.year")}</span>
              </th>
              {months.map((m) => (
                <th key={m} scope="col">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.year}>
                <th scope="row">{r.year}</th>
                {r.cells.map((c) => (
                  <td
                    key={c.ym}
                    title={describe(c)}
                    aria-label={describe(c)}
                    data-empty={!c.inFile || undefined}
                    data-forecast={c.forecast || undefined}
                    data-noaa20={c.noaa20Derived || undefined}
                    data-partial={c.partialMonth || undefined}
                    style={c.value !== null ? { background: rampColor(c.value, max) } : undefined}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** One legend for one or more calendars sharing `max`, with the meaning of the dashed marks. */
export function CalendarLegend({ max }: { max: number }) {
  const { t, lang } = useI18n();
  return (
    <div className="calendar-legend">
      <span>{formatNumber(0, lang)}</span>
      <span className="calendar-ramp" style={{ background: RAMP_GRADIENT }} aria-hidden="true" />
      <span>{formatNumber(max, lang)}</span>
      <span className="calendar-legend-unit">{t("cal.legend.unit")}</span>
      <span className="calendar-key" data-forecast aria-hidden="true" /> <span>{t("cal.legend.forecast")}</span>
      <span className="calendar-key" data-noaa20 aria-hidden="true" /> <span>{t("cal.legend.noaa20")}</span>
      <span className="calendar-key" data-partial aria-hidden="true" /> <span>{t("cal.legend.partial")}</span>
    </div>
  );
}
