"""
Дэлхийн NRT hotspot-ийг FIRMS Area API-аас татна (2026-11-05 – 2026-11-14) + тивийн хил (Natural Earth).

    python etl/fetch_world_nrt.py

FIRMS_MAP_KEY-г .env эсвэл орчны хувьсагчаас уншина. Key-г хэзээ ч хэвлэхгүй, лог-д бичихгүй.
Гаралт: etl/data/raw/world/{SOURCE}_{DATE}_{DAY_RANGE}.csv, etl/data/raw/ne_110m_admin_0_countries.geojson
Нэгэнт татсан файлыг дахин татахгүй (resumable).
"""
import io
import json
import os
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import requests

# Windows console cp1252 байж болох тул кирилл лог-ийг UTF-8-аар хэвлэнэ.
sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
RAW = HERE / "data" / "raw"
OUT = RAW / "world"
NE_PATH = RAW / "ne_110m_admin_0_countries.geojson"
NE_URL = ("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
          "geojson/ne_110m_admin_0_countries.geojson")

BASE = "https://firms.modaps.eosdis.nasa.gov"
SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"]
START, END = date(2026, 11, 5), date(2026, 11, 14)
# API-ийн баримт (firms.modaps.eosdis.nasa.gov/api/area/): DAY_RANGE = 1..5,
# хүсэлт [DATE .. DATE + DAY_RANGE - 1]-ийг буцаана. Тиймээс 10 хоногийг 5 хоногоор хуваана.
MAX_DAY_RANGE = 5


def load_key():
    # .env-ийг гараар уншина (шинэ сан нэмэхгүй). Утгыг хэзээ ч хэвлэхгүй.
    env_file = HERE.parent / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    key = os.environ.get("FIRMS_MAP_KEY", "")
    if not key:
        sys.exit("FIRMS_MAP_KEY тохируулагдаагүй (.env.example-ийг үз).")
    return key


def chunks(start, end, size):
    """[start, end] хугацааг ≤ size хоногийн хэсгүүдэд хуваана: [(эхний огноо, хоногийн тоо), ...]."""
    out, d = [], start
    while d <= end:
        n = min(size, (end - d).days + 1)
        out.append((d, n))
        d += timedelta(days=n)
    return out


def safe_get(url, what, timeout=180):
    # Алдааны мессежид URL (key агуулдаг) орохгүй байхаар барина.
    for attempt in range(3):
        try:
            r = requests.get(url, timeout=timeout)
            if r.status_code == 200:
                return r
            print(f"  {what}: HTTP {r.status_code} (оролдлого {attempt + 1}/3)")
        except requests.RequestException as e:
            print(f"  {what}: сүлжээний алдаа {type(e).__name__} (оролдлого {attempt + 1}/3)")
        time.sleep(5 * (attempt + 1))
    return None


def check_status(key):
    r = safe_get(f"{BASE}/mapserver/mapkey_status/?MAP_KEY={key}", "mapkey_status", timeout=30)
    if r is None:
        print("MAP_KEY status шалгаж чадсангүй, үргэлжлүүлнэ.")
        return
    try:
        s = r.json()
        print(f"MAP_KEY status: {s.get('current_transactions')} / {s.get('transaction_limit')} "
              f"transaction, интервал {s.get('transaction_interval')}")
    except ValueError:
        print("MAP_KEY status: JSON биш хариу ирлээ (key буруу байж магадгүй).")


def row_note(source, text):
    """CSV-ийн мөрийн тоо. S-NPP хоосон бол алдаа биш гэдгийг тэмдэглэнэ."""
    rows = len(pd.read_csv(io.StringIO(text)))
    note = ""
    if rows == 0 and source == "VIIRS_SNPP_NRT":
        note = " (хүлээгдэж буй: S-NPP-ийн FIRMS data 2026-11-02-нд зогссон, алдаа биш)"
    return f"{rows} мөр{note}"


def fetch_firms(key):
    OUT.mkdir(parents=True, exist_ok=True)
    for source in SOURCES:
        for d, n in chunks(START, END, MAX_DAY_RANGE):
            path = OUT / f"{source}_{d.isoformat()}_{n}.csv"
            if path.exists() and path.stat().st_size > 0:
                print(f"{path.name}: аль хэдийн байна, алгасав · {row_note(source, path.read_text(encoding='utf-8'))}")
                continue
            r = safe_get(f"{BASE}/api/area/csv/{key}/{source}/world/{n}/{d.isoformat()}", f"{source} {d}")
            if r is None:
                print(f"{source} {d}: татаж чадсангүй. Дахин ажиллуулбал үргэлжилнэ.")
                continue
            text = r.text
            # Буруу key / хязгаар хэтэрсэн үед CSV биш текст ирдэг.
            if not text.startswith("latitude"):
                print(f"{source} {d}: CSV биш хариу ирлээ: {text[:80]!r}")
                continue
            path.write_text(text, encoding="utf-8")
            print(f"{path.name}: {row_note(source, text)}")
            time.sleep(2)  # throttle


def fetch_ne():
    if NE_PATH.exists():
        print(f"{NE_PATH.name}: аль хэдийн байна, алгасав")
        return
    r = safe_get(NE_URL, "Natural Earth")
    if r is None:
        sys.exit("Natural Earth-ийн хилийг татаж чадсангүй.")
    gj = r.json()
    assert "CONTINENT" in gj["features"][0]["properties"], "CONTINENT багана алга"
    NE_PATH.write_text(json.dumps(gj), encoding="utf-8")
    print(f"{NE_PATH.name}: {len(gj['features'])} улс")


if __name__ == "__main__":
    key = load_key()
    check_status(key)
    fetch_firms(key)
    fetch_ne()
    check_status(key)
