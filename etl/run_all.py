"""Run the pipeline steps in order. Works on any OS.

    python etl/run_all.py              # all steps
    python etl/run_all.py --from clean_hotspots
"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
STEPS = [
    "get_boundaries",   # aimag boundaries (geoBoundaries) -> etl/data/raw/
    "clean_hotspots",   # FIRMS CSVs -> etl/data/processed/hotspots_clean.parquet
    "build_cell_days",  # hotspots -> fire cell-days per aimag and month
    "harmonize_v0",     # Aqua <-> S-NPP ratio + monthly series (prototype)
]

start = 0
if "--from" in sys.argv:
    name = sys.argv[sys.argv.index("--from") + 1]
    if name not in STEPS:
        sys.exit(f"Unknown step '{name}'. Steps: {', '.join(STEPS)}")
    start = STEPS.index(name)

for step in STEPS[start:]:
    print(f"\n=== {step} ===", flush=True)
    result = subprocess.run([sys.executable, str(HERE / f"{step}.py")])
    if result.returncode != 0:
        sys.exit(f"Step '{step}' failed (exit {result.returncode}). Fix it, then: python etl/run_all.py --from {step}")

print("\nAll steps finished.")
