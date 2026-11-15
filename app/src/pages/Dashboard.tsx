import { useMemo, useState } from "react";
import { CalendarHeatmap, CalendarLegend } from "../calendar/CalendarHeatmap";
import { calendarGrid, hasValues, sharedMax, type CalendarView } from "../calendar/calendarData";
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
  /** null = not chosen yet: open on Harmonized when it has values, else on Raw (never on an empty grid). */
  const [picked, setPicked] = useState<CalendarView | null>(null);

  // One scale for both views, so switching to Raw shows the jump instead of rescaling it away.
  const grids = useMemo(() => (cal ? { raw: calendarGrid(cal, "raw"), harmonized: calendarGrid(cal, "harmonized") } : null), [cal]);
  const empty = useMemo(
    () => (grids ? (["raw", "harmonized"] as const).filter((v) => !hasValues(grids[v])) : []),
    [grids],
  );
  const view: CalendarView = picked ?? (empty.includes("harmonized") ? "raw" : "harmonized");
  const max = grids ? sharedMax([grids.raw, grids.harmonized]) : 0;
  const name = region ? ((lang === "mn" ? region.name_mn : null) ?? region.name_en) : "";

  return (
    <div className="dashboard">
      <header className="dash-hero">
        <p className="eyebrow">{t("app.title")}</p>
        <h1>{t("nav.dashboard")}</h1>
        <p className="dash-lead">{t("page.dashboard.lead")}</p>
      </header>

      <section className="panel" aria-labelledby="calendar-title">
        {regionsFile.status === "error" || calendar.status === "error" ? (
          <p role="alert">{t("data.error")}</p>
        ) : regions === null || grids === null ? (
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
              <ViewSwitch value={view} onChange={setPicked} empty={empty} />
            </div>
            <CalendarHeatmap
              rows={grids[view]}
              view={view}
              max={max}
              title={t(view === "raw" ? "dash.calendar.raw" : "dash.calendar.harmonized", { region: name })}
            />
            {hasValues(grids[view]) && (
              <>
                <CalendarLegend max={max} />
                <p className="chart-note">{t(view === "raw" ? "dash.note.raw" : "dash.note.harmonized")}</p>
              </>
            )}
          </>
        )}
      </section>

      <WorldMapSection />
    </div>
  );
}
