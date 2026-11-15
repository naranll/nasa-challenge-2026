"""World map 6/8 (#37): haversine, R_match, match class, P(V|M), P(M|V), IoU."""
import pandas as pd
import pytest

import world_map as wm


def test_haversine_one_degree_of_latitude_is_about_111_km():
    # 2π · 6371 км / 360 = 111.195 км
    assert wm.haversine_km(0.0, 0.0, 0.0, 1.0) == pytest.approx(111.195, abs=0.001)


def test_haversine_one_degree_of_longitude_shrinks_with_cos_latitude():
    assert wm.haversine_km(0.0, 60.0, 1.0, 60.0) == pytest.approx(111.195 * 0.5, rel=1e-3)


def test_haversine_across_180_is_short():
    assert wm.haversine_km(179.5, 0.0, -179.5, 0.0) == pytest.approx(111.195, abs=0.001)


@pytest.mark.parametrize("scan, track, km", [(1.0, 1.0, 0.5 * 2 ** 0.5 + 0.1875), (3.0, 4.0, 2.5 + 0.1875)])
def test_r_match_is_half_the_modis_pixel_diagonal_plus_half_a_viirs_pixel(scan, track, km):
    assert wm.r_match_km(scan, track) == pytest.approx(km)


UB = (106.9, 47.9)
KM_LAT = 1 / 111.195  # 1 км өргөрөгөөр (градус)


def hs(platform, km_north=0.0, date="2026-11-05", hhmm=500, daynight="D", scan=1.0, track=1.0, continent="asia",
       lon=UB[0]):
    return dict(platform=platform, lon=lon, lat=UB[1] + km_north * KM_LAT, date=date, hhmm=hhmm,
                daynight=daynight, scan=scan, track=track, continent=continent)


def classes(*rows, window=60):
    return wm.match_classes(pd.DataFrame(list(rows)), window_min=window).tolist()


def test_noaa20_inside_r_match_of_aqua_same_daynight_within_60_min_is_both_on_both_sides():
    # R_match(1, 1) = 0.894 км
    assert classes(hs("aqua", hhmm=500), hs("noaa20", km_north=0.8, hhmm=530)) == ["both", "both"]


def test_outside_r_match_but_within_300_km_is_modis_only_and_viirs_only():
    assert classes(hs("aqua"), hs("noaa20", km_north=1.0)) == ["modis_only", "viirs_only"]


def test_bigger_modis_pixel_gives_a_bigger_r_match():
    # scan 3, track 4 → R_match 2.69 км
    assert classes(hs("aqua", scan=3.0, track=4.0), hs("noaa20", km_north=2.5)) == ["both", "both"]


@pytest.mark.parametrize("hhmm, want", [(600, "both"), (601, "not_comparable")])  # 05:00 → 06:00 = 60 мин
def test_time_difference_of_exactly_60_minutes_matches_and_61_is_out_of_the_window(hhmm, want):
    assert classes(hs("aqua", hhmm=500), hs("noaa20", hhmm=hhmm)) == [want, want]


def test_the_window_crosses_midnight_utc():
    assert classes(hs("aqua", date="2026-11-05", hhmm=2340), hs("noaa20", date="2026-11-06", hhmm=20)) == \
        ["both", "both"]


def test_different_day_night_flag_is_not_one_fire_but_still_comparable():
    assert classes(hs("aqua", daynight="D"), hs("noaa20", daynight="N")) == ["modis_only", "viirs_only"]


def test_nothing_from_the_other_platform_within_300_km_is_not_comparable():
    assert classes(hs("aqua"), hs("noaa20", km_north=301)) == ["not_comparable", "not_comparable"]
    assert classes(hs("aqua"), hs("noaa20", km_north=299)) == ["modis_only", "viirs_only"]


def test_terra_noaa21_and_snpp_get_null_and_no_point_is_dropped():
    out = classes(hs("terra"), hs("noaa21"), hs("snpp"), hs("aqua"), hs("noaa20", km_north=0.1))
    assert out == [None, None, None, "both", "both"]


def test_wider_window_turns_not_comparable_into_a_match():
    rows = (hs("aqua", hhmm=1500), hs("noaa20", hhmm=1300))  # Aqua drift: ~2 цаг
    assert classes(*rows) == ["not_comparable", "not_comparable"]
    assert classes(*rows, window=180) == ["both", "both"]


def with_class(row, match_class):
    return dict(row, match_class=match_class)


def stats(*rows):
    return wm.match_stats(pd.DataFrame(list(rows)))


FAR_KM = 50  # өөр H3 res 8 нүд


def test_p_v_given_m_counts_aqua_pixels_and_leaves_not_comparable_out():
    aq = [with_class(hs("aqua"), c) for c in ["both"] * 3 + ["modis_only"] + ["not_comparable"] * 2]
    s = stats(*aq)
    assert s["p_v_given_m"] == pytest.approx(3 / 4)
    assert s["counts"]["aqua"] == {"both": 3, "modis_only": 1, "not_comparable": 2}
    assert s["not_comparable_share"]["aqua"] == pytest.approx(2 / 6)


def test_p_m_given_v_counts_fire_units_and_a_unit_is_both_if_any_of_its_pixels_is():
    s = stats(
        with_class(hs("noaa20", hhmm=500), "both"), with_class(hs("noaa20", hhmm=501), "viirs_only"),  # 1 unit: both
        with_class(hs("noaa20", hhmm=900), "viirs_only"),                    # ижил нүд, өөр overpass: viirs_only
        with_class(hs("noaa20", km_north=FAR_KM), "not_comparable"),         # өөр нүд: not comparable
        with_class(hs("noaa21"), None), with_class(hs("terra"), None))
    assert s["counts"]["noaa20_units"] == {"both": 1, "viirs_only": 1, "not_comparable": 1}
    assert s["p_m_given_v"] == pytest.approx(1 / 2)
    assert s["not_comparable_share"]["noaa20_units"] == pytest.approx(1 / 3)


def test_probabilities_with_nothing_to_divide_are_null_not_zero():
    s = stats(with_class(hs("aqua"), "not_comparable"), with_class(hs("terra"), None))
    assert s["p_v_given_m"] is None and s["p_m_given_v"] is None
    assert s["not_comparable_share"] == {"aqua": 1.0, "noaa20_units": None}


def cell(aqua, d=0, n=0):
    return dict(aqua=aqua, noaa20_units={"D": d, "N": n})


def test_iou_is_cells_seen_by_both_over_cells_seen_by_either():
    # 2 хоёулаа, 1 зөвхөн Aqua, 2 зөвхөн NOAA-20 (D эсвэл N) → 2 / 5
    cells = [cell(3, d=1), cell(1, n=2), cell(4), cell(0, d=1), cell(0, n=5)]
    assert wm.iou_cells(cells) == pytest.approx(2 / 5)


def test_iou_with_no_cells_is_null():
    assert wm.iou_cells([]) is None


PERIOD = ("2026-11-05", "2026-11-14")


def test_points_file_writes_match_class_codes_and_keeps_null():
    rows = pd.DataFrame([with_class(hs("aqua"), "modis_only"), with_class(hs("terra"), None),
                         with_class(hs("noaa20"), "not_comparable")]).assign(frp=1.0, conf="high")
    doc = wm.points_doc(rows, "asia", PERIOD)
    platform, match = doc["columns"]["platform"], doc["columns"]["match_class"]
    by_platform = {doc["codes"]["platform"][p]: m for p, m in zip(platform, match)}
    assert by_platform == {"aqua": 2, "terra": None, "noaa20": 3}


def test_index_gets_iou_both_probabilities_not_comparable_share_and_the_180_minute_sensitivity():
    pts = pd.DataFrame([hs("aqua")]).assign(lon=UB[0], lat=UB[1])
    at60 = dict(p_v_given_m=2 / 3, p_m_given_v=None, not_comparable_share=dict(aqua=0.123456, noaa20_units=None),
                counts=dict(aqua={"both": 2, "modis_only": 1, "not_comparable": 0},
                            noaa20_units={"both": 0, "viirs_only": 0, "not_comparable": 0}))
    at180 = dict(at60, p_v_given_m=1.0, not_comparable_share=dict(aqua=0.0, noaa20_units=None))
    doc = wm.index_doc(pts, {"antarctica": 0, "seven_seas": 0, "no_continent": 0}, {"asia": [26, -10, 191, 77]},
                       PERIOD, ["MODIS_NRT"], match={"asia": dict(iou=0.25, at_window=at60, at_sensitivity=at180)})
    asia = doc["continents"][0]
    assert asia["iou"] == 0.25
    assert asia["p_v_given_m"] == 0.6667 and asia["p_m_given_v"] is None
    assert asia["not_comparable_share"] == {"aqua": 0.1235, "noaa20_units": None}
    assert asia["match_counts"] == at60["counts"]
    assert asia["sensitivity_180"] == {"p_v_given_m": 1.0, "p_m_given_v": None,
                                       "not_comparable_share": {"aqua": 0.0, "noaa20_units": None}}
    assert doc["match"] == {"pair": "noaa20_vs_aqua", "window_min": 60, "sensitivity_window_min": 180,
                            "earth_radius_m": 6371000, "r_match": "0.5*sqrt(scan^2+track^2)+0.1875 km",
                            "not_comparable_km": 300, "iou_cell_resolution": 5}


def test_aqua_pixel_without_scan_or_track_stops_the_match_instead_of_silently_missing():
    with pytest.raises(ValueError):
        classes(hs("aqua", scan=float("nan")), hs("noaa20"))
