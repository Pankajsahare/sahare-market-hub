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

const plans = Object.entries(data.plans).filter(([, p]) => p && p.type).map(([id, p]) => Object.assign({
  srb: 0, fab: 0, fab_min_term: 99, mode_adj: {}, rebate_slabs: [], rebate_bands: [], bonus_bands: [], riders: [], samples: [],
  sample_sa: 0, points: {}, death_pct: 0, death_sp: [], min_age_by_term: {}, ppt_map: {}, min_maturity: 0, maturity_age: 100, survival_pct: 0, ga_per_1000: 0
}, p, { id: String(id), name: p.name || id, terms: planTerms(p), has_rates: false, verified: 0, closed: 0, tariff: tariff[String(id)] || null }));

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
  { id: '771', age: 3, term: 16, sa: 500000, cv: { 1: 3905, 2: 17910, 3: 32542, 16: 582593, 17: 626255, 18: 673575, 19: 674744 } },
  // ANANDA report (27 Nov 2026): 733 सर्व 13 वर्षं तंतोतंत; 720 पहिली 5 वर्षं (पहिल्या survival benefit आधी) ±2.5%
  { id: '733', age: 36, term: 13, sa: 1000000, srb: 40, tol: 0.002, cv: { 1: 58749, 2: 126202, 3: 203316, 5: 391090, 8: 776920, 10: 1123080, 12: 1374628, 13: 1520000 } },
  { id: '720', age: 36, term: 20, sa: 1000000, srb: 38, tol: 0.025, cv: { 1: 27231, 2: 58400, 3: 101674, 4: 183646, 5: 230412 } },
  { id: '883', age: 3, term: 14, sa: 500000, cv: { 1: 267313, 2: 287731, 5: 358911, 10: 519067, 14: 698300, 20: 700469 } },
];
for (const rp of REPORTS) {
  const p = plans.find(x => x.id === rp.id);
  if (!p || !p.tariff) { fails.push(`${rp.id}: tariff missing`); continue; }
  const r = E.compute(p, inp(rp.age, rp.term, rp.sa, rp.srb), {});
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
  const p770 = Object.assign({}, base, { id: '770', name: 'Bima Platinum', type: 'platinum', min_age: 0, max_age: 55, min_maturity: 28, max_maturity: 75, min_sa: 300000, sa_slabs: [[300000, 10000]], mode_adj: { yearly: 0, half: 1.8, quarter: 2.72, month: 3.32 }, survival_pct: 10, booster_pct: 70, ga_prem_per_1000: 70, death_pct: 0, terms: [], tariff: t770 });
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
