"""Export the contract JSON the app reads (contracts/README.md) from REAL pipeline output.

Input : etl/data/processed/hotspots_clean.parquet   (clean_hotspots.py)
        etl/data/raw/mongolia_aimags.geojson         (get_boundaries.py)
Output: public/data/pipeline_stats.json
        public/data/regions.json
        public/data/calendar/{region_id}.json        (mongolia + 22 aimags/capital)
        public/data/hex_year/raw.json

Every value comes straight from the two input files, or from a PLAN date rule (D3 chain, D4 start).
What the real data cannot give yet is null + a flag (contract rule 4), never a guess:
  - calendar `harmonized` and `baseline`: need D7 ratios on D9 fire units, not written yet
    -> null, flag "not_harmonized". (harmonize_v0 is 0.05 deg daytime cell-days, a different unit.)
  - regions `name_mn`: not in the geojson -> null (the app falls back to name_en).
Not written at all (no method code yet): ratios.json, validation.json, hex_year/harm.json.
"""
import json
import unicodedata
import warnings
from pathlib import Path

import geopandas as gpd
import h3
import pandas as pd

HERE = Path(__file__).resolve().parent
HOTSPOTS = HERE / "data" / "processed" / "hotspots_clean.parquet"
AIMAGS = HERE / "data" / "raw" / "mongolia_aimags.geojson"
OUT = HERE.parent / "public" / "data"

SCHEMA = "0.1"
PLATFORM_KEY = {"MODIS_TERRA": "terra", "MODIS_AQUA": "aqua", "VIIRS_SNPP": "snpp",
                "VIIRS_NOAA20": "noaa20", "VIIRS_NOAA21": "noaa21"}
PLATFORMS = ["terra", "aqua", "snpp", "noaa20", "noaa21"]
HEX_PLATFORMS = ["terra", "aqua", "snpp", "noaa20"]   # contract hex_year/raw.json keys
CALENDAR_START = "2002-07"                            # PLAN D4
REFERENCE_YEARS = [2003, 2025]                        # PLAN D11 (full years only)
HEX_YEARS = list(range(2003, 2026))                   # PLAN D12 scrubber
HEX_RES = 5
NEAREST_MAX_DEG = 0.1                                 # border slivers of the simplified aimag polygons
# PLAN D3 chain, local dates: Aqua to 2012-01-19, S-NPP 2012-01-20 to 2026-11-01, NOAA-20 from 2026-11-02.
CHAIN = [("aqua", "2002-07-01"), ("snpp", "2012-01-20"), ("noaa20", "2026-11-02")]
NOAA20_DERIVED_FROM = "2026-11-02"


def slug(name):
    """'Bayan-Ölgii' -> 'bayan-olgii'."""
    ascii_ = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return "-".join(ascii_.lower().replace("_", " ").split())


def load_hotspots(path=HOTSPOTS):
    df = pd.read_parquet(path, columns=["platform", "latitude", "longitude", "date_local", "daynight"])
    unknown = set(df["platform"]) - set(PLATFORM_KEY)
    if unknown:
        raise SystemExit(f"Unknown platform(s) in {path}: {sorted(unknown)}")
    df["platform"] = df["platform"].map(PLATFORM_KEY)
    df["date_local"] = pd.to_datetime(df["date_local"])
    return df


def load_aimags(path=AIMAGS):
    g = gpd.read_file(path)[["shapeName", "shapeISO", "geometry"]]
    g["region_id"] = g["shapeName"].map(slug)
    if g["region_id"].duplicated().any():
        raise SystemExit("Two aimags give the same region_id")
    return g


def assign_regions(df, aimags, max_deg=NEAREST_MAX_DEG):
    """region_id per hotspot: inside a polygon, else the nearest polygon within max_deg, else None.
    Returns (Series aligned to df.index, counts dict)."""
    pts = gpd.GeoDataFrame(index=df.index, geometry=gpd.points_from_xy(df["longitude"], df["latitude"]),
                           crs="EPSG:4326")
    poly = aimags[["region_id", "geometry"]].to_crs("EPSG:4326")
    inside = gpd.sjoin(pts, poly, how="left", predicate="within")
    inside = inside[~inside.index.duplicated(keep="first")]["region_id"]
    out = inside.reindex(df.index)
    miss = out.isna()
    n_inside = int((~miss).sum())
    if miss.any():
        with warnings.catch_warnings():   # distance in degrees on purpose (max_deg is in degrees)
            warnings.simplefilter("ignore", UserWarning)
            near = gpd.sjoin_nearest(pts[miss], poly, how="left", max_distance=max_deg)
        near = near[~near.index.duplicated(keep="first")]["region_id"]
        out.loc[miss] = near.reindex(out.index[miss])
    n_unassigned = int(out.isna().sum())
    counts = {"inside": n_inside, "nearest_within_deg": int(len(df) - n_inside - n_unassigned),
              "unassigned": n_unassigned, "max_deg": max_deg}
    return out, counts


def pipeline_stats(df, assignment=None):
    by = df.groupby("platform")["date_local"]
    years = df["date_local"].dt.year
    doc = {
        "schema_version": SCHEMA, "synthetic": False,
        "rows_by_platform": {p: int((df["platform"] == p).sum()) for p in PLATFORMS},
        "first_detection": {p: by.min()[p].strftime("%Y-%m-%d") for p in PLATFORMS if p in by.groups},
        "last_detection": {p: by.max()[p].strftime("%Y-%m-%d") for p in PLATFORMS if p in by.groups},
        "n_hotspots_total": int(len(df)),
        "years_covered": [int(years.min()), int(years.max())],
    }
    if assignment is not None:
        doc["aimag_assignment"] = assignment   # additive: how hotspots were put into aimags
    return doc


def regions(aimags):
    rows = [{"region_id": "mongolia", "name_en": "Mongolia", "name_mn": None, "kind": "country"}]
    for _, a in aimags.sort_values("shapeName").iterrows():
        kind = "capital" if a["region_id"] == "ulaanbaatar" else "aimag"
        rows.append({"region_id": a["region_id"], "name_en": a["shapeName"], "name_mn": None, "kind": kind,
                     "iso": a["shapeISO"]})   # iso: additive, from the geojson
    return {"schema_version": SCHEMA, "synthetic": False, "regions": rows}


def chain_platform(ym):
    """D3 platform covering most days of the month (local dates)."""
    p = pd.Period(ym, "M")
    days = pd.date_range(p.start_time, p.end_time.normalize(), freq="D")
    starts = [(name, pd.Timestamp(d)) for name, d in CHAIN]
    def on(day):
        cur = starts[0][0]
        for name, s in starts:
            if day >= s:
                cur = name
        return cur
    owners = pd.Series([on(d) for d in days]).value_counts()
    return owners.index[0], len(owners) > 1


def month_range(last_ym):
    return [str(p) for p in pd.period_range(CALENDAR_START, last_ym, freq="M")]


def calendar(df, region_id, months, data_months, last_date):
    """One calendar file. df = this region's hotspots. data_months[p] = (first_ym, last_ym) nationally:
    outside that range the platform had no data -> null; inside, no hotspot -> 0."""
    ym = df["date_local"].dt.to_period("M").astype(str)
    counts = df.groupby([ym, df["platform"]]).size()
    last_year = last_date.year
    out = []
    for m in months:
        raw = {}
        for p in PLATFORMS:
            first, last = data_months.get(p, (None, None))
            raw[p] = int(counts.get((m, p), 0)) if first and first <= m <= last else None
        cp, switch = chain_platform(m)
        flags = []
        if int(m[:4]) in (int(CALENDAR_START[:4]), last_year):
            flags.append("partial_year")
        if switch:
            flags.append("chain_switch")
        if pd.Period(m, "M").end_time >= pd.Timestamp(NOAA20_DERIVED_FROM) and cp == "noaa20":
            flags.append("noaa20_derived")
        if m == last_date.strftime("%Y-%m") and last_date < pd.Period(m, "M").end_time.normalize():
            flags.append("partial_month")
        flags.append("not_harmonized")
        out.append({"ym": m, "harmonized": None, "chain_platform": cp, "raw": raw,
                    "is_forecast": False, "flags": flags,
                    "baseline": {"median": None, "p25": None, "p75": None}})
    return {"schema_version": SCHEMA, "synthetic": False, "region_id": region_id,
            "unit": "aqua_equivalent_hotspots", "reference_years": REFERENCE_YEARS, "months": out}


def hex_year_raw(df, res=HEX_RES, years=HEX_YEARS):
    """Raw pixels per H3 cell per local year. A year before the platform's first year in the data
    is null (no data yet); after that, a cell with no hotspot is 0."""
    d = df[df["platform"].isin(HEX_PLATFORMS)].copy()
    d["year"] = d["date_local"].dt.year
    first_year = d.groupby("platform")["year"].min().to_dict()
    d = d[d["year"].isin(years)]
    d["cell"] = [h3.latlng_to_cell(la, lo, res) for la, lo in zip(d["latitude"], d["longitude"])]
    counts = d.groupby(["cell", "platform", "year"]).size()
    cells = []
    for cell in sorted(d["cell"].unique()):
        lat, lon = h3.cell_to_latlng(cell)
        c = counts.loc[cell]
        per = {}
        for p in HEX_PLATFORMS:
            fy = first_year.get(p)
            per[p] = [None if fy is None or y < fy else int(c.get((p, y), 0)) for y in years]
        cells.append({"id": cell, "lat": round(lat, 3), "lon": round(lon, 3), "counts": per})
    return {"schema_version": SCHEMA, "synthetic": False, "resolution": res, "kind": "raw_pixels",
            "years": years, "cells": cells}


def write(path, doc, compact=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    fmt = dict(separators=(",", ":")) if compact else dict(indent=1)
    path.write_text(json.dumps(doc, ensure_ascii=False, **fmt) + "\n", encoding="utf-8")
    print(f"wrote {path.relative_to(OUT.parent.parent)} ({path.stat().st_size:,} bytes)")


def main(out=OUT):
    df = load_hotspots()
    aimags = load_aimags()
    df["region_id"], assignment = assign_regions(df, aimags)
    print(f"Hotspots: {len(df):,} | aimag assignment: {assignment}")

    write(out / "pipeline_stats.json", pipeline_stats(df, assignment))
    write(out / "regions.json", regions(aimags))

    last_date = df["date_local"].max()
    ym = df["date_local"].dt.to_period("M").astype(str)
    data_months = {p: (ym[df["platform"] == p].min(), ym[df["platform"] == p].max()) for p in PLATFORMS}
    months = month_range(last_date.strftime("%Y-%m"))
    write(out / "calendar" / "mongolia.json", calendar(df, "mongolia", months, data_months, last_date))
    for rid in sorted(aimags["region_id"]):
        write(out / "calendar" / f"{rid}.json",
              calendar(df[df["region_id"] == rid], rid, months, data_months, last_date))

    write(out / "hex_year" / "raw.json", hex_year_raw(df), compact=True)


if __name__ == "__main__":
    main()
