"""
Download Mongolia's aimag boundaries (ADM1) from geoBoundaries (source: OpenStreetMap, license ODbL 1.0).
Saves etl/data/raw/mongolia_aimags.geojson
"""

import json
from pathlib import Path
import requests

HERE = Path(__file__).resolve().parent
OUT = HERE / "data" / "raw" / "mongolia_aimags.geojson"

api = "https://www.geoboundaries.org/api/current/gbOpen/MNG/ADM1/"
info = requests.get(api, timeout=60).json()
url = info["simplifiedGeometryGeoJSON"]          # smaller file, fine for maps
print("License:", info.get("boundaryLicense"), "| Source:", info.get("boundarySource"))

geo = requests.get(url, timeout=120).json()
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(geo, ensure_ascii=False), encoding="utf-8")

names = sorted(f["properties"]["shapeName"] for f in geo["features"])
print(f"Saved {len(names)} areas to {OUT}")
print(names)
