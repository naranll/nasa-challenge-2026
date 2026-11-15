/** Chapter dots: real buttons (keyboard focusable), the current one marked with aria-current. */
import { useStoryText } from "../strings";

interface Item {
  id: string;
  /** Chapter number from the id, e.g. "07". */
  n: string;
  title: string;
}

interface Props {
  items: Item[];
  active: number;
  onGo: (index: number) => void;
}

export function ChapterNav({ items, active, onGo }: Props) {
  const s = useStoryText();
  return (
    <nav className="story-nav" aria-label={s("nav.label")}>
      <ol>
        {items.map((it, i) => (
          <li key={it.id}>
            <button
              type="button"
              className="story-dot"
              aria-current={i === active ? "step" : undefined}
              aria-label={s("nav.goto", { n: it.n, title: it.title })}
              title={it.title}
              onClick={() => onGo(i)}
            />
          </li>
        ))}
      </ol>
    </nav>
  );
}
