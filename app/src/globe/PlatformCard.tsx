import { useEffect, useMemo } from "react";
import { SiteNav } from "../components/SiteNav";
import { useI18n, type MessageKey } from "../i18n";
import { formatDate, formatNumber } from "./format";
import { cardStats, type PipelineStats } from "./homeData";
import { positionAt } from "./orbit";
import { nameKey, SENSOR_COLOR } from "./platforms";
import type { SimClock } from "./env";
import type { Orbit } from "./useHomeData";

interface Props {
  orbit: Orbit;
  stats: PipelineStats | null;
  clock: SimClock;
  /** Locked by click/tap/Enter (shows Close); otherwise a hover preview. */
  locked: boolean;
  onClose: () => void;
}

const STATUS_KEY = (id: string) => `globe.status.${id}` as MessageKey;
const SENSOR_KEY = { MODIS: "globe.sensor.modis", VIIRS: "globe.sensor.viirs" } as const;

/** Hover / tap card (spec §6.2). A row whose value is unknown is left out, never "N/A" (§6.3). */
export function PlatformCard({ orbit, stats, clock, locked, onClose }: Props) {
  const { t, lang } = useI18n();
  const s = cardStats(stats, orbit.id);
  const meta = orbit.meta;
  // Altitude at the moment the card opens, from the simulated clock the globe also uses.
  const altKm = useMemo(() => (orbit.satrec ? positionAt(orbit.satrec, clock.now())?.altKm ?? null : null), [orbit, clock]);

  useEffect(() => {
    if (!locked) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [locked, onClose]);

  const rows: [MessageKey, string][] = [["globe.card.sensor_label", t(SENSOR_KEY[orbit.sensor])]];
  if (meta?.launch_date) rows.push(["globe.card.launch_label", formatDate(meta.launch_date, lang)]);
  if (s.first && s.last) {
    rows.push(["globe.card.data_range_label",
      t("globe.card.data_range_value", { first: formatDate(s.first, lang), last: formatDate(s.last, lang) })]);
  }
  if (s.count !== null) rows.push(["globe.card.count_label", t("globe.card.count_value", { n: formatNumber(s.count, lang) })]);
  if (altKm !== null) {
    rows.push(["globe.card.altitude_label", t("globe.card.altitude_value", { km: formatNumber(Math.round(altKm), lang) })]);
  }

  return (
    <aside className="globe-card" aria-live="polite" style={{ borderColor: SENSOR_COLOR[orbit.sensor] }}>
      <h3>{t(nameKey(orbit.id))}</h3>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{t(label)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        {meta?.status_source_url && (
          <div className="globe-card-status">
            <dt>{t("globe.card.status_label")}</dt>
            <dd>
              {t(STATUS_KEY(orbit.id))}{" "}
              <a href={meta.status_source_url} target="_blank" rel="noreferrer">
                {t("globe.card.source_link")}
              </a>
            </dd>
          </div>
        )}
      </dl>
      {s.notInData && <p className="globe-card-note">{t("globe.card.not_in_data")}</p>}
      {orbit.tle?.kind === "aging" && <p className="globe-card-note">{t("globe.tle.stale_age", { days: orbit.tle.days })}</p>}
      {orbit.tle?.kind === "stale" && <p className="globe-card-note">{t("globe.tle.stale_hidden")}</p>}
      {locked && <SiteNav />}
      {locked && (
        <button type="button" className="globe-card-close" onClick={onClose}>
          {t("globe.card.close")}
        </button>
      )}
    </aside>
  );
}
