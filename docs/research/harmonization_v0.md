# Harmonization v0: MODIS Aqua ↔ VIIRS S-NPP (national, daytime)

Script: `etl/harmonize_v0.py` · Input: `hotspots_clean.parquet` · Output: `national_monthly_harmonized.csv`
All numbers below come from that script (Sat 14 Nov 2026, ~20:55).

## Why not just add or splice the counts
Raw daytime hotspots, 2013 to 2022: S-NPP sees **6.17×** as many as Aqua.
Raw yearly hotspots jump from 1,327 (Aqua, 2011) to 45,611 (S-NPP, 2012) only because the sensor changed.

## Step 1: fire cell-days (removes most of the pixel-size effect)
A 0.05° cell (~5 km) counts once per local day if it has ≥ 1 hotspot.
Daytime, 2013 to 2022: S-NPP / Aqua drops from **6.17** (raw hotspots) to **2.09** (cell-days).

## Step 2: day and night must be separate
Night cell-days, 2013 to 2022: S-NPP / Aqua = **6.08** (vs 2.09 by day). v0 uses daytime only.

## Step 3: seasonal ratios (ratio of sums, 2013 to 2022)
| Season | S-NPP / Aqua |
|---|---|
| Spring (Mar to May) | 1.95 |
| Summer (Jun to Aug) | 2.50 |
| Autumn (Sep to Nov) | 1.79 |
| Winter / all | 2.09 |

Per-year ratio range: 1.88 (2015) to 2.44 (2021). The relation is stable, so a ratio is a reasonable first model.

## Step 4: leave-one-year-out test
Learn ratios without year Y, predict S-NPP cell-days for Y from Aqua.

| Year | Actual S-NPP | Predicted from Aqua | Error |
|---|---|---|---|
| 2013 | 614 | 541 | -11.9% |
| 2014 | 839 | 860 | +2.5% |
| 2015 | 2,123 | 2,506 | +18.0% |
| 2016 | 598 | 533 | -10.9% |
| 2017 | 1,465 | 1,648 | +12.5% |
| 2018 | 279 | 244 | -12.5% |
| 2019 | 431 | 417 | -3.2% |
| 2020 | 236 | 211 | -10.6% |
| 2021 | 178 | 138 | -22.5% |
| 2022 | 439 | 377 | -14.1% |

Mean absolute error **11.9%** · Spearman rank correlation of years **0.99** (the ranking of big vs small years is kept).
Any ML model must beat this on the same test to replace it.

## Harmonized series
VIIRS S-NPP equivalent units: Aqua × seasonal ratio (2002-07 to 2012-01), S-NPP (2012-02 to 2026-10), NOAA-20 (2026-11).
Also given in Aqua-equivalent units (team plan reference). Months before Aqua (Terra only) are empty, not zero.

Top harmonized years (daytime cell-days): 2002 (5,326; Jul to Dec only) · 2008 (3,554) · 2007 (2,881) · 2012 (2,821; from Feb) · 2009 (2,658) · 2015 (2,123).
2002: 1,836 Aqua cell-days in September alone. Validation candidate: check against reported 2002 fires.

## Limitations
1. National level only; aimag level waits for boundaries (`get_boundaries.py`).
2. Daytime only. Night needs its own ratio.
3. Ratio may drift: Terra and Aqua orbits are drifting in recent years; 2023 onward is not used for fitting.
4. Grid size 0.05° is an assumption; test 0.02° and 0.10°.
5. Hotspot cell-days are not fire counts or burned area.
