import csv
import io
import urllib.request
import zipfile

HDR = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}


def get(url, ref=None):
    h = dict(HDR)
    if ref:
        h["Referer"] = ref
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=30) as r:
            return r.status, r.read()
    except Exception as e:
        return getattr(e, "code", str(e)[:80]), b""


def rows(raw, url):
    if url.endswith(".zip"):
        z = zipfile.ZipFile(io.BytesIO(raw))
        raw = z.read(z.namelist()[0])
    return list(csv.reader(io.StringIO(raw.decode("utf-8", "replace"))))


for d, ymd in [("09112026", "20261109"), ("06112026", "20261106")]:
    tests = {
        "NSE old full": f"https://nsearchives.nseindia.com/products/content/sec_bhavdata_full_{d}.csv",
        "NSE UDiFF": f"https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_{ymd}_F_0000.csv.zip",
        "BSE UDiFF": f"https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_{ymd}_F_0000.CSV",
    }
    for name, url in tests.items():
        ref = "https://www.nseindia.com/" if "nse" in url else "https://www.bseindia.com/"
        st, raw = get(url, ref)
        info = ""
        if st == 200 and raw:
            try:
                rs = rows(raw, url)
                info = f"rows={len(rs)} hdr={[c.strip() for c in rs[0]][:16]}"
                hits = [r for r in rs if any(x.strip().upper().startswith(("SGB", "718GS", "740GS")) for x in r[:8])]
                info += f" bondhits={len(hits)} sample={hits[:5]}"
            except Exception as e:
                info = f"parse err {e}"
        print(d, name, st, info, flush=True)

for name, url in {
    "FBIL home": "https://www.fbil.org.in/",
    "CCIL home": "https://www.ccilindia.com/",
    "RBI home": "https://www.rbi.org.in/",
    "Yahoo chart": "https://query1.finance.yahoo.com/v8/finance/chart/GOLDBEES.NS?range=5d&interval=1d",
}.items():
    st, raw = get(url)
    print(name, st, len(raw), flush=True)
