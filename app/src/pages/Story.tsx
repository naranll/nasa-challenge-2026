import { useI18n } from "../i18n";

export default function Story() {
  const { t } = useI18n();
  return (
    <section>
      <h1>{t("nav.story")}</h1>
      <p>{t("page.story.lead")}</p>
    </section>
  );
}
