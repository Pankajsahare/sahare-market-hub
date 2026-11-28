#!/usr/bin/env node
/*
 * Golden tests — A4U LIC Calculator
 * --------------------------------
 * वापर:  node wp/a4u-lic-calculator/tests/golden.js data/lic/lic-plans.json
 * तीन तपासण्या (एकही चुकली तर exit 1 → GitHub Action नवीन data commit करत नाही):
 *   1. LIC brochure मधला प्रत्येक sample premium calculator अगदी तसाच देतो का (yearly mode)
 *   2. Samples तर्कशुद्ध आहेत का: वय वाढलं की premium कमी होत नाही; मुदत वाढली की premium वाढत नाही
 *   3. प्रत्येक plan साठी वय × term च्या grid वर engine NaN / crash न देता चालतो का
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dataFile = process.argv[2] || 'data/lic/lic-plans.json';
const engineFile = path.join(__dirname, '..', 'plugin', 'a4u-lic-calculator', 'assets', 'a4u-lic.js');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
// v4: LIC tariff (plugin सोबत येतो) — plan ला जोडायचा
const tariffFile = path.join(__dirname, '..', 'plugin', 'a4u-lic-calculator', 'assets', 'data', 'lic-tariff.json');
const tariff = fs.existsSync(tariffFile) ? JSON.parse(fs.readFileSync(tariffFile, 'utf8')).plans : {};

function planTerms(p) {
  if (p.type === 'labh') return Object.keys(p.ppt_map || {}).map(Number);
  if (['umang', 'utsav', 'utsav_sp'].includes(p.type)) return (p.ppt_options || []).map(Number);
  return (p.terms || []).map(Number);
}

// data.php मध्येच असलेल्या (JSON मध्ये नसलेल्या) गोष्टी — plugin सारखंच वागावं म्हणून
const CODE_EXTRA = { '771': { rebate_ppt: { 15: [[1000000, 1.40]] } } };
const plans = Object.entries(data.plans).filter(([, p]) => p && p.type).map(([id, p]) => Object.assign({
  srb: 0, fab: 0, fab_min_term: 99, mode_adj: {}, rebate_slabs: [], rebate_bands: [], bonus_bands: [], riders: [], samples: [],
  sample_sa: 0, points: {}, death_pct: 0, death_sp: [], min_age_by_term: {}, ppt_map: {}, min_maturity: 0, maturity_age: 100, survival_pct: 0, ga_per_1000: 0
}, p, { id: String(id), name: p.name || id, terms: planTerms(p), has_rates: false, verified: 0, closed: 0, tariff: tariff[String(id)] || null }, CODE_EXTRA[String(id)] || {}));

const dom = new JSDOM('<div id="a4u-lic-app"></div>', { url: 'https://example.org/lic-calculator/', runScripts: 'outside-only' });
const w = dom.window;
w.HTMLElement.prototype.scrollIntoView = () => {};
w.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: 1, rates: {} }) });
w.A4U_LIC = {
  rest: 'https://example.org/wp-json/a4u-lic/v1/', version: 1, gst: 0, inflation: 6,
  modal: { yearly: 1, half: 0.51, quarter: 0.26, month: 0.087 }, riderRates: {}, riderMap: {}, whatsapp: '', links: [], plans, advisor: false, brand: {}
};
w.eval(fs.readFileSync(engineFile, 'utf8'));
const E = w.A4U_LIC_API;
if (!E || !E.compute) { console.error('engine API missing'); process.exit(1); }

const SINGLE = { single: 1, utsav_sp: 1 };
const fails = [];
let checked = 0;
const inp = (age, term, sa, srb) => ({ age, term, sa, by: 'sa', mode: 'yearly', gst: 0, income: 'regular', r: {}, srbO: srb || null, fabO: null, doc: new Date(), gender: 'M' });

for (const p of plans) {
  // 1. samples जसेच्या तसे
  for (const [age, key, prem] of p.samples || []) {
    const r = E.compute(p, inp(age, key, p.sample_sa), {});
    checked++;
    if (r.errors) { fails.push(`${p.id}: sample age ${age} term ${key} → ${r.errors.join(' ')}`); continue; }
    const got = SINGLE[p.type] ? r.inst : r.pr.yearPay;
    if (Math.abs(got - prem) > 1) fails.push(`${p.id}: sample age ${age} term ${key} expected ${prem} got ${got.toFixed(2)}`);
  }
  // 2. तर्कशुद्धता
  const byKey = {}, byAge = {};
  for (const [age, key, prem] of p.samples || []) {
    (byKey[key] = byKey[key] || []).push([age, prem]);
    (byAge[age] = byAge[age] || []).push([key, prem]);
  }
  for (const k of Object.keys(byKey)) {
    const s = byKey[k].sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < s.length; i++) if (s[i][1] < s[i - 1][1] * 0.98) fails.push(`${p.id}: term ${k} premium falls with age (${s[i - 1][0]}→${s[i][0]})`);
  }
  for (const a of Object.keys(byAge)) {
    const s = byAge[a].sort((x, y) => x[0] - y[0]);
    for (let i = 1; i < s.length; i++) if (s[i][1] > s[i - 1][1] * 1.02) fails.push(`${p.id}: age ${a} premium rises with longer term (${s[i - 1][0]}→${s[i][0]})`);
  }
  // 3. grid
  for (let age = p.min_age; age <= p.max_age; age += 5) {
    for (const t of p.terms) {
      const r = E.compute(p, inp(age, t, Math.max(p.min_sa, 500000)), {});
      checked++;
      if (r.errors) continue; // पात्रता नसलेले combinations — चालेल
      if (!isFinite(r.inst) || !(r.inst > 0) || !isFinite(r.totalBenefit)) fails.push(`${p.id}: bad result age ${age} term ${t}`);
    }
  }
}

// 4. v4: खऱ्या LIC benefit report शी surrender value (Cash Value) जुळते का (±1%)
const REPORTS = [
  // v4.6.3: वय 3 च्या या report मधली वर्षं 1–2 (risk सुरू होण्याआधी) LIC च्या अधिकृत BI (883 वय 1) शी जुळत नाहीत — काढली
  { id: '771', age: 3, term: 16, sa: 500000, cv: { 3: 32542, 16: 582593, 17: 626255, 18: 673575, 19: 674744 } },
  // ANANDA report (27 Nov 2026): 733 सर्व 13 वर्षं तंतोतंत; 720 पहिली 5 वर्षं (पहिल्या survival benefit आधी) ±2.5%
  // LIC अधिकृत BI (28 Nov 2026): 715 वय 26/36/46 — whole-life भागासकट सगळी वर्षं तंतोतंत
  { id: '715', age: 26, term: 15, sa: 1000000, srb: 11, mode: 'month', tol: 0.001, cv: { 1: 26698, 2: 57333, 3: 106142, 5: 211348, 7: 330228, 14: 1098535 } },
  { id: '715', age: 26, term: 15, sa: 1000000, srb: 28, mode: 'month', tol: 0.001, cv: { 1: 26698, 2: 57333, 3: 127394, 5: 245128, 7: 396451, 14: 1319518 } },
  { id: '715', age: 36, term: 35, sa: 1000000, srb: 8, mode: 'yearly', tol: 0.001, cv: { 1: 4296, 2: 19973, 3: 35433, 5: 85627, 17: 367494, 34: 1535346 } },
  { id: '715', age: 36, term: 35, sa: 1000000, srb: 30, mode: 'yearly', tol: 0.001, cv: { 1: 4296, 2: 19973, 3: 36753, 5: 92238, 17: 427072, 34: 2229939 } },
  { id: '715', age: 46, term: 20, sa: 1000000, srb: 11, mode: 'month', tol: 0.001, cv: { 1: 17121, 2: 41400, 3: 77803, 5: 181867, 10: 416726, 19: 1382941 } },
  { id: '715', age: 46, term: 20, sa: 1000000, srb: 28, mode: 'month', tol: 0.001, cv: { 1: 17121, 2: 41400, 3: 86075, 5: 196342, 10: 460724, 19: 1682879 } },
  // LIC अधिकृत BI (28 Nov 2026), monthly mode: 745 वय 26 PPT 15 — हप्ते काळ आणि नंतरची 40 वर्षं
  { id: '745', age: 26, term: 15, sa: 1000000, srb: 0.0001, mode: 'month', tol: 0.002, cv: { 1: 5080, 2: 48542, 3: 91305, 5: 202260, 10: 506749, 14: 953027, 15: 1019980, 20: 1014368, 30: 1000080, 40: 980816, 50: 959872 } },
  // LIC अधिकृत BI (ebiz.licindia.in, 28 Nov 2026): 714 सगळी वर्षं; 715 वर्ष 2–20; 720 पहिल्या SB नंतरही वर्ष 12 पर्यंत; 745 हप्ते काळ
  { id: '714', age: 36, term: 35, sa: 1000000, srb: 11.5, tol: 0.002, cv: { 1: 3194, 2: 17327, 3: 31013, 5: 75654, 10: 170262, 15: 281927, 20: 411362, 25: 557593, 30: 842822, 34: 1265151 } },
  { id: '714', age: 36, term: 35, sa: 1000000, srb: 29, tol: 0.002, cv: { 1: 3194, 2: 17327, 3: 32063, 5: 80913, 10: 194989, 15: 322746, 20: 470967, 25: 727991, 30: 1210900, 34: 1817668 } },
  { id: '715', age: 36, term: 35, sa: 1000000, srb: 8, tol: 0.002, cv: { 2: 19973, 3: 35433, 5: 85627, 10: 188834, 15: 312718, 20: 456277 } },
  { id: '715', age: 36, term: 35, sa: 1000000, srb: 30, tol: 0.002, cv: { 2: 19973, 3: 36753, 5: 92238, 10: 219920, 15: 364033, 20: 531209 } },
  { id: '720', age: 36, term: 20, sa: 1000000, srb: 7, tol: 0.002, cv: { 2: 47533, 3: 86589, 4: 163086, 5: 204016, 6: 45050, 8: 142622, 10: 268239, 11: 137187, 12: 210276 } },
  { id: '720', age: 36, term: 20, sa: 1000000, srb: 28, tol: 0.002, cv: { 2: 47533, 3: 96808, 4: 177014, 5: 221897, 6: 67200, 8: 172290, 10: 306375, 11: 180153, 12: 258610 } },
  { id: '745', age: 36, term: 30, sa: 1000000, srb: 0.0001, tol: 0.002, cv: { 1: 2540, 2: 19891, 3: 34810, 5: 82880, 10: 172855, 15: 277035, 20: 393116, 21: 417715 } },
  { id: '745', age: 36, term: 30, sa: 1000000, srb: 38, tol: 0.002, cv: { 1: 2540, 2: 19891, 3: 51055, 5: 111247, 10: 236049, 15: 381516, 20: 545344, 21: 580268 } },
  // LIC चा अधिकृत Benefit Illustration (ebiz.licindia.in, 28 Nov 2026): 736, वय 36, मुदत 25, SA 20 लाख — सगळी वर्षं तंतोतंत
  { id: '736', age: 36, term: 25, sa: 2000000, srb: 30, tol: 0.001, cv: { 1: 23275, 2: 57187, 3: 127582, 5: 284930, 10: 640285, 15: 1358918, 20: 2225920, 24: 3194384 } },
  { id: '736', age: 36, term: 25, sa: 2000000, srb: 4, tol: 0.001, cv: { 1: 23275, 2: 57187, 3: 103745, 5: 244500, 10: 540699, 14: 852638, 20: 1502496, 24: 2035491 } },
  { id: '733', age: 36, term: 13, sa: 1000000, srb: 40, tol: 0.002, cv: { 3: 203316, 5: 391090, 8: 776920, 10: 1123080, 12: 1374628, 13: 1520000 } },
  { id: '883', age: 3, term: 14, sa: 500000, cv: { 5: 358911, 10: 519067, 14: 698300, 20: 700469 } },
];
for (const rp of REPORTS) {
  const p = plans.find(x => x.id === rp.id);
  if (!p || !p.tariff) { fails.push(`${rp.id}: tariff missing`); continue; }
  const ri = inp(rp.age, rp.term, rp.sa, rp.srb); if (rp.mode) { ri.mode = rp.mode; }
  const r = E.compute(p, ri, {});
  if (r.errors) { fails.push(`${rp.id}: report case → ${r.errors.join(' ')}`); continue; }
  for (const [y, want] of Object.entries(rp.cv)) {
    checked++;
    const row = r.table[Number(y) - 1];
    const got = row && row.cv;
    if (!(got > 0) || Math.abs(got - want) / want > (rp.tol || 0.01)) fails.push(`${rp.id}: year ${y} cash value expected ${want} got ${got ? Math.round(got) : got}`);
  }
}
// 4b. v4.1: loan = 75% of cash value (2+ वर्षं भरलेले, in-force) — रिकामी loan_ga_bands चूक परत येऊ नये
{
  const p = plans.find(x => x.id === '736');
  const r = p && E.compute(p, inp(30, 21, 1000000), {});
  if (r && !r.errors) {
    for (const y of [3, 5, 10]) {
      checked++;
      const row = r.table[y - 1];
      if (!(row.cv > 0) || Math.abs(row.loan / row.cv - 0.75) > 0.001) fails.push(`736: year ${y} loan should be 75% of cash value (got ${row.loan} / ${row.cv})`);
    }
  }
}
// 4c. v4.2: 770 Bima Platinum आणि 894 Jeevan Raksha — brochure चे sample premium (tariff + mode नियम)
{
  const base = { srb: 0, fab: 0, fab_min_term: 99, rebate_slabs: [], rebate_bands: [], bonus_bands: [], riders: [], samples: [], death_sp: [], min_age_by_term: {}, ppt_map: {}, maturity_age: 100, survival_pct: 0, ga_per_1000: 0, verified: 0, closed: 0, has_rates: false };
  const t770 = tariff['770'], t894 = tariff['894'];
  const p770 = Object.assign({}, base, { id: '770', name: 'Bima Platinum', type: 'platinum', min_age: 0, max_age: 55, min_maturity: 28, max_maturity: 75, min_sa: 300000, sa_slabs: [[300000, 10000]], mode_adj: { yearly: 0, half: 1.8, quarter: 2.72, month: 3.32 }, survival_pct: 10, booster_pct: 70, ga_prem_per_1000: 70, death_pct: 0, terms: [], tariff: t770,
    ga_hsa: { 7: [[500000, 3], [700000, 6], [1000000, 8]], 10: [[500000, 4], [700000, 7], [1000000, 9]], 12: [[500000, 5], [700000, 8], [1000000, 10]], 15: [[500000, 6], [700000, 10], [1000000, 12]], 18: [[500000, 7], [700000, 12], [1000000, 15]] } });
  const S770 = { 15: [81810, 54735, 43020, 32145, 24990], 25: [83145, 55275, 43290, 32220, 25005], 35: [87495, 57015, 44160, 32445, 25005], 45: [100365, 62025, 46770, 33465, 25425] };
  [7, 10, 12, 15, 18].forEach((P, i) => Object.entries(S770).forEach(([age, v]) => {
    if (Number(age) === 45 && P === 18) { /* brochure: वय 45 + 18 वर्षं — तरीही नमुना दिलेला */ }
    checked++;
    const r = E.compute(p770, inp(Number(age), P * 100 + 30, 300000), {});
    if (r.errors) { if (!(Number(age) > 47 && P === 18)) fails.push(`770 age ${age} PPT ${P}: ${r.errors.join(' ')}`); return; }
    if (Math.abs(r.pr.yearPay - v[i]) > 1) fails.push(`770 age ${age} PPT ${P}: expected ${v[i]} got ${Math.round(r.pr.yearPay)}`);
  }));
  const p894 = Object.assign({}, base, { id: '894', name: 'Jeevan Raksha', type: 'term', min_age: 18, max_age: 45, min_maturity: 33, max_maturity: 60, min_sa: 500000, max_sa: 2400000, sa_slabs: [[500000, 50000], [800000, 100000]], mode_adj: { yearly: 0, half: 2 }, allowed_modes: ['yearly', 'half'], death_pct: 100, terms: [], tariff: t894,
    rebate_pct_bands: [[30, [[700000, 5], [1000000, 10], [1500000, 15], [2000000, 18]]], [45, [[700000, 3], [1000000, 6], [1500000, 10], [2000000, 14]]]] });
  const S894 = { 20: [2290, 2555, 3150], 30: [2730, 3070, 3825], 40: [4435, 5035, 6390] };
  Object.entries(S894).forEach(([age, v]) => [[2020, 0], [1520, 1], [1020, 2]].forEach(([key, i]) => {
    checked++;
    const r = E.compute(p894, inp(Number(age), key, 500000), {});
    if (r.errors) { fails.push(`894 age ${age} key ${key}: ${r.errors.join(' ')}`); return; }
    if (Math.abs(r.pr.yearPay - v[i]) > 1) fails.push(`894 age ${age} key ${key}: expected ${v[i]} got ${Math.round(r.pr.yearPay)}`);
  }));
  // v4.6: LIC अधिकृत BI (28 Nov 2026) — 770 वय 36 PPT 15 मुदत 39 SA 10 लाख: premium, GA (एकूण भरलेल्या premium वर 8.2%) आणि GSV
  {
    const r = E.compute(p770, inp(36, 1539, 1000000), {});
    checked++; if (Math.abs(r.inst - 107700) > 1) fails.push(`770 BI premium: expected 107700 got ${r.inst}`);
    [[1, 8831, 0], [2, 26494, 64620], [3, 52988, 113933], [5, 132471, 271634], [10, 485727, 598925], [15, 1059768, 1091119]].forEach(([y, ga, cv]) => {
      const row = r.table[y - 1]; checked += 2;
      if (Math.abs(row.cumAdd - ga) > 2) fails.push(`770 BI year ${y} GA: expected ${ga} got ${Math.round(row.cumAdd)}`);
      if (Math.abs((row.cv || 0) - cv) > 2) fails.push(`770 BI year ${y} GSV: expected ${cv} got ${Math.round(row.cv || 0)}`);
    });
    // 894 स्त्री, वय 36, मुदत 24, SA 10 लाख: BI (online) ₹5,813 = tabular 6,720 × (1 − 6% high SA − 7.5% online) → offline ₹6,316.80
    const i894 = inp(36, 2424, 1000000); i894.gender = 'F';
    const r2 = E.compute(p894, i894, {});
    checked++; if (Math.abs(r2.inst - 6316.8) > 1 || Math.abs(r2.pr.tabular * (1 - 0.06 - 0.075) - 5813) > 1) fails.push(`894 BI female: offline ${r2.inst}, online ${r2.pr.tabular * 0.865}`);
  }
  // v4.6: LIC अधिकृत BI — प्रत्येक वर्षाचं surrender value (tests/bi_cases.json); from/to = जुळणारी वर्षं (बाकी आपलं अंदाज कमी = सुरक्षित)
  {
    const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'bi_cases.json'), 'utf8'));
    for (const c of cases) {
      const p = plans.find(x => x.id === c.id);
      const ii = inp(c.age, c.term, c.sa); ii.gender = c.gender || 'M'; ii.srbO = c.srb || null;
      const r = E.compute(p, ii, {});
      if (r.errors) { fails.push(`BI ${c.id}: ${r.errors}`); continue; }
      c.cv.forEach((want, k) => {
        const y = k + 1; if (want == null || (c.from && y < c.from) || (c.to && y > c.to) || (c.skip && c.skip.includes(y))) return;
        const got = (r.table[k] && r.table[k].cv) || 0; checked++;
        if (got > want * 1.001 + 2 && c.skip) { fails.push(`BI ${c.id} year ${y}: overstated`); }
        if (Math.abs(got - want) > Math.max(2, want * 0.001)) fails.push(`BI ${c.id} srb ${c.srb} year ${y}: expected ${want} got ${Math.round(got)}`);
      });
    }
  }
  // v4.3: single premium (brochure: 19,035 / 23,805 / 41,770) + single चा rebate (वय 30, 20 लाख → 17%)
  p894.rebate_pct_bands_sp = [[30, [[700000, 4], [1000000, 9], [1500000, 14], [2000000, 17]]], [45, [[700000, 2], [1000000, 5], [1500000, 8], [2000000, 11]]]];
  [[20, 19035], [30, 23805], [40, 41770]].forEach(([age, want]) => {
    checked++;
    const r = E.compute(p894, inp(age, 120, 500000), {});
    if (r.errors) { fails.push(`894 SP age ${age}: ${r.errors.join(' ')}`); return; }
    if (Math.abs(r.inst - want) > 1 || r.plan.type !== 'term_sp') fails.push(`894 SP age ${age}: expected ${want} got ${Math.round(r.inst)} (${r.plan.type})`);
    checked++;
    if (Math.abs(r.deathSA - Math.max(500000, 1.25 * want)) > 1) fails.push(`894 SP age ${age}: death ${r.deathSA}`);
  });
  checked++;
  const s1 = E.compute(p894, inp(30, 120, 500000), {}), s4 = E.compute(p894, inp(30, 120, 2000000), {});
  if (Math.abs(s4.inst - s1.inst * 4 * 0.83) > 2) fails.push(`894 SP rebate at 20 lakh: expected ${Math.round(s1.inst * 4 * 0.83)} got ${Math.round(s4.inst)}`);
  // 894 high SA rebate: वय 30, SA 20 लाख → 18% कमी
  checked++;
  const a = E.compute(p894, inp(30, 2020, 500000), {}), b = E.compute(p894, inp(30, 2020, 2000000), {});
  if (Math.abs(b.pr.yearPay - a.pr.yearPay * 4 * 0.82) > 2) fails.push(`894 rebate at 20 lakh: expected ${Math.round(a.pr.yearPay * 4 * 0.82)} got ${Math.round(b.pr.yearPay)}`);
}
// 5. v4: tariff असलेल्या plans मध्ये premium tariff वरूनच येतो का
for (const p of plans) {
  if (!p.tariff) continue;
  const [age, key] = (p.samples || [])[0] || [];
  if (age === undefined) continue;
  const r = E.compute(p, inp(age, key, p.sample_sa), {});
  checked++;
  if (!r.errors && r.basis !== 'tariff') fails.push(`${p.id}: basis ${r.basis} (tariff expected)`);
}

// v4.4: rider मर्यादा — Term ₹1–25 लाख, ADDB कमाल ₹1 कोटी
{
  const p = plans.find(x => x.id === '736');
  const a = inp(30, 16, 5000000); a.r = { term: true, termSA: 3000000 };
  const r1 = E.compute(p, a, {}); checked++;
  if (!r1.errors || !/between/.test(r1.errors[0])) fails.push('736: term rider 30 lakh should be refused');
  const b = inp(30, 16, 5000000); b.r = { term: true };
  const r2 = E.compute(p, b, {}); checked++;
  if (r2.errors) fails.push('736: blank term rider SA with SA 50 lakh should default to 25 lakh: ' + r2.errors);
  const c = inp(30, 16, 50000); c.r = { term: true, termSA: 50000 };
  const r3 = E.compute(p, c, {}); checked++;
  if (!r3.errors) fails.push('736: term rider below 1 lakh should be refused');
}
console.log(`Golden tests: ${checked} checks on ${plans.length} plans, ${fails.length} failure(s)`);
if (fails.length) { fails.slice(0, 40).forEach(f => console.log(' ✗ ' + f)); process.exit(1); }
console.log('✓ all good');
