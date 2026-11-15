/** Method section (PLAN D13): left = numbered pipeline steps, right = numbered validation test results (D10). */
import type { ValidationFile } from "../data/contracts";
import { formatNumber } from "../globe/format";
import { methodTests, type MethodTestKey } from "../harmonize/harmonizeData";
import { useI18n, type MessageKey } from "../i18n";

const STEPS: MessageKey[] = [
  "method.step.download",
  "method.step.filter",
  "method.step.units",
  "method.step.label",
  "method.step.ratios",
  "method.step.chain",
  "method.step.baseline",
  "method.step.validate",
];

const TEST_TEXT: Record<MethodTestKey, { name: MessageKey; what: MessageKey }> = {
  aqua_rebuild: { name: "method.test.aqua_rebuild.name", what: "method.test.aqua_rebuild.what" },
  forward: { name: "method.test.forward.name", what: "method.test.forward.what" },
  one_ratio: { name: "method.test.one_ratio.name", what: "method.test.one_ratio.what" },
  noaa20_ratio: { name: "method.test.noaa20_ratio.name", what: "method.test.noaa20_ratio.what" },
};

interface Props {
  /** null while loading or when validation.json did not load: each result then says it is not ready. */
  validation: ValidationFile | null;
}

export function MethodSection({ validation }: Props) {
  const { t, lang } = useI18n();
  const pct = (v: number) => formatNumber(v, lang, { style: "percent", maximumFractionDigits: 1 });

  return (
    <section className="method" aria-labelledby="method-title">
      <h2 id="method-title">{t("method.title")}</h2>
      <div className="method-columns">
        <div>
          <h3>{t("method.steps.title")}</h3>
          <ol className="method-steps">
            {STEPS.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ol>
        </div>
        <div>
          <h3>{t("method.tests.title")}</h3>
          <ol className="method-tests">
            {methodTests(validation).map((row) => (
              <li key={row.key}>
                <strong>{t(TEST_TEXT[row.key].name)}</strong>
                <p>{t(TEST_TEXT[row.key].what)}</p>
                <p className="method-result">
                  {row.value === null
                    ? t("method.test.not_ready")
                    : row.compareTo !== null
                      ? t("method.test.result_compare", { metric: row.metric ?? "", value: pct(row.value), monthly: pct(row.compareTo) })
                      : t("method.test.result", { metric: row.metric ?? "", value: pct(row.value) })}
                </p>
              </li>
            ))}
          </ol>
          <p className="method-note">{t("method.tests.note")}</p>
        </div>
      </div>
    </section>
  );
}
