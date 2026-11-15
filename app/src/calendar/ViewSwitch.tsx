/** The Raw / Harmonized switch (PLAN D2: the Raw view must exist, it shows the 2012 jump). */
import { useI18n } from "../i18n";
import "./calendar.css";
import type { CalendarView } from "./calendarData";

const VIEWS: CalendarView[] = ["raw", "harmonized"];

export function ViewSwitch({ value, onChange }: { value: CalendarView; onChange: (v: CalendarView) => void }) {
  const { t } = useI18n();
  return (
    <div className="view-switch" role="group" aria-label={t("cal.switch.label")}>
      {VIEWS.map((v) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
          {t(v === "raw" ? "cal.view.raw" : "cal.view.harmonized")}
        </button>
      ))}
    </div>
  );
}
