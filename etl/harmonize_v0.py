"""
Harmonization v0 (national, daytime): MODIS Aqua <-> VIIRS S-NPP.

Method (simple and honest first):
1. Count daytime "fire cell-days" (0.05 deg cell had >= 1 hotspot that local day).
2. In the overlap years 2013-2022 (full S-NPP years, Aqua healthy), learn
   ratio = sum(S-NPP cell-days) / sum(Aqua cell-days), per season.
3. Leave-one-year-out test: learn the ratio without year Y, predict year Y.
4. Build one monthly series in "VIIRS S-NPP equivalent" units:
   Aqua x ratio before S-NPP, S-NPP itself while it flew, NOAA-20 after S-NPP ended.
   Also given in "Aqua equivalent" units (the team plan's reference).

Input : etl/data/processed/hotspots_clean.parquet
Output: etl/data/processed/national_monthly_harmonized.csv
"""
from pathlib import Path
import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
IN = HERE / "data" / "processed" / "hotspots_clean.parquet"
OUT = HERE / "data" / "processed" / "national_monthly_harmonized.csv"

GRID = 0.05                     # ASSUMPTION: ~5 km cells
OVERLAP = range(2013, 2023)     # full S-NPP years with healthy Aqua
SEASON = {3: "spring", 4: "spring", 5: "spring",
          6: "summer", 7: "summer", 8: "summer",
          9: "autumn", 10: "autumn", 11: "autumn",
          12: "winter", 1: "winter", 2: "winter"}

df = pd.read_parquet(IN)
df = df[df["daynight"] == "D"].copy()                       # daytime only
df["date_local"] = pd.to_datetime(df["date_local"])
df["ci"] = np.floor(df["latitude"] / GRID).astype(int)
df["cj"] = np.floor(df["longitude"] / GRID).astype(int)

cd = df.drop_duplicates(["platform", "date_local", "ci", "cj"])
cd["month"] = cd["date_local"].dt.to_period("M")
m = cd.pivot_table(index="month", columns="platform", values="ci",
                   aggfunc="size").fillna(0)
full = pd.period_range(m.index.min(), m.index.max(), freq="M")
m = m.reindex(full, fill_value=0)
m["year"] = m.index.year
m["season"] = [SEASON[p.month] for p in m.index]

def ratios(rows):
    """S-NPP / Aqua per season (ratio of sums). Winter has too few fires,
    so it uses the all-season ratio."""
    allr = rows["VIIRS_SNPP"].sum() / rows["MODIS_AQUA"].sum()
    out = {}
    for s in ["spring", "summer", "autumn", "winter"]:
        r = rows[rows["season"] == s]
        out[s] = allr if s == "winter" or r["MODIS_AQUA"].sum() < 50 \
            else r["VIIRS_SNPP"].sum() / r["MODIS_AQUA"].sum()
    return out, allr

ov = m[m["year"].isin(OVERLAP)]
R, R_all = ratios(ov)
print("Overlap 2013-2022, daytime cell-days, S-NPP / Aqua:")
print(f"  all seasons {R_all:.2f} | " + " | ".join(f"{k} {v:.2f}" for k, v in R.items()))

# Leave-one-year-out test
rows = []
for y in OVERLAP:
    Ry, _ = ratios(ov[ov["year"] != y])
    t = ov[ov["year"] == y]
    pred = (t["MODIS_AQUA"] * t["season"].map(Ry)).sum()
    rows.append({"year": y, "actual_snpp": int(t["VIIRS_SNPP"].sum()),
                 "predicted_from_aqua": round(pred), })
loyo = pd.DataFrame(rows)
loyo["error_pct"] = ((loyo["predicted_from_aqua"] - loyo["actual_snpp"])
                     / loyo["actual_snpp"] * 100).round(1)
print("\nLeave-one-year-out (yearly totals):")
print(loyo.to_string(index=False))
print(f"Mean absolute error: {loyo['error_pct'].abs().mean():.1f}%")
spearman = loyo[["actual_snpp", "predicted_from_aqua"]].rank().corr().iloc[0, 1]
print(f"Spearman rank correlation of years: {spearman:.2f}")

# Harmonized monthly series (VIIRS S-NPP equivalent)
snpp_start, snpp_end = pd.Period("2012-02", "M"), pd.Period("2026-10", "M")
r_season = m["season"].map(R)
h = m["MODIS_AQUA"] * r_season                               # before S-NPP
src = pd.Series("MODIS_AQUA x ratio", index=m.index)
in_snpp = (m.index >= snpp_start) & (m.index <= snpp_end)
h[in_snpp] = m.loc[in_snpp, "VIIRS_SNPP"]
src[in_snpp] = "VIIRS_SNPP"
after = m.index > snpp_end
if "VIIRS_NOAA20" in m:
    h[after] = m.loc[after, "VIIRS_NOAA20"]
    src[after] = "VIIRS_NOAA20"
# Months before Aqua started (Terra only) are left empty, not zero
h[m.index < pd.Period("2002-07", "M")] = np.nan
src[m.index < pd.Period("2002-07", "M")] = "no Aqua yet"

out = pd.DataFrame({
    "month": m.index.astype(str),
    "aqua_cell_days": m.get("MODIS_AQUA", 0).astype(int),
    "terra_cell_days": m.get("MODIS_TERRA", 0).astype(int),
    "snpp_cell_days": m.get("VIIRS_SNPP", 0).astype(int),
    "noaa20_cell_days": m.get("VIIRS_NOAA20", 0).astype(int),
    "noaa21_cell_days": m.get("VIIRS_NOAA21", 0).astype(int),
    "harmonized_viirs_eq": h.round(1),
    "harmonized_aqua_eq": (h / r_season).round(1),
    "source": src,
})
OUT.parent.mkdir(parents=True, exist_ok=True)
out.to_csv(OUT, index=False)
print(f"\nSaved {len(out)} months to {OUT}")

yearly = out.assign(year=out["month"].str[:4]).groupby("year")["harmonized_viirs_eq"].sum(min_count=1)
print("\nHarmonized yearly totals (VIIRS S-NPP equivalent, daytime cell-days), top 6:")
print(yearly.sort_values(ascending=False).head(6).round(0).to_string())
