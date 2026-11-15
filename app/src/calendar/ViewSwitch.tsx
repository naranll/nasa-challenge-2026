/** The Raw / Harmonized switch (PLAN D2: the Raw view must exist, it shows the 2012 jump). */
import { useI18n } from "../i18n";
import "./calendar.css";
import type { CalendarView } from "./calendarData";

const VIEWS: CalendarView[] = ["raw", "harmonized"];

interface Props {
  value: CalendarView;
  onChange: (v: CalendarView) => void;
  /** Views whose grid has no values yet: still clickable (they explain why), but marked. */
  empty?: readonly CalendarView[];
}

export function ViewSwitch({ value, onChange, empty = [] }: Props) {
  const { t } = useI18n();
  return (
    <div className="view-switch" role="group" aria-label={t("cal.switch.label")}>
      {VIEWS.map((v) => (
        <button key={v} type="button" aria-pressed={value === v} data-empty={empty.includes(v) || undefined} onClick={() => onChange(v)}>
          {t(v === "raw" ? "cal.view.raw" : "cal.view.harmonized")}
          {empty.includes(v) && <small>{t("cal.harmonized.unavailable")}</small>}
        </button>
      ))}
    </div>
  );
}
