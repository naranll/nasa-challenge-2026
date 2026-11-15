/** World globe-ийн tooltip-ийн агуулга: түүхий hotspot (#34) ба Harmonize-ийн hexagon (#36). */
import type { WorldCell, WorldPointsFile } from "../data/contracts";
import { formatDate, formatNumber } from "../globe/format";
import { SENSOR_OF, type Sensor } from "../globe/platforms";
import { useI18n, type MessageKey } from "../i18n";
import { cellValue } from "./cellsData";
import { PLATFORM_COLOR, pointAt } from "./worldData";

/** Түүхий hotspot-ын tooltip (#34). */
export function PointTip({ file, row }: { file: WorldPointsFile; row: number }) {
  const { t, lang } = useI18n();
  const point = pointAt(file, row);
  return (
    <>
      <strong style={{ color: PLATFORM_COLOR[point.platform] }}>
        {t("world.tip.platform", {
          platform: t(`world.platform.${point.platform}` as MessageKey),
          sensor: t(`world.sensor.${SENSOR_OF[point.platform]}` as MessageKey),
        })}
      </strong>
      <span>{t("world.tip.time", { date: formatDate(point.date, lang), time: point.time })}</span>
      <span>{t("world.tip.frp", { frp: formatNumber(point.frp, lang, { maximumFractionDigits: 2 }) })}</span>
      <span>{t("world.tip.conf", { conf: t(`world.conf.${point.conf}` as MessageKey) })}</span>
      <span>{t(`world.dn.${point.daynight}` as MessageKey)}</span>
      {point.matchClass !== null && (
        <span>{t("world.tip.match", { match: t(`world.match.${point.matchClass}` as MessageKey) })}</span>
      )}
    </>
  );
}

/**
 * Hexagon-ы tooltip (#36): хэрэглэгч тооцоог өөрөө шалгаж болохуйц.
 * VIIRS: NOAA-20 fire unit (өдөр, шөнө) × ашигласан r = Aqua-equivalent. MODIS: Aqua hotspot × 1.
 */
export function CellTip({ cell, sensor }: { cell: WorldCell; sensor: Sensor }) {
  const { t, lang } = useI18n();
  const num = (v: number) => formatNumber(v, lang, { maximumFractionDigits: 2 });
  const ratio = (r: number | null) =>
    r === null ? t("world.ratio.unknown") : formatNumber(r, lang, { maximumFractionDigits: 4 });
  const value = cellValue(cell, sensor);
  const units = cell.noaa20_units;
  return (
    <>
      <strong>{value === null ? t("world.tip.harm.unknown") : t("world.tip.harm.value", { v: num(value) })}</strong>
      {sensor === "VIIRS" ? (
        <>
          <span>{t("world.tip.harm.units", { d: num(units.D), n: num(units.N) })}</span>
          <span>{t("world.tip.harm.r", { d: ratio(cell.r.D), n: ratio(cell.r.N) })}</span>
          {value !== null && (
            <span>
              {t("world.tip.harm.sum", {
                ud: num(units.D),
                rd: ratio(cell.r.D),
                un: num(units.N),
                rn: ratio(cell.r.N),
                v: num(value),
              })}
            </span>
          )}
        </>
      ) : (
        <span>{t("world.tip.harm.aqua", { n: num(cell.aqua) })}</span>
      )}
    </>
  );
}
