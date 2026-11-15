"""
World map 2/8 (#33), 4/8 (#35), 6/8 (#37): татсан NRT CSV-үүдийг цэвэрлэж, тив оноож, NOAA-20 fire unit ба тивийн
r_day/r_night-ээр Aqua-equivalent тоо тооцож, NOAA-20 ↔ Aqua match (±60 мин, ±180 мин sensitivity), IoU-г
тооцоод апп-ын JSON-ыг бичнэ.

    python etl/build_world_map.py

Уншина: etl/data/raw/world/{SOURCE}_{DATE}_{DAY_RANGE}.csv, etl/data/raw/ne_110m_admin_0_countries.geojson
  (хоёуланг нь fetch_world_nrt.py татна)
Бичнэ: public/data/world/index.json, public/data/world/points_{тив}.json, public/data/world/cells_{тив}.json  ("synthetic": false, commit хийгдэнэ)
Хасагдсан цэгүүдийг (Antarctica, Seven seas, тив олдоогүй) тоолж хэвлэнэ. Эцэст нь тив бүрийн хураангуйг хэвлэнэ.
"""
import json
import re
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd

import world_map as wm

sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
RAW = HERE / "data" / "raw" / "world"
NE_PATH = HERE / "data" / "raw" / "ne_110m_admin_0_countries.geojson"
OUT = HERE.parent / "public" / "data" / "world"
FILE_RE = re.compile(r"^(?P<source>[A-Z0-9_]+)_(?P<date>\d{4}-\d{2}-\d{2})_(?P<days>\d+)\.csv$")


def load_raw(raw_dir):
    parts, sources = [], []
    for f in sorted(raw_dir.glob("*.csv")):
        m = FILE_RE.match(f.name)
        if not m:
            print(f"{f.name}: нэр таарахгүй, алгасав")
            continue
        source = m["source"]
        clean = wm.clean_firms(pd.read_csv(f, low_memory=False), source)
        print(f"{f.name}: {len(clean)} мөр")
        if len(clean):  # хоосон (S-NPP) файлыг concat-д оруулахгүй
            parts.append(clean)
        if source not in sources:
            sources.append(source)
    if not parts:
        sys.exit(f"{raw_dir}-д мөртэй CSV алга. Эхлээд python etl/fetch_world_nrt.py ажиллуулна уу.")
    return pd.concat(parts, ignore_index=True), sources


def write_json(path, doc):
    path.parent.mkdir(parents=True, exist_ok=True)
    # Авсаархан: хоосон зайгүй (points файлууд том).
    path.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"бичлээ {path.name} ({path.stat().st_size / 1e6:.1f} MB)")


def build(raw_dir=RAW, ne_path=NE_PATH, out_dir=OUT, period=wm.PERIOD):
    df, sources = load_raw(raw_dir)

    in_period = df["date"].isin(wm.period_dates(period))
    if (~in_period).any():
        print(f"Хугацаанаас гадуур: {(~in_period).sum()} мөр хасав")
        df = df[in_period]

    countries = gpd.read_file(ne_path)
    kept, dropped = wm.assign_continents(df, countries)
    print(f"\nНийт {len(df)} hotspot, тив оноосон {len(kept)}. Хасагдсан: "
          f"Antarctica {dropped['antarctica']}, Seven seas {dropped['seven_seas']}, "
          f"тив олдоогүй (> {wm.NEAREST_MAX_DEG}°) {dropped['no_continent']}")

    units = wm.fire_units(kept)
    ratios = wm.continent_ratios(kept, units)
    bboxes = wm.continent_bboxes(countries)

    # #37: match бүх тивээр нэг дор (тивийн хил дээрх хос алдагдахгүй), ±180 мин нь зөвхөн index-д.
    kept = kept.assign(match_class=wm.match_classes(kept))
    cells, match = wm.continent_cells_and_match(kept, units, ratios, period)

    index = wm.index_doc(kept, dropped, bboxes, period, sources, ratios=ratios, match=match)
    for c in index["continents"]:
        write_json(out_dir / c["points_file"], wm.points_doc(kept[kept["continent"] == c["id"]], c["id"], period))
        write_json(out_dir / c["cells_file"], cells[c["id"]])
    write_json(out_dir / "index.json", index)

    print("\nТив бүрийн хураангуй (UTC, 2026-11-05 – 11-14):")
    print(f"{'тив':<15}{'бүгд':>9}" + "".join(f"{p:>9}" for p in wm.PLATFORMS) + "  bbox")
    for c in index["continents"]:
        print(f"{c['id']:<15}{c['n_points']:>9}" + "".join(f"{c['n_by_platform'][p]:>9}" for p in wm.PLATFORMS)
              + f"  {c['bbox']}")

    w = index["world_ratio"]
    print(f"\nNOAA-20 fire unit: {len(units)} (пиксел {int((kept['platform'] == 'noaa20').sum())}). "
          f"Дэлхийн r: D {w['D']}, N {w['N']}  (Aqua пиксел / NOAA-20 unit)")
    print(f"{'тив':<15}{'r_day':>8}{'r_night':>9}{'aqua D':>8}{'unit D':>8}{'aqua N':>8}{'unit N':>8}  flags")
    for c in index["continents"]:
        n = c["n"]
        print(f"{c['id']:<15}{c['r_day']!s:>8}{c['r_night']!s:>9}{n['D']['aqua']:>8}{n['D']['noaa20_units']:>8}"
              f"{n['N']['aqua']:>8}{n['N']['noaa20_units']:>8}  {','.join(c['flags'])}")

    print(f"\nMatch NOAA-20 ↔ Aqua (±{wm.MATCH_WINDOW_MIN} мин; ±{wm.SENSITIVITY_WINDOW_MIN} мин хаалтанд). "
          "NC = Not comparable хувь (Aqua пиксел / NOAA-20 unit)")
    print(f"{'тив':<15}{'IoU':>8}{'P(V|M)':>16}{'P(M|V)':>16}{'NC aqua':>16}{'NC unit':>16}")
    for c in index["continents"]:
        s = c["sensitivity_180"]
        print(f"{c['id']:<15}{c['iou']!s:>8}"
              + "".join(f"{f'{a} ({b})':>16}" for a, b in [
                  (c["p_v_given_m"], s["p_v_given_m"]), (c["p_m_given_v"], s["p_m_given_v"]),
                  (c["not_comparable_share"]["aqua"], s["not_comparable_share"]["aqua"]),
                  (c["not_comparable_share"]["noaa20_units"], s["not_comparable_share"]["noaa20_units"])]))
    return index


if __name__ == "__main__":
    build()
