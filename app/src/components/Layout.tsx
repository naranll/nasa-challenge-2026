import { Link, Outlet, useLocation } from "react-router-dom";
import { MOCK } from "../data";
import { useI18n } from "../i18n";
import { ROUTES } from "../routes";

/**
 * No site header or footer: the page links and language switch live in the satellite card (globe/PlatformCard).
 * Pages other than home get a single link back to it.
 */
export default function Layout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  return (
    <>
      {MOCK && (
        <div className="synthetic-banner" role="status">
          {t("banner.synthetic")}
        </div>
      )}
      {/* The story is full-bleed and has its own "Skip story" link, so it gets no back link or padding. */}
      <main className={pathname === ROUTES.story ? "main-bleed" : undefined}>
        {pathname !== ROUTES.home && pathname !== ROUTES.story && (
          <Link to={ROUTES.home} className="back-home">
            {t("nav.back_home")}
          </Link>
        )}
        <Outlet />
      </main>
    </>
  );
}
