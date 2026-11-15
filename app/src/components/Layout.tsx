import { Outlet } from "react-router-dom";
import { MOCK } from "../data";
import { useI18n } from "../i18n";

/** No site header or footer: the page links and language switch live in the satellite card (globe/PlatformCard). */
export default function Layout() {
  const { t } = useI18n();
  return (
    <>
      {MOCK && (
        <div className="synthetic-banner" role="status">
          {t("banner.synthetic")}
        </div>
      )}
      <main>
        <Outlet />
      </main>
    </>
  );
}
