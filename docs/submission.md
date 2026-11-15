# Space Apps 2026 submission pack — Fusion (motto: Together, forward)

Draft text for each field of the submission form. Anything in **[BRACKETS]** is a number or link only your team can supply. Per `docs/claims.md`, every number must come from a script output. Do not fill the brackets with estimates. If a test result is bad, say so; PLAN §7 requires it.

Checked against the repo on 2026-11-15 (branch `8-story-page-why-this-data-matters`). What exists today: the Home globe, the raw-counts Harmonizing page, the story-page engine with placeholder chapters, and the ETL scripts. No validation results (WAPE, ratios), forecast or weather output are in the repo yet. Text below is written so it stays true if those land, with a "fallback" wording where they might not.

---

## Project Name

**Fusion: Together, Forward — One Fire Record from MODIS to VIIRS, for Mongolia**

Motto: **Together, forward.** (MODIS and VIIRS together, the record moving forward.)

Shorter: "Fusion" alone, or "Fusion: Harmonizing MODIS and VIIRS Fire Detections".

---

## Summary (≈160 words)

MODIS has watched Earth's fires for more than 20 years and is being retired. VIIRS sees finer detail and keeps flying, but it flags many more small fires, so naively joining the two makes burning appear to jump overnight. We built Fusion, a web app that removes that jump for Mongolia. Our motto is "together, forward": two sensor generations joined into one record that keeps moving ahead.

Our pipeline turns NASA FIRMS detections from Terra, Aqua, Suomi NPP and NOAA-20 into one burning-activity calendar. Only one platform counts at any moment, handed over along a chain: Aqua → Suomi NPP → NOAA-20. Conversion ratios are measured in the years when platforms flew together. We test the method by rebuilding Aqua's real counts from VIIRS alone, in years where Aqua was flying [RESULT: WAPE ___ %].

Users pick a province and date range, see whether a month is unusual against the historical median, switch to the raw counts to see the jump we removed, and download the data. A 3D globe and a scroll story explain why this matters. A comparable 23-year record is what lets anyone judge whether a fire season is normal.

*(Cut or keep the bracketed result sentence depending on whether the validation job finishes. If it doesn't, delete that clause and don't claim validation.)*

---

## Project Demonstration

Choose one. The form allows **≤ 7 slides or ≤ 30 s of video**, at a public link needing no login.

**Not yet made: needs [DEMO LINK].** Recommended: a 30 s video, since the repo already has the visuals. Clips can be screen-recorded from the live app.

30-second script (adapted from PLAN §6, shortened to fit):

| Time | On screen | Voice-over |
|---|---|---|
| 0–6 s | Home globe, five satellites orbiting | "MODIS has tracked fire for 20 years and is being retired." |
| 6–14 s | Raw monthly chart showing the jump around 2012 | "VIIRS replaces it, but it sees more small fires. Joined naively, burning appears to jump." |
| 14–24 s | Harmonized series, the jump gone; chain Aqua → Suomi NPP → NOAA-20 | "We hand the count over on the ground, one platform at a time, using years they overlapped. We tested it by rebuilding Aqua from VIIRS: [WAPE ___ %]." |
| 24–30 s | Province picker, month vs historical median, CSV download | "One calendar. The sensor no longer matters." |

Alternative 7-slide deck: 1 Title + one-liner · 2 Problem (the seam) · 3 Method (chain + ratios) · 4 Validation result [___] · 5 App tour · 6 Impact and limits · 7 Data, tools, credits.

Format as the full URL, e.g. `https://…`. Host on YouTube (unlisted), Google Drive ("anyone with the link") or GitHub. **Open it in a private window to confirm no login is required.**

---

## Project (public link)

- Repository (public, MIT): https://github.com/naranll/nasa-challenge-2026
- Live app: https://naranll.github.io/nasa-challenge-2026/

**Before submitting, check both:**
1. The README says Pages needs an admin to set Settings → Pages → Source: GitHub Actions. Confirm the URL loads in a private window.
2. By default the deployed app shows **SYNTHETIC fixture data** with a red banner. Judges will see that unless the repo variable `VITE_MOCK` is set to `false` and real files are in `public/data/`. Submitting a link that shows fake data would contradict the "no fabricated data" rule in your own PLAN. Either deploy real data or state clearly in the details that the demo uses fixtures.

---

## Project Details

### What it does
The app presents one continuous record of fire detections in Mongolia from 2002 to today, built from NASA FIRMS hotspots on five platforms. It has five parts:
- **Home:** a 3D Earth with the five satellites on real orbits (CelesTrak TLEs), their sensors, launch dates and status.
- **Harmonizing:** raw monthly hotspot counts per platform, showing the discontinuity where VIIRS takes over.
- **Dashboard / calendar:** pick a province and date range; compare a month with the historical median and P25–P75 range; switch between raw and harmonized; download CSV.
- **Story:** a scroll-driven page ("The Handover") with a persistent globe and chart.
- **Forecast:** next-month burning activity per province with an uncertainty range, shown only where it beats the baseline in our pre-agreed backtest. [Status: confirm built before claiming.]

### How the harmonization works
1. Clean FIRMS hotspots (local date UTC+8, keep a confidence label, flag persistent non-vegetation heat sources instead of silently deleting them).
2. Count in a common unit. MODIS pixels count directly. VIIRS detections are grouped into fire units (H3 res 8 cell × overpass) so its finer pixel doesn't inflate counts.
3. Measure conversion ratios only where two platforms overlap: Aqua vs Suomi NPP per calendar month (2012-01-20 → 2021-12-31, ending when Aqua began drifting), and Suomi NPP vs NOAA-20 as a single ratio. Ratios are pooled sums, not averages of yearly ratios.
4. Chain them: Aqua → Suomi NPP → NOAA-20. One platform counts at any moment, so nothing is double counted. The unit is "hotspots Aqua MODIS would have recorded".
5. Validate: leave-one-year-out reconstruction of Aqua from Suomi NPP, a forward test, comparison with a single-ratio baseline, and a leave-one-year-out test for the NOAA-20 ratio. Metrics: WAPE and year-ranking Spearman correlation. [RESULTS: ___]

### Why it matters / intended impact
Fire agencies, herders, researchers and emergency services need to know whether a season is unusual. That answer breaks when the instrument changes. A harmonized record lets a province's current month be compared fairly with 20+ years of history, and gives forecasting models a longer, consistent training set. Mongolia is the proving ground; the same pipeline can run on any bounding box.

### Honest limitations
Informational only, not an official fire warning. Ratios are national monthly averages applied regionally, so they're approximate for individual provinces. Detections in the last months come from NOAA-20 with chained ratios, so uncertainty grows. 2002 and 2026 are partial years. Boundaries date from 2017. Aqua's orbit has been drifting since 2022, which is why the calibration window ends in 2021. [Add the validation outcome here, good or bad.]

### Tools and technology
- **Data pipeline:** Python 3.11, pandas, NumPy, PyArrow, GeoPandas, H3 (v4), scikit-learn, LightGBM (forecast model).
- **Web app:** TypeScript, React, Vite, react-globe.gl / three.js (3D globe), satellite.js (orbit propagation), React Router, Vitest.
- **Delivery:** static JSON contracts between pipeline and app, GitHub Actions CI, GitHub Pages.
- **Languages:** English and Mongolian interface.

### What's creative
- The Fusion identity: our icon is a MODIS circle and a VIIRS circle overlapping into white light, and the story page casts Fusion as the character that steps in when the retiring satellites worry about handing over their history. Motto: together, forward.
- The "baton relay" framing: the sensors aren't swapped, a count is handed along a single chain.
- Showing the raw jump next to its removal, so the correction is visible rather than asserted.
- Reconstructing a retired sensor from its successor as the test of the method.
- A kill criterion agreed before seeing results: forecasts appear only where they beat the baseline by ≥5% and the bootstrap interval excludes zero.
- A claims ledger tying every on-screen number to the script that produced it.

### Factors we considered
Satellites can't be steered and don't share data, so harmonization is purely ground-side analysis of archived data. We considered double counting, differing pixel size, day/night differences, Aqua orbit drift, partial years, and persistent industrial heat sources.

*(Don't put "first" or "rescue/prevent" claims in the final text; PLAN §7 forbids over-promising.)*

---

## Use of Super Intelligence (SI)

Tick whichever options in the form match. From the repo (`docs/ai_usage.md`, `app/src/story/AI_USAGE.md`), these apply:

- **Code and data** ✔ (Claude Code was used to write app code, the story engine and tests, and to run visual QA.)
- **Text** ✔ if the form has it (Mongolian UI strings in `strings/mn.json` were AI-written and flagged `needs-native-proof`; chapter copy and docs were AI-assisted.)
- **Images / video / audio:** tick only if you used AI to generate any. The repo shows none. Note the form requires a visible SI watermark on any such media.
- If someone on the team used another assistant for the planning documents or ETL, tick that too.

**Action needed:** `docs/ai_usage.md` is empty (header row only). The form wants code/data SI use acknowledged in descriptive text and metadata. Merge the three rows from `app/src/story/AI_USAGE.md` into it, and add the team's other uses. Fill the "Person" and "Human review by" columns. Suggested sentence for the details field or README:

> "AI assistants (Anthropic Claude, via Claude Code) helped write application code, tests and documentation. All AI use is logged in docs/ai_usage.md and was reviewed by team members. Mongolian UI strings were drafted by AI and are marked for native-speaker review."

No NASA logos or mission identifiers were generated or modified; keep it that way (the satellite "plates" in `app/src/story/refs/` should be checked against this rule before they appear in the demo).

---

## NASA Data (required)

| Link Text | Link URL |
|---|---|
| NASA FIRMS Archive Download: MODIS C6.1 (Terra, Aqua) and VIIRS (Suomi NPP, NOAA-20, NOAA-21) active-fire detections for Mongolia | https://firms.modaps.eosdis.nasa.gov/download/ |
| NASA FIRMS Area API: near-real-time hotspots for the world map (2026-11-05 to 2026-11-14) | https://firms.modaps.eosdis.nasa.gov/api/area/ |
| NASA FIRMS home page (data description and citation) | https://firms.modaps.eosdis.nasa.gov/ |
| NASA Earthdata: Transitioning from Suomi NPP VIIRS | https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know |
| NASA LAADS: MODIS to VIIRS transition | https://ladsweb.modaps.eosdis.nasa.gov/learn/modis-to-viirs-transition |
| MODIS C6/C6.1 Active Fire User Guide | https://earthdata.nasa.gov/s3fs-public/2023-09/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf |
| NASA Terra mission page (launch date, status) | https://science.nasa.gov/mission/terra/ |
| NASA Aqua mission page (launch date, status) | https://science.nasa.gov/mission/aqua/ |
| NASA Aqua Status, March 2022 | https://aqua.nasa.gov/sites/default/files/AquaStatus_March2022.pdf |
| NASA NTRS: Terra orbit drift poster (20250000522) | https://ntrs.nasa.gov/citations/20250000522 |

*Verify each link opens publicly before submitting.* If `earth-day.jpg` is a NASA image, add its exact source page here.

---

## Space Agency Partner & Other Data

| Link Text | Link URL |
|---|---|
| CelesTrak GP orbital elements (satellite orbits on the Home globe) | https://celestrak.org/NORAD/elements/gp.php |
| geoBoundaries Mongolia ADM1 (province boundaries, ODbL 1.0, © OpenStreetMap contributors) | https://www.geoboundaries.org/api/current/gbOpen/MNG/ADM1/ |
| Natural Earth 1:110m countries (world land outline and continent assignment, public domain) | https://www.naturalearthdata.com/downloads/110m-cultural-vectors/ |
| NOAA NESDIS (NOAA-20 / NOAA-21 operational status) | https://www.nesdis.noaa.gov/ |
| H3 geospatial index (Uber, Apache-2.0) | https://h3geo.org/ |
| react-globe.gl (3D globe library, MIT) | https://github.com/vasturiano/react-globe.gl |
| satellite.js (orbit propagation, MIT) | https://github.com/shashwatak/satellite-js |
| three.js (3D rendering, MIT) | https://github.com/mrdoob/three.js |
| LightGBM (forecast model) | https://lightgbm.readthedocs.io/ |
| pandas, GeoPandas, scikit-learn (data and modelling libraries) | https://pandas.pydata.org/ |
| Earth texture `earth-day.jpg`: **[SOURCE UNKNOWN, fill in]** | **[URL]** |

Meteomatics is left out on purpose: the repo only has a connection check, not weather data. Add it back only if it was really used.

---

## Gaps to close before you submit

1. **Earth texture credit.** `app/src/globe/assets/earth-day.jpg` has no recorded source in the repo. If it's a NASA image (e.g. Blue Marble), list it under NASA Data with its exact page; if it's from elsewhere, check its licence and list it under Other. The same applies to `land.json` / `mongolia.json` outlines (generated by `scripts/globe/make_outlines.py`; name the source dataset).
2. **Real data vs fixtures** in the live app (see Project section).
3. **Validation numbers.** None are in the repo. `docs/claims.md` has only globe/satellite rows. Run the pipeline and fill the `[RESULT]` slots, or remove those claims.
4. **Meteomatics.** `docs/research/meteomatics.md` still says "NOT CHECKED YET". Don't mention weather features or list Meteomatics unless it was used.
5. **Forecast page.** Confirm what's actually live. Remove the bullet if it isn't.
6. **`docs/credits.md`** is referenced by the README but doesn't exist yet.
7. **Demo video/slides** and their public link.
8. **Team and licences.** MIT licence is in the repo; keep NASA imagery free of logos/endorsement implication.
