# Story parking lot (ideas, not built)

- **Satellite layer on the story globe** (ch 3 and 4): reuse `globe/orbit.ts` and `useHomeData`'s orbit builder; add a `layer` field to the globe target.
- **Stacked-by-platform chart mode** (ch 6): add a numeric `stack` (0..1) next to `harmonize` in `ChartTarget`.
- **Visible data-table toggle** for the chart. Today the table is screen-reader only.
- **Phone chart height:** the plot is only about 100 px tall at 390×844 because the copy, the chapter stage and the chart share the screen. Chapters that need room can set `chart.visible` to 0, or the chart can collapse to a one-line summary.
- **Routing "Plan B":** moving the `/story` route outside `Layout` would remove the site header above the stage and the 1 rem page padding (patch to `main.tsx`; not needed for now).
- **Display font:** the art direction asked for a serif display face. No webfont exists and none may be added, so headlines use heavy system-ui. A system serif stack (`ui-serif, Georgia`) would be a design-token decision for P3/P5.
- **Ember vs MODIS amber:** `--accent #f2994a` and MODIS `#f5a742` are nearly the same hue. The story keeps ember for fire events only and tells MODIS apart by shape and label. A token change would be cleaner.
- **Pre-rendered stills** for low-bandwidth mode (a flat WebP per chapter) instead of the generic static globe.
- **`STORY_STRICT=1` in CI** once copy is sourced, so `[verify]` tags fail the build.
- **Share image / OG card** with the `canvas-design` skill, after ch 7 and 8.
- **Placeholder progress readout** shows a raw number without a claim ID; it is dev UI and disappears as chapters are built.
