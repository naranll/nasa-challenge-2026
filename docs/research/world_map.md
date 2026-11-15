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
