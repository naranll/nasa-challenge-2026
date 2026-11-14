# Space Khuushuur — Team Task Boards (5 people, parallel lanes)
**Written Sat 14 Nov 2026 ~13:30 (UTC+8) · Product cutoff Sun 18:00 · Submit by Sun 17:30 · Freeze Sun 10:38**
Companion to *Master Meta-Prompt v2*. This file answers one question: **who does what, in which folder, by when, and where they must stop.**

Lanes are by *role*, not skill (everyone can do everything). Swap lane names between people however you like, but keep the lane boundaries.

| Lane | Role | Owns (folders) |
|---|---|---|
| **P1** | Data & Harmonization | `/etl` · `/artifacts/{detections,cell_month,region_stats,seam,admin}` · `/app/src/exports` · harmonization docs |
| **P2** | Events & Sentinel (ML) | `/events` · `/ml` · `/artifacts/{events,risk,context,numrug}` · Sentinel docs |
| **P3** | Frontend & Immersive | `/app` (everything except `exports`, `whatif`, `academy`, `i18n`) |
| **P4** | Cloud, Backend, Reach & Optimizer | `/infra` · `/.github` · `/reach` (cards, Telegram) · `/optimizer` · `/app/src/whatif` · root `Makefile` |
| **P5** | Design, Education, Domain, QA & Team Lead (board/PM) | `/design` · `/app/src/academy` · `/app/src/i18n` · `/docs` (except method/validation docs) |

---

## 1. Rules of the road (read once, obey always)

**The 15 rules**
1. **Own your folders; read everyone else's.** To change someone else's file, open a PR to them or post a request in the channel. Never "just fix it".
2. **Contracts before code.** Lanes talk only through files in `/contracts` (JSON Schema) and `/fixtures` (tiny sample data). Day-0 job: write the contracts and fixtures so nobody waits for anybody.
3. **Board-only work.** If it isn't a row on the board, it isn't work. New idea → `docs/parking_lot.md`. P5 reviews the parking lot at each sync; nothing is promoted before the freeze unless it kills a risk.
4. **Time-boxes are hard.** At 100% of a time-box: ship what exists (or a stub), post status, move on. One extension of ≤30% per task, approved by P5 (and by the owner's reviewer if it changes a contract).
5. **AI Scope Charter in every AI session** (template below). The AI works only in your folders and must give a **plan first**; reject any plan that touches files outside your folders or adds scope.
6. **One dependency manifest per lane.** P1 `/etl/requirements.txt`, P2 `/ml/requirements.txt`, P3 `/app/package.json`, P4 root and `/infra`. New library → post in channel first. No lane edits another lane's manifest.
7. **Small PRs** (<400 changed lines), branch `<lane>/<task-id>`, reviewer answers in 15 min, merge only if the site still builds/deploys. **Reviewers:** P1↔P2, P3↔P5, P4 reviewed by P1.
8. **Research once.** Before searching/asking AI about datasets, APIs or papers, check `docs/research/`. Save findings there as `<topic>.md` (≤1 page) so no one repeats it.
9. **Two-pass rule.** AI builds → human verifies against "Done when" → at most one refinement pass → freeze the module. Polishing beyond that happens only in the polish window (Sun 00:30–10:38) and only for items on the board.
10. **Numbers only from scripts.** Any number that could appear in the demo comes from a script output and is added to `docs/claims_ledger.csv` the same day.
11. **No fabrication.** No invented data, citations, safety advice or emergency numbers. Unknown → write "ASSUMPTION" and tell P5.
12. **AI log:** every PR description ends with `AI-used: <tool> — <what for> — <human-reviewed by>`. P5 consolidates into `docs/ai_usage.md`.
13. **Secrets:** `.env` only, never committed. A pre-commit scan is on (P4).
14. **Finished early → Help Queue (below), in order.** Don't invent adjacent work.
15. **Before you sleep:** write `docs/handoff/<lane>.md` (what's done, what's running, what the AI may continue, what it must not touch) and queue only **bounded** AI jobs (a named script, a time/cost cap, a branch). No open-ended agent runs overnight.

**AI Scope Charter — paste at the start of every AI session (fill the brackets)**
```
You are assisting [NAME] ([LANE]) on Space Khuushuur's NASA Space Apps project (wildfire intelligence for Mongolia).
YOU MAY EDIT ONLY: [OWNED FOLDERS].
READ-ONLY: everything else, including /contracts and /fixtures (propose schema changes as a diff, never edit silently).
RULES:
1) Before any action, reply with a PLAN: files to create/modify and why. If it touches files outside my folders or >5 files, stop and ask.
2) Do only the current task ID below. No refactors, renames, extra features or "improvements".
3) Do not add dependencies outside [MANIFEST]. Ask first.
4) Build against /contracts schemas and /fixtures; if reality differs, tell me, don't bend the schema.
5) Never invent data, numbers, citations or safety advice. Mark assumptions.
6) No secrets in code or logs.
7) Stop at the time-box and report: done / not done / risks.
8) If you finish early, stop. Do not start adjacent work. Ideas go to docs/parking_lot.md.
9) Add one line to docs/ai_usage.md describing what you did.
CURRENT TASK: [ID — text — Done when]
```

---

## 2. The interface contracts (what lanes exchange)

| ID | Contract | Producer → Consumers | Location |
|---|---|---|---|
| **C1** | `detections` (Parquet, partitioned year/platform): platform, stream, lat, lon, h3_r6, h3_r8, utc_ts, local_date, daynight, conf_class, frp, type, scan, track, pixel_km2, persistent_flag | P1 → P2, P3 (via exports), P4 (serving) | `/artifacts/detections/` |
| **C2** | `cell_month` (Parquet: h3_r8, month, hhc, hhc_lo, hhc_hi, raw_modis, raw_viirs, flags) + `region_stats/{admin_id}.json` (series, median/P10/P90, anomaly, rank, pace, season metrics) + `seam_demo.json` | P1 → P3, P5 (numbers) | `/artifacts/cell_month`, `/region_stats`, `/seam` |
| **C3** | `events` (GeoJSON + Parquet): event_id, first/last UTC, duration, n_det, platforms, peak/sum FRP, hull, status, in_protected, dist_road/settlement, access_class, cause_hint, persistent_prob | P2 → P3, P4, P5 | `/artifacts/events/` |
| **C4** | `risk/latest.json`, `risk/YYYY-MM-DD.json`, `risk_by_soum.json`: h3_r6 → p, level(1–4), top-3 driver keys, valid_from/to, model_version | P2 → P3, P4 (cards, optimizer) | `/artifacts/risk/` |
| **C5** | `allocation/scenario.json`: inputs (k crews, bases), chosen positions, coverage %, inaccessible zones | P4 → P3/P4 (what-if) | `/artifacts/allocation/` |
| **C6** | `cards/index.json` + PNG/TXT per soum-day | P4 → public, P5 (review) | `/artifacts/cards/` |
| **C7** | `admin` GeoJSON (aimag/soum) + `h3_to_admin.parquet` | P1 → everyone | `/artifacts/admin/` |
| **C8** | `context_cells.parquet` (h3_r6: land cover, dist_road, dist_settlement, protected, access_class) | P2 → P4 (optimizer), P2 | `/artifacts/context/` |
| **C9** | `design/tokens.json`, `i18n/{mn,en}.json`, `risk_words.json` (level wording, driver key → sentence, advice) | P5 → P3, P4 (cards), P2 (driver keys list) | `/design`, `/app/src/i18n` |

Rules: a contract change = PR to `/contracts` + message to every consumer + version bump. Fixtures keep a lane unblocked until the real file exists; real data replaces fixtures by flipping `MOCK=false`, not by rewriting code.

---

## 3. Calendar of gates, syncs and sleep

| When (UTC+8) | Gate / sync |
|---|---|
| Sat 13:50 | **G0** repo, CI, public URL live, keys safe, charters pasted |
| Sat 16:00 · 21:00 | 5-min syncs (what's blocked? what's next?) |
| Sat 18:40 | **G1** real harmonized calendar for Mongolia on the deployed site; first events on a map |
| Sun 00:30 | **G2** (everyone awake) end-to-end slice on a phone: Today → Calendar → pick area → download CSV; baseline risk live |
| Sun 05:00 · 07:00 · 09:00 | 5–10 min syncs (whoever is awake) |
| **Sun 10:38** | **G3 FEATURE FREEZE** — fixes only |
| Sun 12:38 | Pitch phase begins (team rule: none before) |
| Sun 14:30 | Judge Council (all) |
| Sun 15:30 | Submission dry-run |
| Sun 16:30 | Go/no-go · **17:30 submit** · 18:00 cutoff · (23:59 platform cliff = emergency only) |

**Suggested sleep windows (4.5 h each; never more than 2 asleep; ≥3 always awake):**
- **P1 and P5:** Sat 20:00 → Sun 00:30 (AI runs only bounded batch jobs)
- **P2 and P4:** Sun 00:30 → 05:00
- **P3:** Sun 05:00 → 09:30
- After the freeze, take 20-minute naps in turn. Eat. Water.

---

## 4. Task boards
Format: **ID · Task · Time-box · Due · Needs · Output · Done when.** "Needs" is a task that must reach at least fixture level. 

### Shared (everyone, Sat 13:20–13:50)
| ID | Task | Box | Due | Done when |
|---|---|---|---|---|
| ALL-01 | Get repo from P4, install env, create `.env`, paste your AI Charter, join channel | 30 min | 13:50 | You can run `make check` |
| ALL-02 | Claim your offer: **P1** FIRMS MAP_KEY + Earthdata login · **P2** Meteomatics sign-up + Planetary Computer STAC test query · **P3** GitHub Copilot Free · **P4** Azure (or fallback) + free domain · **P5** Miro hackathon template | 30 min | 13:50 | Key/credential works; stored in `.env`/secrets |

---

### P1 — Data & Harmonization
**You own:** `/etl`, data artifacts for C1/C2/C7, `/app/src/exports`, harmonization methods/validation docs.
**You never:** edit UI components, model code, infra, copy/strings. Never download the global ~45 GB archive. Never invent a new unit or index beyond HHC without P5's OK.
| ID | Task | Box | Due | Needs | Output | Done when |
|---|---|---|---|---|---|---|
| P1-01 | Audit team's FIRMS files: headers, platforms, years, rows, gaps, quirks | 1 h | Sat 14:20 | — | `docs/research/data_audit.md` | Table file×platform×dates×rows; header differences listed |
| P1-02 | Write C1, C2, C7 schemas + 100-row fixtures from real files | 1 h | 14:20 | P1-01 | `/contracts`, `/fixtures` | CI validates fixtures; P2/P3 confirm they can read |
| P1-03 | FIRMS API backfill (Mongolia bbox; MODIS_SP, VIIRS SNPP/N20 SP, NOAA-21, NRT tail): resumable, throttled, Parquet to cloud | 2 h build, then background | start 15:30 | P4-02 | `/etl/backfill` | Survives kill/restart; row counts per platform-year logged |
| P1-04 | Admin shapes (aimag/soum) + H3→admin map (license noted) | 1 h | 16:00 | P1-02 | C7 real | No unmapped H3 cells inside the border |
| P1-05 | `data_availability` + `missing_data` → coverage mask | 1 h | 16:30 | P1-03 | `/etl/coverage` | Known gap days are NA, not zero |
| P1-06 | Canonical pipeline: AOI-local date, H3, filters (type, confidence), persistent-heat-source mask | 3 h | 18:00 | P1-03 | C1 real | Schema-valid; filters reproducible; sanity plots saved |
| P1-07 | **HHC v1:** dedupe → per-platform monthly HHC → Aqua-referenced ratios → H(t) → cell_month | 4 h | **18:40 (G1)** | P1-06 | C2 real | Mongolia monthly series 2002→now; raw vs harmonized plot saved (honest either way) |
| P1-08 | Exports module (pure functions): hotspot CSV for AOI/date/filters (with provenance columns), calendar CSV, `metadata.json` | 1 h | 19:50 | P1-06 | `/app/src/exports` | P3 can call it; CSV opens in Excel with sensible columns |
| *P1 sleeps 20:00–00:30. Queue only: backfill completion + HHC full re-run, bounded, on a branch. Handoff note first.* |
| P1-09 | Region stats: climatology, anomaly, percentile rank, pace-to-date, season metrics, small-sample rule | 2 h | Sun 02:00 | P1-07 | `/artifacts/region_stats` | Three numbers hand-checked |
| P1-10 | Seam demo data (2–3 AOIs, find a real seam) | 1 h | 03:00 | P1-07 | `seam_demo.json` | Raw/harmonized side by side saved; or "no seam" documented |
| P1-11 | Diagnostics: overpass-time drift, ratio stability, scan angle, day/night | 2 h | 05:00 | P1-07 | `docs/methods/diagnostics.md` | 4 figures + 1-paragraph conclusion each |
| P1-12 | Uncertainty bands + bridged/provisional flags | 2 h | 07:00 | P1-07 | C2 v2 | lo/hi populated; flags correct on test months |
| P1-13 | Harmonization validation: leave-one-year-out CV, change-point tests at 2002-07/2012/2018-04/2024-01/2026-11, sensitivity grid | 3 h | 09:30 | P1-12 | `VALIDATION-harmonization.md` + scripts | Pre-registered H1/H2 answered with numbers; limitations listed |
| P1-14 | *(SHOULD)* MODIS burned-area cross-check (Planetary Computer) | 2 h | 10:30 | P1-07 | figure + note | Rank correlation or "not feasible: reason" |
| P1-15 | *(SHOULD)* Central Asia region-pack run (config only) | 1.5 h | 10:30 | P1-07 | `/region-packs/central-asia` | One area produces valid C2 |
| P1-16 | Stabilize: METHODS-harmonization final + claims-ledger rows for every P1 number | 2 h | 12:30 | P1-13 | docs | Every number: script + output + commit |
| P1-17 | Pitch phase: send P5 the exact numbers for the script; SME-judge review of demo claims | 2 h | 14:30 | P5 script | `docs/judge_council.md` | Corrections closed |

### P2 — Events & Sentinel (ML)
**You own:** `/events`, `/ml`, C3/C4/C8, Sentinel docs.
**You never:** touch UI, infra, copy; train on information not available at prediction time; present a model result without a baseline next to it; name or blame any person/company in cause hints.
| ID | Task | Box | Due | Needs | Output | Done when |
|---|---|---|---|---|---|---|
| P2-01 | Write C3, C4, C8 schemas + fixtures (clearly labeled synthetic) | 1 h | Sat 14:20 | — | `/contracts`, `/fixtures` | CI validates; P3/P4 can mock |
| P2-02 | Context layers: OSM roads/settlements/protected areas/mines for Mongolia (ODbL attribution), accessibility class | 3 h | 17:30 | P2-01 | C8 real | dist_road, access_class on all cells; map sanity check |
| P2-03 | **FireEvents v0:** space-time clustering (fixture → real C1) | 3 h | **18:30 (G1)** | P1-06 (partial) | C3 v0 | The Oct 2026 Numrug fire appears as one large event |
| P2-04 | Baselines + labels + splits: climatology, persistence, logistic; temporal + spatial-block splits; publish "seasonal risk" | 3 h | 21:30 | P2-03 | C4 baseline + metrics table | `risk/latest.json` live; metrics saved |
| P2-05 | Events v1: lifecycle, status hysteresis, context join, cause_hint (suggestion only), persistent-source probability | 2 h | 22:45 | P2-03, P2-02 | C3 v1 | 10 random events hand-checked against satellite imagery |
| P2-06 | Feature pipeline (MODIS NDVI/LST/snow via Planetary Computer windows; weather; lags) — **start the job at 22:45** | 1.5 h build + overnight run | job running by 23:15 | P2-04 | `/ml/features` | No-leakage check passes |
| *P2 sleeps 00:30–05:00 (G2 is async for P2). Bounded jobs only: feature build → baseline refits.* |
| P2-07 | LightGBM + CatBoost + ensemble + calibration; temporal + spatial CV | 3 h | Sun 08:00 | P2-06 | model + metrics | Holdout metrics vs baselines tabulated |
| P2-08 | SHAP → top-3 driver keys per cell; send key list to P5 | 1.5 h | 09:00 | P2-07 | C4 drivers | All keys exist in `risk_words.json` |
| **P2-09** | **KILL CHECK 09:30:** does the ensemble beat the best baseline on holdout? Ship ensemble or ship baseline as "seasonal risk" | 15 min | 09:30 | P2-07 | decision note | Decision logged; UI wording matches |
| P2-10 | Daily inference script (NRT + forecast inputs) → `latest.json` | 2 h | 10:00 | P2-07 | `/ml/infer.py` | Runs ≤10 min; P4 can cron it |
| P2-11 | Numrug blind backtest + event reconstruction → `numrug.json` | 2 h | 10:30 | P2-07 | artifact | Uses only information before 8 Oct; result reported either way |
| P2-12 | Sentinel validation: calibration, top-k capture, failure modes | 2 h | 10:30 | P2-07 | `VALIDATION-sentinel.md` | Pre-registered H4 answered |
| P2-13 | *(SHOULD)* Event-based harmonizer bake-off vs HHC | 2 h | 11:30 | P2-05, P1-07 | note | Agreement metric reported |
| P2-14 | Stabilize: model card, METHODS events/Sentinel, claims-ledger rows, run instructions | 2 h | 12:30 | P2-12 | docs | Reproducible with `make ml` |
| P2-15 | Pitch phase: ML-skeptic review of every claim in script/slides/text | 2 h | 14:30 | P5 script | `docs/judge_council.md` | Overclaims removed |

### P3 — Frontend & Immersive
**You own:** `/app` (not `exports`, `whatif`, `academy`, `i18n`).
**You never:** compute science in the browser beyond display (use P1/P2 artifacts); write user-facing text in components (use i18n keys); add libraries without posting; build features not on this board.
| ID | Task | Box | Due | Needs | Output | Done when |
|---|---|---|---|---|---|---|
| P3-01 | Scaffold (Vite + React + TS, MapLibre, router) and connect to P4's preview deploys | 1 h | Sat 14:30 | P4-01 | `/app` | PR previews load on a phone |
| P3-02 | Typed data clients for C2–C6 with `MOCK` mode from fixtures | 1 h | 15:30 | P1-02, P2-01 | `/app/src/data` | App renders every screen shell with fixtures |
| P3-03 | Layout, navigation (Today / Calendar / Events / Learn / About), i18n plumbing, tokens, Cyrillic font check (ө, ү) | 1.5 h | 17:00 | P5-04 | `/app/src/layout` | Language toggle works; Mongolian glyphs render |
| P3-04 | **Calendar heatmap v1** on real C2 | 1.5 h | **18:40 (G1)** | P1-07 | component | Real Mongolia data renders on the deployed site |
| P3-05 | Calendar polish: ARIA grid, counts/anomaly toggle, hatching for provisional/bridged, marginals, tooltips | 1.5 h | 20:30 | P3-04 | component | Keyboard-navigable; color + pattern + number |
| P3-06 | **Today screen**: location-first, 4-level risk (color + shape + word), why, next action, offline cache of last card | 2 h | 22:30 | P4-04 (C4 baseline), P5-06 | screen | Works on a phone; reads C4 baseline |
| P3-07 | AOI picker (draw, lat/lon+radius, admin pick), permalink, wire P1's export functions | 1.5 h | **Sun 00:30 (G2)** | P1-08 | screen | Pick area → CSV downloads |
| P3-08 | "Is it unusual?" panel, date range, sensor-mode toggle | 1.5 h | 02:00 | P1-09 | panel | Sentence + number + mini-distribution |
| P3-09 | Events map: list/timeline, detail drawer, "what is this dot?" | 1.5 h | 03:30 | P2-05 | screen | Click event → lifecycle + context |
| P3-10 | **Seam Slider** | 1 h | 04:30 | P1-10 | component | Drag reveals raw vs harmonized |
| P3-11 | Risk map layer + SHAP words | 0.5 h | 05:00 | P2-04 | layer | Soum choropleth + 3 plain-language drivers |
| *P3 sleeps 05:00–09:30. Flip `MOCK=false` list in handoff note.* |
| P3-12 | Swap fixtures → real data for every screen; fix breakages | 1 h | 10:30 | P1,P2,P4 | app | No screen runs on fixtures |
| P3-13 | *(SHOULD)* **Numrug Replay v1**: events map + time slider + 5 story steps from `numrug.json` | 1 h | 10:30 | P2-11, P5 story copy | screen | Plays start-to-end on a phone |
| P3-14 | Accessibility + performance pass with P5 (axe, keyboard, contrast, reduced motion, Lighthouse mobile ≥90, low-bandwidth mode) | 1.5 h | 12:30 (fixes only) | — | report | Critical issues closed |
| P3-15 | Demo mode `?demo=1`: deterministic data/states for recording; capture screen footage for P5 | 2 h | 12:38–15:00 | freeze | `/app` + raw clips | 5 clips: calendar, seam, today, events, CSV |
| P3-16 | Real-phone tests on 2 devices + slow network | 1 h | 15:00 | — | issue list | No blockers |

### P4 — Cloud, Backend, Reach & Optimizer
**You own:** `/infra`, `/.github`, `/reach`, `/optimizer`, `/app/src/whatif`, root `Makefile`, publishing, secrets.
**You never:** edit science code, UI components outside `whatif`, copy; spend cloud credit without a budget alert; leave a key in a repo; promise official alerts.
| ID | Task | Box | Due | Needs | Output | Done when |
|---|---|---|---|---|---|---|
| P4-01 | Repo scaffold: monorepo layout, CODEOWNERS (folders above), PR template (AI-used line), Makefile, secret-scan hook, CI lint/build, `/contracts` + schema validation job, `docs/` skeleton (parking_lot, ai_usage, handoff) | 30 min | **Sat 13:50 (G0)** | — | repo | Everyone can clone and run `make check` |
| P4-02 | Cloud account + object storage + budget alert + secrets; `make publish` uploads `/artifacts` | 1.5 h | 15:00 | P4-01 | `/infra` | P1 can write Parquet to cloud; public read for data only |
| P4-03 | Static hosting from `main` + PR previews + custom domain | 1 h | 15:00 | P4-01 | live URL | Hello-world visible in incognito |
| P4-04 | Contracts C5, C6 + fixtures; publish P2's C4 baseline when ready | 1 h | 16:30 | P2-01 | `/contracts` | CI validates artifacts against schemas |
| P4-05 | Data serving: Parquet range-request CORS, partition layout for browser queries; test with C1 fixture | 1 h | 17:30 | P1-02 | `/infra` | Browser can read a partition slice |
| P4-06 | Cron skeleton (GitHub Actions): NRT fetch → inference → publish, with dry-run | 1.5 h | 19:00 | P1-03, P2-04 | `.github/workflows` | Dry-run green |
| P4-07 | **Share-card renderer**: C4 + C9 → PNG (square + portrait; light/high-contrast), TXT, SMS variants (≤2 UCS-2 segments ≈ 70 chars each) | 3 h | 22:00 | P5-06, P2-04 | `/reach/cards` | Mongolian text renders correctly; forwards cleanly |
| P4-08 | Telegram channel + bot token + post script (dry-run to a test channel first) | 1.5 h | 23:30 | P4-07 | `/reach/telegram` | Test post received |
| P4-09 | Buffer/ops: help publish artifacts for P1/P2; fix CI | 1 h | 00:30 | — | — | Nothing red |
| *P4 sleeps 00:30–05:00.* |
| P4-10 | **Pre-positioning optimizer** v1 (greedy / OR-Tools): risk × exposure × response time with accessibility; unit tests; output C5 | 2.5 h | Sun 07:30 | P2-04, P2-02 | `/optimizer` | Same inputs → same outputs; inaccessible zones flagged; assumptions listed |
| P4-11 | What-if UI module (drag crews, see coverage change) | 1.5 h | 09:00 | P4-10, P3-02 | `/app/src/whatif` | Works on fixtures and real C5 |
| P4-12 | *(SHOULD)* PWA/offline: manifest + service worker (caches last Today card) | 1 h | 10:00 | P3-06 | `/infra/pwa` | Works in airplane mode after first load |
| P4-13 | End-to-end dry run: cron → publish → site updates → Telegram test post. Security sweep: secrets, CORS, license inventory → `docs/references.md` draft | 1 h | 10:38 | P2-10 | log | Green run; no keys in git history |
| P4-14 | Stabilize: production checklist; offline fallback (`make demo-offline`: local static build + saved data); backup of all artifacts | 2 h | 12:30 | — | docs | Fallback opens with no network |
| P4-15 | Submission logistics: repo public + LICENSE + README run steps; check every link in incognito/phone; domain/SSL | 2 h | 15:30 | P5 text | checklist | All links work logged-out |
| P4-16 | Drive the submission form dry-run (15:30) and the real submit (17:30) | 1 h | 17:30 | all | screenshot | Submitted; confirmation saved |

### P5 — Design, Education, Domain, QA & Team Lead
**You own:** `/design`, `/app/src/academy`, `/app/src/i18n`, `/docs` (except method/validation docs), the board, the parking lot.
**You never:** change science methods or numbers; invent safety advice or emergency numbers; run the board by "feel" — everything is a row. Do not start pitch/slide/video work before Sun 12:38.
| ID | Task | Box | Due | Needs | Output | Done when |
|---|---|---|---|---|---|---|
| P5-01 | Board + channel + sync reminders; hand out charters; start `docs/parking_lot.md` | 30 min | Sat 13:40 | — | board | Everyone can see all tasks and gates |
| P5-02 | Outreach: message 1–2 domain contacts (ranger/emergency/teacher/herder) with 3 questions: how do you learn about a fire, what do you wish you had, how do you get alerts | 30 min | 14:00 | — | `docs/field_notes.md` | Messages sent; call time proposed |
| P5-03 | Gap-discovery sprint (Miro): validate G1–G8, rank the top 4 | 1.5 h | 15:30 | — | `docs/research/gaps.md` | 1-page ranking with sources |
| P5-04 | Design tokens v0 (14:45) → v1: color ramps (sequential cividis-class, diverging, 4-level risk with shapes), type scale with Mongolian Cyrillic support, spacing, icon list with licenses | 1.5 h | 16:30 (v0 at 14:45) | — | `/design/tokens.json` | Contrast checks recorded; P3 imports it |
| P5-05 | Low-fi wireframes: Today, Card, Calendar, Events (Miro/paper OK) | 2 h | 18:00 | P5-03 | `/design` | P3 and P4 confirm they can build from them |
| P5-06 | Copy v1 (Mongolian + English): 4 risk-level words, UI strings, calendar explanations (grade-6 reading level) | 1.5 h | 19:30 | P5-05 | `/app/src/i18n` | All keys exist in both languages |
| *P5 sleeps 20:00–00:30.* |
| P5-07 | `risk_words.json`: level wording, driver key → sentence, advice per level **from official sources only**, with citations; verify emergency numbers with a native teammate | 1.5 h | Sun 02:00 | P2-08 keys (draft) | `/design/risk_words.json`, `docs/safety_sources.md` | Every advice line has a citation; human-reviewed |
| P5-08 | **Fire Academy**: lessons 1–3 (what the satellite sees; why a dot isn't always a fire; why two satellites disagree), each ≤90 s with one widget | 3 h | 05:00 | P3-03 | `/app/src/academy` | Runs on a phone; labeled "simplified illustration" |
| P5-09 | Academy lessons 4–5 (read the calendar; what to do — official guidance only) + quiz + classroom link | 2 h | 07:00 | P5-07 | academy | Quiz works; sources cited |
| P5-10 | Native-speaker proof of all Mongolian strings → **string freeze** | 1.5 h | 08:30 | P5-06,09 | i18n | Proofed by a human; frozen |
| P5-11 | **UX tests:** two non-experts, silent observation; 3 tasks: "is it dangerous near my place today?", "was this spring unusual?", "download the fires for my county" | 1.5 h | 10:00 | app | `docs/ux_tests.md` | Task success/time + issue list with owners |
| P5-12 | Expert call (if scheduled) — notes into `field_notes.md` | 30 min | any time | P5-02 | notes | Answers to the 3 questions captured |
| P5-13 | Stabilize: triage bugs to owners; start `claims_ledger.csv`, consolidate `ai_usage.md` and `references.md` (every library, dataset, font, icon, AI tool) | 2 h | 12:30 | all | docs | Ledger has a row for every number so far |
| P5-14 | **Pitch phase (from 12:38):** script and storyboard (30 s video: 0–4 hook + team intro, 4–11 harmonization + events, 11–21 Today → risk → why → crew what-if → card forwarded, 21–30 "from pixels to people" + URL), 7-slide backup, 60-s live pitch, English subtitles | 2.5 h | 15:00 | numbers from P1/P2, clips from P3 | `docs/demo/` | Video ≤30 s; deck ≤7 slides; every number in the ledger |
| P5-15 | Submission text pack + References + AI-use disclosure; Q&A cheat sheet (20 hardest questions across judge personas) | 2 h | 15:30 | P5-14 | `docs/submission_text.md` | P1/P2 sign off on science wording |
| P5-16 | Run Judge Council (5 personas), fix top issue, rescore | 1 h | 14:30 / 16:00 | all | `docs/judge_council.md` | No criterion <4 |
| P5-17 | Go/no-go at 16:30; hold the line on scope until 17:30 | 15 min | 16:30 | — | decision | Logged |

---

## 5. Who unblocks whom (critical path)
`P4-01 → everyone` · `P1-02 + P2-01 → P3-02` (fixtures) · `P4-02 → P1-03` (storage for backfill) · `P1-06 → P1-07 → P3-04` (G1 calendar) · `P1-06 → P2-03 → P2-04 → P3-06, P4-07` (events → baseline risk → Today/cards) · `P5-04 → P3-03` (tokens) · `P5-06 → P3-06, P4-07` (copy) · `P2-07 → P2-08 → P5-07` (driver keys → wording) · `P2-11 → P3-13` (Numrug) · `P2-10 + P1 + P4-06 → P4-13` (cron end-to-end).
**If a dependency is late:** use fixtures, announce in channel, never wait silently.

## 6. Help Queue (only when your lane is done, in this order)
1. Fix items labeled `bug` on the board. 2. Review someone's open PR. 3. Add schema tests for a contract. 4. Test on a real phone / slow network and file issues. 5. Proofread Mongolian and English strings. 6. Add a figure or caption to a methods/validation doc. 7. Rest. **Never:** start a new feature, add a library, refactor, or "polish" modules outside the polish list.

## 7. Cut order if the team falls behind
P4-12 PWA → P1-15 Central Asia → P1-14 burned-area check → P2-13 bake-off → P3-13 Numrug Replay → P4-11 what-if UI → P5-09 Academy lessons 4–5 → P3-11 risk map layer → uncertainty bands. **Never cut:** calendar, CSV export, harmonization validation, accessibility basics, the plain-language Today screen, the demo.

## 8. Escalation
Blocked >15 min → post in channel with "BLOCKED: <task id> — <what> — <who can unblock>". P5 re-routes. Disagreement between lanes → the contract owner decides; if it changes the demo, P5 decides; if still stuck, majority vote in 2 minutes.
