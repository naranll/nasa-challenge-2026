import { lazy, Suspense } from "react";
import { ErrorBoundary } from "../globe/ErrorBoundary";
import { useI18n } from "../i18n";

// The story is its own chunk, so the main bundle does not grow. If it fails to load, the old stub shows.
const StoryPage = lazy(() => import("../story"));

export default function Story() {
  const { t } = useI18n();
  const stub = (
    <section>
      <h1>{t("nav.story")}</h1>
      <p>{t("page.story.lead")}</p>
    </section>
  );
  return (
    <ErrorBoundary fallback={stub} onError={() => {}}>
      <Suspense fallback={stub}>
        <StoryPage />
      </Suspense>
    </ErrorBoundary>
  );
}
