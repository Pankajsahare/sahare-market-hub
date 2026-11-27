/* A4U LIC Hub v4 — plan पानं, charts, tools (educational illustration only) */
(function () {
	'use strict';
	var H = window.A4U_HUB || {};
	var nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
	function inr(n) { var v = Math.round(n || 0); return (v < 0 ? '−' : '') + '₹' + nf.format(Math.abs(v)); }
	function short(n) { // ₹ 12.5 L / ₹ 1.2 Cr — charts वरच्या labels साठी
		var a = Math.abs(n || 0), s = n < 0 ? '−' : '';
		if (a >= 1e7) { return s + '₹' + (a / 1e7).toFixed(a >= 1e8 ? 0 : 1) + ' Cr'; }
		if (a >= 1e5) { return s + '₹' + (a / 1e5).toFixed(a >= 1e6 ? 0 : 1) + ' L'; }
		if (a >= 1e3) { return s + '₹' + (a / 1e3).toFixed(0) + 'k'; }
		return s + '₹' + Math.round(a);
	}
	function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
	function $(s, el) { return (el || document).querySelector(s); }
	function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
	function store(k, v) { try { if (v === undefined) { return localStorage.getItem(k); } localStorage.setItem(k, v); } catch (e) { return null; } return v; }
	function whenApi(cb, n) { // a4u-lic.js engine तयार होईपर्यंत थांबा
		if (window.A4U_LIC_API && window.A4U_LIC_API.compute) { cb(window.A4U_LIC_API); return; }
		if ((n || 0) > 100) { return; }
		setTimeout(function () { whenApi(cb, (n || 0) + 1); }, 100);
	}
	function getJSON(f) { return fetch(H.data + f + '?v=4').then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.json(); }); }

	/* =====================================================================
	 * 1. भाषा (UI शब्द) — English / मराठी / हिंदी
	 * ===================================================================== */
	var T = {
		mr: { hub_h: 'LIC चे सर्व plans — माहिती, फायदे आणि calculator', hub_p: 'Plan निवडा: कोण घेऊ शकतं, काय मिळतं, riders, कर्ज, surrender value, कर आणि proposal form — सगळं एका ठिकाणी. लोकप्रिय plans साठी मोफत premium calculator.', finder_h: 'योग्य plan शोधा', age: 'तुमचं वय', search: 'शोधा', open_only: 'फक्त विक्रीत असलेले plans', details: 'Plan माहिती', calc: 'हिशोब करा', none: 'एकही plan जुळला नाही. Filter काढा किंवा WhatsApp वर विचारा.', calc_prem: 'Premium काढा', wa: 'WhatsApp वर विचारा', card: 'Plan card डाउनलोड', glance: 'एका नजरेत', benefits: 'मुख्य फायदे', best: 'कोणासाठी योग्य:', how: 'Plan कसा चालतो', sample: 'उदाहरण: वय 30, साधारण विमा रक्कम. तुमचे आकडे खालच्या calculator मध्ये पहा.', calc_h: 'Premium आणि फायद्यांचा calculator', quote_h: 'अचूक quote मिळवा', docs: 'साधारण लागणारी कागदपत्रं', faq: 'नेहमीचे प्रश्न', similar: 'मिळतेजुळते LIC plans', lead_h: 'मोफत quote आणि सल्ला', lead_p: 'नाव आणि मोबाइल नंबर द्या. आमचे सल्लागार अचूक LIC quote सह फोन करतील.', name: 'नाव', mobile: 'मोबाइल', consent: 'LIC plans बद्दल फोन / WhatsApp वर संपर्क करायला माझी संमती आहे.', send: 'Call back हवा', sa: 'विमा रक्कम (₹)', term: 'हवी असलेली मुदत (वर्षं)', compare: 'तुलना करा', mode: 'हप्त्याची पद्धत', inst: 'हप्ता (₹)', fup: 'पहिला न भरलेला हप्ता (FUP)', revdate: 'Revival तारीख', bsearch: 'शहर, पिन कोड किंवा शाखा', division: 'विभाग' },
		hi: { hub_h: 'LIC के सभी plans — जानकारी, फायदे और calculator', hub_p: 'Plan चुनें: कौन ले सकता है, क्या मिलता है, riders, लोन, surrender value, टैक्स और proposal form — सब एक जगह। लोकप्रिय plans के लिए मुफ्त premium calculator।', finder_h: 'सही plan खोजें', age: 'आपकी उम्र', search: 'खोजें', open_only: 'केवल बिक्री में उपलब्ध plans', details: 'Plan जानकारी', calc: 'गणना करें', none: 'कोई plan नहीं मिला। Filter हटाएँ या WhatsApp पर पूछें।', calc_prem: 'Premium निकालें', wa: 'WhatsApp पर पूछें', card: 'Plan card डाउनलोड', glance: 'एक नज़र में', benefits: 'मुख्य फायदे', best: 'किसके लिए उपयुक्त:', how: 'Plan कैसे काम करता है', sample: 'उदाहरण: उम्र 30, सामान्य बीमा राशि। अपने आँकड़े नीचे calculator में देखें।', calc_h: 'Premium और फायदों का calculator', quote_h: 'सटीक quote पाएँ', docs: 'आमतौर पर ज़रूरी दस्तावेज़', faq: 'अक्सर पूछे जाने वाले प्रश्न', similar: 'मिलते-जुलते LIC plans', lead_h: 'मुफ्त quote और सलाह', lead_p: 'नाम और मोबाइल नंबर दें। हमारे सलाहकार सटीक LIC quote के साथ कॉल करेंगे।', name: 'नाम', mobile: 'मोबाइल', consent: 'LIC plans के बारे में फोन / WhatsApp पर संपर्क के लिए मेरी सहमति है।', send: 'Call back चाहिए', sa: 'बीमा राशि (₹)', term: 'पसंदीदा अवधि (वर्ष)', compare: 'तुलना करें', mode: 'किस्त का तरीका', inst: 'किस्त (₹)', fup: 'पहली बकाया किस्त (FUP)', revdate: 'Revival तारीख', bsearch: 'शहर, पिन कोड या शाखा', division: 'मंडल' }
	};
	var EN = {};
	function setLang(l) {
		$$('[data-i18n]').forEach(function (el) {
			var k = el.getAttribute('data-i18n');
			if (!(k in EN)) { EN[k] = el.textContent; }
			el.textContent = l !== 'en' && T[l] && T[l][k] ? T[l][k] : EN[k];
		});
		$$('.a4h-langs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-lang') === l); });
		document.documentElement.setAttribute('data-a4h-lang', l);
		store('a4h_lang', l);
	}

	/* =====================================================================
	 * 2. Fixed header खाली headline जाऊ नये
	 * ===================================================================== */
	function fixHeader() {
		var main = $('.a4h-page');
		if (!main) { return; }
		var top = 0;
		$$('header, .elementor-location-header, #masthead, .site-header').forEach(function (el) {
			var cs = getComputedStyle(el), r = el.getBoundingClientRect();
			if ((cs.position === 'fixed' || cs.position === 'sticky') && r.top <= 5 && r.height < 260) { top = Math.max(top, r.bottom); }
		});
		var mr = main.getBoundingClientRect().top + window.scrollY;
		main.style.paddingTop = top > mr ? Math.ceil(top - mr + 16) + 'px' : '';
	}

	/* =====================================================================
	 * 3. Charts (SVG, hover tooltip) — calculator, plan पानं, PDF सगळीकडे एकच
	 * ===================================================================== */
	var COL = { pay: '#0b4ea2', get: '#1f8f4e', cover: '#d9822b', cv: '#7a4bc2', grid: '#e6e9ef', ink: '#1d2433', mute: '#6b7280', mat: '#b8924a' };
	var CW = function () { return (window.innerWidth || 800) < 600 ? 440 : 760; }; // mobile वर अरुंद chart → अक्षरं वाचता येतील
	function niceMax(v) {
		if (!(v > 0)) { return 1; }
		var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p;
		return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
	}
	function ticks(max, n) { var f = max / Math.pow(10, Math.floor(Math.log10(max || 1))); if (n === 4 && (f === 2.5 || f === 5)) { n = 5; } var out = [], st = max / n; for (var i = 0; i <= n; i++) { out.push(st * i); } return out; }

	// A. वर्षवार पैसे: भरलेला हप्ता (खाली, निळा) व मिळालेली रक्कम (वर, हिरवी)
	function cashflowSvg(r) {
		var tb = r.table || [], n = tb.length;
		if (!n || !tb.some(function (x) { return x.ret > 0; })) { return ''; } // काहीच मिळत नसेल (term plan) तर हा chart नको
		var W = CW(), Hh = 300, L = 62, R = 14, Tp = 18, B = 40;
		var maxUp = 0, maxDn = 0;
		tb.forEach(function (x) { maxUp = Math.max(maxUp, x.ret || 0); maxDn = Math.max(maxDn, x.prem || 0); });
		var top = niceMax(maxUp), bot = niceMax(maxDn);
		// maturity खूप मोठा असेल तर वरचा भाग जास्त
		var share = top / (top + bot), plotH = Hh - Tp - B, zero = Tp + plotH * Math.min(0.88, Math.max(0.45, share));
		var bw = (W - L - R) / n, s = '';
		var yU = function (v) { return zero - v / top * (zero - Tp); }, yD = function (v) { return zero + v / bot * (Hh - B - zero); };
		ticks(top, 4).forEach(function (t) { var y = yU(t); s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="' + COL.grid + '"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="ax">' + short(t) + '</text>'; });
		[bot].forEach(function (t) { var y = yD(t); s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="' + COL.grid + '"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="ax">−' + short(t) + '</text>'; });
		tb.forEach(function (x, i) {
			var x0 = L + i * bw + bw * 0.14, w = Math.max(1.5, bw * 0.72);
			var tip = 'Year ' + x.y + ' · age ' + (x.age + 1) + (x.prem ? ' · pay ' + inr(x.prem) : '') + (x.ret ? ' · get ' + inr(x.ret) : '');
			if (x.prem) { s += '<rect x="' + x0 + '" y="' + zero + '" width="' + w + '" height="' + Math.max(1, yD(x.prem) - zero) + '" fill="' + COL.pay + '" rx="2"><title>' + esc(tip) + '</title></rect>'; }
			if (x.ret) { s += '<rect x="' + x0 + '" y="' + yU(x.ret) + '" width="' + w + '" height="' + Math.max(1, zero - yU(x.ret)) + '" fill="' + (x.y === n && r.maturity ? COL.mat : COL.get) + '" rx="2"><title>' + esc(tip) + '</title></rect>'; }
			if (n <= 25 || x.y % 5 === 0 || x.y === 1) { s += '<text x="' + (x0 + w / 2) + '" y="' + (Hh - B + 16) + '" text-anchor="middle" class="ax">' + x.y + '</text>'; }
		});
		var last = tb[n - 1];
		if (r.maturity) { s += '<text x="' + (W - R - 2) + '" y="' + Math.max(12, yU(last.ret) - 6) + '" text-anchor="end" class="lb" fill="' + COL.mat + '">Maturity ' + short(r.maturity) + '</text>'; }
		s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + zero + '" y2="' + zero + '" stroke="' + COL.ink + '" stroke-width="1"/>';
		s += '<text x="' + ((W + L) / 2) + '" y="' + (Hh - 6) + '" text-anchor="middle" class="ax">Policy year</text>';
		return '<svg class="a4c" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Year-wise premium paid and money received">' + s + '</svg>';
	}

	// B. Policy ची किंमत: life cover, surrender value, एकूण भरलेले हप्ते (hover वर आकडे)
	function valueSvg(r) {
		var tb = r.table || [], n = tb.length;
		if (!n) { return ''; }
		var W = CW(), Hh = 300, L = 62, R = 14, Tp = 18, B = 40, max = 0, hasCv = tb.some(function (x) { return x.cv > 0; });
		tb.forEach(function (x) { max = Math.max(max, x.cover || 0, x.cv || 0, x.cumPrem || 0); });
		max = niceMax(max);
		var X = function (i) { return L + (W - L - R) * (n === 1 ? 0.5 : i / (n - 1)); }, Y = function (v) { return Tp + (Hh - Tp - B) * (1 - v / max); };
		var s = '';
		ticks(max, 4).forEach(function (t) { var y = Y(t); s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="' + COL.grid + '"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="ax">' + short(t) + '</text>'; });
		function path(key, step) {
			var d = '', started = false;
			tb.forEach(function (x, i) {
				var v = x[key];
				if (!(v > 0)) { started = false; return; }
				if (!started) { d += 'M' + X(i) + ',' + Y(v); started = true; }
				else if (step) { d += 'H' + X(i) + 'V' + Y(v); } else { d += 'L' + X(i) + ',' + Y(v); }
			});
			return d;
		}
		// भरलेल्या हप्त्यांखालचा भाग (area)
		var area = 'M' + X(0) + ',' + Y(0);
		tb.forEach(function (x, i) { area += 'L' + X(i) + ',' + Y(x.cumPrem || 0); });
		area += 'L' + X(n - 1) + ',' + Y(0) + 'Z';
		s += '<path d="' + area + '" fill="' + COL.pay + '" fill-opacity=".12"/>';
		s += '<path d="' + path('cumPrem') + '" fill="none" stroke="' + COL.pay + '" stroke-width="2" stroke-dasharray="5 4"/>';
		s += '<path d="' + path('cover', true) + '" fill="none" stroke="' + COL.cover + '" stroke-width="2.5"/>';
		if (hasCv) { s += '<path d="' + path('cv') + '" fill="none" stroke="' + COL.cv + '" stroke-width="2.5"/>'; }
		// breakeven: surrender value एकूण हप्त्यांपेक्षा जास्त होतं ते वर्ष
		if (hasCv) {
			for (var i = 0; i < n; i++) {
				if (tb[i].cv > tb[i].cumPrem && tb[i].cumPrem > 0) {
					s += '<circle cx="' + X(i) + '" cy="' + Y(tb[i].cv) + '" r="5" fill="#fff" stroke="' + COL.cv + '" stroke-width="2"/><text x="' + (X(i) > W / 2 ? X(i) - 10 : X(i) + 10) + '" y="' + (Y(tb[i].cv) - 14) + '" text-anchor="' + (X(i) > W / 2 ? 'end' : 'start') + '" class="lb" fill="' + COL.cv + '">Surrender value crosses premiums paid (year ' + tb[i].y + ')</text>';
					break;
				}
			}
		}
		for (var k = 0; k < n; k++) {
			if (n <= 25 || tb[k].y % 5 === 0 || k === 0) { s += '<text x="' + X(k) + '" y="' + (Hh - B + 16) + '" text-anchor="middle" class="ax">' + tb[k].y + '</text>'; }
		}
		s += '<text x="' + ((W + L) / 2) + '" y="' + (Hh - 6) + '" text-anchor="middle" class="ax">Policy year</text>';
		// hover साठी अदृश्य पट्ट्या
		var hw = (W - L - R) / Math.max(1, n - 1);
		tb.forEach(function (x, i) {
			s += '<rect class="hov" x="' + (X(i) - hw / 2) + '" y="' + Tp + '" width="' + hw + '" height="' + (Hh - Tp - B) + '" fill="transparent" data-i="' + i + '"/>';
		});
		s += '<line class="vline" x1="0" x2="0" y1="' + Tp + '" y2="' + (Hh - B) + '" stroke="' + COL.mute + '" stroke-dasharray="3 3" style="display:none"/>';
		return '<div class="a4c-wrap" data-chart="value"><svg class="a4c" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Life cover, surrender value and premiums paid by year">' + s + '</svg><div class="a4c-tip" hidden></div></div>';
	}
	function bindValueTips(box, r) {
		$$('.a4c-wrap[data-chart="value"]', box).forEach(function (w) {
			var svg = $('svg', w), tip = $('.a4c-tip', w), vl = $('.vline', w), tb = r.table;
			$$('.hov', w).forEach(function (h) {
				h.addEventListener('mouseenter', show); h.addEventListener('touchstart', show, { passive: true });
				function show() {
					var i = Number(h.getAttribute('data-i')), x = tb[i], cx = Number(h.getAttribute('x')) + Number(h.getAttribute('width')) / 2;
					vl.setAttribute('x1', cx); vl.setAttribute('x2', cx); vl.style.display = '';
					tip.innerHTML = '<b>Year ' + x.y + ' · age ' + (x.age + 1) + '</b><span><i style="background:' + COL.pay + '"></i>Paid so far ' + inr(x.cumPrem) + '</span><span><i style="background:' + COL.cover + '"></i>Life cover ' + inr(x.cover) + '</span>' + (x.cv ? '<span><i style="background:' + COL.cv + '"></i>Surrender value ' + inr(x.cv) + '</span>' : '') + (x.loan ? '<span>Loan up to ' + inr(x.loan) + '</span>' : '');
					tip.hidden = false;
					var pct = cx / svg.viewBox.baseVal.width;
					tip.style.left = Math.min(Math.max(pct * 100, 12), 78) + '%';
				}
			});
			w.addEventListener('mouseleave', function () { tip.hidden = true; vl.style.display = 'none'; });
		});
	}

	// C. आयुष्याची timeline: वय, हप्ते भरायचा काळ, payouts, maturity
	function lifeTimelineSvg(r) {
		var tb = r.table || [], n = tb.length;
		if (!n) { return ''; }
		var W = CW(), Hh = 170, L = 30, R = 30, y0 = 92;
		var X = function (y) { return L + (W - L - R) * (y / n); };
		var a0 = r.age, s = '';
		s += '<rect x="' + X(0) + '" y="' + (y0 - 9) + '" width="' + (X(r.P) - X(0)) + '" height="18" rx="9" fill="' + COL.pay + '"/>';
		s += '<text x="' + ((X(0) + X(r.P)) / 2) + '" y="' + (y0 + 4) + '" text-anchor="middle" class="in">' + (r.P === 1 ? 'Single premium' : 'Pay premium ' + r.P + ' yrs') + '</text>';
		if (n - r.P >= 1) { s += '<rect x="' + X(r.P) + '" y="' + (y0 - 4) + '" width="' + (X(n) - X(r.P)) + '" height="8" rx="4" fill="' + COL.cover + '" opacity=".55"/>';
			if (X(n) - X(r.P) > 120) { s += '<text x="' + ((X(r.P) + X(n)) / 2) + '" y="' + (y0 + 24) + '" text-anchor="middle" class="ax">Life cover continues</text>'; }
		}
		// payouts
		var pays = tb.filter(function (x) { return x.ret > 0; }), maxRet = Math.max.apply(null, pays.map(function (x) { return x.ret; }).concat([1]));
		var lastLbl = -99, income = r.survival && pays.length > 4;
		pays.forEach(function (x) {
			var cx = X(x.y), rad = 3 + 11 * Math.sqrt(x.ret / maxRet), isMat = x.y === n && r.maturity;
			s += '<circle cx="' + cx + '" cy="' + (y0 - 34) + '" r="' + rad.toFixed(1) + '" fill="' + (isMat ? COL.mat : COL.get) + '" opacity=".9"><title>Year ' + x.y + ' (age ' + (a0 + x.y) + '): ' + inr(x.ret) + '</title></circle>';
			if (isMat || (!income && cx - lastLbl > 70)) {
				s += '<text x="' + cx + '" y="' + (y0 - 52 - rad) + '" text-anchor="middle" class="lb" fill="' + (isMat ? COL.mat : COL.get) + '">' + short(x.ret) + '</text>';
				lastLbl = cx;
			}
		});
		if (income) {
			var f = pays[0];
			s += '<text x="' + X(f.y) + '" y="' + (y0 - 60) + '" class="lb" fill="' + COL.get + '">' + short(f.ret) + ' every year from age ' + (a0 + f.y) + '</text>';
		}
		// वय markers
		var marks = [0, r.P, n], step = n > 40 ? 10 : 5;
		for (var y = step; y < n; y += step) { marks.push(y); }
		marks = marks.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
		var lastX = -99;
		marks.forEach(function (y) {
			var cx = X(y);
			if (cx - lastX < 34 && y !== n) { return; }
			s += '<line x1="' + cx + '" x2="' + cx + '" y1="' + (y0 + 34) + '" y2="' + (y0 + 40) + '" stroke="' + COL.mute + '"/><text x="' + cx + '" y="' + (y0 + 54) + '" text-anchor="middle" class="ax">' + (a0 + y) + '</text>';
			lastX = cx;
		});
		s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (y0 + 37) + '" y2="' + (y0 + 37) + '" stroke="' + COL.grid + '" stroke-width="2"/>';
		s += '<text x="' + L + '" y="' + (Hh - 2) + '" class="ax">Age →</text>';
		return '<svg class="a4c" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Policy timeline by age">' + s + '</svg>';
	}

	// D. Maturity कशी बनते (waterfall)
	function buildupSvg(r) {
		var parts = [];
		var p = r.plan || {};
		if (r.totalSurv) { parts.push(['Income / money back', r.totalSurv, COL.get]); }
		if (p.type === 'moneyback') { parts.push(['Maturity (part of SA)', (p.mat_pct || 0) * r.sa / 100, COL.pay]); }
		else if (r.maturity && p.type !== 'utsav_sp') { parts.push(['Sum Assured', r.sa, COL.pay]); }
		else if (p.type === 'utsav_sp') { parts.push(['Maturity at 100', r.maturity, COL.pay]); }
		if (r.ga && p.type !== 'utsav_sp' && p.type !== 'utsav') { parts.push(['Guaranteed additions', r.ga, '#0f7c8c']); }
		if (r.bonus) { parts.push(['Bonus (est.)', r.bonus, COL.cv]); }
		if (r.fab) { parts.push(['Final bonus (est.)', r.fab, '#b5179e']); }
		var total = parts.reduce(function (a, x) { return a + x[1]; }, 0);
		if (!(total > 0) || parts.length < 2) { return ''; }
		var W = CW(), Hh = 260, L = 16, R = 16, Tp = 26, B = 46, cols = parts.length + 2;
		var bw = (W - L - R) / cols, max = niceMax(Math.max(total, r.totalPrem)), Y = function (v) { return Tp + (Hh - Tp - B) * (1 - v / max); };
		var s = '', acc = 0;
		function bar(i, from, to, fill, label, val) {
			var x = L + i * bw + bw * 0.15, w = bw * 0.7;
			s += '<rect x="' + x + '" y="' + Y(to) + '" width="' + w + '" height="' + Math.max(1, Y(from) - Y(to)) + '" fill="' + fill + '" rx="3"/>';
			s += '<text x="' + (x + w / 2) + '" y="' + (Y(to) - 6) + '" text-anchor="middle" class="lb" fill="' + COL.ink + '">' + short(val) + '</text>';
			s += '<foreignObject x="' + (x - 6) + '" y="' + (Hh - B + 4) + '" width="' + (w + 12) + '" height="40"><div xmlns="http://www.w3.org/1999/xhtml" class="a4c-xl">' + esc(label) + '</div></foreignObject>';
		}
		bar(0, 0, r.totalPrem, '#9aa8c0', 'You pay', r.totalPrem);
		parts.forEach(function (x, i) {
			bar(i + 1, acc, acc + x[1], x[2], x[0], x[1]);
			if (i < parts.length - 1) { var xx = L + (i + 1) * bw + bw * 0.85; s += '<line x1="' + xx + '" x2="' + (xx + bw * 0.3) + '" y1="' + Y(acc + x[1]) + '" y2="' + Y(acc + x[1]) + '" stroke="' + COL.mute + '" stroke-dasharray="3 3"/>'; }
			acc += x[1];
		});
		bar(cols - 1, 0, total, COL.mat, 'You get', total);
		s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="' + COL.ink + '"/>';
		return '<svg class="a4c" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="How the total benefit is built up">' + s + '</svg>';
	}

	function legend(items) { return '<p class="a4c-leg">' + items.map(function (x) { return '<span><i style="background:' + x[1] + '"></i>' + esc(x[0]) + '</span>'; }).join('') + '</p>'; }

	function chartsHtml(r) {
		var hasCv = (r.table || []).some(function (x) { return x.cv > 0; });
		var bu = buildupSvg(r), cf = cashflowSvg(r);
		return '<div class="a4c-set">' +
			'<figure><figcaption>Your policy at a glance <small>(age on the scale)</small></figcaption>' + lifeTimelineSvg(r) + legend([['Premium paying years', COL.pay], ['Life cover', COL.cover], ['Money you receive', COL.get], ['Maturity', COL.mat]]) + '</figure>' +
			(cf ? '<figure><figcaption>Money in and money out, year by year</figcaption>' + cf + legend([['Premium you pay', COL.pay], ['Money you receive', COL.get], ['Maturity', COL.mat]]) + '</figure>' : '') +
			'<figure><figcaption>What your policy is worth each year <small>(hover or tap for figures)</small></figcaption>' + valueSvg(r) + legend([['Premiums paid so far', COL.pay], ['Life cover', COL.cover]].concat(hasCv ? [['Surrender value (estimate)', COL.cv]] : [])) + '</figure>' +
			(bu ? '<figure><figcaption>How the total benefit adds up</figcaption>' + bu + '<p class="a4c-note">Bonus figures are estimates at current rates and are not guaranteed.</p></figure>' : '') +
			'</div>';
	}
	function renderCharts(box, r) {
		if (!box || !r || !r.table) { return; }
		box.innerHTML = chartsHtml(r);
		bindValueTips(box, r);
	}
	// S1: PDF साठी — स्वतंत्र SVG (xmlns + आतली style), नेहमी desktop रुंदी
	var PDF_CSS = '<style>.ax{font:11px Arial,sans-serif;fill:#6b7280}.lb{font:700 12px Arial,sans-serif;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}.in{font:700 12px Arial,sans-serif;fill:#fff}</style>';
	function standalone(fn, r) {
		var save = CW;
		CW = function () { return 760; };
		var svg = '';
		try { svg = fn(r) || ''; } finally { CW = save; }
		var m = svg.match(/<svg[\s\S]*<\/svg>/);
		if (!m) { return ''; }
		return m[0].replace(/<foreignObject[\s\S]*?<\/foreignObject>/g, '').replace(/<rect class="hov"[^>]*\/>/g, '').replace(/<svg ([^>]*?)viewBox="0 0 (\d+) (\d+)"/, '<svg xmlns="http://www.w3.org/2000/svg" width="$2" height="$3" $1viewBox="0 0 $2 $3"').replace(/(<svg[^>]*>)/, '$1' + PDF_CSS);
	}
	window.A4U_CHARTS = { html: chartsHtml, render: renderCharts, cashflow: cashflowSvg, value: valueSvg, timeline: lifeTimelineSvg, buildup: buildupSvg,
		pdf: { timeline: function (r) { return standalone(lifeTimelineSvg, r); }, cashflow: function (r) { return standalone(cashflowSvg, r); }, value: function (r) { return standalone(valueSvg, r); } } };

	// calculator चा निकाल आला की charts
	document.addEventListener('a4u-lic-result', function (e) {
		var box = $('.a4u-v4charts');
		if (box) { renderCharts(box, e.detail); }
	});

	/* =====================================================================
	 * 4. नमुना illustration (plan पान, bonus पान, compare)
	 * ===================================================================== */
	function inp(age, term, sa) { return { age: age, term: term, sa: sa, by: 'sa', mode: 'yearly', gst: 0, income: 'regular', r: {}, srbO: null, fabO: null, doc: new Date(), gender: 'M' }; }
	function nearest(list, want) { var b = list[0]; list.forEach(function (t) { if (Math.abs(t - want) < Math.abs(b - want)) { b = t; } }); return b; }
	function roundSA(p, want) {
		var sa = Math.max(p.min_sa || 0, want), sl = null;
		(p.sa_slabs || []).forEach(function (x) { if (sa >= x[0]) { sl = x; } });
		if (sl) { sa = Math.max(sl[0], Math.round(sa / sl[1]) * sl[1]); if (sa % sl[1]) { sa = Math.ceil(sa / sl[1]) * sl[1]; } }
		return sa;
	}
	function sampleFor(A, p, age, sa, term) {
		var terms = (p.terms || []).slice();
		if (!terms.length) { return null; }
		var want = term || (p.type === 'single' ? 15 : 20);
		var tv = function (t) { // 770: term ≈ want, PPT 10 जवळ; 894: नियमित हप्ता आधी
			if (p.type === 'platinum') { return t % 100 + Math.abs(Math.floor(t / 100) - 10) / 100; }
			if (p.type === 'term') { return t % 100 + (Math.floor(t / 100) === t % 100 ? 0 : 0.5); }
			return t;
		};
		var order = terms.slice().sort(function (a, b) { return Math.abs(tv(a) - want) - Math.abs(tv(b) - want); });
		for (var i = 0; i < order.length; i++) {
			var a = Math.min(Math.max(age, p.min_age), p.max_age);
			var r = A.compute(p, inp(a, order[i], roundSA(p, sa)), {});
			if (!r.errors) { return r; }
		}
		return null;
	}
	function planSample() {
		var box = $('[data-sample]');
		if (!box) { return; }
		whenApi(function (A) {
			var p = A.planById(box.getAttribute('data-sample'));
			if (!p) { return; }
			(A.load ? A.load(p) : Promise.resolve()).then(function () {
			var r = sampleFor(A, p, 30, p.type === 'single' || p.type === 'utsav_sp' ? 500000 : 1000000);
			if (!r) { box.innerHTML = '<p class="a4h-note">Use the calculator below to see the illustration.</p>'; return; }
			box.innerHTML = '<div class="a4h-kpis"><div><span>Yearly premium</span><b>' + inr(r.pr.yearPay) + '</b></div><div><span>Total premium</span><b>' + inr(r.totalPrem) + '</b></div>' + (p.type === 'term' ? '<div><span>Life cover</span><b>' + inr(Math.max(r.deathSA || 0, r.sa)) + '</b></div><div><span>Cover till age</span><b>' + (r.age + r.T) + '</b></div>' : '<div><span>Total benefit (est.)</span><b>' + inr(r.totalBenefit) + '</b></div><div><span>Return (IRR)</span><b>' + (r.irr === null ? '—' : (r.irr * 100).toFixed(2) + '%') + '</b></div>') + '</div>' +
				'<p class="a4h-sub">Age ' + r.age + ' · Sum Assured ' + inr(r.sa) + ' · Term ' + r.T + ' yrs · Premium for ' + (r.P === 1 ? 'one time' : r.P + ' yrs') + '</p>' + chartsHtml(r);
			bindValueTips(box, r);
			});
		});
	}
	function bonusSample() {
		var box = $('[data-bonus]');
		if (!box) { return; }
		whenApi(function (A) {
			var p = A.planById(box.getAttribute('data-bonus'));
			if (!p) { return; }
			(A.load ? A.load(p) : Promise.resolve()).then(function () {
				var r = sampleFor(A, p, 30, 1000000, 21);
				if (r) { box.innerHTML = '<p class="a4h-sub">' + esc(p.name) + ', age ' + r.age + ', Sum Assured ' + inr(r.sa) + ', term ' + r.T + ' years.</p>' + buildupSvg(r); }
			});
		});
	}

	/* =====================================================================
	 * 5. Hub: plan finder filters
	 * ===================================================================== */
	function hubFilters() {
		var grid = $('.a4h-grid');
		if (!grid) { return; }
		var cat = '', age = $('#a4h-age'), q = $('#a4h-q'), open = $('#a4h-open'), cnt = $('.a4h-count'), none = $('.a4h-none');
		function run() {
			var a = age.value === '' ? null : Number(age.value), s = (q.value || '').toLowerCase().trim(), n = 0;
			$$('.a4h-card', grid).forEach(function (c) {
				var ok = (!cat || c.getAttribute('data-cat') === cat) && (!open.checked || c.getAttribute('data-status') !== 'closed') &&
					(a === null || (a >= Number(c.getAttribute('data-min')) && a <= Number(c.getAttribute('data-max')))) && (!s || c.getAttribute('data-q').indexOf(s) >= 0);
				c.hidden = !ok;
				if (ok) { n++; }
			});
			cnt.textContent = n + ' plan' + (n === 1 ? '' : 's') + (a !== null ? ' for age ' + a : '');
			none.hidden = n > 0;
		}
		$$('.a4h-chips button').forEach(function (b) {
			b.addEventListener('click', function () { cat = b.getAttribute('data-cat'); $$('.a4h-chips button').forEach(function (x) { x.classList.toggle('on', x === b); }); run(); });
		});
		[age, q, open].forEach(function (el) { el.addEventListener('input', run); el.addEventListener('change', run); });
		run();
	}

	/* =====================================================================
	 * 6. Lead form
	 * ===================================================================== */
	function leadForms() {
		$$('.a4h-leadform').forEach(function (f) {
			f.addEventListener('submit', function (e) {
				e.preventDefault();
				var msg = $('.a4h-msg', f), fd = new FormData(f), body = {};
				fd.forEach(function (v, k) { body[k] = v; });
				body.consent = f.consent.checked ? 1 : 0;
				body.page = location.href.split('#')[0];
				if (!body.consent || !/^[6-9]\d{9}$/.test(String(body.mobile).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''))) { msg.textContent = 'Please enter a valid 10-digit mobile number and tick the consent box.'; return; }
				var btn = $('button', f);
				btn.disabled = true; msg.textContent = 'Sending…';
				fetch(H.rest + 'lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
					.then(function (r) { return r.json(); })
					.then(function (j) { msg.textContent = j.message || (j.ok ? 'Thank you!' : 'Please try again.'); if (j.ok) { f.reset(); } })
					.catch(function () { msg.textContent = 'Could not send. Please contact us on WhatsApp.'; })
					.then(function () { btn.disabled = false; });
			});
		});
	}

	/* =====================================================================
	 * 7. तुलना
	 * ===================================================================== */
	function compareTool() {
		var go = $('#a4h-cgo');
		if (!go) { return; }
		var sels = $$('.a4h-cp'), q = new URLSearchParams(location.search), pre = (q.get('plans') || '').split(',').filter(Boolean);
		sels.forEach(function (s, i) { var v = pre[i] || s.getAttribute('data-def'); if (v && s.querySelector('option[value="' + v + '"]')) { s.value = v; } });
		function run() {
			whenApi(function (A) {
				var age = Number($('#a4h-cage').value) || 30, sa = Number($('#a4h-csa').value) || 1000000, term = Number($('#a4h-cterm').value) || 20, out = [];
				var chosen = sels.map(function (s) { return s.value && A.planById(s.value); }).filter(Boolean);
				Promise.all(chosen.map(function (p) { return A.load ? A.load(p) : null; })).then(function () {
				sels.forEach(function (s) {
					if (!s.value) { return; }
					var p = A.planById(s.value), r = p && sampleFor(A, p, age, sa, term);
					out.push([p, r]);
				});
				var box = $('.a4h-cout');
				if (!out.length) { box.innerHTML = '<p class="a4h-note">Choose at least one plan.</p>'; return; }
				var ok = out.filter(function (x) { return x[1]; });
				var rowsDef = [
					['Policy term / premium term', function (r) { return r.T + ' / ' + (r.P === 1 ? 'single' : r.P) + ' yrs'; }],
					['Sum Assured', function (r) { return inr(r.sa); }],
					['Yearly premium', function (r) { return inr(r.pr.yearPay); }],
					['Total premium', function (r) { return inr(r.totalPrem); }],
					['Guaranteed part of benefit', function (r) { return inr(r.totalBenefit - (r.bonus || 0) - (r.fab || 0)); }],
					['Total benefit (est.)', function (r) { return inr(r.totalBenefit); }],
					['Return (IRR)', function (r) { return r.irr === null ? '—' : (r.irr * 100).toFixed(2) + '%'; }],
					['Life cover (approx.)', function (r) { return inr(Math.max(r.deathSA || 0, r.sa)); }],
					['Surrender value after 5 years', function (r) { var x = r.table[4]; return x && x.cv ? inr(x.cv) : '—'; }]
				];
				var h = '<div class="a4h-scroll"><table class="a4h-table a4h-ctable"><thead><tr><th></th>' + out.map(function (x) { return '<th>' + esc(x[0] ? x[0].name : '') + '</th>'; }).join('') + '</tr></thead><tbody>';
				rowsDef.forEach(function (d) { h += '<tr><th>' + d[0] + '</th>' + out.map(function (x) { return '<td>' + (x[1] ? d[1](x[1]) : '<small>Not available for this age</small>') + '</td>'; }).join('') + '</tr>'; });
				h += '</tbody></table></div>';
				// तुलना chart: total premium vs total benefit
				if (ok.length) {
					var max = niceMax(Math.max.apply(null, ok.map(function (x) { return Math.max(x[1].totalBenefit, x[1].totalPrem); }))), W = 760, Hh = 60 + ok.length * 70, L = 170, s = '';
					ok.forEach(function (x, i) {
						var r = x[1], y = 24 + i * 70, wP = (W - L - 80) * r.totalPrem / max, wB = (W - L - 80) * r.totalBenefit / max;
						s += '<text x="' + (L - 10) + '" y="' + (y + 22) + '" text-anchor="end" class="lb" fill="' + COL.ink + '">' + esc(x[0].name) + '</text>';
						s += '<rect x="' + L + '" y="' + y + '" width="' + wP + '" height="18" rx="3" fill="' + COL.pay + '"/><text x="' + (L + wP + 6) + '" y="' + (y + 13) + '" class="ax">' + short(r.totalPrem) + ' paid</text>';
						s += '<rect x="' + L + '" y="' + (y + 24) + '" width="' + wB + '" height="18" rx="3" fill="' + COL.get + '"/><text x="' + (L + wB + 6) + '" y="' + (y + 37) + '" class="ax">' + short(r.totalBenefit) + ' received</text>';
					});
					h += '<figure><figcaption>Total premium vs total benefit</figcaption><svg class="a4c" viewBox="0 0 ' + W + ' ' + Hh + '">' + s + '</svg></figure>';
				}
				box.innerHTML = h;
				history.replaceState(null, '', location.pathname + '?plans=' + sels.map(function (s) { return s.value; }).filter(Boolean).join(','));
				});
			});
		}
		go.addEventListener('click', run);
		run();
	}

	/* =====================================================================
	 * 8. Revival calculator
	 * ===================================================================== */
	function revivalTool() {
		var go = $('#a4h-rgo');
		if (!go) { return; }
		var d = $('#a4h-rdate'), today = new Date();
		d.value = today.toISOString().slice(0, 10);
		var tools = null;
		go.addEventListener('click', function () {
			var out = $('.a4h-rout');
			var run = function () {
				var mode = $('#a4h-rmode').value, prem = Number($('#a4h-rprem').value), fup = new Date($('#a4h-rfup').value), rd = new Date(d.value);
				if (!(prem > 0) || isNaN(fup) || isNaN(rd) || rd < fup) { out.innerHTML = '<p class="a4h-warn">Enter the instalment premium, the first unpaid due date and a revival date after it.</p>'; return; }
				var gap = { yearly: 12, half: 6, quarter: 3, month: 1 }[mode], col = { yearly: 0, half: 1, quarter: 2, month: 3 }[mode];
				var months = (rd.getFullYear() - fup.getFullYear()) * 12 + rd.getMonth() - fup.getMonth() - (rd.getDate() < fup.getDate() ? 1 : 0);
				var n = Math.floor(months / gap) + 1;
				if (months >= 60) { out.innerHTML = '<p class="a4h-warn">More than 5 years have passed since the first unpaid premium. Revival may not be allowed under most plans — please contact your LIC branch or us.</p>'; return; }
				var row = tools.revival.rows[String(n)], f = row ? row[col] : null;
				if (!f) { out.innerHTML = '<p class="a4h-warn">This combination is outside LIC\'s revival table. Please contact us for the exact amount.</p>'; return; }
				var total = prem * f, basic = prem * n;
				out.innerHTML = '<div class="a4h-kpis"><div><span>Instalments due</span><b>' + n + '</b></div><div><span>Premium due</span><b>' + inr(basic) + '</b></div><div><span>Interest (approx.)</span><b>' + inr(total - basic) + '</b></div><div class="hl"><span>Approx. revival amount</span><b>' + inr(total) + '</b></div></div>' +
					'<p class="a4h-sub">Lapsed for about ' + months + ' month' + (months === 1 ? '' : 's') + '. GST, late fee or medical charges, if any, are extra. The next instalment falls due as per your policy schedule.</p>';
			};
			if (tools) { run(); return; }
			out.textContent = 'Loading…';
			getJSON('lic-tools.json').then(function (j) { tools = j; run(); }).catch(function () { out.innerHTML = '<p class="a4h-warn">Could not load revival rates. Please try again.</p>'; });
		});
	}

	/* =====================================================================
	 * 9. Branch locator
	 * ===================================================================== */
	function branchTool() {
		var q = $('#a4h-bq');
		if (!q) { return; }
		var dsel = $('#a4h-bdo'), cnt = $('.a4h-branch .a4h-count'), list = $('.a4h-blist'), seq = 0, first = true;
		function card(r) {
			var addr = r[3] + (r[4] ? ' — ' + r[4] : '');
			return '<article class="a4h-bcard"><b>' + esc(r[1]) + '</b> <small>' + esc(r[2]) + ' · Code ' + esc(r[0]) + '</small><p>' + esc(addr) + '</p><small>Division: ' + esc(r[6]) + '</small> <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('LIC ' + r[1] + ' ' + addr) + '">Map ↗</a></article>';
		}
		function run() { // v4.1 (S3): server वर शोध — फक्त जुळलेल्या नोंदी येतात
			var my = ++seq, s = (q.value || '').trim(), dv = dsel.value;
			fetch(H.rest + 'branches?q=' + encodeURIComponent(s) + '&do=' + encodeURIComponent(dv))
				.then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.json(); })
				.then(function (j) {
					if (my !== seq) { return; }
					if (first) {
						first = false;
						(j.divisions || []).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = k; dsel.appendChild(o); });
					}
					if (!s && !dv) { cnt.textContent = j.total + ' LIC offices. Type a city, PIN code or branch name.'; list.innerHTML = ''; return; }
					cnt.textContent = j.more ? 'Showing first 60 matches — type more to narrow down.' : j.rows.length + ' match' + (j.rows.length === 1 ? '' : 'es');
					list.innerHTML = j.rows.map(card).join('');
				})
				.catch(function () { if (my === seq) { cnt.textContent = 'Could not load the branch list. Please try again.'; } });
		}
		var t;
		q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 250); });
		dsel.addEventListener('change', run);
		run();
	}

	/* =====================================================================
	 * 10. Plan card PDF (1 पान, branding सह)
	 * ===================================================================== */
	function loadScript(src) {
		return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
	}
	function planCard() {
		var b = $('#a4h-card-pdf');
		if (!b) { return; }
		b.addEventListener('click', function () {
			b.disabled = true;
			var old = b.textContent;
			b.textContent = 'Preparing…';
			Promise.all([window.html2canvas ? 1 : loadScript(H.vendor + 'html2canvas.min.js'), window.jspdf ? 1 : loadScript(H.vendor + 'jspdf.umd.min.js')]).then(function () {
				var br = H.brand || {}, hero = $('.a4h-plan'), facts = $('.a4h-facts'), ben = $('.a4h-ticks'), viz = $('[data-sample] .a4c-set figure');
				var el = document.createElement('div');
				el.className = 'a4h-cardpdf';
				el.innerHTML = '<div class="hd"><img src="' + esc(br.logo) + '" alt="" crossorigin="anonymous"><div><b>' + esc(br.name) + '</b><small>' + esc([br.agent, br.code ? 'Agency code ' + br.code : '', br.phone].filter(Boolean).join(' · ')) + '</small></div></div>' +
					'<h1>' + esc(H.planName) + '</h1><p class="tg">' + esc($('.a4h-lede', hero).textContent) + '</p>' +
					'<div class="cols"><div><h2>At a glance</h2>' + (facts ? facts.outerHTML : '') + '</div><div><h2>Key benefits</h2>' + (ben ? ben.outerHTML : '') + '</div></div>' +
					(viz ? '<div class="viz">' + viz.outerHTML + '</div>' : '') +
					'<p class="ft">For information only. Not an official LIC document. Final terms as per LIC policy document. ' + esc(br.web || '') + '</p>';
				document.body.appendChild(el);
				return window.html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(function (cv) {
					var pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' }), W = pdf.internal.pageSize.getWidth(), Hp = pdf.internal.pageSize.getHeight();
					var w = W - 40, h = cv.height * w / cv.width;
					if (h > Hp - 40) { h = Hp - 40; w = cv.width * h / cv.height; }
					pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', (W - w) / 2, 20, w, h);
					pdf.save((H.planName || 'LIC-plan').replace(/[^A-Za-z0-9]+/g, '-') + '-plan-card.pdf');
					el.remove();
				});
			}).then(function () { b.disabled = false; b.textContent = old; }).catch(function () { b.disabled = false; b.textContent = 'Could not create PDF — try again'; });
		});
	}

	/* =====================================================================
	 * Start
	 * ===================================================================== */
	function start() {
		$$('.a4h-langs button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); }); });
		var l = store('a4h_lang');
		if (l && l !== 'en') { setLang(l); }
		fixHeader();
		window.addEventListener('resize', fixHeader);
		setTimeout(fixHeader, 800);
		hubFilters(); leadForms(); planSample(); bonusSample(); compareTool(); revivalTool(); branchTool(); planCard();
	}
	if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();
