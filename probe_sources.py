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
        with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=40) as r:
            return r.status, r.read()
    except Exception as e:
        return getattr(e, "code", str(e)[:80]), b""


def show_text(name, raw, n=4):
    txt = raw.decode("utf-8", "replace").splitlines()
    print(f"   [{name}] lines={len(txt)}")
    for line in txt[:n]:
        print("     ", line[:400])


# 1) NSE PR zip (market activity) — look for corpbond file
for d in ["091126", "061126"]:
    st, raw = get(f"https://nsearchives.nseindia.com/archives/equities/bhavcopy/pr/PR{d}.zip", "https://www.nseindia.com/")
    print("NSE PR", d, st, len(raw))
    if st == 200:
        z = zipfile.ZipFile(io.BytesIO(raw))
        print("   files:", z.namelist())
        for f in z.namelist():
            if "corp" in f.lower() or "bond" in f.lower():
                show_text(f, z.read(f), 6)
        break

# 2) NSE CM UDiFF: non-equity series sample (NCDs)
st, raw = get("https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_20261109_F_0000.csv.zip", "https://www.nseindia.com/")
if st == 200:
    z = zipfile.ZipFile(io.BytesIO(raw))
    lines = z.read(z.namelist()[0]).decode("utf-8", "replace").splitlines()
    import collections
    ser = collections.Counter(l.split(",")[8] for l in lines[1:])
    print("NSE UDiFF series:", ser.most_common(40))
    nc = [l for l in lines if any(k in l.upper() for k in ("NCD", "SEC RE", "%"))][:6]
    for l in nc:
        print("   ", l[:300])

# 3) BSE debt candidates
for u in [
    "https://www.bseindia.com/download/Bhavcopy/Debt/DEBTBHAVCOPY09112026.zip",
    "https://www.bseindia.com/download/Bhavcopy/Debt/DEBTBHAVCOPY09112026.csv",
    "https://www.bseindia.com/download/Bhavcopy/Debt/fgdebt091126.zip",
    "https://www.bseindia.com/download/BhavCopy/Debt/BhavCopy_BSE_DB_0_0_0_20261109_F_0000.CSV",
    "https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_20261109_F_0000.CSV",
]:
    st, raw = get(u, "https://www.bseindia.com/")
    print("BSE", u.rsplit("/", 1)[1], st, len(raw))
    if st == 200 and raw:
        if u.endswith(".zip"):
            z = zipfile.ZipFile(io.BytesIO(raw))
            print("   files:", z.namelist())
            show_text(z.namelist()[0], z.read(z.namelist()[0]))
        elif "BSE_CM" in u:
            lines = raw.decode("utf-8", "replace").splitlines()
            import collections
            print("   series:", collections.Counter(l.split(",")[8] for l in lines[1:]).most_common(30))
            for l in [l for l in lines if "%" in l][:5]:
                print("    ", l[:300])
        else:
            show_text("csv", raw)

# 4) NSDL India Bond Info + others
for name, url in {
    "NSDL IBI home": "https://www.indiabondinfo.nsdl.com/",
    "NSDL IBI api?": "https://www.indiabondinfo.nsdl.com/bds-service/v1/public/bdsinfo/isin?isin=INE248U07FU9",
    "NSE debt home": "https://www.nseindia.com/market-data/debt-market-reports",
    "FBIL": "https://www.fbil.org.in/",
}.items():
    st, raw = get(url)
    print(name, st, len(raw), raw[:200])
