#!/usr/bin/env python3
"""
LIC plans data sync — A4U LIC Calculator साठी (advisor4u.in/lic-calculator/)
---------------------------------------------------------------------------
दर आठवड्याला:
  1. licindia.in/insurance-plan वरून LIC च्या सध्याच्या सगळ्या plans ची यादी (plan no + UIN) वाचतो
     → नवीन plan आला / आपला plan यादीतून गेला (withdraw) तर Telegram वर सांगतो.
  2. आपल्या प्रत्येक plan च्या LIC page वरून नवीन sales brochure (PDF) शोधतो.
     PDF बदललं असेल (SHA256 वेगळा) तरच:
       - data/lic/brochures/<plan>/<sha12>.pdf मध्ये copy जपून ठेवतो (पुरावा)
       - Gemini ला PDF देऊन eligibility, SA multiples, HSA rebate, mode rebate,
         sample premiums हे JSON मध्ये काढतो
       - तपासणी (sanity checks) पास झाली तरच data/lic/lic-plans.json मध्ये बदल
  3. data/lic/status.json मध्ये प्रत्येक URL चा निकाल लिहितो (debug साठी).

WordPress plugin हा JSON रोज आणतो, पण admin ने "Approve" केल्याशिवाय लागू करत नाही.
फक्त Python standard library. Secrets: GEMINI_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
"""
from __future__ import annotations

import base64
import datetime as dt
import hashlib
import html
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, IST, http_get, load_json, notify, write_json  # noqa: E402

LIC_DIR = DATA / "lic"
PLANS_JSON = LIC_DIR / "lic-plans.json"
WATCH_JSON = LIC_DIR / "plans_watch.json"
STATUS_JSON = LIC_DIR / "status.json"
BROCHURES = LIC_DIR / "brochures"
LIC_HOME = "https://licindia.in/"
REGISTRY_URL = "https://licindia.in/insurance-plan"
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODELS = [m for m in os.environ.get("GEMINI_MODELS", "gemini-3.8-flash,gemini-2.5-flash").split(",") if m]
FORCE = os.environ.get("LIC_FORCE", "") == "1"  # brochure बदललं नसलं तरी पुन्हा extract

STATUS: dict = {"run_at": "", "registry": {}, "plans": {}, "bonus": {}, "errors": []}


def now_ist() -> str:
    return dt.datetime.now(IST).strftime("%Y-%m-%d %H:%M")


def get(url: str, accept: str = "*/*") -> tuple[int, bytes]:
    return http_get(url, LIC_HOME, accept=accept, timeout=60, retries=2)


def page_text(raw: bytes) -> str:
    return raw.decode("utf-8", "ignore")


# ---------------- 1. Registry: LIC च्या सध्याच्या plans ची यादी ----------------

def read_registry() -> dict[str, str]:
    """{plan_no: uin} — insurance-plan page वरच्या tables मधून (UIN च्या आधीचा 3-अंकी plan no)."""
    st, raw = get(REGISTRY_URL, "text/html")
    STATUS["registry"] = {"url": REGISTRY_URL, "http": st, "bytes": len(raw)}
    if st != 200:
        return {}
    text = html.unescape(re.sub(r"<[^>]+>", " ", page_text(raw)))
    text = re.sub(r"[\s​ ]+", " ", text)
    found = {}
    for m in re.finditer(r"512[A-Z]\d{3}V\d{2}", text, flags=re.I):
        before = text[max(0, m.start() - 160):m.start()]
        nums = re.findall(r"(?<![\d.])(\d{3})(?![\d.])", before)
        if nums:
            found[nums[-1]] = m.group(0).upper()
    STATUS["registry"]["uin_matches"] = len(re.findall(r"512[A-Z]\d{3}V\d{2}", text, flags=re.I))
    STATUS["registry"]["plans_found"] = len(found)
    if not found:  # debug: page मध्ये table कसं दिसतं ते पाहण्यासाठी छोटा नमुना
        i = text.lower().find("plan no")
        STATUS["registry"]["sample"] = text[max(0, i - 100):i + 500] if i >= 0 else text[:600]
    return found


# ---------------- 2. Brochure शोधणे ----------------

SKIP_WORDS = ("hindi", "_hin", "marathi", "policy+document", "policy%20document", "policy document", "cis", "customer information",
              "benefit illustration", "proposal", "claim", "form")


def find_brochure(detail_url: str, known: str | None) -> tuple[str | None, int, list]:
    """Plan page वरची सगळ्यात नवीन English sales brochure (anchor text / href मध्ये 'brochure', सगळ्यात मोठा ?t=)."""
    st, raw = get(detail_url, "text/html")
    cands = []
    if st == 200:
        for m in re.finditer(r'<a\b[^>]*href="([^"]+?\.pdf[^"]*)"[^>]*>(.*?)</a>', page_text(raw), flags=re.I | re.S):
            href = html.unescape(m.group(1))
            label = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", m.group(2)))).strip()
            both = (href + " " + label).lower()
            if "brochure" not in both or any(w in both for w in SKIP_WORDS):
                continue
            ts = re.search(r"[?&]t=(\d{10,})", href)
            if href.startswith("/"):
                href = "https://licindia.in" + href
            cands.append([int(ts.group(1)) if ts else 0, href, label[:90]])
    if known and not any(known.split("?")[0] == c[1].split("?")[0] for c in cands):
        ts = re.search(r"[?&]t=(\d{10,})", known)
        cands.append([int(ts.group(1)) if ts else 0, known, "(known link)"])
    cands.sort(key=lambda c: c[0])
    return (cands[-1][1] if cands else None), st, cands[-6:]


# ---------------- 3. Gemini ने brochure मधून data काढणे ----------------

PROMPT = """You are reading an official LIC of India SALES BROCHURE (PDF). Extract facts exactly as printed.
Return ONLY a JSON object with these keys (use null when the brochure does not state it; never guess):
{
 "plan_no": "3-digit plan number", "uin": "UIN like 512N277V03", "plan_name": "official name",
 "min_entry_age": int, "max_entry_age": int, "min_maturity_age": int|null, "max_maturity_age": int|null,
 "policy_terms": [ints] (all allowed policy terms; null if policy term = 100 - age),
 "ppt_options": [ints] (premium paying term choices, or GA period choices for single-premium income plans; null if PPT = policy term),
 "term_to_ppt": {"term": ppt} (only when PPT is fixed per policy term, e.g. Jeevan Labh 16->10),
 "min_entry_age_by_term": {"term_or_ppt": min_age} (only if the brochure has such a table),
 "max_entry_age_by_term": {"term_or_ppt": max_age} (only if the brochure has such a table),
 "min_bsa": number, "bsa_multiples": [[from_bsa, multiple], ...],
 "hsa_rebate_per_1000": [[from_bsa, rebate_rupees_per_1000_bsa], ...] (convert "%o"/per mille to rupees per 1000; [] if nil),
 "hsa_rebate_by_age": [[max_age, [[from_bsa, rebate_per_1000], ...]], ...] (only if rebate differs by age),
 "mode_adjust_pct": {"yearly": number, "half": number, "quarter": number, "month": number}
     (rebate as NEGATIVE %, loading as POSITIVE %, on tabular premium; null for single premium plans),
 "survival_benefit_pct_of_bsa": number|null, "guaranteed_addition_per_1000": number|null,
 "death_sa_pct_of_bsa": number|null (the % of BSA in the 'Sum Assured on Death' definition, e.g. 100, 110, 125),
 "sample_bsa": number, "sample_premiums": [[age, term_or_ppt_or_ga_period, premium], ...]
     (every cell of the 'Sample Illustrative Premium' table, premium exactly as printed, exclusive of taxes),
 "brochure_date_or_version": "any date/version printed, else null"
}"""


def gemini_extract(pdf: bytes) -> tuple[dict | None, str]:
    if not GEMINI_KEY:
        return None, "GEMINI_API_KEY missing"
    body = json.dumps({
        "contents": [{"parts": [
            {"inline_data": {"mime_type": "application/pdf", "data": base64.b64encode(pdf).decode()}},
            {"text": PROMPT},
        ]}],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
    }).encode()
    last_err = ""
    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}"
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                res = json.loads(r.read().decode())
            txt = res["candidates"][0]["content"]["parts"][0]["text"]
            txt = re.sub(r"^```(?:json)?|```$", "", txt.strip()).strip()
            return json.loads(txt), model
        except Exception as exc:  # पुढचं model वापरून बघ
            last_err = f"{model}: {str(exc)[:160]}"
    return None, last_err


def to_pairs(v) -> list:
    out = []
    for r in v or []:
        try:
            out.append([float(r[0]) if float(r[0]) % 1 else int(r[0]), float(r[1]) if float(r[1]) % 1 else int(r[1])])
        except (TypeError, ValueError, IndexError):
            pass
    return sorted(out)


def validate_and_map(x: dict, old: dict) -> tuple[dict | None, list[str]]:
    """Gemini चं उत्तर plugin च्या keys मध्ये बदलतो. संशयास्पद वाटलं तर None + कारणं."""
    errs = []
    samples = []
    for s in x.get("sample_premiums") or []:
        try:
            a, t, p = int(s[0]), int(s[1]), float(str(s[2]).replace(",", ""))
            if 0 <= a <= 75 and 1 <= t <= 100 and p > 0:
                samples.append([a, t, p])
        except (TypeError, ValueError, IndexError):
            continue
    sample_sa = x.get("sample_bsa") or 0
    if len(samples) < 3:
        errs.append("sample premium table not found")
    if not (10000 <= float(sample_sa or 0) <= 1e8):
        errs.append("sample BSA missing")
    mn, mx = x.get("min_entry_age"), x.get("max_entry_age")
    if not (isinstance(mn, int) and isinstance(mx, int) and 0 <= mn <= mx <= 75):
        errs.append(f"entry ages odd: {mn}-{mx}")
    if not (x.get("min_bsa") and float(x["min_bsa"]) >= 10000):
        errs.append("min BSA missing")
    # जुन्या samples शी तुलना: एकाच (age, term) चा premium 25% पेक्षा जास्त बदलला तर थांब
    old_s = {(s[0], s[1]): s[2] / max(1, old.get("sample_sa") or 1) for s in old.get("samples") or []}
    for a, t, p in samples:
        o = old_s.get((a, t))
        if o and abs(p / float(sample_sa or 1) - o) / o > 0.25:
            errs.append(f"sample {a}/{t} changed >25% — please check manually")
            break
    if errs:
        return None, errs
    m = {
        "uin": x.get("uin") or old.get("uin", ""),
        "min_age": mn, "max_age": mx,
        "min_sa": int(float(x["min_bsa"])),
        "sa_slabs": to_pairs(x.get("bsa_multiples")) or old.get("sa_slabs", []),
        "samples": samples, "sample_sa": int(float(sample_sa)),
    }
    if x.get("max_maturity_age"):
        m["max_maturity"] = int(x["max_maturity_age"])
    if x.get("min_maturity_age"):
        m["min_maturity"] = int(x["min_maturity_age"])
    if x.get("hsa_rebate_by_age"):
        m["rebate_bands"] = [[int(b[0]), to_pairs(b[1])] for b in x["hsa_rebate_by_age"] if len(b) == 2]
    elif x.get("hsa_rebate_per_1000") is not None:
        m["rebate_slabs"] = to_pairs(x.get("hsa_rebate_per_1000"))
    mode = x.get("mode_adjust_pct")
    if isinstance(mode, dict) and all(k in mode and mode[k] is not None for k in ("yearly", "half", "quarter", "month")):
        m["mode_adj"] = {k: float(mode[k]) for k in ("yearly", "half", "quarter", "month")}
    if x.get("policy_terms"):
        m["terms"] = sorted(int(t) for t in x["policy_terms"])
    if x.get("ppt_options"):
        m["ppt_options"] = sorted(int(t) for t in x["ppt_options"])
    if x.get("term_to_ppt"):
        m["ppt_map"] = {str(int(k)): int(v) for k, v in x["term_to_ppt"].items()}
    if x.get("min_entry_age_by_term"):
        m["min_age_by_term"] = {str(int(k)): int(v) for k, v in x["min_entry_age_by_term"].items()}
    for src, dst in (("survival_benefit_pct_of_bsa", "survival_pct"), ("guaranteed_addition_per_1000", "ga_per_1000"), ("death_sa_pct_of_bsa", "death_pct")):
        if x.get(src) is not None:
            m[dst] = float(x[src])
    return m, []


# ---------------- 4. मुख्य run ----------------

def main() -> int:
    STATUS["run_at"] = now_ist()
    watch = load_json(WATCH_JSON, {})
    data = load_json(PLANS_JSON, {"version": 0, "plans": {}})
    changes, alerts = [], []

    registry = read_registry()
    if registry:
        for pid, w in watch.get("plans", {}).items():
            if pid not in registry:
                alerts.append(f"⚠️ Plan {pid} ({w.get('name')}) LIC च्या सध्याच्या plans यादीत दिसला नाही — withdraw झाला असेल, तपासा.")
            elif w.get("uin") and registry[pid] != w["uin"]:
                alerts.append(f"🆕 Plan {pid} चा UIN बदलला: {w['uin']} → {registry[pid]} (नवीन आवृत्ती).")
        known = set(watch.get("plans", {})) | set(watch.get("ignore", []))
        new = sorted(set(registry) - known)
        if new:
            alerts.append("🆕 LIC च्या यादीत नवीन/न पाहिलेले plans: " + ", ".join(f"{p} ({registry[p]})" for p in new))
        data["registry"] = {"fetched_at": STATUS["run_at"], "plans": registry}
    else:
        STATUS["errors"].append("registry page not readable")

    for pid, w in watch.get("plans", {}).items():
        st_plan = STATUS["plans"].setdefault(pid, {})
        url, http, cands = find_brochure(w["page"], w.get("brochure"))
        st_plan["page_http"] = http
        st_plan["candidates"] = cands
        if not url:
            st_plan["error"] = "brochure link not found"
            continue
        st_plan["brochure"] = url
        code, pdf = get(url, "application/pdf")
        st_plan["pdf_http"], st_plan["pdf_bytes"] = code, len(pdf)
        if code != 200 or not pdf.startswith(b"%PDF"):
            st_plan["error"] = "pdf download failed"
            continue
        sha = hashlib.sha256(pdf).hexdigest()
        old = data["plans"].get(pid, {})
        st_plan["sha256"] = sha
        if old.get("brochure_sha256") == sha and not FORCE:
            st_plan["result"] = "unchanged"
            continue
        dest = BROCHURES / pid / f"{sha[:12]}.pdf"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(pdf)
        extracted, model = gemini_extract(pdf)
        st_plan["model"] = model
        if not extracted:
            st_plan["error"] = "gemini failed: " + model
            alerts.append(f"⚠️ {pid}: नवीन brochure मिळालं पण Gemini ने वाचलं नाही ({model[:80]}).")
            continue
        mapped, errs = validate_and_map(extracted, old)
        (LIC_DIR / "extract" ).mkdir(parents=True, exist_ok=True)
        write_json(LIC_DIR / "extract" / f"{pid}.json", extracted, indent=1)
        if not mapped:
            st_plan["error"] = "; ".join(errs)
            alerts.append(f"⚠️ {pid}: brochure बदललं, पण data तपासणीत अडकलं — {'; '.join(errs)}. हाताने पहा.")
            continue
        merged = dict(old, **mapped)
        merged.update({"brochure": url, "brochure_sha256": sha, "brochure_file": str(dest.relative_to(LIC_DIR.parent.parent)),
                       "extracted_at": STATUS["run_at"], "extract_model": model})
        if {k: v for k, v in old.items() if k not in ("brochure", "brochure_sha256", "brochure_file", "extracted_at", "extract_model")} != \
           {k: v for k, v in merged.items() if k not in ("brochure", "brochure_sha256", "brochure_file", "extracted_at", "extract_model")}:
            changes.append(pid)
        data["plans"][pid] = merged
        st_plan["result"] = "updated"

    if changes or FORCE:
        data["version"] = int(data.get("version", 0)) + 1
    data["checked_at"] = STATUS["run_at"]
    write_json(PLANS_JSON, data, indent=1)
    write_json(STATUS_JSON, STATUS, indent=1)

    if changes:
        alerts.insert(0, "📘 LIC brochure data बदलला: " + ", ".join(changes) + ". WordPress → A4U LIC → 'Pending update' मध्ये तपासून Approve करा.")
    if STATUS["errors"]:
        alerts.append("❗ " + "; ".join(STATUS["errors"]))
    if alerts:
        notify("A4U LIC Calculator — weekly data check\n\n" + "\n".join(alerts))
    print(json.dumps(STATUS, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
