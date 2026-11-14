"""Generate SYNTHETIC fixtures in the shapes defined in contracts/README.md.

Made-up numbers, for building the UI before real data exists. Never shown in the demo.
Deterministic (seeded): re-running gives identical files.

    python fixtures/make_fixtures.py
"""
import json
import math
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent
SCHEMA = "0.1"
REGIONS = [  # (id, English, Mongolian, kind, size factor)
    ("mongolia", "Mongolia", "Монгол", "country", 1.0),
    ("dornod", "Dornod", "Дорнод", "aimag", 0.35),
    ("ulaanbaatar", "Ulaanbaatar", "Улаанбаатар", "capital", 0.04),
]
FAKE_VIIRS_FACTOR = 3.2  # fake "VIIRS sees more fires than MODIS"


def season(month):  # spring + autumn peaks, steppe-like shape
    return 0.25 + 0.75 * max(math.exp(-((month - 4) ** 2) / 3), 0.6 * math.exp(-((month - 10) ** 2) / 2))


def write(path, doc):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote", path.relative_to(OUT.parent))


def months():
    for y in range(2002, 2027):
        for m in range(1, 13):
            ym = f"{y}-{m:02d}"
            if "2002-07" <= ym <= "2026-12":
                yield y, m, ym


def quantile_lower(values, p):  # PLAN D11: method="lower", no interpolation
    v = sorted(values)
    return v[int(p * (len(v) - 1))]


def calendar(region_id, size, seed):
    rnd = random.Random(seed)
    rows = []
    for y, m, ym in months():
        base = 400 * size * season(m) * (1 + 0.3 * math.sin(y))
        aqua = max(0, round(base * rnd.uniform(0.7, 1.3)))
        viirs = round(aqua * FAKE_VIIRS_FACTOR * rnd.uniform(0.9, 1.1))
        terra = max(0, round(aqua * rnd.uniform(0.8, 1.1)))
        flags = []
        if y == 2002:
            flags.append("partial_year")
        if ym < "2012-02":
            chain = "aqua"
            raw = dict(terra=terra, aqua=aqua, snpp=None, noaa20=None, noaa21=None)
            harmonized = aqua
        elif ym < "2026-11":
            chain = "snpp"
            raw = dict(terra=terra, aqua=aqua, snpp=viirs,
                       noaa20=viirs if ym >= "2018-04" else None,
                       noaa21=viirs if ym >= "2023-03" else None)
            harmonized = round(viirs / FAKE_VIIRS_FACTOR)
            if ym == "2012-02":
                flags.append("chain_switch")
        else:
            chain = "noaa20"
            raw = dict(terra=terra, aqua=aqua, snpp=None, noaa20=viirs, noaa21=viirs)
            harmonized = round(viirs / FAKE_VIIRS_FACTOR)
            flags += ["noaa20_derived"] + (["chain_switch"] if ym == "2026-11" else [])
        rows.append(dict(ym=ym, harmonized=harmonized, chain_platform=chain, raw=raw,
                         is_forecast=False, flags=flags))

    ref = {}  # baseline per calendar month from reference years 2003-2025
    for r in rows:
        if "2003" <= r["ym"][:4] <= "2025":
            ref.setdefault(int(r["ym"][5:]), []).append(r["harmonized"])
    for r in rows:
        v = ref[int(r["ym"][5:])]
        r["baseline"] = dict(median=quantile_lower(v, 0.5), p25=quantile_lower(v, 0.25), p75=quantile_lower(v, 0.75))
        if r["ym"] >= "2026-11":  # upcoming months: dashed in the UI, no observed value yet
            r["is_forecast"] = True
            r["harmonized"] = None
            r["raw"] = dict(terra=None, aqua=None, snpp=None, noaa20=None, noaa21=None)

    return dict(schema_version=SCHEMA, synthetic=True, region_id=region_id,
                unit="aqua_equivalent_hotspots", reference_years=[2003, 2025], months=rows)


def hex_year():
    rnd = random.Random(7)
    years = list(range(2003, 2026))
    W, S, E, N = 87, 41, 120, 53  # approx. Mongolia bbox, synthetic
    cells, lat, i = [], S + 1, 0
    while lat < N:
        lon = W + 1
        while lon < E:
            w = 0.2 + 0.8 * max(0.0, math.sin((lon - W) / (E - W) * math.pi)) * ((lat - S) / (N - S))
            cells.append((f"fixture-{i}", lat, lon, w))
            i += 1
            lon += 2
        lat += 2

    raw_cells, harm_cells = [], []
    for cid, lat, lon, w in cells:
        aqua, terra, snpp, noaa20, harm = [], [], [], [], []
        for y in years:
            base = 40 * w * (1 + 0.3 * math.sin(y)) * rnd.uniform(0.7, 1.3)
            aqua.append(round(base))
            terra.append(round(base * rnd.uniform(0.8, 1.1)))
            snpp.append(round(base * 4.0) if y >= 2012 else None)   # fake "VIIRS sees more": the 2012 jump
            noaa20.append(round(base * 4.0) if y >= 2018 else None)
            harm.append(round(base))
        raw_cells.append(dict(id=cid, lat=lat, lon=lon,
                              counts=dict(terra=terra, aqua=aqua, snpp=snpp, noaa20=noaa20)))
        harm_cells.append(dict(id=cid, lat=lat, lon=lon, counts=harm))

    return (dict(schema_version=SCHEMA, synthetic=True, resolution=5, kind="raw_pixels", years=years, cells=raw_cells),
            dict(schema_version=SCHEMA, synthetic=True, resolution=5, kind="aqua_equivalent", years=years, cells=harm_cells))


def main():
    write(OUT / "regions.json", dict(
        schema_version=SCHEMA, synthetic=True,
        regions=[dict(region_id=r, name_en=en, name_mn=mn, kind=k) for r, en, mn, k, _ in REGIONS]))
    for n, (rid, _, _, _, size) in enumerate(REGIONS):
        write(OUT / "calendar" / f"{rid}.json", calendar(rid, size, 42 + n))
    raw, harm = hex_year()
    write(OUT / "hex_year" / "raw.json", raw)
    write(OUT / "hex_year" / "harm.json", harm)
    write(OUT / "pipeline_stats.json", dict(
        schema_version=SCHEMA, synthetic=True,
        rows_by_platform=dict(terra=0, aqua=0, snpp=0, noaa20=0, noaa21=0),
        first_detection=dict(aqua="2002-07-05"), last_detection=dict(aqua="2026-11-14"),
        n_hotspots_total=0, years_covered=[2002, 2026]))


if __name__ == "__main__":
    main()
