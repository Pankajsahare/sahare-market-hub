#!/usr/bin/env python3
"""LIC brochure (pdftotext -layout) मधले GSV factor तक्ते → scripts/lic_gsv_brochure.json
वापर: python3 -I scripts/lic_gsv_from_brochure.py 733 <brochure.txt> <start_line> <end_line> <p|b> <first_term>
brochure मधले आकडे हे LIC चे प्रकाशित factors आहेत (ते आपल्या DB पेक्षा नवीन असतील तर हेच वापरले जातात)."""
import json, os, re, sys
OUT = os.path.join(os.path.dirname(__file__), 'lic_gsv_brochure.json')

def parse(fn, a, b, first):
    rows = {}
    for l in open(fn).read().split('\n')[a:b]:
        m = re.match(r'\s+(\d+)\s+((?:\d+\.\d+%\s*)+)\s*$', l)
        if not m:
            continue
        y = int(m.group(1)); v = [(round(float(x[:-1]) / 100, 6) or None) for x in re.findall(r'\d+\.\d+%', m.group(2))]
        rows[y] = v
    last = max(len(v) + max(first, y) - 1 for y, v in rows.items())
    cols = list(range(first, last + 1))
    r = {}
    for y, v in rows.items():
        s = max(first, y)
        r[str(y)] = [None] * (s - first) + v + [None] * (len(cols) - (s - first) - len(v))
    return {'c': cols, 'r': r}

if __name__ == '__main__':
    plan, fn, a, b, kind, first = sys.argv[1:7]
    data = json.load(open(OUT)) if os.path.exists(OUT) else {}
    data.setdefault(plan, {})['gsv_' + kind] = parse(fn, int(a), int(b), int(first))
    json.dump(data, open(OUT, 'w'), separators=(',', ':'))
    print(plan, kind, 'rows', len(data[plan]['gsv_' + kind]['r']))
