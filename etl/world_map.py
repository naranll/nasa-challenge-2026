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


def index_doc(points, dropped, bboxes, period, sources, synthetic=False):
    """`index.json`: хугацаа, эх сурвалж, хасагдсан тоо, тивүүдийн жагсаалт."""
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
    return dict(schema_version=SCHEMA, synthetic=synthetic,
                period=dict(start=period[0], end=period[1]), time_zone="UTC",
                sources=list(sources), dropped=dict(dropped), continents=continents)
