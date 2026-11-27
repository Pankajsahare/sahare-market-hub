/* A4U LIC Calculator v3.1 — frontend (educational illustration only) */
(function () {
	'use strict';

	var C = window.A4U_LIC;
	var root = document.getElementById('a4u-lic-app') || (C && C.apiOnly ? document.createElement('div') : null); // v4: apiOnly = फक्त engine (compare/plan chart)
	if (!C || !root) { return; }
	root.classList.add('a4u-lic'); // shortcode शिवाय (उदा. HTML widget) वापरलं तरी styles लागू

	// mode => [label, वर्षात किती हप्ते]
	var MODES = { yearly: ['Yearly', 1], half: ['Half-yearly', 2], quarter: ['Quarterly', 4], month: ['Monthly', 12] };
	// verified rates नसतील तेव्हा फक्त अंदाजासाठी demo factor
	var DEMO_FACTOR = { endowment: 0.98, anand: 1.02, labh: 0.84, lakshya: 0.9, umang: 1.25, utsav: 1.6 };
	// v4.4: LIC rider SA मर्यादा [किमान, कमाल]
	var RIDER_LIM = { term: [100000, 2500000], adb: [20000, 10000000], addb: [10000, 10000000] };
	var SINGLE = { single: 1, utsav_sp: 1, term_sp: 1 };
	var TERMS = { term: 1, term_sp: 1 };            // v4.3: शुद्ध term (maturity नाही)       // एकदाच premium भरायचे plans
	var GOALS = {
		child: { label: 'Child education / marriage', plans: ['732', '736', '733'] },
		retire: { label: 'Retirement income', plans: ['745', '771'] },
		save: { label: 'Savings with life cover', plans: ['715', '714', '736', '720'] },
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
		field('Payment mode', '<select name="mode">' + modeOpts + '</select><small class="a4u-nach" hidden>Monthly premium is collected by NACH (bank auto-debit). Without NACH, LIC charges 5% extra on monthly mode.</small>', 'a4u-mode') +
		'</div>' +
		field('Smoking', '<select name="smoker"><option value="NS">Non-smoker</option><option value="S">Smoker</option></select>', 'a4u-smoker') + // v4.2: 894
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
		if (p.type === 'platinum') { return (t % 100) + ' years (pay ' + Math.floor(t / 100) + ' years)'; } // v4.1: 770 — PPT×100 + term
		if (p.type === 'term') { var tp = Math.floor(t / 100), tt = t % 100; return tt + ' years (' + (tp === 1 ? 'single premium' : (tp === tt ? 'pay every year' : 'pay ' + tp + ' years')) + ')'; } // v4.2: 894
		return t + ' years';
	}
	function termLabel(p) { return p.type === 'utsav_sp' ? 'Guaranteed Addition period' : (BY_PPT[p.type] ? 'Premium paying term' : 'Policy term'); }

	function riderHtml(p) {
		var h = '';
		if (has(p, 'adb')) { h += '<div class="a4u-rider"><label class="a4u-check"><input type="checkbox" name="r_adb" value="1"> ' + RIDERS.adb + '</label>' + field('Rider Sum Assured (₹20,000 – ₹1 crore, up to 3 × SA; blank = SA)', '<input type="number" name="r_adb_sa" min="0" step="5000" inputmode="numeric">', 'a4u-sub-field') + '</div>'; }
		if (has(p, 'addb')) { h += '<div class="a4u-rider"><label class="a4u-check"><input type="checkbox" name="r_addb" value="1"> ' + RIDERS.addb + ' (age 18–60, cover up to ₹1 crore)</label></div>'; }
		if (has(p, 'term')) { h += '<div class="a4u-rider"><label class="a4u-check"><input type="checkbox" name="r_term" value="1"> ' + RIDERS.term + ' (age 18+)</label>' + field('Term rider Sum Assured (₹1 lakh – ₹25 lakh, up to SA; blank = SA up to ₹25 lakh)', '<input type="number" name="r_term_sa" min="0" step="5000" inputmode="numeric">', 'a4u-sub-field') + '</div>'; }
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
		root.querySelector('.a4u-smoker').hidden = p.type !== 'term';
		if (p.allowed_modes && p.allowed_modes.length && p.allowed_modes.indexOf(f(form, 'mode').value) < 0) { f(form, 'mode').value = p.allowed_modes[0]; }
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
	// v4.1 (S2): tariff फक्त लागेल तेव्हाच — plan निवडल्यावर (पान हलकं)
	function getTariff(p) {
		if (!p || p.tariff || !p.has_tariff || !C.dataUrl) { return Promise.resolve(); }
		if (p._tp) { return p._tp; }
		p._tp = fetch(C.dataUrl + 'tariff/' + encodeURIComponent(p.id) + '.json?v=' + C.version)
			.then(function (r) { if (!r.ok) { throw new Error('tariff'); } return r.json(); })
			.then(function (j) { p.tariff = j; })
			.catch(function () { p._tp = null; }); // मिळालं नाही तर brochure अंदाज
		return p._tp;
	}
	function getRates(p) { return getTariff(p).then(function () { return getRatesRaw(p); }); }
	function getRatesRaw(p) {
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
		if (p.mb_end_age) { return 1 / key; } // 732: key = मुदत = PPT
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

	function guaranteedOf(x) {
		var t = x.plan.type;
		if (t === 'moneyback') { return (x.plan.mat_pct || 0) * x.sa / 100 + x.totalSurv; }
		return (t === 'utsav' ? 0 : (t === 'utsav_sp' ? x.maturity : x.sa)) + x.totalSurv;
	}
	// money-back: कोणत्या policy वर्षाअखेरीस किती % SA (732 मध्ये मुलाच्या वयानुसार)
	function mbSchedule(p, age) {
		var m = {};
		(p.sb_years || []).forEach(function (x) { m[x[0]] = x[1]; });
		(p.sb_ages || []).forEach(function (x) { var y = x[0] - age; if (y >= 1) { m[y] = (m[y] || 0) + x[1]; } });
		return m;
	}
	function mbTotalPct(p) {
		var t = Number(p.mat_pct) || 0;
		(p.sb_years || []).concat(p.sb_ages || []).forEach(function (x) { t += Number(x[1]); });
		return t;
	}

	// policy term (T) आणि premium paying term (P)
	function resolveTerms(p, age, sel) {
		switch (p.type) {
			case 'labh': return { T: sel, P: Number(p.ppt_map[sel]) };
			case 'lakshya': return { T: sel, P: sel - 3 };
			case 'ga_endow': return { T: sel, P: sel - (p.ppt_less || 5) }; // 760 Bima Jyoti: PPT = term − 5
			case 'platinum': return { T: sel % 100, P: Math.floor(sel / 100) }; // 770 Bima Platinum
			case 'term': case 'term_sp': return { T: sel % 100, P: Math.floor(sel / 100) }; // 894 Jeevan Raksha (P = T नियमित, P = 1 single)
			case 'umang':
			case 'utsav': return { T: (p.maturity_age || 100) - age, P: sel };
			case 'single': return { T: sel, P: 1 };
			case 'utsav_sp': return { T: (p.maturity_age || 100) - age, P: 1, G: sel };
			case 'moneyback': // 732: मुदत = 25 − वय; 720/721: ठरलेली मुदत, कमी PPT
				if (p.mb_end_age) { return { T: p.mb_end_age - age, P: p.mb_end_age - age }; }
				return { T: sel, P: p.mb_ppt || sel };
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
		var rbands = p.type === 'term_sp' && p.rebate_pct_bands_sp && p.rebate_pct_bands_sp.length ? p.rebate_pct_bands_sp : p.rebate_pct_bands;
		if (rbands && rbands.length) { // v4.2: 894 — tabular premium च्या % मध्ये (वय गट × SA गट); single साठी वेगळा तक्ता
			var rp = 0;
			rbands.some(function (b) { if (inp.age <= b[0]) { b[1].forEach(function (x) { if (sa >= x[0]) { rp = x[1]; } }); return true; } return false; });
			rebate = tabular * rp / 100;
		}
		var base = Math.max(0, tabular - rebate); // annualised premium (mode loading शिवाय)
		var riders = {}, rTotal = 0, term = ctx.T || inp.term;
		if (inp.r.adb) { riders.adb = riderRate('adb', inp.age, term) * (inp.r.adbSA || Math.min(sa, RIDER_LIM.adb[1])) / 1000; }
		if (inp.r.addb) { riders.addb = riderRate('addb', inp.age, term) * Math.min(sa, RIDER_LIM.addb[1]) / 1000; } // v4.4: ADDB कमाल ₹1 कोटी
		if (inp.r.term) { riders.term = ((p.tariff && tgrid(p.tariff.term_rider_by_ppt ? p.tariff.term_rider_by_ppt[ctx.P || 0] : p.tariff.term_rider, inp.age, term)) || riderRate('term', inp.age, term)) * (inp.r.termSA || Math.min(sa, RIDER_LIM.term[1])) / 1000; }
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
		var modes = Object.keys(MODES).filter(function (k) { return !(p.allowed_modes && p.allowed_modes.length) || p.allowed_modes.indexOf(k) > -1; }).map(function (k) { var y = yearlyIn(k) * g; return [k, y / MODES[k][1], y]; });
		var yp = yearlyIn(inp.mode) * g;
		// v4.4.1: GSV साठी प्रत्यक्ष भरलेला मूळ हप्ता (mode rebate नंतर; GST, riders शिवाय) — LIC BI (736) शी पडताळलेलं
		var adj0 = modeAdj(p, inp.mode), gsvBase = adj0 === null ? base * (Number(C.modal[inp.mode]) || 1) * MODES[inp.mode][1] : Math.max(0, tabular * (1 + adj0 / 100) - rebate);
		return { rebate: rebate, tabular: tabular, base: base, gsvBase: gsvBase, riders: riders, inst: yp / MODES[inp.mode][1], yearPay: yp, modes: modes };
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
		if (p.type === 'term' && P === 1) { // v4.3: 894 single premium — त्याच plan ची single आवृत्ती
			p._sp = p._sp || Object.assign({}, p, { type: 'term_sp', allowed_modes: [], _sp: null });
			p._sp.tariff = p.tariff;
			p = p._sp;
		}
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
		if (p.type === 'platinum' && p.ppt_age && p.ppt_age[P]) { // 770: PPT नुसार प्रवेश वय
			var pa = p.ppt_age[P];
			if (age < pa[0] || age > pa[1]) { errs.length = 0; errs.push('For a ' + P + '-year premium term the entry age must be ' + (pa[0] === 0 ? '30 days' : pa[0] + ' years') + ' to ' + pa[1] + ' years.'); }
		}
		if (p.allowed_modes && p.allowed_modes.length && p.allowed_modes.indexOf(inp.mode) < 0) { errs.push('This plan allows only ' + p.allowed_modes.map(function (m) { return MODES[m][0]; }).join(' or ') + ' premium.'); }
		if (p.max_sa && inp.by === 'sa' && inp.sa > p.max_sa) { errs.push('Maximum Sum Assured for this plan is ' + inr(p.max_sa) + ' per life.'); }
		if (errs.length) { return { errors: errs }; }

		var key = BY_PPT[p.type] ? P : T;
		if (p.type === 'utsav_sp') { key = inp.term; }
		// दराचा क्रम: CSV (tariff) → खरी quotation → brochure estimate → demo
		var rate = rates[age + '|' + key], basis = p.verified ? 'verified' : 'csv';
		if (!rate && p.tariff) { // v4: LIC tariff (दर per 1000 SA) — अचूक
			var tr = p.tariff.rate_by_opt ? tgrid(p.tariff.rate_by_opt[(inp.gender === 'F' ? 'F' : 'M') + '_' + (inp.smoker === 'S' ? 'S' : 'NS') + '_' + (P === 1 ? 'SP' : (P === T ? 'RP' : 'LP_' + P))], age, T)
				: (p.tariff.rate_by_ppt ? tgrid(p.tariff.rate_by_ppt[P], age, T) : tgrid(p.tariff.rate, age, key));
			if (tr) { rate = tr; basis = 'tariff'; }
		}
		if (!rate && p.points && p.points[age + '|' + key]) { rate = Number(p.points[age + '|' + key]); basis = 'quote'; }
		if (!rate) {
			rate = sampleRate(p, age, key);
			basis = 'brochure';
			if (!rate) { rate = demoRate(p, age, P, T); basis = 'demo'; }
		}
		var demo = basis !== 'verified' && basis !== 'quote' && basis !== 'tariff';
		var bn = bonusFor(p, T);
		if (inp.srbO !== null) { bn.srb = inp.srbO; }
		if (inp.fabO !== null) { bn.fab = inp.fabO; }
		var bonusYears = p.type === 'umang' ? P : ((p.type === 'utsav' || p.type === 'utsav_sp' || p.type === 'ga_endow' || p.type === 'platinum' || p.type === 'term' || p.type === 'term_sp') ? 0 : T);

		var sa = inp.sa;
		if (inp.by === 'maturity') { // B: लक्ष्य रकमेवरून SA (वर round — लक्ष्य पूर्ण व्हावं म्हणून)
			if (!(inp.target > 0)) { return { errors: ['Please enter the amount you want.'] }; }
			if (INCOME[p.type]) { sa = inp.target / (p.survival_pct / 100); }
			else { sa = inp.target / ((p.type === 'moneyback' ? mbTotalPct(p) / 100 : 1) + (bn.srb * bonusYears + (T >= p.fab_min_term || inp.fabO !== null ? bn.fab : 0)) / 1000); }
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
		// v4.4: LIC च्या rider मर्यादा (Term ₹1 लाख–₹25 लाख, AB ₹20,000–₹1 कोटी); रिकामं ठेवलं तर कमाल मर्यादेपर्यंत आपोआप
		var tSA = inp.r.term ? (inp.r.termSA || Math.min(sa, RIDER_LIM.term[1])) : 0, aSA = inp.r.adb ? (inp.r.adbSA || Math.min(sa, RIDER_LIM.adb[1])) : 0;
		if (inp.r.term && (tSA < RIDER_LIM.term[0] || tSA > RIDER_LIM.term[1])) { return { errors: ['Term rider Sum Assured must be between ' + inr(RIDER_LIM.term[0]) + ' and ' + inr(RIDER_LIM.term[1]) + '.'] }; }
		if (inp.r.adb && (aSA < RIDER_LIM.adb[0] || aSA > RIDER_LIM.adb[1])) { return { errors: ['Accident Benefit rider Sum Assured must be between ' + inr(RIDER_LIM.adb[0]) + ' and ' + inr(RIDER_LIM.adb[1]) + '.'] }; }

		var G = tp.G || 0;
		var pr = premiumFor(p, inp, rate, sa, { T: T, P: P });
		var bonus = bn.srb * sa / 1000 * bonusYears;
		var fab = (T >= p.fab_min_term || inp.fabO !== null ? bn.fab : 0) * sa / 1000;
		var ga = (p.ga_per_1000 || 0) * sa / 1000 * (p.type === 'utsav_sp' ? G : (p.type === 'ga_endow' ? T : P));
		if (p.type === 'platinum') { // 770: एकूण वार्षिक premium वर ₹70/1000 + high SA incentive (brochure Para 10)
			var gaRate = p.ga_prem_per_1000 || 70;
			((p.ga_hsa || {})[P] || []).forEach(function (b) { if (sa >= b[0]) { gaRate = (p.ga_prem_per_1000 || 70) + b[1]; } });
			ga = gaRate / 1000 * pr.base * P;
		}
		var hasIncome = p.type === 'umang' || p.type === 'utsav' || p.type === 'utsav_sp' || p.type === 'platinum';
		var survival = hasIncome ? p.survival_pct * sa / 100 : 0;
		var incomeStart = p.type === 'utsav' ? Math.max(11, P + 3) : (p.type === 'utsav_sp' ? G + 1 : P);
		var flexi = inp.income === 'flexi' && (p.type === 'utsav' || p.type === 'utsav_sp');
		// maturity: 771 मध्ये नाही; 883 मध्ये higher of BSA / 1.25 × tabular SP + GA
		var maturity = 0;
		if (p.type === 'utsav_sp') { maturity = Math.max(sa, 1.25 * pr.tabular) + ga; }
		else if (p.type === 'moneyback') { maturity = (p.mat_pct || 0) * sa / 100 + bonus + fab; }
		else if (p.type === 'ga_endow' || p.type === 'platinum') { maturity = sa + ga; }
		else if (p.type !== 'utsav' && p.type !== 'term' && p.type !== 'term_sp') { maturity = sa + bonus + fab; }
		var sbMap = p.type === 'moneyback' ? mbSchedule(p, age) : {};

		var rows = [], cf = [], cum = 0, totalPrem = 0, totalSurv = 0, flexiBal = 0, y;
		for (y = 0; y <= T; y++) { cf.push(0); }
		for (y = 1; y <= T; y++) {
			var prem = y <= P ? pr.yearPay : 0, ben = 0, inc = 0;
			if (survival && y >= incomeStart && (p.type === 'utsav' ? y <= T : y < T)) { inc = survival; totalSurv += survival; }
			if (sbMap[y]) { inc = sbMap[y] * sa / 100; totalSurv += inc; } // money-back हप्ता
			if (p.type === 'platinum' && y === P + 5 && y < T) { var boost = (p.booster_pct || 70) * sa / 100; inc += boost; totalSurv += boost; } // 770: booster
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
		var deathSA = 0, deathNote = '';
		if (p.type === 'single' || p.type === 'utsav_sp' || p.type === 'term_sp') {
			var mult = 1.25;
			(p.death_sp || []).some(function (d) { if (age <= d[0]) { mult = d[1]; return true; } return false; });
			deathSA = Math.max(sa, mult * (p.type === 'utsav_sp' ? pr.tabular : pr.base));
			if (p.type === 'utsav_sp') { deathNote = 'plus accrued Guaranteed Additions'; }
		} else if (p.type === 'lakshya') {
			deathSA = Math.max(7 * pr.base, (p.death_pct || 110) / 100 * sa);
			deathNote = 'plus 10% of SA every year till maturity (Annual Income Benefit)';
		} else if (p.type === 'platinum') {
			deathSA = Math.max(11 * pr.base, sa);
			deathNote = 'plus accrued Guaranteed Additions';
		} else if (p.death_pct > 0) {
			deathSA = Math.max(p.death_pct / 100 * sa, 7 * pr.base);
		}
		var totalBenefit = maturity + (flexi ? flexiBal : totalSurv);
		var table = buildTable(p, inp, { age: age, sa: sa, T: T, P: P, G: G, pr: pr, bn: bn, bonusYears: bonusYears, survival: survival, incomeStart: incomeStart, sbMap: sbMap, maturity: maturity, fab: fab, deathSA: deathSA, flexi: flexi, ga: ga });
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
			pvBenefit: pvBenefit, taxNotes: taxNotes, fabRate: bn.fab, gender: inp.gender, smoker: inp.smoker || 'NS', target: inp.by === 'maturity' ? inp.target : 0,
			docText: niceDate(docD), matText: niceDate(matD),
			plan: p, age: age, sa: sa, T: T, P: P, G: G, mode: SINGLE[p.type] ? 'single' : inp.mode, by: inp.by, gst: inp.gst, r: inp.r, income: flexi ? 'flexi' : 'regular',
			basis: basis, demo: demo, rate: rate, pr: pr, inst: pr.inst, totalPrem: totalPrem, bonus: bonus, fab: fab, ga: ga, srb: bn.srb,
			sbList: Object.keys(sbMap).map(function (k) { return [Number(k), sbMap[k]]; }),
			survival: survival, incomeStart: incomeStart, totalSurv: totalSurv, flexiBal: flexiBal, deathSA: deathSA, deathNote: deathNote,
			maturity: maturity, totalBenefit: totalBenefit, irr: irr(cf), rows: rows, table: table, hasCV: !!(p.gsv_prem && p.gsv_prem.length) || !!(p.tariff && p.tariff.gsv_p)
		};
	}

	/* ---------- v3.2: वर्षवार Benefit & Coverage तक्ता (LIC report सारखा) ---------- */
	// v4: tariff grid {c:[columns], r:{row:[values]}} — एक column असेल तर तोच
	function tgrid(g, row, col) {
		if (!g || !g.r) { return null; }
		var r = g.r[String(row)];
		if (!r) { return null; }
		var i = g.c.length === 1 ? 0 : g.c.indexOf(Number(col));
		var v = i < 0 ? null : r[i];
		return v ? Number(v) : null;
	}
	// v4: Special Surrender Value (LIC factors) — मिळालं नाही तर null
	function ssvFor(p, o, y, paidYears, cumAdd, sbPaid) {
		var t = p.tariff && p.tariff.ssv;
		if (!t || paidYears < 1) { return null; }
		var n = o.P || 1, pusa = o.sa * Math.min(paidYears, n) / n, f1, f2;
		switch (t.family) {
			case 'endow':
				f1 = tgrid(t.f1, y, o.T); f2 = tgrid(t.f2, y, o.T);
				if (f1 === null && f2 === null) { return null; }
				return (pusa + (y >= 3 ? cumAdd : 0)) * ((f1 || 0) + (f2 || 0)); // v4.4.1: पहिल्या 2 वर्षांत bonus SSV मध्ये नाही (LIC BI 736)
			case 'lakshya': // 733: (PUSA + बोनस) × F2 + (मृत्यू-नंतरचं 10% उत्पन्न, भरलेल्या हप्त्यांच्या प्रमाणात) × F1 — खऱ्या report शी पडताळलेलं
				f1 = tgrid(t.f1, y, o.T); f2 = tgrid(t.f2, y, o.T);
				if (f1 === null && f2 === null) { return null; }
				return (pusa + cumAdd) * (f2 || 0) + 0.1 * o.sa * Math.min(paidYears, n) / n * (f1 || 0);
			case 'umang': // 745: LIC BI (PPT 15 व 30) शी पडताळलेलं
				f1 = tgrid(t.f1, y, 0);
				if (f1 === null) { return null; }
				var f3u = tgrid(t.f3, y, n) || 0, incPU = (o.survival || 0) * Math.min(paidYears, n) / n;
				if (y < n) { // हप्ते काळ: (PUSA + bonus) × F1 + paid-up income × F3 (income भाग PPT च्या 1/5 वर्षांनंतर)
					return (pusa + (y >= 3 ? cumAdd : 0)) * f1 + (y >= n / 5 ? incPU * f3u : 0);
				}
				// हप्ते संपल्यानंतर: SA × (F1+F2) + income × F3 + bonus × F1 (bonus भाग LIC पेक्षा कमीच धरलेला — सुरक्षित)
				return o.sa * (f1 + (tgrid(t.f2, y, 0) || 0)) + incPU * f3u + cumAdd * f1;
			case 'mb':
				if (y < 3) { cumAdd = 0; } // v4.4.2: पहिल्या 2 वर्षांत bonus SSV मध्ये नाही (LIC BI 720)
				if (sbPaid > 0) { return null; } // पहिलं survival benefit दिल्यानंतरचं सूत्र खऱ्या report शी जुळत नाही → फक्त GSV
				f1 = tgrid(t.f1, y, o.T); f2 = tgrid(t.f2, y, o.T);
				if (f1 === null && f2 === null) { return null; }
				return (pusa + cumAdd) * (f1 || 0) + Math.max(0, pusa - sbPaid + cumAdd) * (f2 || 0);
			case 'utsav':
				f1 = tgrid(t.f1, y, 0);
				if (f1 === null) { return null; }
				f2 = paidYears >= n ? (tgrid(t.f2, y, n) || 0) : 0; // पूर्ण भरलेल्या policy लाच income चं मूल्य
				return (pusa + cumAdd) * f1 + o.survival * f2;
			case 'utsav_sp':
				f1 = tgrid(t.f1, y, 0);
				if (f1 === null) { return null; }
				var gaYr = (p.ga_per_1000 || 0) * o.sa / 1000;
				return (o.sa + cumAdd) * f1 + o.survival * (tgrid(t.f3, y, o.G) || 0) + gaYr * (tgrid(t.f4, y, o.G) || 0);
		}
		return null;
	}
	function gsvFor(p, o, y, cumBase, cumAdd, sbPaid, single) {
		var t = p.tariff;
		if (!t || !t.gsv_p) { return null; }
		var fp = tgrid(t.gsv_p, y, o.T);
		if (fp === null) { fp = 0; }
		var fa = t.gsv_b ? tgrid(t.gsv_b, y, o.T) : (t.gsv_g ? tgrid(t.gsv_g, y, o.T) : (t.gsv_ga ? tgrid(t.gsv_ga, y, o.T) : 0));
		var prem = single ? (o.pr.tabular || o.pr.base) : cumBase;
		return Math.max(0, fp * prem + (fa || 0) * cumAdd - (p.gsv_less_income || p.type === 'moneyback' ? sbPaid : 0));
	}
	function stepPct(list, y) { // [[वर्ष, %]...] — त्या वर्षापर्यंतचा शेवटचा
		var v = 0;
		(list || []).forEach(function (x) { if (y >= x[0]) { v = Number(x[1]); } });
		return v / 100;
	}
	function buildTable(p, inp, o) {
		var out = [], cumPrem = 0, cumBase = 0, cumAdd = 0, paidOut = 0;
		var isGA = p.ga_per_1000 > 0 || p.type === 'platinum', single = !!SINGLE[p.type];
		var gaYears = p.type === 'utsav_sp' ? o.G : (p.type === 'ga_endow' ? o.T : o.P);
		// लहान मुलांसाठी जोखीम (risk) उशिरा सुरू: 8 वर्षांखाली — 2 वर्षे किंवा 8 वय, जे आधी
		var riskStart = o.age < 8 ? Math.min(2, 8 - o.age) : 0;
		var adb = inp.r && inp.r.adb ? Number(inp.r.adbSA) || 0 : 0;
		var loanRate = (Number(C.loanRate) || 9.5) / 100;
		for (var y = 1; y <= o.T; y++) {
			var prem = y <= o.P ? o.pr.yearPay : 0, basePrem = y <= o.P ? (single ? o.pr.tabular || o.pr.base : (o.pr.gsvBase || o.pr.base)) : 0;
			cumPrem += prem; cumBase += basePrem; // दाखवायला भरलेला हप्ता; GSV साठी मूळ (tax/rider शिवाय)
			var add = 0;
			if (isGA && y <= gaYears) { add = p.type === 'platinum' ? o.ga / o.P : p.ga_per_1000 * o.sa / 1000; }
			else if (!isGA && y <= o.bonusYears) { add = o.bn.srb * o.sa / 1000; }
			cumAdd += add;
			var inc = 0;
			if (o.survival && y >= o.incomeStart && (p.type === 'utsav' ? y <= o.T : y < o.T)) { inc = o.survival; }
			if (o.sbMap[y]) { inc = o.sbMap[y] * o.sa / 100; }
			if (p.type === 'platinum' && y === o.P + 5 && y < o.T) { inc += (p.booster_pct || 70) * o.sa / 100; } // 770 booster
			var ret = inc + (y === o.T ? o.maturity : 0);
			var cover = y <= riskStart ? cumPrem : Math.max(o.deathSA || 0, o.sa) + cumAdd;
			// Guaranteed Surrender Value (brochure factors असतील तरच)
			var cv = null, loan = null;
			var paidYears = Math.min(y, o.P);
			var tg = y < o.T ? gsvFor(p, o, y, cumBase, cumAdd, paidOut, single) : null;
			if (tg !== null) { // v4: LIC चे GSV + SSV factors — दोन्हीपैकी जास्त
				var ts = ssvFor(p, o, y, paidYears, cumAdd, paidOut);
				cv = Math.max(tg, ts || 0);
				if (y >= (p.loan_from || 1)) {
					var lp2 = paidYears >= 2 ? (p.loan_pct || 75) / 100 : 0.5;
					if (p.loan_ga_bands && p.loan_ga_bands.length && y <= gaYears) { lp2 = 0.4; p.loan_ga_bands.forEach(function (b) { if (gaYears >= b[0]) { lp2 = b[1] / 100; } }); }
					loan = lp2 * cv;
					if (o.survival && y >= o.incomeStart) { loan = Math.min(loan, Math.floor(0.5 * o.survival / loanRate / 10000) * 10000); }
					if (!(loan > 0)) { loan = null; }
				}
			} else if (p.gsv_prem && p.gsv_prem.length && y < o.T) {
				cv = stepPct(p.gsv_prem, y) * (single ? (o.pr.tabular || o.pr.base) : cumBase) + stepPct(p.gsv_add, y) * cumAdd;
				if (p.gsv_less_income) { cv -= paidOut; }
				cv = Math.max(0, cv);
				if (y >= (p.loan_from || 2)) {
					var incomeStarted = o.survival && y >= o.incomeStart;
					var lp = 0.75;
					if (p.loan_ga_bands && p.loan_ga_bands.length && y <= gaYears) { lp = 0.4; p.loan_ga_bands.forEach(function (b) { if (gaYears >= b[0]) { lp = b[1] / 100; } }); }
					loan = lp * cv;
					if (incomeStarted) { loan = Math.min(loan, Math.floor(0.5 * o.survival / loanRate / 10000) * 10000); }
				}
			} else if ((p.tariff && p.tariff.gsv_p || p.gsv_prem && p.gsv_prem.length) && y === o.T && o.maturity) { cv = o.maturity; }
			paidOut += inc;
			out.push({ y: y, age: o.age + y - 1, prem: prem, cumPrem: cumPrem, add: add, cumAdd: cumAdd, cover: cover, acc: cover + (y > riskStart ? adb : 0), cv: cv, loan: loan, ret: ret });
		}
		return out;
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
		if (p.type === 'term' || p.type === 'term_sp') { h += '<div class="a4u-banner a4u-exact">Pure term plan: if the life assured dies during the term, the family gets the Sum Assured. There is no maturity or surrender value.</div>'; }
		if (r.basis === 'tariff') { h += '<div class="a4u-banner a4u-exact">Premium worked out from the LIC tariff rate for this age and term.' + (TERMS[p.type] ? '' : ' Surrender and loan values are estimates.') + '</div>'; }
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
			(TERMS[p.type] ? card('Life cover (on death)', inr(Math.max(r.deathSA || 0, r.sa))) + card('Cover till age', String(r.age + r.T)) // v4.2: term — maturity नाही
			: card(r.totalSurv ? 'Estimated total benefits' : 'Estimated maturity', inr(r.totalBenefit)) +
			card('Return (IRR, approx.)', r.irr === null ? '—' : (r.irr * 100).toFixed(2) + '% p.a.')) +
			'</div>';

		// v3.2: LIC report सारखा भाग — You pay / You get, timeline, Maturity Details
		var RI = reportInfo(r), sp1 = !!SINGLE[p.type];
		h += '<div class="a4u-rep"><div class="a4u-paybox">' +
			'<div><span>' + RL.paytot + '</span><b>' + inr(r.totalPrem) + '</b>' + (sp1 ? '' : '<small>' + rfmt(rlEN, 'perday', { d: inr(RI.perDay) }) + '</small>') + '</div>' +
			(TERMS[p.type] ? '<div class="get"><span>Family gets on death</span><b>' + inr(Math.max(r.deathSA || 0, r.sa)) + '</b><small>Pure protection: nothing is paid if you survive the term</small></div></div>'
			: '<div class="get"><span>' + RL.gettot + '</span><b>' + inr(r.totalBenefit) + '</b>' + (RI.ratio ? '<small>' + rfmt(rlEN, 'every1', { x: RI.ratio.toFixed(2) }) + '</small>' : '') + '</div></div>') +
			'<h4>Benefit illustration</h4><div class="a4u-tl">' + timelineSvg(r, '#0b4ea2', '#1f8f4e') + '</div>' +
			'<p class="a4u-tl-leg"><span class="k pay"></span>' + RL.youpay + ' <span class="k cov"></span>' + RL.lcover + ' <span class="k get"></span>' + RL.youget + ' <em>(age)</em></p>' +
			'<h4>' + RL.md + '</h4><table class="a4u-sum"><tbody>' + maturityRows(r, rlEN).map(function (q) { return tr(q[0], q[1]); }).join('') + '</tbody></table></div>';

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
		else if (p.type === 'moneyback') {
			r.sbList.forEach(function (x) { rows += tr('<b>Guaranteed:</b> Money back ' + x[1] + '% of SA at end of year ' + x[0] + ' (age ' + (r.age + x[0]) + ')', inr(x[1] * r.sa / 100)); });
			rows += tr('<b>Guaranteed:</b> ' + p.mat_pct + '% of SA on maturity (age ' + (r.age + r.T) + ')', inr(p.mat_pct * r.sa / 100));
		}
		else if (p.type !== 'utsav' && !TERMS[p.type]) { rows += tr('<b>Guaranteed:</b> Basic Sum Assured on maturity', inr(r.sa)); }
		if (r.totalSurv && p.type !== 'moneyback') {
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

		h += '<div class="a4u-v4charts" aria-label="Benefit charts"></div>'; // v4: नवीन charts (a4u-lic-hub.js)
		h += chart(r);
		h += '<details class="a4u-years"' + (r.table.length <= 25 ? ' open' : '') + '><summary>' + RL.bct + '</summary><div class="a4u-scroll">' +
			benefitTableHtml(r, rlEN, 'a4u-bct', 0, undefined, true) + '</div>' +
			(r.hasCV ? '<p class="a4u-note">' + RL.cvnote + '</p>' : '') + (r.age < 8 ? '<p class="a4u-note">' + RL.risknote + '</p>' : '') + '</details>';
		if (r.income === 'flexi') {
			var fx = flexiRows(r);
			if (fx.length) {
				h += '<details class="a4u-years"><summary>' + RL.opt2 + '</summary><div class="a4u-scroll"><table><thead><tr><th>' + RL.c_yr + '</th><th>' + RL.c_age + '</th><th>' + RL.c_inc + '</th><th>' + RL.c_bal + '</th></tr></thead><tbody>' +
					fx.map(function (q) { return '<tr><td>' + q[0] + '</td><td>' + q[1] + '</td><td>' + inr(q[2]) + '</td><td>' + inr(q[3]) + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
			}
		}

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
		try { document.dispatchEvent(new CustomEvent('a4u-lic-result', { detail: r })); } catch (e) { /* जुने browser */ }
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
				['Guaranteed benefits', function (x) { return inr(guaranteedOf(x)); }],
				['Non-guaranteed bonus (est.)', function (x) { var v = x.bonus + x.fab; return isFinite(v) ? inr(v) : '—'; }],
				['Estimated total benefits', function (x) { return isFinite(x.totalBenefit) ? inr(x.totalBenefit) : '—'; }],
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
	/* ---------- v3.2: LIC report सारखी मांडणी (screen + PDF दोन्हीसाठी एकच code) ---------- */
	// English labels — PDF मराठी/हिन्दी साठी present.js स्वतःचे शब्द देते
	var RL = {
		md: 'Maturity Details', youpay: 'You pay', youget: 'You get', lcover: 'Life cover', lumpsum: 'Lump sum', income: 'Yearly income', mback: 'Money back',
		perday: 'That\'s just {d} per day', every1: 'For every ₹1 you pay, you get ₹{x} back', pchart: 'Premium Chart', paytot: 'Total you pay', gettot: 'Total you get', gain: 'Gain',
		how: 'How the plan works', why: 'Why LIC', bct: 'Benefit & Coverage Table', opt2: 'Flexi Income — if you do not withdraw',
		c_age: 'Age', c_yr: 'Year', c_prem: 'Premium', c_cum: 'Total premium', c_add: 'GA / Bonus (year)', c_cumadd: 'GA / Bonus (total)', c_cover: 'Normal death cover',
		c_acc: 'Accident death cover', c_loan: 'Loan*', c_cv: 'Cash value*', c_ret: 'Returns', c_inc: 'Income credited', c_bal: 'Accumulated @ 5.5%',
		cvnote: '* Loan and cash value use the Guaranteed Surrender Value (minimum) from the LIC brochure. The actual Special Surrender Value is usually higher.',
		risknote: 'For a child below 8 years, risk cover starts later; till then the death benefit is a refund of premiums paid.',
		totpaid: 'Total premium paid', totret: 'Total returns',
		m_sa: 'Basic Sum Assured', m_ga: 'Guaranteed Additions', m_srb: 'Bonus (estimated)', m_fab: 'Final Additional Bonus (est.)', m_inc: 'Income every year', m_incage: 'Income starts at age',
		m_tsurv: 'Total survival benefit', m_mat: 'Maturity amount', m_matage: 'Maturity at age', m_mb: 'Money back at age', m_coverto: 'Life cover till age',
		h_prem: 'Premium', h_cov: 'Coverage', h_mat: 'Maturity', h_acc: 'Accruals', h_tax: 'Tax', h_feat: 'Features',
		t_prem: 'Pay {i} {m} for {p} years.', t_prem1: 'Pay {i} once.', t_cov: 'Life cover from {a} to {b} during the policy.', t_mat: 'Receive {m} at age {g}.', t_mat0: 'Receive {s} every year from age {g}.',
		t_acc_ga: 'Guaranteed Additions of {r} per ₹1000 Sum Assured every year.', t_acc_b: 'Bonus declared by LIC every year (assumed {r} per ₹1000).', t_acc_n: 'Guaranteed payouts as per the plan.',
		t_tax: 'Premium may qualify under Section 80C; maturity under Section 10(10D), subject to conditions.', t_feat: 'Loan and surrender facility, optional riders and nomination.',
		w1: 'Owned by the Government of India', w2: 'Policy money guaranteed by the Central Government (Section 37, LIC Act 1956)', w3: 'Serving families since 1956', w4: 'Branches and agents across India',
		feat: 'Plan Features', f_death: 'Death benefit', f_mat: 'Maturity benefit', f_add: 'Additions', f_tax: 'Income tax', f_surr: 'Surrender', f_loan: 'Loan',
		fv_death: 'At least {d} (never less than 105% of premiums paid)', fv_tax: 'Section 80C and 10(10D), subject to conditions', fv_surr: 'Available after {y} years', fv_loan: 'Available after {y} years, against the surrender value',
		plandet: 'Plan Details', riders: 'Selected riders', none: 'None', custom: 'Plan presentation customised for',
		d_endowment: 'A savings and protection plan. Your family gets financial support if something happens to you, and you get a lump sum with bonus at maturity.',
		d_lakshya: 'A plan for your child\'s goals. If something happens to you, the family gets yearly income and the full maturity amount is still paid on time.',
		d_labh: 'A limited-pay savings plan. Pay for fewer years, stay covered for the full term and get a lump sum with bonus at maturity.',
		d_anand: 'An endowment plan with extended life cover — after maturity, the cover continues till old age.',
		d_umang: 'A whole-life plan that pays a guaranteed yearly income after the premium paying term, plus a lump sum at the end.',
		d_utsav: 'A whole-life plan with guaranteed yearly income for life after the premium paying term, plus life cover till age 100.',
		d_utsav_sp: 'A single-premium plan with Guaranteed Additions and guaranteed income options for life.',
		d_single: 'Pay once and stay covered for the full term, with a lump sum and bonus at maturity.',
		d_moneyback: 'A money-back plan: you get part of the Sum Assured at regular intervals and the balance with bonus at maturity.'
	};
	function rfmt(t, k, map) { return String(t(k)).replace(/\{(\w+)\}/g, function (m, n) { return map[n] !== undefined ? map[n] : m; }); }
	function rlEN(k) { return RL[k] !== undefined ? RL[k] : k; }

	// रिपोर्टसाठी लागणारे आकडे एकदाच काढून ठेवायचे
	function reportInfo(r) {
		var p = r.plan, tb = r.table || [], yp = SINGLE[p.type] ? r.inst : r.pr.yearPay;
		var covers = tb.map(function (x) { return x.cover; }).filter(function (v) { return v > 0; });
		var gaYears = r.ga && p.ga_per_1000 ? Math.round(r.ga / (p.ga_per_1000 * r.sa / 1000)) : 0;
		var bonusYears = r.bonus && r.srb ? Math.round(r.bonus / (r.srb * r.sa / 1000)) : 0;
		var pays = [];
		tb.forEach(function (x) { if (x.ret > 0) { pays.push([x.age + 1, x.ret]); } });
		return {
			perDay: yp / 365, ratio: r.totalPrem > 0 ? r.totalBenefit / r.totalPrem : 0,
			coverMin: covers.length ? Math.min.apply(null, covers) : r.sa, coverMax: covers.length ? Math.max.apply(null, covers) : r.sa,
			gaYears: gaYears, bonusYears: bonusYears, pays: pays, matAge: r.age + r.T, incAge: r.survival ? r.age + r.incomeStart : 0,
			coverTo: p.type === 'anand' && p.tail_age ? p.tail_age : r.age + r.T
		};
	}

	// Timeline: वय (x-axis) वर हप्ता, जोखीम-कव्हर आणि मिळणारे पैसे — SVG मध्ये फक्त आकडे (font चा त्रास नको)
	function timelineSvg(r, c1, c2) {
		var I = reportInfo(r), W = 740, H = 176, L = 20, R = 20;
		var a0 = r.age, a1 = Math.max(I.coverTo, I.matAge);
		function x(a) { return L + (W - L - R) * (a - a0) / Math.max(1, a1 - a0); }
		var sv = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" font-family="Arial,sans-serif">';
		var tx = function (xx, y, s, anc, col, sz, w) { return '<text x="' + xx.toFixed(1) + '" y="' + y + '" text-anchor="' + (anc || 'middle') + '" fill="' + (col || '#3b4433') + '" font-size="' + (sz || 11) + '"' + (w ? ' font-weight="700"' : '') + '>' + s + '</text>'; };
		var short = function (v) { return v >= 1e7 ? (v / 1e7).toFixed(2) + ' Cr' : v >= 1e5 ? (v / 1e5).toFixed(2) + ' L' : nf.format(Math.round(v)); };
		// 1) हप्ता
		var pEnd = SINGLE[r.plan.type] ? a0 + 0.6 : a0 + r.P;
		sv += '<rect x="' + x(a0) + '" y="14" width="' + Math.max(8, x(pEnd) - x(a0)) + '" height="22" rx="6" fill="' + c1 + '"/>';
		sv += tx(Math.min(x(pEnd) + 6, W - 150), 30, '₹' + short(SINGLE[r.plan.type] ? r.inst : r.pr.yearPay) + (SINGLE[r.plan.type] ? '' : ' / yr × ' + r.P), 'start', '#3b4433', 11, 1);
		// 2) कव्हर
		sv += '<rect x="' + x(a0) + '" y="56" width="' + (x(I.coverTo) - x(a0)) + '" height="22" rx="6" fill="' + c2 + '" opacity=".35"/>';
		sv += tx((x(a0) + x(I.coverTo)) / 2, 71, '₹' + short(I.coverMin) + (I.coverMax > I.coverMin ? ' – ₹' + short(I.coverMax) : ''), 'middle', '#3b4433', 11, 1);
		// 3) मिळणारे पैसे
		var big = I.pays.length ? Math.max.apply(null, I.pays.map(function (q) { return q[1]; })) : 1;
		I.pays.forEach(function (q) {
			var h = 8 + 34 * Math.sqrt(q[1] / big);
			sv += '<rect x="' + (x(q[0]) - 2.5).toFixed(1) + '" y="' + (138 - h).toFixed(1) + '" width="5" height="' + h.toFixed(1) + '" rx="2" fill="' + c2 + '"/>';
		});
		if (r.maturity > 0) { sv += tx(Math.min(x(I.matAge), W - 60), 92, '₹' + short(r.maturity), x(I.matAge) > W - 80 ? 'end' : 'middle', c1, 12, 1); }
		if (r.survival && r.plan.type !== 'moneyback') { sv += tx(Math.max(x(I.incAge), 40), 92, '₹' + short(r.survival) + ' / yr', 'start', c1, 11, 1); }
		// वयाची पट्टी
		sv += '<line x1="' + L + '" x2="' + (W - R) + '" y1="142" y2="142" stroke="#9aa38f"/>';
		var ticks = [a0, pEnd > a0 + 1 ? a0 + r.P : null, I.incAge || null, I.matAge, I.coverTo !== I.matAge ? I.coverTo : null].filter(function (v, i, arr) { return v !== null && arr.indexOf(v) === i; });
		ticks.forEach(function (a) { sv += '<line x1="' + x(a) + '" x2="' + x(a) + '" y1="138" y2="146" stroke="#6b7362"/>' + tx(Math.min(Math.max(x(a), 14), W - 14), 162, String(a), 'middle', '#5b5f52', 11); });
		return sv + '</svg>';
	}

	// Maturity Details — [label, value] यादी
	function maturityRows(r, t) {
		var p = r.plan, I = reportInfo(r), out = [];
		if (p.type !== 'utsav' && p.type !== 'utsav_sp' && !TERMS[p.type]) { out.push([t('m_sa') + (p.type === 'moneyback' ? ' <small>(' + p.mat_pct + '% × ' + inr(r.sa) + ')</small>' : ''), inr(p.type === 'moneyback' ? p.mat_pct * r.sa / 100 : r.sa)]); }
		if (r.ga) { out.push([t('m_ga') + (I.gaYears ? ' <small>(' + inr(p.ga_per_1000 * r.sa / 1000) + ' × ' + I.gaYears + ')</small>' : ''), inr(r.ga)]); }
		if (r.bonus) { out.push([t('m_srb') + (I.bonusYears ? ' <small>(' + inr(r.srb * r.sa / 1000) + ' × ' + I.bonusYears + ')</small>' : ''), inr(r.bonus)]); }
		if (r.fab) { out.push([t('m_fab'), inr(r.fab)]); }
		if (p.type === 'moneyback') { r.sbList.forEach(function (q) { out.push([t('m_mb') + ' ' + (r.age + q[0]), inr(q[1] * r.sa / 100)]); }); }
		else if (r.survival) {
			out.push([t('m_inc'), inr(r.survival)]);
			out.push([t('m_incage'), String(I.incAge)]);
			out.push([t('m_tsurv'), inr(r.totalSurv)]);
		}
		if (r.maturity > 0) { out.push(['<b>' + t('m_mat') + '</b>', '<b>' + inr(r.maturity) + '</b>']); out.push([t('m_matage'), String(I.matAge)]); }
		else { out.push([t('m_coverto'), String(I.coverTo)]); }
		out.push([t('totpaid'), inr(r.totalPrem)]);
		out.push(['<b>' + t('totret') + '</b>', '<b>' + inr(r.totalBenefit) + '</b>']);
		return out;
	}

	// Benefit & Coverage Table — from..to ओळी (PDF मध्ये पानं पाडायला)
	function benefitTableHtml(r, t, cls, from, to, withTotal) {
		var tb = r.table || [], cv = r.hasCV, adb = tb.some(function (x) { return x.acc !== x.cover; });
		var head = ['c_age', 'c_yr', 'c_prem', 'c_cum', 'c_add', 'c_cumadd', 'c_cover'].concat(adb ? ['c_acc'] : []).concat(cv ? ['c_loan', 'c_cv'] : []).concat(['c_ret']);
		var d = function (v) { return v ? inr(v) : '—'; };
		var body = tb.slice(from || 0, to === undefined ? tb.length : to).map(function (x) {
			return '<tr><td>' + x.age + '</td><td>' + x.y + '</td><td>' + d(x.prem) + '</td><td>' + d(x.cumPrem) + '</td><td>' + d(x.add) + '</td><td>' + d(x.cumAdd) + '</td><td>' + d(x.cover) + '</td>' +
				(adb ? '<td>' + d(x.acc) + '</td>' : '') + (cv ? '<td>' + (x.loan ? inr(x.loan) : '—') + '</td><td>' + (x.cv ? inr(x.cv) : '—') + '</td>' : '') + '<td>' + (x.ret ? '<b>' + inr(x.ret) + '</b>' : '—') + '</td></tr>';
		}).join('');
		if (withTotal) {
			body += '<tr class="tot"><td colspan="2">' + t('totpaid') + '</td><td colspan="' + (head.length - 4) + '">' + inr(r.totalPrem) + '</td><td>' + t('totret') + '</td><td>' + inr(r.totalBenefit) + '</td></tr>';
		}
		return '<table class="' + cls + '"><thead><tr>' + head.map(function (k) { return '<th>' + t(k) + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table>';
	}

	// Option 2 — Flexi income न काढल्यास 5.5% ने जमा
	function flexiRows(r) {
		var out = [], bal = 0;
		(r.table || []).forEach(function (x) {
			var inc = r.survival && x.y >= r.incomeStart && x.y < r.T + (r.plan.type === 'utsav' ? 1 : 0) ? r.survival : 0;
			bal = bal * 1.055 + inc;
			if (inc) { out.push([x.y, x.age, inc, bal]); }
		});
		return out;
	}

	window.A4U_LIC_API = {
		C: C, inr: inr, esc: esc, pct: pct, MODES: MODES, SINGLE: SINGLE, chartSvg: chartSvg, track: track, vendor: vendor, load: getRates, // v4.1: load = tariff + rates
		last: function () { return last; }, cmp: function () { return lastCmp; }, client: function () { return clientInfo(); },
		rr: function () { return lastRR && last && lastRR.r === last ? lastRR : null; }, mix: function () { return mixList.slice(); }, mixIrr: function () { return mixList.length ? mixTotals().irr : null; }, api: api, post: post,
		// golden tests (GitHub Actions) साठी engine थेट वापरता यावा
		compute: compute, planById: planById, resolveTerms: resolveTerms,
		RL: RL, rfmt: rfmt, reportInfo: reportInfo, timelineSvg: timelineSvg, maturityRows: maturityRows, benefitTableHtml: benefitTableHtml, flexiRows: flexiRows
	};

	/* ---------- v3.1: Ready Reckoner ---------- */
	var lastRR = null;
	var ENC = { platinum: 1, term: 1, term_sp: 1 }; // v4.3: terms = PPT×100 + term असलेले plans
	function termShort(p, t) { // तक्त्याच्या शीर्षकासाठी छोटं नाव
		if (!ENC[p.type]) { return String(t); }
		var P = Math.floor(t / 100), T = t % 100;
		return T + (P === T ? '' : ' (pay ' + P + ')');
	}
	function pickTerms(p, n, r) { // जास्तीत जास्त n terms, सगळ्या range मधून
		var t = p.terms.slice();
		if (ENC[p.type] && r) { // त्याच हप्ता-पर्यायाच्या मुदती (उदा. 10 वर्षं भरा → 20, 25, 30…)
			t = t.filter(function (k) { var P = Math.floor(k / 100), T = k % 100; return p.type === 'term' || p.type === 'term_sp' ? ((P === T) === (r.P === r.T) && (P === T || P === r.P)) : P === r.P; });
		}
		if (t.length <= n) { return t; }
		var out = [];
		for (var i = 0; i < n; i++) { out.push(t[Math.round(i * (t.length - 1) / (n - 1))]); }
		return out.filter(function (v, i, a) { return a.indexOf(v) === i; });
	}
	function showReckoner() {
		var r = last, p = r.plan, box = result.querySelector('.a4u-rr-out');
		getRates(p).then(function (rates) {
			var terms = pickTerms(p, 6, r), ages = [];
			for (var a = Math.max(p.min_age, 0); a <= p.max_age; a += 5) { ages.push(a); }
			if (ages.indexOf(r.age) === -1) { ages.push(r.age); ages.sort(function (x, y) { return x - y; }); }
			var single = !!SINGLE[p.type];
			var rows = ages.map(function (age) {
				return [age, terms.map(function (t) {
					var x = compute(p, { age: age, term: t, sa: r.sa, by: 'sa', mode: 'yearly', gst: r.gst, income: 'regular', r: {}, srbO: null, fabO: null, doc: new Date(), gender: r.gender, smoker: r.smoker }, rates);
					return x.errors ? null : (single ? x.inst : x.pr.yearPay);
				})];
			});
			lastRR = { r: r, terms: terms, labels: terms.map(function (t) { return termShort(p, t); }), rows: rows, single: single };
			box.innerHTML = '<h4>Ready Reckoner — ' + esc(p.name) + ' · SA ' + inr(r.sa) + ' · ' + (single ? 'single premium' : 'yearly premium') + '</h4>' +
				'<div class="a4u-scroll"><table class="a4u-rr"><thead><tr><th>Age \\ ' + (BY_PPT[p.type] ? 'PPT' : 'Term') + '</th>' + terms.map(function (t) { return '<th>' + esc(termShort(p, t)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
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
			smoker: f(form, 'smoker') ? f(form, 'smoker').value : 'NS',
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

	// v4.4: monthly निवडलं की NACH टीप
	(function () { var m = f(form, 'mode'), n = root.querySelector('.a4u-nach'); if (!m || !n) { return; } var u = function () { n.hidden = m.value !== 'month'; }; m.addEventListener('change', u); u(); })();
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
