# World map (Dashboard, #31): data decisions and limitations

Scripts: `etl/fetch_world_nrt.py` (W1) → `etl/build_world_map.py` (W2, library `etl/world_map.py`).
Output shapes: [contracts/README.md § world/](../../contracts/README.md). Period: **2026-11-05 – 2026-11-14**, FIRMS NRT.

This is an add-on view on the Dashboard. It does not change PLAN.md (D6 "MVP = Mongolia", §5 still hold), and its numbers are not used by the calendar or the D3 chain.

## Cleaning (#33)

| Decision | Why |
|---|---|
| Dates and times are stored in **UTC** (`dates` + `hhmm`). | The world has no single local time. The Mongolian pipeline uses UTC+8 local dates; this one does not. A fire at 23:30 UTC in East Asia is the next local day: compare day-by-day numbers with that in mind. |
| **No static-source mask.** Power plants, gas flares, volcanoes and industry stay in. | NRT files have no `type` column. The Mongolian cleaner learns static cells from archive files; there is no world archive download here. |
| Platform: VIIRS from the FIRMS source (`VIIRS_NOAA20_NRT` → noaa20 …), MODIS from `satellite` (`Terra`/`Aqua` or `T`/`A`). | One MODIS source holds both satellites. An unknown `satellite` value stops the build rather than guessing. |
| Confidence: MODIS < 30 low / < 80 nominal / else high; VIIRS l / n / h. | Same rule as `clean_hotspots.py`, so both sensors share one scale. |
| VIIRS brightness columns `bright_ti4/ti5` and `brightness/bright_t31` are both read. | FIRMS has used both names. |
| S-NPP files are empty. | FIRMS stopped S-NPP data on 2026-11-02 (expected, not an error). |

## Continents (#33)

- Point-in-polygon on Natural Earth 110m countries (`CONTINENT`). A point outside every polygon (coast, small islands; 110m borders are coarse) takes the **nearest country within 1°** (planar degrees; fine for this purpose).
- Points in **Antarctica**, **"Seven seas (open ocean)"** and points with no country within 1° are **dropped**. They are counted in `index.json → dropped` and printed by the build, never removed silently.
- Kept continents: Africa, Asia, Europe, North America, South America, Oceania.
- Bbox comes from the borders. For a continent crossing 180°, the bbox is the **narrowest longitude interval** covering every polygon, so `east` can be > 180 (the UI draws points west of `west` at lon + 360).
- **Natural Earth quirk:** Russia (all of it, Chukotka included) and France (with French Guiana) are in Europe. So Siberian fires count as Europe, French Guiana fires count as Europe, and the Europe bbox from borders is about [-54.5, 2.1, 190.1, 81.3]. Asia does not cross 180° in NE 110m. If the Europe zoom is too wide in the UI, raise it with the team; changing the continent rule changes `index.json` counts.

## Aqua-equivalent count (#35)

Unit: **Aqua MODIS-equivalent hotspots** (PLAN D2), shown per H3 res 5 cell in `cells_{continent}.json`.

| Decision | Why |
|---|---|
| VIIRS side = **NOAA-20 fire units**; Aqua side = pixels. Terra, S-NPP, NOAA-21 are left out. | **A deliberate shortcut of D3.** D3's chain converts NOAA-20 through S-NPP (× r₁ × r₂); S-NPP stopped on 2026-11-02 and there is no 10-year world calibration here, so this add-on compares Aqua and NOAA-20 directly over the same 10 days. D3's "one platform per side, no double counting" still holds: Terra and NOAA-21 stay on the map as points but are not converted. |
| Fire unit = one H3 res 8 cell (~0.74 km²) in one overpass (D9). | Pixel size differs between sensors and across the swath; counting cells per pass removes most of that. |
| **Overpass:** same platform, same UTC date, same res 8 cell. Sort the times; when the gap to the previous time is **> 10 minutes**, a new overpass starts. Exactly 10 minutes is the same overpass. | One NOAA-20 pass over a spot lasts seconds to a couple of minutes; the next pass over the same spot is about one orbit (~100 min) later. 10 minutes separates them safely. The gap is measured between consecutive times (chained), not from the first, so a pass spanning the hour (00:55 → 01:04) stays one. A pass that straddles 00:00 UTC is split into two units by the date rule; rare, accepted. |
| Fire units are also split by continent (a res 8 cell on a continent border gives one unit per side). A unit's day/night = its first hotspot's `daynight`. | Hotspots of one pass over one cell share the flag in practice. |
| **Ratio per continent, day and night separately:** `r = Σ Aqua pixels / Σ NOAA-20 fire units` (ratio of sums, D7). | Day and night detection differ; a ratio of sums is not pulled around by days with few fires. |
| **Fallback:** if either side has **< 30** in a continent's D or N, that D/N uses the **world ratio** (same formula over all kept hotspots) and the continent gets `flags: ["ratio_fallback"]`; `fallback.D` / `fallback.N` say which. | The number 30 comes from D7 ("< 30 fire units"); as #35 asks, it is applied to **both** sides here (Aqua pixels too), because a continent with few Aqua pixels gives a noisy ratio just as one with few units does. A world ratio beats a noisy ratio from a handful of points. |
| A ratio with zero fire units is `null`, not 0. A cell that needs a null ratio gets `viirs_harm: null`. | Contract rule 4: unknown ≠ zero. |
| Cell `viirs_harm = Σ unit_D × r_D + Σ unit_N × r_N`; `aqua` is kept as-is (× 1). | Lets the UI compare what Aqua saw with what NOAA-20 says Aqua would have seen. |
| Cell boundaries are written in the file (`[lon, lat]`, 3 decimals). Crossing 180°, negative lons get + 360 (like `bbox`). | The app does not need `h3-js` just to draw cells. |

**Limitation:** ten days of NRT data is a small sample, and the ratios are not the 2012–2021 calibration ratios of the Mongolian calendar. Treat them as a demonstration of the method on world data, not a calibrated conversion.

## Match, P(V|M), P(M|V), IoU (#37)

Pair: **NOAA-20 ↔ Aqua** (the two sides of the ratio above). Terra, S-NPP and NOAA-21 get `match_class: null`; no point is removed.

| Decision | Why |
|---|---|
| Distance = **haversine** (formula file, formula 3), r = 6371000 m. | Formula 1 (exactly equal coordinates) never fires: the two sensors' pixel centres never coincide. Formula 2 (planar distance) distorts metres at continent scale. |
| **R_match = 0.5·√(scan² + track²) + 0.1875 km**, scan/track of the Aqua pixel (km). | An approximation of D8's "inside the MODIS pixel + buffer": the rectangle becomes the circle around it (half diagonal), and the buffer is half a 375 m VIIRS pixel. The circle is a bit larger than the pixel, so it errs towards matching. |
| One fire also needs **\|Δt\| ≤ 60 min** and the **same D/N flag**. | Same fire, same overpass pair. Times use UTC date + time, so a pair across 00:00 UTC still matches. |
| **Not comparable** = the other platform has **no hotspot within 300 km in ±60 min** (any D/N). | Then the other satellite probably did not look there at that time; that is not "the other sensor missed it". It is kept and counted, not dropped. |
| **P(V\|M)** over Aqua pixels; **P(M\|V)** over NOAA-20 fire units (a unit is Both if any of its pixels is). Not comparable is out of both; its share is given per side. | D8: both directions, each in its own counting unit (D9). |
| **IoU** on H3 res 5 cells: cells where both Aqua > 0 and NOAA-20 units > 0, over cells where either is > 0. | Formula 4 with cells instead of hand-drawn polygons, on the same grid as the harmonized map. Not time-matched: it compares where each sensor saw fire over the 10 days. |
| **±180 min sensitivity** stored in `index.json` (`sensitivity_180`), not shown in the UI. | Aqua's drift (D5) puts its overpass about 2.2 h after NOAA-20's (Mongolia NRT medians: day ~14.9 h vs ~12.7 h, night ~4.4 h vs ~2.1 h local solar time). |

**Results (real data, ±60 min; ±180 min in brackets).** As expected from the drift, ±60 min leaves almost every hotspot Not comparable, so the probabilities rest on a few percent of the data:

| Continent | IoU | P(V\|M) | P(M\|V) | Not comparable, Aqua | Not comparable, NOAA-20 units |
|---|---|---|---|---|---|
| Africa | 0.3504 | 0.1967 (0.3898) | 0.08 (0.1124) | 0.9709 (0.0247) | 0.9822 (0.2157) |
| Asia | 0.1735 | 0.2665 (0.2222) | 0.1014 (0.1023) | 0.9666 (0.1218) | 0.9642 (0.4395) |
| Europe | 0.0669 | 0.3333 (0.3929) | 0.3 (0.1873) | 0.8294 (0.0711) | 0.9778 (0.7752) |
| North America | 0.1401 | 0.3364 (0.4982) | 0.2143 (0.1888) | 0.8738 (0.0153) | 0.9667 (0.5431) |
| South America | 0.3176 | 0.2807 (0.3553) | 0.1266 (0.1812) | 0.989 (0.0789) | 0.9817 (0.2606) |
| Oceania | 0.4355 | 0.5094 (0.5189) | 0.2307 (0.1961) | 0.9623 (0.1982) | 0.9632 (0.2369) |

**Limitations.** Most of the ±60 min result is Not comparable (D10: reported, not hidden). Even at ±180 min a fire can grow or die between the two overpasses, so a low P(V|M) / P(M|V) is not only a detection difference. R_match is small (about 1–2.5 km), so a position error larger than half a MODIS pixel counts as a miss.

## Real run and limitations (#39)

Run on 2026-11-15 with `VITE_MOCK=false` (the default). `python etl/fetch_world_nrt.py` found all 8 CSVs already downloaded (MAP_KEY status 0 / 5000 before and after, so no request used); `python etl/build_world_map.py` (~50 s) rebuilt `public/data/world/` **byte-identical** to the committed files, so the committed numbers come from the scripts as they are.

**Input.** 1,204,456 hotspots in the period (MODIS 107,704 · NOAA-20 555,422 · NOAA-21 541,330 · S-NPP 0). Assigned to a continent: 1,202,279. Dropped: 2,177 with no country within 1° (Antarctica 0, Seven seas 0).

**Files** (`"synthetic": false`; the loader refuses `"synthetic": true` in real mode). Total 58.7 MB (sizes printed by the build), 9.9 MB gzip (measured by hand with Python `gzip`, level 6). The browser only loads `index.json` plus the selected continent's points file (raw view) or cells file (Harmonize).

| Continent | points | cells | gzip (points + cells) |
|---|---|---|---|
| Africa | 23.8 MB | 5.4 MB | 3.9 + 0.9 MB |
| Asia | 4.8 MB | 2.5 MB | 0.9 + 0.5 MB |
| Europe | 0.3 MB | 0.2 MB | 0.1 + 0.1 MB |
| North America | 1.3 MB | 1.1 MB | 0.2 + 0.2 MB |
| South America | 7.1 MB | 3.0 MB | 1.2 + 0.5 MB |
| Oceania | 8.1 MB | 1.1 MB | 1.2 + 0.2 MB |

`index.json` is 5.6 kB. Africa's points file is the one to watch: 637,752 points, ~4 MB over the wire.

**Checks.**
- `etl/tests/test_world_real_files.py` runs the fixture invariants (`fixtures/check_fixtures.py → check_world`) on the committed real files: column lengths, code ranges, match_class null exactly for Terra / S-NPP / NOAA-21, match counts adding up to the pixels and fire units, P(V|M) and P(M|V) recomputed from the counts, every cell's `viirs_harm` recomputed from its units × r, cell totals = index totals, `"synthetic": false` and `schema_version` in every file. All pass. Whole suite on this machine: 122 passed, 3 errors; the errors are the parquet cross-checks in `test_export_contracts.py`, which cannot load `hotspots_clean.parquet` because pyarrow (listed in `etl/requirements.txt`) is not installed in this local Python 3.14 env (same 3 errors on the clean previous commit, not caused by #39).
- Browser (dev server, real mode, `#/dashboard`): no synthetic banner; all six continents switch and show their r_day / r_night; VIIRS / MODIS switch; Harmonize shows cells on both sides with one scale; hover on a point (e.g. "Terra · MODIS, 8 Nov 2026 09:21 UTC, FRP 2.6 MW, low, Day, not in the NOAA-20 ↔ Aqua comparison") and on a cell (VIIRS: "0 × 0.166 + 1 × 0.0416 = 0.04"; MODIS: "Aqua hotspots: 1 × 1"); stats row matches `index.json` (Africa IoU 0.35, P(V|M) 19.7% = 189 of 961). No console errors from the world section on a fresh load. (Navigating from Home to Dashboard logs React "synchronously unmount a root" warnings from the Home globe; not part of this section.)

**Decisions this view rests on** (all above, collected here):
1. **PLAN.md is not changed.** This world view contradicts PLAN §5 ("removed: all world data") and D6 ("MVP = Mongolia"). The team decided on 2026-11-15 to add it as a separate Dashboard section without editing the PLAN; the Mongolian calendar, its D3 chain and its numbers are untouched.
2. **Dates are UTC**, not local. Day-by-day numbers are not comparable with the Mongolian calendar (UTC+8).
3. **No static-source mask.** NRT has no `type` column; gas flares, power plants, volcanoes and industry are counted as fires.
4. **Aqua drift and ±60 min.** Aqua passes ~2.2 h after NOAA-20 (D5), so a ±60 min window finds the other satellite for only 1–17% of hotspots. The ±180 min numbers are in `index.json → sensitivity_180` and in the claims ledger, not in the UI.
5. **The continent ratio is not the D3 chain.** `r = Σ Aqua pixels / Σ NOAA-20 fire units` over these 10 days, per continent and D/N. It is not r₁ × r₂ via S-NPP, not calibrated on 2012–2021, and not used by the calendar.

**Weak results (D10: reported, not hidden).**
- **P(V|M) and P(M|V) rest on small, unstable samples.** At ±60 min the comparable Aqua pixels are 961 (Africa), 319 (Asia), 36 (Europe), 214 (North America), 171 (South America), 373 (Oceania). Widening to ±180 min moves P(V|M) by up to +0.19 (Africa 0.20 → 0.39, North America 0.34 → 0.50) and in Asia it goes *down* (0.27 → 0.22). The numbers show the method; they are not a stable detection agreement.
- **P(M|V) is low everywhere (0.08–0.30).** Expected: VIIRS 375 m sees small fires MODIS 1 km cannot, so "Aqua also saw it" is rare. It is not evidence that MODIS is broken.
- **Europe IoU is 0.07.** Europe here is mostly Russia (Natural Earth puts all of Russia in Europe) and has the fewest fires (211 Aqua pixels in 10 days).
- **Night ratios are small and thin.** r_night is 0.016–0.12; Europe's night ratio is built on 35 Aqua pixels, just above the 30 fallback threshold. No continent fell back to the world ratio, but Europe night is close.
- **Ten days of NRT** is a demonstration sample. Fires grow and die between overpasses, so even a perfect detector pair would not reach P = 1.
