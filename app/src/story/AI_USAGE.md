# AI use: /story page (merge into docs/ai_usage.md)

Same columns as `docs/ai_usage.md`. Person and reviewer are left for the team to fill in.

| Date/time | Person | Lane | Tool | What for | Files/areas | Human review by |
|---|---|---|---|---|---|---|
| 2026-11-15 | [fill in] | Story / S-01 | Claude Code (Sonnet 5.5), `dataviz` skill | Read-only discovery of the app (router, globe, data loader, i18n). Built the story stage engine: scroll-linked persistent globe + "hotspots per year" chart, slide-right shell, chapter dots, skip link, low-bandwidth and reduced-motion paths, placeholder chapters, unit tests. Wrote `INTEGRATION.patch` (not applied). | `app/src/story/**`, `app/story-dev.html` only. Existing files untouched. | [fill in] |
| 2026-11-15 | [fill in] | Story / S-01 | `dataviz` palette validator (`validate_palette.js`) | Checked the existing sensor colours (MODIS `#f5a742`, VIIRS `#58b8f5`) for colour-blind separation and contrast. Result: colour-blind ΔE 23.5, normal-vision ΔE 27.3, contrast ≥ 3:1 all pass. The skill's default lightness band flagged both; its test surface is `#1a1a19`, not the app's `#05070d`. The existing tokens were kept, as agreed. Marks also differ by shape (dot = MODIS, triangle = VIIRS) and by label. | `app/src/story/engine/StageChart.tsx` | [fill in] |
| 2026-11-15 | [fill in] | Story / S-01 | Claude Code, headless Edge over the DevTools protocol | Visual QA of the preview at 390×844 and 1440×900 (scroll positions, deep links, `?lite=1`, `?reduced=1`, console errors). Found and fixed a wrong-chapter deep link and an empty chart. | none (scripts live outside the repo) | [fill in] |

Notes for the reviewer:
- Mongolian strings in `strings/mn.json` were written by the AI and are marked `needs-native-proof`. Chapter copy has no Mongolian yet.
- All chapter copy in `chapters.json` is a placeholder taken from the brief's beats; factual statements are tagged `[verify]`.
- Chart numbers come only from `calendar/mongolia.json`, which is currently the SYNTHETIC fixture.
