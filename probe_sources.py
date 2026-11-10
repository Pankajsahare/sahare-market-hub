import re, urllib.request, urllib.parse
HDR = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
       "Accept": "application/json, text/plain, */*", "Referer": "https://www.indiabondinfo.nsdl.com/"}
BASE = "https://www.indiabondinfo.nsdl.com"
def get(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=HDR), timeout=40) as r:
            return r.status, r.read()
    except Exception as e:
        return getattr(e, "code", str(e)[:160]), b""
paths = set()
for page in ["/", "/bds-web/", "/bds-web/index.html"]:
    st, h = get(BASE + page); txt = h.decode("utf-8", "replace")
    print("page", page, st, len(txt), txt[:300].replace("\n", " "))
    for src in re.findall(r'(?:src|href)=["\']([^"\']+\.js[^"\']*)', txt):
        u = urllib.parse.urljoin(BASE + page, src)
        s2, js = get(u); jt = js.decode("utf-8", "replace")
        found = set(re.findall(r'bdsinfo/[A-Za-z]+', jt)) | set(re.findall(r'v1/public/[A-Za-z/]+', jt))
        print("  js", u[-80:], s2, len(jt), sorted(found)[:60])
        paths |= found
print("ALL", sorted(paths))
isin = "INE248U07FU9"
for p in sorted(paths | {"bdsinfo/coupondetail", "bdsinfo/creditrating", "bdsinfo/ratingdetail", "bdsinfo/instrumentdetail", "bdsinfo/keyinformation"}):
    if not p.startswith("bdsinfo/"): continue
    st, b = get(f"{BASE}/bds-service/v1/public/{p}?isin={isin}")
    print(p, st, b[:600])
