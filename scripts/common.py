#!/usr/bin/env python3
"""
A4U Bond scripts — सामायिक मदत (common helpers)
------------------------------------------------
तिन्ही scripts (fetch_market / fetch_bonds / fetch_corp_bonds) हीच file वापरतात,
म्हणजे download, JSON, Telegram यातली दुरुस्ती एकाच ठिकाणी करावी लागते.

  - fetch_file(): एकाच run मध्ये तीच file (उदा. NSE bhavcopy) परत-परत download होत नाही.
  - फक्त Python standard library.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
BROWSER = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}
NSE_REF = "https://www.nseindia.com/"
BSE_REF = "https://www.bseindia.com/"
DL_CACHE = Path(os.environ.get("A4U_DL_CACHE", Path(tempfile.gettempdir()) / "a4u_dl"))


def nse_cm_url(day: dt.date) -> str:
    return f"https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_{day:%Y%m%d}_F_0000.csv.zip"


def bse_debt_url(day: dt.date) -> str:
    return f"https://www.bseindia.com/download/Bhavcopy/Debt/DEBTBHAVCOPY{day:%d%m%Y}.zip"


def http_get(url: str, referer: str, accept: str = "*/*", timeout: int = 40, retries: int = 0) -> tuple[int, bytes]:
    """(status, bytes). network चूक → (0, b""). retries: फक्त network चूक / 5xx साठी पुन्हा प्रयत्न."""
    headers = dict(BROWSER, Accept=accept, Referer=referer)
    st, raw = 0, b""
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=timeout) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as exc:
            st, raw = exc.code, b""
            if st < 500:
                break
        except Exception:
            st, raw = 0, b""
        if attempt < retries:
            time.sleep(2 * (attempt + 1))
    return st, raw


def fetch_file(url: str, referer: str) -> bytes | None:
    """File आणतो (200 असेल तरच). त्याच run मध्ये दुसऱ्यांदा मागितली तर disk वरून देतो."""
    DL_CACHE.mkdir(parents=True, exist_ok=True)
    path = DL_CACHE / hashlib.sha1(url.encode()).hexdigest()
    if path.exists() and time.time() - path.stat().st_mtime < 6 * 3600:
        return path.read_bytes()
    st, raw = http_get(url, referer, retries=1)
    if st != 200 or not raw:
        return None
    path.write_bytes(raw)
    return raw


def fnum(v) -> float | None:
    try:
        return float(str(v).replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def load_json(path: Path, default):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def write_json(path: Path, obj, indent: int | None = None) -> None:
    """indent=None → छोटी (एका ओळीत) file; indent दिला तर वाचायला सोपी."""
    if indent is None:
        text = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    else:
        text = json.dumps(obj, ensure_ascii=False, indent=indent) + "\n"
    Path(path).write_text(text, encoding="utf-8")


def notify(msg: str) -> None:
    """Telegram वर संदेश (secrets नसतील तर शांतपणे काहीच करत नाही)."""
    token, chat = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat:
        return
    try:
        urllib.request.urlopen(f"https://api.telegram.org/bot{token}/sendMessage",
                               data=urllib.parse.urlencode({"chat_id": chat, "text": msg}).encode(), timeout=15)
    except Exception as exc:
        print("Telegram alert failed:", exc)
