import { useI18n } from "../i18n";

export default function Harmonizing() {
  const { t } = useI18n();
  return (
    <section>
      <h1>{t("nav.harmonizing")}</h1>
      <p>{t("page.harmonizing.lead")}</p>
    </section>
  );
}
