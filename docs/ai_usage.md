# AI usage log

Required by the submission. One row per use. Lane owners add a line each session; L5 consolidates.

| Date/time | Person | Lane | Tool | What for | Files/areas | Human review by |
|---|---|---|---|---|---|---|
| 2026-11-15 | gua | World map (#35) | Claude Code (Opus 5.5) | Implement NOAA-20 fire units, continent r_day/r_night + fallback, H3 res 5 cells; tests, fixtures, contract, docs | etl/world_map.py, etl/build_world_map.py, etl/tests/test_world_harmonize.py, fixtures/, contracts/README.md, app/src/data/contracts.ts, docs/research/world_map.md | gua (pending) |
| 2026-11-15 | gua | Real data (P1/P2) | Claude Code (Opus 5.5) | Export real contract JSON from the FIRMS parquet + aimag geojson (raw counts only; harmonized/baseline/name_mn null), tests, name_mn fallback in Dashboard, docs | etl/export_contracts.py, etl/run_all.py, etl/tests/test_export_contracts.py, public/data/, app/src/data/contracts.ts, app/src/pages/Dashboard.tsx, contracts/README.md, docs/claims.md, etl/README.md | gua (pending) |
| 2026-11-15 | gua | World map data | Claude Code (Opus 5.5) | Run fetch_world_nrt.py (user's own FIRMS key in .env, never printed) + build_world_map.py, commit real world JSON, claims rows | public/data/world/, docs/claims.md | gua (pending) |
