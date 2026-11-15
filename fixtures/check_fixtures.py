"""Fail if a fixture is not clearly synthetic or is missing the basic contract keys.

    python fixtures/check_fixtures.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
errors = []

for path in sorted(ROOT.rglob("*.json")):
    rel = path.relative_to(ROOT)
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

WORLD = ROOT / "world"
if WORLD.exists():
    index = json.loads((WORLD / "index.json").read_text(encoding="utf-8"))
    for c in index.get("continents", []):
        w, s, e, n = c["bbox"]
        # 180°-ыг дамнавал east > 180 байж болно, гэхдээ west < east, өргөн ≤ 360.
        if not (-180 <= w < e <= w + 360 and -90 <= s < n <= 90):
            errors.append(f"world/index.json {c['id']}: bad bbox {c['bbox']}")
        path = WORLD / c["points_file"]
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

        # #35: cells_{тив}.json
        cpath = WORLD / c.get("cells_file", "")
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

if errors:
    print("\n".join(errors))
    sys.exit(1)
print("fixtures OK")
