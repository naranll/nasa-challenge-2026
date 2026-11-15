# Fixtures (SYNTHETIC)

Made-up numbers in the exact shapes of [`contracts/`](../contracts/README.md), so the app can be built before real data exists. Every file says `"synthetic": true`.
Exception: `satellites.json` is written by `scripts/tle/fetch_tle.ts`, not `make_fixtures.py`. It is the real CelesTrak orbit snapshot, marked `"synthetic": true` only so it is allowed here.
`world/` (Dashboard world map) is built with the same `etl/world_map.py` functions as the real files, so it needs the ETL requirements (`geopandas`).
**Never shown in the demo.** Real files live in `public/data/`; switching is `MOCK=false`.

```bash
python fixtures/make_fixtures.py    # regenerate (deterministic)
python fixtures/check_fixtures.py   # CI check: synthetic flag, schema_version, calendar starts 2002-07, world/ columns and codes
```
Owner: P2.
