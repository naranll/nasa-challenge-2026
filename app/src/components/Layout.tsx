import { NavLink, Outlet } from "react-router-dom";
import { MOCK } from "../data";
import { useI18n, type MessageKey } from "../i18n";

const links: { to: string; label: MessageKey }[] = [
  { to: "/", label: "nav.home" },
  { to: "/harmonizing", label: "nav.harmonizing" },
  { to: "/dashboard", label: "nav.dashboard" },
  { to: "/story", label: "nav.story" },
  { to: "/forecast", label: "nav.forecast" },
];

export default function Layout() {
  const { t, lang, setLang } = useI18n();
  return (
    <>
      {MOCK && (
        <div className="synthetic-banner" role="status">
          {t("banner.synthetic")}
        </div>
      )}
      <header className="site-header">
        <span className="site-title">{t("app.title")}</span>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}>
              {t(l.label)}
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={() => setLang(lang === "en" ? "mn" : "en")}>
          {t("lang.switch")}
        </button>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>{t("disclaimer")}</footer>
    </>
  );
}
