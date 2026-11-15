/**
 * Preview entry for story-dev.html: mounts the story on its own, so the app's router is never involved.
 * Helpers: ?ch=<chapter id>   ?lite=1 (no 3D globe)   ?reduced=1 (reduced-motion path)
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "../i18n";
import "../styles.css";
import StoryPage from "./index";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <main className="story-dev-main">
        <StoryPage />
      </main>
    </I18nProvider>
  </StrictMode>,
);
