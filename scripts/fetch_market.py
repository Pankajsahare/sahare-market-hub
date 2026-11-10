#!/usr/bin/env python3
"""
A4U Bond Market Snapshot v1.0
-----------------------------
काय करतो (रोज):
  1. BSE WDM (G-Sec व्यवहार, नेमक्या maturity तारखांसह) + NSE CM bhavcopy (GS series) मधून
     G-Secs चे भाव घेतो → प्रत्येकाचा YTM → yield curve (1Y ते 40Y).
  2. NSDL India Bond Info मधून बाजाराचे आकडे: नवीन issues, लवकर maturity होणारे bonds,
     एकूण outstanding bonds (फक्त 5 requests).
  3. data/market_config.json मधले RBI policy rates + CPI (हे क्वचित बदलतात → तिथे हाताने 1 ओळ).
  4. data/bond_market.json लिहितो. G-Sec च्या नेमक्या maturity तारखा पण इथे ठेवतो,
     ज्या fetch_bonds.py वापरतो.
"""
from __future__ import annotations

import csv
import datetime as dt
import io
import json
import re
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_FILE = ROOT / "data" / "bond_market.json"
CONFIG_FILE = ROOT / "data" / "market_config.json"
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
BROWSER = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}
TENORS = [1, 2, 3, 5, 7, 10, 15, 20, 30, 40]
GS_RE = re.compile(r"^(\d{3,4})GS(20\d{2})[A-Z]?$")
WDM_DESC_RE = re.compile(r"^(\d+(?:\.\d+)?)\s*(?:%\s*)?(?:GOI|GS)\s*(20\d{2})", re.I)


def http_get(url: str, referer: str, accept: str = "*/*") -> tuple[int, bytes]:
    try:
        req = urllib.request.Request(url, headers=dict(BROWSER, Accept=accept, Referer=referer))
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as exc:
        return exc.code, b""
    except Exception:
        return 0, b""


def fnum(v):
    try:
        return float(str(v).replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def ytm_semi(price: float, coupon: float, maturity: dt.date, today: dt.date) -> float | None:
    """G-Sec: दर 6 महिन्यांनी व्याज, clean price + accrued interest."""
    years = (maturity - today).days / 365.25
    if years <= 0.05 or not price:
        return None
    periods = years * 2
    n_full = int(periods - 1e-9)
    t_next = periods - n_full
    target = price + coupon / 2 * (1 - t_next)

    def pv(y):
        r = y / 2
        tot, k = 0.0, t_next
        while k <= periods + 1e-9:
            tot += (coupon / 2) / (1 + r) ** k
            k += 1
        return tot + 100 / (1 + r) ** periods

    lo, hi = -0.05, 0.5
    for _ in range(90):
        mid = (lo + hi) / 2
        if pv(mid) > target:
            lo = mid
        else:
            hi = mid
    y = (lo + hi) / 2 * 100
    return round(y, 3)


def latest_files(today: dt.date):
    """सगळ्यात नवीन BSE debt zip (WDM) आणि NSE CM bhavcopy."""
    wdm, nse, day_used = [], [], None
    for back in range(8):
        day = today - dt.timedelta(days=back)
        if day.weekday() >= 5:
            continue
        if not wdm:
            st, raw = http_get(f"https://www.bseindia.com/download/Bhavcopy/Debt/DEBTBHAVCOPY{day:%d%m%Y}.zip",
                               "https://www.bseindia.com/")
            if st == 200 and raw.startswith(b"PK"):
                with zipfile.ZipFile(io.BytesIO(raw)) as z:
                    for n in z.namelist():
                        if n.lower().startswith("wdm"):
                            wdm = [{(k or "").strip(): (v or "").strip() for k, v in r.items()}
                                   for r in csv.DictReader(io.StringIO(z.read(n).decode("utf-8", "replace")))]
                            for r in wdm:
                                r["_day"] = day.isoformat()
        if not nse:
            st, raw = http_get(f"https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_{day:%Y%m%d}_F_0000.csv.zip",
                               "https://www.nseindia.com/")
            if st == 200 and raw.startswith(b"PK"):
                with zipfile.ZipFile(io.BytesIO(raw)) as z:
                    rows = csv.DictReader(io.StringIO(z.read(z.namelist()[0]).decode("utf-8", "replace")))
                    nse = [r for r in rows if (r.get("SctySrs") or "").strip() == "GS"]
                    for r in nse:
                        r["_day"] = day.isoformat()
                day_used = max(day_used or "", day.isoformat())
        if wdm and nse:
            break
    return wdm, nse, day_used


def gsec_list(wdm: list[dict], nse: list[dict], today: dt.date):
    maturities: dict[str, str] = {}   # "7.18-2033" → exact date
    bonds: list[dict] = []
    for r in wdm:
        desc = r.get("Security Description", "")
        m = WDM_DESC_RE.match(desc)
        mat = r.get("MaturityDate", "")
        try:
            mdate = dt.datetime.strptime(mat, "%d/%m/%Y").date()
        except ValueError:
            continue
        if not m:
            continue
        coupon = fnum(r.get("Coupon Rate (%)")) or float(m.group(1))
        maturities[f"{coupon:.2f}-{mdate.year}"] = mdate.isoformat()
        price = fnum(r.get("Close Price"))
        turnover = (fnum(r.get("Total Trade Turnover (Rs. Lakh)")) or 0) * 1e5
        y = ytm_semi(price, coupon, mdate, today) if price else None
        if y and 3 < y < 12:
            bonds.append({"name": f"{coupon:.2f}% GS {mdate.year}", "coupon": coupon, "maturity": mdate.isoformat(),
                          "price": price, "ytm": y, "turnover": turnover, "src": "BSE", "day": r["_day"]})
    for r in nse:
        sym = (r.get("TckrSymb") or "").strip().upper()
        m = GS_RE.match(sym)
        if not m:
            continue
        coupon, year = int(m.group(1)) / 100, int(m.group(2))
        key = f"{coupon:.2f}-{year}"
        mat = maturities.get(key)
        exact = bool(mat)
        mdate = dt.date.fromisoformat(mat) if mat else dt.date(year, 6, 30)
        price = fnum(r.get("ClsPric"))
        turnover = fnum(r.get("TtlTrfVal")) or 0
        y = ytm_semi(price, coupon, mdate, today) if price else None
        if y and 3 < y < 12 and turnover > 0:
            bonds.append({"name": f"{coupon:.2f}% GS {year}", "symbol": sym, "coupon": coupon,
                          "maturity": mdate.isoformat(), "exactMaturity": exact, "price": price, "ytm": y,
                          "turnover": turnover, "src": "NSE", "day": r["_day"]})
    return bonds, maturities


def curve_points(bonds: list[dict], today: dt.date) -> list[dict]:
    """प्रत्येक tenor साठी जवळच्या maturity चे bonds; उलाढालीनुसार भारित सरासरी yield."""
    for b in bonds:
        b["years"] = (dt.date.fromisoformat(b["maturity"]) - today).days / 365.25
    ys = sorted(b["ytm"] for b in bonds)
    med = ys[len(ys) // 2] if ys else 0
    # कमी व्यवहार / maturity जवळ असलेल्या bonds चे विचित्र yields वगळतो
    bonds = [b for b in bonds if b["years"] >= 0.75 and abs(b["ytm"] - med) <= 1.5]
    pts = []
    for t in TENORS:
        near = [b for b in bonds if abs(b["years"] - t) <= max(0.6, t * 0.18)]
        if not near:
            continue
        w = sum(max(b["turnover"], 1) for b in near)
        y = sum(b["ytm"] * max(b["turnover"], 1) for b in near) / w
        pts.append({"t": t, "label": f"{t}Y", "ytm": round(y, 2), "n": len(near),
                    "bonds": list(dict.fromkeys(b["name"] for b in sorted(near, key=lambda x: -x["turnover"])))[:3]})
    return pts


def nsdl_market() -> dict:
    base = "https://www.indiabondinfo.nsdl.com/bds-service/v1/public/bdsinfo/"
    out = {}
    for key in ["outstandingbondsinfo", "newbondissues", "dueforredemption", "currentissuance", "previousissuance"]:
        time.sleep(0.6)
        st, raw = http_get(base + key, "https://www.indiabondinfo.nsdl.com/", "application/json, text/plain, */*")
        if st == 200:
            try:
                out[key] = json.loads(raw.decode("utf-8", "replace"))
            except ValueError:
                pass
    return out


def tidy_list(rows, limit=25):
    out = []
    for r in rows or []:
        def d(s):
            try:
                return dt.datetime.strptime(s, "%d-%m-%Y").date().isoformat()
            except (TypeError, ValueError):
                return None
        out.append({"isin": r.get("isin"), "issuer": (r.get("companyName") or "").title(),
                    "sizeCr": fnum(r.get("issueSize")), "allotted": d(r.get("allotmentDate")),
                    "maturity": d(r.get("maturityDate"))})
    return out[:limit]


def main() -> int:
    today = dt.datetime.now(IST).date()
    prev = {}
    try:
        prev = json.loads(OUT_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        pass
    cfg = {}
    try:
        cfg = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        pass

    wdm, nse, day = latest_files(today)
    bonds, maturities = gsec_list(wdm, nse, today)
    pts = curve_points(bonds, today) if bonds else prev.get("curve", [])
    print(f"G-Secs priced: {len(bonds)}; curve points: {len(pts)}; exact maturities: {len(maturities)}")

    nm = nsdl_market()
    info = nm.get("outstandingbondsinfo") or {}
    payload = {
        "updated": dt.datetime.now(IST).isoformat(timespec="minutes"),
        "pricesAsOf": day or prev.get("pricesAsOf"),
        "curve": pts,
        "gsecs": sorted(bonds, key=lambda b: b["maturity"])[:80] if bonds else prev.get("gsecs", []),
        "gsecMaturity": {**prev.get("gsecMaturity", {}), **maturities},
        "policy": cfg.get("policy"),
        "inflation": cfg.get("inflation"),
        "nsdl": {
            "quarter": info.get("currentQuarter"),
            "outstandingBonds": fnum(info.get("noOfTotalOutstandingBonds")),
            "outstandingCr": fnum(info.get("totalOutstandingAmount")),
            "issuesInQuarter": fnum(info.get("noOfIssues")),
            "issuedCr": fnum(info.get("issueAmount")),
            "redemptionsInQuarter": fnum(info.get("noOfRedemptions")),
            "newIssues": tidy_list(nm.get("newbondissues")),
            "maturingSoon": tidy_list(nm.get("dueforredemption")),
        } if nm else prev.get("nsdl"),
    }
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    for p in pts:
        print(f"  {p['label']:>4}  {p['ytm']:.2f}%  ({p['n']} bonds)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
