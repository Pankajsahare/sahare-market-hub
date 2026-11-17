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
import time
import urllib.error
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
GEMINI_MODELS_ENV = [m for m in os.environ.get("GEMINI_MODELS", "").split(",") if m]  # रिकामं = आपोआप निवड
CATEGORY_PAGES = [  # LIC च्या plan category pages (plan no + UIN यांच्या links मधून)
    "https://licindia.in/web/guest/endowment-plans", "https://licindia.in/web/guest/whole-life-plans",
    "https://licindia.in/web/guest/money-back-plans", "https://licindia.in/web/guest/term-assurance-plans",
    "https://licindia.in/web/guest/pension-plans", "https://licindia.in/web/guest/unit-linked-plans",
    "https://licindia.in/web/guest/micro-insurance-plans", "https://licindia.in/web/guest/riders",
]
FORCE = os.environ.get("LIC_FORCE", "") == "1"  # brochure बदललं नसलं तरी पुन्हा extract
MAX_EXTRACT = int(os.environ.get("LIC_MAX_EXTRACT", "3"))  # Gemini free tier — एका run मध्ये इतकेच brochures; बाकी पुढच्या दिवशी

STATUS: dict = {"run_at": "", "registry": {}, "plans": {}, "bonus": {}, "models": [], "errors": []}


def now_ist() -> str:
    return dt.datetime.now(IST).strftime("%Y-%m-%d %H:%M")


def get(url: str, accept: str = "*/*") -> tuple[int, bytes]:
    return http_get(url, LIC_HOME, accept=accept, timeout=60, retries=2)


def page_text(raw: bytes) -> str:
    return raw.decode("utf-8", "ignore")


# ---------------- 1. Registry: LIC च्या सध्याच्या plans ची यादी ----------------

def read_registry() -> dict[str, str]:
    """{plan_no: uin} — category pages वरच्या plan links मधून (उदा. .../lic-s-new-endowment-plan-714-512n277v03).
    insurance-plan page ची table JavaScript ने येते, म्हणून ती वाचता येत नाही."""
    found: dict[str, str] = {}
    pages = {}
    for url in CATEGORY_PAGES + [REGISTRY_URL, LIC_HOME]:
        st, raw = get(url, "text/html")
        pages[url.rstrip("/").rsplit("/", 1)[-1]] = st
        if st != 200:
            continue
        PAGE_CACHE[url] = page_text(raw)
        txt = html.unescape(page_text(raw))
        for m in re.finditer(r"(?<!\d)(\d{3})(?:%09|\s|-|_|\+)+(512[a-z]\d{3}v\d{2})", txt, flags=re.I):
            found.setdefault(m.group(1), m.group(2).upper())
        for m in re.finditer(r"(512[A-Z]\d{3}V\d{2})", txt):  # table text असेल तर
            before = re.sub(r"<[^>]+>", " ", txt[max(0, m.start() - 300):m.start()])
            nums = re.findall(r"(?<![\d.])(\d{3})(?![\d.])", before)
            if nums:
                found.setdefault(nums[-1], m.group(1))
    STATUS["registry"] = {"pages_http": pages, "plans_found": len(found)}
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


_MODELS: list[str] | None = None
PAGE_CACHE: dict[str, str] = {}

BONUS_PROMPT = """This PDF is an LIC of India bonus / 'Results of Valuation' circular. For EACH plan number present, return the
Simple Reversionary Bonus and Final Additional Bonus rates per Rs.1000 Sum Assured, by policy-term band.
If rates differ by Sum Assured band, use the band that includes Rs.5,00,000. Return ONLY JSON:
{"valuation_date": "YYYY-MM-DD or text", "plans": [{"plan_no": "714", "bands": [{"from_term": 12, "srb_per_1000": 40, "fab_per_1000": 0}, ...]}, ...]}
Never guess; omit plans that are not in the circular."""


def find_bonus_circular() -> str | None:
    """S1: LIC च्या pages वर 'bonus' / 'valuation' नावाची सगळ्यात नवीन PDF."""
    best = None
    for page in PAGE_CACHE.values():
        for m in re.finditer(r'<a\b[^>]*href="([^"]+?\.pdf[^"]*)"[^>]*>(.*?)</a>', page, flags=re.I | re.S):
            href = html.unescape(m.group(1))
            both = (href + " " + re.sub(r"<[^>]+>", " ", m.group(2))).lower()
            if "bonus" not in both and "valuation" not in both:
                continue
            ts = re.search(r"[?&]t=(\d{10,})", href)
            t = int(ts.group(1)) if ts else 0
            if href.startswith("/"):
                href = "https://licindia.in" + href
            if not best or t > best[0]:
                best = (t, href)
    return best[1] if best else None


def apply_bonus(data: dict) -> list[str]:
    url = find_bonus_circular()
    STATUS["bonus"] = {"circular": url}
    if not url:
        return []
    code, pdf = http_get(url, LIC_HOME, accept="application/pdf", timeout=90, retries=3)
    if code != 200 or not pdf.startswith(b"%PDF"):
        STATUS["bonus"]["error"] = f"download {code}"
        return []
    sha = hashlib.sha256(pdf).hexdigest()
    if data.get("bonus_circular_sha") == sha and not FORCE:
        STATUS["bonus"]["result"] = "unchanged"
        return []
    x, model = gemini_extract(pdf, BONUS_PROMPT)
    STATUS["bonus"]["model"] = model
    if not x:
        STATUS["bonus"]["error"] = model
        return [f"⚠️ Bonus circular सापडलं, पण वाचता आलं नाही ({model[:80]})."]
    changed = []
    for row in x.get("plans") or []:
        pid = str(row.get("plan_no", "")).strip()
        if pid not in data["plans"]:
            continue
        bands = []
        for b in row.get("bands") or []:
            try:
                ft, srb, fab = int(b["from_term"]), float(b["srb_per_1000"]), float(b.get("fab_per_1000") or 0)
            except (KeyError, TypeError, ValueError):
                continue
            if 5 <= srb <= 120 and 0 <= fab <= 2000:
                bands.append([ft, srb, fab])
        if not bands:
            continue
        bands.sort()
        p = data["plans"][pid]
        if p.get("bonus_bands") != bands:
            changed.append(pid)
        p.update({"bonus_bands": bands, "srb": bands[0][1], "bonus_circular": True, "bonus_valuation": str(x.get("valuation_date") or "")})
    data["bonus_circular_sha"] = sha
    data["bonus_circular_url"] = url
    STATUS["bonus"]["result"] = "updated " + ",".join(changed) if changed else "no plan changes"
    return [f"💰 LIC bonus circular मधून नवीन bonus दर: {', '.join(changed)} — WordPress मध्ये Approve करा."] if changed else []


def gemini_models() -> list[str]:
    """तुझ्या key ला उपलब्ध असलेली PDF वाचू शकणारी models — flash आधी, नवीन version आधी."""
    global _MODELS
    if _MODELS is not None:
        return _MODELS
    if GEMINI_MODELS_ENV:
        _MODELS = GEMINI_MODELS_ENV
        return _MODELS
    names = []
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key={GEMINI_KEY}"
        with urllib.request.urlopen(url, timeout=30) as r:
            for m in json.loads(r.read().decode()).get("models", []):
                n = m.get("name", "").split("/")[-1]
                if "generateContent" not in m.get("supportedGenerationMethods", []):
                    continue
                if not n.startswith("gemini") or any(w in n for w in ("image", "tts", "live", "audio", "embedding", "thinking", "exp", "preview", "lite")):
                    continue
                names.append(n)
    except Exception as exc:
        STATUS["errors"].append("ListModels failed: " + str(exc)[:120])

    def score(n: str):
        ver = re.findall(r"(\d+(?:\.\d+)?)", n)
        return (1 if "flash" in n else 0, float(ver[0]) if ver else 0, -len(n))
    _MODELS = sorted(set(names), key=score, reverse=True)[:4]
    STATUS["models"] = _MODELS
    return _MODELS


def gemini_call(pdf: bytes, prompt: str, model: str) -> dict:
    body = json.dumps({
        "contents": [{"parts": [
            {"inline_data": {"mime_type": "application/pdf", "data": base64.b64encode(pdf).decode()}},
            {"text": prompt},
        ]}],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
    }).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}"
    res = None
    for wait in (0, 30, 75, 150):  # 429/503 आलं तर थांबून पुन्हा (free tier मर्यादा)
        if wait:
            time.sleep(wait)
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=150) as r:
                res = json.loads(r.read().decode())
            break
        except urllib.error.HTTPError as exc:
            if exc.code not in (429, 500, 503) or wait == 150:
                raise
    time.sleep(6)  # पुढच्या call आधी थोडा श्वास
    txt = res["candidates"][0]["content"]["parts"][0]["text"]
    txt = re.sub(r"^```(?:json)?|```$", "", txt.strip()).strip()
    return json.loads(txt)


def gemini_extract(pdf: bytes, prompt: str = "") -> tuple[dict | None, str]:
    """S3: दोन वेगवेगळ्या models (नसेल तर एकाच model ने दोनदा) वाचून, मुख्य आकडे जुळले तरच स्वीकार."""
    if not GEMINI_KEY:
        return None, "GEMINI_API_KEY missing"
    prompt = prompt or PROMPT
    models = gemini_models()
    if not models:
        return None, "no Gemini model available for this key"
    reads, used, errs = [], [], []
    for m in models:
        try:
            reads.append(gemini_call(pdf, prompt, m))
            used.append(m)
        except Exception as exc:
            errs.append(f"{m}: {str(exc)[:100]}")
        if len(reads) == 2:
            break
    if len(reads) == 1:  # दुसरं model नाही — तेच model पुन्हा, वेगळ्या सूचनेने
        try:
            reads.append(gemini_call(pdf, prompt + "\nRead the tables slowly, cell by cell, and double-check every number.", used[0]))
            used.append(used[0] + "#2")
        except Exception as exc:
            errs.append(f"{used[0]}#2: {str(exc)[:100]}")
    if not reads:
        return None, "; ".join(errs)[:300]
    if len(reads) == 2 and not same_core(reads[0], reads[1]):
        return None, "two reads disagree (" + ", ".join(used) + ") — needs manual check"
    return reads[0], "+".join(used)


def core_view(x: dict) -> str:
    keys = ("min_entry_age", "max_entry_age", "min_bsa", "sample_bsa", "bsa_multiples", "hsa_rebate_per_1000", "sample_premiums", "plans")
    def norm(v):
        if isinstance(v, list):
            return [norm(i) for i in v]
        if isinstance(v, dict):
            return {k: norm(v[k]) for k in sorted(v)}
        if isinstance(v, str):
            t = v.replace(",", "").strip()
            try:
                return round(float(t), 2)
            except ValueError:
                return t.lower()
        if isinstance(v, (int, float)):
            return round(float(v), 2)
        return v
    return json.dumps({k: norm(x.get(k)) for k in keys if k in x}, sort_keys=True)


def same_core(a: dict, b: dict) -> bool:
    return core_view(a) == core_view(b)


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
    # यादी नीट वाचली गेली असेल (किमान 15 plans) तरच withdraw/new सूचना — नाहीतर खोट्या सूचना येतील
    if len(registry) >= 15:
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
        STATUS["registry"]["note"] = f"only {len(registry)} plans read — withdraw/new-plan alerts skipped this week"
    if registry:
        data["registry"] = {"fetched_at": STATUS["run_at"], "plans": registry}

    jobs = []  # (pid, url, sha, dest, pdf, old)
    for pid, w in watch.get("plans", {}).items():
        st_plan = STATUS["plans"].setdefault(pid, {})
        url, http, cands = find_brochure(w["page"], w.get("brochure"))
        st_plan["page_http"] = http
        st_plan["candidates"] = cands
        if not url:
            st_plan["error"] = "brochure link not found"
            continue
        st_plan["brochure"] = url
        code, pdf = http_get(url, LIC_HOME, accept="application/pdf", timeout=90, retries=4)
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
        jobs.append((pid, url, sha, dest, pdf, old))

    # Gemini — free tier साठी एकामागून एक, एका run मध्ये MAX_EXTRACT; बाकी पुढच्या run ला (pipeline रोज चालतो)
    gemini_models()
    for j in jobs[MAX_EXTRACT:]:
        STATUS["plans"][j[0]]["result"] = "queued for next run"
    jobs = jobs[:MAX_EXTRACT]
    results = [gemini_extract(j[4], PROMPT) for j in jobs]

    for (pid, url, sha, dest, pdf, old), (extracted, model) in zip(jobs, results):
        st_plan = STATUS["plans"][pid]
        st_plan["model"] = model
        if not extracted:
            st_plan["error"] = "gemini failed: " + model
            alerts.append(f"⚠️ {pid}: नवीन brochure मिळालं पण Gemini ने वाचलं नाही ({model[:80]}).")
            continue
        mapped, errs = validate_and_map(extracted, old)
        (LIC_DIR / "extract").mkdir(parents=True, exist_ok=True)
        write_json(LIC_DIR / "extract" / f"{pid}.json", extracted, indent=1)
        if not mapped:
            st_plan["error"] = "; ".join(errs)
            alerts.append(f"⚠️ {pid}: brochure बदललं, पण data तपासणीत अडकलं — {'; '.join(errs)}. हाताने पहा.")
            continue
        merged = dict(old, **mapped)
        merged.update({"brochure": url, "brochure_sha256": sha, "brochure_file": str(dest.relative_to(LIC_DIR.parent.parent)),
                       "extracted_at": STATUS["run_at"], "extract_model": model})
        skip = ("brochure", "brochure_sha256", "brochure_file", "extracted_at", "extract_model")
        if {k: v for k, v in old.items() if k not in skip} != {k: v for k, v in merged.items() if k not in skip}:
            changes.append(pid)
        data["plans"][pid] = merged
        st_plan["result"] = "updated"

    bonus_msgs = apply_bonus(data)
    if bonus_msgs and any("नवीन bonus" in m for m in bonus_msgs):
        changes.append("bonus")
    alerts.extend(bonus_msgs)
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
