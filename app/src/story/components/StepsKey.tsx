/** The numbered key for the step markers on the timeline and the chart. Every date carries its claim ID. */
import { LIFECYCLE } from "../data/handover";
import { useStoryText, type StoryKey } from "../strings";
import { Claimed } from "./Claimed";

export function StepsKey() {
  const s = useStoryText();
  return (
    <ol className="story-steps" aria-label={s("steps.title")}>
      {LIFECYCLE.steps.map((st) => (
        <li key={st.n}>
          <span className="story-step-badge" aria-hidden="true">
            {st.n}
          </span>
          <span className="story-steps-date">
            <Claimed id={st.claim}>{st.at}</Claimed>
          </span>
          <span>{s(`step.${st.n}` as StoryKey)}</span>
        </li>
      ))}
    </ol>
  );
}
