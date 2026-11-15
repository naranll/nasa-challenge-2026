"""Fail if a fixture is not clearly synthetic or is missing the basic contract keys.

    python fixtures/check_fixtures.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def check_world(world, synthetic):
    """Errors in a world/ folder (index, points, cells). `synthetic` is what every file must say:
    True for fixtures/world, False for the committed real public/data/world (#39)."""
    errors = []
    for path in sorted(world.glob("*.json")):
        doc = json.loads(path.read_text(encoding="utf-8"))
        if doc.get("synthetic") is not synthetic:
            errors.append(f"world/{path.name}: must contain \"synthetic\": {str(synthetic).lower()}")
        if "schema_version" not in doc:
            errors.append(f"world/{path.name}: missing schema_version")
    index = json.loads((world / "index.json").read_text(encoding="utf-8"))
    for c in index.get("continents", []):
        w, s, e, n = c["bbox"]
        # 180°-ыг дамнавал east > 180 байж болно, гэхдээ west < east, өргөн ≤ 360.
        if not (-180 <= w < e <= w + 360 and -90 <= s < n <= 90):
            errors.append(f"world/index.json {c['id']}: bad bbox {c['bbox']}")
        path = world / c["points_file"]
        if not path.exists():
            errors.append(f"world/index.json {c['id']}: {c['points_file']} missing")
            continue
        doc = json.loads(path.read_text(encoding="utf-8"))
        cols, codes = doc["columns"], doc["codes"]
        if any(len(v) != doc["n"] for v in cols.values()) or doc["n"] != c["n_points"]:
            errors.append(f"world/{path.name}: every column must have n = index n_points rows")
        checks = {
            "platform": lambda v: 0 <= v < len(codes["platform"]),
            "conf": lambda v: 0 <= v < len(codes["conf"]),
            "date": lambda v: 0 <= v < len(doc["dates"]),
            "daynight": lambda v: v in ("D", "N"),
            "match_class": lambda v: v is None or 0 <= v < len(codes["match_class"]),
            "lon": lambda v: -180 <= v <= 180,
            "lat": lambda v: -90 <= v <= 90,
        }
        for name, ok in checks.items():
            if not all(ok(v) for v in cols[name]):
                errors.append(f"world/{path.name}: column {name} has a value out of range")
        # #37: match_class null зөвхөн Aqua, NOAA-20 биш цэгт (Terra, S-NPP, NOAA-21)
        if "match" in index:
            matched = {codes["platform"].index(p) for p in ("aqua", "noaa20")}
            if any((m is None) == (p in matched) for p, m in zip(cols["platform"], cols["match_class"])):
                errors.append(f"world/{path.name}: match_class must be null exactly for non Aqua/NOAA-20 points")
            mc = c["match_counts"]
            if sum(mc["aqua"].values()) != c["n_by_platform"]["aqua"]:
                errors.append(f"world/index.json {c['id']}: match_counts.aqua must add up to the Aqua pixels")
            probs = [c["iou"], c["p_v_given_m"], c["p_m_given_v"], *c["not_comparable_share"].values(),
                     c["sensitivity_180"]["p_v_given_m"], c["sensitivity_180"]["p_m_given_v"],
                     *c["sensitivity_180"]["not_comparable_share"].values()]
            if not all(v is None or 0 <= v <= 1 for v in probs):
                errors.append(f"world/index.json {c['id']}: iou / probabilities must be in [0, 1] or null")
            a = mc["aqua"]
            want = a["both"] / (a["both"] + a["modis_only"]) if a["both"] + a["modis_only"] else None
            if (want is None) != (c["p_v_given_m"] is None) or (want is not None and abs(want - c["p_v_given_m"]) > 1e-4):
                errors.append(f"world/index.json {c['id']}: p_v_given_m != both / (both + modis_only)")
            u = mc["noaa20_units"]
            if sum(u.values()) != c["n"]["D"]["noaa20_units"] + c["n"]["N"]["noaa20_units"]:
                errors.append(f"world/index.json {c['id']}: match_counts.noaa20_units must add up to the fire units")
            want = u["both"] / (u["both"] + u["viirs_only"]) if u["both"] + u["viirs_only"] else None
            if (want is None) != (c["p_m_given_v"] is None) or (want is not None and abs(want - c["p_m_given_v"]) > 1e-4):
                errors.append(f"world/index.json {c['id']}: p_m_given_v != both / (both + viirs_only), fire units")

        # #35: cells_{тив}.json
        cpath = world / c.get("cells_file", "")
        if "cells_file" not in c or not cpath.is_file():
            errors.append(f"world/index.json {c['id']}: cells_file missing")
            continue
        cells = json.loads(cpath.read_text(encoding="utf-8"))
        if cells["n"] != len(cells["cells"]):
            errors.append(f"world/{cpath.name}: n must equal the number of cells")
        r = {"D": c["r_day"], "N": c["r_night"]}
        aqua_total = units_total = 0
        for cell in cells["cells"]:
            u = cell["noaa20_units"]
            aqua_total += cell["aqua"]
            units_total += u["D"] + u["N"]
            if cell["r"] != r:
                errors.append(f"world/{cpath.name} {cell['id']}: r must equal index r_day/r_night")
                break
            if not 5 <= len(cell["boundary"]) <= 10:  # H3: 6, pentagon 5, icosahedron edge-д 10 хүртэл
                errors.append(f"world/{cpath.name} {cell['id']}: boundary must have 5-10 vertices")
                break
            want = None if any(u[d] and r[d] is None for d in r) else sum(u[d] * r[d] for d in r if u[d])
            if (want is None) != (cell["viirs_harm"] is None) or (want is not None and abs(want - cell["viirs_harm"]) > 0.01):
                errors.append(f"world/{cpath.name} {cell['id']}: viirs_harm != units_D x r_D + units_N x r_N")
                break
        n = c["n"]
        if aqua_total != n["D"]["aqua"] + n["N"]["aqua"] or units_total != n["D"]["noaa20_units"] + n["N"]["noaa20_units"]:
            errors.append(f"world/{cpath.name}: cell totals must equal index n")
        if bool(c["flags"]) != any(c["fallback"].values()):
            errors.append(f"world/index.json {c['id']}: flags must contain ratio_fallback exactly when a fallback is used")
    return errors


def main():
    errors = []

    for path in sorted(ROOT.rglob("*.json")):
        rel = path.relative_to(ROOT)
        if rel.parts[0] == "world":
            continue  # check_world() below checks synthetic + schema_version there
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errors.append(f"{rel}: invalid JSON ({e})")
            continue
        if doc.get("synthetic") is not True:
            errors.append(f"{rel}: must contain \"synthetic\": true")
        if "schema_version" not in doc:
            errors.append(f"{rel}: missing schema_version")

    for path in sorted((ROOT / "calendar").glob("*.json")):
        doc = json.loads(path.read_text(encoding="utf-8"))
        months = doc.get("months", [])
        yms = [m["ym"] for m in months]
        if not yms or yms[0] != "2002-07":
            errors.append(f"calendar/{path.name}: must start at 2002-07 (PLAN D4)")
        if yms != sorted(set(yms)):
            errors.append(f"calendar/{path.name}: months must be unique and ordered")
        for m in months:
            if m["harmonized"] == 0 and m["raw"].get("aqua") is None and m["raw"].get("snpp") is None:
                errors.append(f"calendar/{path.name} {m['ym']}: unknown must be null, not 0")

    if (ROOT / "world").exists():
        errors += check_world(ROOT / "world", synthetic=True)

    if errors:
        print("\n".join(errors))
        sys.exit(1)
    print("fixtures OK")


if __name__ == "__main__":
    main()
