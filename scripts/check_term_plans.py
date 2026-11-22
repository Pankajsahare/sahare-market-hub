#!/usr/bin/env python3
"""
Term plan brochures — link तपासणी (S4)
--------------------------------------
assets/term-plans/term-plans.json मधली प्रत्येक PDF / plan page / insurer website link उघडून बघतो.
  - निकाल data/term_plans_status.json मध्ये (प्रत्येक URL: status, सलग किती वेळा fail)
  - एखादी link सलग 2 runs तुटलेली दिसली (404/410/DNS) तरच Telegram alert — एकदाच, आणि ठीक झाली की "परत चालू" संदेश
  - 403/429 = साईटने bot ला अडवलं; हे "तुटलं" समजत नाही (खोटे alert टाळायला)
फक्त Python standard library.
"""
from __future__ import annotations

import datetime as dt
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import BROWSER, IST, notify  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "term-plans" / "term-plans.json"
STATUS = ROOT / "data" / "term_plans_status.json"
BLOCKED = {401, 403, 405, 406, 429, 503}   # साईट bot ला अडवते — link तुटली असं नाही
ALERT_AFTER = 2                            # सलग इतक्या runs मध्ये तुटली तरच alert


def probe(url: str) -> int:
    """HTTP status परत करतो. network/DNS चूक → 0. फक्त पहिले 1 KB मागतो (PDF पूर्ण download नको)."""
    headers = dict(BROWSER, Accept="*/*", Range="bytes=0-1023")
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except Exception:
        return 0


def links(data: dict) -> list[tuple[str, str]]:
    out = []
    for c in data["companies"]:
        if c.get("site"):
            out.append((f"{c['company']} — website", c["site"]))
        for p in c["plans"]:
            for kind in ("pdf", "page"):
                if p.get(kind):
                    out.append((f"{p['name']} — {kind.upper()}", p[kind]))
    return out


def main() -> None:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    old = json.loads(STATUS.read_text(encoding="utf-8")).get("links", {}) if STATUS.exists() else {}
    new, broke, fixed = {}, [], []

    for label, url in links(data):
        st = probe(url)
        ok = 200 <= st < 400 or st in BLOCKED
        prev = old.get(url, {})
        fails = 0 if ok else prev.get("fails", 0) + 1
        alerted = prev.get("alerted", False) and not ok
        if not ok and fails >= ALERT_AFTER and not alerted:
            broke.append(f"• {label}\n  {url} (HTTP {st or 'no response'})")
            alerted = True
        if ok and prev.get("alerted"):
            fixed.append(f"• {label}")
        new[url] = {"label": label, "status": st, "fails": fails, "alerted": alerted}
        print(f"{st:>3}  {'OK ' if ok else 'BAD'}  {label}")

    STATUS.parent.mkdir(parents=True, exist_ok=True)
    STATUS.write_text(json.dumps({"checked_on": dt.datetime.now(IST).strftime("%Y-%m-%d %H:%M IST"),
                                  "links": new}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    if broke:
        notify("⚠️ A4U Term Brochures: या links सलग " + str(ALERT_AFTER) + " वेळा उघडल्या नाहीत —\n\n"
               + "\n".join(broke)
               + "\n\nउपाय: insurer च्या साईटवर नवीन link शोधा → scripts/build_term_plans.py मध्ये बदला → script चालवा.")
    if fixed:
        notify("✅ A4U Term Brochures: या links परत चालू झाल्या —\n" + "\n".join(fixed))
    bad = sum(1 for v in new.values() if v["fails"])
    print(f"\n{len(new)} links तपासल्या, {bad} आत्ता उघडल्या नाहीत, नवीन alert: {len(broke)}")


if __name__ == "__main__":
    main()
