#!/usr/bin/env python3
"""
A4U FII Sector Flow fetcher v2.0
--------------------------------
काय करतो:
  1. NSDL च्या "Fortnightly Sector-wise FPI Investment" पानावरून सगळ्या reports ची यादी घेतो.
  2. नवीन report आला असेल तरच तो उघडतो (जुने reports data/fii_sectors_history.json मध्ये साठवलेले राहतात).
  3. प्रत्येक sector साठी काढतो:
       - fortnight = शेवटच्या पंधरवड्याची net investment (₹ Cr)
       - year      = शेवटच्या 24 पंधरवड्यांची बेरीज (≈ 1 वर्ष)
       - aum       = एकूण FPI AUC मधला त्या sector चा % हिस्सा
  4. data/fii_sectors.json लिहितो — हाच JSON advisor4u.in वरचा FII dashboard वाचतो.
  5. v2: Total आणि Equity दोन्ही आकडे, आधीचा पंधरवडा, AUC ₹ Cr + USD,
     Equity/Debt/Hybrid/MF/AIF breakdown, Others मधल्या Top 10 कंपन्या, RBI rate.
  6. नवा पंधरवडा आला तर Telegram वर छोटा summary पाठवतो (secrets असतील तरच).

MODE (env FII_MODE):
  "total"  (default) = Equity + Debt + Hybrid + MF + AIF — Sovereign (G-Sec) पण दिसतो, आधीच्या dashboard सारखं
  "equity"           = फक्त Equity — Sovereign 0 येतो
"""
from __future__ import annotations

import datetime as dt
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_FILE = ROOT / "data" / "fii_sectors.json"
HIST_FILE = ROOT / "data" / "fii_sectors_history.json"

SELECT_URL = "https://www.fpi.nsdl.co.in/web/Reports/FPI_Fortnightly_Selection.aspx"
WEB_BASE = "https://www.fpi.nsdl.co.in/web/"
SOURCE = "NSDL FPI Monitor — Fortnightly Sector-wise Investment"
MODE = os.environ.get("FII_MODE", "total").strip().lower()
SCHEMA = 2                # JSON रचना बदलली की हा वाढवा → नवीन report पुन्हा वाचला जातो
YEAR_FORTNIGHTS = 24      # 24 पंधरवडे ≈ 1 वर्ष
KEEP_FORTNIGHTS = 30      # history मध्ये किती ठेवायचे
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
BROWSER = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
}
OPTION_RE = re.compile(
    r'value="~/(StaticReports/Fortnightly_Sector_wise_FII_Investment_Data/[^"]+?\.html?)"[^>]*>\s*'
    r'([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})',
    re.I,
)
MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], start=1)}


# ---------------------------------------------------------------- HTTP
def http_get(url: str, referer: str = SELECT_URL, tries: int = 3) -> str:
    """URL मधून मजकूर आणतो; fail झालं तर 3 वेळा प्रयत्न."""
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=dict(BROWSER, Referer=referer))
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, TimeoutError, ConnectionError) as exc:
            last = exc
            time.sleep(3 * (i + 1))
    raise RuntimeError(f"GET failed: {url} ({last})")


# ---------------------------------------------------------------- report list
def list_reports(page: str) -> list[dict]:
    """Dropdown मधून [{date, url}] — नवीन आधी."""
    seen, out = set(), []
    for path, mon, day, year in OPTION_RE.findall(page):
        m = MONTHS.get(mon[:3].lower())
        if not m:
            continue
        try:
            d = dt.date(int(year), m, int(day))
        except ValueError:
            continue
        if d in seen:
            continue
        seen.add(d)
        out.append({"date": d, "url": urllib.parse.urljoin(WEB_BASE, path)})
    out.sort(key=lambda x: x["date"], reverse=True)
    return out


# ---------------------------------------------------------------- HTML table parser
class TableParser(HTMLParser):
    """पानावरचे सगळे tables → rows → cells (फक्त मजकूर)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables: list[list[list[str]]] = []
        self._depth = 0
        self._row: list[str] | None = None
        self._cell: list[str] | None = None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self._depth += 1
            if self._depth == 1:
                self.tables.append([])
        elif tag == "tr" and self._depth == 1:
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._cell is not None and self._row is not None:
            self._row.append(" ".join("".join(self._cell).split()))
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if self.tables:
                self.tables[-1].append(self._row)
            self._row = None
        elif tag == "table":
            self._depth = max(0, self._depth - 1)

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)


# सध्याच्या report मधले प्रत्येक गटातले 12 columns
PART_COLS_12 = ["Equity", "Debt General Limit", "Debt VRR", "Debt-FAR", "Hybrid",
                "MF Equity", "MF Debt", "MF Hybrid", "MF Solution oriented", "MF Other", "AIF", "Total"]
PART_GROUPS = {"equity": [0], "debt": [1, 2, 3], "hybrid": [4], "mf": [5, 6, 7, 8, 9], "aif": [10]}


def to_num(s: str) -> float | None:
    s = s.replace(",", "").replace("−", "-").strip()
    if s in ("", "-"):
        return 0.0 if s == "-" else None
    try:
        return float(s)
    except ValueError:
        return None


def parse_report(page: str) -> dict:
    """
    एका report मधून दोन्ही पंधरवड्यांचे आकडे.
    प्रत्येक sector row: Sr, Sector, मग 8 गट × k columns:
      0 AUC(prev) INR | 1 AUC(prev) USD | 2 Net(prev) INR | 3 Net(prev) USD |
      4 Net(cur) INR  | 5 Net(cur) USD  | 6 AUC(cur) INR  | 7 AUC(cur) USD
    प्रत्येक गटात पहिला column = Equity, शेवटचा = Total.
    """
    p = TableParser()
    p.feed(page)
    for table in p.tables:
        sectors: dict[str, dict] = {}
        grand = None
        periods: list[str] = []
        for row in table:
            if not periods:
                periods = [c.replace("Net Investment", "").strip() for c in row if c.startswith("Net Investment")]
            if len(row) < 10:
                continue
            name = html.unescape(row[1]).strip()
            nums = [to_num(c) for c in row[2:]]
            if not name or any(n is None for n in nums) or len(nums) % 8:
                continue
            k = len(nums) // 8

            def g(group: int, col: str) -> float:
                return nums[group * k + (0 if col == "eq" else k - 1)]

            def parts(group: int) -> dict | None:
                """Equity/Debt/Hybrid/MF/AIF — फक्त सध्याच्या 12-column रचनेसाठी."""
                if k != len(PART_COLS_12):
                    return None
                base = group * k
                return {name: sum(nums[base + i] for i in idx) for name, idx in PART_GROUPS.items()}

            rec = {
                "net_prev": {"eq": g(2, "eq"), "total": g(2, "total")},
                "net_cur": {"eq": g(4, "eq"), "total": g(4, "total")},
                "auc_cur": {"eq": g(6, "eq"), "total": g(6, "total")},
                "usd": {"net_cur": g(5, "total"), "net_cur_eq": g(5, "eq"),
                        "auc_cur": g(7, "total"), "auc_cur_eq": g(7, "eq")},
                "parts": {"net": parts(4), "auc": parts(6)},
            }
            if name.lower() == "grand total":
                grand = rec
            elif row[0].strip().isdigit():
                sectors[name] = rec
        if len(sectors) >= 15 and grand:
            return {"sectors": sectors, "grand": grand, "periods": periods,
                    "others_top10": parse_top10(p.tables), "fx": parse_fx(p.tables)}
    raise ValueError("Sector table not found / format changed")


def parse_top10(tables: list) -> list[dict]:
    """"Others" मधल्या Top 10 कंपन्या (सध्याच्या तारखेचे column)."""
    for table in tables:
        if not any("Companies" in " ".join(r) for r in table[:3]):
            continue
        out = []
        for r in table:
            if len(r) >= 3 and r[0].strip().isdigit():
                val = to_num(r[2])
                if r[1].strip() and val is not None:
                    out.append({"name": html.unescape(r[1]).strip(), "cr": int(val)})
        if out:
            return out[:10]
    return []


def parse_fx(tables: list) -> float | None:
    """RBI reference rate — शेवटची "AUC as on ..." ओळ (सध्याची तारीख)."""
    rate = None
    for table in tables:
        for r in table:
            if len(r) >= 2 and r[0].startswith("AUC as on"):
                v = to_num(r[-1])
                if v and 30 < v < 500:
                    rate = v
    return rate


# ---------------------------------------------------------------- history
def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def update_history(reports: list[dict], hist: dict) -> int:
    """गरज असलेले reports च उघडतो. परत: किती reports उघडले."""
    fn = hist.setdefault("fortnights", {})
    fetched = 0
    for i, rep in enumerate(reports[:YEAR_FORTNIGHTS]):
        key = rep["date"].isoformat()
        # सगळ्यात नवीन पंधरवड्याला AUC लागतो; बाकीच्यांना फक्त net पुरे
        if key in fn and (i > 0 or fn[key].get("schema") == SCHEMA):
            continue
        # आधीचा पंधरवडा पण ह्याच report मधून भरता येतो
        prev_key = reports[i + 1]["date"].isoformat() if i + 1 < len(reports) else None
        page = http_get(rep["url"])
        data = parse_report(page)
        fetched += 1
        cur_period = data["periods"][1] if len(data["periods"]) > 1 else ""
        prev_period = data["periods"][0] if data["periods"] else ""
        fn[key] = {
            "schema": SCHEMA,
            "period": cur_period,
            "prev_period": prev_period,
            "net": {s: v["net_cur"] for s, v in data["sectors"].items()},
            "auc": {s: v["auc_cur"] for s, v in data["sectors"].items()},
            "grand_auc": data["grand"]["auc_cur"],
            "url": rep["url"],
            "detail": {s: {"usd": v["usd"], "parts": v["parts"]} for s, v in data["sectors"].items()},
            "others_top10": data["others_top10"],
            "fx": data["fx"],
        }
        if prev_key:
            fn[prev_key] = {
                "period": prev_period,
                "net": {s: v["net_prev"] for s, v in data["sectors"].items()},
            }
        print(f"  parsed {rep['date']} ({len(data['sectors'])} sectors)")
        time.sleep(1.5)  # NSDL वर हलका load
    # फक्त सगळ्यात नवीन पंधरवड्याचा detail ठेवा (file लहान राहते)
    newest = max(fn)
    for d_key, entry in fn.items():
        if d_key != newest:
            for heavy in ("detail", "others_top10", "auc", "grand_auc"):
                entry.pop(heavy, None)
    # जुने काढून टाका
    for old in sorted(fn)[:-KEEP_FORTNIGHTS]:
        del fn[old]
    hist["dates"] = sorted(fn, reverse=True)
    return fetched


# ---------------------------------------------------------------- output
def build_output(hist: dict) -> dict:
    fn = hist["fortnights"]
    dates = sorted(fn, reverse=True)
    latest_key = next(d for d in dates if "auc" in fn[d])
    latest = fn[latest_key]
    window = [d for d in dates if d <= latest_key][:YEAR_FORTNIGHTS]
    prev_key = next((d for d in dates if d < latest_key), None)
    m = "eq" if MODE == "equity" else "total"
    detail = latest.get("detail", {})

    def flow(d_key: str | None, name: str, col: str) -> int:
        if not d_key:
            return 0
        return int(round(fn[d_key]["net"].get(name, {}).get(col, 0)))

    def share(auc: dict, col: str) -> float:
        g = latest["grand_auc"][col] or 1
        return round(auc[col] / g * 100, 1)

    sectors = []
    for name, auc in latest["auc"].items():
        det = detail.get(name, {})
        usd = det.get("usd", {})
        rec = {
            "name": name,
            # मुख्य आकडे (MODE नुसार) — dashboard default हेच वापरतो
            "aum": share(auc, m),
            "fortnight": flow(latest_key, name, m),
            "year": int(round(sum(fn[d]["net"].get(name, {}).get(m, 0) for d in window))),
            "prevFortnight": flow(prev_key, name, m),
            # फक्त Equity (toggle साठी)
            "aumEq": share(auc, "eq"),
            "fortnightEq": flow(latest_key, name, "eq"),
            "yearEq": int(round(sum(fn[d]["net"].get(name, {}).get("eq", 0) for d in window))),
            "prevFortnightEq": flow(prev_key, name, "eq"),
            # प्रत्यक्ष रक्कम
            "aucCr": int(round(auc[m])),
            "aucCrEq": int(round(auc["eq"])),
            "aucUsdMn": int(round(usd.get("auc_cur", 0))),
            "fortnightUsdMn": int(round(usd.get("net_cur", 0))),
        }
        parts = det.get("parts") or {}
        if parts.get("net") and parts.get("auc"):
            rec["breakdown"] = {
                "net": {k: int(round(v)) for k, v in parts["net"].items()},
                "auc": {k: int(round(v)) for k, v in parts["auc"].items()},
            }
        sectors.append(rec)
    sectors.sort(key=lambda s: s["aum"], reverse=True)
    d = dt.date.fromisoformat(latest_key)
    return {
        "asOf": d.strftime("%d-%b-%Y"),
        "asOfISO": latest_key,
        "period": latest.get("period", ""),
        "prevPeriod": latest.get("prev_period", ""),
        "fxRate": latest.get("fx"),
        "othersTop10": latest.get("others_top10", []),
        "source": SOURCE,
        "sourceUrl": latest.get("url", SELECT_URL),
        "mode": MODE,
        "yearWindowFortnights": len(window),
        "generatedAt": dt.datetime.now(IST).isoformat(timespec="seconds"),
        "sectors": sectors,
    }


def fmt_cr(n: float) -> str:
    sign = "-" if n < 0 else "+"
    s = f"{abs(int(n)):,}"
    # Indian grouping (1,23,456)
    raw = str(abs(int(n)))
    if len(raw) > 3:
        head, tail = raw[:-3], raw[-3:]
        head = ",".join([head[max(0, i - 2):i] for i in range(len(head), 0, -2)][::-1])
        s = f"{head},{tail}"
    return f"{sign}₹{s} Cr"


def telegram(out: dict) -> None:
    token, chat = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CHAT_ID")
    if not (token and chat):
        return
    secs = out["sectors"]
    ins = sorted(secs, key=lambda s: s["fortnight"], reverse=True)[:3]
    outs = sorted(secs, key=lambda s: s["fortnight"])[:3]
    net = sum(s["fortnight"] for s in secs)
    lines = [
        f"📊 FII Sector Flows — {out['period'] or out['asOf']}",
        f"Net fortnight: {fmt_cr(net)}",
        "",
        "🟢 Top inflows:",
        *[f"• {s['name']}: {fmt_cr(s['fortnight'])}" for s in ins],
        "",
        "🔴 Top outflows:",
        *[f"• {s['name']}: {fmt_cr(s['fortnight'])}" for s in outs],
        "",
        "Dashboard: https://www.advisor4u.in/",
    ]
    body = urllib.parse.urlencode({"chat_id": chat, "text": "\n".join(lines)}).encode()
    try:
        urllib.request.urlopen(f"https://api.telegram.org/bot{token}/sendMessage", body, timeout=20)
        print("Telegram sent")
    except Exception as exc:  # Telegram fail झाला तरी job fail नको
        print(f"Telegram failed: {exc}")


def main() -> int:
    print(f"Mode: {MODE}")
    reports = list_reports(http_get(SELECT_URL, referer=WEB_BASE))
    if len(reports) < 2:
        print("Report list not found — NSDL page format changed?")
        return 1
    print(f"Latest NSDL report: {reports[0]['date']}  ({len(reports)} listed)")

    old_out = load_json(OUT_FILE, {})
    hist = load_json(HIST_FILE, {})
    fetched = update_history(reports, hist)
    out = build_output(hist)

    if fetched == 0 and old_out.get("asOfISO") == out["asOfISO"] and old_out.get("mode") == MODE:
        print("No new fortnight — nothing to do")
        return 0

    HIST_FILE.write_text(json.dumps(hist, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    OUT_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Wrote {OUT_FILE.name}: {out['asOf']} · {len(out['sectors'])} sectors · "
          f"1Y window {out['yearWindowFortnights']} fortnights")

    if old_out.get("asOfISO") != out["asOfISO"]:
        telegram(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
