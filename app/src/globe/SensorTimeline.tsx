/** Infographic 2 (spec §7.3): each platform's first to last hotspot in our data; stopped ones marked. */
import { useI18n } from "../i18n";
import { formatDate } from "./format";
import type { TimelineRow } from "./homeData";
import { nameKey, SENSOR_COLOR, SENSOR_OF } from "./platforms";

const MAX_TICKS = 6;

/** Jan 1 of `year` as an ISO date, for placing year ticks. */
const yearStart = (year: number) => new Date(Date.UTC(year, 0, 1)).toISOString();

export function SensorTimeline({ rows }: { rows: TimelineRow[] }) {
  const { t, lang } = useI18n();
  const t0 = Math.min(...rows.map((r) => Date.parse(r.first)));
  const t1 = Math.max(...rows.map((r) => Date.parse(r.last)));
  const pct = (iso: string) => ((Date.parse(iso) - t0) / (t1 - t0 || 1)) * 100;
  const y0 = new Date(t0).getUTCFullYear() + 1;
  const y1 = new Date(t1).getUTCFullYear();
  const step = Math.max(1, Math.ceil((y1 - y0 + 1) / MAX_TICKS));
  const ticks = Array.from({ length: Math.floor((y1 - y0) / step) + 1 }, (_, i) => y0 + i * step);

  return (
    <div className="timeline" role="group" aria-label={t("home.info.timeline.a11y_summary")}>
      {rows.map((r) => {
        const color = SENSOR_COLOR[SENSOR_OF[r.id]];
        const range = t("globe.card.data_range_value", { first: formatDate(r.first, lang), last: formatDate(r.last, lang) });
        return (
          <div key={r.id} className="timeline-row">
            <span className="timeline-name" style={{ color }}>
              {t(nameKey(r.id))}
            </span>
            <div className="timeline-track" title={range}>
              <span
                className="timeline-bar"
                style={{ left: `${pct(r.first)}%`, width: `${pct(r.last) - pct(r.first)}%`, background: color }}
              />
              {r.stopped && <span className="timeline-stop" style={{ left: `${pct(r.last)}%` }} aria-hidden="true" />}
              <span className="visually-hidden">{range}</span>
            </div>
            {r.stopped && (
              <span className="timeline-stopped">{t("home.info.timeline.stopped", { date: formatDate(r.last, lang) })}</span>
            )}
          </div>
        );
      })}
      <div className="timeline-row timeline-axis" aria-hidden="true">
        <span />
        <div className="timeline-track">
          {ticks.map((y) => (
            <span key={y} className="timeline-tick" style={{ left: `${pct(yearStart(y))}%` }}>
              {y}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
