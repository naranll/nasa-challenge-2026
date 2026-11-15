/** Per-chapter material for the "Sources & notes" panel: the keys and long explanations that used to sit on the screen. */
import { LifespanList } from "../components/LifespanList";
import { RatioNote } from "../components/RatioNote";
import { StepsKey } from "../components/StepsKey";
import { WorkflowFigure } from "../components/WorkflowFigure";
import { useStoryText } from "../strings";

/** What the marks, bands and line mean. */
export function MarkKey({ line = false }: { line?: boolean }) {
  const s = useStoryText();
  return (
    <>
      <h4>{s("key.title")}</h4>
      <ul className="story-key">
        <li>
          <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
            <circle cx="11" cy="8" r="5" fill="var(--story-ember)" />
            <circle cx="11" cy="8" r="2" fill="var(--story-ember-core)" />
          </svg>
          {s("key.modis")}
        </li>
        <li>
          <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
            <path d="M11,3 L14.5,11 L7.5,11 Z" fill="var(--story-ember)" />
          </svg>
          {s("key.viirs")}
        </li>
        <li>
          <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
            <polygon points="6,1 16,1 12,15 2,15" fill="var(--story-modis)" fillOpacity="0.15" stroke="var(--story-modis)" />
          </svg>
          {s("key.swath_modis")}
        </li>
        <li>
          <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
            <polygon points="6,1 16,1 12,15 2,15" fill="var(--story-viirs)" fillOpacity="0.15" stroke="var(--story-viirs)" />
          </svg>
          {s("key.swath_viirs")}
        </li>
        {line && (
          <li>
            <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
              <path d="M1,12 L8,6 L14,9 L21,3" fill="none" stroke="var(--story-ember)" strokeWidth="2" />
            </svg>
            {s("key.line")}
          </li>
        )}
      </ul>
      <p>{s("key.illustrative")}</p>
    </>
  );
}

export function CrewsNotes() {
  return <MarkKey />;
}

export function HandoverNotes() {
  return (
    <>
      <MarkKey line />
      <LifespanList />
      <h4>{useStoryText()("steps.title")}</h4>
      <StepsKey />
      <RatioNote />
    </>
  );
}

export function HarmonizeNotes() {
  const s = useStoryText();
  return (
    <>
      <MarkKey line />
      <h4>{s("pipe.title")}</h4>
      <p>{s("pipe.note")}</p>
      <WorkflowFigure progress={1} still />
    </>
  );
}
