"""World map 4/8 (#35): NOAA-20 fire unit, тивийн r_day/r_night + fallback, H3 res 5 нүд."""
import h3
import pandas as pd
import pytest

import world_map as wm

UB = (106.9, 47.9)  # Улаанбаатар орчим (lon, lat)
PERIOD = ("2026-11-05", "2026-11-14")


def hs(platform="noaa20", lon=UB[0], lat=UB[1], date="2026-11-05", hhmm=342, daynight="N", continent="asia"):
    return dict(platform=platform, lon=lon, lat=lat, date=date, hhmm=hhmm, daynight=daynight, continent=continent)


def frame(*rows):
    return pd.DataFrame(list(rows))


def test_one_cell_two_overpasses_gives_two_fire_units():
    units = wm.fire_units(frame(hs(hhmm=342), hs(hhmm=343), hs(hhmm=1820)))
    assert len(units) == 2


def test_several_hotspots_in_one_cell_and_overpass_are_one_fire_unit():
    near = (UB[0] + 0.0005, UB[1] + 0.0005)  # ижил H3 res 8 нүд
    assert len(wm.fire_units(frame(hs(), hs(lon=near[0], lat=near[1]), hs(hhmm=345)))) == 1


@pytest.mark.parametrize("second, units", [(352, 1), (353, 2)])  # 03:42 → 03:52 = 10 мин, 03:53 = 11 мин
def test_a_gap_of_exactly_10_minutes_is_the_same_overpass_and_more_is_a_new_one(second, units):
    assert len(wm.fire_units(frame(hs(hhmm=342), hs(hhmm=second)))) == units


def test_gap_is_measured_between_consecutive_times_across_the_hour():
    # 00:55, 01:04, 01:13: дараалсан зай 9 мин → нэг overpass (эхнээс 18 мин байсан ч)
    assert len(wm.fire_units(frame(hs(hhmm=55), hs(hhmm=104), hs(hhmm=113)))) == 1


def test_same_time_on_another_utc_date_is_another_unit():
    assert len(wm.fire_units(frame(hs(date="2026-11-05"), hs(date="2026-11-06")))) == 2


def test_a_cell_on_a_continent_border_gives_one_unit_per_continent():
    assert len(wm.fire_units(frame(hs(continent="asia"), hs(continent="europe")))) == 2


def test_only_noaa20_makes_fire_units_noaa21_terra_aqua_do_not():
    rows = frame(hs(platform="noaa21"), hs(platform="terra"), hs(platform="aqua"), hs(platform="snpp"))
    assert len(wm.fire_units(rows)) == 0


def aqua(continent, daynight, n):
    return [dict(platform="aqua", continent=continent, daynight=daynight)] * n


def units(continent, daynight, n):
    return [dict(continent=continent, daynight=daynight)] * n


def ratios(aqua_rows, unit_rows):
    pts = pd.DataFrame(aqua_rows + [dict(platform="noaa21", continent="asia", daynight="D")] * 50)
    return wm.continent_ratios(pts, pd.DataFrame(unit_rows))


def test_ratio_is_sum_of_aqua_pixels_over_sum_of_noaa20_units_per_day_and_night():
    r = ratios(aqua("asia", "D", 60) + aqua("asia", "N", 45),
               units("asia", "D", 40) + units("asia", "N", 30))
    asia = r["continents"]["asia"]
    assert asia["r_day"] == pytest.approx(1.5) and asia["r_night"] == pytest.approx(1.5)
    assert asia["n"] == {"D": {"aqua": 60, "noaa20_units": 40}, "N": {"aqua": 45, "noaa20_units": 30}}
    assert asia["flags"] == []


def test_fewer_than_30_on_either_side_falls_back_to_the_world_ratio_for_that_day_or_night():
    # Ази D: 60/40 = 1.5. Африк D: aqua 29 < 30 → дэлхийн D = (60+29)/(40+50) ; Африк N: 90/30 = 3
    r = ratios(aqua("asia", "D", 60) + aqua("africa", "D", 29) + aqua("africa", "N", 90),
               units("asia", "D", 40) + units("africa", "D", 50) + units("africa", "N", 30))
    assert r["world"]["D"] == pytest.approx(89 / 90)
    assert r["world"]["N"] == pytest.approx(3.0)
    africa = r["continents"]["africa"]
    assert africa["r_day"] == pytest.approx(89 / 90) and africa["r_night"] == pytest.approx(3.0)
    assert africa["flags"] == ["ratio_fallback"]
    assert africa["fallback"] == {"D": True, "N": False}
    assert r["continents"]["asia"]["flags"] == ["ratio_fallback"]  # Ази N: 0 < 30
    assert r["continents"]["asia"]["r_day"] == pytest.approx(1.5)


def test_world_ratio_with_no_noaa20_units_is_null_not_zero():
    r = ratios(aqua("asia", "N", 40), units("asia", "D", 40))
    assert r["world"]["N"] is None and r["continents"]["asia"]["r_night"] is None


R = {"r_day": 2.0, "r_night": 0.5}
FAR = (110.0, 40.0)  # өөр res 5 нүд


def cells(points, r=R):
    return wm.cells_doc(points, wm.fire_units(points), r, "asia", PERIOD)


def test_cell_sums_day_and_night_units_times_their_ratio_and_keeps_aqua_as_is():
    pts = frame(
        hs(daynight="D", hhmm=500), hs(daynight="D", hhmm=900), hs(daynight="D", date="2026-11-06"),  # 3 D unit
        hs(daynight="N", hhmm=1800),                                                                  # 1 N unit
        hs(platform="aqua", daynight="D"), hs(platform="aqua", daynight="N"),
        hs(platform="noaa21"), hs(platform="terra"))
    doc = cells(pts)
    assert doc["continent"] == "asia" and doc["resolution"] == 5 and doc["n"] == 1
    [c] = doc["cells"]
    assert c["id"] == h3.latlng_to_cell(UB[1], UB[0], 5)
    assert c["noaa20_units"] == {"D": 3, "N": 1}
    assert c["aqua"] == 2
    assert c["viirs_harm"] == pytest.approx(3 * 2.0 + 1 * 0.5)
    assert c["r"] == {"D": 2.0, "N": 0.5}
    assert abs(c["lat"] - UB[1]) < 0.2 and abs(c["lon"] - UB[0]) < 0.2
    assert 5 <= len(c["boundary"]) <= 10 and all(len(v) == 2 for v in c["boundary"])


def test_cells_with_only_aqua_or_only_noaa20_are_both_kept():
    doc = cells(frame(hs(platform="aqua"), hs(lon=FAR[0], lat=FAR[1])))
    by_aqua = sorted((c["aqua"], c["noaa20_units"]["D"] + c["noaa20_units"]["N"], c["viirs_harm"]) for c in doc["cells"])
    assert by_aqua == [(0, 1, 0.5), (1, 0, 0.0)]


def test_unknown_ratio_gives_null_viirs_harm_not_zero():
    doc = cells(frame(hs(daynight="N")), r={"r_day": 2.0, "r_night": None})
    assert doc["cells"][0]["viirs_harm"] is None


def test_cell_boundary_across_180_does_not_jump_around_the_world():
    doc = cells(frame(hs(lon=179.99, lat=66.0, continent="asia")))
    lons = [v[0] for v in doc["cells"][0]["boundary"]]
    assert max(lons) - min(lons) < 5


def test_index_gets_continent_ratios_flags_cells_file_and_the_world_ratio():
    pts = pd.DataFrame(aqua("asia", "D", 60) + units("asia", "D", 0)).assign(lon=UB[0], lat=UB[1])
    r = wm.continent_ratios(pts, pd.DataFrame(units("asia", "D", 40)))
    doc = wm.index_doc(pts, {"antarctica": 0, "seven_seas": 0, "no_continent": 0},
                       {"asia": [26, -10, 191, 77]}, PERIOD, ["MODIS_NRT"], ratios=r)
    asia = doc["continents"][0]
    assert asia["n_points"] == 60  # #33-ийн түлхүүрүүд хэвээр
    assert asia["r_day"] == 1.5 and asia["r_night"] is None
    assert asia["flags"] == ["ratio_fallback"] and asia["fallback"] == {"D": False, "N": True}
    assert asia["n"]["D"] == {"aqua": 60, "noaa20_units": 40}
    assert asia["cells_file"] == "cells_asia.json"
    assert doc["world_ratio"] == {"D": 1.5, "N": None, "n": {"D": {"aqua": 60, "noaa20_units": 40},
                                                             "N": {"aqua": 0, "noaa20_units": 0}}}
    assert doc["harmonization"] == {"fire_unit": "h3_res8_x_overpass", "overpass_gap_min": 10, "min_n": 30,
                                    "cell_resolution": 5, "noaa20_vs": "aqua"}
