/**
 * Dashboard-ийн World map хэсэг (#31, #34, #36): тив сонгох, VIIRS | MODIS сэлгэх, түүхий hotspot-ын canvas map,
 * Harmonize товчоор H3 res 5 hexagon (Aqua-equivalent, хоёр дэлгэц нэг шкалтай), тивийн r мөр.
 * index.json-ийг эхэнд, тивийн points эсвэл cells файлыг зөвхөн тэр тив, тэр горимыг сонгосон үед ачаална.
 */
import { useMemo, useState } from "react";
import { RAMP_GRADIENT } from "../calendar/scale";
import type { WorldCellsFile, WorldContinent, WorldContinentId, WorldIndexFile, WorldPointsFile } from "../data/contracts";
import { dataOf, useDataFile } from "../data/useDataFile";
import { formatDate, formatNumber } from "../globe/format";
import { platformsOf, type Sensor } from "../globe/platforms";
import { useI18n, type MessageKey } from "../i18n";
import "../calendar/calendar.css";
import { cellValue, drawnOn, harmMax, NO_RATIO_COLOR } from "./cellsData";
import { WorldMapCanvas, type WorldLayer } from "./WorldMapCanvas";
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
  const [harmonize, setHarmonize] = useState(false);
  const continent = index?.continents.find((c) => c.id === continentId) ?? index?.continents[0] ?? null;
  // Нэг удаад нэг файл: түүхий горимд points, Harmonize-д cells. cells_file байхгүй (#35-аас өмнөх) бол Harmonize идэвхгүй.
  const canHarmonize = !!continent?.cells_file;
  const harm = harmonize && canHarmonize;
  const pointsFile = useDataFile<WorldPointsFile>(continent && !harm ? `world/${continent.points_file}` : null);
  const cellsFile = useDataFile<WorldCellsFile>(continent && harm ? `world/${continent.cells_file}` : null);
  const loaded = harm ? cellsFile : pointsFile;
  const points = dataOf(pointsFile);
  const cells = dataOf(cellsFile);
  // Хоёр дэлгэцийн нэг max: тивийн файлаас, sensor солиход өөрчлөгдөхгүй.
  const max = useMemo(() => (cells ? harmMax(cells.cells) : 0), [cells]);
  const layer = useMemo<WorldLayer | null>(() => {
    if (harm) return cells ? { kind: "cells", file: cells, max } : null;
    return points ? { kind: "points", file: points } : null;
  }, [harm, cells, max, points]);

  const period = index
    ? { start: formatDate(index.period.start, lang), end: formatDate(index.period.end, lang) }
    : { start: "", end: "" };
  const continentName = continent ? (lang === "mn" ? continent.name_mn : continent.name_en) : "";
  const sensorName = t(`world.sensor.${sensor}` as MessageKey);
  const shown = continent ? platformsOf(sensor).reduce((n, p) => n + continent.n_by_platform[p], 0) : 0;
  // Harmonize дэлгэцэд зурагдах нүдний тоо, мөн харьцаа мэдэгдэхгүй нүд байгаа эсэх (legend-д).
  const shownCells = cells ? cells.cells.filter((c) => drawnOn(c, sensor)).length : 0;
  const hasNoRatio = !!cells && cells.cells.some((c) => cellValue(c, sensor) === null);
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
            <div className="view-switch">
              <button type="button" aria-pressed={harm} disabled={!canHarmonize} onClick={() => setHarmonize((h) => !h)}>
                {t("world.harm.button")}
              </button>
            </div>
          </div>
          <RatioRow continent={continent} />
          {/* Тивийн файл ачаалж/алдаа гарч байхад ч сонголтууд үлдэнэ, ингэснээр өөр тив рүү шилжиж болно. */}
          {loaded.status === "error" ? (
            <p role="alert">{t("data.error")}</p>
          ) : layer === null ? (
            <p aria-busy="true">{t("data.loading")}</p>
          ) : (
            <WorldMapCanvas
              continent={continent}
              layer={layer}
              sensor={sensor}
              label={t(harm ? "world.harm.map.aria" : "world.map.aria", {
                continent: continentName,
                sensor: sensorName,
                n: formatNumber(harm ? shownCells : shown, lang),
                ...period,
              })}
            />
          )}
          {harm ? (
            cells !== null && (
              <>
                {shownCells === 0 && (
                  <p className="chart-note">{t("world.harm.empty", { continent: continentName, sensor: sensorName })}</p>
                )}
                <div className="calendar-legend">
                  <span>{formatNumber(0, lang)}</span>
                  <span className="calendar-ramp" style={{ background: RAMP_GRADIENT }} aria-hidden="true" />
                  <span>{formatNumber(max, lang, { maximumFractionDigits: 2 })}</span>
                  <span className="calendar-legend-unit">{t("world.harm.legend")}</span>
                  {hasNoRatio && (
                    <>
                      <span className="world-swatch" style={{ background: NO_RATIO_COLOR }} aria-hidden="true" />
                      <span>{t("world.harm.legend.no_ratio")}</span>
                    </>
                  )}
                </div>
                <p className="chart-note">{t(`world.harm.note.${sensor}` as MessageKey)}</p>
              </>
            )
          ) : (
            <>
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
            </>
          )}
          <p className="chart-note">
            {t("world.note.dropped", { n: formatNumber(dropped, lang) })} {t("world.note.static")}
          </p>
        </>
      )}
    </section>
  );
}

/**
 * Тивийн харьцааны жижиг мөр (#36): ашигласан r_day, r_night.
 * Data цөөн бол (`ratio_fallback`) дэлхийн харьцааг ашигласан гэж шударгаар бичнэ, аль D/N нь болохыг хамт.
 */
function RatioRow({ continent }: { continent: WorldContinent }) {
  const { t, lang } = useI18n();
  if (continent.r_day === undefined && continent.r_night === undefined) return null;
  const ratio = (r: number | null | undefined) =>
    r == null ? t("world.ratio.unknown") : formatNumber(r, lang, { maximumFractionDigits: 4 });
  const fb = continent.fallback;
  const fellBack = continent.flags?.includes("ratio_fallback") ?? false;
  // fallback-ийн D/N мэдэгдэхгүй (эсвэл хоёулаа) бол ерөнхий мессеж.
  const fallbackKey = !fellBack
    ? null
    : fb?.D && !fb.N
      ? "world.ratio.fallback.D"
      : fb?.N && !fb.D
        ? "world.ratio.fallback.N"
        : "world.ratio.fallback";
  return (
    <p className="world-ratio">
      {t("world.ratio.row", { d: ratio(continent.r_day), n: ratio(continent.r_night) })}
      {fallbackKey && <span className="world-ratio-fallback">{t(fallbackKey)}</span>}
    </p>
  );
}
