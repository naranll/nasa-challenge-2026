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

if errors:
    print("\n".join(errors))
    sys.exit(1)
print("fixtures OK")
