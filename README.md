# MODIS ↔ VIIRS Hotspot Harmonization

**NASA Space Apps Challenge 2026** · Challenge: [Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) · Team **Space Khuushuur** (Mongolia)

A web app that merges two generations of satellite fire detections (MODIS and VIIRS) into one consistent **burning-activity calendar** for Mongolia, so the sensor a detection came from no longer matters. Pick an area and a date range, see whether a month is unusual against the historical median, and download the data.

> **Status: work in progress (hackathon).** Nothing here is a validated result until it appears in `docs/claims.md` with the script that produced it.

## How it works (short)

MODIS flew for 20+ years and is retiring. VIIRS has a finer pixel and keeps flying, but it sees many more small fires, so naive counts jump when the sensors change. We bridge the gap on the ground, with archived data only:

1. Count hotspots per platform in a common unit.
2. Measure a conversion ratio in the years when two platforms flew together.
3. Hand the count over along one chain, **Aqua → Suomi NPP → NOAA-20**, so only one platform counts at any moment.
4. Check it by rebuilding Aqua's real counts from VIIRS alone (leave-one-year-out test).

Decisions and reasoning: [PLAN.md](PLAN.md). Vocabulary: [GLOSSARY.md](GLOSSARY.md). Who does what: [TASKS.md](TASKS.md).

## Repository layout

| Path | What |
|---|---|
| `etl/` | Python data pipeline: FIRMS files → clean hotspots → counts → harmonized series. See [etl/README.md](etl/README.md) |
| `contracts/` | The JSON shapes the pipeline writes and the app reads |
| `fixtures/` | **Synthetic** sample data in the same shapes, for building the UI before real data exists |
| `public/data/` | Real pipeline output served by the app *(created by the pipeline)* |
| `app/` | Web app (Vite + React + TypeScript): Home, Harmonizing, Dashboard, Story, Forecast |
| `docs/` | Research notes, methods, credits, claims ledger, AI-use log |
| `docs/archive/` | Superseded planning documents (do not follow) |

## Getting started

Requirements: Python 3.11+, Node.js 24 (what CI uses).

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r etl/requirements.txt
cp .env.example .env               # add FIRMS_MAP_KEY (never commit it)
```

Put the FIRMS archive CSVs in `etl/data/raw/` (where they come from: [etl/README.md](etl/README.md)), then:

```bash
python etl/run_all.py
```

### Website

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run build      # production build in app/dist
```

The app reads contract JSON through one helper, `loadData()` in `app/src/data/`.
By default it serves the real pipeline output in `public/data/`; a real build refuses any file that says `"synthetic": true`.
To use the **SYNTHETIC** files in `fixtures/` instead (red "SYNTHETIC" banner), set `VITE_MOCK=true` (in `app/.env.local` or the environment).

Public address (after a repo admin sets Settings → Pages → Source: GitHub Actions): https://naranll.github.io/nasa-challenge-2026/, deployed from `main` by `.github/workflows/deploy.yml`. It shows SYNTHETIC fixtures until the repo variable `VITE_MOCK` is set to `false`.

## Data and credits

- Hotspots: NASA FIRMS (MODIS C6.1, VIIRS S-NPP / NOAA-20 / NOAA-21). Please cite FIRMS when using the outputs.
- Boundaries: geoBoundaries (ODbL 1.0, © OpenStreetMap contributors).
- Full list with licences: `docs/credits.md` *(in progress)*.

## AI use

AI assistants were used in this project. Every use is logged in [docs/ai_usage.md](docs/ai_usage.md).

## Limitations

Informational only. This is **not** an official fire warning. Known limitations are listed in PLAN.md §8.

## License

[MIT](LICENSE).
