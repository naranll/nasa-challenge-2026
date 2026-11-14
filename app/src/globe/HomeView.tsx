/** The whole home page (spec §8): title, globe, buttons to the other pages, infographics. */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useI18n, type MessageKey } from "../i18n";
import { ROUTES } from "../routes";
import "./globe.css";
import { sensorTimeline, yearlySeries } from "./homeData";
import { HomeGlobeSection } from "./HomeGlobeSection";
import { PerYearChart, PerYearNote } from "./PerYearChart";
import { SensorTimeline } from "./SensorTimeline";
import { useHomeData } from "./useHomeData";

const NAV: { to: string; label: MessageKey }[] = [
  { to: ROUTES.harmonizing, label: "home.nav.harmonize" },
  { to: ROUTES.dashboard, label: "home.nav.dashboard" },
  { to: ROUTES.story, label: "home.nav.story" },
  { to: ROUTES.forecast, label: "home.nav.forecast" },
];

export function HomeView() {
  const { t } = useI18n();
  const { satellites, stats, calendar } = useHomeData();
  const statsData = stats.status === "ok" ? stats.data : null;

  const series = useMemo(() => (calendar.status === "ok" ? yearlySeries(calendar.data) : null), [calendar]);
  const timeline = useMemo(() => sensorTimeline(statsData), [statsData]);
  const hasSeries = series !== null && Object.values(series).some((s) => s.length > 0);
  const hasTimeline = timeline.length > 0;

  return (
    <div className="home">
      <header className="home-header">
        <h1>{t("home.title")}</h1>
        <p>{t("home.subtitle")}</p>
      </header>

      <HomeGlobeSection satellites={satellites} stats={statsData} />

      <nav className="home-nav" aria-label={t("home.nav.label")}>
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className="home-nav-button">
            {t(n.label)}
          </Link>
        ))}
      </nav>

      {/* Spec §7.4: a chart whose file did not load is left out, never drawn empty. */}
      {(hasSeries || hasTimeline) && (
        <section className="home-info">
          {hasSeries && (
            <figure>
              <figcaption>
                <h2>{t("home.info.per_year.title")}</h2>
              </figcaption>
              <PerYearChart series={series} />
              <PerYearNote />
            </figure>
          )}
          {hasTimeline && (
            <figure>
              <figcaption>
                <h2>{t("home.info.timeline.title")}</h2>
              </figcaption>
              <SensorTimeline rows={timeline} />
            </figure>
          )}
        </section>
      )}
    </div>
  );
}
