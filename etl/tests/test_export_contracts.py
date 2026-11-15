"""export_contracts.py: real contract JSON in public/data/.

Three groups:
  1. method on tiny hand-made frames (always runs)
  2. the committed public/data/ files vs the fixture SHAPES (keys only, never fixture values)
  3. the committed files vs hotspots_clean.parquet (skipped when etl/data/ is not on this machine)
"""
import json
from pathlib import Path

import geopandas as gpd
import pandas as pd
import pytest
from shapely.geometry import box

import export_contracts as ec

ROOT = Path(__file__).resolve().parents[2]
REAL = ROOT / "public" / "data"
FIX = ROOT / "fixtures"
HAS_PARQUET = ec.HOTSPOTS.exists()

# Keys the real files may add on top of the fixture shape (contracts rule 1: additive only).
ADDITIVE = {"pipeline_stats.json": {"aimag_assignment"}, "region": {"iso"}}


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def hotspots(rows):
    df = pd.DataFrame(rows, columns=["platform", "latitude", "longitude", "date_local", "daynight"])
    df["date_local"] = pd.to_datetime(df["date_local"])
    return df


# ---------- 1. method ----------

@pytest.mark.parametrize("name, rid", [("Bayan-Ölgii", "bayan-olgii"), ("Töv", "tov"),
                                        ("Ulaanbaatar", "ulaanbaatar"), ("Govi-Altai", "govi-altai")])
def test_slug(name, rid):
    assert ec.slug(name) == rid


@pytest.mark.parametrize("ym, platform, switch", [
    ("2005-05", "aqua", False), ("2012-01", "aqua", True), ("2012-02", "snpp", False),
    ("2026-10", "snpp", False), ("2026-11", "noaa20", True)])
def test_chain_platform_follows_plan_d3_by_majority_of_days(ym, platform, switch):
    assert ec.chain_platform(ym) == (platform, switch)


def test_calendar_raw_is_null_outside_platform_data_and_zero_inside():
    df = hotspots([("aqua", 47, 105, "2002-07-05", "D"), ("aqua", 47, 105, "2002-09-01", "N"),
                   ("snpp", 47, 105, "2002-09-02", "D")])
    months = ["2002-07", "2002-08", "2002-09"]
    data_months = {"aqua": ("2002-07", "2002-09"), "snpp": ("2002-09", "2002-09")}
    doc = ec.calendar(df, "x", months, data_months, pd.Timestamp("2002-09-02"))
    raw = {m["ym"]: m["raw"] for m in doc["months"]}
    assert raw["2002-08"]["aqua"] == 0          # flying, nothing seen -> 0
    assert raw["2002-08"]["snpp"] is None       # no data yet -> null
    assert raw["2002-09"]["snpp"] == 1 and raw["2002-07"]["aqua"] == 1
    assert raw["2002-07"]["terra"] is None      # never in the data -> null
    last = doc["months"][-1]
    assert "partial_month" in last["flags"] and "partial_year" in last["flags"]
    assert all(m["harmonized"] is None and "not_harmonized" in m["flags"] for m in doc["months"])
    assert all(m["baseline"] == {"median": None, "p25": None, "p75": None} for m in doc["months"])


def test_hex_year_null_before_first_year_then_zero():
    df = hotspots([("snpp", 47.0, 105.0, "2012-03-01", "D"), ("aqua", 47.0, 105.0, "2003-05-01", "D"),
                   ("aqua", 47.0, 105.0, "2003-05-02", "D")])
    doc = ec.hex_year_raw(df, years=[2003, 2011, 2012, 2013])
    (cell,) = doc["cells"]
    assert cell["counts"]["aqua"] == [2, 0, 0, 0]
    assert cell["counts"]["snpp"] == [None, None, 1, 0]
    assert cell["counts"]["noaa20"] == [None] * 4 and cell["counts"]["terra"] == [None] * 4


def test_assign_regions_inside_nearest_and_unassigned():
    aimags = gpd.GeoDataFrame({"region_id": ["a", "b"]}, geometry=[box(0, 0, 1, 1), box(1, 0, 2, 1)],
                              crs="EPSG:4326")
    df = hotspots([("aqua", 0.5, 0.5, "2010-01-01", "D"),     # inside a
                   ("aqua", 0.5, 2.05, "2010-01-01", "D"),    # 0.05 deg east of b
                   ("aqua", 0.5, 3.0, "2010-01-01", "D")])    # 1 deg away
    ids, counts = ec.assign_regions(df, aimags, max_deg=0.1)
    assert ids.tolist()[:2] == ["a", "b"] and pd.isna(ids.iloc[2])
    assert counts == {"inside": 1, "nearest_within_deg": 1, "unassigned": 1, "max_deg": 0.1}


# ---------- 2. committed files vs fixture shapes ----------

def real_files():
    return sorted(REAL.rglob("*.json"))


@pytest.mark.parametrize("path", real_files(), ids=lambda p: str(p.relative_to(REAL)))
def test_real_files_are_not_synthetic(path):
    doc = load(path)
    assert doc["synthetic"] is False and isinstance(doc["schema_version"], str)


@pytest.mark.parametrize("name", ["pipeline_stats.json", "regions.json", "hex_year/raw.json",
                                  "calendar/mongolia.json"])
def test_top_level_keys_match_fixture(name):
    real, fix = load(REAL / name), load(FIX / name)
    assert set(fix) <= set(real)
    assert set(real) - set(fix) <= ADDITIVE.get(name, set())
    assert real["schema_version"] == fix["schema_version"]


def test_nested_keys_match_fixture():
    fr, rr = load(FIX / "regions.json")["regions"][0], load(REAL / "regions.json")["regions"]
    for r in rr:
        assert set(fr) <= set(r) and set(r) - set(fr) <= ADDITIVE["region"]
    fm = load(FIX / "calendar" / "mongolia.json")["months"][0]
    for path in (REAL / "calendar").glob("*.json"):
        for m in load(path)["months"]:
            assert set(m) == set(fm) and set(m["raw"]) == set(fm["raw"]) and set(m["baseline"]) == set(fm["baseline"])
    fh, rh = load(FIX / "hex_year" / "raw.json"), load(REAL / "hex_year" / "raw.json")
    assert set(rh["cells"][0]) == set(fh["cells"][0])
    assert set(rh["cells"][0]["counts"]) == set(fh["cells"][0]["counts"])
    assert rh["years"] == fh["years"] and rh["resolution"] == fh["resolution"]


def test_nulls_where_real_data_cannot_answer():
    for r in load(REAL / "regions.json")["regions"]:
        assert r["name_mn"] is None
    for path in (REAL / "calendar").glob("*.json"):
        for m in load(path)["months"]:
            assert m["harmonized"] is None and set(m["baseline"].values()) == {None}
            assert "not_harmonized" in m["flags"] and m["is_forecast"] is False
    for absent in ["ratios.json", "validation.json", "hex_year/harm.json"]:
        assert not (REAL / absent).exists(), f"{absent} needs method code that does not exist yet"


def test_one_calendar_per_region_starting_2002_07():
    ids = [r["region_id"] for r in load(REAL / "regions.json")["regions"]]
    assert len(ids) == 23 and ids[0] == "mongolia"
    assert sorted(p.stem for p in (REAL / "calendar").glob("*.json")) == sorted(ids)
    for rid in ids:
        yms = [m["ym"] for m in load(REAL / "calendar" / f"{rid}.json")["months"]]
        assert yms[0] == "2002-07" and yms == sorted(set(yms))


# ---------- 3. committed files vs the parquet ----------

needs_parquet = pytest.mark.skipif(not HAS_PARQUET, reason="etl/data/processed/hotspots_clean.parquet not here")


@pytest.fixture(scope="module")
def df():
    return ec.load_hotspots()


@needs_parquet
def test_pipeline_stats_match_parquet(df):
    s = load(REAL / "pipeline_stats.json")
    assert s["n_hotspots_total"] == len(df) == 359_591          # docs/research/data_audit.md
    assert s["rows_by_platform"] == {p: int((df["platform"] == p).sum()) for p in ec.PLATFORMS}
    assert s["rows_by_platform"] == {"terra": 53_194, "aqua": 47_857, "snpp": 178_434,
                                     "noaa20": 50_796, "noaa21": 29_310}
    a = s["aimag_assignment"]
    assert a["inside"] + a["nearest_within_deg"] + a["unassigned"] == len(df)


@needs_parquet
def test_calendar_totals_match_parquet(df):
    in_cal = df[df["date_local"] >= "2002-07-01"]
    want = {p: int((in_cal["platform"] == p).sum()) for p in ec.PLATFORMS}
    def sums(path):
        out = dict.fromkeys(ec.PLATFORMS, 0)
        for m in load(path)["months"]:
            for p, v in m["raw"].items():
                out[p] += v or 0
        return out
    assert sums(REAL / "calendar" / "mongolia.json") == want
    unassigned = load(REAL / "pipeline_stats.json")["aimag_assignment"]["unassigned"]
    aimag = dict.fromkeys(ec.PLATFORMS, 0)
    for path in (REAL / "calendar").glob("*.json"):
        if path.stem != "mongolia":
            for p, v in sums(path).items():
                aimag[p] += v
    assert sum(want.values()) - sum(aimag.values()) == unassigned


@needs_parquet
def test_hex_totals_match_parquet(df):
    h = load(REAL / "hex_year" / "raw.json")
    years = df["date_local"].dt.year
    for p in ec.HEX_PLATFORMS:
        got = sum(v or 0 for c in h["cells"] for v in c["counts"][p])
        assert got == int(((df["platform"] == p) & years.between(2003, 2025)).sum()), p
