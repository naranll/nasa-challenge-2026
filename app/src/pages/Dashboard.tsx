import { useMemo, useState } from "react";
import { CalendarHeatmap, CalendarLegend } from "../calendar/CalendarHeatmap";
import { calendarGrid, hasValues, sharedMax, type CalendarView } from "../calendar/calendarData";
import type { CalendarFile, RegionsFile } from "../data/contracts";
import { dataOf, useDataFile } from "../data/useDataFile";
import { useI18n } from "../i18n";
import { WorldMapSection } from "../world/WorldMapSection";

const DEFAULT_REGION = "mongolia";

export default function Dashboard() {
  const { t, lang } = useI18n();
  const regionsFile = useDataFile<RegionsFile>("regions.json");
  const regions = dataOf(regionsFile)?.regions ?? null;
  const [regionId, setRegionId] = useState(DEFAULT_REGION);
  const region = regions?.find((r) => r.region_id === regionId) ?? regions?.[0] ?? null;
  const calendar = useDataFile<CalendarFile>(region ? `calendar/${region.region_id}.json` : null);
  const cal = dataOf(calendar);
  // Raw counts only: the Harmonized view was removed from the dashboard.
  const view: CalendarView = "raw";
  const grid = useMemo(() => (cal ? calendarGrid(cal, "raw") : null), [cal]);
  const max = grid ? sharedMax([grid]) : 0;
  const name = region ? ((lang === "mn" ? region.name_mn : null) ?? region.name_en) : "";

  return (
    <div className="dashboard">
      <header className="dash-hero">
        <h1>{t("nav.dashboard")}</h1>
        <p className="dash-lead">{t("page.dashboard.lead")}</p>
      </header>

      <section className="panel" aria-labelledby="calendar-title">
        {regionsFile.status === "error" || calendar.status === "error" ? (
          <p role="alert">{t("data.error")}</p>
        ) : regions === null || grid === null ? (
          <p aria-busy="true" className="panel-loading">
            {t("data.loading")}
          </p>
        ) : (
          <>
            <div className="dashboard-controls">
              <label className="field">
                <span className="field-label" id="calendar-title">
                  {t("dash.region")}
                </span>
                <select value={region?.region_id} onChange={(e) => setRegionId(e.target.value)}>
                  {regions.map((r) => (
                    <option key={r.region_id} value={r.region_id}>
                      {(lang === "mn" ? r.name_mn : null) ?? r.name_en}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <CalendarHeatmap
              rows={grid}
              view={view}
              max={max}
              title={t("dash.calendar.raw", { region: name })}
            />
            {hasValues(grid) && (
              <>
                <CalendarLegend max={max} />
                <p className="chart-note">{t("dash.note.raw")}</p>
              </>
            )}
          </>
        )}
      </section>

      <WorldMapSection />
    </div>
  );
}
