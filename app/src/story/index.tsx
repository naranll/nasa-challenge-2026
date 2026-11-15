/** The /story page. This module is the only entry point; the app loads it with React.lazy so it is code-split. */
import { CHAPTERS } from "./chapters/index"; // explicit: "./chapters" would resolve to chapters.json
import { StageEngine } from "./engine/StageEngine";
import { SlideShell } from "./shell/SlideShell";
import "./story.css";

export default function StoryPage() {
  return (
    <SlideShell>
      <StageEngine chapters={CHAPTERS} />
    </SlideShell>
  );
}
