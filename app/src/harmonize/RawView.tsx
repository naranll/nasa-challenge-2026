/** Harmonizing page, raw part (Job 4): what data we have, in each satellite's own raw counts. */
import { formatNumber } from "../globe/format";
import "../globe/globe.css"; // shared .chart-* styles
import { nameKey, SENSOR_OF } from "../globe/platforms";
import { useI18n } from "../i18n";
import { formatMonth } from "./format";
import "./harmonize.css";
import { RawMonthlyChart } from "./RawMonthlyChart";
import { monthlySeries, regionSummary, satelliteRows, viirsStart } from "./rawData";
import { useCalendar, useStats } from "./useRawData";

function RegionPart() {
  const { t, lang } = useI18n();
  const calendar = useCalendar();
  if (calendar.status === "loading") return <p className="raw-note">{t("data.loading")}</p>;
  if (calendar.status === "error") return <p className="raw-empty">{t("harmonize.raw.error_counts")}</p>;

  const series = monthlySeries(calendar.data);
  const summary = regionSummary(series);
  const region = t("harmonize.raw.region.mongolia");

  return (
    <>
      <section className="raw-section">
        <h2>{t("harmonize.raw.region.title")}</h2>
        <div className="raw-table-wrap">
          <table className="raw-table">
            <thead>
              <tr>
                <th scope="col">{t("harmonize.raw.region.col_region")}</th>
                <th scope="col">{t("harmonize.raw.region.col_first")}</th>
                <th scope="col">{t("harmonize.raw.region.col_last")}</th>
                <th scope="col" className="num">
                  {t("harmonize.raw.region.col_count")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{region}</th>
                <td>{summary.firstYm ? formatMonth(summary.firstYm, lang) : "—"}</td>
                <td>{summary.lastYm ? formatMonth(summary.lastYm, lang) : "—"}</td>
                <td className="num">{formatNumber(summary.total, lang)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="raw-note">{t("harmonize.raw.region.count_note")}</p>
      </section>

      <section className="raw-section">
        <h2>{t("harmonize.raw.chart.title", { region })}</h2>
        {summary.total === 0 ? (
          <p className="raw-empty">{t("harmonize.raw.chart.empty", { region })}</p>
        ) : (
          <>
            <RawMonthlyChart series={series} viirsStart={viirsStart(series)} />
            <p className="raw-note">{t("harmonize.raw.chart.note")}</p>
          </>
        )}
      </section>
    </>
  );
}

function SatellitePart() {
  const { t, lang } = useI18n();
  const stats = useStats();
  if (stats.status === "loading") return <p className="raw-note">{t("data.loading")}</p>;
  if (stats.status === "error") return <p className="raw-empty">{t("harmonize.raw.error_stats")}</p>;

  const rows = satelliteRows(stats.data);
  return (
    <section className="raw-section">
      <h2>{t("harmonize.raw.sat.title")}</h2>
      <div className="raw-table-wrap">
        <table className="raw-table">
          <thead>
            <tr>
              <th scope="col">{t("harmonize.raw.sat.col_satellite")}</th>
              <th scope="col">{t("harmonize.raw.sat.col_sensor")}</th>
              <th scope="col" className="num">
                {t("harmonize.raw.sat.col_rows")}
              </th>
              <th scope="col">{t("harmonize.raw.sat.col_years")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">{t(nameKey(r.id))}</th>
                <td>{SENSOR_OF[r.id]}</td>
                <td className="num">{r.rows === null ? "—" : formatNumber(r.rows, lang)}</td>
                <td>{r.firstYear !== null && r.lastYear !== null ? `${r.firstYear}–${r.lastYear}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RawView() {
  return (
    <div className="raw-view">
      <RegionPart />
      <SatellitePart />
    </div>
  );
}
