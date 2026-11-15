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
      <main>
        {pathname !== ROUTES.home && (
          <Link to={ROUTES.home} className="back-home">
            {t("nav.back_home")}
          </Link>
        )}
        <Outlet />
      </main>
    </>
  );
}
