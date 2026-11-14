"""
Clean FIRMS hotspot CSVs for Mongolia.
Reads every fire_archive_*.csv and fire_nrt_*.csv in etl/data/raw,
combines them, removes non-fire heat sources, and saves one clean file.
"""
import numpy as np
import pandas as pd
from pathlib import Path

HERE = Path(__file__).resolve().parent
RAW = HERE / "data" / "raw"
OUT = HERE / "data" / "processed" / "hotspots_clean.parquet"

# FIRMS file name code -> sensor name
SENSOR_CODES = {
    "M-C61": "MODIS",          # Terra + Aqua, 1 km
    "SV-C2": "VIIRS_SNPP",     # Suomi NPP, 375 m
    "J1V-C2": "VIIRS_NOAA20",  # NOAA-20, 375 m
    "J2V-C2": "VIIRS_NOAA21",  # NOAA-21, 375 m
}

def sensor_from_name(name):
    for code, sensor in SENSOR_CODES.items():
        if f"_{code}_" in name:
            return sensor
    return "UNKNOWN"

# 1. Load every file and label it
parts = []
for f in sorted(RAW.glob("fire_*.csv")):
    df = pd.read_csv(f, low_memory=False)
    df["sensor"] = sensor_from_name(f.name)
    df["quality"] = "nrt" if "_nrt_" in f.name else "science"
    parts.append(df)
    print(f"Loaded {f.name}: {len(df)} rows -> {df['sensor'].iloc[0]}")

df = pd.concat(parts, ignore_index=True)

# 2. Time: FIRMS is in UTC. Mongolia is UTC+8, so a fire at 23:00 UTC
#    is already the next day in Mongolia. The calendar uses the local date.
t = df["acq_time"].astype(int).astype(str).str.zfill(4)
df["time_utc"] = pd.to_datetime(df["acq_date"] + " " + t, format="%Y-%m-%d %H%M")
df["time_local"] = df["time_utc"] + pd.Timedelta(hours=8)
df["date_local"] = df["time_local"].dt.date

# 3. Remove non-fire heat (power plants, mines, factories)
#    Science files have a 'type' column: 0 = vegetation fire, 2 = static land source,
#    1 = volcano, 3 = offshore. NRT files do NOT have it, so we learn where the
#    static sources are from the science files and remove those spots everywhere.
CELL = 0.02  # about 2 km
df["cell"] = list(zip(np.floor(df["latitude"] / CELL).astype(int),
                      np.floor(df["longitude"] / CELL).astype(int)))
static_cells = set(df.loc[df["type"].isin([1, 2, 3]), "cell"])
# Science rows: trust their own 'type'. NRT rows (no 'type'): use the learned spots.
is_static = df["type"].isin([1, 2, 3]) | (df["type"].isna() & df["cell"].isin(static_cells))
print(f"\nStatic-source cells found: {len(static_cells)}")
print(f"Removed as non-fire heat: {is_static.sum()} rows")
df = df[~is_static].copy()

# 4. One confidence scale for both sensors
#    MODIS: number 0 to 100. VIIRS: letters l / n / h.
def conf_level(c):
    if isinstance(c, str):
        return {"l": "low", "n": "nominal", "h": "high"}.get(c.strip().lower(), "unknown")
    c = float(c)
    return "low" if c < 30 else ("nominal" if c < 80 else "high")

df["conf_level"] = df["confidence"].apply(conf_level)

# 5. Platform: MODIS is two satellites (Terra = morning, Aqua = afternoon).
#    They see different amounts of fire, so keep them apart.
sat = df["satellite"].astype(str).str.strip().str.upper()
df["platform"] = df["sensor"]
df.loc[(df["sensor"] == "MODIS") & sat.isin(["T", "TERRA"]), "platform"] = "MODIS_TERRA"
df.loc[(df["sensor"] == "MODIS") & sat.isin(["A", "AQUA"]), "platform"] = "MODIS_AQUA"

# 6. Save
keep = ["sensor", "platform", "quality", "latitude", "longitude", "time_utc", "time_local",
        "date_local", "frp", "brightness", "daynight", "conf_level", "scan", "track"]
df = df[keep].sort_values("time_utc")
OUT.parent.mkdir(parents=True, exist_ok=True)
df.to_parquet(OUT, index=False)

print(f"\nSaved {len(df)} clean hotspots to {OUT}")
print(df.groupby("platform")["date_local"].agg(["min", "max", "count"]))
print("\nConfidence:", df["conf_level"].value_counts().to_dict())
