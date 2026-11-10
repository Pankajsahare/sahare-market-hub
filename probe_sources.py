import io, urllib.request, zipfile
HDR = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", "Accept": "*/*"}
def get(url, ref=None, extra=None):
    h = dict(HDR); h.update(extra or {})
    if ref: h["Referer"] = ref
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=40) as r:
            return r.status, r.read()
    except Exception as e:
        return getattr(e, "code", str(e)[:80]), b""
st, raw = get("https://www.bseindia.com/download/Bhavcopy/Debt/DEBTBHAVCOPY09112026.zip", "https://www.bseindia.com/")
if st == 200:
    z = zipfile.ZipFile(io.BytesIO(raw))
    for f in z.namelist():
        t = z.read(f).decode("utf-8", "replace").splitlines()
        print(f, len(t)); [print("   ", l[:300]) for l in t[:3]]
        if f.startswith("fgroup"):
            filled = sum(1 for l in t[1:] if l.rstrip(", ").count(",") >= 12 and l.split(",")[-1].strip())
            print("   rows with maturity:", filled, "/", len(t) - 1)
            [print("   ", l[:300]) for l in t[100:104]]
for name, url, extra in [
    ("NSDL home", "https://www.indiabondinfo.nsdl.com/", None),
    ("NSDL api1", "https://www.indiabondinfo.nsdl.com/bds-service/v1/public/bdsinfo/isin?isin=INE248U07FU9", {"Accept": "application/json"}),
    ("NSDL api2", "https://www.indiabondinfo.nsdl.com/bds-service/v1/public/isin/INE248U07FU9", {"Accept": "application/json"}),
    ("NSDL CBD", "https://www.indiabondinfo.nsdl.com/CBDServices/rest/isinDetails?isin=INE248U07FU9", {"Accept": "application/json"}),
]:
    st, raw = get(url, "https://www.indiabondinfo.nsdl.com/", extra)
    print(name, st, len(raw), raw[:300])
