#!/usr/bin/env python3
"""
A4U Bond Data Fetcher v2.0
--------------------------
काय करतो: data/bonds_config.json वाचतो → NSE वरून ताजा भाव आणतो → data/bonds.json लिहितो.
WordPress चा Bond Dashboard हाच bonds.json वाचतो.

bonds_config.json मधले fields (साध्या भाषेत):
  id             – प्रत्येक bond चं वेगळं छोटं नाव (English, space नको)
  name, type     – पानावर दिसणारं नाव आणि प्रकार (SGB / G-Sec / Corporate AAA ...)
  risk           – low / medium / high
  maturity_date  – पैसे परत मिळण्याची तारीख, YYYY-MM-DD
  liquidity      – low / medium / high (बाजारात विकायला किती सोपं)
  coupon         – वार्षिक व्याज % (G-Sec चा yield मोजायला लागतो)
  yield_note     – yield खाली दिसणारी छोटी टीप (ऐच्छिक)
  tax_note       – कराबद्दल 1 ओळ
  nse_symbol     – NSE वरचं symbol; रिकामं ठेवलं तर manual_price / manual_yield वापरले जातात
  manual_price, manual_yield – NSE नसेल तेव्हा हाताने टाकायचे आकडे (null चालेल → पानावर "—")

Fail-safe: NSE कडून भाव आला नाही तर आधीच्या bonds.json मधला शेवटचा भाव ठेवतो ("stale": true)
आणि (secrets असतील तर) Telegram वर alert पाठवतो. फक्त Python standard library वापरली आहे.
"""
from __future__ import annotations

import datetime as dt
import http.cookiejar
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_FILE = ROOT / "data" / "bonds_config.json"
OUTPUT_FILE = ROOT / "data" / "bonds.json"
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


def make_nse_session() -> urllib.request.OpenerDirector:
    """NSE आधी homepage उघडून cookies देतो; त्याशिवाय API उत्तर देत नाही."""
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    opener.addheaders = [
        ("User-Agent", USER_AGENT),
        ("Accept", "application/json,text/html;q=0.9,*/*;q=0.8"),
        ("Accept-Language", "en-US,en;q=0.9"),
        ("Referer", "https://www.nseindia.com/"),
    ]
    opener.open("https://www.nseindia.com/", timeout=20).read()
    return opener


def fetch_quote(opener: urllib.request.OpenerDirector, symbol: str) -> tuple[float, float]:
    """एका symbol चा शेवटचा भाव आणि दिवसातला % बदल परत देतो."""
    url = "https://www.nseindia.com/api/quote-equity?symbol=" + urllib.parse.quote(symbol)
    with opener.open(url, timeout=20) as resp:
        data = json.load(resp)
    info = data.get("priceInfo") or {}
    price = info.get("lastPrice")
    change = info.get("pChange") or 0
    if not isinstance(price, (int, float)) or price <= 0:
        raise ValueError("price missing in NSE response")
    return float(price), float(change)


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

    low, high = -0.05, 0.50  # yield वाढला की PV कमी होतो → bisection
    for _ in range(100):
        mid = (low + high) / 2
        if present_value(mid) > price:
            low = mid
        else:
            high = mid
    return round((low + high) / 2 * 100, 2)


def notify_telegram(message: str) -> None:
    """Secrets सेट असतील तरच Telegram alert; नसतील तर शांतपणे पुढे."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return
    body = urllib.parse.urlencode({"chat_id": chat_id, "text": message}).encode()
    try:
        urllib.request.urlopen(f"https://api.telegram.org/bot{token}/sendMessage", data=body, timeout=15)
    except Exception as exc:  # alert fail झाला तरी डेटा update थांबवायचा नाही
        print("Telegram alert failed:", exc)


def load_previous() -> dict[str, dict]:
    """आधीचा bonds.json (असल्यास) id नुसार map मध्ये."""
    if not OUTPUT_FILE.exists():
        return {}
    try:
        old = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
        return {b["id"]: b for b in old.get("bonds", []) if "id" in b}
    except (ValueError, KeyError, TypeError):
        return {}


def main() -> int:
    config = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    previous = load_previous()
    now = dt.datetime.now(IST)
    today = now.date()

    opener = None
    if any((b.get("nse_symbol") or "").strip() for b in config.get("bonds", [])):
        try:
            opener = make_nse_session()
        except Exception as exc:
            print("NSE session failed:", exc)

    output: list[dict] = []
    failures: list[str] = []

    for bond in config.get("bonds", []):
        bond_id = bond.get("id", "?")
        try:
            maturity = dt.date.fromisoformat(bond["maturity_date"])
        except (KeyError, ValueError):
            print(f"Skipping {bond_id}: invalid maturity_date")
            continue
        if maturity <= today:
            print(f"Skipping {bond_id}: already matured")
            continue

        price = bond.get("manual_price")
        change = 0.0
        source, stale = "manual", False

        symbol = (bond.get("nse_symbol") or "").strip()
        if symbol:
            try:
                if opener is None:
                    raise RuntimeError("no NSE session")
                price, change = fetch_quote(opener, symbol)
                source = "live"
                time.sleep(1)  # NSE वर ताण नको
            except Exception as exc:
                failures.append(f"{bond_id} ({symbol}): {exc}")
                old = previous.get(bond_id)
                if old and old.get("price") is not None:
                    price = old["price"]
                    change = old.get("change", 0.0)
                    source = old.get("source", "manual")
                    stale = True

        coupon = bond.get("coupon")
        if bond.get("type") == "G-Sec" and price and coupon:
            bond_yield = ytm_percent(float(price), float(coupon), maturity, today)
        elif bond.get("type") == "SGB" and coupon:
            bond_yield = float(coupon)
        else:
            bond_yield = bond.get("manual_yield")

        output.append({
            "id": bond_id,
            "name": bond.get("name", bond_id),
            "type": bond.get("type", ""),
            "risk": bond.get("risk", "medium"),
            "maturity_date": bond["maturity_date"],
            "liquidity": bond.get("liquidity", "medium"),
            "price": price,
            "change": round(float(change), 2),
            "yield": bond_yield,
            "yield_note": bond.get("yield_note", ""),
            "tax_note": bond.get("tax_note", ""),
            "source": source,
            "stale": stale,
        })

    payload = {"generated_at": now.isoformat(timespec="seconds"), "bonds": output}
    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(output)} bonds to {OUTPUT_FILE.name}; fetch failures: {len(failures)}")

    if failures:
        for line in failures:
            print(" -", line)
        notify_telegram("⚠️ Bond data: NSE price fetch failed for:\n" + "\n".join(failures))
    return 0


if __name__ == "__main__":
    sys.exit(main())
