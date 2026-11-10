#!/usr/bin/env python3
"""
A4U Corporate Bond Fetcher v1.0
-------------------------------
काय करतो (रोज):
  1. BSE debt bhavcopy (fgroup + ICDM) आणि NSE CM bhavcopy मधले NCD/bonds चे भाव आणतो.
  2. मागच्या 30 दिवसांत व्यवहार झालेले सगळे bonds ठेवतो ("last traded" तारखेसह).
  3. NSDL India Bond Info मधून प्रत्येक bond ची माहिती जोडतो:
       ratings, outlook, PSU/private, sector, tax-free, secured, perpetual, guarantee,
       interest किती वेळा, पुढचं पेमेंट, call/put, default, offer documents, trustee.
  4. data/corp_bonds.json लिहितो (WordPress चं Bond Centre हाच वाचतो).

NSDL ला त्रास नको म्हणून:
  - bond ची कायमची माहिती (instrument, coupon, documents...) फक्त एकदाच आणतो → data/nsdl_cache.json
  - ratings + default स्थिती दर 7 दिवसांनी पुन्हा तपासतो
  - प्रत्येक request मध्ये ~0.6 सेकंदांचं अंतर, एका run मध्ये जास्तीत जास्त MAX_NSDL_CALLS
    (उरलेलं काम पुढच्या दिवशीच्या run मध्ये आपोआप पूर्ण होतं)

फक्त Python standard library वापरली आहे.
"""
from __future__ import annotations

import csv
import datetime as dt
import io
import json
import os
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_FILE = ROOT / "data" / "corp_bonds.json"
CACHE_FILE = ROOT / "data" / "nsdl_cache.json"
SCHED_FILE = ROOT / "data" / "corp_schedules.json"
PRICE_FILE = ROOT / "data" / "corp_prices.json"   # 90 दिवसांचा भाव-इतिहास (chart साठी)
HIST_FILE = ROOT / "data" / "corp_history.json"     # प्रत्येक bond चे रोजचे व्यवहार (liquidity साठी)   # प्रत्येक bond चं पुढचं payout schedule (पान गरजेनुसार वाचतं)
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))

KEEP_DAYS = 30            # इतक्या दिवसांत व्यवहार झालेले bonds यादीत ठेवायचे
RATING_REFRESH_DAYS = 7   # ratings किती दिवसांनी पुन्हा तपासायचे
MAX_NSDL_CALLS = int(os.environ.get("MAX_NSDL_CALLS", "2400"))
MAX_NSDL_SECONDS = int(os.environ.get("MAX_NSDL_SECONDS", "1800"))  # एका run मध्ये NSDL ला जास्तीत जास्त 30 मिनिटं
NSDL_DELAY = 0.6
NSDL_WORKERS = 3          # एकाच वेळी जास्तीत जास्त 3 requests (NSDL वर ताण नको)
HIGH_YIELD = 14.0

BROWSER = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}
NSDL_BASE = "https://www.indiabondinfo.nsdl.com/bds-service/v1/public/"
DEBT_TYPES = ("07", "08", "09")  # ISIN मधले 8-9 वे अक्षर: debentures / bonds
RANK = ["AAA", "AA+", "AA", "AA-", "A+", "A", "A-", "BBB+", "BBB", "BBB-",
        "BB+", "BB", "BB-", "B+", "B", "B-", "C", "D"]


# ---------------- साधी मदत ----------------
def http_get(url: str, referer: str, accept: str = "*/*", timeout: int = 40) -> tuple[int, bytes]:
    headers = dict(BROWSER, Accept=accept, Referer=referer)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as exc:
        return exc.code, b""
    except Exception:
        return 0, b""


def fnum(v) -> float | None:
    try:
        x = float(str(v).replace(",", "").strip())
        return x
    except (TypeError, ValueError):
        return None


def pdate(s: str | None) -> str | None:
    """dd-mm-yyyy / dd/mm/yyyy / yyyy-mm-dd → yyyy-mm-dd."""
    if not s:
        return None
    s = str(s).strip()
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%b-%Y", "%d %b %Y"):
        try:
            return dt.datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def is_debt_isin(isin: str) -> bool:
    return len(isin) == 12 and isin.startswith("INE") and isin[7:9] in DEBT_TYPES


def ytm_pct(price100: float, coupon: float, years: float, freq: int) -> float | None:
    """Clean price (per ₹100) वरून अंदाजे YTM; accrued interest धरून."""
    if not (price100 and price100 > 0 and years and years > 0):
        return None
    f = freq if freq and freq > 0 else 1
    periods_left = years * f
    n_full = int(periods_left - 1e-9)
    t_next = periods_left - n_full                     # पुढच्या कूपनपर्यंतचा भाग (periods मध्ये)
    accrued = coupon / f * (1 - t_next)
    target = price100 + accrued

    def pv(y: float) -> float:
        r = y / f
        total = 0.0
        k = t_next
        while k <= periods_left + 1e-9:
            total += (coupon / f) / (1 + r) ** k
            k += 1
        return total + 100 / (1 + r) ** periods_left

    lo, hi = -0.5, 1.5
    for _ in range(90):
        mid = (lo + hi) / 2
        if pv(mid) > target:
            lo = mid
        else:
            hi = mid
    y = (lo + hi) / 2 * 100
    return round(y, 2) if -5 < y < 60 else None


# ---------------- 1. भाव: BSE + NSE ----------------
def bse_debt(day: dt.date) -> list[dict]:
    url = f"https://www.bseindia.com/download/Bhavcopy/Debt/DEBTBHAVCOPY{day:%d%m%Y}.zip"
    st, raw = http_get(url, "https://www.bseindia.com/")
    if st != 200 or not raw.startswith(b"PK"):
        return []
    out: list[dict] = []
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        for name in z.namelist():
            text = z.read(name).decode("utf-8", "replace")
            rows = [{(k or "").strip(): (v or "").strip() for k, v in r.items()}
                    for r in csv.DictReader(io.StringIO(text))]
            low = name.lower()
            if low.startswith("icdm"):
                for r in rows:
                    isin = r.get("ISIN No.", "").upper()
                    if not is_debt_isin(isin):
                        continue
                    price = fnum(r.get("Weighted Average Price")) or fnum(r.get("LTP"))
                    out.append({
                        "isin": isin, "name": r.get("Issuer Name", ""),
                        "coupon": fnum(r.get("Coupon (%)")),
                        "maturity": pdate(r.get("Maturity Date")),
                        "price100": price, "yield": fnum(r.get("Weighted Average Yield")),
                        "face": fnum(r.get("Face Value")),
                        "turnover": (fnum(r.get("Turnover (Rs. Lakh)")) or 0) * 1e5,
                        "trades": 1,
                        "exch": "BSE", "day": day.isoformat(),
                    })
            elif low.startswith("fgroup"):
                for r in rows:
                    isin = r.get("ISIN No.", "").upper()
                    if not is_debt_isin(isin):
                        continue
                    face = fnum(r.get("FACE VALUE"))
                    close = fnum(r.get("Close Price"))
                    out.append({
                        "isin": isin, "name": r.get("sc_name", ""),
                        "coupon": fnum(r.get("COUP0N (%)")),
                        "maturity": pdate(r.get("Maturity Date")),
                        "price100": (close / face * 100) if close and face else None,
                        "price_unit": close, "yield": None, "face": face,
                        "turnover": fnum(r.get("Total Turnover")) or 0,
                        "trades": int(fnum(r.get("Number of Trades")) or 0),
                        "exch": "BSE", "day": day.isoformat(),
                    })
    return out


def nse_cm(day: dt.date) -> list[dict]:
    url = f"https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_{day:%Y%m%d}_F_0000.csv.zip"
    st, raw = http_get(url, "https://www.nseindia.com/")
    if st != 200 or not raw.startswith(b"PK"):
        return []
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        text = z.read(z.namelist()[0]).decode("utf-8", "replace")
    out = []
    for r in csv.DictReader(io.StringIO(text)):
        isin = (r.get("ISIN") or "").strip().upper()
        if not is_debt_isin(isin):
            continue
        close = fnum(r.get("ClsPric"))
        out.append({
            "isin": isin, "name": (r.get("FinInstrmNm") or "").strip(),
            "coupon": None, "maturity": None, "price100": None, "price_unit": close,
            "yield": None, "face": None, "turnover": fnum(r.get("TtlTrfVal")) or 0,
            "trades": int(fnum(r.get("TtlNbOfTxsExctd")) or 0),
            "exch": "NSE", "day": day.isoformat(),
        })
    return out


def collect_trades(today: dt.date) -> tuple[list[dict], str | None]:
    """मागच्या 7 दिवसांतली सगळ्यात नवीन BSE/NSE files."""
    trades: list[dict] = []
    latest = None
    found_bse = found_nse = False
    for back in range(8):
        day = today - dt.timedelta(days=back)
        if day.weekday() >= 5:
            continue
        if not found_bse:
            b = bse_debt(day)
            if b:
                trades += b
                found_bse = True
                latest = max(latest or "", day.isoformat())
        if not found_nse:
            n = nse_cm(day)
            if n:
                trades += n
                found_nse = True
                latest = max(latest or "", day.isoformat())
        if found_bse and found_nse:
            break
    print(f"Trades: {len(trades)} rows (BSE={found_bse}, NSE={found_nse}), latest file {latest}")
    return trades, latest


# ---------------- 2. NSDL ----------------
class Nsdl:
    def __init__(self, budget: int):
        self.budget = budget
        self.calls = 0
        self.errors = 0
        self.started = time.monotonic()
        self.lock = threading.Lock()

    def get(self, path: str, isin: str | None = None):
        """JSON परत देतो; 400 = "No Record" → {}; network चूक → None."""
        with self.lock:
            if self.calls >= self.budget or time.monotonic() - self.started > MAX_NSDL_SECONDS:
                raise BudgetOver
            self.calls += 1
        url = NSDL_BASE + path + (("?isin=" + urllib.parse.quote(isin)) if isin else "")
        time.sleep(NSDL_DELAY)
        st, raw = http_get(url, "https://www.indiabondinfo.nsdl.com/", "application/json, text/plain, */*", timeout=20)
        if st == 400:
            return {}
        if st != 200:
            with self.lock:
                self.errors += 1
            return None
        try:
            return json.loads(raw.decode("utf-8", "replace"))
        except ValueError:
            with self.lock:
                self.errors += 1
            return None


class BudgetOver(Exception):
    pass


FREQ_WORDS = [("twelve", 12), ("month", 12), ("four", 4), ("quarter", 4), ("twice", 2), ("half", 2),
              ("semi", 2), ("once", 1), ("annual", 1), ("year", 1), ("cumulative", 0), ("maturity", 0)]


def freq_from_text(s: str | None) -> int | None:
    s = (s or "").lower()
    for word, f in FREQ_WORDS:
        if word in s:
            return f
    return None


def clean(v):
    if v is None:
        return None
    s = str(v).strip()
    return None if s in ("", "-", "null", "None", "NA", "N.A.") else s


# NSDL चं "owner" field बहुतेक वेळा रिकामं असतं — म्हणून सरकारी कंपन्यांची नावं ओळखतो.
PSU_RE = re.compile(
    r"FOOD CORPORATION OF INDIA|HOUSING AND URBAN DEVELOPMENT|INDIA INFRASTRUCTURE FINANCE|INDIAN RAILWAY|"
    r"INDIAN RENEWABLE ENERGY|NATIONAL BANK FOR|NATIONAL HIGHWAYS AUTHORITY|NHPC|NTPC|POWER FINANCE CORP|"
    r"POWER GRID|^REC LIMITED|RURAL ELECTRIFICATION|SMALL INDUSTRIES DEVELOPMENT BANK|NATIONAL HOUSING BANK|"
    r"EXPORT[- ]IMPORT BANK|NUCLEAR POWER CORP|SJVN|NLC INDIA|NEYVELI|COAL INDIA|STEEL AUTHORITY|OIL AND NATURAL GAS|"
    r"INDIAN OIL CORP|BHARAT PETROLEUM|HINDUSTAN PETROLEUM|GAIL|BHARAT SANCHAR|MAHANAGAR TELEPHONE|AIR INDIA ASSETS|"
    r"KONKAN RAILWAY|RAIL VIKAS|IRCON|NBCC|STATE BANK OF INDIA|BANK OF BARODA|PUNJAB NATIONAL BANK|CANARA BANK|"
    r"UNION BANK OF INDIA|BANK OF INDIA|INDIAN BANK|CENTRAL BANK OF INDIA|INDIAN OVERSEAS BANK|UCO BANK|"
    r"PUNJAB (AND|&) SIND BANK|BANK OF MAHARASHTRA|DAMODAR VALLEY|NORTH EASTERN ELECTRIC|NATIONAL THERMAL|"
    r"IIFCL|HUDCO|IRFC|IREDA|NABARD|NABFID|SIDBI|INDIA EXIM",
    re.I)


def parse_static(isins_j, inst_j, coup_j, red_j, docs_j, contacts_j, today: dt.date) -> dict:
    """bond ची कायमची माहिती (एकदाच आणायची)."""
    d: dict = {}
    if isinstance(isins_j, dict):
        d["issuer"] = clean(isins_j.get("issuerName"))
        owner = (isins_j.get("issuerTypeOwner") or "").strip().lower()
        d["psu"] = owner.startswith("psu") or owner in ("central government", "state government")
        d["sector"] = clean(isins_j.get("sector")) or clean(isins_j.get("macro"))
        d["industry"] = clean(isins_j.get("industry"))
        d["restructured"] = bool(clean(isins_j.get("restructuredStatus")))
    inst = ((inst_j or {}).get("instrumentsVo") or {}) if isinstance(inst_j, dict) else {}
    i = inst.get("instruments") or {}
    if i:
        d["desc"] = clean(i.get("instrumentDesc"))
        d["face"] = fnum(i.get("faceValue"))
        d["maturity"] = pdate(i.get("redemptionDate"))
        d["perp"] = (i.get("perpetualInNature") or "").lower() == "yes"
        d["taxFree"] = (i.get("taxFree") or "").lower() == "yes"
        d["secured"] = (i.get("secured") or "").lower().startswith("secured")
        d["seniority"] = clean(i.get("seniorityRepayment"))
        d["category"] = clean(i.get("category"))
        d["issueMode"] = clean(i.get("modeOfIssue"))
        d["issueSizeCr"] = fnum(i.get("totalIssueSize"))
    ce = inst.get("creditEnhancement") or {}
    g = [x.get("guaranteedBy") for x in (ce.get("guaranteeDetails") or []) if clean(x.get("guaranteedBy"))]
    d["guarantee"] = ", ".join(g)[:160] if g else None
    ac = inst.get("assetCover") or {}
    d["assetCover"] = fnum(ac.get("assetCvrPercent"))
    cv = ((coup_j or {}).get("coupensVo") or {}) if isinstance(coup_j, dict) else {}
    cd = cv.get("couponDetails") or {}
    if cd:
        d["coupon"] = fnum(cd.get("couponRate"))
        d["couponBasis"] = clean(cd.get("couponBasis"))
        d["couponType"] = clean(cd.get("couponType"))
        d["freqText"] = clean(cd.get("interestPaymentFrequency"))
        d["freq"] = freq_from_text(d["freqText"])
        d["cumulative"] = (d["freq"] == 0) or "cumulative" in (d.get("couponType") or "").lower()
        d["floating"] = "float" in (d.get("couponBasis") or "").lower()
    sched = ((cv.get("cashFlowScheduleDetails") or {}).get("cashFlowSchedule")) or []
    flows = []
    for c in sched:
        due = pdate(c.get("dueDate") or c.get("paymentDate"))
        amt = fnum(c.get("amountPayable"))
        if due:
            flows.append({"d": due, "a": amt, "e": clean(c.get("cashFlowsEvent"))})
    flows.sort(key=lambda x: x["d"])
    d["flows"] = flows[:400]
    step = cv.get("stepStatus") or {}
    d["stepUp"] = (step.get("stepUpAvail") or "").lower() == "yes"
    if isinstance(red_j, dict) and red_j:
        call = red_j.get("callOption") or {}
        put = red_j.get("putOption") or {}
        d["callDate"] = pdate(call.get("redemptionDate")) or clean(call.get("specifiedDates"))
        d["putDate"] = pdate(put.get("redemptionDate")) or clean(put.get("specifiedDates"))
        d["callable"] = bool(d["callDate"]) or (red_j.get("callIndicator") or "").lower() in ("y", "yes")
        d["putable"] = bool(d["putDate"]) or (red_j.get("putIndicator") or "").lower() in ("y", "yes")
        rtype = (red_j.get("redemptionType") or "").lower()
        d["amortising"] = "partial" in rtype or "stagger" in rtype or "instal" in rtype
        dr = (red_j.get("defaultedRedemption") or "").lower()
        d["defaultedRedemption"] = bool(dr) and dr not in ("not applicable", "no", "-")
    if isinstance(docs_j, list):
        d["docs"] = [{"n": clean(x.get("docName")) or "Document", "u": x.get("downloadLink")}
                     for x in docs_j if (x.get("downloadLink") or "").startswith("http")][:5]
    if isinstance(contacts_j, dict):
        d["trustee"] = clean(contacts_j.get("debtTrusteeName"))
        d["registrar"] = clean(contacts_j.get("registrar"))
        d["address"] = clean(contacts_j.get("issuerRegAddr"))
    d["staticAt"] = today.isoformat()
    return d


def rating_key(r: str) -> int:
    base = r.replace("(CE)", "").replace("(SO)", "").strip().upper()
    base = base.split("/")[0].strip()
    base = base.split()[-1] if base else base
    return RANK.index(base) if base in RANK else 99


def clean_watch(w):
    """NSDL "No Watch" / "Not under watch" = watch नाही."""
    w = (w or "").strip()
    return None if not w or w.lower().startswith(("no", "not")) else w


def rating_flags(ratings: list[dict]) -> list[str]:
    flags = []
    text = " ".join(f"{x.get('r') or ''} {x.get('o') or ''} {x.get('act') or ''}" for x in ratings).lower()
    if "negative" in text:
        flags.append("neg")
    if "not cooperating" in text or "non cooperat" in text or "inc" in text.split():
        flags.append("inc")
    if any(clean_watch(x.get("w")) for x in ratings):
        flags.append("watch")
    if "withdraw" in text:
        flags.append("withdrawn")
    if any(x.get("p") for x in ratings):
        flags.append("provisional")
    if "(ce)" in text or "(so)" in text:
        flags.append("ce")
    return flags


def parse_dynamic(rat_j, def_j, today: dt.date) -> dict:
    d: dict = {"ratings": [], "flags": []}
    cur = (rat_j or {}).get("currentRatings") if isinstance(rat_j, dict) else None
    for r in cur or []:
        rating = clean(r.get("currentRating")) or ""
        d["ratings"].append({
            "a": (clean(r.get("creditRatingAgencyName")) or "").replace(" Limited", "").replace(" Ltd", ""),
            "r": rating, "o": clean(r.get("outlook")), "dt": pdate(r.get("creditRatingDate")),
            "w": clean(r.get("iciWatch")), "act": clean(r.get("ratingAction")),
            "u": r.get("pressReleaseLink") if (r.get("pressReleaseLink") or "").startswith("http") else None,
            "p": (r.get("provisionalFlag") or "").upper() == "Y",
        })
    valid = [x for x in d["ratings"] if rating_key(x["r"]) < 99]
    d["rating"] = min(valid, key=lambda x: rating_key(x["r"]))["r"] if valid else None
    d["flags"] = rating_flags(d["ratings"])
    d["defaulted"] = isinstance(def_j, (dict, list)) and bool(def_j) and not (
        isinstance(def_j, dict) and def_j.get("status") == 400)
    d["dynamicAt"] = today.isoformat()
    return d


def save_cache(cache: dict) -> None:
    """मधे-मधे cache साठवतो, म्हणजे run अर्धवट थांबला तरी झालेलं काम वाया जात नाही."""
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def enrich(isins: list[str], cache: dict, today: dt.date) -> dict:
    """सगळ्यात जास्त व्यवहार झालेल्या bonds पासून सुरुवात; आधी ratings, मग बाकीची माहिती.
    3 workers एकत्र चालतात; वेळ/requests ची मर्यादा संपली की उरलेलं पुढच्या run मध्ये."""
    api = Nsdl(MAX_NSDL_CALLS)
    stale_cut = (today - dt.timedelta(days=RATING_REFRESH_DAYS)).isoformat()
    jobs = [i for i in isins if "staticAt" not in cache.get(i, {}) or cache.get(i, {}).get("dynamicAt", "") < stale_cut]
    print(f"NSDL: {len(jobs)} bonds need work, budget {api.budget} calls / {MAX_NSDL_SECONDS}s, {NSDL_WORKERS} workers")
    lock = threading.Lock()
    stop = threading.Event()

    def work(isin: str) -> None:
        if stop.is_set():
            return
        try:
            rec = cache.get(isin, {})
            upd: dict = {}
            if rec.get("dynamicAt", "") < stale_cut:
                rat = api.get("bdsinfo/credit-ratings", isin)
                if rat is not None:
                    dfl = api.get("bdsinfo/defaultdetail", isin)
                    upd.update(parse_dynamic(rat, dfl, today))
            if "staticAt" not in rec:
                parts = [api.get("isins", isin), api.get("bdsinfo/instruments", isin),
                         api.get("bdsinfo/coupondetail", isin), api.get("bdsinfo/redemptions", isin),
                         api.get("bdsinfo/keydocuments", isin), api.get("bdsinfo/keycontacts", isin)]
                if parts[0] is not None or parts[1] is not None:
                    upd.update(parse_static(*parts, today))
            if upd:
                with lock:
                    cache.setdefault(isin, {}).update(upd)
        except BudgetOver:
            stop.set()

    with ThreadPoolExecutor(max_workers=NSDL_WORKERS) as pool:
        for n, _ in enumerate(pool.map(work, jobs), 1):
            if n % 60 == 0:
                with lock:
                    save_cache(cache)
    if stop.is_set():
        print("NSDL call/time budget reached; remaining bonds continue in next run")
    print(f"NSDL calls: {api.calls}, errors: {api.errors}")
    return {"calls": api.calls, "errors": api.errors}


# ---------------- 3. एकत्र करणे ----------------
def merge(trades: list[dict], previous: dict, today: dt.date) -> dict:
    """ISIN नुसार सगळ्यात नवीन व्यवहार; जुने (30 दिवसांच्या आतले) bonds ठेवतो."""
    book = dict(previous)
    by_isin: dict[str, list[dict]] = {}
    for t in trades:
        by_isin.setdefault(t["isin"], []).append(t)
    for isin, rows in by_isin.items():
        rows.sort(key=lambda r: (r["day"], r["turnover"] or 0), reverse=True)
        best = rows[0]
        exch = sorted({r["exch"] for r in rows if r["day"] == best["day"]})
        rec = dict(book.get(isin, {}))
        rec.update({
            "isin": isin, "srcName": best["name"] or rec.get("srcName"),
            "srcCoupon": next((r["coupon"] for r in rows if r["coupon"] is not None), rec.get("srcCoupon")),
            "srcMaturity": next((r["maturity"] for r in rows if r["maturity"]), rec.get("srcMaturity")),
            "srcFace": next((r["face"] for r in rows if r["face"]), rec.get("srcFace")),
            "price100": next((r["price100"] for r in rows if r.get("price100")), None),
            "priceUnit": next((r.get("price_unit") for r in rows if r.get("price_unit")), None),
            "repYield": next((r["yield"] for r in rows if r["yield"]), None),
            "turnover": sum(r["turnover"] or 0 for r in rows if r["day"] == best["day"]),
            "tradeDate": best["day"], "exch": " + ".join(exch),
        })
        book[isin] = rec
    cut = (today - dt.timedelta(days=KEEP_DAYS)).isoformat()
    return {k: v for k, v in book.items() if v.get("tradeDate", "") >= cut}


HIST_KEEP_DAYS = 100   # liquidity (30 दिवस) + price chart (90 दिवस) साठी पुरेसं


def backfill(hist_days: list[str], today: dt.date, max_secs: int = 420) -> list[dict]:
    """पहिल्यांदाच: मागच्या 90 दिवसांच्या files एकदाच आणतो (chart लगेच भरलेला दिसावा).
    आधीच 15+ दिवस असतील तर काहीच करत नाही. वेळ-मर्यादा 7 मिनिटं."""
    if len(hist_days) >= 15:
        return []
    have = set(hist_days)
    start, rows = time.time(), []
    for back in range(1, 91):
        day = today - dt.timedelta(days=back)
        if day.weekday() >= 5 or day.isoformat() in have:
            continue
        if time.time() - start > max_secs:
            break
        try:
            rows += bse_debt(day) + nse_cm(day)
        except Exception as e:   # एखादा दिवस न मिळाल्यास पुढे चालू
            print(f"backfill {day}: {e}")
    print(f"Backfill: {len(rows)} rows from {len({r['day'] for r in rows})} days")
    return rows


def update_history(hist: dict, trades: list[dict], today: dt.date, faces: dict | None = None) -> dict:
    """{ISIN: {day: [उलाढाल ₹, trades, close ₹/100]}} — मागचे 100 दिवस ठेवतो.
    close = त्या दिवशी सगळ्यात जास्त उलाढाल झालेल्या व्यवहाराचा भाव (₹100 face प्रमाणे)."""
    faces = faces or {}
    agg: dict = {}    # या run मधले दिवस नव्याने मोजतो — तोच file परत आला तरी दुप्पट मोजणी होत नाही
    best: dict = {}
    for t in trades:
        key = (t["isin"], t["day"])
        d = agg.setdefault(key, [0.0, 0, None])
        d[0] += t.get("turnover") or 0
        d[1] += t.get("trades") or 0
        p = t.get("price100")
        face = t.get("face") or faces.get(t["isin"])
        if not p and t.get("price_unit") and face:
            p = t["price_unit"] / face * 100
        if p and 20 < p < 400:
            tv = t.get("turnover") or 0
            if key not in best or tv > best[key]:
                best[key] = tv
                d[2] = round(p, 4)
    for (isin, day), d in agg.items():
        hist.setdefault(isin, {})[day] = d
    cut = (today - dt.timedelta(days=HIST_KEEP_DAYS)).isoformat()
    for isin in list(hist):
        hist[isin] = {k: v for k, v in hist[isin].items() if k >= cut}
        if not hist[isin]:
            del hist[isin]
    return hist


def write_prices(hist: dict, isins: set[str]) -> None:
    """पानासाठी छोटी file: {ISIN: [[day, close], ...]} — bond उघडल्यावरच load होते."""
    out = {}
    for isin in isins:
        rows = [[d, v[2]] for d, v in sorted(hist.get(isin, {}).items()) if len(v) > 2 and v[2]]
        if rows:
            out[isin] = rows
    PRICE_FILE.write_text(json.dumps({"asOf": max((r[-1][0] for r in out.values()), default=None),
                                      "basis": "Daily close per Rs 100 face (BSE/NSE, highest-turnover trade)",
                                      "prices": out}, separators=(",", ":")), encoding="utf-8")


def liquidity(h: dict, file_days: list[str], today: dt.date) -> dict | None:
    """मागच्या 30 दिवसांत (आपल्याकडे file असलेले trading days) किती दिवस व्यवहार झाला."""
    cut = (today - dt.timedelta(days=30)).isoformat()
    window = [d for d in file_days if d >= cut]
    if not window:
        return None
    traded = [d for d in window if d in h]
    turn = sum(h[d][0] for d in traded)
    n = len(traded)
    label = "frequent" if n >= max(3, len(window) * 0.5) else ("occasional" if n >= max(2, len(window) * 0.15) else "rare")
    return {"days": n, "of": len(window), "since": min(window),
            "avgTurnover": round(turn / n) if n else 0,
            "trades": sum(h[d][1] for d in traded), "label": label}


def build_output(book: dict, cache: dict, today: dt.date, hist: dict | None = None, file_days: list[str] | None = None) -> list[dict]:
    out = []
    for isin, b in book.items():
        n = cache.get(isin, {})
        coupon = n.get("coupon") if n.get("coupon") is not None else b.get("srcCoupon")
        maturity = n.get("maturity") or b.get("srcMaturity")
        face = n.get("face") or b.get("srcFace")
        price = b.get("price100")
        if not price and b.get("priceUnit") and face:
            price = b["priceUnit"] / face * 100
        if not price or price <= 0 or price > 400:
            continue
        perp = bool(n.get("perp")) or (maturity or "") >= "2060"
        years = None
        if maturity and not perp:
            years = (dt.date.fromisoformat(maturity) - today).days / 365.25
            if years <= 0:
                continue
        freq = n.get("freq")
        ytm, est = b.get("repYield"), False
        if not ytm or ytm <= 0:
            ytm, est = None, True
            if coupon is not None and years and freq != 0:
                ytm = ytm_pct(price, coupon, years, freq or 1)
            elif coupon and perp:
                ytm = round(coupon / price * 100, 2)
        nxt = next((f for f in n.get("flows", []) if f["d"] >= today.isoformat()), None)
        ratings = [dict(r, w=clean_watch(r.get("w"))) for r in n.get("ratings", [])]
        flags = rating_flags(ratings)
        if ytm and ytm > HIGH_YIELD:
            flags.append("highyield")
        if n.get("defaulted") or n.get("defaultedRedemption"):
            flags.append("default")
        if n.get("restructured"):
            flags.append("restructured")
        out.append({
            "isin": isin,
            "issuer": n.get("issuer") or b.get("srcName") or isin,
            "coupon": coupon, "price": round(price, 2),
            "ytm": ytm, "ytmEst": est,
            "maturity": maturity, "perp": perp,
            "tradeDate": b.get("tradeDate"), "exch": b.get("exch"),
            "turnover": round(b.get("turnover") or 0),
            "face": face, "freq": freq, "freqText": n.get("freqText"),
            "cumulative": bool(n.get("cumulative")), "floating": bool(n.get("floating")),
            "rating": n.get("rating"), "ratings": ratings,
            "psu": bool(n.get("psu")) or bool(PSU_RE.search(n.get("issuer") or b.get("srcName") or "")), "sector": n.get("sector"), "industry": n.get("industry"),
            "taxFree": n.get("taxFree"), "secured": n.get("secured"), "seniority": n.get("seniority"),
            "guarantee": n.get("guarantee"), "assetCover": n.get("assetCover"),
            "callable": n.get("callable"), "callDate": n.get("callDate"),
            "putable": n.get("putable"), "putDate": n.get("putDate"),
            "amortising": n.get("amortising"), "stepUp": n.get("stepUp"),
            "nextPay": {"d": nxt["d"], "a": nxt["a"], "e": nxt["e"]} if nxt else None,
            "docs": n.get("docs", []), "trustee": n.get("trustee"), "registrar": n.get("registrar"),
            "issueMode": n.get("issueMode"), "category": n.get("category"),
            "address": n.get("address"),
            "schedule": any(f["d"] >= today.isoformat() for f in n.get("flows", [])),
            "flags": sorted(set(flags)),
            "liq": liquidity((hist or {}).get(isin, {}), file_days or [], today),
            "nsdl": "dynamicAt" in n,
        })
    out.sort(key=lambda x: x["issuer"])
    return out


def event_code(e: str | None) -> str:
    """I = व्याज, R = मुद्दल परतफेड (partial/full redemption), O = इतर."""
    e = (e or "").lower()
    if "redemp" in e or "principal" in e or "maturity" in e:
        return "R"
    if "interest" in e or "coupon" in e:
        return "I"
    return "O"


def write_schedules(bonds: list[dict], cache: dict, today: dt.date) -> None:
    """{ISIN: [[तारीख, रक्कम प्रति bond, I/R/O], ...]} — फक्त आजपासूनचे payouts."""
    t = today.isoformat()
    out = {}
    for b in bonds:
        flows = [[f["d"], f["a"], event_code(f.get("e"))] for f in cache.get(b["isin"], {}).get("flows", [])
                 if f["d"] >= t and f.get("a") is not None]
        if flows:
            out[b["isin"]] = flows
    SCHED_FILE.write_text(json.dumps({"asOf": t, "basis": "per bond (one unit of face value)",
                                      "schedules": out}, separators=(",", ":")), encoding="utf-8")
    print(f"Schedules written for {len(out)} bonds")


def notify(msg: str) -> None:
    token, chat = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat:
        return
    try:
        urllib.request.urlopen(f"https://api.telegram.org/bot{token}/sendMessage",
                               data=urllib.parse.urlencode({"chat_id": chat, "text": msg}).encode(), timeout=15)
    except Exception as exc:
        print("Telegram alert failed:", exc)


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def main() -> int:
    today = dt.datetime.now(IST).date()
    prev_out = load_json(OUT_FILE, {})
    previous = {b["isin"]: {"isin": b["isin"], "srcName": b.get("issuer"), "srcCoupon": b.get("coupon"),
                            "srcMaturity": b.get("maturity"), "srcFace": b.get("face"),
                            "price100": b.get("price"), "repYield": None if b.get("ytmEst") else b.get("ytm"),
                            "turnover": b.get("turnover"), "tradeDate": b.get("tradeDate"), "exch": b.get("exch")}
                for b in prev_out.get("bonds", [])}
    cache = load_json(CACHE_FILE, {})

    trades, latest = collect_trades(today)
    if not trades and not previous:
        notify("⚠️ Corporate bonds: no BSE/NSE debt file found and no previous data.")
        return 0
    book = merge(trades, previous, today)
    hist_all = load_json(HIST_FILE, {})
    old_days = hist_all.pop("_days", [])
    extra = backfill(old_days, today) if trades else []
    days_seen = sorted(set(old_days) | {t["day"] for t in trades + extra})
    faces = {i: (cache.get(i, {}).get("face") or book[i].get("srcFace")) for i in book}
    hist = update_history(hist_all, extra + trades, today, faces) if trades else hist_all
    hist["_days"] = [d for d in days_seen if d >= (today - dt.timedelta(days=HIST_KEEP_DAYS)).isoformat()]
    HIST_FILE.write_text(json.dumps(hist, separators=(",", ":")), encoding="utf-8")
    file_days = hist["_days"]
    stats = enrich(sorted(book, key=lambda i: -(book[i].get("turnover") or 0)), cache, today)

    bonds = build_output(book, cache, today, hist, file_days)
    rated_dates = sorted(x["dynamicAt"] for x in cache.values() if x.get("dynamicAt"))
    payload = {
        "updated": dt.datetime.now(IST).isoformat(timespec="minutes"),
        "pricesAsOf": latest or prev_out.get("pricesAsOf"),
        "ratingsAsOf": rated_dates[-1] if rated_dates else None,
        "sources": "Prices: BSE & NSE bhavcopy. Details & ratings: NSDL India Bond Info.",
        "count": len(bonds),
        "nsdlCoverage": sum(1 for b in bonds if b["nsdl"]),
        "bonds": bonds,
    }
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    write_schedules(bonds, cache, today)
    write_prices(hist, {b["isin"] for b in bonds})
    # cache: फक्त सध्या यादीत असलेले + मागचे 120 दिवस वापरलेले bonds ठेवतो (file छोटी राहते)
    keep_cut = (today - dt.timedelta(days=120)).isoformat()
    for isin in list(cache):
        if isin not in book and cache[isin].get("dynamicAt", cache[isin].get("staticAt", "")) < keep_cut:
            del cache[isin]
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(bonds)} bonds; NSDL coverage {payload['nsdlCoverage']}/{len(bonds)}")
    if not trades:
        notify("⚠️ Corporate bonds: no new BSE/NSE debt file; showing last available prices.")
    elif stats["errors"] > 50:
        notify(f"⚠️ Corporate bonds: NSDL returned {stats['errors']} errors in this run.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
