import urllib.request
for u in ["https://www.indiabondinfo.nsdl.com/robots.txt", "https://www.cdslindia.com/robots.txt"]:
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as r:
            print(u, r.status); print(r.read().decode("utf-8", "replace")[:3000])
    except Exception as e:
        print(u, "ERR", getattr(e, "code", e))
