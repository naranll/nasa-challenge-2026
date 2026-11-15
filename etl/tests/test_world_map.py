"""World map 2/8 (#33): hotspot цэвэрлэх, тив оноох, points файл."""
import pandas as pd
import pytest

import world_map as wm


def viirs_rows(**over):
    row = dict(latitude=47.1234, longitude=106.98765, bright_ti4=330.1, scan=0.4, track=0.4,
               acq_date="2026-11-05", acq_time=342, satellite="N20", instrument="VIIRS",
               confidence="n", version="2.0NRT", bright_ti5=290.0, frp=5.25, daynight="N")
    row.update(over)
    return pd.DataFrame([row])


def test_viirs_ti4_and_brightness_column_variants_clean_the_same():
    a = wm.clean_firms(viirs_rows(), "VIIRS_NOAA20_NRT")
    b = wm.clean_firms(viirs_rows().rename(columns={"bright_ti4": "brightness", "bright_ti5": "bright_t31"}),
                       "VIIRS_NOAA20_NRT")
    assert list(a["brightness"]) == list(b["brightness"]) == [330.1]
    assert list(a["bright_t31"]) == list(b["bright_t31"]) == [290.0]


def test_viirs_platform_comes_from_source():
    assert wm.clean_firms(viirs_rows(), "VIIRS_NOAA20_NRT")["platform"].tolist() == ["noaa20"]
    assert wm.clean_firms(viirs_rows(), "VIIRS_NOAA21_NRT")["platform"].tolist() == ["noaa21"]
    assert wm.clean_firms(viirs_rows(), "VIIRS_SNPP_NRT")["platform"].tolist() == ["snpp"]


@pytest.mark.parametrize("sat, platform", [("Terra", "terra"), ("Aqua", "aqua"), ("T", "terra"), ("A", "aqua")])
def test_modis_platform_comes_from_satellite_column(sat, platform):
    df = viirs_rows(satellite=sat, confidence=55).rename(columns={"bright_ti4": "brightness", "bright_ti5": "bright_t31"})
    assert wm.clean_firms(df, "MODIS_NRT")["platform"].tolist() == [platform]


def test_confidence_uses_the_existing_cleaner_rules():
    modis = pd.concat([viirs_rows(satellite="A", confidence=c) for c in (0, 29, 30, 79, 80, 100)])
    assert wm.clean_firms(modis, "MODIS_NRT")["conf"].tolist() == \
        ["low", "low", "nominal", "nominal", "high", "high"]
    viirs = pd.concat([viirs_rows(confidence=c) for c in ("l", "n", "h")])
    assert wm.clean_firms(viirs, "VIIRS_NOAA20_NRT")["conf"].tolist() == ["low", "nominal", "high"]


def test_time_is_kept_in_utc_with_hhmm_from_int_or_text():
    df = pd.concat([viirs_rows(acq_time=342), viirs_rows(acq_time="23:59", acq_date="2026-11-14")])
    out = wm.clean_firms(df, "VIIRS_NOAA20_NRT")
    assert out["date"].tolist() == ["2026-11-05", "2026-11-14"]
    assert out["hhmm"].tolist() == [342, 2359]
    assert out["daynight"].tolist() == ["N", "N"]


def test_empty_snpp_file_cleans_to_empty_frame():
    empty = viirs_rows().iloc[0:0]
    out = wm.clean_firms(empty, "VIIRS_SNPP_NRT")
    assert len(out) == 0 and "platform" in out.columns


def square(w, s, e, n):
    from shapely.geometry import box
    return box(w, s, e, n)


@pytest.fixture
def countries():
    import geopandas as gpd
    return gpd.GeoDataFrame(
        {"CONTINENT": ["Africa", "Asia", "Antarctica", "Seven seas (open ocean)"]},
        geometry=[square(0, 0, 10, 10), square(20, 0, 30, 10), square(0, -80, 10, -70), square(50, 0, 60, 10)],
        crs="EPSG:4326")


def pts(*lonlat):
    return pd.DataFrame({"lon": [p[0] for p in lonlat], "lat": [p[1] for p in lonlat]})


def test_point_inside_a_country_gets_its_continent(countries):
    kept, dropped = wm.assign_continents(pts((5, 5), (25, 5)), countries)
    assert kept["continent"].tolist() == ["africa", "asia"]
    assert dropped == {"antarctica": 0, "seven_seas": 0, "no_continent": 0}


def test_point_off_the_coast_within_1_degree_gets_the_nearest_country(countries):
    kept, _ = wm.assign_continents(pts((10.5, 5), (19.2, 5)), countries)
    assert kept["continent"].tolist() == ["africa", "asia"]


def test_antarctica_open_sea_and_far_points_are_counted_and_dropped(countries):
    kept, dropped = wm.assign_continents(
        pts((5, 5), (5, -75), (5, -69.5), (55, 5), (15, 5), (40, 40)), countries)
    assert kept["continent"].tolist() == ["africa"]
    assert dropped == {"antarctica": 2, "seven_seas": 1, "no_continent": 2}


def test_kept_points_keep_their_other_columns(countries):
    df = pts((5, 5), (55, 5)).assign(frp=[1.5, 2.5])
    kept, _ = wm.assign_continents(df, countries)
    assert kept[["lon", "lat", "frp"]].values.tolist() == [[5, 5, 1.5]]


def ne(*rows):
    import geopandas as gpd
    return gpd.GeoDataFrame({"CONTINENT": [r[0] for r in rows]}, geometry=[r[1] for r in rows], crs="EPSG:4326")


def test_bbox_of_a_continent_that_does_not_cross_180_is_its_plain_extent():
    boxes = wm.continent_bboxes(ne(("Africa", square(-17, -35, 10, 10)), ("Africa", square(20, 0, 51, 37))))
    assert boxes["africa"] == [-17, -35, 51, 37]


def test_bbox_across_180_takes_the_narrowest_longitude_interval_with_east_above_180():
    # Ази: 26..180 + Чукотк -180..-169 → 26..191, Монголын 360° бус
    boxes = wm.continent_bboxes(ne(("Asia", square(26, -10, 180, 77)), ("Asia", square(-180, 60, -169, 71))))
    assert boxes["asia"] == [26, -10, 191, 77]


def test_bbox_of_islands_on_both_sides_of_180():
    from shapely.geometry import MultiPolygon
    fiji = MultiPolygon([square(177, -20, 180, -16), square(-180, -17, -178, -16)])
    boxes = wm.continent_bboxes(ne(("Oceania", square(113, -44, 154, -10)), ("Oceania", fiji)))
    assert boxes["oceania"] == [113, -44, 182, -10]


def test_bbox_ignores_antarctica_and_open_sea():
    boxes = wm.continent_bboxes(ne(("Africa", square(0, 0, 10, 10)), ("Antarctica", square(-180, -90, 180, -60)),
                                   ("Seven seas (open ocean)", square(50, -50, 70, -40))))
    assert set(boxes) == {"africa"}


PERIOD = ("2026-11-05", "2026-11-14")  # тестэд тогтмол (wm.PERIOD өөрчлөгдсөн ч)


def clean_points():
    return pd.DataFrame({
        "continent": ["asia", "asia"], "platform": ["aqua", "noaa20"],
        "lon": [106.98765, -179.0004], "lat": [47.12349, 66.5], "frp": [12.346, 0.96],
        "conf": ["high", "low"], "date": ["2026-11-14", "2026-11-05"], "hhmm": [1832, 342], "daynight": ["D", "N"],
    })


def test_points_doc_is_columnar_with_codes_and_three_decimal_coordinates():
    doc = wm.points_doc(clean_points(), "asia", PERIOD)
    assert doc["schema_version"] == wm.SCHEMA and doc["synthetic"] is False
    assert doc["continent"] == "asia" and doc["n"] == 2
    assert doc["codes"]["platform"] == ["terra", "aqua", "snpp", "noaa20", "noaa21"]
    assert doc["codes"]["conf"] == ["low", "nominal", "high"]
    assert doc["dates"][0] == "2026-11-05" and doc["dates"][-1] == "2026-11-14" and len(doc["dates"]) == 10
    # Цаг хугацааны дарааллаар
    assert doc["columns"] == {
        "lon": [-179.0, 106.988], "lat": [66.5, 47.123], "platform": [3, 1], "frp": [0.96, 12.35],
        "conf": [0, 2], "date": [0, 9], "hhmm": [342, 1832], "daynight": ["N", "D"], "match_class": [None, None],
    }


def test_points_doc_rejects_dates_outside_the_period():
    df = clean_points().assign(date=["2026-11-15", "2026-11-05"])
    with pytest.raises(ValueError):
        wm.points_doc(df, "asia", PERIOD)


def test_index_doc_lists_continents_with_names_bbox_and_counts():
    kept = pd.concat([clean_points(), clean_points().assign(continent="africa").iloc[:1]])
    doc = wm.index_doc(kept, {"antarctica": 1, "seven_seas": 2, "no_continent": 3},
                       {"asia": [26, -10, 191, 77], "africa": [-17, -35, 51, 37]}, PERIOD, ["MODIS_NRT"])
    assert doc["synthetic"] is False and doc["period"] == {"start": "2026-11-05", "end": "2026-11-14"}
    assert doc["dropped"] == {"antarctica": 1, "seven_seas": 2, "no_continent": 3}
    assert [c["id"] for c in doc["continents"]] == ["africa", "asia"]
    asia = doc["continents"][1]
    assert asia == {"id": "asia", "name_en": "Asia", "name_mn": "Ази", "bbox": [26, -10, 191, 77],
                    "points_file": "points_asia.json", "n_points": 2,
                    "n_by_platform": {"terra": 0, "aqua": 1, "snpp": 0, "noaa20": 1, "noaa21": 0}}


def test_unknown_confidence_stops_the_build_with_a_clear_message():
    with pytest.raises(ValueError, match="confidence"):
        wm.clean_firms(viirs_rows(confidence="x"), "VIIRS_NOAA20_NRT")
