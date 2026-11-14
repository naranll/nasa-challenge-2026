# etl — data pipeline

Turns FIRMS hotspot files into clean hotspots, counts and (later) the JSON the app reads.
Decisions: [PLAN.md](../PLAN.md) §2–3 · Audit of the raw files: [docs/research/data_audit.md](../docs/research/data_audit.md) · Output shapes: [contracts/](../contracts/README.md)

## Run order

| # | Script | Reads | Writes (`etl/data/…`) |
|---|---|---|---|
| 1 | `get_boundaries.py` | geoBoundaries API | `raw/mongolia_aimags.geojson` |
| 2 | `clean_hotspots.py` | `raw/fire_*.csv` | `processed/hotspots_clean.parquet` |
| 3 | `build_cell_days.py` | step 2 + step 1 | `processed/cell_days_monthly.csv` |
| 4 | `harmonize_v0.py` | step 2 | `processed/national_monthly_harmonized.csv` |

```bash
pip install -r etl/requirements.txt
python etl/run_all.py                      # everything
python etl/run_all.py --from clean_hotspots
```
(`make etl` does the same if you have `make`.)

`harmonize_v0.py` is a **prototype**: it uses a 0.05° grid and national day-time counts, while PLAN D9 specifies H3 res 8 fire units and D7 day/night ratios. Treat its numbers as indicative.

## Where the raw data comes from (not in git)

Download from **NASA FIRMS → Archive Download**: country **Mongolia**, buffer 0 km, format CSV, **one request per sensor** (MODIS C6.1, VIIRS S-NPP, NOAA-20, NOAA-21). Each request returns a ZIP with `fire_archive_*.csv` (science quality) and `fire_nrt_*.csv` (near real time).
Unzip all CSVs into `etl/data/raw/`. Exact files, dates and row counts used so far: the table in [data_audit.md](../docs/research/data_audit.md).

## Rules for this folder

- Raw and processed data stay out of git (`etl/data/` is ignored). Re-create them with the steps above.
- Secrets only in `.env` (see `.env.example`); never in code.
- Every number that reaches the demo comes from a script here and is listed in `docs/claims.md`.
- New dependency → add it to `requirements.txt` and tell the group.
