import { useMemo, useState } from "react";
import { CalendarHeatmap, CalendarLegend } from "../calendar/CalendarHeatmap";
import { calendarGrid, sharedMax, type CalendarView } from "../calendar/calendarData";
import { ViewSwitch } from "../calendar/ViewSwitch";
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
  const [view, setView] = useState<CalendarView>("harmonized");

  // One scale for both views, so switching to Raw shows the jump instead of rescaling it away.
  const grids = useMemo(() => (cal ? { raw: calendarGrid(cal, "raw"), harmonized: calendarGrid(cal, "harmonized") } : null), [cal]);
  const max = grids ? sharedMax([grids.raw, grids.harmonized]) : 0;
  const name = region ? (lang === "mn" ? region.name_mn : region.name_en) : "";

  return (
    <section className="dashboard">
      <h1>{t("nav.dashboard")}</h1>
      <p>{t("page.dashboard.lead")}</p>
      {regionsFile.status === "error" || calendar.status === "error" ? (
        <p role="alert">{t("data.error")}</p>
      ) : regions === null || grids === null ? (
        <p aria-busy="true">{t("data.loading")}</p>
      ) : (
        <>
          <div className="dashboard-controls">
            <label>
              {t("dash.region")}{" "}
              <select value={region?.region_id} onChange={(e) => setRegionId(e.target.value)}>
                {regions.map((r) => (
                  <option key={r.region_id} value={r.region_id}>
                    {lang === "mn" ? r.name_mn : r.name_en}
                  </option>
                ))}
              </select>
            </label>
            <ViewSwitch value={view} onChange={setView} />
          </div>
          <CalendarHeatmap
            rows={grids[view]}
            view={view}
            max={max}
            title={t(view === "raw" ? "dash.calendar.raw" : "dash.calendar.harmonized", { region: name })}
          />
          <CalendarLegend max={max} />
          <p className="chart-note">{t(view === "raw" ? "dash.note.raw" : "dash.note.harmonized")}</p>
        </>
      )}
      <WorldMapSection />
    </section>
  );
}
