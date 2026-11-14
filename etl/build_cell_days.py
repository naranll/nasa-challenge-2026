"""
Turn clean hotspots into "fire cell-days" per aimag and month.

Why: one fire can be 1 MODIS pixel (1 km) but several VIIRS pixels (375 m).
Counting pixels makes VIIRS look like it sees more fire than it does.
Instead we ask, for each ~5 km grid cell and each day: "any hotspot? yes/no".
That removes most of the pixel-size difference before any harmonization.

Input : etl/data/processed/hotspots_clean.parquet
        etl/data/raw/mongolia_aimags.geojson
Output: etl/data/processed/cell_days_monthly.csv
"""
from pathlib import Path
import numpy as np
import pandas as pd
import geopandas as gpd

HERE = Path(__file__).resolve().parent
HOTSPOTS = HERE / "data" / "processed" / "hotspots_clean.parquet"
AIMAGS = HERE / "data" / "raw" / "mongolia_aimags.geojson"
OUT = HERE / "data" / "processed" / "cell_days_monthly.csv"

GRID = 0.05  # degrees, about 5 km. ASSUMPTION: test 0.02 and 0.10 later.

df = pd.read_parquet(HOTSPOTS)
print(f"Hotspots in: {len(df)}")

# 1. Put each hotspot in a grid cell
df["cell_i"] = np.floor(df["latitude"] / GRID).astype(int)
df["cell_j"] = np.floor(df["longitude"] / GRID).astype(int)
df["date_local"] = pd.to_datetime(df["date_local"])

# 2. One row per platform + day/night + day + cell (yes, there was fire)
cd = (df.groupby(["platform", "daynight", "date_local", "cell_i", "cell_j"])
        .agg(hotspots=("frp", "size"), frp_sum=("frp", "sum"))
        .reset_index())
print(f"Fire cell-days: {len(cd)}  (from {len(df)} hotspots)")

# 3. Which aimag is each cell in? (use the cell centre)
cells = cd[["cell_i", "cell_j"]].drop_duplicates()
cells = gpd.GeoDataFrame(
    cells,
    geometry=gpd.points_from_xy((cells["cell_j"] + 0.5) * GRID, (cells["cell_i"] + 0.5) * GRID),
    crs="EPSG:4326",
)
aimags = gpd.read_file(AIMAGS)[["shapeName", "geometry"]].rename(columns={"shapeName": "aimag"})
cells = gpd.sjoin(cells, aimags, how="left", predicate="within").drop(columns=["geometry", "index_right"])
cd = cd.merge(cells, on=["cell_i", "cell_j"], how="left")

outside = cd["aimag"].isna().sum()
print(f"Cell-days outside Mongolia's border (dropped): {outside}")
cd = cd.dropna(subset=["aimag"])

# 4. Monthly totals per aimag, platform, day/night
cd["month"] = cd["date_local"].dt.to_period("M").astype(str)
monthly = (cd.groupby(["aimag", "month", "platform", "daynight"])
             .agg(cell_days=("cell_i", "size"),
                  hotspots=("hotspots", "sum"),
                  frp_sum=("frp_sum", "sum"))
             .reset_index())

OUT.parent.mkdir(parents=True, exist_ok=True)
monthly.to_csv(OUT, index=False)
print(f"\nSaved {len(monthly)} rows to {OUT}")

# 5. Quick look: how much does counting cell-days shrink the numbers?
tot = monthly.groupby(["platform", "daynight"])[["hotspots", "cell_days"]].sum()
tot["hotspots_per_cell_day"] = (tot["hotspots"] / tot["cell_days"]).round(2)
print("\n", tot)
print("\nTop 5 aimags by cell-days:")
print(monthly.groupby("aimag")["cell_days"].sum().sort_values(ascending=False).head(5))
