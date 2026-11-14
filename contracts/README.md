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

Shapes for `case_study`, `matches_summary` and `satellites` are added by their owners before G1.

## `regions.json`

```jsonc
{ "schema_version": "0.1", "synthetic": true,
  "regions": [ { "region_id": "mongolia", "name_en": "Mongolia", "name_mn": "Монгол", "kind": "country" } ] }
// kind: country | aimag | capital   (22 units: 21 aimags + Ulaanbaatar, D6/D11)
```

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
`raw.*` is each platform's own uncorrected count (VIIRS = raw pixels, D12). `chain_switch` marks a month that contains a hand-over between platforms. `noaa20_derived` applies from 2026-11-02.

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
