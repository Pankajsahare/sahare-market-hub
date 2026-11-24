"""NDX शी हिशोब जुळतो का — रोज bond data तयार झाल्यावर तपासतो.

tests/ndx_cases.json मधले आकडे NDX calculator च्या screenshots मधून घेतले आहेत.
इथला हिशोब पानावरच्या calculator सारखाच आहे:
  Dirty = Σ CF / (1+XIRR)^(दिवस/365),  accrued = थकित × कूपन × दिवस/365 (record date गेली तर उणे),
  एकूण accrued पैशापर्यंत round → किंमत 4 दशांश → principal = किंमत × face/100 × units,
  stamp duty 0.0001% रुपयात round, transaction amount = principal + accrued + stamp.
एकही आकडा न जुळल्यास हा step लाल होतो (exit 1) आणि GitHub email पाठवतो.
"""
from __future__ import annotations

import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import fetch_corp_bonds as F  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
CASES = ROOT / "tests" / "ndx_cases.json"
STAMP = 0.0001  # %


def quote(n: dict, settle: dt.date, y: float, units: int) -> dict:
    face, cpn = float(n["face"]), float(n["coupon"])
    flows = F.full_flows(n, face)
    s0 = settle.isoformat()
    is_int = lambda f: F.event_code(f.get("e")) == "I"
    fut = [f for f in flows if f["d"] > s0]
    prev = max((f["d"] for f in flows if f["d"] <= s0 and is_int(f)), default=None)
    nxt = next((f for f in fut if is_int(f)), None)
    out = sum(f["a"] for f in fut if F.event_code(f.get("e")) == "R")
    acc = 0.0
    if nxt and F.record_ex(dt.date.fromisoformat(nxt["d"]), settle):
        days = (dt.date.fromisoformat(nxt["d"]) - settle).days
        acc = -out * cpn / 100 * days / 365
        fut = [f for f in fut if f is not nxt]
    elif prev:
        acc = out * cpn / 100 * (settle - dt.date.fromisoformat(prev)).days / 365
    dirty = sum(f["a"] / (1 + y / 100) ** ((dt.date.fromisoformat(f["d"]) - settle).days / 365) for f in fut)
    acc_tot = round(acc * units, 2)
    price = round((dirty - acc_tot / units) / face * 100, 4)
    principal = round(price * face / 100 * units, 2)
    stamp = round((principal + acc_tot) * STAMP / 100)
    return {"price": price, "accrued": acc_tot, "principal": principal, "stamp": stamp,
            "total": round(principal + acc_tot + stamp, 2)}


def main() -> int:
    cache = json.loads(F.CACHE_FILE.read_text(encoding="utf-8"))
    bad = 0
    for c in json.loads(CASES.read_text(encoding="utf-8")):
        n = cache.get(c["isin"])
        if not n or not n.get("flows"):
            print(f"SKIP {c['isin']}: no schedule in cache")
            continue
        got = quote(n, dt.date.fromisoformat(c["trade"]), c["yield"], c["units"])
        diff = {k: (got[k], v) for k, v in c["ndx"].items() if abs(got[k] - v) > 0.0049}
        tag = "OK " if not diff else "BAD"
        bad += bool(diff)
        print(f"{tag} {c['isin']} {c['trade']} y={c['yield']} ×{c['units']}: " +
              (", ".join(f"{k} ours {a} vs NDX {b}" for k, (a, b) in diff.items()) or f"price {got['price']}"))
    print(f"NDX check: {bad} mismatch(es)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
