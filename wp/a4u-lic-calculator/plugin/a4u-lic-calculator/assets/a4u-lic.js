/* A4U LIC Calculator v3.1 — frontend (educational illustration only) */
(function () {
	'use strict';

	var C = window.A4U_LIC;
	var root = document.getElementById('a4u-lic-app');
	if (!C || !root) { return; }
	root.classList.add('a4u-lic'); // shortcode शिवाय (उदा. HTML widget) वापरलं तरी styles लागू

	// mode => [label, वर्षात किती हप्ते]
	var MODES = { yearly: ['Yearly', 1], half: ['Half-yearly', 2], quarter: ['Quarterly', 4], month: ['Monthly', 12] };
	// verified rates नसतील तेव्हा फक्त अंदाजासाठी demo factor
	var DEMO_FACTOR = { endowment: 0.98, anand: 1.02, labh: 0.84, lakshya: 0.9, umang: 1.25, utsav: 1.6 };
	var SINGLE = { single: 1, utsav_sp: 1 };       // एकदाच premium भरायचे plans
	var GOALS = {
		child: { label: 'Child education / marriage', plans: ['736', '714', '733'] },
		retire: { label: 'Retirement income', plans: ['745', '771'] },
		save: { label: 'Savings with life cover', plans: ['715', '714', '736'] },
		income: { label: 'Lifelong yearly income', plans: ['771', '745', '883'] },
		lump: { label: 'One-time investment', plans: ['717', '883'] }
	};
	var BY_PPT = { umang: 1, utsav: 1, utsav_sp: 1 }; // rate key = PPT / GA period
	var INCOME = { umang: 1, utsav: 1, utsav_sp: 1 }; // वार्षिक उत्पन्न देणारे plans
	var RIDERS = { adb: 'Accident Benefit rider', addb: 'Accidental Death & Disability rider', term: 'Term Assurance rider', pwb: 'Premium Waiver Benefit rider' };
	var rateCache = {};
	var last = null; // शेवटचा निकाल — WhatsApp/lead/compare साठी
	var lastCmp = null; // presentation मध्ये तुलना दाखवण्यासाठी
	var nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

	/* ---------- छोटे helpers ---------- */
	function inr(n) { var v = Math.round(n); return (v < 0 ? '\u2212' : '') + '\u20B9' + nf.format(Math.abs(v)); }
	function esc(s) {
		return String(s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}
	function planById(id) {
		for (var i = 0; i < C.plans.length; i++) { if (C.plans[i].id === id) { return C.plans[i]; } }
		return null;
	}
	function f(form, name) { return form.elements.namedItem(name); }
	function has(p, rider) { return (p.riders || []).indexOf(rider) > -1; }
	// plain permalinks (?rest_route=) असल्यास पण URL बरोबर बनतो
	function api(path, qs) {
		var sep = C.rest.indexOf('?') > -1 ? '&' : '?';
		return C.rest + path + (qs ? sep + qs : '');
	}
	function post(path, body) {
		if (C.offline) { return Promise.reject(new Error('offline')); } // offline file — server नाही
		return fetch(api(path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
	}
	function track(ev) { try { post('track', { event: ev }).catch(function () {}); } catch (e) { /* stats न गेल्यास काही बिघडत नाही */ } }

	if (!C.plans || !C.plans.length) {
		root.innerHTML = '<p class="a4u-note">The calculator is being updated. Please check back soon.</p>';
		return;
	}

	/* ---------- SA multiples (S2) ---------- */
	function slabFor(p, sa) {
		var s = null;
		(p.sa_slabs || []).forEach(function (x) { if (sa >= x[0]) { s = x; } });
		return s;
	}
	function floorToSlab(p, sa) {
		var s = slabFor(p, sa);
		return s ? Math.floor(sa / s[1]) * s[1] : sa;
	}
	function ceilToSlab(p, sa) {
		var s = slabFor(p, sa), c = s ? Math.ceil(sa / s[1]) * s[1] : Math.ceil(sa / 1000) * 1000;
		var s2 = slabFor(p, c); // वरच्या slab मध्ये गेलो तर त्याचा multiple
		return s2 && c % s2[1] ? Math.ceil(c / s2[1]) * s2[1] : c;
	}

	/* ---------- Form ---------- */
	function field(label, input, cls) { return '<label class="a4u-field' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span>' + input + '</label>'; }

	var planOpts = C.plans.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>'; }).join('');
	var modeOpts = Object.keys(MODES).map(function (k) { return '<option value="' + k + '">' + MODES[k][0] + '</option>'; }).join('');

	root.innerHTML =
		'<form class="a4u-form" novalidate>' +
		'<h2 class="a4u-title">' + esc(C.title || 'LIC Premium & Benefit Calculator') + '</h2>' +
		'<p class="a4u-sub">Educational illustration — not an official LIC quotation.</p>' +
		(C.offlineUrl ? '<p class="a4u-note a4u-offline-dl"><a href="' + esc(C.offlineUrl) + '">Download offline copy</a> — one HTML file for your phone/laptop that works without internet (advisor only).</p>' : '') +
		(C.advisor ? '<label class="a4u-field a4u-saved" hidden><span>Open a saved proposal</span><select data-saved></select></label>' : '') +
		wizardHtml() +
		'<fieldset class="a4u-client"><legend>Client details <small>(stays on this device)</small></legend>' +
		'<div class="a4u-row a4u-row-name">' +
		field('Title', '<select name="prefix"><option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Master</option><option>Baby</option><option>Dr.</option></select>', 'a4u-prefix') +
		field('Full name', '<input type="text" name="cname" maxlength="60" autocomplete="name" placeholder="e.g. Ramesh Patil">') +
		'</div><div class="a4u-row">' +
		field('Gender', '<select name="gender"><option value="M">Male</option><option value="F">Female</option></select>') +
		field('Mobile <small>(optional)</small>', '<input type="tel" name="cmobile" maxlength="14" inputmode="numeric" autocomplete="tel">') +
		'</div></fieldset>' +
		field('Plan', '<select name="plan">' + planOpts + '</select>') +
		'<div class="a4u-row">' +
		field('Date of birth', '<input type="date" name="dob">') +
		field('or Age (years)', '<input type="number" name="age" min="0" max="99" inputmode="numeric" placeholder="e.g. 30">') +
		'</div>' +
		field('Date of commencement', '<input type="date" name="doc"><small>Age is calculated as on this date (age nearer birthday).</small>') +
		'<div class="a4u-seg" role="radiogroup" aria-label="Calculate by">' +
		'<label><input type="radio" name="by" value="sa" checked> By Sum Assured</label>' +
		'<label><input type="radio" name="by" value="budget"> By Premium</label>' +
		'<label><input type="radio" name="by" value="maturity"> <span data-target-tab>By Maturity</span></label>' +
		'</div>' +
		field('Sum Assured (₹)', '<input type="number" name="sa" min="200000" step="5000" value="500000" inputmode="numeric"><small data-sa-hint></small>', 'a4u-by-sa') +
		field('<span data-budget-label>Premium you can pay per installment (₹)</span>', '<input type="number" name="budget" min="1000" step="500" value="10000" inputmode="numeric">', 'a4u-by-budget') +
		field('<span data-target-label>Maturity amount you want (₹, estimated incl. bonus)</span>', '<input type="number" name="target" min="10000" step="10000" value="1000000" inputmode="numeric">', 'a4u-by-maturity') +
		'<div class="a4u-row">' +
		field('<span data-term-label>Policy term</span>', '<select name="term"></select>') +
		field('Payment mode', '<select name="mode">' + modeOpts + '</select>', 'a4u-mode') +
		'</div>' +
		field('Income option', '<select name="income"><option value="regular">Regular Income (paid every year)</option><option value="flexi">Flexi Income (accumulate @ 5.5% p.a.)</option></select>', 'a4u-income') +
		(C.advisor ? '<details class="a4u-adv a4u-bonus-box"><summary>Bonus assumptions (advisor)</summary>' +
			'<div class="a4u-row">' + field('Bonus (SRB) per ₹1000 SA', '<input type="number" name="b_srb" min="0" max="200" step="0.5">') +
			field('FAB per ₹1000 SA', '<input type="number" name="b_fab" min="0" max="2000" step="1">') + '</div>' +
			'<small>Leave blank to use the plan\'s default rates (shown as placeholder).</small></details>' : '') +
		'<details class="a4u-adv"><summary>Riders &amp; GST</summary>' +
		'<div data-riders></div>' +
		field('GST % on premium', '<input type="number" name="gst" min="0" max="28" step="0.01" value="' + Number(C.gst) + '">') +
		'</details>' +
		'<div class="a4u-error" role="alert" hidden></div>' +
		'<button type="submit" class="a4u-btn a4u-calc">Calculate</button>' +
		'</form>' +
		'<section class="a4u-result" hidden aria-live="polite"></section>';

	var form = root.querySelector('.a4u-form');
	var result = root.querySelector('.a4u-result');
	var errBox = root.querySelector('.a4u-error');
	var calcBtn = root.querySelector('.a4u-calc');

	function termText(p, t) {
		if (p.type === 'utsav_sp') { return t + ' years (income from year ' + (t + 1) + ')'; }
		if (p.type === 'labh') { return t + ' years (pay ' + p.ppt_map[t] + ' years)'; }
		if (p.type === 'lakshya') { return t + ' years (pay ' + (t - 3) + ' years)'; }
		return t + ' years';
	}
	function termLabel(p) { return p.type === 'utsav_sp' ? 'Guaranteed Addition period' : (BY_PPT[p.type] ? 'Premium paying term' : 'Policy term'); }

	function riderHtml(p) {
		var h = '';
		if (has(p, 'adb')) { h += '<div class="a4u-rider"><label class="a4u-check"><input type="checkbox" name="r_adb" value="1"> ' + RIDERS.adb + '</label>' + field('Rider Sum Assured (up to 3 × SA; blank = SA)', '<input type="number" name="r_adb_sa" min="0" step="5000" inputmode="numeric">', 'a4u-sub-field') + '</div>'; }
		if (has(p, 'addb')) { h += '<div class="a4u-rider"><label class="a4u-check"><input type="checkbox" name="r_addb" value="1"> ' + RIDERS.addb + ' (age 18–60)</label></div>'; }
		if (has(p, 'term')) { h += '<div class="a4u-rider"><label class="a4u-check"><input type="checkbox" name="r_term" value="1"> ' + RIDERS.term + ' (age 18+)</label>' + field('Term rider Sum Assured (up to SA; blank = SA)', '<input type="number" name="r_term_sa" min="0" step="5000" inputmode="numeric">', 'a4u-sub-field') + '</div>'; }
		if (has(p, 'pwb')) { h += '<div class="a4u-rider"><label class="a4u-check"><input type="checkbox" name="r_pwb" value="1"> ' + RIDERS.pwb + ' (child policies)</label>' + field('Proposer / parent age', '<input type="number" name="r_pwb_age" min="18" max="50" inputmode="numeric">', 'a4u-sub-field') + '</div>'; }
		return h || '<p class="a4u-note">No riders for this plan.</p>';
	}

	// plan बदलला की term, mode, riders, SA hint सगळं बदल
	function fillPlanUI() {
		var p = planById(f(form, 'plan').value);
		var sel = f(form, 'term'), prev = parseInt(sel.value, 10);
		sel.innerHTML = p.terms.map(function (t) { return '<option value="' + t + '">' + termText(p, t) + '</option>'; }).join('');
		if (p.terms.indexOf(prev) > -1) { sel.value = prev; }
		root.querySelector('[data-term-label]').textContent = termLabel(p);
		var single = !!SINGLE[p.type];
		root.querySelector('.a4u-mode').hidden = single;
		root.querySelector('.a4u-income').hidden = !(p.type === 'utsav' || p.type === 'utsav_sp');
		root.querySelector('[data-budget-label]').textContent = single ? 'One-time premium you can invest (₹)' : 'Premium you can pay per installment (₹)';
		var sa = f(form, 'sa');
		sa.min = p.min_sa;
		var s0 = (p.sa_slabs || [])[0];
		sa.step = s0 ? s0[1] : 1000;
		if (parseInt(sa.value, 10) < p.min_sa) { sa.value = p.min_sa; }
		root.querySelector('[data-sa-hint]').textContent = 'Min ' + inr(p.min_sa) + (s0 ? ', in multiples of ' + inr(s0[1]) : '');
		root.querySelector('[data-riders]').innerHTML = riderHtml(p);
		var inc = !!INCOME[p.type];
		root.querySelector('[data-target-tab]').textContent = inc ? 'By Income' : 'By Maturity';
		root.querySelector('[data-target-label]').textContent = inc ? 'Yearly income you want (₹)' : 'Maturity amount you want (₹, estimated incl. bonus)';
		fillBonusHints();
	}

	function syncBy() {
		var by = f(form, 'by').value;
		root.querySelector('.a4u-by-sa').hidden = by !== 'sa';
		root.querySelector('.a4u-by-budget').hidden = by !== 'budget';
		root.querySelector('.a4u-by-maturity').hidden = by !== 'maturity';
	}
	// advisor box मध्ये plan चे default bonus दर placeholder म्हणून
	function fillBonusHints() {
		var bs = f(form, 'b_srb');
		if (!bs) { return; }
		var p = planById(f(form, 'plan').value), t = parseInt(f(form, 'term').value, 10) || 0;
		var age = parseInt(f(form, 'age').value, 10) || 30;
		var bn = bonusFor(p, resolveTerms(p, age, t).T);
		bs.placeholder = bn.srb;
		f(form, 'b_fab').placeholder = bn.fab;
	}
	function isoDate(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
	function niceDate(d) { return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
	// presentation साठी client चे तपशील (फक्त browser मध्ये)
	function clientInfo() {
		return { prefix: f(form, 'prefix').value, name: f(form, 'cname').value.trim(), gender: f(form, 'gender').value, mobile: f(form, 'cmobile').value.trim() };
	}

	// LIC वापरतं तसं "age nearer birthday"
	function ageNearer(dobStr, onDate) {
		var dob = new Date(dobStr + 'T00:00:00');
		if (isNaN(dob.getTime())) { return null; }
		var now = onDate || new Date();
		var age = now.getFullYear() - dob.getFullYear();
		var lastBd = new Date(dob.getTime());
		lastBd.setFullYear(dob.getFullYear() + age);
		if (lastBd > now) { age--; lastBd.setFullYear(lastBd.getFullYear() - 1); }
		if ((now - lastBd) / 86400000 > 182) { age++; }
		return age;
	}

	function showErr(list) {
		if (!list.length) { errBox.hidden = true; errBox.innerHTML = ''; return; }
		errBox.innerHTML = list.map(esc).join('<br>');
		errBox.hidden = false;
	}

	/* ---------- Rates + engine ---------- */
	function getRates(p) {
		if (!p.has_rates) { return Promise.resolve({}); }
		if (rateCache[p.id]) { return Promise.resolve(rateCache[p.id]); }
		if (C.offlineRates && C.offlineRates[p.id]) { rateCache[p.id] = C.offlineRates[p.id]; return Promise.resolve(rateCache[p.id]); }
		return fetch(api('plan/' + encodeURIComponent(p.id), 'v=' + C.version))
			.then(function (r) { if (!r.ok) { throw new Error('rates'); } return r.json(); })
			.then(function (j) { rateCache[p.id] = j.rates || {}; return rateCache[p.id]; });
	}

	function demoRate(p, age, P, T) {
		if (SINGLE[p.type]) { return 1000 * (0.55 + age * 0.004) * Math.pow(0.975, T || P); }
		return (1000 / P) * (DEMO_FACTOR[p.type] || 1) * (0.9 + age * 0.005);
	}

	// 1D linear interpolation (दोन टोकांच्या बाहेर असल्यास जवळच्या दोन points वरून)
	function interp(pts, x) {
		pts = pts.slice().sort(function (a, b) { return a[0] - b[0]; });
		if (!pts.length) { return null; }
		if (pts.length === 1) { return pts[0][1]; }
		var i = 0;
		while (i < pts.length - 2 && x > pts[i + 1][0]) { i++; }
		var a = pts[i], b = pts[i + 1];
		return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
	}
	// sample "key" (term/PPT) वरून interpolation साठी x: regular plans मध्ये premium ≈ 1/PPT
	function sampleX(p, key) {
		if (SINGLE[p.type]) { return key; }
		var tp = resolveTerms(p, 30, key);
		return 1 / tp.P;
	}
	// LIC brochure मधल्या sample premiums वरून tabular rate (per 1000) चा अंदाज
	function sampleRate(p, age, key) {
		if ((!p.samples || !p.samples.length || !p.sample_sa) && !Object.keys(p.points || {}).length) { return null; }
		var adj = SINGLE[p.type] ? 0 : (Number((p.mode_adj || {}).yearly) || 0);
		var cols = {};
		(p.samples || []).forEach(function (s) {
			var r = s[2] / (p.sample_sa / 1000) / (1 + adj / 100); // yearly-mode premium → tabular
			(cols[s[1]] = cols[s[1]] || []).push([s[0], r]);
		});
		Object.keys(p.points || {}).forEach(function (k) { // F: खऱ्या quotations चे अचूक बिंदू पण grid मध्ये
			var ak = k.split('|');
			(cols[ak[1]] = cols[ak[1]] || []).push([Number(ak[0]), Number(p.points[k])]);
		});
		var pts = Object.keys(cols).map(function (k) { return [sampleX(p, Number(k)), interp(cols[k], age)]; });
		var v = interp(pts, sampleX(p, key));
		return v && v > 0 ? v : null;
	}

	function npv(r, cf) {
		var s = 0;
		for (var i = 0; i < cf.length; i++) { s += cf[i] / Math.pow(1 + r, i); }
		return s;
	}
	// वार्षिक cash flow वरून IRR (bisection) — XIRR चा अंदाज
	function irr(cf) {
		var lo = -0.99, hi = 1, flo = npv(lo, cf), fhi = npv(hi, cf);
		if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) { return null; }
		for (var k = 0; k < 200; k++) {
			var mid = (lo + hi) / 2, fm = npv(mid, cf);
			if (Math.abs(fm) < 1e-7) { return mid; }
			if (fm * flo > 0) { lo = mid; flo = fm; } else { hi = mid; }
		}
		return (lo + hi) / 2;
	}

	// policy term (T) आणि premium paying term (P)
	function resolveTerms(p, age, sel) {
		switch (p.type) {
			case 'labh': return { T: sel, P: Number(p.ppt_map[sel]) };
			case 'lakshya': return { T: sel, P: sel - 3 };
			case 'umang':
			case 'utsav': return { T: (p.maturity_age || 100) - age, P: sel };
			case 'single': return { T: sel, P: 1 };
			case 'utsav_sp': return { T: (p.maturity_age || 100) - age, P: 1, G: sel };
			default: return { T: sel, P: sel };
		}
	}

	// दिलेल्या SA साठी premium (riders + GST सकट)
	// HSA rebate (Rs. per 1000 BSA) — slab नुसार; 883 साठी वयानुसार table
	function rebatePer1000(p, sa, age) {
		var slabs = p.rebate_slabs || [];
		if (p.rebate_bands && p.rebate_bands.length) {
			slabs = [];
			for (var i = 0; i < p.rebate_bands.length; i++) { if (age <= p.rebate_bands[i][0]) { slabs = p.rebate_bands[i][1]; break; } }
		}
		var r = 0;
		slabs.forEach(function (x) { if (sa >= x[0]) { r = x[1]; } });
		return r;
	}
	function modeAdj(p, mode) {
		var m = p.mode_adj || {};
		return (m[mode] !== undefined) ? Number(m[mode]) : null;
	}
	// S1: rider rate — CSV मध्ये नेमकी ओळ असेल तर ती, नाहीतर flat दर
	function riderRate(k, age, term) {
		var m = C.riderMap || {}, v = m[k + '|' + age + '|' + term];
		return v !== undefined ? Number(v) : Number((C.riderRates || {})[k] || 0);
	}

	// दिलेल्या SA साठी premium (mode rebate/loading + HSA rebate + riders + GST)
	function premiumFor(p, inp, rate, sa, ctx) {
		ctx = ctx || {};
		var single = !!SINGLE[p.type];
		var tabular = rate * sa / 1000;
		var rebate = rebatePer1000(p, sa, inp.age) * sa / 1000;
		var base = Math.max(0, tabular - rebate); // annualised premium (mode loading शिवाय)
		var riders = {}, rTotal = 0, term = ctx.T || inp.term;
		if (inp.r.adb) { riders.adb = riderRate('adb', inp.age, term) * (inp.r.adbSA || sa) / 1000; }
		if (inp.r.addb) { riders.addb = riderRate('addb', inp.age, term) * sa / 1000; }
		if (inp.r.term) { riders.term = riderRate('term', inp.age, term) * (inp.r.termSA || sa) / 1000; }
		if (inp.r.pwb) { riders.pwb = riderRate('pwb', inp.r.pwbAge, ctx.P || term) / 100 * base; }
		Object.keys(riders).forEach(function (k) { rTotal += riders[k]; });
		var g = 1 + inp.gst / 100;
		function yearlyIn(mode) { // त्या mode मध्ये वर्षभरात भरायची रक्कम
			var adj = modeAdj(p, mode);
			if (adj === null) { return (base + rTotal) * (Number(C.modal[mode]) || 1) * MODES[mode][1]; }
			return Math.max(0, tabular * (1 + adj / 100) - rebate) + rTotal * (1 + Math.max(0, adj) / 100);
		}
		if (single) {
			var sp = base * g;
			return { rebate: rebate, tabular: tabular, base: base, riders: riders, inst: sp + rTotal * g, yearPay: sp + rTotal * g, modes: null };
		}
		var modes = Object.keys(MODES).map(function (k) { var y = yearlyIn(k) * g; return [k, y / MODES[k][1], y]; });
		var yp = yearlyIn(inp.mode) * g;
		return { rebate: rebate, tabular: tabular, base: base, riders: riders, inst: yp / MODES[inp.mode][1], yearPay: yp, modes: modes };
	}

	// S3 (v1.4): bonus — term band असल्यास तो, नाहीतर एकच SRB/FAB
	function bonusFor(p, T) {
		var srb = p.srb, fab = T >= p.fab_min_term ? p.fab : 0;
		(p.bonus_bands || []).forEach(function (b) { if (T >= b[0]) { srb = b[1]; fab = b[2]; } });
		return { srb: srb, fab: fab };
	}

	// S7: budget मध्ये बसणारा सगळ्यात मोठा SA (allowed multiple ला round down)
	function solveSA(p, inp, rate) {
		var lo = 0, hi = 1e10;
		for (var k = 0; k < 80; k++) {
			var mid = (lo + hi) / 2;
			if (premiumFor(p, inp, rate, mid).inst <= inp.budget) { lo = mid; } else { hi = mid; }
		}
		var sa = floorToSlab(p, lo), guard = 0;
		while (sa >= p.min_sa && premiumFor(p, inp, rate, sa).inst > inp.budget && guard++ < 50) {
			var s = slabFor(p, sa);
			sa = floorToSlab(p, sa - (s ? s[1] : 1000));
		}
		return sa;
	}

	function compute(p, inp, rates) {
		var age = inp.age, tp = resolveTerms(p, age, inp.term), T = tp.T, P = tp.P, errs = [];
		if (!(age >= p.min_age && age <= p.max_age)) { errs.push('Entry age for this plan must be ' + p.min_age + ' to ' + p.max_age + ' years.'); }
		var minByTerm = p.min_age_by_term ? p.min_age_by_term[inp.term] : undefined;
		if (minByTerm !== undefined && age < minByTerm) { errs.push('For this term the minimum entry age is ' + (minByTerm === 0 ? '30 days' : minByTerm + ' years') + '.'); }
		if (BY_PPT[p.type]) {
			if (p.ppt_max_age_sum && age + P > p.ppt_max_age_sum) { errs.push('Age + premium paying term cannot exceed ' + p.ppt_max_age_sum + '. Choose a shorter term.'); }
		} else {
			if (age + T > p.max_maturity) { errs.push('Maturity age cannot exceed ' + p.max_maturity + ' years. Choose a shorter term.'); }
			if (p.min_maturity && age + T < p.min_maturity) { errs.push('Age at maturity must be at least ' + p.min_maturity + ' years.'); }
		}
		// riders चे नियम (S4)
		if (inp.r.adb && age < 18) { errs.push('Accident Benefit rider is available from age 18.'); }
		if (inp.r.addb && (age < 18 || age > 60)) { errs.push('AD&DB rider is available for age 18 to 60.'); }
		if (inp.r.term && age < 18) { errs.push('Term rider is available from age 18.'); }
		if (inp.r.pwb) {
			if (age >= 18) { errs.push('Premium Waiver rider is for child policies (life assured below 18).'); }
			if (!(inp.r.pwbAge >= 18 && inp.r.pwbAge <= 50)) { errs.push('Proposer / parent age for Premium Waiver rider must be 18 to 50.'); }
			else if (inp.r.pwbAge <= age) { errs.push('Proposer age must be more than the child\'s age.'); }
		}
		if (errs.length) { return { errors: errs }; }

		var key = BY_PPT[p.type] ? P : T;
		if (p.type === 'utsav_sp') { key = inp.term; }
		// दराचा क्रम: CSV (tariff) → खरी quotation → brochure estimate → demo
		var rate = rates[age + '|' + key], basis = p.verified ? 'verified' : 'csv';
		if (!rate && p.points && p.points[age + '|' + key]) { rate = Number(p.points[age + '|' + key]); basis = 'quote'; }
		if (!rate) {
			rate = sampleRate(p, age, key);
			basis = 'brochure';
			if (!rate) { rate = demoRate(p, age, P, T); basis = 'demo'; }
		}
		var demo = basis !== 'verified' && basis !== 'quote';
		var bn = bonusFor(p, T);
		if (inp.srbO !== null) { bn.srb = inp.srbO; }
		if (inp.fabO !== null) { bn.fab = inp.fabO; }
		var bonusYears = p.type === 'umang' ? P : ((p.type === 'utsav' || p.type === 'utsav_sp') ? 0 : T);

		var sa = inp.sa;
		if (inp.by === 'maturity') { // B: लक्ष्य रकमेवरून SA (वर round — लक्ष्य पूर्ण व्हावं म्हणून)
			if (!(inp.target > 0)) { return { errors: ['Please enter the amount you want.'] }; }
			if (INCOME[p.type]) { sa = inp.target / (p.survival_pct / 100); }
			else { sa = inp.target / (1 + (bn.srb * bonusYears + (T >= p.fab_min_term || inp.fabO !== null ? bn.fab : 0)) / 1000); }
			sa = Math.max(p.min_sa, ceilToSlab(p, sa));
		}
		if (inp.by === 'budget') {
			sa = solveSA(p, inp, rate);
			if (sa < p.min_sa) {
				return { errors: ['Minimum premium for this plan and term is about ' + inr(premiumFor(p, inp, rate, p.min_sa).inst) + (SINGLE[p.type] ? '' : ' (' + MODES[inp.mode][0] + ')') + '. Please increase your budget.'] };
			}
		}
		var slab = slabFor(p, sa);
		if (!(sa >= p.min_sa) || !slab) { return { errors: ['Minimum Sum Assured for this plan is ' + inr(p.min_sa) + '.'] }; }
		if (sa % slab[1] !== 0) { return { errors: ['Sum Assured must be in multiples of ' + inr(slab[1]) + ' (for example ' + inr(floorToSlab(p, sa)) + ').'] }; }
		if (inp.r.adb && inp.r.adbSA > 3 * sa) { return { errors: ['Accident Benefit rider Sum Assured can be up to 3 × Sum Assured (' + inr(3 * sa) + ').'] }; }
		if (inp.r.term && inp.r.termSA > sa) { return { errors: ['Term rider Sum Assured can be up to the Sum Assured (' + inr(sa) + ').'] }; }

		var G = tp.G || 0;
		var pr = premiumFor(p, inp, rate, sa, { T: T, P: P });
		var bonus = bn.srb * sa / 1000 * bonusYears;
		var fab = (T >= p.fab_min_term || inp.fabO !== null ? bn.fab : 0) * sa / 1000;
		var ga = (p.ga_per_1000 || 0) * sa / 1000 * (p.type === 'utsav_sp' ? G : P);
		var hasIncome = p.type === 'umang' || p.type === 'utsav' || p.type === 'utsav_sp';
		var survival = hasIncome ? p.survival_pct * sa / 100 : 0;
		var incomeStart = p.type === 'utsav' ? Math.max(11, P + 3) : (p.type === 'utsav_sp' ? G + 1 : P);
		var flexi = inp.income === 'flexi' && (p.type === 'utsav' || p.type === 'utsav_sp');
		// maturity: 771 मध्ये नाही; 883 मध्ये higher of BSA / 1.25 × tabular SP + GA
		var maturity = 0;
		if (p.type === 'utsav_sp') { maturity = Math.max(sa, 1.25 * pr.tabular) + ga; }
		else if (p.type !== 'utsav') { maturity = sa + bonus + fab; }

		var rows = [], cf = [], cum = 0, totalPrem = 0, totalSurv = 0, flexiBal = 0, y;
		for (y = 0; y <= T; y++) { cf.push(0); }
		for (y = 1; y <= T; y++) {
			var prem = y <= P ? pr.yearPay : 0, ben = 0, inc = 0;
			if (survival && y >= incomeStart && (p.type === 'utsav' ? y <= T : y < T)) { inc = survival; totalSurv += survival; }
			if (flexi) {
				flexiBal = flexiBal * 1.055 + inc; // S5: Flexi — 5.5% ने जमा
				if (y === T) { ben += flexiBal; }
			} else { ben += inc; }
			if (y === T) { ben += maturity; }
			cf[y - 1] -= prem; // premium वर्षाच्या सुरुवातीला
			cf[y] += ben;      // benefit वर्षाच्या शेवटी
			totalPrem += prem;
			cum += ben - prem;
			rows.push([y, age + y, prem, ben, cum]);
		}
		// मृत्यू लाभ (brochure नुसार)
		var deathSA = 0, deathNote = '';
		if (p.type === 'single' || p.type === 'utsav_sp') {
			var mult = 1.25;
			(p.death_sp || []).some(function (d) { if (age <= d[0]) { mult = d[1]; return true; } return false; });
			deathSA = Math.max(sa, mult * (p.type === 'utsav_sp' ? pr.tabular : pr.base));
			if (p.type === 'utsav_sp') { deathNote = 'plus accrued Guaranteed Additions'; }
		} else if (p.type === 'lakshya') {
			deathSA = Math.max(7 * pr.base, (p.death_pct || 110) / 100 * sa);
			deathNote = 'plus 10% of SA every year till maturity (Annual Income Benefit)';
		} else if (p.death_pct > 0) {
			deathSA = Math.max(p.death_pct / 100 * sa, 7 * pr.base);
		}
		var totalBenefit = maturity + (flexi ? flexiBal : totalSurv);
		// G: आजच्या पैशात किंमत (महागाई वजा करून)
		var infl = (Number(C.inflation) || 0) / 100, pvBenefit = 0;
		rows.forEach(function (x) { pvBenefit += x[3] / Math.pow(1 + infl, x[0]); });
		// G: कर सूचना (10(10D))
		var taxNotes = [], annualPrem = SINGLE[p.type] ? pr.base : pr.base;
		if (annualPrem > 0.10 * sa) { taxNotes.push('Premium is more than 10% of the Sum Assured, so the maturity amount may not be tax-free under Section 10(10D).'); }
		if (!SINGLE[p.type] && pr.yearPay > 500000) { taxNotes.push('Yearly premium is above ₹5 lakh: for policies issued on or after 1 April 2023, maturity proceeds may be taxable (death benefit stays exempt).'); }
		else { taxNotes.push('If your total yearly premium across such policies issued on or after 1 April 2023 exceeds ₹5 lakh, maturity proceeds may be taxable.'); }
		var docD = inp.doc || new Date(), matD = new Date(docD.getTime());
		matD.setFullYear(matD.getFullYear() + T);
		// S3: दुसरी परिस्थिती — bonus 50% कमी झाला तर
		var cut = 0.5 * (bonus + fab), cfB = cf.slice();
		cfB[T] -= cut;
		return {
			totalBenefitLow: totalBenefit - cut, irrLow: cut ? irr(cfB) : irr(cf), bonusCut: cut,
			pvBenefit: pvBenefit, taxNotes: taxNotes, fabRate: bn.fab, gender: inp.gender, target: inp.by === 'maturity' ? inp.target : 0,
			docText: niceDate(docD), matText: niceDate(matD),
			plan: p, age: age, sa: sa, T: T, P: P, G: G, mode: SINGLE[p.type] ? 'single' : inp.mode, by: inp.by, gst: inp.gst, r: inp.r, income: flexi ? 'flexi' : 'regular',
			basis: basis, demo: demo, rate: rate, pr: pr, inst: pr.inst, totalPrem: totalPrem, bonus: bonus, fab: fab, ga: ga, srb: bn.srb,
			survival: survival, incomeStart: incomeStart, totalSurv: totalSurv, flexiBal: flexiBal, deathSA: deathSA, deathNote: deathNote,
			maturity: maturity, totalBenefit: totalBenefit, irr: irr(cf), rows: rows
		};
	}

	/* ---------- Result ---------- */
	function modeName(r) { return r.mode === 'single' ? 'Single premium' : MODES[r.mode][0]; }

	function shareUrl(r) {
		var u = new URL(window.location.href);
		u.search = '';
		u.hash = '';
		u.searchParams.set('plan', r.plan.id);
		u.searchParams.set('age', r.age);
		u.searchParams.set('sa', r.sa);
		u.searchParams.set('term', resolveBack(r));
		if (r.mode !== 'single') { u.searchParams.set('mode', r.mode); }
		if (r.income === 'flexi') { u.searchParams.set('income', 'flexi'); }
		return u.toString();
	}
	function resolveBack(r) { return r.plan.type === 'utsav_sp' ? r.G : (BY_PPT[r.plan.type] ? r.P : r.T); }

	function waText(r) {
		return 'Hello, I checked the LIC calculator on advisor4u.in.\n' +
			'Plan: ' + r.plan.name + '\n' +
			'Age: ' + r.age + '\n' +
			'Sum Assured: ' + inr(r.sa) + '\n' +
			'Term: ' + r.T + ' yrs (pay ' + (SINGLE[r.plan.type] ? 'once' : r.P + ' yrs') + ')\n' +
			'Premium: ' + inr(r.inst) + ' (' + modeName(r) + ')\n' +
			'Estimated benefit: ' + inr(r.totalBenefit) + '\n' +
			'Link: ' + shareUrl(r) + '\n' +
			'Please guide me.';
	}

	function pct(x) { return x === null || x === undefined ? '—' : (x * 100).toFixed(2) + '%'; }
	function card(label, value) { return '<div class="a4u-card"><span>' + label + '</span><strong>' + value + '</strong></div>'; }
	function tr(label, value) { return '<tr><th>' + label + '</th><td>' + value + '</td></tr>'; }

	// S2 (v1.2): एकूण भरलेला premium vs एकूण मिळालेला benefit — साधा SVG chart
	function chartSvg(r, c1, c2) {
		var W = 600, H = 220, L = 58, R = 12, T = 14, B = 30;
		var paid = 0, got = 0, a = [], b = [];
		r.rows.forEach(function (x) { paid += x[2]; got += x[3]; a.push(paid); b.push(got); });
		var max = Math.max(paid, got) || 1, n = r.rows.length;
		function px(i) { return L + (n === 1 ? 0 : i * (W - L - R) / (n - 1)); }
		function py(v) { return T + (H - T - B) * (1 - v / max); }
		function line(arr) { return arr.map(function (v, i) { return px(i).toFixed(1) + ',' + py(v).toFixed(1); }).join(' '); }
		function short(v) { return v >= 1e7 ? (v / 1e7).toFixed(1) + 'Cr' : v >= 1e5 ? (v / 1e5).toFixed(1) + 'L' : nf.format(v); }
		var tx = 'font-size="11" fill="#6b7a8e" font-family="Arial,sans-serif"', grid = '';
		[0, 0.5, 1].forEach(function (k) {
			var y = py(max * k);
			grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="#e3ebf6"/><text ' + tx + ' x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end">₹' + short(max * k) + '</text>';
		});
		var step = Math.max(1, Math.ceil(n / 8)), xl = '';
		for (var i = 0; i < n; i += step) { xl += '<text ' + tx + ' x="' + px(i) + '" y="' + (H - 10) + '" text-anchor="middle">' + r.rows[i][0] + '</text>'; }
		return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Cumulative premium paid versus cumulative benefits received by policy year">' +
			grid + xl + '<polyline fill="none" stroke-width="2.5" stroke-linejoin="round" stroke="' + (c1 || '#0b4ea2') + '" points="' + line(a) + '"/>' +
			'<polyline fill="none" stroke-width="2.5" stroke-linejoin="round" stroke="' + (c2 || '#1f8f4e') + '" points="' + line(b) + '"/></svg>';
	}
	function chart(r) {
		return '<figure class="a4u-chart">' + chartSvg(r) +
			'<figcaption><span class="k paid"></span>Total premium paid <span class="k got"></span>Total benefits received <em>(by policy year)</em></figcaption></figure>';
	}

	function render(r) {
		last = r;
		var p = r.plan, m = modeName(r), h = '', pr = r.pr;
		if (r.mode === 'single') { m = 'Single premium'; }
		if (r.basis === 'quote') { h += '<div class="a4u-banner a4u-exact">Based on an actual LIC quotation for this age and term.</div>'; }
		if (r.basis === 'brochure') { h += '<div class="a4u-banner a4u-est">Estimated from the sample premiums in the official LIC sales brochure. The actual premium may differ slightly for this age and term.</div>'; }
		else if (r.basis === 'demo') { h += '<div class="a4u-banner">Demo rates — rough figures only. Verified LIC rates for this plan are being updated.</div>'; }
		h += '<h3 class="a4u-rtitle">' + esc(p.name) + ' — Illustration</h3>';
		h += '<p class="a4u-meta">Age ' + r.age + ' · Sum Assured ' + inr(r.sa) + ' · Term ' + r.T + ' yrs · Pay ' + (SINGLE[p.type] ? 'once' : r.P + ' yrs') + ' · ' + m + (r.G ? ' · GA period ' + r.G + ' yrs' : '') + '</p>';
		if (r.by === 'budget') { h += '<p class="a4u-note a4u-ok">Highest Sum Assured within your budget: <b>' + inr(r.sa) + '</b></p>'; }
		if (r.by === 'maturity') { h += '<p class="a4u-note a4u-ok">Sum Assured needed for ' + (INCOME[p.type] ? 'a yearly income of ' : 'an estimated maturity of ') + inr(r.target) + ': <b>' + inr(r.sa) + '</b></p>'; }
		var cl = clientInfo();
		if (cl.name) { h += '<p class="a4u-note">Prepared for <b>' + esc(cl.prefix + ' ' + cl.name) + '</b> · Commencement ' + r.docText + ' · ' + (p.type === 'utsav' ? 'Cover till ' : 'Maturity ') + r.matText + '</p>'; }
		else { h += '<p class="a4u-note">Commencement ' + r.docText + ' · ' + (p.type === 'utsav' ? 'Cover till ' : 'Maturity ') + r.matText + '</p>'; }
		h += '<div class="a4u-cards">' +
			card(SINGLE[p.type] ? 'Single premium' : 'Installment (' + m + ')', inr(r.inst)) +
			card('Total premium paid', inr(r.totalPrem)) +
			card(r.totalSurv ? 'Estimated total benefits' : 'Estimated maturity', inr(r.totalBenefit)) +
			card('Return (IRR, approx.)', r.irr === null ? '—' : (r.irr * 100).toFixed(2) + '% p.a.') +
			'</div>';

		// S5: सगळ्या modes चे हप्ते एकाच ठिकाणी
		if (pr.modes) {
			h += '<div class="a4u-scroll a4u-modes"><table><thead><tr><th>Mode</th><th>Installment</th><th>Yearly total</th></tr></thead><tbody>' +
				pr.modes.map(function (x) { return '<tr' + (x[0] === r.mode ? ' class="sel"' : '') + '><td>' + MODES[x[0]][0] + '</td><td>' + inr(x[1]) + '</td><td>' + inr(x[2]) + '</td></tr>'; }).join('') +
				'</tbody></table></div>';
		}

		var rows = tr('Tabular ' + (SINGLE[p.type] ? 'single' : 'annual') + ' premium', inr(pr.tabular)) +
			(pr.rebate ? tr('High Sum Assured rebate', '− ' + inr(pr.rebate)) : '');
		Object.keys(pr.riders).forEach(function (k) { rows += tr(RIDERS[k] + ' (approx., yearly)', inr(pr.riders[k])); });
		rows += tr('GST', r.gst + '%');
		if (r.deathSA) { rows += tr('Sum Assured on death (approx.)' + (r.deathNote ? '<br><small>' + r.deathNote + '</small>' : ''), inr(r.deathSA)); }
		if (p.type === 'utsav_sp') { rows += tr('<b>Guaranteed:</b> Maturity at age ' + (r.age + r.T) + ' (incl. Guaranteed Additions)', inr(r.maturity)); }
		else if (p.type !== 'utsav') { rows += tr('<b>Guaranteed:</b> Basic Sum Assured on maturity', inr(r.sa)); }
		if (r.totalSurv) {
			var incName = p.type === 'umang' ? 'Survival benefit' : (r.income === 'flexi' ? 'Flexi income' : 'Regular income');
			rows += tr('<b>Guaranteed:</b> ' + incName + ' ' + p.survival_pct + '% of SA yearly from year ' + r.incomeStart, inr(r.survival) + ' / yr');
			rows += r.income === 'flexi' ? tr('Flexi income accumulated @ 5.5% till age ' + (r.age + r.T) + ' (if never withdrawn)', inr(r.flexiBal)) : tr('Total income till age ' + (r.age + r.T), inr(r.totalSurv));
		}
		if (r.ga && p.type !== 'utsav_sp') { rows += tr('<b>Guaranteed:</b> Guaranteed Additions accrued (paid on death / surrender)', inr(r.ga)); }
		if (r.bonus) { rows += tr('<b>Non-guaranteed:</b> Simple Reversionary Bonus @ \u20B9' + r.srb + '/1000 (est.)', inr(r.bonus)); }
		if (r.fab) { rows += tr('<b>Non-guaranteed:</b> Final Additional Bonus (est.)', inr(r.fab)); }
		rows += tr(p.type === 'utsav' ? 'Cover till age' : 'Maturity at age', String(r.age + r.T));
		rows += tr('Death benefit is never less than', '105% of premiums paid');
		if (r.bonus || r.fab) { rows += tr('Bonus assumed (per ₹1000 SA)', 'SRB ₹' + r.srb + (r.fabRate ? ' · FAB ₹' + r.fabRate : '')); }
		rows += tr('Total benefits in today\'s money <small>(at ' + C.inflation + '% inflation)</small>', inr(r.pvBenefit));
		h += '<table class="a4u-sum"><tbody>' + rows + '</tbody></table>';
		if (r.bonusCut) {
			h += '<div class="a4u-scroll a4u-modes"><table><thead><tr><th>Bonus scenario</th><th>Total benefits</th><th>IRR</th></tr></thead><tbody>' +
				'<tr><td>At current bonus rates</td><td>' + inr(r.totalBenefit) + '</td><td>' + pct(r.irr) + '</td></tr>' +
				'<tr><td>If bonus is 50% lower</td><td>' + inr(r.totalBenefitLow) + '</td><td>' + pct(r.irrLow) + '</td></tr></tbody></table></div>';
		}
		if (p.type === 'anand' && p.tail_age) { h += '<p class="a4u-note">After maturity, life cover equal to Basic Sum Assured continues till age ' + p.tail_age + '.</p>'; }
		if (p.type === 'utsav') { h += '<p class="a4u-note">Whole-life plan with no maturity benefit. Flexi Income lets you withdraw up to 75% of the accumulated amount once a year.</p>'; }
		if (p.type === 'utsav_sp' && r.income === 'flexi') { h += '<p class="a4u-note">Flexi Income lets you withdraw up to 75% of the accumulated amount once a year.</p>'; }
		if (Object.keys(pr.riders).length) { h += '<p class="a4u-note">Rider premiums are approximate averages; actual rider rates depend on age and term.</p>'; }
		if (r.taxNotes.length) { h += '<div class="a4u-tax"><b>Tax points to note</b><ul>' + r.taxNotes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><small>General information only — please consult your tax adviser.</small></div>'; }
		if (p.closed) { h += '<p class="a4u-note">This plan is closed for new business — figures are for existing policyholders\' reference only.</p>'; }

		h += chart(r);
		h += '<details class="a4u-years"' + (r.rows.length <= 25 ? ' open' : '') + '><summary>Year-wise cash flow</summary><div class="a4u-scroll"><table>' +
			'<thead><tr><th>Year</th><th>Age</th><th>Premium</th><th>Benefit</th><th>Net (cumulative)</th></tr></thead><tbody>' +
			r.rows.map(function (x) {
				return '<tr><td>' + x[0] + '</td><td>' + x[1] + '</td><td>' + (x[2] ? inr(x[2]) : '—') + '</td><td>' + (x[3] ? inr(x[3]) : '—') + '</td><td class="' + (x[4] < 0 ? 'neg' : 'pos') + '">' + inr(x[4]) + '</td></tr>';
			}).join('') +
			'</tbody></table></div></details>';

		h += '<div class="a4u-actions no-print">' +
			'<button type="button" data-act="present" class="a4u-btn a4u-gold">Create Presentation / PDF</button>' +
			'<button type="button" data-act="print" class="a4u-btn a4u-ghost">Print</button>' +
			'<button type="button" data-act="wa" class="a4u-btn a4u-wa">Share on WhatsApp</button>' +
			'<button type="button" data-act="link" class="a4u-btn a4u-ghost">Copy link</button>' +
			'<button type="button" data-act="rr" class="a4u-btn a4u-ghost">Ready Reckoner</button>' +
			'<button type="button" data-act="mix" class="a4u-btn a4u-ghost">Add to Product Mix</button>' +
			(C.advisor ? '<button type="button" data-act="save" class="a4u-btn a4u-ghost">Save proposal</button>' : '') +
			'</div><div class="a4u-rr-out"></div><div class="a4u-mix-out">' + mixHtml() + '</div>';

		if (C.plans.length > 1) {
			h += '<div class="a4u-compare no-print"><h4>Compare with another plan</h4>' +
				'<p>Same age, Sum Assured and payment mode (without riders).</p>' +
				'<div class="a4u-row">' +
				field('Plan', '<select data-cmp="plan">' + C.plans.filter(function (x) { return x.id !== p.id; }).map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>'; }).join('') + '</select>') +
				field('<span data-cmp-label>Policy term</span>', '<select data-cmp="term"></select>') +
				'</div>' +
				'<button type="button" data-act="compare" class="a4u-btn a4u-ghost">Compare</button>' +
				'<div class="a4u-cmp-out" aria-live="polite"></div></div>';
		}

		h += '<form class="a4u-lead no-print" novalidate>' +
			'<h4>Want an exact quote?</h4><p>Optional — share your details and our advisor will call you.</p>' +
			'<input type="text" name="name" placeholder="Your name" maxlength="100" autocomplete="name" value="' + esc(cl.name) + '">' +
			'<input type="tel" name="mobile" placeholder="10-digit mobile number" maxlength="14" inputmode="numeric" autocomplete="tel" value="' + esc(cl.mobile) + '">' +
			'<input type="text" name="company" class="a4u-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
			'<label class="a4u-check"><input type="checkbox" name="consent" value="1"> I agree to be contacted by Sahare Financial Services about this enquiry.</label>' +
			'<button type="submit" class="a4u-btn">Send to Advisor</button>' +
			'<p class="a4u-lead-msg" role="status"></p>' +
			'</form>';

		if (C.links && C.links.length) {
			h += '<p class="a4u-links no-print">' + C.links.map(function (l) { return '<a href="' + esc(l.url) + '">' + esc(l.label) + '</a>'; }).join(' · ') + '</p>';
		}
		h += '<p class="a4u-foot">Rate version v' + C.version + (p.effective ? ' (effective ' + esc(p.effective) + ')' : '') +
			(p.brochure ? ' · <a href="' + esc(p.brochure) + '" target="_blank" rel="noopener">Official LIC brochure</a>' : '') +
			' · Calculated on ' + new Date().toLocaleDateString('en-IN') + '<br>' +
			'For education only. This is not an official LIC quotation and is not provided by LIC of India. Bonus figures are not guaranteed. Please verify with the policy document before buying.</p>';

		result.innerHTML = h;
		result.hidden = false;
		lastCmp = null;
		var cp = result.querySelector('[data-cmp="plan"]');
		if (cp) { cp.addEventListener('change', fillCmpTerms); fillCmpTerms(); }
		result.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	/* ---------- Compare ---------- */
	function fillCmpTerms() {
		var ps = result.querySelector('[data-cmp="plan"]'), ts = result.querySelector('[data-cmp="term"]');
		var p2 = planById(ps.value), want = last ? resolveBack(last) : 0;
		ts.innerHTML = p2.terms.map(function (t) { return '<option value="' + t + '">' + termText(p2, t) + '</option>'; }).join('');
		if (p2.terms.indexOf(want) > -1) { ts.value = want; }
		result.querySelector('[data-cmp-label]').textContent = termLabel(p2);
	}

	function runCompare() {
		var a = last, out = result.querySelector('.a4u-cmp-out');
		var p2 = planById(result.querySelector('[data-cmp="plan"]').value);
		var inp = { age: a.age, by: 'sa', sa: floorToSlab(p2, Math.max(a.sa, p2.min_sa)), term: parseInt(result.querySelector('[data-cmp="term"]').value, 10), mode: a.mode === 'single' ? 'yearly' : a.mode, gst: a.gst, income: 'regular', r: {} };
		out.innerHTML = '<p class="a4u-note">Calculating…</p>';
		getRates(p2).then(function (rates) {
			var b = compute(p2, inp, rates);
			if (b.errors) { out.innerHTML = '<div class="a4u-error">' + b.errors.map(esc).join('<br>') + '</div>'; return; }
			lastCmp = { a: a, b: b };
			var rowsC = [
				['Sum Assured', function (x) { return inr(x.sa); }],
				['Term / Pay', function (x) { return x.T + ' / ' + (SINGLE[x.plan.type] ? 'once' : x.P + ' yrs'); }],
				['Premium', function (x) { return inr(x.inst) + ' <small>(' + modeName(x) + ')</small>'; }],
				['Total premium paid', function (x) { return inr(x.totalPrem); }],
				['Guaranteed benefits', function (x) { return inr((x.plan.type === 'utsav' ? 0 : (x.plan.type === 'utsav_sp' ? x.maturity : x.sa)) + x.totalSurv); }],
				['Non-guaranteed bonus (est.)', function (x) { return inr(x.bonus + x.fab); }],
				['Estimated total benefits', function (x) { return inr(x.totalBenefit); }],
				['Return (IRR, approx.)', function (x) { return x.irr === null ? '—' : (x.irr * 100).toFixed(2) + '%'; }],
				['Last payout at age', function (x) { return String(x.age + x.T); }]
			];
			out.innerHTML = (b.demo || a.demo ? '<div class="a4u-banner a4u-est">One or both plans use estimated (not verified) rates.</div>' : '') +
				'<div class="a4u-scroll"><table class="a4u-cmp"><thead><tr><th></th><th>' + esc(a.plan.name) + '</th><th>' + esc(p2.name) + '</th></tr></thead><tbody>' +
				rowsC.map(function (c) { return '<tr><th>' + c[0] + '</th><td>' + c[1](a) + '</td><td>' + c[1](b) + '</td></tr>'; }).join('') +
				'</tbody></table></div>';
			track('compare');
		}).catch(function () { out.innerHTML = '<div class="a4u-error">Could not load rates. Please try again.</div>'; });
	}

	var scriptCache = {};
	function loadScript(src) {
		if (!scriptCache[src]) {
			scriptCache[src] = new Promise(function (res, rej) {
				var s = document.createElement('script');
				s.src = src; s.async = true;
				s.onload = res; s.onerror = function () { delete scriptCache[src]; rej(new Error('load ' + src)); };
				document.head.appendChild(s);
			});
		}
		return scriptCache[src];
	}
	var VENDOR_GLOBAL = { 'jspdf.umd.min.js': 'jspdf', 'html2canvas.min.js': 'html2canvas', 'qrcode.js': 'qrcode' };
	function vendor(file) {
		if (window[VENDOR_GLOBAL[file]]) { return Promise.resolve(); } // offline file मध्ये आधीच आहे
		return loadScript((C.vendor || '') + file + '?v=' + C.version);
	}

	// presentation चा code वेगळ्या file मध्ये — फक्त बटण दाबल्यावर load (page हलकं)
	function openPresentation() {
		if (window.A4U_LIC_PRESENT) { window.A4U_LIC_PRESENT.open(); return; }
		loadScript(C.present).then(function () { window.A4U_LIC_PRESENT.open(); }).catch(function () {
			window.alert('Could not load the presentation. Please check your internet connection and try again.');
		});
	}
	window.A4U_LIC_API = {
		C: C, inr: inr, esc: esc, pct: pct, MODES: MODES, SINGLE: SINGLE, chartSvg: chartSvg, track: track, vendor: vendor,
		last: function () { return last; }, cmp: function () { return lastCmp; }, client: function () { return clientInfo(); },
		rr: function () { return lastRR && last && lastRR.r === last ? lastRR : null; }, mix: function () { return mixList.slice(); }, mixIrr: function () { return mixList.length ? mixTotals().irr : null; }, api: api, post: post,
		// golden tests (GitHub Actions) साठी engine थेट वापरता यावा
		compute: compute, planById: planById, resolveTerms: resolveTerms
	};

	/* ---------- v3.1: Ready Reckoner ---------- */
	var lastRR = null;
	function pickTerms(p, n) { // जास्तीत जास्त n terms, सगळ्या range मधून
		var t = p.terms.slice();
		if (t.length <= n) { return t; }
		var out = [];
		for (var i = 0; i < n; i++) { out.push(t[Math.round(i * (t.length - 1) / (n - 1))]); }
		return out.filter(function (v, i, a) { return a.indexOf(v) === i; });
	}
	function showReckoner() {
		var r = last, p = r.plan, box = result.querySelector('.a4u-rr-out');
		getRates(p).then(function (rates) {
			var terms = pickTerms(p, 6), ages = [];
			for (var a = Math.max(p.min_age, 0); a <= p.max_age; a += 5) { ages.push(a); }
			if (ages.indexOf(r.age) === -1) { ages.push(r.age); ages.sort(function (x, y) { return x - y; }); }
			var single = !!SINGLE[p.type];
			var rows = ages.map(function (age) {
				return [age, terms.map(function (t) {
					var x = compute(p, { age: age, term: t, sa: r.sa, by: 'sa', mode: 'yearly', gst: r.gst, income: 'regular', r: {}, srbO: null, fabO: null, doc: new Date(), gender: r.gender }, rates);
					return x.errors ? null : (single ? x.inst : x.pr.yearPay);
				})];
			});
			lastRR = { r: r, terms: terms, rows: rows, single: single };
			box.innerHTML = '<h4>Ready Reckoner — ' + esc(p.name) + ' · SA ' + inr(r.sa) + ' · ' + (single ? 'single premium' : 'yearly premium') + '</h4>' +
				'<div class="a4u-scroll"><table class="a4u-rr"><thead><tr><th>Age \\ ' + (BY_PPT[p.type] ? 'PPT' : 'Term') + '</th>' + terms.map(function (t) { return '<th>' + t + '</th>'; }).join('') + '</tr></thead><tbody>' +
				rows.map(function (row) {
					return '<tr' + (row[0] === r.age ? ' class="sel"' : '') + '><th>' + row[0] + '</th>' + row[1].map(function (v) { return '<td>' + (v ? inr(v) : '—') + '</td>'; }).join('') + '</tr>';
				}).join('') + '</tbody></table></div><p class="a4u-note">— = not allowed for that age/term. Included in the PDF presentation.</p>';
			box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		});
	}

	/* ---------- v3.1: Product Mix (2–3 plans एकत्र) ---------- */
	var mixList = [];
	function addToMix() {
		if (!last) { return; }
		if (mixList.some(function (m) { return m.plan.id === last.plan.id && m.sa === last.sa && m.T === last.T; })) { return refreshMix(); }
		if (mixList.length >= 3) { mixList.shift(); }
		mixList.push(last);
		refreshMix();
	}
	function mixTotals() {
		var n = 0, cf = [], prem = 0, ben = 0;
		mixList.forEach(function (m) { n = Math.max(n, m.rows.length); });
		for (var i = 0; i <= n; i++) { cf.push(0); }
		mixList.forEach(function (m) {
			m.rows.forEach(function (x) { cf[x[0] - 1] -= x[2]; cf[x[0]] += x[3]; prem += x[2]; ben += x[3]; });
		});
		return { prem: prem, ben: ben, irr: irr(cf), first: mixList.reduce(function (s, m) { return s + (SINGLE[m.plan.type] ? m.inst : m.pr.yearPay); }, 0) };
	}
	function mixHtml() {
		if (!mixList.length) { return ''; }
		var t = mixTotals();
		return '<div class="a4u-mix"><h4>Product Mix (' + mixList.length + '/3)</h4><div class="a4u-scroll"><table><thead><tr><th>Plan</th><th>SA</th><th>Term/Pay</th><th>1st-year premium</th><th>Total premium</th><th>Total benefits</th></tr></thead><tbody>' +
			mixList.map(function (m) {
				return '<tr><td>' + esc(m.plan.name) + '</td><td>' + inr(m.sa) + '</td><td>' + m.T + ' / ' + (SINGLE[m.plan.type] ? '1' : m.P) + '</td><td>' + inr(SINGLE[m.plan.type] ? m.inst : m.pr.yearPay) + '</td><td>' + inr(m.totalPrem) + '</td><td>' + inr(m.totalBenefit) + '</td></tr>';
			}).join('') +
			'<tr class="tot"><th>Total</th><td></td><td></td><td>' + inr(t.first) + '</td><td>' + inr(t.prem) + '</td><td>' + inr(t.ben) + '</td></tr></tbody></table></div>' +
			'<p class="a4u-note">Combined return (IRR, approx.): <b>' + pct(t.irr) + '</b>. Add another plan by calculating it and tapping "Add to Product Mix". Included in the PDF.</p>' +
			'<button type="button" data-act="mixclear" class="a4u-btn a4u-ghost a4u-small">Clear mix</button></div>';
	}
	function refreshMix() { var b = result.querySelector('.a4u-mix-out'); if (b) { b.innerHTML = mixHtml(); } }

	/* ---------- v3.1: Saved proposals (फक्त या device वर, advisor) ---------- */
	var SAVE_KEY = 'a4u_lic_saved_v1';
	function loadSaved() { try { return JSON.parse(window.localStorage.getItem(SAVE_KEY) || '[]'); } catch (e) { return []; } }
	function storeSaved(list) { try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(list.slice(0, 50))); return true; } catch (e) { return false; } }
	var SAVE_FIELDS = ['prefix', 'cname', 'gender', 'cmobile', 'plan', 'dob', 'age', 'doc', 'sa', 'budget', 'target', 'term', 'mode', 'income', 'gst', 'b_srb', 'b_fab'];
	function saveProposal(btn) {
		var snap = { at: new Date().toISOString().slice(0, 16).replace('T', ' '), by: f(form, 'by').value, v: {} };
		SAVE_FIELDS.forEach(function (n) { var el = f(form, n); if (el) { snap.v[n] = el.value; } });
		var cl = clientInfo();
		snap.label = (cl.name ? cl.prefix + ' ' + cl.name : 'Unnamed') + ' · ' + last.plan.name + ' · ' + inr(last.sa);
		var list = loadSaved().filter(function (x) { return x.label !== snap.label; });
		list.unshift(snap);
		btn.textContent = storeSaved(list) ? 'Saved ✓' : 'Could not save';
		setTimeout(function () { btn.textContent = 'Save proposal'; }, 2000);
		fillSavedMenu();
	}
	function fillSavedMenu() {
		var sel = root.querySelector('[data-saved]');
		if (!sel) { return; }
		var list = loadSaved();
		sel.innerHTML = '<option value="">My saved proposals (' + list.length + ')</option>' + list.map(function (x, i) { return '<option value="' + i + '">' + esc(x.label + ' · ' + x.at) + '</option>'; }).join('');
		sel.parentNode.hidden = !list.length;
	}
	function openSaved(i) {
		var x = loadSaved()[i];
		if (!x) { return; }
		f(form, 'plan').value = x.v.plan;
		fillPlanUI();
		SAVE_FIELDS.forEach(function (n) { var el = f(form, n); if (el && x.v[n] !== undefined && n !== 'plan') { el.value = x.v[n]; } });
		var rb = form.querySelector('input[name=by][value=' + (x.by || 'sa') + ']');
		if (rb) { rb.checked = true; syncBy(); }
		run(false);
	}

	/* ---------- v3.1: Need wizard (चर्चेसाठी पर्याय — सल्ला नाही) ---------- */
	function wizardHtml() {
		return '<details class="a4u-wizard"><summary>Not sure which plan? Help me choose</summary>' +
			field('Your main goal', '<select data-wz="goal">' + Object.keys(GOALS).map(function (k) { return '<option value="' + k + '">' + GOALS[k].label + '</option>'; }).join('') + '</select>') +
			'<div class="a4u-row">' + field('Age', '<input type="number" data-wz="age" min="0" max="65" value="30" inputmode="numeric">') +
			field('Yearly budget (₹) / one-time amount', '<input type="number" data-wz="budget" min="5000" step="1000" value="50000" inputmode="numeric">') + '</div>' +
			field('Years until you need the money', '<input type="number" data-wz="years" min="5" max="40" value="20" inputmode="numeric">') +
			'<button type="button" data-wz="go" class="a4u-btn a4u-ghost">Show options</button><div data-wz="out"></div>' +
			'<p class="a4u-note">Options to discuss with your advisor, based only on the details above — not advice. Final choice should follow a full need analysis.</p></details>';
	}
	function runWizard() {
		var w = function (n) { return root.querySelector('[data-wz="' + n + '"]'); };
		var goal = GOALS[w('goal').value], age = parseInt(w('age').value, 10), budget = parseFloat(w('budget').value), years = parseInt(w('years').value, 10);
		var out = w('out');
		var cands = goal.plans.map(planById).filter(function (p) { return p && age >= p.min_age && age <= p.max_age; });
		if (!cands.length) { out.innerHTML = '<p class="a4u-note">No suitable plan for this age in the current list.</p>'; return; }
		Promise.all(cands.map(getRates)).then(function (all) {
			var res = [];
			cands.forEach(function (p, i) {
				var terms = p.terms.slice().sort(function (a, b) { return Math.abs(resolveTerms(p, age, a).T - years) - Math.abs(resolveTerms(p, age, b).T - years); });
				for (var k = 0; k < terms.length; k++) {
					var x = compute(p, { age: age, term: terms[k], by: 'budget', budget: budget, mode: 'yearly', gst: Number(C.gst) || 0, income: 'regular', r: {}, srbO: null, fabO: null, doc: new Date() }, all[i]);
					if (!x.errors) { res.push(x); break; }
				}
			});
			lastWizard = res;
			out.innerHTML = res.length ? '<div class="a4u-wz-cards">' + res.map(function (x, i) {
				return '<div class="a4u-wz-card"><b>' + esc(x.plan.name) + '</b><span>SA ' + inr(x.sa) + ' · ' + x.T + ' yrs (pay ' + (SINGLE[x.plan.type] ? 'once' : x.P + ' yrs') + ')</span>' +
					'<span>Premium ' + inr(x.inst) + (SINGLE[x.plan.type] ? '' : ' / yr') + '</span><span>Est. benefits ' + inr(x.totalBenefit) + ' · IRR ' + pct(x.irr) + '</span>' +
					'<button type="button" class="a4u-btn a4u-small" data-wz-use="' + i + '">Use this</button></div>';
			}).join('') + '</div>' + (res.length > 1 ? '<button type="button" class="a4u-btn a4u-ghost" data-wz-cmp="1">Compare the first two</button>' : '') :
				'<p class="a4u-note">Budget is below the minimum premium for these plans. Try a higher amount.</p>';
		});
	}
	var lastWizard = [];
	function useWizard(i, thenCompare) {
		var x = lastWizard[i];
		if (!x) { return; }
		f(form, 'plan').value = x.plan.id;
		fillPlanUI();
		f(form, 'age').value = x.age; f(form, 'dob').value = '';
		f(form, 'sa').value = x.sa;
		var t = x.plan.type === 'utsav_sp' ? x.G : (BY_PPT[x.plan.type] ? x.P : x.T);
		f(form, 'term').value = t;
		f(form, 'mode').value = 'yearly';
		form.querySelector('input[name=by][value=sa]').checked = true; syncBy();
		run(false);
		if (thenCompare && lastWizard[1]) {
			setTimeout(function () {
				var cp = result.querySelector('[data-cmp="plan"]');
				if (!cp) { return; }
				cp.value = lastWizard[1].plan.id; cp.dispatchEvent(new Event('change'));
				var b = lastWizard[1], tt = b.plan.type === 'utsav_sp' ? b.G : (BY_PPT[b.plan.type] ? b.P : b.T);
				result.querySelector('[data-cmp="term"]').value = tt;
				runCompare();
			}, 250);
		}
	}

	/* ---------- Events ---------- */
	function num(name) { var el = f(form, name); return el ? parseInt(el.value, 10) : NaN; }
	function chk(name) { var el = f(form, name); return !!(el && el.checked); }

	function optNum(name) { var el = f(form, name); if (!el || el.value === '') { return null; } var v = parseFloat(el.value); return isNaN(v) ? null : Math.max(0, v); }
	function readInputs() {
		var dob = f(form, 'dob').value, docV = f(form, 'doc').value;
		var doc = docV ? new Date(docV + 'T00:00:00') : new Date();
		if (isNaN(doc.getTime())) { doc = new Date(); }
		var age = dob ? ageNearer(dob, doc) : parseInt(f(form, 'age').value, 10);
		if (dob && age !== null) { f(form, 'age').value = age; }
		var mode = f(form, 'mode').value;
		return {
			age: age,
			by: f(form, 'by').value,
			sa: num('sa'),
			budget: num('budget'),
			term: num('term'),
			mode: MODES[mode] ? mode : 'yearly',
			income: f(form, 'income').value,
			target: num('target'),
			doc: doc,
			gender: f(form, 'gender').value,
			srbO: optNum('b_srb'),
			fabO: optNum('b_fab'),
			gst: Math.min(28, Math.max(0, parseFloat(f(form, 'gst').value) || 0)),
			r: {
				adb: chk('r_adb'), adbSA: num('r_adb_sa') || 0,
				addb: chk('r_addb'),
				term: chk('r_term'), termSA: num('r_term_sa') || 0,
				pwb: chk('r_pwb'), pwbAge: num('r_pwb_age')
			}
		};
	}

	function run(doTrack) {
		var p = planById(f(form, 'plan').value);
		var inp = readInputs();
		showErr([]);
		if (inp.age === null || isNaN(inp.age)) { showErr(['Please enter date of birth or age.']); return; }
		if (inp.by === 'sa' && isNaN(inp.sa)) { showErr(['Please enter Sum Assured.']); return; }
		if (inp.by === 'budget' && !(inp.budget > 0)) { showErr(['Please enter your premium budget.']); return; }
		if (inp.by === 'maturity' && !(inp.target > 0)) { showErr(['Please enter the amount you want.']); return; }

		calcBtn.disabled = true;
		calcBtn.textContent = 'Calculating…';
		getRates(p)
			.then(function (rates) {
				var r = compute(p, inp, rates);
				if (r.errors) { showErr(r.errors); return; }
				if (inp.by !== 'sa') { f(form, 'sa').value = r.sa; }
				render(r);
				if (doTrack) { track('calculate'); }
			})
			.catch(function () { showErr(['Could not load rates. Please check your internet connection and try again.']); })
			.then(function () { calcBtn.disabled = false; calcBtn.textContent = 'Calculate'; });
	}

	f(form, 'plan').addEventListener('change', fillPlanUI);
	Array.prototype.forEach.call(form.querySelectorAll('input[name="by"]'), function (el) { el.addEventListener('change', syncBy); });
	f(form, 'doc').value = isoDate(new Date());
	function syncAge() {
		var dob = f(form, 'dob').value;
		if (!dob) { return; }
		var dv = f(form, 'doc').value, a = ageNearer(dob, dv ? new Date(dv + 'T00:00:00') : new Date());
		if (a !== null) { f(form, 'age').value = a; }
		fillBonusHints();
	}
	f(form, 'dob').addEventListener('change', syncAge);
	f(form, 'doc').addEventListener('change', syncAge);
	f(form, 'term').addEventListener('change', fillBonusHints);

	// H: आपल्या script मधले errors admin ला कळवायचे (message + file:line फक्त, एका page वरून जास्तीत जास्त 5)
	var errSent = 0;
	window.addEventListener('error', function (ev) {
		if (errSent >= 5 || !ev || !ev.filename || ev.filename.indexOf('a4u-lic') === -1) { return; }
		errSent++;
		try { post('error', { msg: String(ev.message || 'error'), src: ev.filename.split('/').pop().split('?')[0] + ':' + ev.lineno }).catch(function () {}); } catch (e) { /* काही नाही */ }
	});
	f(form, 'age').addEventListener('input', function () { f(form, 'dob').value = ''; });
	form.addEventListener('submit', function (e) { e.preventDefault(); run(true); });

	// v3.1: wizard + saved proposals (form च्या आत, result बाहेर)
	root.addEventListener('click', function (e) {
		var t = e.target;
		if (t.closest('[data-wz="go"]')) { runWizard(); return; }
		var u = t.closest('[data-wz-use]');
		if (u) { useWizard(parseInt(u.getAttribute('data-wz-use'), 10), false); return; }
		if (t.closest('[data-wz-cmp]')) { useWizard(0, true); }
	});
	var savedSel = root.querySelector('[data-saved]');
	if (savedSel) {
		savedSel.addEventListener('change', function () { if (savedSel.value !== '') { openSaved(parseInt(savedSel.value, 10)); savedSel.value = ''; } });
		fillSavedMenu();
	}

	result.addEventListener('click', function (e) {
		var b = e.target.closest('[data-act]');
		if (!b || !last) { return; }
		var act = b.getAttribute('data-act');
		if (act === 'print') {
			var d = result.querySelector('.a4u-years');
			if (d) { d.open = true; }
			track('pdf');
			window.print();
		} else if (act === 'wa') {
			track('whatsapp');
			window.open('https://wa.me/' + encodeURIComponent(C.whatsapp) + '?text=' + encodeURIComponent(waText(last)), '_blank', 'noopener');
		} else if (act === 'present') {
			openPresentation();
		} else if (act === 'rr') {
			showReckoner();
		} else if (act === 'mix') {
			addToMix();
		} else if (act === 'mixclear') {
			mixList = []; refreshMix();
		} else if (act === 'save') {
			saveProposal(b);
		} else if (act === 'compare') {
			runCompare();
		} else if (act === 'link') {
			var url = shareUrl(last);
			var done = function () { b.textContent = 'Link copied!'; setTimeout(function () { b.textContent = 'Copy link'; }, 2000); };
			if (navigator.clipboard) { navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); }); }
			else { window.prompt('Copy this link:', url); }
		}
	});

	// opt-in lead (consent असल्यासच)
	result.addEventListener('submit', function (e) {
		var lf = e.target;
		if (!lf.classList.contains('a4u-lead')) { return; }
		e.preventDefault();
		var msg = lf.querySelector('.a4u-lead-msg');
		var name = f(lf, 'name').value.trim();
		var mobile = f(lf, 'mobile').value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
		if (!name || !/^[6-9]\d{9}$/.test(mobile) || !f(lf, 'consent').checked) {
			msg.textContent = 'Please enter your name, a valid 10-digit mobile number and tick the consent box.';
			msg.className = 'a4u-lead-msg err';
			return;
		}
		var btn = lf.querySelector('button');
		btn.disabled = true;
		post('lead', { name: name, mobile: mobile, consent: 1, company: f(lf, 'company').value, plan: last.plan.name, sa: last.sa, premium: Math.round(last.inst) })
			.then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
			.then(function (o) {
				msg.textContent = o.j && o.j.message ? o.j.message : (o.ok ? 'Thank you!' : 'Something went wrong. Please try WhatsApp.');
				msg.className = 'a4u-lead-msg ' + (o.ok ? 'ok' : 'err');
				if (o.ok) { lf.reset(); }
			})
			.catch(function () { msg.textContent = 'Network error. Please try WhatsApp instead.'; msg.className = 'a4u-lead-msg err'; })
			.then(function () { btn.disabled = false; });
	});

	/* ---------- URL prefill + per-plan page (S8) ---------- */
	(function prefill() {
		var q = new URLSearchParams(window.location.search);
		var pid = q.get('plan') || C.initPlan;
		if (pid && planById(pid)) { f(form, 'plan').value = pid; }
		fillPlanUI();
		syncBy();
		if (!q.get('plan')) { return; }
		var age = parseInt(q.get('age'), 10), sa = parseInt(q.get('sa'), 10), term = parseInt(q.get('term'), 10);
		if (!isNaN(age)) { f(form, 'age').value = age; }
		if (!isNaN(sa)) { f(form, 'sa').value = sa; }
		if (!isNaN(term) && planById(f(form, 'plan').value).terms.indexOf(term) > -1) { f(form, 'term').value = term; }
		if (MODES[q.get('mode')]) { f(form, 'mode').value = q.get('mode'); }
		if (q.get('income') === 'flexi') { f(form, 'income').value = 'flexi'; }
		if (!isNaN(age) && !isNaN(sa)) { run(false); }
	})();
})();
