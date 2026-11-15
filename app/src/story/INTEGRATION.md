# Wiring /story into the app (NOT applied; review first)

1. **Apply:** from the repo root run `git apply --check app/src/story/INTEGRATION.patch`, then `git apply app/src/story/INTEGRATION.patch` (3 files, +24/−3: `pages/Story.tsx`, `globe/HomeView.tsx`, `i18n/en.json`).
2. **What it does:** `/story` already exists as a stub route. The patch makes `pages/Story.tsx` lazy-load `src/story` (own chunk, error boundary falls back to the old stub), warms that chunk when the home "story" button is hovered or focused, and changes the **English** text of the existing key `home.nav.story` to "Learn about harmony ›". `main.tsx`, the router and `package.json` are untouched. The Mongolian text is **not** changed: it needs P5's native-proofed wording.
3. **Check:** `npm run typecheck && npm test && npm run build` in `app/`, then open `/#/story`. Deep links look like `/#/story?ch=ch7-handover` (HashRouter, so not `#ch7`).
4. **Remove:** `git apply -R app/src/story/INTEGRATION.patch` puts all three files back. If the story fails late, revert only the `i18n/en.json` hunk (the button text) and the page keeps its old label.
5. **Preview without the patch:** `npm run dev`, then open `http://localhost:5173/story-dev.html` (add `?ch=<id>`, `?lite=1`, `?reduced=1`). That page is not part of `npm run build`.
