# FIRMS data audit (P1-01)

Status: all 4 sensors received and audited (Sat 14 Nov 2026, ~20:50).

## Request settings
FIRMS Archive Download, country Mongolia, buffer 0 km, CSV. One request (one ZIP) per sensor.

## Files

| File | Platform(s) | Dates (UTC) | Rows | Quality |
|---|---|---|---|---|
| fire_archive_M-C61_847942.csv | MODIS Terra 52,517 · Aqua 47,548 | 2001-03-17 to 2026-08-31 | 100,065 | Science |
| fire_nrt_M-C61_847942.csv | MODIS Terra 803 · Aqua 406 | 2026-09-01 to 2026-11-14 | 1,209 | NRT ("6.1NRT") |
| fire_archive_SV-C2_847945.csv | VIIRS S-NPP | 2012-02-17 to 2026-07-31 | 174,296 | Science (v2) |
| fire_nrt_SV-C2_847945.csv | VIIRS S-NPP | 2026-08-01 to 2026-11-02 | 5,678 | NRT ("2.0NRT") |
| fire_archive_J1V-C2_847943.csv | VIIRS NOAA-20 | 2018-04-03 to 2026-07-31 | 46,017 | Science (v2) |
| fire_nrt_J1V-C2_847943.csv | VIIRS NOAA-20 | 2026-08-01 to 2026-11-13 | 6,368 | NRT |
| fire_archive_J2V-C2_847944.csv | VIIRS NOAA-21 | 2023-03-04 to 2026-07-31 | 24,649 | Science (v2) |
| fire_nrt_J2V-C2_847944.csv | VIIRS NOAA-21 | 2026-08-01 to 2026-11-14 | 5,801 | NRT |

## Header differences and quirks
1. All files share: latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_t31, frp, daynight. Archive files also have `type`.
2. NRT files have NO `type` column, so static heat sources must be masked using locations learned from archive files.
3. VIIRS files use `brightness` / `bright_t31` (same names as MODIS), not `bright_ti4` / `bright_ti5`.
4. MODIS is two platforms in one file: `satellite` = Terra / Aqua. Aqua starts 2002-07 (first Mongolia detection 2002-07-05).
5. MODIS archive `version` has two values: 6.03 (95,080 rows) and 61.03 (4,985 rows). Check what this means before final claims.
6. MODIS science data runs to 2026-08-31, VIIRS science data to 2026-07-31. After that, NRT.
7. Confidence: MODIS 0 to 100 (1,552 rows with 0 in archive), VIIRS letters l / n / h.
8. `type` counts in archives: MODIS 2 → 138 · S-NPP 2 → 792, 3 → 80 · NOAA-20 2 → 885, 3 → 35 · NOAA-21 2 → 489, 3 → 11.
9. Earliest MODIS row is 2001-03-17, not 2000-11-01 (no detections in Mongolia over winter).
10. `acq_date` / `acq_time` are UTC. Mongolia is UTC+8; the pipeline uses the local date.

## Cleaning (etl/clean_hotspots.py)
1. Combine archive + NRT, label sensor from file name, split MODIS into MODIS_TERRA / MODIS_AQUA.
2. Local date = UTC + 8 h.
3. Remove `type` 1, 2, 3. For NRT rows, remove rows in 0.02° cells where any archive had `type` 1, 2 or 3 (136 cells).
4. One confidence scale: low / nominal / high.

Result: 4,492 rows removed, 359,591 clean hotspots.

| Platform | First | Last | Clean hotspots |
|---|---|---|---|
| MODIS_TERRA | 2001-03-17 | 2026-11-11 | 53,194 |
| MODIS_AQUA | 2002-07-05 | 2026-11-14 | 47,857 |
| VIIRS_SNPP | 2012-02-17 | 2026-11-02 | 178,434 |
| VIIRS_NOAA20 | 2018-04-04 | 2026-11-13 | 50,796 |
| VIIRS_NOAA21 | 2023-03-04 | 2026-11-14 | 29,310 |

## Open questions
1. ASSUMPTION: 0.02° grid for the static mask, 0.05° grid for cell-days. Sensitivity test later.
2. Meaning of MODIS version 6.03 vs 61.03.
3. Partial years (2001, 2002 for Aqua, 2012 for S-NPP, 2026) must not be compared to full years without a note.
