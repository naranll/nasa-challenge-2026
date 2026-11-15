/** The year slider under the two globes (PLAN D12), with a play button and a mark where the counting platform changes. */
import { useEffect, useState } from "react";
import { nameKey } from "../globe/platforms";
import { useI18n } from "../i18n";
import type { Handover } from "./harmonizeData";

const STEP_MS = 900;

interface Props {
  years: number[];
  index: number;
  onChange: (index: number) => void;
  /** Years where a new platform starts counting (from the calendar's chain), shown under the slider. */
  handovers: Handover[];
}

export function YearScrubber({ years, index, onChange, handovers }: Props) {
  const { t } = useI18n();
  const [playing, setPlaying] = useState(false);
  const last = years.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => onChange(index + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [playing, index, last, onChange]);

  const play = () => {
    if (!playing && index >= last) onChange(0);
    setPlaying((p) => !p);
  };
  const at = (year: number) => `${(years.indexOf(year) / Math.max(last, 1)) * 100}%`;

  return (
    <div className="year-scrubber">
      <button type="button" className="year-play" onClick={play} aria-pressed={playing}>
        {t(playing ? "harm.scrubber.pause" : "harm.scrubber.play")}
      </button>
      <div className="year-track">
        <input
          type="range"
          min={0}
          max={last}
          step={1}
          value={index}
          aria-label={t("harm.scrubber.label")}
          aria-valuetext={String(years[index])}
          onChange={(e) => {
            setPlaying(false);
            onChange(Number(e.target.value));
          }}
        />
        <div className="year-marks" aria-hidden="true">
          {handovers
            .filter((h) => years.includes(h.year))
            .map((h) => (
              <span key={h.year} className="year-mark" style={{ left: at(h.year) }}>
                {t("harm.scrubber.handover", { platform: t(nameKey(h.platform)), year: h.year })}
              </span>
            ))}
        </div>
      </div>
      <output className="year-now" aria-live="polite">
        {years[index]}
      </output>
    </div>
  );
}
