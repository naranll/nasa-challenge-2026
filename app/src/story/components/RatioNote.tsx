/**
 * What the sensor change looks like in the data. The ratio is computed from the calendar's yearly raw sums, so it
 * changes with the data. If the data shows no step, the page says so and points at the sampling difference instead.
 */
import { useMemo } from "react";
import { formatNumber } from "../../globe/format";
import { useI18n } from "../../i18n";
import { useCalendar } from "../data/adapters";
import { isVisibleStep, overlapRatio } from "../data/handover";
import { buildSeries } from "../data/series";
import { useStoryText } from "../strings";
import { Claimed } from "./Claimed";

export function RatioNote() {
  const { lang } = useI18n();
  const s = useStoryText();
  const calendar = useCalendar();
  const overlap = useMemo(() => (calendar.status === "ok" ? overlapRatio(buildSeries(calendar.data)) : null), [calendar]);
  if (!overlap) return null;
  if (overlap.ratio === null) return <p className="story-note story-ratio">{s("ratio.none")}</p>;
  if (!isVisibleStep(overlap.ratio)) return <p className="story-note story-ratio">{s("ratio.flat")}</p>;
  return (
    <p className="story-ratio">
      {s("ratio.visible", { ratio: "\u0000" })
        .split("\u0000")
        .flatMap((part, i, all) => [
          part,
          i < all.length - 1 ? (
            <strong key={i}>
              <Claimed id="S-C15">{formatNumber(overlap.ratio!, lang, { maximumFractionDigits: 1 })}</Claimed>
            </strong>
          ) : null,
        ])}
    </p>
  );
}
