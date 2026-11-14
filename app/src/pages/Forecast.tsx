import { useI18n } from "../i18n";

export default function Forecast() {
  const { t } = useI18n();
  return (
    <section>
      <h1>{t("nav.forecast")}</h1>
      <p>{t("page.forecast.lead")}</p>
    </section>
  );
}
