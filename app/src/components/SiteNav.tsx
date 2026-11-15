/** The former header options (page links + language switch), shown inside the clicked satellite's card. */
import { NavLink } from "react-router-dom";
import { useI18n, type MessageKey } from "../i18n";
import { ROUTES } from "../routes";

const links: { to: string; label: MessageKey }[] = [
  { to: ROUTES.home, label: "nav.home" },
  { to: ROUTES.harmonizing, label: "nav.harmonizing" },
  { to: ROUTES.dashboard, label: "nav.dashboard" },
  { to: ROUTES.story, label: "nav.story" },
  { to: ROUTES.forecast, label: "nav.forecast" },
];

export function SiteNav() {
  const { t, lang, setLang } = useI18n();
  return (
    <nav className="site-nav" aria-label={t("app.title")}>
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.to === ROUTES.home}>
          {t(l.label)}
        </NavLink>
      ))}
      <button type="button" onClick={() => setLang(lang === "en" ? "mn" : "en")}>
        {t("lang.switch")}
      </button>
    </nav>
  );
}
