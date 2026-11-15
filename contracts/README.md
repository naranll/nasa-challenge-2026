# Data contracts (DRAFT v0.1) — TASKS P2-01

The shapes the pipeline (`etl/`) writes and the app (`app/`) reads. Static JSON, no API, no keys.
Real files: `public/data/`. Synthetic files in the same shapes: [`fixtures/`](../fixtures/README.md).
Source decisions: [PLAN.md](../PLAN.md) (D2 unit, D3 chain, D4 start, D6 area, D7 ratios, D11 baseline, D12 globe).

## Rules (so people can work in parallel)

1. **Additive-only after G0.** Add keys freely; never rename, remove or change the meaning of a key. A breaking change gets a new file name.
2. **Fixtures have the real shape.** Same keys, types and nulls. Code that works on fixtures works on real data (`MOCK=false`).
3. **Real files say `"synthetic": false`.** A production build fails if any loaded file says `true` (P4-08).
4. **Missing file or `null` ≠ zero.** Unknown is `null`. The UI shows a real sentence, never "N/A" or an empty chart.
5. **Every file has `schema_version`.**
6. Need a field? Ask the owner (P2 owns this folder) before G0 if you can; it is cheapest then.

## Files

| File | Written by | Read by | PLAN ref |
|---|---|---|---|
| `regions.json` | P1 | P4, P3 | D6 |
| `calendar/{region_id}.json` | P2 | P4 (calendar, anomaly), P3 | D2, D7, D11 |
| `ratios.json` | P2 | P4 (Method) | D7 |
| `validation.json` | P2 | P4 (Method), P3 | D10 |
| `pipeline_stats.json` | P1 | P3 (hover), P4, P5 | §3.11 |
| `hex_year/raw.json`, `hex_year/harm.json` | P1 (raw), P2 (harm) | P3 | D12 |
| `case_study.json`, `matches_summary.json`, `satellites.json` | P2, P2, P3 | P4, P3 | D14, D8, §4 |
| `monthly_counts.parquet` *(internal, not served)* | P1 | P2 | §3 |
| `world/index.json`, `world/points_{continent}.json`, `world/cells_{continent}.json` | `etl/build_world_map.py` | Dashboard world map | #31, D2, D8, D9 |

Shapes for `case_study`, `matches_summary` and `satellites` are added by their owners before G1.

## `regions.json`

```jsonc
{ "schema_version": "0.1", "synthetic": true,
  "regions": [ { "region_id": "mongolia", "name_en": "Mongolia", "name_mn": "Монгол", "kind": "country" } ] }
// kind: country | aimag | capital   (22 units: 21 aimags + Ulaanbaatar, D6/D11)
```
Real file (`etl/export_contracts.py`, additive): `name_mn` may be `null` (the boundary file has no Mongolian names; the UI shows `name_en`), and aimags carry `"iso": "MN-046"` from the geojson. `region_id` = `shapeName` lower-cased, accents removed.

## `calendar/{region_id}.json`

```jsonc
{
  "schema_version": "0.1", "synthetic": true,
  "region_id": "mongolia",
  "unit": "aqua_equivalent_hotspots",   // D2
  "reference_years": [2003, 2025],      // baseline years (2002 is a partial year and excluded, D4)
  "months": [
    {
      "ym": "2002-07",                  // contiguous from 2002-07 (D4)
      "harmonized": 120.0,              // Aqua-equivalent count; null = no data (never 0 for "unknown")
      "chain_platform": "aqua",         // aqua | snpp | noaa20  (D3)
      "raw": { "terra": 90, "aqua": 120, "snpp": null, "noaa20": null, "noaa21": null },  // each platform's own count
      "baseline": { "median": 110.0, "p25": 80.0, "p75": 150.0 },   // D11, quantile method="lower"
      "is_forecast": false,             // future months drawn dashed
      "flags": []                       // "partial_year" | "chain_switch" | "noaa20_derived" | "ratio_fallback" | "partial_month"
    }
  ]
}
```
`raw.*` is each platform's own uncorrected count (VIIRS = raw pixels, D12). In real files a platform is `null` in months outside its first..last month in the Mongolia data, and `0` inside that range when no hotspot fell in the region.
`chain_platform` in a month that contains a hand-over is the D3 platform that covers most of its days (2012-01 = aqua, 2026-11 = noaa20).
**Flag `not_harmonized` (additive):** `harmonized` and `baseline` are `null` because the D7 ratios on D9 fire units are not computed yet. Raw view works; Harmonized view stays empty. `chain_switch` marks a month that contains a hand-over between platforms. `noaa20_derived` applies from 2026-11-02.

## `hex_year/{raw,harm}.json` (globes)

```jsonc
{ "schema_version": "0.1", "synthetic": true, "resolution": 5,
  "kind": "raw_pixels",                       // harm.json: "aqua_equivalent"
  "years": [2003, 2004, "...", 2025],
  "cells": [ { "id": "85…", "lat": 46.0, "lon": 105.0,       // cell centre (H3 index in real data)
               "counts": { "terra": [0, 3], "aqua": [0, 2], "snpp": [null, null], "noaa20": [null, null] } } ] }
// harm.json: "counts": [0, 3, ...]  (a single array aligned to `years`)
```

## `pipeline_stats.json`

```jsonc
{ "schema_version": "0.1", "synthetic": true,
  "rows_by_platform": { "terra": 0, "aqua": 0, "snpp": 0, "noaa20": 0, "noaa21": 0 },
  "first_detection": { "aqua": "YYYY-MM-DD" }, "last_detection": { "aqua": "YYYY-MM-DD" },   // satellite hover (§4)
  "n_hotspots_total": 0, "years_covered": [2002, 2026] }
```
Real file (additive): `"aimag_assignment": { "inside": 0, "nearest_within_deg": 0, "unassigned": 0, "max_deg": 0.1 }`: how hotspots were put into aimags (inside a simplified polygon, else the nearest one within 0.1°). Unassigned hotspots still count in `calendar/mongolia.json`.

## `satellites.json` (P3, home globe)

Written by `scripts/tle/fetch_tle.ts` (`npm --prefix app run tle`) from CelesTrak; static facts come from `scripts/tle/platforms.json`, each with a source URL. Orbits and metadata only: hotspot numbers stay in `pipeline_stats.json`, UI text stays in i18n.

```jsonc
{ "schema_version": "0.1", "synthetic": false,
  "generated_at": "2026-11-15T00:00:00Z",                       // when the snapshot was taken
  "tle_source": { "name": "CelesTrak", "url": "https://celestrak.org/NORAD/elements/gp.php" },
  "platforms": [ {
    "id": "aqua", "norad_id": 27424, "sensor": "MODIS",           // id: terra | aqua | snpp | noaa20 | noaa21
    "launch_date": "2002-05-04", "launch_source_url": "https://…", // null = not confirmed, row hidden
    "in_reference_chain": true,                                    // D3
    "status_source_url": "https://…",                              // source of the i18n globe.status.{id} text
    "tle": { "line1": "1 27424U …", "line2": "2 27424 …", "epoch": "2026-11-14T11:34:37Z" } } ] }
```
Refresh before the demo; epochs older than 7 days draw as "approximate", older than 30 days are hidden.
`fixtures/satellites.json` is a copy with `"synthetic": true` so mock-mode dev shows orbits (there is no made-up TLE).

## `ratios.json` and `validation.json` (DRAFT, owner may extend)

```jsonc
// ratios.json
{ "schema_version": "0.1", "synthetic": true,
  "direction": "r = sum(previous platform) / sum(next platform); harmonized = next count x r",
  "r1": { "D": { "01": 0.0, "...": 0.0 }, "N": { "01": 0.0, "...": 0.0 } },   // Aqua/S-NPP by month and day/night (PLAN D7)
  "r1_fallback_year": { "D": 0.0, "N": 0.0 },                                  // used when a month has < 30 fire units
  "r2": 0.0, "r2_within_15pct": true,
  "windows": { "r1": ["2012-02-17", "2021-12-31"], "r2": ["2018-04-03", "2026-11-02"] } }

// validation.json
{ "schema_version": "0.1", "synthetic": true,
  "tests": [ { "id": "aqua_loyo", "name_en": "Aqua rebuilt from S-NPP, leave-one-year-out",
               "metric": "WAPE", "value": 0.0, "baseline_value": 0.0,    // baseline = one ratio for all months
               "per_year": [ { "year": 2013, "wape": 0.0 } ], "note": "" } ],
  "limitations": [ "…" ] }
```
Test ids: `aqua_loyo`, `aqua_forward`, `r2_loyo`, `year_rank_spearman` (PLAN D10).

## `world/` (Dashboard world map, #31)

World NRT hotspots for **2026-11-05 – 2026-11-14**, split by continent. Written by `etl/build_world_map.py`; real files are committed with `"synthetic": false`. Dates and times are **UTC** (there is no single local time for the world). No static-source mask: NRT files have no `type` column, so power plants and gas flares stay in (see `docs/research/world_map.md`).

```jsonc
// world/index.json
{ "schema_version": "0.1", "synthetic": false,
  "period": { "start": "2026-11-05", "end": "2026-11-14" }, "time_zone": "UTC",
  "sources": ["MODIS_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "VIIRS_SNPP_NRT"],  // FIRMS sources read
  "dropped": { "antarctica": 0, "seven_seas": 0, "no_continent": 0 },  // hotspots left out, counted (not silent)
  "continents": [ {
    "id": "asia",                      // africa | asia | europe | north_america | south_america | oceania
    "name_en": "Asia", "name_mn": "Ази",
    "bbox": [26.0, -10.4, 145.5, 55.4], // [west, south, east, north] from Natural Earth borders.
                                        // Crossing 180°: the narrowest longitude interval, so east > 180 is
                                        // allowed; draw points with lon < west at lon + 360.
    "points_file": "points_asia.json",
    "n_points": 0,
    "n_by_platform": { "terra": 0, "aqua": 0, "snpp": 0, "noaa20": 0, "noaa21": 0 } } ] }
```
A continent is assigned by point-in-polygon on Natural Earth 110m countries (`CONTINENT`); a point outside every polygon takes the nearest country within 1°. Natural Earth puts Russia and France (with French Guiana) in Europe, so Europe's bbox is very wide.
Later tickets add keys to each continent (Aqua-equivalent #35, match #37: below).

**Aqua-equivalent keys (#35, additive).** `index.json` also has:

```jsonc
{ "world_ratio": { "D": 0.45, "N": 0.44,                  // Σ Aqua pixels / Σ NOAA-20 fire units, all continents; null = no units
                   "n": { "D": { "aqua": 141, "noaa20_units": 313 }, "N": { "aqua": 84, "noaa20_units": 193 } } },
  "harmonization": { "fire_unit": "h3_res8_x_overpass", "overpass_gap_min": 10, "min_n": 30,
                     "cell_resolution": 5, "noaa20_vs": "aqua" },
  "continents": [ { "...": "(keys above)",
    "r_day": 0.37, "r_night": 0.41,        // ratio used for this continent (its own, or the world one on fallback); null = unknown
    "n": { "D": { "aqua": 52, "noaa20_units": 141 }, "N": { "aqua": 32, "noaa20_units": 79 } },  // this continent's own sums
    "fallback": { "D": false, "N": false }, // true = fewer than min_n on either side, so that D/N uses the world ratio
    "flags": [],                            // "ratio_fallback" when D or N fell back
    "cells_file": "cells_africa.json" } ] }
```
VIIRS side = **NOAA-20 fire units only** (H3 res 8 × overpass, PLAN D9); Aqua side = pixels. Terra, S-NPP and NOAA-21 take no part (one platform per side as in D3, but Aqua ↔ NOAA-20 directly, not through S-NPP; see docs/research/world_map.md). Overpass: same platform, same UTC date, same res 8 cell; times sorted, a gap **> 10 min** to the previous time starts a new overpass (exactly 10 min is the same one). Ratios are a ratio of sums, day and night separately. Ratios are rounded to 4 decimals.

```jsonc
// world/cells_{continent}.json — H3 res 5 cells with at least one Aqua pixel or NOAA-20 fire unit, sorted by id
{ "schema_version": "0.1", "synthetic": false, "continent": "africa", "resolution": 5,
  "unit": "aqua_equivalent_hotspots", "period": { "start": "2026-11-05", "end": "2026-11-14" }, "n": 1,
  "cells": [ {
    "id": "857a6b2bfffffff",                 // H3 v4 index
    "lat": -8.123, "lon": 25.456,            // centre, 3 decimals
    "boundary": [[25.4, -8.1], "…"],         // [lon, lat] vertices, 3 decimals: 6 (5 for a pentagon, up to 10 at an
                                             // icosahedron edge). Crossing 180°: negative lons + 360, like bbox
    "viirs_harm": 6.5,                       // Σ unit_D × r_D + Σ unit_N × r_N, 2 decimals; null if a needed r is null
    "aqua": 2,                               // Aqua pixels (× 1)
    "noaa20_units": { "D": 3, "N": 1 },
    "r": { "D": 2.0, "N": 0.5 } } ] }         // the ratios used (= index r_day, r_night)
```
A cell takes only this continent's hotspots; a cell on a continent border can appear in both files with each side's counts.

```jsonc
// world/points_{continent}.json — one array per column (compact), row i = hotspot i, sorted by UTC time
{ "schema_version": "0.1", "synthetic": false, "continent": "asia", "n": 2,
  "codes": { "platform": ["terra", "aqua", "snpp", "noaa20", "noaa21"],   // the numbers in the columns
             "conf": ["low", "nominal", "high"],
             "match_class": ["both", "viirs_only", "modis_only", "not_comparable"] },
  "dates": ["2026-11-05", "…", "2026-11-14"],                              // UTC
  "columns": {
    "lon": [106.988, -179.0], "lat": [47.123, 66.5],   // degrees, 3 decimals
    "platform": [3, 1],                                // index into codes.platform
    "frp": [12.35, 0.96],                              // MW
    "conf": [2, 0],                                    // index into codes.conf (MODIS <30/<80/else; VIIRS l/n/h)
    "date": [0, 9],                                    // index into dates (UTC)
    "hhmm": [342, 1832],                               // UTC time as FIRMS acq_time: 342 = 03:42
    "daynight": ["N", "D"],
    "match_class": [null, 2] } }                       // index into codes.match_class (#37); null = not in the
                                                       // match (Terra, S-NPP, NOAA-21)
```
Code lists only grow at the end (additive-only), so a stored code never changes meaning.

**Match keys (#37, additive).** NOAA-20 ↔ Aqua only. `index.json` also has:

```jsonc
{ "match": { "pair": "noaa20_vs_aqua", "window_min": 60, "sensitivity_window_min": 180, "earth_radius_m": 6371000,
             "r_match": "0.5*sqrt(scan^2+track^2)+0.1875 km", "not_comparable_km": 300, "iou_cell_resolution": 5 },
  "continents": [ { "...": "(keys above)",
    "iou": 0.35,                     // H3 res 5 cells with Aqua > 0 and NOAA-20 units > 0 / cells with either; null = no cells
    "p_v_given_m": 0.1967,           // P(VIIRS | MODIS) = both / (both + modis_only), Aqua pixels; null = 0 / 0
    "p_m_given_v": 0.08,             // P(MODIS | VIIRS) = both / (both + viirs_only), NOAA-20 fire units
    "not_comparable_share": { "aqua": 0.9709, "noaa20_units": 0.9822 },  // not_comparable / all, each side; null = none
    "match_counts": { "aqua": { "both": 0, "modis_only": 0, "not_comparable": 0 },
                      "noaa20_units": { "both": 0, "viirs_only": 0, "not_comparable": 0 } },
    "sensitivity_180": { "p_v_given_m": 0.39, "p_m_given_v": 0.11,       // same with |Δt| ≤ 180 min; data only,
                         "not_comparable_share": { "aqua": 0.02, "noaa20_units": 0.22 } } } ] }  // not shown in the UI
```
One fire: haversine distance (r = 6371000 m) ≤ R_match of the Aqua pixel, |Δt| ≤ 60 min (UTC date + time, so it crosses midnight), same day/night flag → `both` on both sides. Otherwise `not_comparable` when the other platform has **no hotspot at all within 300 km and ±60 min**, else `modis_only` (Aqua) / `viirs_only` (NOAA-20). A fire unit is `both` if any of its pixels is, else `viirs_only` if any pixel is, else `not_comparable`. Not comparable is left out of both probabilities. Matching runs over all continents at once; a continent's numbers use its own hotspots. Values are rounded to 4 decimals.

## `monthly_counts.parquet` (P1 → P2, internal)

Written to `etl/data/processed/`, not served. One row per region × month × platform × day/night.

| Column | Type | Meaning |
|---|---|---|
| `region_id` | str | matches `regions.json` |
| `ym` | str | `YYYY-MM`, **local date** (UTC+8) |
| `platform` | str | `terra` `aqua` `snpp` `noaa20` `noaa21` |
| `daynight` | str | `D` or `N` |
| `pixels` | int | raw hotspot pixels |
| `units` | int | counting unit per PLAN D9 (VIIRS fire units; MODIS pixels). v0 prototype uses 0.05° cell-days: say so in `unit_kind` |
| `unit_kind` | str | `fire_unit_h3r8` \| `cell_day_0.05deg` |

*P1 to confirm in P1-05.*
