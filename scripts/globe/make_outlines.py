"""Build the small outline files the home globe bundles (spec A7, §11.1).

    python scripts/globe/make_outlines.py

- app/src/globe/assets/mongolia.json: Mongolia's outline, the union of the 22 geoBoundaries ADM1 areas
  in etl/data/raw/mongolia_aimags.geojson (run etl/get_boundaries.py first).
  Licence ODbL 1.0, (c) OpenStreetMap contributors, via geoBoundaries. Credit is shown on the page.
- app/src/globe/assets/land.json: world land for the no-WebGL picture, the union of Natural Earth 1:110m
  countries (public domain) as shipped in app/node_modules/three-globe/example/.
Both are simplified and rounded so they stay small (spec P8: Mongolia <= 50 KB).
"""
import json
from pathlib import Path

import geopandas as gpd
from shapely.geometry import mapping

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "app" / "src" / "globe" / "assets"


def rounded(geom, digits):
    def r(c):
        return [round(c[0], digits), round(c[1], digits)]

    m = mapping(geom)
    if m["type"] == "Polygon":
        m["coordinates"] = [[r(c) for c in ring] for ring in m["coordinates"]]
    else:
        m["coordinates"] = [[[r(c) for c in ring] for ring in poly] for poly in m["coordinates"]]
    return m


def write(name, geom, digits, source):
    doc = {"type": "FeatureCollection", "source": source,
           "features": [{"type": "Feature", "properties": {}, "geometry": rounded(geom, digits)}]}
    path = OUT / name
    path.write_text(json.dumps(doc, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size // 1024} KB)")


aimags = gpd.read_file(ROOT / "etl" / "data" / "raw" / "mongolia_aimags.geojson")
mongolia = aimags.geometry.union_all().buffer(0).simplify(0.02, preserve_topology=True)
write("mongolia.json", mongolia, 3, "geoBoundaries gbOpen MNG ADM1, ODbL 1.0, (c) OpenStreetMap contributors")

countries = gpd.read_file(ROOT / "app" / "node_modules" / "three-globe" / "example" / "country-polygons" / "ne_110m_admin_0_countries.geojson")
land = countries.geometry.buffer(0).union_all().simplify(0.3, preserve_topology=True)
write("land.json", land, 1, "Natural Earth 1:110m countries, public domain")
