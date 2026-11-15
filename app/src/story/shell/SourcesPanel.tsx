/**
 * "Sources & notes": a button in the top bar and a modal panel. Everything the screens no longer carry lives here:
 * the data files, claim IDs, status, the chapter's long caption, and its keys and figures. A native <dialog>, so
 * focus is trapped, Esc closes it, and focus returns to the button.
 */
import { useRef, type FC } from "react";
import { useStoryText, type StoryKey } from "../strings";

export interface SourcesProps {
  caption?: string;
  data: string[];
  claims: string[];
  /** Whether the data on screen is synthetic; null when the chapter reads no data. */
  synthetic: boolean | null;
  Notes?: FC;
}

export function SourcesPanel({ caption, data, claims, synthetic, Notes }: SourcesProps) {
  const s = useStoryText();
  const dialog = useRef<HTMLDialogElement>(null);

  const close = () => dialog.current?.close();
  const status: StoryKey = synthetic === null ? "status.none" : synthetic ? "status.synthetic" : "status.real";
  const rows: [StoryKey, string][] = [
    ["row.data", data.length ? data.join(", ") : "—"],
    ["row.claims", claims.length ? claims.join(" · ") : "—"],
    ["row.status", s(status)],
  ];

  return (
    <>
      <dialog
        ref={dialog}
        className="story-sources"
        aria-label={s("sources.title")}
        onClick={(e) => {
          if (e.target === dialog.current) close(); // a click on the backdrop
        }}
      >
        <div className="story-sources-body">
          <header>
            <h3>{s("sources.title")}</h3>
            <button type="button" className="story-skip" onClick={close}>
              {s("sources.close")}
            </button>
          </header>
          {caption && (
            <>
              <h4>{s("sources.note")}</h4>
              <p>{caption}</p>
            </>
          )}
          {Notes && <Notes />}
          <dl className="story-rows">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt>{s(k)}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </dialog>
    </>
  );
}
