/**
 * "Sources & notes": a button in the top bar and a modal panel. Everything the screens no longer carry lives here:
 * the data files, claim IDs, status, the chapter's long caption, and its keys and figures. A native <dialog>, so
 * focus is trapped, Esc closes it, and focus returns to the button.
 */
import { useEffect, useRef, useState, type FC } from "react";
import { createPortal } from "react-dom";
import { useStoryText, type StoryKey } from "../strings";

export interface SourcesProps {
  caption?: string;
  data: string[];
  claims: string[];
  /** Whether the data on screen is synthetic; null when the chapter reads no data. */
  synthetic: boolean | null;
  Notes?: FC;
}

const SLOT_ID = "story-topbar-slot";

export function SourcesPanel({ caption, data, claims, synthetic, Notes }: SourcesProps) {
  const s = useStoryText();
  const dialog = useRef<HTMLDialogElement>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => setSlot(document.getElementById(SLOT_ID)), []);

  const close = () => dialog.current?.close();
  const status: StoryKey = synthetic === null ? "status.none" : synthetic ? "status.synthetic" : "status.real";
  const rows: [StoryKey, string][] = [
    ["row.data", data.length ? data.join(", ") : "—"],
    ["row.claims", claims.length ? claims.join(" · ") : "—"],
    ["row.status", s(status)],
  ];

  const button = (
    <button
      type="button"
      className="story-skip story-sources-btn"
      onClick={() => {
        dialog.current?.showModal();
        setOpen(true);
      }}
      aria-label={s("sources.button")}
      title={s("sources.button")}
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="13" cy="13" r="10" />
        <path d="M13,12 V19" />
        <circle cx="13" cy="8" r="0.6" fill="currentColor" />
      </svg>
      <span className="story-sr-only">{s("sources.button")}</span>
    </button>
  );

  return (
    <>
      {slot ? createPortal(button, slot) : null}
      <dialog
        ref={dialog}
        className="story-sources"
        aria-label={s("sources.title")}
        onClose={() => setOpen(false)}
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
