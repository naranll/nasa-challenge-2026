/**
 * A chapter's title block: one headline, one line, and (when the picture uses made-up or fixture data) a small badge.
 * Everything else (data files, claim IDs, status, captions, keys) lives in the "Sources & notes" panel.
 */
export interface HeadProps {
  headline: string;
  /** The one line under the headline. */
  line: string;
  /** Small badge text, or null for none. */
  badge: string | null;
}

export function ChapterHead({ headline, line, badge }: HeadProps) {
  return (
    <section className="story-head" aria-hidden="true">
      <h2>{headline}</h2>
      <p className="story-subtitle">{line}</p>
      {badge && <p className="story-badge">{badge}</p>}
    </section>
  );
}
