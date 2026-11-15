# Claims ledger

Every number or claim shown in the demo, pitch, deck or UI maps to a script and its output file. A number not listed here is not used.

| Claim | Value | Script | Output file | Commit |
|---|---|---|---|---|
| Home globe: platform orbits (TLE snapshot) | CelesTrak GP, epochs 2026-11-14 | `scripts/tle/fetch_tle.ts` | `public/data/satellites.json` | #10 |
| Launch dates: Terra / Aqua / Suomi NPP / NOAA-20 / NOAA-21 | 1999-12-18 / 2002-05-04 / 2011-10-28 / 2017-11-18 / 2022-11-10, each with `launch_source_url` (NASA, NOAA) | `scripts/tle/platforms.json` → `fetch_tle.ts` | `public/data/satellites.json` | #10 |
| Platform status lines (`globe.status.*`) | Terra: orbit drifting, maneuvers stopped, observations expected into late 2026 (NTRS 20250000522) · Aqua: free drift since last drag make-up Dec 2021 (science.nasa.gov/mission/aqua) · S-NPP: FIRMS stopped new S-NPP data (Earthdata blog) · NOAA-20: declared operational (NESDIS) · NOAA-21: operations handed to NOAA (NESDIS) | i18n text, source = `status_source_url` | `app/src/i18n/{en,mn}.json` + `public/data/satellites.json` | #10 |
| Home card: first / last hotspot, raw hotspot count per platform | from data (rows below) | `etl/export_contracts.py` | `public/data/pipeline_stats.json` | 58823e3 |
| Home chart: raw hotspots per platform per year; "stopped" = last hotspot > 10 days before the newest | from data | `etl/export_contracts.py` | `public/data/calendar/mongolia.json`, `public/data/pipeline_stats.json` | 58823e3 |
| Clean hotspots, Mongolia, all platforms | 359,591 (= data_audit.md) | `etl/clean_hotspots.py` → `etl/export_contracts.py` | `public/data/pipeline_stats.json` `n_hotspots_total` | 58823e3 |
| Clean hotspots per platform | Terra 53,194 · Aqua 47,857 · S-NPP 178,434 · NOAA-20 50,796 · NOAA-21 29,310 | `etl/export_contracts.py` | `public/data/pipeline_stats.json` `rows_by_platform` | 58823e3 |
| First / last detection (local date, UTC+8) | Terra 2001-03-17 / 2026-11-11 · Aqua 2002-07-05 / 2026-11-14 · S-NPP 2012-02-17 / 2026-11-02 · NOAA-20 2018-04-04 / 2026-11-13 · NOAA-21 2023-03-04 / 2026-11-14 | `etl/export_contracts.py` | `public/data/pipeline_stats.json` | 58823e3 |
| Years covered | 2001–2026 | `etl/export_contracts.py` | `public/data/pipeline_stats.json` `years_covered` | 58823e3 |
| Hotspots in an aimag polygon / put in nearest aimag ≤ 0.1° / unassigned | 357,289 / 2,302 / 0 | `etl/export_contracts.py` | `public/data/pipeline_stats.json` `aimag_assignment` | 58823e3 |
| Raw hotspots in the calendar (2002-07 → 2026-11), Mongolia | 357,796 (1,795 Terra hotspots before 2002-07 are outside the calendar, PLAN D4) | `etl/export_contracts.py` | `public/data/calendar/mongolia.json` `raw.*` | 58823e3 |
| Raw monthly hotspots per platform, 22 aimags/capital | from data; aimags sum to Mongolia | `etl/export_contracts.py` | `public/data/calendar/{region_id}.json` `raw.*` | 58823e3 |
| Raw hotspots per H3 res 5 cell per year, 2003–2025 | 2,356 cells | `etl/export_contracts.py` | `public/data/hex_year/raw.json` | 58823e3 |
| Harmonized (Aqua-equivalent) monthly counts, baseline, ratios, validation | **not available**: `null` + flag `not_harmonized`; files not written | — (needs D7 r₁/r₂ on D9 fire units, D10 tests) | — | — |
| World map: NRT hotspots 2026-11-05 – 11-14 (UTC), assigned to a continent | 1,202,279 (of 1,204,456; 2,177 > 1° from any country, counted in `dropped`) | `etl/fetch_world_nrt.py` → `etl/build_world_map.py` | `public/data/world/index.json` | 740986b |
| World Aqua / NOAA-20 fire-unit ratio | day 0.2128, night 0.0613 | `etl/build_world_map.py` | `public/data/world/index.json` `world_ratio` | 740986b |
| Continent ratio r_day / r_night | Africa 0.166 / 0.0416 · Asia 0.2923 / 0.0363 · Europe 0.1945 / 0.0155 · North America 0.2195 / 0.0247 · South America 0.3797 / 0.072 · Oceania 0.2213 / 0.1188 (no fallback) | `etl/build_world_map.py` | `public/data/world/index.json` | 740986b |
| World map match NOAA-20 ↔ Aqua (±60 min): IoU · P(V\|M) · P(M\|V) | Africa 0.3504 · 0.1967 · 0.08 · Asia 0.1735 · 0.2665 · 0.1014 · Europe 0.0669 · 0.3333 · 0.3 · North America 0.1401 · 0.3364 · 0.2143 · South America 0.3176 · 0.2807 · 0.1266 · Oceania 0.4355 · 0.5094 · 0.2307 | `etl/build_world_map.py` | `public/data/world/index.json` | #37 |
| World map Not comparable share (±60 min), Aqua pixels / NOAA-20 units | Africa 0.9709 / 0.9822 · Asia 0.9666 / 0.9642 · Europe 0.8294 / 0.9778 · North America 0.8738 / 0.9667 · South America 0.989 / 0.9817 · Oceania 0.9623 / 0.9632 (±180 min in `sensitivity_180`, data only) | `etl/build_world_map.py` | `public/data/world/index.json` | #37 |
| World map stats row: counts behind P(V\|M) / P(M\|V) ("{both} of {n}"), window ±60 min, Not comparable radius 300 km | from data: `match_counts`, `match.window_min`, `match.not_comparable_km` | `etl/build_world_map.py` | `public/data/world/index.json` | #38 |
