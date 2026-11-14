# Claims ledger

Every number or claim shown in the demo, pitch, deck or UI maps to a script and its output file. A number not listed here is not used.

| Claim | Value | Script | Output file | Commit |
|---|---|---|---|---|
| Home globe: platform orbits (TLE snapshot) | CelesTrak GP, epochs 2026-11-14 | `scripts/tle/fetch_tle.ts` | `public/data/satellites.json` | #10 |
| Launch dates: Terra / Aqua / Suomi NPP / NOAA-20 / NOAA-21 | 1999-12-18 / 2002-05-04 / 2011-10-28 / 2017-11-18 / 2022-11-10, each with `launch_source_url` (NASA, NOAA) | `scripts/tle/platforms.json` → `fetch_tle.ts` | `public/data/satellites.json` | #10 |
| Platform status lines (`globe.status.*`) | Terra: orbit drifting, maneuvers stopped, observations expected into late 2026 (NTRS 20250000522) · Aqua: free drift since last drag make-up Dec 2021 (science.nasa.gov/mission/aqua) · S-NPP: FIRMS stopped new S-NPP data (Earthdata blog) · NOAA-20: declared operational (NESDIS) · NOAA-21: operations handed to NOAA (NESDIS) | i18n text, source = `status_source_url` | `app/src/i18n/{en,mn}.json` + `public/data/satellites.json` | #10 |
| Home card: first / last hotspot, raw hotspot count per platform | from data | Job 2 pipeline (#23) | `pipeline_stats.json` | pending real file |
| Home chart: raw hotspots per platform per year; "stopped" = last hotspot > 10 days before the newest | from data | Job 2 pipeline (#23) | `calendar/mongolia.json`, `pipeline_stats.json` | pending real file |
