"""
World map (#31) — дэлхийн NRT hotspot-ийн цэвэр функцууд. Скрипт: build_world_map.py.

Энд зөвхөн оролт → гаралт функцууд байна (файл уншихгүй, бичихгүй), тиймээс pytest-ээр шууд шалгана.

Шийдвэрүүд (docs/research/world_map.md):
- Огноо, цагийг UTC-ээр хадгална: дэлхийд нэг орон нутгийн цаг байхгүй.
- NRT-д `type` багана байхгүй тул байнгын дулааны эх үүсвэрийг (үйлдвэр, уурхай) хасахгүй.
"""
import warnings
from collections import namedtuple
from datetime import date, timedelta

import geopandas as gpd
import h3
import numpy as np
import pandas as pd

# FIRMS source → platform. MODIS-ийг `satellite` баганаас тодорхойлно.
VIIRS_SOURCES = {"VIIRS_SNPP_NRT": "snpp", "VIIRS_NOAA20_NRT": "noaa20", "VIIRS_NOAA21_NRT": "noaa21"}
MODIS_SOURCE = "MODIS_NRT"
MODIS_SATELLITES = {"T": "terra", "TERRA": "terra", "A": "aqua", "AQUA": "aqua"}

# Файлд код (массивын индекс) болгон бичигдэх утгууд. Дарааллыг өөрчлөхгүй (contracts: additive-only).
PLATFORMS = ["terra", "aqua", "snpp", "noaa20", "noaa21"]
CONF_LEVELS = ["low", "nominal", "high"]
MATCH_CLASSES = ["both", "viirs_only", "modis_only", "not_comparable"]

# Natural Earth-ийн CONTINENT → апп-ын тив. Antarctica, "Seven seas (open ocean)" хасагдана.
Continent = namedtuple("Continent", "id ne_name name_en name_mn")
CONTINENTS = [
    Continent("africa", "Africa", "Africa", "Африк"),
    Continent("asia", "Asia", "Asia", "Ази"),
    Continent("europe", "Europe", "Europe", "Европ"),
    Continent("north_america", "North America", "North America", "Хойд Америк"),
    Continent("south_america", "South America", "South America", "Өмнөд Америк"),
    Continent("oceania", "Oceania", "Oceania", "Далайн орон"),
]
NE_TO_ID = {c.ne_name: c.id for c in CONTINENTS}
NEAREST_MAX_DEG = 1.0
SCHEMA = "0.1"
PERIOD = ("2026-11-05", "2026-11-14")  # UTC, fetch_world_nrt.py-ийн START..END

# #35: Aqua-equivalent (D2). VIIRS тал = NOAA-20 fire unit (D9), Aqua тал = пиксел. Terra, NOAA-21 оролцохгүй (D3).
FIRE_UNIT_RES = 8
CELL_RES = 5
OVERPASS_GAP_MIN = 10  # ижил нүдэнд дараалсан цагийн зай > 10 мин бол шинэ overpass
MIN_N = 30  # тив, D/N-д аль нэг тал < 30 бол дэлхийн харьцаа

CLEAN_COLUMNS = ["platform", "lon", "lat", "frp", "conf", "date", "hhmm", "daynight",
                 "brightness", "bright_t31", "scan", "track"]


def conf_level(c):
    """clean_hotspots.py-тэй ижил дүрэм: MODIS < 30 / < 80 / бусад, VIIRS l / n / h."""
    if isinstance(c, str):
        return {"l": "low", "n": "nominal", "h": "high"}.get(c.strip().lower(), "unknown")
    c = float(c)
    return "low" if c < 30 else ("nominal" if c < 80 else "high")


def clean_firms(df, source):
    """FIRMS Area API-ийн нэг CSV-г нэгдсэн хэлбэрт оруулна (CLEAN_COLUMNS)."""
    # VIIRS-ийн хоёр хувилбар: bright_ti4/ti5 эсвэл brightness/bright_t31.
    df = df.rename(columns={"bright_ti4": "brightness", "bright_ti5": "bright_t31"})
    if len(df) == 0:
        return pd.DataFrame(columns=CLEAN_COLUMNS)

    out = pd.DataFrame(index=df.index)
    if source in VIIRS_SOURCES:
        out["platform"] = VIIRS_SOURCES[source]
    elif source == MODIS_SOURCE:
        sat = df["satellite"].astype(str).str.strip().str.upper()
        out["platform"] = sat.map(MODIS_SATELLITES)
        if out["platform"].isna().any():
            bad = sorted(set(df.loc[out["platform"].isna(), "satellite"].astype(str)))
            raise ValueError(f"{source}: үл мэдэгдэх satellite утга {bad}")
    else:
        raise ValueError(f"Үл мэдэгдэх source: {source}")

    out["lon"] = df["longitude"].astype(float)
    out["lat"] = df["latitude"].astype(float)
    out["frp"] = df["frp"].astype(float)
    out["conf"] = df["confidence"].apply(conf_level)
    if (out["conf"] == "unknown").any():
        bad = sorted(set(df.loc[out["conf"] == "unknown", "confidence"].astype(str)))
        raise ValueError(f"{source}: үл мэдэгдэх confidence утга {bad}")
    # UTC огноо + цаг. acq_time нь 342 (int) эсвэл "03:42" (текст) байж болно.
    out["date"] = df["acq_date"].astype(str).str.strip()
    out["hhmm"] = df["acq_time"].astype(str).str.replace(":", "", regex=False).str.strip().astype(int)
    out["daynight"] = df["daynight"].astype(str).str.strip().str.upper()
    for col in ("brightness", "bright_t31", "scan", "track"):
        out[col] = df[col].astype(float)
    return out[CLEAN_COLUMNS].reset_index(drop=True)


def assign_continents(points, countries):
    """Цэг бүрд тив онооно: point-in-polygon, таарахгүй бол ≤ 1° хамгийн ойрын улс.

    countries: Natural Earth-ийн `CONTINENT` баганатай GeoDataFrame (EPSG:4326).
    Буцаана: (`continent` баганатай үлдсэн цэгүүд, хасагдсан тоо {antarctica, seven_seas, no_continent}).
    """
    pts = points.reset_index(drop=True)
    geo = gpd.GeoDataFrame(geometry=gpd.points_from_xy(pts["lon"], pts["lat"]), crs="EPSG:4326")
    countries = countries[["CONTINENT", "geometry"]].to_crs("EPSG:4326")

    inside = gpd.sjoin(geo, countries, how="left", predicate="within")
    ne = inside[~inside.index.duplicated(keep="first")]["CONTINENT"]

    miss = ne.isna()
    if miss.any():
        # Эргийн ойролцоох цэг (110m хил бүдүүн). Градусаар хэмжинэ: тивийн түвшинд хангалттай.
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)  # geographic CRS дээрх зайн анхааруулга
            near = gpd.sjoin_nearest(geo[miss], countries, how="left", max_distance=NEAREST_MAX_DEG)
        near = near[~near.index.duplicated(keep="first")]["CONTINENT"]
        ne = ne.copy()
        ne.loc[near.index] = near

    continent = ne.map(NE_TO_ID)
    dropped = {
        "antarctica": int((ne == "Antarctica").sum()),
        "seven_seas": int(ne.fillna("").str.startswith("Seven seas").sum()),
        "no_continent": 0,
    }
    dropped["no_continent"] = int(continent.isna().sum()) - dropped["antarctica"] - dropped["seven_seas"]
    kept = pts[continent.notna()].assign(continent=continent[continent.notna()])
    return kept.reset_index(drop=True), dropped


def narrowest_lon_interval(intervals):
    """[(west, east), ...] (180°-ыг дамнахгүй хэсгүүд) бүгдийг хамрах хамгийн нарийн уртрагийн интервал.

    Тойрог дээрх хамгийн том хоосон зайг хасна. 180°-ыг дамнавал east > 180 болно
    (UI цэгүүдийг +360°-аар шилжүүлж зурна).
    """
    merged = []
    for w, e in sorted(intervals):
        if merged and w <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([w, e])
    # Тойрог дамнасан зай (сүүлийн → эхний + 360). Тэнцүү бол 180°-ыг дамнахгүй хувилбарыг авна.
    best_gap, west, east = merged[0][0] + 360 - merged[-1][1], merged[0][0], merged[-1][1]
    for (_, e1), (w2, _) in zip(merged, merged[1:]):
        if w2 - e1 > best_gap:
            best_gap, west, east = w2 - e1, w2, e1 + 360
    return west, east


def continent_bboxes(countries):
    """Тив бүрийн [west, south, east, north]-ийг хилээс тооцно (Antarctica, Seven seas-гүй)."""
    out = {}
    parts = countries[["CONTINENT", "geometry"]].explode(index_parts=False)
    for c in CONTINENTS:
        b = parts[parts["CONTINENT"] == c.ne_name].geometry.bounds
        if len(b) == 0:
            continue
        west, east = narrowest_lon_interval(zip(b["minx"], b["maxx"]))
        out[c.id] = [round(float(west), 3), round(float(b["miny"].min()), 3),
                    round(float(east), 3), round(float(b["maxy"].max()), 3)]
    return out


def period_dates(period):
    start, end = date.fromisoformat(period[0]), date.fromisoformat(period[1])
    return [(start + timedelta(days=i)).isoformat() for i in range((end - start).days + 1)]


def points_doc(points, continent_id, period, synthetic=False):
    """Нэг тивийн `points_{тив}.json`: багануудад хуваасан авсаархан массивууд (contracts/README.md)."""
    dates = period_dates(period)
    day = {d: i for i, d in enumerate(dates)}
    bad = sorted(set(points["date"]) - set(dates))
    if bad:
        raise ValueError(f"{continent_id}: хугацаанаас гадуурх огноо {bad[:5]}")
    p = points.sort_values(["date", "hhmm", "platform", "lon", "lat"], kind="stable")
    cols = {
        "lon": p["lon"].round(3).tolist(),
        "lat": p["lat"].round(3).tolist(),
        "platform": p["platform"].map(PLATFORMS.index).tolist(),
        "frp": p["frp"].round(2).tolist(),
        "conf": p["conf"].map(CONF_LEVELS.index).tolist(),
        "date": p["date"].map(day).tolist(),
        "hhmm": p["hhmm"].astype(int).tolist(),
        "daynight": p["daynight"].tolist(),
        "match_class": [None] * len(p),  # #37 (match) хүртэл null
    }
    return dict(schema_version=SCHEMA, synthetic=synthetic, continent=continent_id, n=len(p),
                codes=dict(platform=PLATFORMS, conf=CONF_LEVELS, match_class=MATCH_CLASSES),
                dates=dates, columns=cols)


def index_doc(points, dropped, bboxes, period, sources, synthetic=False, ratios=None):
    """`index.json`: хугацаа, эх сурвалж, хасагдсан тоо, тивүүдийн жагсаалт.

    ratios (continent_ratios()-ийн гаралт) өгвөл тив бүрт r_day, r_night, n, flags, fallback, cells_file,
    дээд түвшинд world_ratio, harmonization нэмнэ (#35, additive).
    """
    continents = []
    for c in CONTINENTS:
        sub = points[points["continent"] == c.id]
        if c.id not in bboxes and len(sub) == 0:
            continue
        by_platform = sub["platform"].value_counts()
        continents.append(dict(
            id=c.id, name_en=c.name_en, name_mn=c.name_mn, bbox=bboxes[c.id],
            points_file=f"points_{c.id}.json", n_points=int(len(sub)),
            n_by_platform={p: int(by_platform.get(p, 0)) for p in PLATFORMS}))
        if ratios is not None:
            cr = ratios["continents"][c.id]
            continents[-1].update(r_day=round_r(cr["r_day"]), r_night=round_r(cr["r_night"]), n=cr["n"],
                                  fallback=cr["fallback"], flags=list(cr["flags"]), cells_file=f"cells_{c.id}.json")
    doc = dict(schema_version=SCHEMA, synthetic=synthetic,
               period=dict(start=period[0], end=period[1]), time_zone="UTC",
               sources=list(sources), dropped=dict(dropped), continents=continents)
    if ratios is not None:
        w = ratios["world"]
        doc["world_ratio"] = dict(D=round_r(w["D"]), N=round_r(w["N"]), n=w["n"])
        doc["harmonization"] = dict(fire_unit="h3_res8_x_overpass", overpass_gap_min=OVERPASS_GAP_MIN,
                                    min_n=MIN_N, cell_resolution=CELL_RES, noaa20_vs="aqua")
    return doc


def round_r(r):
    """Харьцааг файлд 4 оронтой бичнэ; null (тодорхойгүй) хэвээр."""
    return None if r is None else round(r, 4)


def minutes(hhmm):
    """FIRMS acq_time (342 = 03:42) → өдрийн эхнээс хойш минут (222)."""
    hhmm = pd.Series(hhmm).astype(int)
    return (hhmm // 100) * 60 + hhmm % 100


def fire_units(points):
    """NOAA-20 hotspot-уудыг fire unit болгоно (D9): H3 res 8 нүд × overpass.

    Overpass: ижил platform (зөвхөн NOAA-20), ижил тив, ижил UTC огноо, ижил res 8 нүдэн дэх цагуудыг эрэмбэлээд дараалсан хоёрын
    зай > OVERPASS_GAP_MIN минут бол шинэ overpass (яг 10 мин = ижил overpass).
    Буцаана: unit бүр нэг мөр — continent, date, h8, daynight (unit-ийн эхний hotspot-оос), lat, lon (эхний hotspot), n_pixels.
    """
    v = points[points["platform"] == "noaa20"].copy()
    cols = ["continent", "date", "h8", "daynight", "lat", "lon", "n_pixels"]
    if len(v) == 0:
        return pd.DataFrame(columns=cols)
    v["h8"] = [h3.latlng_to_cell(la, lo, FIRE_UNIT_RES) for la, lo in zip(v["lat"], v["lon"])]
    v["min"] = minutes(v["hhmm"]).to_numpy()
    key = ["continent", "date", "h8"]
    v = v.sort_values(key + ["min"], kind="stable")
    gap = v.groupby(key)["min"].diff()  # бүлгийн эхний цаг → NaN
    v["unit"] = (gap.isna() | (gap > OVERPASS_GAP_MIN)).cumsum()
    g = v.groupby("unit", sort=True)
    out = g.first()[["continent", "date", "h8", "daynight", "lat", "lon"]]
    out["n_pixels"] = g.size()
    return out.reset_index(drop=True)[cols]


def continent_ratios(points, units, min_n=MIN_N):
    """Тив бүрийн Aqua/NOAA-20 харьцаа өдөр (D), шөнө (N) тусад нь: r = Σ Aqua пиксел / Σ NOAA-20 fire unit.

    Ratio of sums (жилийн дундаж биш, D7). Тив, D/N-д аль нэг тал < min_n бол тухайн D/N-ийн дэлхийн харьцаа
    (бүх тивийн нийлбэр) авч `flags`-д "ratio_fallback". Fire unit 0 бол харьцаа null (0 биш).
    """
    def counts(pts, us):
        return {dn: {"aqua": int(((pts["platform"] == "aqua") & (pts["daynight"] == dn)).sum()),
                     "noaa20_units": int((us["daynight"] == dn).sum()) if len(us) else 0}
                for dn in ("D", "N")}

    def ratio(n):
        return n["aqua"] / n["noaa20_units"] if n["noaa20_units"] else None

    world_n = counts(points, units)
    world = {dn: ratio(world_n[dn]) for dn in ("D", "N")}
    out = {}
    for c in CONTINENTS:
        n = counts(points[points["continent"] == c.id],
                   units[units["continent"] == c.id] if len(units) else units)
        fallback = {dn: min(n[dn].values()) < min_n for dn in ("D", "N")}
        r = {dn: world[dn] if fallback[dn] else ratio(n[dn]) for dn in ("D", "N")}
        out[c.id] = dict(r_day=r["D"], r_night=r["N"], n=n, fallback=fallback,
                         flags=["ratio_fallback"] if any(fallback.values()) else [])
    return {"world": dict(world, n=world_n), "continents": out}


def cell_boundary(cell):
    """H3 нүдний оройнууд [[lon, lat], ...]. 180°-ыг дамнавал сөрөг уртрагт +360 (east > 180, bbox-той ижил)."""
    lonlat = [[lo, la] for la, lo in h3.cell_to_boundary(cell)]
    if max(v[0] for v in lonlat) - min(v[0] for v in lonlat) > 180:
        lonlat = [[lo + 360 if lo < 0 else lo, la] for lo, la in lonlat]
    return [[round(lo, 3), round(la, 3)] for lo, la in lonlat]


def cells_doc(points, units, ratios, continent_id, period, synthetic=False):
    """Нэг тивийн `cells_{тив}.json`: H3 res 5 нүд бүрт Aqua пиксел, NOAA-20 unit (D/N), viirs_harm.

    points: тухайн тивийн цэвэр hotspot-ууд; units: тэдгээрээс fire_units(); ratios: {"r_day", "r_night"}.
    viirs_harm = Σ unit_D × r_D + Σ unit_N × r_N (Aqua-equivalent, D2). Харьцаа null бол null.
    """
    r = {"D": round_r(ratios["r_day"]), "N": round_r(ratios["r_night"])}  # index.json-тэй ижил утга
    a = points[points["platform"] == "aqua"]
    aqua = pd.Series([h3.latlng_to_cell(la, lo, CELL_RES) for la, lo in zip(a["lat"], a["lon"])],
                     dtype=object).value_counts()
    u = pd.DataFrame({"cell": [h3.cell_to_parent(h, CELL_RES) for h in units["h8"]],
                      "daynight": list(units["daynight"])})
    by_dn = u.groupby(["cell", "daynight"]).size()
    out = []
    for cell in sorted(set(aqua.index) | set(u["cell"])):
        n = {dn: int(by_dn.get((cell, dn), 0)) for dn in ("D", "N")}
        harm = None if any(n[dn] and r[dn] is None for dn in n) else \
            round(sum(n[dn] * r[dn] for dn in n if n[dn]), 2)
        lat, lon = h3.cell_to_latlng(cell)
        out.append(dict(id=cell, lat=round(lat, 3), lon=round(lon, 3), boundary=cell_boundary(cell),
                        viirs_harm=harm, aqua=int(aqua.get(cell, 0)), noaa20_units=n, r=r))
    return dict(schema_version=SCHEMA, synthetic=synthetic, continent=continent_id, resolution=CELL_RES,
                unit="aqua_equivalent_hotspots", period=dict(start=period[0], end=period[1]),
                n=len(out), cells=out)
