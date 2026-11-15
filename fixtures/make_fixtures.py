"""Generate SYNTHETIC fixtures in the shapes defined in contracts/README.md.

Made-up numbers, for building the UI before real data exists. Never shown in the demo.
Deterministic (seeded): re-running gives identical files.

    python fixtures/make_fixtures.py
"""
import json
import math
import random
import sys
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


def write(path, doc, compact=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    fmt = dict(separators=(",", ":")) if compact else dict(indent=1)
    path.write_text(json.dumps(doc, ensure_ascii=False, **fmt), encoding="utf-8")
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
        if r["ym"] == "2026-11":  # the current month: only its first days are observed
            r["flags"].append("partial_month")
        if r["ym"] >= "2026-12":  # upcoming months: dashed in the UI, no observed value yet
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
    calendars = {}
    for n, (rid, _, _, _, size) in enumerate(REGIONS):
        calendars[rid] = calendar(rid, size, 42 + n)
        write(OUT / "calendar" / f"{rid}.json", calendars[rid])
    raw, harm = hex_year()
    write(OUT / "hex_year" / "raw.json", raw)
    write(OUT / "hex_year" / "harm.json", harm)
    write(OUT / "pipeline_stats.json", pipeline_stats(calendars["mongolia"]))
    write(OUT / "validation.json", validation())
    world()


def validation():
    """Made-up test results in the validation.json shape (PLAN D10). Test ids from contracts/README.md."""
    rnd = random.Random(11)
    per_year = [dict(year=y, wape=round(rnd.uniform(0.08, 0.22), 3)) for y in range(2012, 2022)]
    tests = [
        dict(id="aqua_loyo", name_en="Aqua rebuilt from S-NPP, leave-one-year-out", metric="WAPE",
             value=round(sum(p["wape"] for p in per_year) / len(per_year), 3), baseline_value=0.231,
             per_year=per_year, note=""),
        dict(id="aqua_forward", name_en="Calibrate 2012-2018, test 2019-2021", metric="WAPE",
             value=0.172, baseline_value=0.244, per_year=[], note=""),
        dict(id="r2_loyo", name_en="S-NPP rebuilt from NOAA-20, leave-one-year-out", metric="WAPE",
             value=0.064, baseline_value=None, per_year=[], note=""),
        dict(id="year_rank_spearman", name_en="Rank of yearly totals, Spearman", metric="spearman",
             value=0.97, baseline_value=None, per_year=[], note=""),
    ]
    return dict(schema_version=SCHEMA, synthetic=True, tests=tests,
                limitations=["SYNTHETIC: made-up test results for building the site."])


# Made-up last days: S-NPP's ends 12 days before the others, like the real FIRMS stop (PLAN §1).
FAKE_LAST_DAY = dict(terra="2026-11-11", aqua="2026-11-14", snpp="2026-11-02", noaa20="2026-11-13", noaa21="2026-11-14")


def pipeline_stats(cal):
    """Rows per platform = the calendar's raw sum, so the home card and charts agree (spec §7.1)."""
    rows, first = {}, {}
    for p in ("terra", "aqua", "snpp", "noaa20", "noaa21"):
        months = [m for m in cal["months"] if m["raw"][p] is not None]
        rows[p] = sum(m["raw"][p] for m in months)
        first[p] = months[0]["ym"] + "-05"
    return dict(schema_version=SCHEMA, synthetic=True, rows_by_platform=rows,
                first_detection=first, last_detection=dict(FAKE_LAST_DAY),
                n_hotspots_total=sum(rows.values()), years_covered=[2002, 2026])


# World map (#33). Bbox-ууд нь Natural Earth 110m-ээс wm.continent_bboxes-ийн гаргасан утга (1 оронтой).
# Europe: NE-д Орос (Чукотк) ба Франц (Франц Гвиана) Europe-д ордог тул өргөн, 180°-ыг дамнана.
# Fixture нь NE файлгүйгээр ажиллахын тулд энд хуулсан.
WORLD_BBOXES = {
    "africa": [-17.6, -34.8, 51.1, 37.4], "asia": [26.0, -10.4, 145.5, 55.4],
    "europe": [-54.5, 2.1, 190.1, 81.3], "north_america": [-171.8, 7.2, -12.2, 83.6],
    "south_america": [-81.4, -55.6, -34.7, 12.4], "oceania": [113.3, -46.6, 180.2, -2.5],
}


def world():
    """world/index.json + world/points_{тив}.json + world/cells_{тив}.json: etl/world_map.py-ийн ижил функцээр, зохиомол цэгүүдтэй."""
    sys.path.insert(0, str(OUT.parent / "etl"))
    import pandas as pd
    import world_map as wm

    rnd = random.Random(33)
    rows = []
    for cid, (w, s, e, n) in WORLD_BBOXES.items():
        # хэдэн "гал"-ын бөөгнөрөл. Африкт олон: r_day/r_night fallback-гүй тив fixture-т байх (#35).
        for _ in range(14 if cid == "africa" else rnd.randint(3, 6)):
            clon, clat = rnd.uniform(w, e), rnd.uniform(s, n)
            # #37: бөөгнөрөл бүр нэг огноо, нэг цагийн орчим (±90 мин), ингэснээр 4 match class бүгд гарна
            cdate, cmin = wm.period_dates(wm.PERIOD)[rnd.randrange(10)], rnd.randrange(120, 1320)
            for _ in range(rnd.randint(20, 60)):
                platform = rnd.choices(wm.PLATFORMS, weights=[1, 2, 0, 4, 4])[0]  # S-NPP 11-02-нд зогссон
                day = rnd.random() < 0.6
                lon = clon + rnd.gauss(0, 0.8)
                t = cmin + int(rnd.gauss(0, 90)) if rnd.random() < 0.7 else rnd.randrange(1440)
                t = max(0, min(1439, t))
                hhmm = lambda m: m // 60 * 100 + m % 60  # noqa: E731  өдрийн минут → FIRMS acq_time
                modis = platform in ("terra", "aqua")
                row = dict(
                    continent=cid, platform=platform,
                    lon=(lon + 180) % 360 - 180, lat=max(s, min(n, clat + rnd.gauss(0, 0.6))),
                    frp=round(rnd.lognormvariate(1.5, 1.0), 2), conf=rnd.choice(wm.CONF_LEVELS),
                    date=cdate, hhmm=hhmm(t), daynight="D" if day else "N",
                    scan=round(rnd.uniform(1.0, 2.0), 1) if modis else 0.4,
                    track=round(rnd.uniform(1.0, 1.4), 1) if modis else 0.4)
                rows.append(row)
                if platform == "aqua" and rnd.random() < 0.5:  # ижил гал NOAA-20 дээр (R_match дотор)
                    rows.append(dict(row, platform="noaa20", lon=round(row["lon"] + 0.003, 3),
                                     hhmm=hhmm(max(0, t - 20)), scan=0.4, track=0.4))
    pts = pd.DataFrame(rows)
    pts = pts.assign(match_class=wm.match_classes(pts))
    dropped = dict(antarctica=12, seven_seas=7, no_continent=3)
    units = wm.fire_units(pts)
    ratios = wm.continent_ratios(pts, units)
    cells, match = wm.continent_cells_and_match(pts, units, ratios, wm.PERIOD, synthetic=True)
    index = wm.index_doc(pts, dropped, WORLD_BBOXES, wm.PERIOD,
                         ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"], synthetic=True,
                         ratios=ratios, match=match)
    for c in index["continents"]:
        write(OUT / "world" / c["points_file"],
              wm.points_doc(pts[pts["continent"] == c["id"]], c["id"], wm.PERIOD, synthetic=True), compact=True)
        write(OUT / "world" / c["cells_file"], cells[c["id"]], compact=True)
    write(OUT / "world" / "index.json", index, compact=True)  # бодит файлууд шиг авсаархан


if __name__ == "__main__":
    main()
