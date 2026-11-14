"""Source of truth for the GitHub issues. Edit here, then regenerate (see create_issues.py).

Each task is one ticket that can be finished on its own:
  - start_with:  what you can start from RIGHT NOW (fixtures / synthetic data / local data / nothing)
  - blocked_by:  only REAL blockers (another ticket's output). Contracts and fixtures are not blockers.
IDs follow TASKS.md so the two stay traceable. Lane edit rights: TASKS.md section 1.
"""

LANES = {"P1": "Data + Harmonization", "P2": "Validation + ML", "P3": "Globe + Forecast screen",
         "P4": "App UI + deploy + weather", "P5": "Story / QA / Lead"}

# wave 0 = start now (gate G0) · wave 1 = parallel, no real-data wait · wave 2 = needs real output from an earlier ticket
# tags: "lean" = in the lean MVP (README of ISSUES.md) · "ml" = headline forecast product (PLAN D15)


def T(id, title, lane, wave, box, summary, done, edits, start_with="fixtures", blocked_by=(), gate=None,
      tags=(), out="", ref=""):
    return dict(id=id, title=title, lane=lane, wave=wave, box=box, summary=summary, done=list(done), edits=edits,
                start_with=start_with, blocked_by=list(blocked_by), gate=gate, tags=list(tags), out=out, ref=ref)


TASKS = [
    # ───────────── WAVE 0: start now, nothing blocks these ─────────────
    T("P2-01", "Finish contracts and synthetic fixtures", "P2", 0, "1 h",
      "contracts/ and fixtures/ already cover regions, calendar, hex_year, pipeline_stats, ratios, validation and monthly_counts. "
      "Add the missing shapes so every other lane can build against fixtures: harmonized_monthly, weather_monthly, baseline, "
      "forecast, model_metrics, matches_summary, case_study, satellites.",
      ["Every file listed in contracts/README.md has a documented shape and a fixture", "`python fixtures/check_fixtures.py` passes",
       "P1, P3 and P4 confirm in the issue that they can read what they need"],
      "contracts/, fixtures/", "nothing", gate="G0", tags=["lean"], ref="TASKS P2-01 · PLAN §3 data contract"),
    T("P4-01", "App scaffold, MOCK data client and public URL", "P4", 0, "1 h",
      "Vite + React + TS app with routes Home / Harmonize / Forecast / Region + Calendar / Method, a typed data client that reads "
      "/data/*.json (fixtures when MOCK=true, real files when MOCK=false), and a static deploy with a public URL.",
      ["Anyone can clone, install and run it", "The public URL opens in an incognito window and on a phone", "Every route renders a placeholder from fixtures"],
      "app/ (scaffold), app/package.json, deploy config", "fixtures", gate="G0", tags=["lean"], ref="TASKS P4-01"),
    T("P4-W1", "Meteomatics gate: can we get history since 2003?", "P4", 0, "30 min",
      "Decide yes/no for weather features (ML v2). Check the account type (Space Apps / trial / Free Basic), whether history from 2003 "
      "is available (one small test query), the query limit and the exact parameter names. Free Basic = no (24 h of history only).",
      ["`docs/research/meteomatics.md` states account type, history limit, query limit, parameter names", "A clear YES or NO is posted in this issue and tagged to P2"],
      "docs/research/meteomatics.md, .env.example", "nothing", gate="G0", tags=["ml"], ref="TASKS P4-W1 · PLAN D15, §9.11"),
    T("P5-01", "Fix the end time T and assign names to lanes", "P5", 0, "30 min",
      "Write the hackathon end time T and the freeze (T − 4 h) with real clock times, put a name next to each lane in TASKS.md, "
      "and assign PLAN §9 open questions to owners.",
      ["TASKS.md has T, freeze time and one name per lane", "Every open question in PLAN §9 has an owner"],
      "TASKS.md, PLAN.md §9", "nothing", gate="G0", ref="TASKS P5-01"),
    T("P1-01", "Python environment: pinned requirements and .env.example", "P1", 0, "15 min",
      "etl/requirements.txt must also include lightgbm and scikit-learn (h3 is already there). Check `.env.example` lists "
      "FIRMS_MAP_KEY and the Meteomatics variables. Everyone installs in a fresh venv.",
      ["A fresh venv installs from requirements.txt without error", "`python etl/run_all.py --from clean_hotspots` still starts"],
      "etl/requirements.txt", "nothing", gate="G0", tags=["lean"], ref="TASKS P1-01"),
    T("P3-01", "Satellite metadata and TLE snapshot -> satellites.json", "P3", 0, "45 min",
      "Script that snapshots CelesTrak TLEs for Terra, Aqua, Suomi NPP, NOAA-20, NOAA-21 at build time, plus sensor, launch date and source link. "
      "The demo never calls the network.",
      ["`public/data/satellites.json` matches the contract", "Running the script twice gives the same structure", "No live API call at runtime"],
      "scripts/tle/, public/data/satellites.json", "nothing", blocked_by=["P2-01"], gate="G0", ref="TASKS P3-01 (needs the satellites shape from P2-01)"),

    # ───────────── WAVE 1: parallel, no real-data wait ─────────────
    T("P1-03", "Ratio functions with unit tests (synthetic data)", "P1", 1, "2 h",
      "Pure functions: pooled monthly ratio r1 = sum(Aqua)/sum(S-NPP) with fallback to one yearly ratio below 30 fire units, r2 as a single number, "
      "and the harmonized series along the reference chain Aqua -> S-NPP -> NOAA-20. The function takes the years to calibrate on, because P2 "
      "calls it from leave-one-year-out and rolling-origin tests.",
      ["Unit tests are green on synthetic data", "Direction is r = sum(previous)/sum(next); harmonized = next count x r", "P2 can import and call it with a chosen calibration window"],
      "etl/harmonize_*.py, etl/tests/", "synthetic data", gate="G1", tags=["lean", "ml"], ref="TASKS P1-03 · PLAN D3, D7"),
    T("P1-05", "Filtering: vegetation fires only, static heat sources flagged not deleted", "P1", 1, "1.5 h",
      "Extend the existing cleaning: keep type 0, flag persistent heat sources (power plants, mines) instead of deleting them, "
      "and build the NRT mask from archive years. Log what each rule removes.",
      ["Toggling the flag changes the counts, and the numbers removed per rule are logged", "Output stays reproducible with `python etl/run_all.py`"],
      "etl/clean_hotspots.py", "local data", gate="G1", tags=["lean"], ref="TASKS P1-05 · PLAN §3.3"),
    T("P1-07", "H3 test vectors", "P1", 1, "15 min",
      "20 coordinates with their H3 res 5 and res 8 IDs, so the browser (h3-js v4) and Python (h3 v4) are proven to agree.",
      ["`etl/tests/h3_vectors.json` exists and the Python test passes"],
      "etl/tests/", "nothing", blocked_by=["P1-01"], gate="G0", ref="TASKS P1-07 · PLAN D9"),
    T("P2-03", "Level 1 baseline: monthly median and P25-P75", "P2", 1, "1 h",
      "Per region and calendar month: median and P25-P75 of harmonized counts with the non-interpolating quantile (method=\"lower\"), computed on log1p. "
      "Start on the synthetic fixture; rerun on real data when it exists.",
      ["`baseline.json` matches the contract", "Three numbers checked by hand against the source"],
      "etl/validation/, public/data/baseline.json", "fixtures", blocked_by=["P2-01"], tags=["lean", "ml"], ref="TASKS P2-03 · PLAN D11"),
    T("P3-02", "Home globe: five platforms orbiting", "P3", 1, "2 h",
      "Dark space with stars, react-globe.gl, five platforms moving via satellite.js, dotted orbits, thin lines linking same-sensor platforms "
      "(MODIS vs VIIRS colours), area outside Mongolia dimmed.",
      ["Runs smoothly on a phone", "Reads satellites.json only", "Uses i18n keys for any text"],
      "app/src/globe", "fixtures", blocked_by=["P4-01", "P3-01"], tags=["lean"], ref="TASKS P3-02"),
    T("P3-03", "Satellite hover card", "P3", 1, "45 min",
      "Hover shows platform, sensor, launch date, the last detection in OUR data, and an official-status line with a source link. "
      "Never hand-write \"currently operating\".",
      ["All text comes from i18n keys", "Last-detection date comes from pipeline_stats.json"],
      "app/src/globe", "fixtures", blocked_by=["P3-02"], ref="TASKS P3-03"),
    T("P3-04", "h3-js v4 agrees with Python h3", "P3", 1, "15 min",
      "Run the H3 test vectors through h3-js v4 and compare.",
      ["Every ID matches"], "app/src/globe", "nothing", blocked_by=["P1-07", "P4-01"], ref="TASKS P3-04"),
    T("P3-05", "Harmonize hero: Raw vs Harmonized globes with a year scrubber", "P3", 1, "3 h",
      "Two globes with one synced camera, H3 res 5 hexes sized/coloured by yearly count, 2003-2025 scrubber, small line chart under each, "
      "label \"raw pixels\" on the left, note that applying the regional monthly ratio per hex is an approximation. Build on hex_year fixtures first.",
      ["Scrubbing past 2012 makes the Raw globe jump while the Harmonized one stays level", "Works on fixtures and on real hex_year files"],
      "app/src/harmonize", "fixtures", blocked_by=["P4-01"], ref="TASKS P3-05 · PLAN D12"),
    T("P3-06", "WebGL fallback to the calendar pair", "P3", 1, "45 min",
      "When WebGL is missing or FPS is low, switch automatically to the \"For scientists\" calendar pair.",
      ["With WebGL disabled the fallback shows, no crash"], "app/src/globe, app/src/harmonize", "fixtures", blocked_by=["P3-05", "P4-07"], tags=["lean"], ref="TASKS P3-06"),
    T("P3-07", "Forecast screen", "P3", 1, "2.5 h",
      "Provinces ranked by expected deviation from normal. Per province: forecast with P10-P90 range, baseline, \"X times more/less than usual\", top 3 features. "
      "If a region fails the kill check, show only the normal range. Backtest panel: ML vs Level 1-2, harmonized-all vs raw-VIIRS-only, v1 vs v2. Disclaimer shown.",
      ["Every number comes from JSON", "No empty state or \"N/A\"", "Works on fixtures, then on real forecast.json / model_metrics.json"],
      "app/src/forecast", "fixtures", blocked_by=["P4-01"], gate="G2", tags=["ml"], ref="TASKS P3-07 · PLAN D15, §4"),
    T("P4-02", "Layout, language switch, tokens, Mongolian glyphs", "P4", 1, "1 h",
      "Shared layout, MN/EN switch with the i18n plumbing, colour tokens, and a font check for ө and ү.",
      ["Switching language changes all strings", "Cyrillic renders correctly"],
      "app/ (not globe, harmonize, forecast, i18n)", "fixtures", blocked_by=["P4-01"], tags=["lean"], ref="TASKS P4-02"),
    T("P4-03", "Calendar: month x year with Raw toggle", "P4", 1, "2.5 h",
      "Month-by-year heatmap with a colour-blind-safe sequential ramp, Raw view toggle, NOAA-20 portion (from 2026-11-02) dashed, future months dashed, "
      "partial-month note and tooltips. Built on the calendar fixture; flips to real data with MOCK=false.",
      ["Keyboard navigable, colour plus a number", "Works on fixtures and on real calendar JSON"],
      "app/ (calendar)", "fixtures", blocked_by=["P4-01"], gate="G1", tags=["lean"], ref="TASKS P4-03 · PLAN §4"),
    T("P4-04", "Region and date range pickers with CSV download", "P4", 1, "1.5 h",
      "Pick a province / country, choose a date range, download the calendar as CSV from the JSON in the browser, and link the pre-built hotspot CSVs.",
      ["Selecting a province then downloading yields a CSV that opens in Excel"],
      "app/", "fixtures", blocked_by=["P4-03"], tags=["lean"], ref="TASKS P4-04"),
    T("P4-05", "\"This month vs normal\" sentence", "P4", 1, "45 min",
      "Sentence like \"This month fires in your province are X times the usual\"; special wording when the baseline is under 5 fire units; "
      "always show \"informational, not an official warning\".",
      ["Text comes from i18n keys, numbers from JSON", "Both wording variants render"],
      "app/", "fixtures", blocked_by=["P4-03"], tags=["lean"], ref="TASKS P4-05"),
    T("P4-07", "\"For scientists\": Raw vs Harmonized calendars side by side", "P4", 1, "45 min",
      "A page/section with the two calendars next to each other. Also the fallback target for the hero (P3-06). No WebGL.",
      ["Importable by P3", "Shows the 2012 step in Raw and its absence in Harmonized"],
      "app/ (calendar)", "fixtures", blocked_by=["P4-03"], tags=["lean"], ref="TASKS P4-07"),
    T("P4-08", "No empty states, and the production build rejects synthetic data", "P4", 1, "45 min",
      "Skeletons while loading; a real sentence for regions with no hotspots; never \"N/A\" or an empty chart. "
      "A production build must fail if any loaded file says synthetic: true.",
      ["Building for production with fixtures fails", "An empty region shows a real sentence"],
      "app/", "fixtures", blocked_by=["P4-01"], tags=["lean"], ref="TASKS P4-08"),
    T("P5-02", "Mongolian and English text", "P5", 1, "2 h",
      "UI strings, calendar explanations, anomaly sentence templates, forecast wording (\"is expected to be\", \"normal range\", the sentence for regions that fail the kill check), "
      "disclaimer, Method text and the one-line reason why satellites cannot be re-tasked.",
      ["Every key exists in both languages", "A person has read both languages"],
      "app/src/i18n/{mn,en}.json", "nothing", blocked_by=["P4-02"], tags=["lean"], ref="TASKS P5-02"),
    T("P5-03", "Credits and licences", "P5", 1, "1 h",
      "docs/credits.md with FIRMS citation, NASA imagery credit, Meteomatics, geoBoundaries (ODbL, © OpenStreetMap contributors), Natural Earth, CelesTrak, GIBS. "
      "Ready-to-paste footer/About text.",
      ["Every dataset, font, icon and library used appears with its licence"], "docs/credits.md", "nothing", ref="TASKS P5-03"),
    T("P5-04", "Platform status page with sources", "P5", 1, "45 min",
      "docs/platform_status.md: Terra, Aqua, S-NPP, NOAA-20, NOAA-21, each with a source link. Where sources disagree on Aqua, record both.",
      ["P3 can quote it in the hover card"], "docs/platform_status.md", "nothing", ref="TASKS P5-04"),
    T("P5-05", "Limitations text", "P5", 1, "45 min",
      "PLAN §8 limitations plus model limits: short history, monthly resolution, weather is a point average, a forecast is not an alert.",
      ["In i18n and in docs/limitations.md"], "docs/limitations.md, app/src/i18n", "nothing", tags=["lean"], ref="TASKS P5-05"),

    # ───────────── WAVE 2: needs real output from another ticket ─────────────
    T("P1-06", "Units, labels and monthly_counts.parquet", "P1", 2, "2 h",
      "MODIS counted per pixel; VIIRS counted as fire units (H3 res 8 x overpass, +-10 min). Raw VIIRS pixel count kept separately. "
      "Label country, 22 provinces and day/night. regions.json gets 3-5 representative points per region for weather.",
      ["`monthly_counts.parquet` matches the contract", "regions.json is complete for all 22 units"],
      "etl/build_cell_days.py, etl/data/, public/data/regions.json", "local data", blocked_by=["P1-05"], gate="G1", tags=["lean", "ml"], ref="TASKS P1-06 · PLAN D9"),
    T("P1-08", "Real harmonization: ratios and harmonized_monthly", "P1", 2, "1.5 h",
      "Run the ratio functions on the real counts: ratios.json (with diagnostics by country, day/night and Aqua drift), r2 sanity within +-15%, "
      "and harmonized_monthly.parquet for 22 units plus the country.",
      ["P2 can read the parquet", "A Raw vs Harmonized plot is saved, whatever the result"],
      "etl/harmonize_*.py, public/data/ratios.json", "local data", blocked_by=["P1-03", "P1-06"], gate="G1", tags=["lean", "ml"], ref="TASKS P1-08"),
    T("P1-09", "Assemble calendar, hex_year and pipeline_stats JSON", "P1", 2, "1.5 h",
      "Write public/data/calendar/*.json, hex_year/{raw,harm}.json (raw = raw pixels) and pipeline_stats.json. Merge baseline and forecast from P2 read-only when present. "
      "Re-running gives identical output.",
      ["All files match the contract and say synthetic: false", "The calendar page shows real Mongolia data"],
      "public/data/calendar/, hex_year/, pipeline_stats.json", "local data", blocked_by=["P1-08"], gate="G1", tags=["lean"], ref="TASKS P1-09"),
    T("P1-10", "Hotspot CSV exports by region and year", "P1", 2, "1 h",
      "Pre-built CSVs in public/data/exports/ with platform, date/time, lat, lon, FRP, confidence, scan, track and flags.",
      ["Opens in Excel with sensible columns"], "public/data/exports/", "local data", blocked_by=["P1-06"], tags=["lean"], ref="TASKS P1-10"),
    T("P1-11", "Harmonization methods document", "P1", 2, "45 min",
      "docs/methods_harmonization.md: pipeline steps, ratios, limitations. Every number comes from a script.",
      ["Reproducible from the repo"], "docs/methods_harmonization.md", "nothing", blocked_by=["P1-08"], ref="TASKS P1-11"),
    T("P2-02", "Harmonization validation: Aqua rebuilt from VIIRS", "P2", 2, "1.5 h",
      "Leave-one-year-out for r1 (2012-2021), forward test, one-ratio baseline, and r2 leave-one-year-out; WAPE plus correlation, validation.json and a plot. "
      "Develop on synthetic data, then run on real data with one command. A bad result is reported as is.",
      ["validation.json matches the contract", "One command reruns it on real data", "A plot is saved"],
      "etl/validation/, public/data/validation.json", "synthetic data", blocked_by=["P1-03"], gate="G2", tags=["lean"], ref="TASKS P2-02 · PLAN D10"),
    T("P2-04", "Backtest framework with a leakage test", "P2", 2, "2 h",
      "Rolling-origin 2015-2025 (each year trained on all earlier years, r1 recomputed from earlier years only), WAPE, bootstrap over years, "
      "any model plugs in through one interface. A test fails if a feature uses information after month m.",
      ["Level 1 runs through the framework and produces a WAPE", "The leakage test fails when it should"],
      "etl/ml/", "synthetic data", blocked_by=["P1-03", "P2-03"], tags=["ml"], ref="TASKS P2-04 · PLAN D15"),
    T("P2-05", "Level 2: log-anomaly persistence", "P2", 2, "1 h",
      "One beta per region inside the framework; WAPE by region.",
      ["Level 2 WAPE reported by region next to Level 1"], "etl/ml/", "synthetic data", blocked_by=["P2-04"], tags=["ml"], ref="TASKS P2-05 · PLAN D11"),
    T("P2-06", "ML v1: LightGBM on fire history", "P2", 2, "2.5 h",
      "Feature table (last 1-3 months, same month last year, baseline median, log-anomaly, cyclical month, region), small regularized LightGBM with a Ridge fallback.",
      ["v1 WAPE by region in one table with Level 1 and 2"], "etl/ml/", "synthetic data", blocked_by=["P2-04", "P1-08"], tags=["ml"], ref="TASKS P2-06 · PLAN D15"),
    T("P4-W2", "Download weather history by month", "P4", 2, "2 h",
      "Only if the gate says yes. Representative points per region from regions.json, 2002-2026 daily temperature, precipitation, humidity, wind, snow depth, "
      "many points per query, resumable, query counter, aggregated to weather_monthly.parquet.",
      ["Total queries stay under the limit", "Every month has a value for all 22 regions"],
      "etl/weather/", "fixtures", blocked_by=["P4-W1", "P1-06"], tags=["ml"], ref="TASKS P4-W2"),
    T("P2-07", "ML v2: v1 plus weather", "P2", 2, "1.5 h",
      "Add current-month weather features only (no future weather). Skip if the gate was NO and say why in docs/methods_model.md.",
      ["v1 vs v2 WAPE side by side"], "etl/ml/", "synthetic data", blocked_by=["P2-06", "P4-W2"], tags=["ml"], ref="TASKS P2-07"),
    T("P2-08", "Kill check and evidence -> forecast.json and model_metrics.json", "P2", 2, "2 h",
      "Per region: at least 5% lower WAPE than the baseline AND a bootstrap interval that excludes zero, else show only the normal range. "
      "Three backtest arms (raw-all, raw-VIIRS-only, harmonized-all), P10-P90 from residuals, feature importance.",
      ["Each region is decided: show forecast or normal range only", "A losing result is reported as is"],
      "etl/ml/, public/data/{forecast,model_metrics}.json", "synthetic data", blocked_by=["P2-06"], gate="G2", tags=["ml"], ref="TASKS P2-08 · PLAN D15"),
    T("P2-09", "Model methods document", "P2", 2, "45 min",
      "docs/methods_model.md: features, leakage rules, backtest, kill outcome, limits.",
      ["Every number comes from a script"], "docs/methods_model.md", "nothing", blocked_by=["P2-08"], tags=["ml"], ref="TASKS P2-09"),
    T("P4-06", "Method section (pipeline steps and tests)", "P4", 2, "1 h",
      "Left: numbered pipeline steps. Right: validation tests (Aqua LOYO, forward, one-ratio baseline, r2 LOYO, ML backtest, kill check) with numbers from JSON.",
      ["No hard-coded number"], "app/ (method)", "fixtures", blocked_by=["P4-03"], gate="G2", tags=["lean"], ref="TASKS P4-06 · PLAN D13"),
    T("P5-06", "Claims ledger (continuous)", "P5", 2, "ongoing",
      "Every number in the demo, pitch and UI gets a row: claim, value, script, output file, commit.",
      ["No number in the pitch is missing from docs/claims.md"], "docs/claims.md", "nothing", blocked_by=["P1-09"], tags=["lean"], ref="TASKS P5-06"),
    T("P5-07", "QA on two phones and a laptop", "P5", 2, "1 h",
      "Test the deployed site on two phones and a laptop, slow network, reduced motion and keyboard. File each bug with the owner's ID.",
      ["No blockers open"], "docs/", "nothing", blocked_by=["P1-09", "P4-06", "P3-07"], gate="G2", ref="TASKS P5-07"),
    T("P5-09", "Demo script, pitch and hard-question sheet", "P5", 2, "2 h",
      "After the freeze: script from the claims ledger, pitch that does not over-promise, answers to the hard questions (leakage, baseline margin, ratio error).",
      ["Every number is in the ledger", "The submission deck is 7 slides or fewer, or the video is 30 s or less"],
      "docs/", "nothing", blocked_by=["P5-06"], gate="G3", ref="TASKS P5-09"),
    T("P5-10", "Submit", "P5", 2, "1.5 h",
      "README run steps, every link works logged-out, recording, submission form, screenshot of confirmation.",
      ["Submitted, with a screenshot saved"], "docs/", "nothing", blocked_by=["P5-09"], gate="G3", ref="TASKS P5-10"),
]
