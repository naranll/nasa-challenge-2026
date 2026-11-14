"""Can our Meteomatics account download weather from 2002 to 2026? (PLAN D15 gate, docs/research/meteomatics.md)

Asks for 3 days of daily 2 m temperature at Ulaanbaatar at the start and end of the
period we need. Prints YES only if both requests succeed, otherwise NO with the reason.

    python etl/weather/check_meteomatics.py

Needs METEOMATICS_USER and METEOMATICS_PASSWORD in the environment or in .env (never commit them).
Uses 2 queries of the account's quota.
"""

import os
import sys
from pathlib import Path

import requests

API = "https://api.meteomatics.com"
POINT = "47.92,106.92"  # Ulaanbaatar
PROBES = {
    "start of period (2002-07)": "2002-07-01T00:00:00Z--2002-07-03T00:00:00Z:P1D",
    "end of period (2026-10)": "2026-10-01T00:00:00Z--2026-10-03T00:00:00Z:P1D",
}


def read_credentials() -> tuple[str, str]:
    env_file = Path(__file__).resolve().parents[2] / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            key, sep, value = line.partition("=")
            if sep and key.strip() and not key.lstrip().startswith("#"):
                os.environ.setdefault(key.strip(), value.strip())
    user, password = os.environ.get("METEOMATICS_USER"), os.environ.get("METEOMATICS_PASSWORD")
    if not user or not password:
        sys.exit("NO: METEOMATICS_USER / METEOMATICS_PASSWORD are not set (see .env.example).")
    return user, password


def main() -> int:
    auth = read_credentials()
    ok = True
    for label, period in PROBES.items():
        url = f"{API}/{period}/t_2m:C/{POINT}/json"
        response = requests.get(url, auth=auth, timeout=60)
        if response.ok:
            print(f"ok    {label}: HTTP {response.status_code}")
        else:
            ok = False
            print(f"FAIL  {label}: HTTP {response.status_code} {response.text[:300]}")
    print("YES: the account can download 2002-2026." if ok else "NO: see the failures above.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
