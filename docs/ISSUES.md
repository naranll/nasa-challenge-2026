# What we build, in order

**Goal:** a website that introduces the fire datasets and why they matter, shows how we harmonize them (make MODIS and VIIRS comparable), and shows how the data can be used for research, with our prediction model as the example.

Only [PLAN.md](../PLAN.md) is the plan. This list cuts the work into 13 jobs. Parts that are not in PLAN.md are marked EXTRA.

## The 13 jobs

| # | Job | About | Suggested person | Needs first |
|---|---|---|---|---|
| 1 | Set up the project | 2-3 hours | Everyone, together | nothing |
| 2 | Clean the data and count the hotspots | 4-5 hours | Data person | nothing |
| 3 | Home page: Earth and satellites with infographics | 5-6 hours | Website person 1 | Job 1; Job 2 |
| 4 | Harmonizing page: what data do we have? (raw numbers) | 4-5 hours | Website person 2 | Job 1; Job 2 |
| 5 | Dashboard: calendar next to the harmonizing page | 4-5 hours | Website person 2 | Job 1; Calendar files from job 6 |
| 6 | Harmonize the data and prove it works | 6-8 hours | Data person | Job 2 |
| 7 | Add the harmonizing to the site | 5-6 hours | Website person 1 and 2 | Jobs 4 and 5; Job 6 |
| 8 | Story page: why this data matters | 4 hours | Website person 1 or whoever likes writing | Job 1 |
| 9 | Prediction model: an example of using the data | 8-10 hours | Model person (data person helps) | Job 6 |
| 10 | Forecast page | 4 hours | Website person | Job 1; Job 9 |
| 11 | Polish: animation and movement between the sections | 4-5 hours | Website people | Jobs 3, 4, 5, 7, 8 and 10 |
| 12 | EXTRAS (only if time): sound effects and more models | as much as is left | Whoever is free | Jobs 1 to 11 |
| 13 | Final: text, credits, limits, testing and submit | 4-5 hours | Everyone, together | Jobs 1 to 11 |

## How to work

- Jobs 1 and 2 start now. After job 1, the website jobs (3, 4, 5, 8) can run at the same time as the data jobs (2, 6).
- Website jobs start with fake sample files (the `fixtures` folder). When the real files are ready, switch to them.
- A job is finished when every 'Done when' line is true.
- If you are stuck for more than 15 minutes, ask in the group chat.
- New ideas go in `docs/parking_lot.md`. Do not add them to a job.

## 1. Set up the project

**Time:** about 2-3 hours
**Suggested person:** Everyone, together
**You can start with:** Nothing. Start now.
**Needs first:** nothing

## What we build
Make sure everyone can run the website and the Python code, and the site has a public web address.

## Parts
- [ ] Create the website project (Vite + React + TypeScript) with these pages: Home, Harmonizing, Dashboard, Story, Forecast.
- [ ] Add a small helper that loads data files. At first it loads fake sample files (the fixtures folder). Later it loads the real files.
- [ ] Put the website online with a public address.
- [ ] Install the Python tools for everyone (etl/requirements.txt: add lightgbm and scikit-learn).
- [ ] Share the 8 FIRMS data files with everyone. Each person copies them to etl/data/raw/.
- [ ] Write down the hackathon end time and the freeze time (4 hours before the end). After the freeze we only fix bugs.
- [ ] Check Meteomatics: can we download weather from 2002 to 2026? Write YES or NO in docs/research/meteomatics.md.

## Done when
- [ ] Everyone can run the website and the Python code
- [ ] The public address opens on a phone
- [ ] The Meteomatics answer is written down

**Where in the code:** app/, etl/, docs/research/

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN section 3.1, 9.2, 9.3, 9.11, 4).

## 2. Clean the data and count the hotspots

**Time:** about 4-5 hours
**Suggested person:** Data person
**You can start with:** Our real data on your computer (the 8 files).
**Needs first:** nothing

## What we build
Turn the 8 FIRMS files into clean counts: how many hotspots per province, month, satellite, day or night.

## Parts
- [ ] Open etl/clean_hotspots.py. Right now it deletes 4,492 rows. Change it to FLAG them, not delete (PLAN section 3.3).
- [ ] Flag rows that are not vegetation fires (type 1, 2, 3) and places that are hot all the time (power plants, mines). Add an on/off switch.
- [ ] The newest data (NRT) has no type column. Flag NRT hotspots that fall in the same cells as flagged older ones.
- [ ] Keep confidence as low / nominal / high. Do not filter by it.
- [ ] Label every hotspot: province (21 provinces + Ulaanbaatar), day or night, satellite, and the Mongolian local date (UTC+8).
- [ ] Count MODIS as pixels. Count VIIRS as fire units (one H3 size 8 cell in one satellite pass, passes within 10 minutes). Also save raw VIIRS pixel counts.
- [ ] Save the counts file and the list of 22 regions. Save simple facts for the website: rows per satellite, first and last hotspot date.

## Done when
- [ ] python etl/run_all.py works from start to end
- [ ] The counts file has all satellites
- [ ] How many rows each rule flags is printed
- [ ] A facts file for the home page exists

**Where in the code:** etl/

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN section 3.3 to 3.5, D9).

## 3. Home page: Earth and satellites with infographics

**Time:** about 5-6 hours
**Suggested person:** Website person 1
**You can start with:** Fake sample files.
**Needs first:** Job 1 (project); Job 2 (facts file). Use fake sample numbers until it is ready.

## What we build
The first page. A 3D Earth with the 5 satellites moving around it, and pictures (infographics) made from our raw data.

## Parts
- [ ] Black space with small stars, and a 3D Earth (react-globe.gl). The area outside Mongolia is dimmer.
- [ ] 5 satellites moving (Terra, Aqua, Suomi NPP, NOAA-20, NOAA-21). Use orbit data saved at build time, no internet during the demo.
- [ ] Dotted orbit lines, and a thin line between satellites that carry the same sensor (MODIS or VIIRS). Two colours.
- [ ] Hover card: name, sensor, launch date, first and last hotspot date in OUR data, number of hotspots, and an official status line with a source.
- [ ] Infographics from the raw data: hotspots per satellite per year, and the sensors that stop (Suomi NPP stopped on 2026-11-02).
- [ ] Buttons to the other pages. If 3D does not work on a phone, show a still picture with the same buttons.

## Done when
- [ ] It runs smoothly on a phone
- [ ] All numbers come from data files, not typed by hand
- [ ] The page works when WebGL is off

**Where in the code:** app/src/globe, scripts/tle

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN section 4 (Home, Hover), section 1).

## 4. Harmonizing page: what data do we have? (raw numbers)

**Time:** about 4-5 hours
**Suggested person:** Website person 2
**You can start with:** Fake sample files.
**Needs first:** Job 1 (project); Job 2 (counts). Use fake sample files until it is ready.

## What we build
An analytics page that shows, with raw numbers, which regions we have data for and how each satellite counts.

## Parts
- [ ] A list or map of the 22 regions with the first and last hotspot date and the number of hotspots for each.
- [ ] Pick a region. Show a line chart of raw monthly counts for each satellite. The jump when VIIRS starts (2012) must be visible.
- [ ] A small table: rows per satellite, years covered.
- [ ] Raw numbers only on this page for now. Job 7 adds the harmonized view.

## Done when
- [ ] Picking a region updates the chart
- [ ] The 2012 jump is visible
- [ ] No empty chart: a region without hotspots shows a sentence

**Where in the code:** app/src/harmonize

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN D2, D12, section 4 (empty state)).

## 5. Dashboard: calendar next to the harmonizing page

**Time:** about 4-5 hours
**Suggested person:** Website person 2
**You can start with:** Fake sample files.
**Needs first:** Job 1 (project); Calendar files from job 6. Use fake sample files until then.

## What we build
The calendar the challenge asks for: which months and years have the most fires, and is this month normal?

## Parts
- [ ] A colour table: rows = years, columns = months. Darker = more hotspots. Use a colour scale that works for colour-blind people.
- [ ] Pick a region and a date range.
- [ ] Download the data as a CSV file.
- [ ] A sentence: 'This month fires in your province are X times the usual.' If the normal value is very small, write: 'Usually there are almost no fires in this month. This year: N.' Always add: information only, not an official warning.
- [ ] Dashed marks for future months, for months counted from NOAA-20 (after 2026-11-02), and a note for the month that is not finished.

## Done when
- [ ] Pick a province, click download: the CSV opens in Excel
- [ ] Both sentences show
- [ ] The three dashed marks show

**Where in the code:** app/ (calendar part)

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN section 0, section 4 (Calendar, Anomaly)).

## 6. Harmonize the data and prove it works

**Time:** about 6-8 hours
**Suggested person:** Data person
**You can start with:** Made-up test data first, then our real counts.
**Needs first:** Job 2 (counts)

## What we build
Make MODIS and VIIRS counts comparable, and test that it is right by rebuilding Aqua from VIIRS.

## Parts
- [ ] Ratio r1: total Aqua divided by total Suomi NPP, for each month and for day and night separately. Use only 2012-01-20 to 2021-12-31. If a month has fewer than 30 fire units, use one ratio for the year.
- [ ] Also a pooled ratio (day and night together) as a simple baseline. Ratio r2 for NOAA-20 (2018-04-01 to 2026-11-02). Check r2 is close to 1.
- [ ] Join the satellites in a chain: Aqua (2002-07 to 2012-01-19), Suomi NPP (until 2026-11-02), NOAA-20 (after). Only one counts at a time. Do not use NOAA-21.
- [ ] Make the harmonized monthly counts for the 22 regions and for all of Mongolia. Save a plot of raw against harmonized.
- [ ] Normal range for each month: median and P25 to P75 (quantile method 'lower'). Do not use 2002, it is a partial year.
- [ ] The test: hide one year of Aqua (2012 to 2021), rebuild it from Suomi NPP, compare. Also: calibrate 2012-2018 and check 2019-2021; compare with the baselines; test r2 on 2019-2025. Measure WAPE and correlation.
- [ ] Write the files the website reads: calendar files, ratios, test results, hex_year (globe data), pipeline stats. If a result is bad, show it as it is.

## Done when
- [ ] The test results are saved with a plot
- [ ] The calendar files exist for all 22 regions and Mongolia
- [ ] Running it twice gives the same files

**Where in the code:** etl/

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN D3, D5, D7, D10, D11, section 3.6 to 3.11).

## 7. Add the harmonizing to the site

**Time:** about 5-6 hours
**Suggested person:** Website person 1 and 2
**You can start with:** Fake sample files.
**Needs first:** Jobs 4 and 5 (pages); Job 6 (harmonized files). Use fake sample files until then.

## What we build
Show the harmonized data on top of the raw data, so a visitor sees that the sensor no longer matters.

## Parts
- [ ] A Raw / Harmonized switch on the Harmonizing page and on the Dashboard.
- [ ] Two globes side by side: raw counts on the left (label: raw pixels), harmonized counts on the right. Same camera. A year slider from 2003 to 2025. When it passes 2012, the left jumps and the right stays level.
- [ ] A result line from the data files: 3 satellites, 23 years, N hotspots become one series, and the Aqua rebuild error (WAPE).
- [ ] A small note: using the monthly ratio on every hexagon is only an estimate.
- [ ] Two calendars side by side, 'For scientists'. They also replace the globes when 3D does not work.
- [ ] A Method section: left = the pipeline steps, right = the four test results (Aqua rebuild, forward test, one-ratio baseline, NOAA-20 ratio test).

## Done when
- [ ] The 2012 jump is clear in raw and gone in harmonized
- [ ] Every number comes from a data file
- [ ] Works when WebGL is off

**Where in the code:** app/src/harmonize, app/ (calendar, method)

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN D2, D12, D13).

## 8. Story page: why this data matters

**Time:** about 4 hours
**Suggested person:** Website person 1 or whoever likes writing
**You can start with:** Nothing, you can write the text now.
**Needs first:** Job 1 (project)

## What we build
A page that tells the story: how the data is collected, why it is important, why we harmonize it, and how researchers can use it.

## Parts
- [ ] How satellites see fire: heat in the infrared, one pixel is about 1 km for MODIS and 375 m for VIIRS.
- [ ] Why it matters now: MODIS is stopping, Suomi NPP stopped on 2026-11-02, so the long record must continue with VIIRS.
- [ ] The baton relay: Aqua, then Suomi NPP, then NOAA-20, as a timeline. We do it on the ground. Satellites cannot be steered and do not share data.
- [ ] How researchers can use the harmonized data: our prediction model is one example (link to the Forecast page).
- [ ] Text in Mongolian and English. Numbers from the data files.

## Done when
- [ ] The page tells the story in 4 or 5 short sections
- [ ] Text exists in both languages

**Where in the code:** app/src/harmonize (story part), app/src/i18n

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN section 1, D1, D3).

## 9. Prediction model: an example of using the data

**Time:** about 8-10 hours
**Suggested person:** Model person (data person helps)
**You can start with:** Made-up test data first.
**Needs first:** Job 6 (harmonized counts)

## What we build
Predict next month's fires for each province, and show if the harmonized history makes the forecast better.

## Parts
- [ ] Simple forecasts first: the normal value (Level 1) and 'this month's difference carries over' (Level 2).
- [ ] A test setup: for each year from 2015 to 2025, train only on earlier years, forecast, compare. Add a test that fails if the model sees the future (leakage).
- [ ] Model version 1: small LightGBM from fire history (last 1 to 3 months, same month last year, normal value, month, region). Use Ridge instead if LightGBM does not win.
- [ ] Kill check: for each province, the model must have at least 5% lower error than the simple forecast, and the result must be clear in a bootstrap over years. If not, show only the normal range.
- [ ] Three data sets with the same model: raw-all, raw-VIIRS-only, harmonized-all. The main question: do the MODIS years 2003-2011 help?
- [ ] Save forecast.json (forecast, P10-P90 range, top features) and model_metrics.json (all results, even bad ones).

## Done when
- [ ] Results for every province are saved
- [ ] Provinces that fail the kill check are marked
- [ ] The leakage test passes

**Where in the code:** etl/ml

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN D11, D15, section 3.8 and 3.13).

## 10. Forecast page

**Time:** about 4 hours
**Suggested person:** Website person
**You can start with:** Fake sample files.
**Needs first:** Job 1 (project); Job 9 (model files). Use fake sample files until then.

## What we build
Show the prediction model's results so a visitor can see how the data can be used for research.

## Parts
- [ ] A card for each province: next month's forecast, the P10 to P90 range, the normal value, and a sentence 'expected to be X times more (or less) than usual'.
- [ ] The 3 most important inputs of the model for each province.
- [ ] If a province failed the kill check, show only the normal range with a short reason.
- [ ] A results panel: the model against the simple forecast, harmonized-all against raw-VIIRS-only, version 1 and version 2 separately.
- [ ] Always show: information only, not an official warning.

## Done when
- [ ] Every number comes from forecast.json or model_metrics.json
- [ ] A losing result is shown as it is

**Where in the code:** app/src/forecast

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN section 4 (Forecast screen), D15).

## 11. Polish: animation and movement between the sections

**Time:** about 4-5 hours
**Suggested person:** Website people
**You can start with:** The pages that already exist.
**Needs first:** Jobs 3, 4, 5, 7, 8 and 10

## What we build
Make the five sections feel like one site: smooth movement, same look, easy to find your way.

## Parts
- [ ] Smooth moves between Home, Harmonizing, Dashboard, Story and Forecast (menu, buttons, scroll).
- [ ] On Home: click the Earth and it zooms to Mongolia and opens the region pages.
- [ ] The same colours, fonts and spacing on all pages. Mongolian letters (Ө, Ү) look right.
- [ ] Loading shapes and real sentences instead of empty screens. Never show N/A.
- [ ] Works on a phone and on a slow network. Respect the 'reduce motion' setting.

## Done when
- [ ] You can go through all sections without a dead end
- [ ] No page has an empty chart
- [ ] It runs well on two phones

**Where in the code:** app/

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN section 4 (Бүс/галын түүх, empty state)).

## 12. EXTRAS (only if time): sound effects and more models

**Time:** about as much as is left
**Suggested person:** Whoever is free
**You can start with:** Only start when the main parts are done.
**Needs first:** Jobs 1 to 11

## What we build
Nice-to-have things after everything else works.

## Parts
- [ ] EXTRA, not in PLAN: sound effects (soft sounds on clicks and when the year slider moves). Add a mute button. Use only sounds we are allowed to use, and list them in the credits.
- [ ] Weather version of the model (version 2), only if the Meteomatics answer was YES (PLAN D15). Use weather of the current month only.
- [ ] Other things from PLAN: SHAP per province (nice-to-have), case study of one real fire, satellite pages.

## Done when
- [ ] Each extra works and does not break the site
- [ ] Anything we add is listed in the credits

**Where in the code:** various

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN D15, section 5 (MVP+, Nice-to-have). Sound is a team idea.).

## 13. Final: text, credits, limits, testing and submit

**Time:** about 4-5 hours
**Suggested person:** Everyone, together
**You can start with:** Credits and limits can start now.
**Needs first:** Jobs 1 to 11

## What we build
Finish the project and send it in.

## Parts
- [ ] Mongolian and English text for every page. A native speaker reads it.
- [ ] Credits and licences: FIRMS, NASA images, geoBoundaries (ODbL, copyright OpenStreetMap contributors), CelesTrak, Meteomatics, and any sound or font we use.
- [ ] The limits of our work (PLAN section 8) on the site and in the pitch.
- [ ] Test on two phones and one laptop, with a slow network. Fix blocking problems.
- [ ] The 1-minute demo script and the pitch (PLAN sections 6 and 7). Do not over-promise. Every number must come from a script.
- [ ] Check the submission rules with the Local Lead (the length of the video or number of slides). Open every link in a private window and submit.

## Done when
- [ ] The work is submitted
- [ ] A screenshot of the confirmation is saved

**Where in the code:** docs/, app/src/i18n

Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.
Source: PLAN.md (PLAN section 6, 7, 8, 9.7).
