import { useI18n } from "../i18n";

export default function Home() {
  const { t } = useI18n();
  return (
    <section>
      <h1>{t("nav.home")}</h1>
      <p>{t("page.home.lead")}</p>
    </section>
  );
}
