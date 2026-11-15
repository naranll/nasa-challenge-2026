/** S-01 stand-in for every chapter's Stage: shows the scroll progress so the engine can be checked by eye. */
import { useStoryText } from "../strings";
import type { StageProps } from "../types";

export function Placeholder({ progress, reduced, lowBandwidth }: StageProps) {
  const s = useStoryText();
  return (
    <div className="story-placeholder">
      <p>{s("placeholder")}</p>
      <div className="story-placeholder-bar" role="presentation">
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <p className="story-mono">
        {s("placeholder.progress")} {progress.toFixed(2)}
        {reduced ? " · reduced-motion" : ""}
        {lowBandwidth ? " · low-bandwidth" : ""}
      </p>
    </div>
  );
}
