#!/usr/bin/env python3
"""
LIC tariff + catalogue builder (A4U LIC Calculator 4.x)
-------------------------------------------------------
वापर:  python3 -I scripts/build_lic_tariff.py /path/to/creations.db

creations.db (LIC चे दर, factors) repo मध्ये ठेवायची नाही. ही script त्यातून
फक्त calculator / plan पानांना लागणारे आकडे काढून plugin च्या assets/data मध्ये लिहिते:
  lic-tariff.json   — premium दर, GSV/SSV factors, term rider दर (calculator plans)
  lic-catalog.json  — सर्व चालू plans ची तथ्यं (वय, मुदत, SA, modes, riders, form)
  lic-branches.json — LIC शाखा (राज्य/विभाग/पत्ता/पिन)
  lic-tools.json    — revival व्याज factors, medical requirement chart
दुसऱ्या app चा मजकूर (summary, FAQ, pitch) इथे घेतला जात नाही — फक्त तथ्यं आणि आकडे.
"""
import json
import os
import re
import sqlite3
import sys

OUT = os.path.join(os.path.dirname(__file__), '..', 'wp', 'a4u-lic-calculator', 'plugin', 'a4u-lic-calculator', 'assets', 'data')

# calculator मधले plans आणि त्यांचं SSV कुटुंब
CALC = {
    # 733 (Lakshya) आणि money-back plans चं SSV सूत्र खऱ्या quote शी पडताळलेलं नाही → फक्त GSV
    '714': 'endow', '715': 'endow', '717': 'endow', '733': 'lakshya', '736': 'endow', '760': 'endow',
    '720': 'mb', '721': None, '732': None,
    '745': 'umang', '771': 'utsav', '883': 'utsav_sp',
    '894': None,  # Jeevan Raksha (term) — surrender value नाही
    '770': None,  # Bima Platinum: दर PPT नुसार वेगळे तक्ते; SSV पडताळलेलं नाही → GSV
}
_BG = os.path.join(os.path.dirname(__file__), 'lic_gsv_brochure.json')
BROCHURE_GSV = json.load(open(_BG)) if os.path.exists(_BG) else {}
PPT_TABLES = {'770': [7, 10, 12, 15, 18]}
# 894 Jeevan Raksha: लिंग (M/F) × धूम्रपान (NS/S) × हप्ता पर्याय (RP / LP_10 / LP_15 / SP)
OPT_TABLES = {'894': [g + '_' + s + '_' + o for g in ('M', 'F') for s in ('NS', 'S') for o in ('RP', 'LP_10', 'LP_15', 'SP')]}


def num(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return round(f, 6)


def colkey(name):
    m = re.search(r'(\d+)$', name)
    return int(m.group(1)) if m else None


def grid(c, table):
    """तक्ता → {"c":[columns], "r":{row:[values]}} (0 / रिकामे → null)"""
    cols = [r[1] for r in c.execute(f'pragma table_info("{table}")')]
    keys = [colkey(x) for x in cols[1:]]
    if len(cols) == 2:
        keys = [0]
    rows = {}
    for r in c.execute(f'select * from "{table}"'):
        if r[0] is None:
            continue
        vals = [num(v) for v in r[1:]]
        vals = [v if v else None for v in vals]
        if any(v is not None for v in vals):
            rows[str(int(float(r[0])))] = vals
    return {'c': keys, 'r': rows}


def has(c, t):
    return c.execute("select 1 from sqlite_master where type='table' and name=?", (t,)).fetchone() is not None


def split_cols(c, table, prefix):
    """ssv_771_factors सारखे तक्ते: F1 (एक column) + F2_<ppt> (grid)"""
    cols = [r[1] for r in c.execute(f'pragma table_info("{table}")')]
    single, multi = {}, {'c': [], 'r': {}}
    multi_cols = [x for x in cols[1:] if x.startswith(prefix + '_')]
    multi['c'] = [colkey(x) for x in multi_cols]
    for r in c.execute(f'select * from "{table}"'):
        row = dict(zip(cols, r))
        k = str(int(float(r[0])))
        v = num(row.get('F1'))
        if v:
            single[k] = [v]
        mv = [num(row[x]) or None for x in multi_cols]
        if any(mv):
            multi['r'][k] = mv
    return {'c': [0], 'r': single}, multi


def tariff(c):
    out = {}
    for p, fam in CALC.items():
        if p in OPT_TABLES:
            d = {'rate_by_opt': {k: grid(c, f'table_{p}_{k}') for k in OPT_TABLES[p]}}
        elif p in PPT_TABLES:
            d = {'rate_by_ppt': {str(k): grid(c, f'table_{p}_{k}') for k in PPT_TABLES[p]},
                 'term_rider_by_ppt': {str(k): grid(c, f'TermRider_{p}_{k}') for k in PPT_TABLES[p] if has(c, f'TermRider_{p}_{k}')}}
        else:
            d = {'rate': grid(c, f'table_{p}')}
        if has(c, f'gsv_p_{p}'):
            d['gsv_p'] = grid(c, f'gsv_p_{p}')
        for t, k in ((f'gsv_b_{p}', 'gsv_b'), (f'gsv_g_{p}', 'gsv_g'), (f'gsv_ga_{p}', 'gsv_ga')):
            if has(c, t):
                d[k] = grid(c, t)
        # LIC च्या नवीन brochure मधले GSV factors (DB पेक्षा नवीन असल्यास) → हेच वापरा
        if p in BROCHURE_GSV:
            d.update(BROCHURE_GSV[p])
        if has(c, f'TermRider_{p}'):
            d['term_rider'] = grid(c, f'TermRider_{p}')
        ssv = None
        if fam in ('endow', 'mb', 'lakshya'):
            if has(c, f'ssv_{p}_f1') and has(c, f'ssv_{p}_f2'):
                ssv = {'family': fam, 'f1': grid(c, f'ssv_{p}_f1'), 'f2': grid(c, f'ssv_{p}_f2')}
        elif fam == 'umang':  # 745: (PUSA + bonus) × F1 + paid-up income × F3_<PPT> (LIC BI शी पडताळलेलं)
            f1, f3 = split_cols(c, f'ssv_{p}_factors', 'F3')
            ssv = {'family': fam, 'f1': f1, 'f3': f3}
        elif fam == 'utsav':
            f1, f2 = split_cols(c, f'ssv_{p}_factors', 'F2')
            ssv = {'family': fam, 'f1': f1, 'f2': f2}
        elif fam == 'utsav_sp':
            g = grid(c, f'ssv_{p}_f1_f2')
            f1 = {'c': [0], 'r': {k: [round((v[0] or 0) + (v[1] or 0), 6)] for k, v in g['r'].items()}}
            ssv = {'family': fam, 'f1': f1, 'f3': grid(c, f'ssv_{p}_f3'), 'f4': grid(c, f'ssv_{p}_f4')}
        if ssv:
            d['ssv'] = ssv
        out[p] = d
    return out


# ---------- catalogue (तथ्यं) ----------
FIELD = [
    ('name', ('Plan Name',)),
    ('modes', ('Premium Payment Mode', 'Premium Modes', 'Annuity Payment Mode', 'Annuity mode')),
    ('min_age', ('Minimum Age at Entry',)),
    ('max_age', ('Maximum Age at Entry',)),
    ('max_maturity', ('Maximum Maturity Age', 'Maturity Age', 'Maximum Cover Ceasing Age')),
    ('term', ('Term', 'Policy Term Options', 'Term/premium paying term')),
    ('ppt', ('Premium paying term', 'Premium Paying Term', 'Premium Payment Term', 'Premium Payment Terms')),
    ('min_sa', ('Minimum Sum Assured', 'Minimum Sum Assured (BSA)', 'Minimum Basic Sum Assured', 'Minimum Sum Assured on Death', 'Sum Assured')),
    ('max_sa', ('Maximum Sum Assured',)),
    ('min_price', ('Minimum Purchase Price', 'Minimum Premium', 'Minimum Instalment Premium')),
    ('max_price', ('Maximum Purchase Price', 'Maximum Premium')),
    ('riders', ('Riders Available', 'Riders available', 'Riders')),
    ('loan', ('Loan', 'Loans')),
    ('tax', ('Income Tax Benefit', 'Income-Tax Benefit')),
    ('form', ('Proposal Form',)),
    ('launch', ('Date of Launch',)),
    ('uin', ('UIN (Quote in docs)', 'UIN (quote in docs)')),
    ('deferment', ('Deferment Period',)),
    ('annuity_options', ('Annuity Options',)),
]
LABEL2KEY = {}
for k, labels in FIELD:
    for l in labels:
        LABEL2KEY[l.lower()] = k


def clean(s):
    s = (s or '').replace('�', '-').replace('\xa0', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def category(pid, name):
    n = name.lower()
    pid = int(pid)
    if pid in (905, 906, 907, 908) or 'cancer' in n or 'arogya' in n or 'health' in n:
        return 'health'
    if 'pension' in n or 'annuity' in n or 'akshay' in n or 'shanti' in n or 'dhara' in n or pid in (857, 858, 862, 872, 879, 892, 867):
        return 'pension'
    if pid in (749, 752, 873, 886, 887, 888, 889, 890, 867) or 'ulip' in n or 'siip' in n or 'nivesh' in n or 'index plus' in n or 'protection plus' in n:
        return 'ulip'
    if 'term' in n or 'raksha' in n or 'tech term' in n or 'saral jeevan bima' in n or pid in (954, 955, 875, 876, 877, 894, 859):
        return 'term'
    if 'money back' in n or 'moneyback' in n or 'bachat' in n or pid in (720, 721, 732, 916, 734, 735):
        return 'moneyback'
    if 'umang' in n or 'utsav' in n or 'whole' in n or pid in (745, 771, 883):
        return 'wholelife'
    if 'child' in n or 'tarun' in n or 'amritbaal' in n:
        return 'child'
    return 'endowment'


def catalog(c):
    cols = [r[1] for r in c.execute('pragma table_info(plan_features)')]
    rows = c.execute('select * from plan_features').fetchall()
    plans = {}
    for col in cols:
        if not col.startswith('L') or col == 'Line':
            continue
        pid = col[1:]
        i, j = cols.index('L' + pid), cols.index('T' + pid)
        f = {}
        for r in rows:
            lab = clean(r[i]).rstrip(':').strip()
            val = clean(r[j])
            if not lab or lab == 'L' + pid or not val or val == 'T' + pid:
                continue
            if lab.lower().startswith('plan name') and ':' in lab:  # "Plan Name: Protection Plus (886)"
                val, lab = lab.split(':', 1)[1].strip(), 'Plan Name'
            k = LABEL2KEY.get(lab.lower())
            if k and k not in f:
                f[k] = val
        name = f.get('name', '')
        name = re.sub(r'\s*-\s*\(', ' (', name).strip()
        m = re.search(r'\((\d{3})\)', name)
        base = re.sub(r'\s*\(\d{3}\)\s*$', '', name).strip() or ('Plan ' + pid)
        base = re.sub(r"^LIC'?s\s+", '', base, flags=re.I).strip()
        f['name'] = base
        f['id'] = pid
        f['category'] = category(pid, base)
        plans[pid] = f
    return plans


def branches(c):
    out = []
    for r in c.execute('select Branch_Code, Branch_Name, Office_Name, Branch_Address, PinCode, Divisional_Office_Code, Divisional_Office_Name from branches'):
        out.append([str(r[0]), clean(r[1]), clean(r[2]), clean(r[3]), str(r[4] or ''), clean(r[5]), clean(r[6])])
    return out


def tools(c):
    rev = {}
    for r in c.execute('select * from RevivalRate'):
        rev[str(r[0])] = [num(x) for x in r[1:]]
    med_cols = [r[1] for r in c.execute('pragma table_info(med_chart_1)')]
    med = {str(r[0]): [clean(x) for x in r[1:]] for r in c.execute('select * from med_chart_1')}
    return {'revival': {'cols': ['yearly', 'half', 'quarter', 'month', 'broken'], 'rows': rev}, 'medical': {'bands': med_cols[1:], 'rows': med}}


def main():
    db = sys.argv[1] if len(sys.argv) > 1 else 'creations.db'
    c = sqlite3.connect(db)
    os.makedirs(OUT, exist_ok=True)
    files = {
        'lic-tariff.json': {'v': 1, 'note': 'LIC premium rates and surrender factors (per 1000 SA)', 'plans': tariff(c)},
        'lic-catalog.json': {'v': 1, 'plans': catalog(c)},
        'lic-branches.json': {'v': 1, 'cols': ['code', 'name', 'office', 'address', 'pin', 'do_code', 'do_name'], 'rows': branches(c)},
        'lic-tools.json': dict({'v': 1}, **tools(c)),
    }
    # S2: प्रत्येक plan ची स्वतंत्र tariff file — calculator फक्त निवडलेल्या plan ची मागवतो
    os.makedirs(os.path.join(OUT, 'tariff'), exist_ok=True)
    for pid, t in files['lic-tariff.json']['plans'].items():
        with open(os.path.join(OUT, 'tariff', pid + '.json'), 'w', encoding='utf-8') as fh:
            json.dump(t, fh, ensure_ascii=False, separators=(',', ':'))
    for name, data in files.items():
        p = os.path.join(OUT, name)
        with open(p, 'w', encoding='utf-8') as fh:
            json.dump(data, fh, ensure_ascii=False, separators=(',', ':'))
        print(name, os.path.getsize(p))


if __name__ == '__main__':
    main()
