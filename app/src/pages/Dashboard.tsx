import { useEffect, useState } from "react";
import { loadData } from "../data";
import type { Region, RegionsFile } from "../data/contracts";
import { useI18n } from "../i18n";

export default function Dashboard() {
  const { t, lang } = useI18n();
  const [regions, setRegions] = useState<Region[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadData<RegionsFile>("regions.json")
      .then((file) => setRegions(file.regions))
      .catch((err) => {
        console.error(err);
        setFailed(true);
      });
  }, []);

  return (
    <section>
      <h1>{t("nav.dashboard")}</h1>
      <p>{t("page.dashboard.lead")}</p>
      {failed ? (
        <p role="alert">{t("data.error")}</p>
      ) : regions === null ? (
        <p aria-busy="true">{t("data.loading")}</p>
      ) : (
        <>
          <p>{t("data.regions")}</p>
          <ul>
            {regions.map((r) => (
              <li key={r.region_id}>{lang === "mn" ? r.name_mn : r.name_en}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
