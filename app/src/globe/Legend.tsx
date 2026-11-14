import { useI18n, type MessageKey } from "../i18n";
import { nameKey, platformsOf, SENSOR_COLOR, SENSORS, type PlatformId, type Sensor } from "./platforms";
import type { Orbit } from "./useHomeData";

const SENSOR_KEY: Record<Sensor, MessageKey> = { MODIS: "globe.legend.modis", VIIRS: "globe.legend.viirs" };

interface Props {
  orbits: Orbit[];
  selected: PlatformId | null;
  onSelect: (id: PlatformId) => void;
  onHover: (id: PlatformId | null) => void;
}

/** "MODIS: Terra, Aqua / VIIRS: Suomi NPP, NOAA-20, NOAA-21". Each name is a button (spec §4.3, keyboard path §6.1). */
export function Legend({ orbits, selected, onSelect, onHover }: Props) {
  const { t } = useI18n();
  return (
    <div className="globe-legend">
      <h2 className="globe-legend-title">{t("globe.legend.title")}</h2>
      {SENSORS.map((sensor) => (
        <div key={sensor} className="globe-legend-row">
          <span className="globe-legend-sensor" style={{ color: SENSOR_COLOR[sensor] }}>
            <span className="globe-swatch" style={{ background: SENSOR_COLOR[sensor] }} aria-hidden="true" />
            {t(SENSOR_KEY[sensor])}
          </span>
          <ul>
            {platformsOf(sensor).map((id) => {
              const orbit = orbits.find((o) => o.id === id);
              const name = t(nameKey(id));
              return (
                <li key={id}>
                  <button
                    type="button"
                    className="globe-legend-platform"
                    aria-pressed={selected === id}
                    aria-label={t("globe.a11y.select_platform", { name })}
                    onClick={() => onSelect(id)}
                    onMouseEnter={() => onHover(id)}
                    onMouseLeave={() => onHover(null)}
                    onFocus={() => onHover(id)}
                    onBlur={() => onHover(null)}
                    data-no-orbit={orbit?.satrec ? undefined : ""}
                  >
                    {name}
                  </button>
                  {orbit?.tle?.kind === "stale" && <span className="globe-legend-stale">{t("globe.tle.stale_hidden")}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="globe-legend-note">{t("globe.legend.same_sensor")}</p>
    </div>
  );
}
