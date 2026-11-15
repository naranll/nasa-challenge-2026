"""#39: the committed real world files (public/data/world/) pass the same invariants as the fixtures, and say
"synthetic": false. Runs on the committed JSON only, no raw data needed.
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "fixtures"))

from check_fixtures import check_world  # noqa: E402

REAL_WORLD = ROOT / "public" / "data" / "world"
FIX_WORLD = ROOT / "fixtures" / "world"


def test_committed_real_world_files_pass_the_contract_checks():
    assert check_world(REAL_WORLD, synthetic=False) == []


def test_a_synthetic_world_file_is_refused_in_real_mode(tmp_path):
    world = tmp_path / "world"
    shutil.copytree(FIX_WORLD, world)
    errors = check_world(world, synthetic=False)
    assert any("index.json" in e and "synthetic" in e for e in errors)
    assert any("points_africa.json" in e and "synthetic" in e for e in errors)


def test_the_synthetic_fixtures_still_pass_as_synthetic():
    assert check_world(FIX_WORLD, synthetic=True) == []
