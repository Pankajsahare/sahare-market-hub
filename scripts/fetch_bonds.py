#!/usr/bin/env python3
"""
A4U Bond Data Fetcher v2.1 — पूर्ण automatic
--------------------------------------------
काय करतो:
  1. NSE ची दररोजची bhavcopy (सगळ्या व्यवहारांची अधिकृत CSV) download करतो;
     NSE मिळाली नाही तर BSE ची. मागच्या 7 दिवसांतली सगळ्यात नवीन file घेतो.
  2. त्यातून सगळे SGB आणि G-Secs आपोआप शोधतो.
  3. सगळ्यात जास्त व्यवहार झालेले निवडतो (SGB: प्रत्येक maturity वर्षाचा 1; G-Sec: top N).
  4. G-Sec चा अंदाजे yield मोजतो → data/bonds.json लिहितो (WordPress हाच वाचतो).

Settings: data/bonds_config.json
  max_sgb          – जास्तीत जास्त किती SGB दाखवायचे
  max_gsec         – जास्तीत जास्त किती G-Secs दाखवायचे
  min_years_left   – यापेक्षा कमी कालावधी उरलेले बाँड वगळायचे (वर्षात)
  gsec_min_years_left – G-Sec साठी वेगळी मर्यादा (जवळच्या maturity चा yield अविश्वसनीय असतो)
  exclude_symbols  – कधीच दाखवायचे नाहीत असे symbols, उदा. ["SGBNOV26"]

Fail-safe: दोन्ही स्रोत fail झाले तर आधीचा bonds.json तसाच ठेवतो ("stale": true)
आणि Telegram alert पाठवतो. फक्त Python standard library वापरली आहे.
"""
from __future__ import annotations

import csv
import datetime as dt
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_FILE = ROOT / "data" / "bonds_config.json"
OUTPUT_FILE = ROOT / "data" / "bonds.json"
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
LOOKBACK_DAYS = 7

BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}
SOURCES = [
    ("NSE", "https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_{ymd}_F_0000.csv.zip",
     "https://www.nseindia.com/"),
    ("BSE", "https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_{ymd}_F_0000.CSV",
     "https://www.bseindia.com/"),
]
MONTHS = {m: i for i, m in enumerate(
    ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], start=1)}
GSEC_RE = re.compile(r"^(\d{3,4})GS(20\d{2})[A-Z]?$")
SGB_RE = re.compile(r"^SGB([A-Z]*?)(\d{2})")

try:
    GSEC_MATURITY = json.loads((ROOT / "data" / "bond_market.json").read_text(encoding="utf-8")).get("gsecMaturity", {})
except (OSError, ValueError):
    GSEC_MATURITY = {}

SGB_TAX = "Interest taxable at slab rate; capital gains on redemption at maturity exempt for individuals"
GSEC_TAX = "Interest taxable at slab rate; LTCG (listed, held over 12 months) at 12.5%"


# ---------- download ----------
def download(url: str, referer: str) -> bytes | None:
    """File आणतो; 404/403/timeout झाल्यास None."""
    headers = dict(BROWSER_HEADERS, Referer=referer)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=40) as resp:
            return resp.read() if resp.status == 200 else None
    except Exception:
        return None


def parse_csv(raw: bytes, is_zip: bool) -> list[dict]:
    if is_zip:
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            raw = z.read(z.namelist()[0])
    text = raw.decode("utf-8", "replace")
    return [{(k or "").strip(): (v or "").strip() for k, v in row.items()}
            for row in csv.DictReader(io.StringIO(text))]


def latest_bhavcopy(today: dt.date) -> tuple[str, dt.date, list[dict]] | None:
    """आजपासून मागे जात सगळ्यात नवीन bhavcopy शोधतो (आधी NSE, मग BSE)."""
    for back in range(LOOKBACK_DAYS + 1):
        day = today - dt.timedelta(days=back)
        if day.weekday() >= 5:  # शनिवार/रविवार बाजार बंद
            continue
        ymd = day.strftime("%Y%m%d")
        for name, pattern, referer in SOURCES:
            url = pattern.format(ymd=ymd)
            raw = download(url, referer)
            if not raw:
                continue
            try:
                rows = parse_csv(raw, url.endswith(".zip"))
            except Exception as exc:
                print(f"{name} {ymd}: parse failed: {exc}")
                continue
            if rows and "ClsPric" in rows[0]:
                return name, day, rows
    return None


# ---------- helpers ----------
def to_float(value: str) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def liquidity_from_turnover(turnover_inr: float) -> str:
    if turnover_inr >= 1_00_00_000:   # ≥ ₹1 कोटी
        return "high"
    if turnover_inr >= 5_00_000:      # ≥ ₹5 लाख
        return "medium"
    return "low"


def ytm_percent(price: float, coupon: float, maturity: dt.date, today: dt.date) -> float | None:
    """G-Sec चा अंदाजे yield-to-maturity (दर 6 महिन्यांनी व्याज, face value 100)."""
    years = (maturity - today).days / 365.25
    if years <= 0 or price <= 0:
        return None
    periods = max(1, round(years * 2))
    half_coupon = coupon / 2

    def present_value(y: float) -> float:
        r = y / 2
        return sum(half_coupon / (1 + r) ** k for k in range(1, periods + 1)) + 100 / (1 + r) ** periods

    low, high = -0.05, 0.50
    for _ in range(100):
        mid = (low + high) / 2
        if present_value(mid) > price:
            low = mid
        else:
            high = mid
    return round((low + high) / 2 * 100, 2)


def base_record(row: dict) -> dict | None:
    """एका ओळीतून भाव, बदल, उलाढाल काढतो."""
    close = to_float(row.get("ClsPric"))
    if not close or close <= 0:
        return None
    prev = to_float(row.get("PrvsClsgPric"))
    change = round((close - prev) / prev * 100, 2) if prev and prev > 0 else 0.0
    turnover = to_float(row.get("TtlTrfVal")) or 0.0
    return {"price": round(close, 2), "change": change, "turnover": turnover}


# ---------- SGB / G-Sec ओळखणे ----------
def parse_sgb(row: dict, today: dt.date) -> dict | None:
    symbol = row.get("TckrSymb", "").upper()
    m = SGB_RE.match(symbol)
    if not m:
        return None
    year = 2000 + int(m.group(2))
    month_code = m.group(1)[:3]
    month = MONTHS.get(month_code, 6)  # महिना symbol मध्ये नसेल तर जून गृहीत (±6 महिने)
    maturity = dt.date(year, month, 15)
    rec = base_record(row)
    if not rec:
        return None
    label = maturity.strftime("%b %Y") if month_code in MONTHS else str(year)
    rec.update({
        "id": "sgb-" + symbol.lower(),
        "symbol": symbol,
        "name": f"SGB {label} ({symbol})",
        "type": "SGB",
        "risk": "low",
        "maturity": maturity,
        "yield": None,
        "yield_note": "2.50% p.a. on issue price + gold price change",
        "tax_note": SGB_TAX,
    })
    return rec


def parse_gsec(row: dict, today: dt.date) -> dict | None:
    symbol = row.get("TckrSymb", "").upper()
    m = GSEC_RE.match(symbol)
    if not m:
        return None
    coupon = int(m.group(1)) / 100
    year = int(m.group(2))
    exact = GSEC_MATURITY.get(f"{coupon:.2f}-{year}")  # fetch_market.py ने BSE WDM मधून आणलेली नेमकी तारीख
    maturity = dt.date.fromisoformat(exact) if exact else dt.date(year, 6, 30)  # नसेल तर मध्य-वर्ष गृहीत
    rec = base_record(row)
    if not rec:
        return None
    # कमी व्यवहार / जवळची maturity असेल तर yield विचित्र येतो → 3%–12% बाहेर असेल तर दाखवत नाही
    est = ytm_percent(rec["price"], coupon, maturity, today)
    rec["yield"] = est if est is not None and 3.0 <= est <= 12.0 else None
    rec.update({
        "id": "gs-" + symbol.lower(),
        "symbol": symbol,
        "name": f"{coupon:.2f}% GS {year}",
        "type": "G-Sec",
        "risk": "low",
        "maturity": maturity,
        "yield_note": "Approx. yield to maturity" if not exact else "Yield to maturity (indicative)",
        "tax_note": GSEC_TAX,
    })
    return rec


def select_bonds(rows: list[dict], cfg: dict, today: dt.date) -> list[dict]:
    exclude = {s.upper() for s in cfg.get("exclude_symbols", [])}
    min_left = float(cfg.get("min_years_left", 0.25))

    def usable(rec: dict | None) -> bool:
        return bool(rec) and rec["symbol"] not in exclude and \
            (rec["maturity"] - today).days / 365.25 >= min_left and rec["turnover"] > 0

    sgbs = [r for r in (parse_sgb(x, today) for x in rows) if usable(r)]
    gsec_min_left = float(cfg.get("gsec_min_years_left", 1.0))
    gsecs = [r for r in (parse_gsec(x, today) for x in rows)
             if usable(r) and (r["maturity"] - today).days / 365.25 >= gsec_min_left]

    # SGB: प्रत्येक maturity वर्षाचा सगळ्यात जास्त उलाढालीचा एक
    best_per_year: dict[int, dict] = {}
    for r in sgbs:
        y = r["maturity"].year
        if y not in best_per_year or r["turnover"] > best_per_year[y]["turnover"]:
            best_per_year[y] = r
    chosen_sgb = sorted(best_per_year.values(), key=lambda r: r["maturity"])[: int(cfg.get("max_sgb", 6))]

    # G-Sec: एकाच symbol चे duplicates टाळून top उलाढाल
    unique: dict[str, dict] = {}
    for r in gsecs:
        if r["symbol"] not in unique or r["turnover"] > unique[r["symbol"]]["turnover"]:
            unique[r["symbol"]] = r
    top_gsec = sorted(unique.values(), key=lambda r: r["turnover"], reverse=True)[: int(cfg.get("max_gsec", 6))]
    chosen_gsec = sorted(top_gsec, key=lambda r: r["maturity"])

    return chosen_sgb + chosen_gsec


def to_output(rec: dict) -> dict:
    return {
        "id": rec["id"],
        "symbol": rec["symbol"],
        "name": rec["name"],
        "type": rec["type"],
        "risk": rec["risk"],
        "maturity_date": rec["maturity"].isoformat(),
        "liquidity": liquidity_from_turnover(rec["turnover"]),
        "price": rec["price"],
        "change": rec["change"],
        "yield": rec["yield"],
        "yield_note": rec["yield_note"],
        "tax_note": rec["tax_note"],
        "source": "live",
        "stale": False,
    }


# ---------- alert ----------
def notify_telegram(message: str) -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return
    body = urllib.parse.urlencode({"chat_id": chat_id, "text": message}).encode()
    try:
        urllib.request.urlopen(f"https://api.telegram.org/bot{token}/sendMessage", data=body, timeout=15)
    except Exception as exc:
        print("Telegram alert failed:", exc)


def keep_previous(reason: str) -> int:
    """नवीन डेटा नाही → जुना डेटा "stale" म्हणून ठेवतो."""
    print("No fresh data:", reason)
    if OUTPUT_FILE.exists():
        try:
            old = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
            for b in old.get("bonds", []):
                b["stale"] = True
            OUTPUT_FILE.write_text(json.dumps(old, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        except (ValueError, TypeError) as exc:
            print("Could not mark old data stale:", exc)
    notify_telegram(f"⚠️ Bond data not updated: {reason}. Website shows last available prices.")
    return 0


def main() -> int:
    cfg = json.loads(CONFIG_FILE.read_text(encoding="utf-8")) if CONFIG_FILE.exists() else {}
    today = dt.datetime.now(IST).date()

    found = latest_bhavcopy(today)
    if not found:
        return keep_previous(f"no NSE/BSE bhavcopy found in last {LOOKBACK_DAYS} days")
    source, trade_day, rows = found
    print(f"Using {source} bhavcopy for {trade_day} ({len(rows)} rows)")

    chosen = select_bonds(rows, cfg, today)
    if not chosen:
        return keep_previous(f"{source} file for {trade_day} had no usable SGB/G-Sec rows (format change?)")

    payload = {
        "generated_at": f"{trade_day.isoformat()}T15:30:00+05:30",  # भाव = त्या दिवसाचा closing
        "source": f"{source} bhavcopy",
        "bonds": [to_output(r) for r in chosen],
    }
    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(chosen)} bonds:")
    for r in chosen:
        print(f"  {r['symbol']:<12} ₹{r['price']:>10.2f}  yield={r['yield']}  maturity={r['maturity']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
