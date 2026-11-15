# Story Page "The Handover" — Build Brief

**Written Sun 15 Nov 2026 ~12:15 (UTC+8).** Companion to _Master Meta-Prompt v2_ and _Team Task Boards_. Product cutoff Sun 18:00 · submit by 17:30 · freeze was 10:38.

> Working title: **The Handover**. NASA's own framing of MODIS → VIIRS is "picking up the baton", so the metaphor is already on the record. Entry button on the hero: **"Learn about harmony ›"**. Tagline stays **From pixels to people**.

---

## 0. Scope guard (read first)

The freeze has passed and the board says fixes only after it. The story page is a new feature, so it needs a board row approved by P5 before anyone builds it. Make it safe by design:

- **Isolated route.** `/story`, code in `/app/src/story/`, lazy-loaded (code-split) so the main bundle and the "<3 s on 4G" target are untouched. The only edits to frozen files: one router entry and the hero button (≤10 lines, reviewed by P5).
- **It must not be able to break `/`.** If `/story` fails at any point, remove the hero button and ship without it.
- **It replaces, not adds to, P3-13 (Numrug Replay v1).** Chapters 0 and 10 _are_ the Numrug Replay. Do not build both.
- **It is not the submission artifact.** The 30 s video / 7 slides are. The story page earns Presentation, Creativity and Best Storytelling, and it is the best source of video clips.
- **Owner:** whoever is off the critical path (P3 is busy with P3-12/14/15 until ~15:00, so probably someone else working in `/app/src/story/` under P3's review). Copy and mn/en strings: P5. Numbers: P1/P2 only.
- **Proposed board rows:** S-01 stage engine + slide transition · S-02 chapters 7–8 (core) · S-03 ch 0 + 10 · S-04 ch 3–4 · S-05 ch 5 · S-06 ch 1, 2, 6, 9 · S-07 mn/en strings + native proof · S-08 QA + clips.
- **Kill checkpoints:** **13:30** engine + slide-right + chapters 7–8 work on a real phone, else ship ONLY a single "How harmony works" figure page (ch 8) behind the button. **15:00** hard stop for building; polish and fixes only until the 15:30 dry-run.

**Minimum viable story (if time collapses):** ch 0 → 3+4 combined → 5 → 7 → 8 → 10. Six screens. Still a good story.

---

## 1. Revised story arc (11 beats)

Your outline is strong. These are the changes and why:

1. **Open with an event, not statistics.** A dark globe, 8 Oct, detections blooming around Numrug is a stronger hook than a bar chart. Statistics follow as the widening shot.
2. **One persistent chart morphs through the whole story** ("detections per year, Mongolia"). It appears as the scary chart (ch 1), as the 24-year record (ch 6), where it breaks (ch 7) and healed (ch 8). This gives you the "objects move as you scroll" effect and a spine. It must use real P1 data.
3. **Stakes escalate:** a fire → the data that sees it → a 24-year record → the record is about to break → the fix → back to the fire.
4. **Your "how hotspots help" and "FIRMS database" items become two jobs:** _response_ (act today) and _memory_ (plan from 24 years). They now do different work instead of repeating.
5. **Physics is one interactive, not a lecture** (ch 5).
6. **"They work xxx times a day" is computed, not recalled:** ask P1 for observed passes per platform per day over Mongolia from the detections (distinct acquisition-time clusters). That number goes in the claims ledger.
7. **Bookend:** end where you started, with Numrug, now seen through the harmonized record.

| #   | Chapter                                | One-sentence beat                                                                                        | Moving object (scroll keyframes)                                                             | Data source                             | Notes                                                                        |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------- |
| 0   | **8 October**                          | A fire started in a strictly protected area; satellites saw it before most people could.                 | Globe flies to Numrug; detections appear in time order; counter ticks                        | `numrug.json` / events (P2-11)          | Say "cause under investigation". Official figures attributed, never blame    |
| 1   | **A burning country**                  | How big, how often, how fast.                                                                            | Globe → Mongolia map → the persistent chart builds year by year (raw)                        | `region_stats`, `cell_month` raw (P1)   | Official national totals only with source + date; mark [verify]              |
| 2   | **Eyes that don't blink** _(response)_ | A hotspot becomes a decision: a pass, a map, a crew.                                                     | Pass → FIRMS → ranger/phone chain draws left to right                                        | Static diagram                          | Latency claims must be sourced from FIRMS docs                               |
| 3   | **The morning and afternoon crews**    | Terra and Aqua carry MODIS: coarse eyes, 25 years of memory.                                             | Orbit lines on the globe; swath band sweeps Mongolia; a 24 h clock shows the overpass times  | GLB/SVG + ground tracks                 | ID cards (section 2)                                                         |
| 4   | **The sharper newcomers**              | VIIRS on Suomi NPP, NOAA-20, NOAA-21: finer pixels, wider swath, and the newest is NOAA-21.              | 1 km pixel splits into ~7 VIIRS pixels; legend uses dots for MODIS, triangles for VIIRS      | Static + P1 counts                      | Dots/triangles is Worldview's own convention and keeps "never colour alone"  |
| 5   | **How a satellite feels fire**         | Hot ground glows brightest in the ~4 µm band, cool ground in ~11 µm; the gap is the clue.                | Slider: fire size and background temp → two band signals → hotspot flips on/off              | Embed P5's Academy lesson 1 widget      | Don't rebuild it. Context tiles: LST / NDVI / snow from GIBS                 |
| 6   | **The record** _(memory)_              | 24 years of detections let scientists say "this season is unusual".                                      | Persistent chart stacked by platform; "who uses it" icons                                    | FIRMS archive stats (P1-01 audit)       | Name real uses with sources                                                  |
| 7   | **The handover**                       | Terra and Aqua are retiring; the newest crew must continue the same record, but it measures differently. | Platform lifespan bars; Terra/Aqua fade; NOAA-21 lights up; the chart develops visible steps | `seam_demo.json` (P1-10)                | If there is no visible seam, say so and show the sampling difference instead |
| 8   | **Harmonization**                      | Make the seam disappear and show the uncertainty honestly.                                               | "Figure 1" workflow draws node by node; then Seam Slider (raw ↔ harmonized)                  | P1 artifacts + Seam Slider component    | Paper-style: numbered figure, caption, units                                 |
| 9   | **What it gives Mongolia**             | Calendar, fire events, a daily risk card, a crew what-if.                                                | Four mini-loops, each "open in app"                                                          | Existing screens                        | Cut first if short                                                           |
| 10  | **Back to Numrug**                     | How unusual was that October? What would the model have said?                                            | Replay scrubber + percentile rank + backtest result, then CTA "Open Tuimer"                  | `numrug.json`, `region_stats`, P2-11/12 | Show the backtest honestly, good or bad                                      |

---

## 2. Satellite "characters" without being cartoony

Principle: **character comes from facts and role, not faces.** Think specimen card, not mascot.

- **Visual language:** restrained palette, one accent colour per family, thin orbit trails, monospaced telemetry captions, a real or accurately silhouetted model. No eyes, no smiles, no speech bubbles.
- **Nicknames derived from fact, not personality:** Terra, "the morning veteran" · Aqua, "the afternoon anchor" · Suomi NPP, "the pathfinder" · NOAA-20, "the steady one" · NOAA-21, "the newest". Don't invent traits.
- **Card fields (every number [verify] → claims ledger):** name · launch date · instrument · pixel size · swath · local overpass time · FIRMS status. Terra launched 18 Dec 1999 per NASA's 3D model page. Aqua 2002. Master prompt: S-NPP FIRMS production ceased 2 Nov 2026; NOAA-21 in FIRMS since Jan 2024; Terra MODIS ends ≈ Jan 2027, Aqua ≈ Sep 2027.
- **Motion gives personality:** Terra sweeps in at 10:30, Aqua at 13:30 on the 24 h clock; the newest simply arrives and stays. One line of copy per card, plain, slightly warm. Example: _"On watch since 1999. Crosses Mongolia mid-morning. Sees the ground in 1 km squares."_
- **Models:** NASA 3D Resources lists Terra and Aqua models and a Suomi NPP model (the Suomi NPP page offers a ~2 MB .glb). **I did not find NOAA-20/21 models**, so check nasa3d.arc.nasa.gov first; if absent use clean SVG silhouettes labelled "illustrative". Do not reuse the Suomi NPP mesh to stand in for another satellite. Compress GLBs (Draco), lazy-load, and give low-bandwidth mode a static image. NASA media rules: credit NASA, no logos implying endorsement.
- **Reuse the main-page globe engine** for ch 0–4. Don't add a second 3D library (board rule 6).

---

## 3. Physics chapter (ch 5): what to show, what to cite

Show, in this order, as one scrolling interaction:

1. **Everything glows in proportion to its temperature.** Planck's law, shown as curves, not algebra: B(λ,T) = 2hc²/λ⁵ · 1/(e^(hc/λkT) − 1).
2. **Where the glow peaks moves with temperature.** Wien: λ_max ≈ 2898 µm·K / T. Ground at ~300 K peaks near 10 µm; flames at ~800 K peak near 3.6 µm. That is why fire detection leans on the ~4 µm band.
3. **The detection clue is the gap:** mid-IR (~4 µm) vs thermal-IR (~11 µm) brightness temperature compared with the surrounding pixels (contextual test). Fields: MODIS channels 21/22 and 31; VIIRS I4 and I5.
4. **Fire radiative power** (FRP, MW) from the excess mid-IR radiance. Wooster et al. (2003) gives the MIR-radiance method. [verify the constant before showing any number]
5. **Context ingredients as real imagery** (your "soil / ground heat pictures"): land surface temperature, NDVI/vegetation, snow cover, true colour with smoke. Use NASA GIBS tiles (no key). Layer identifiers are human-readable; read the GetCapabilities list rather than guessing names. NOAA-21 has far fewer GIBS layers than MODIS (7 vs 117 for Terra at last NASA count), so show NOAA-20 / S-NPP / MODIS for context imagery and don't promise NOAA-21 parity.

References to verify exist before citing: Giglio et al. 2016 (_RSE_ 178), Schroeder et al. 2014 (_RSE_ 143), Wooster et al. 2003 (FRP). The VIIRS 375 m product is VNP14IMG (VIIRS C2 AF 375 m user guide). Label the interactive "simplified illustration".

---

## 4. Interaction architecture

**Slide-right entry.** Hero button → router navigates to `/story`. Implementation: View Transitions API with a directional slide where supported, plain CSS `translateX` fallback. Because it is a real route, back button, ESC and deep links work (`/story#ch7`). Respect `prefers-reduced-motion`: replace slides with a crossfade.

**Stage engine (build once, S-01).** One sticky full-viewport stage; the page's scroll length is the sum of chapter lengths; each chapter receives a `progress` value 0→1. No new libraries: React + CSS `position: sticky` + one `useScrollProgress` hook + D3/SVG for charts. If the team approves one library, add `motion` and nothing else.

```ts
export type ChapterDef = {
  id: string; // "ch7-handover"
  lengthVh: number; // scroll distance in viewport heights
  copy: (lang: "mn" | "en") => {
    headline: string;
    body: string;
    caption?: string;
  };
  Stage: React.FC<{ progress: number; reduced: boolean; lang: "mn" | "en" }>;
  data: string[]; // artifact paths it reads (from /artifacts, never hard-coded numbers)
  claims: string[]; // claims_ledger IDs for every number on screen
};
```

**Persistent objects.** Globe and the "detections per year" chart live in the engine, not in chapters. Chapters only set their target state at progress 0 / 0.5 / 1. That is what makes things move _between_ chapters instead of cutting.

**Accessibility and honesty (non-negotiable):** every chapter has plain-text alt, a "Skip story → open app" link always visible, chapter dots with keyboard focus, no scroll-jacking (the page scrolls normally), reduced-motion path, low-bandwidth path (static images, no GLB), Cyrillic fonts reuse what P3-03 already verified (ө, ү). Numbers only from artifacts; unverified copy is tagged `[verify]` in `chapters.json` and the build fails if any `[verify]` remains.

---

## 5. Using Claude to the maximum

### 5.1 The loop that gives the best results

**Story bible → engine → chapters in parallel → look at it → judge it.**

1. **Story bible (Claude chat, inside this Project, 20 min).** The project docs are already in context. Ask for `story/chapters.json` (headline, body, keyframes, data path, alt text, claim IDs). Fact-check pass second: "list every factual statement and its source; mark anything you cannot source". Output goes to P5 for mn/en and native proof.
2. **Engine (Claude Code, plan mode first).** Charter below, task S-01. Review the plan, reject anything outside `/app/src/story/`.
3. **Chapters in parallel.** Once `ChapterDef` exists, each chapter is an independent file. Run one subagent per chapter (worktree isolation) or one per teammate. The shared contract is what keeps them from colliding.
4. **Close the visual loop with Claude in Chrome.** This is the biggest multiplier: Claude opens your local dev URL, scrolls through each chapter, takes screenshots at phone and desktop sizes, reads the console, and fixes what it sees. Record the scroll as a GIF for video footage.
5. **Judge it.** Reuse your Judge Council personas on the story copy (ML skeptic and fire-science SME check claims; the ranger/herder persona checks plain language).

### 5.2 Which skills to use, and when

| Skill                  | Use it for                                                                                                                                                                                                                    | When              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **frontend-design**    | Pick one art direction and commit. Suggested: _field journal meets mission control_ (near-black ink, one ember accent for fire, one cool accent per sensor family, serif display + mono telemetry). Stops the "template" look | Before S-01       |
| **dataviz**            | The persistent chart, stat tiles, accessible colour ramps and the colour-blind validator. **`design/tokens.json` (P5-04) wins any conflict;** use the skill to validate against it, not replace it                            | Ch 1, 6, 7, 8     |
| **canvas-design**      | Static, poster-grade plates: the share/OG image, title plate, satellite card backgrounds, slide visuals. Low priority for the page itself                                                                                     | After ch 7–8 work |
| **video-making**       | The ≤30 s demo video from clips of the story and app, with English subtitles and no copyrighted music. Only at the pitch phase                                                                                                | ~15:00            |
| **pptx / Slides type** | The ≤7-slide backup deck                                                                                                                                                                                                      | Pitch phase       |
| **skill-creator**      | If P3 wants every session to follow the same rules, turn section 8 into a personal skill. Not needed; the Charter paste does the same job                                                                                     | Optional          |
| **deep-research**      | Skip. Chapter facts are few; use one targeted search per fact and save to `docs/research/` (board rule 8)                                                                                                                     | —                 |

### 5.3 Prompts that work

- **Bible:** "Using the project docs and Story_Page_Build_Brief.md section 1, write `story/chapters.json`. For every chapter: headline (≤12 words), 2-sentence body, 3 scroll keyframes, data path, alt text, claim IDs. No number without a claim ID. Tag anything uncertain `[verify]`. Do not invent figures, quotes or safety advice."
- **Chapter:** "Implement chapter `ch7-handover` against `ChapterDef`. Read only `/artifacts/seam/seam_demo.json`. Plan first. Do not touch the engine or other chapters. Provide reduced-motion and low-bandwidth variants."
- **Visual QA:** "Open http://localhost:5173/story in Chrome. For each chapter at 390×844 and 1440×900: scroll to 0, 50 and 100 % progress, screenshot, and list overlaps, clipped Cyrillic, low-contrast text, jank, console errors. Fix the top five. Repeat once."
- **Judge:** "Act as the fire-science SME. Read `chapters.json`. List every sentence that overclaims or is unsourced, and propose a safer wording."

---

## 6. Global Offers: what actually helps the story page

| Offer                                                | Use?             | How                                                                                                                                                                                                                                                         |
| ---------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free domain (Porkbun)**                            | Yes              | Put `/story` on the same memorable domain; add OG image so shared links look good                                                                                                                                                                           |
| **Microsoft Planetary Computer**                     | Yes, selectively | Pre-render a few real MODIS chips (fire mask, burned area, LST, NDVI) around Numrug into static WebP at build time. No runtime dependency. GIBS tiles are simpler for the "context ingredients" images; use Planetary Computer for pixel-exact before/after |
| **Meteomatics**                                      | Optional         | One pre-rendered weather PNG for the "climate data feeds the forecast" beat. Key stays in a build script (P2), never in client code. Skip if behind                                                                                                         |
| **GitHub Copilot Free**                              | Marginal         | Fine for teammates without Claude access. Doesn't change the plan                                                                                                                                                                                           |
| **Miro templates**                                   | Skip for this    | Only if a human prefers sketching the storyboard on paper-like canvas; screenshot it into the chat. Don't spend time setting it up now                                                                                                                      |
| **Azure / Google Cloud / Teams / Microsoft Copilot** | No               | Nothing here that a static page needs. Use whichever cloud you already chose for hosting                                                                                                                                                                    |

Every external resource goes in `docs/references.md` and every AI use in `docs/ai_usage.md`, including image or layout help.

---

## 7. Schedule to submission

| Time (UTC+8) | Who                    | Output                                                                                   |
| ------------ | ---------------------- | ---------------------------------------------------------------------------------------- |
| 12:15–12:45  | P5 + you + Claude chat | P5 approves board rows; `chapters.json` v0                                               |
| 12:45–13:30  | Engine owner           | S-01 slide-right + stage + `useScrollProgress`; ch 8 figure static. **13:30 checkpoint** |
| 13:30–15:00  | 2–3 people in parallel | ch 7, 8 (core) → 0, 10 → 3, 4 → 5 → rest. mn strings arrive as ready                     |
| 14:30        | Judge Council          | Story copy included                                                                      |
| 15:00        | **Hard stop**          | Clips for video; feed `video-making`                                                     |
| 15:00–15:30  | Fixes only             | Real-phone test, links in incognito                                                      |
| 15:30        | Dry-run                | Story linked or not, decided here                                                        |

---

## 8. Story Charter (paste at the start of every AI session working on the story)

```
You are assisting [NAME] on Space Khuushuur's NASA Space Apps project (Tuimer). We are building the "/story" page called "The Handover".
YOU MAY EDIT ONLY: /app/src/story/ (and /app/src/story/data/ copies of artifacts).
READ-ONLY: everything else, including /contracts, /fixtures, /artifacts, /design/tokens.json, /app/src/i18n.
RULES:
1) Reply with a PLAN first: files to create/modify and why. If it touches anything outside /app/src/story/ or more than 5 files, stop and ask.
2) Do only the current task ID. No refactors, extra features or "improvements".
3) No new dependencies. Reuse React, the existing globe engine, D3/SVG.
4) Chapters conform to ChapterDef. Numbers come only from artifacts via claim IDs; never hard-code a statistic. Tag unverified copy [verify].
5) Never invent data, numbers, citations, quotes or safety advice. No blame or names for any person or company regarding the Numrug fire; say "cause under investigation".
6) Honesty: if real data shows no visible seam, or the backtest is weak, show that. Mark any illustration "simplified illustration".
7) Accessibility: reduced-motion path, low-bandwidth path, keyboard, alt text, Cyrillic glyphs (ө, ү) verified.
8) Use design/tokens.json; do not introduce new colours or fonts.
9) Stop at the time-box and report done / not done / risks. Ideas go to docs/parking_lot.md. Add one line to docs/ai_usage.md.
CURRENT TASK: [ID — text — Done when]
```

---

## 9. Verify before publishing anything on the page

- [ ] Mongolia national fire figures and the Numrug numbers: official source, date, wording "reported".
- [ ] Orbit local times, launch dates, pixel sizes, swath widths for each satellite.
- [ ] Platform end dates (Terra ≈ Jan 2027, Aqua ≈ Sep 2027, S-NPP FIRMS ended 2 Nov 2026) against NASA/FIRMS notices.
- [ ] "Passes per day over Mongolia": computed by P1 from detections.
- [ ] FRP constant and formula (Wooster 2003) before any number is shown.
- [ ] GIBS layer identifiers and date coverage from GetCapabilities.
- [ ] NOAA-20/21 3D model availability and NASA media usage terms.
- [ ] Mongolian strings proofed by a native speaker.
