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
const inp = (age, term, sa) => ({ age, term, sa, by: 'sa', mode: 'yearly', gst: 0, income: 'regular', r: {}, srbO: null, fabO: null, doc: new Date(), gender: 'M' });

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
  { id: '883', age: 3, term: 14, sa: 500000, cv: { 1: 267313, 2: 287731, 5: 358911, 10: 519067, 14: 698300, 20: 700469 } },
];
for (const rp of REPORTS) {
  const p = plans.find(x => x.id === rp.id);
  if (!p || !p.tariff) { fails.push(`${rp.id}: tariff missing`); continue; }
  const r = E.compute(p, inp(rp.age, rp.term, rp.sa), {});
  if (r.errors) { fails.push(`${rp.id}: report case → ${r.errors.join(' ')}`); continue; }
  for (const [y, want] of Object.entries(rp.cv)) {
    checked++;
    const row = r.table[Number(y) - 1];
    const got = row && row.cv;
    if (!(got > 0) || Math.abs(got - want) / want > 0.01) fails.push(`${rp.id}: year ${y} cash value expected ${want} got ${got ? Math.round(got) : got}`);
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
// 5. v4: tariff असलेल्या plans मध्ये premium tariff वरूनच येतो का
for (const p of plans) {
  if (!p.tariff) continue;
  const [age, key] = (p.samples || [])[0] || [];
  if (age === undefined) continue;
  const r = E.compute(p, inp(age, key, p.sample_sa), {});
  checked++;
  if (!r.errors && r.basis !== 'tariff') fails.push(`${p.id}: basis ${r.basis} (tariff expected)`);
}

console.log(`Golden tests: ${checked} checks on ${plans.length} plans, ${fails.length} failure(s)`);
if (fails.length) { fails.slice(0, 40).forEach(f => console.log(' ✗ ' + f)); process.exit(1); }
console.log('✓ all good');
