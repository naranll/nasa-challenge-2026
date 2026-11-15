/**
 * Dashboard-ийн World map хэсэг (#31, #34): тив сонгох, VIIRS | MODIS сэлгэх, түүхий hotspot-ын canvas map.
 * index.json-ийг эхэнд, тивийн points файлыг зөвхөн тэр тивийг сонгосон үед ачаална.
 */
import { useState } from "react";
import type { WorldContinentId, WorldIndexFile, WorldPointsFile } from "../data/contracts";
import { dataOf, useDataFile } from "../data/useDataFile";
import { formatDate, formatNumber } from "../globe/format";
import { platformsOf, type Sensor } from "../globe/platforms";
import { useI18n, type MessageKey } from "../i18n";
import "../calendar/calendar.css";
import { WorldMapCanvas } from "./WorldMapCanvas";
import { PLATFORM_COLOR } from "./worldData";
import "./world.css";

/** Монголын баг тул анхдагч нь Ази. Файлд байхгүй бол эхний тив. */
const DEFAULT_CONTINENT: WorldContinentId = "asia";
/** VIIRS эхэнд: NOAA-20 одоогийн reference platform (PLAN D3). */
const SENSOR_ORDER: readonly Sensor[] = ["VIIRS", "MODIS"];

export function WorldMapSection() {
  const { t, lang } = useI18n();
  const indexFile = useDataFile<WorldIndexFile>("world/index.json");
  const index = dataOf(indexFile);
  const [continentId, setContinentId] = useState<WorldContinentId>(DEFAULT_CONTINENT);
  const [sensor, setSensor] = useState<Sensor>("VIIRS");
  const continent = index?.continents.find((c) => c.id === continentId) ?? index?.continents[0] ?? null;
  const pointsFile = useDataFile<WorldPointsFile>(continent ? `world/${continent.points_file}` : null);
  const points = dataOf(pointsFile);

  const period = index
    ? { start: formatDate(index.period.start, lang), end: formatDate(index.period.end, lang) }
    : { start: "", end: "" };
  const continentName = continent ? (lang === "mn" ? continent.name_mn : continent.name_en) : "";
  const sensorName = t(`world.sensor.${sensor}` as MessageKey);
  const shown = continent ? platformsOf(sensor).reduce((n, p) => n + continent.n_by_platform[p], 0) : 0;
  // Бүх dropped key-ийг нэмнэ: contract additive тул хожим нэмэгдэх key ч тоологдоно.
  const dropped = index ? Object.values(index.dropped).reduce((a, b) => a + b, 0) : 0;

  return (
    <section className="world-section" aria-labelledby="world-title">
      <h2 id="world-title">{t("world.title", period)}</h2>
      <p>{t("world.lead")}</p>
      {indexFile.status === "error" ? (
        <p role="alert">{t("data.error")}</p>
      ) : index === null || continent === null ? (
        <p aria-busy="true">{t("data.loading")}</p>
      ) : (
        <>
          <div className="dashboard-controls">
            <label>
              {t("world.continent")}{" "}
              <select value={continent.id} onChange={(e) => setContinentId(e.target.value as WorldContinentId)}>
                {index.continents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "mn" ? c.name_mn : c.name_en}
                  </option>
                ))}
              </select>
            </label>
            <div className="view-switch" role="group" aria-label={t("world.sensor.label")}>
              {SENSOR_ORDER.map((s) => (
                <button key={s} type="button" aria-pressed={sensor === s} onClick={() => setSensor(s)}>
                  {t(`world.sensor.${s}` as MessageKey)}
                </button>
              ))}
            </div>
          </div>
          {/* Тивийн файл ачаалж/алдаа гарч байхад ч сонголтууд үлдэнэ, ингэснээр өөр тив рүү шилжиж болно. */}
          {pointsFile.status === "error" ? (
            <p role="alert">{t("data.error")}</p>
          ) : points === null ? (
            <p aria-busy="true">{t("data.loading")}</p>
          ) : (
            <WorldMapCanvas
              continent={continent}
              file={points}
              sensor={sensor}
              label={t("world.map.aria", {
                continent: continentName,
                sensor: sensorName,
                n: formatNumber(shown, lang),
                ...period,
              })}
            />
          )}
          {shown === 0 && <p className="chart-note">{t("world.empty", { continent: continentName, sensor: sensorName })}</p>}
          <div className="world-legend">
            <span className="world-legend-title">{t("world.legend.title")}</span>
            <ul>
              {platformsOf(sensor).map((p) => (
                <li key={p}>
                  <span className="world-swatch" style={{ background: PLATFORM_COLOR[p] }} aria-hidden="true" />
                  {t("world.legend.item", {
                    platform: t(`world.platform.${p}` as MessageKey),
                    n: formatNumber(continent.n_by_platform[p], lang),
                  })}
                </li>
              ))}
            </ul>
          </div>
          <p className="chart-note">
            {t("world.note.dropped", { n: formatNumber(dropped, lang) })} {t("world.note.static")}
          </p>
        </>
      )}
    </section>
  );
}
