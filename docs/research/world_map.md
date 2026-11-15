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
