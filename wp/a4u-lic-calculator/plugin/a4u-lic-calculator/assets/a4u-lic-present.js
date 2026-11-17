/* A4U LIC Calculator v3.1 — branded presentation + PDF (lazy-loaded) */
(function () {
	'use strict';
	var A = window.A4U_LIC_API;
	if (!A) { return; }
	var C = A.C, inr = A.inr, esc = A.esc, pct = A.pct, MODES = A.MODES, SINGLE = A.SINGLE, chartSvg = A.chartSvg, track = A.track, vendor = A.vendor;
	var last = null, lastCmp = null;

	/* ---------- v2.0: Branded presentation + PDF ---------- */
	var BR = C.brand || {};
	var GOLD = BR.gold || '#B8924A', GREEN = BR.green || '#3F5A22';
	var lang = 'en', clientName = '';
	var I18N = {
		en: {
			ill: 'Benefit Illustration', pfor: 'Prepared for', pon: 'Prepared on', pby: 'Presented by', details: 'Your plan details',
			age: 'Age', sa: 'Basic Sum Assured', term: 'Policy term', ppt: 'Premium paying term', gap: 'Guaranteed Addition period', mode: 'Payment mode', yrs: 'years', once: 'Single premium',
			glance: 'Plan at a glance', inst: 'Installment', tprem: 'Total premium payable', tben: 'Estimated total benefits', irr: 'Return (IRR, approx.)',
			bymode: 'Premium by payment mode', ytot: 'Yearly total', pdet: 'Premium details', tab: 'Tabular premium', hsa: 'High Sum Assured rebate', rider: 'Riders', gst: 'GST',
			ben: 'Benefits', g: 'Guaranteed', ng: 'Non-guaranteed', bsa: 'Basic Sum Assured on maturity', surv: 'Survival / income benefit', ga: 'Guaranteed Additions',
			srb: 'Simple Reversionary Bonus (est.)', fab: 'Final Additional Bonus (est.)', death: 'Sum Assured on death (approx.)', matage: 'Maturity at age', cover: 'Life cover till age',
			scen: 'Bonus scenarios', sc1: 'At current bonus rates', sc2: 'If bonus is 50% lower', chart: 'Premium paid vs benefits received', paid: 'Total premium paid', got: 'Total benefits received',
			insight: 'You pay {p} and are estimated to receive {b} — about {x} times your premium.',
			yw: 'Year-wise cash flow', yr: 'Year', prem: 'Premium', bene: 'Benefit', net: 'Net (cumulative)', cmp: 'Plan comparison', notes: 'Important notes',
			contact: 'Talk to your advisor', scan: 'Scan to chat on WhatsApp', page: 'Page', of: 'of', est: 'Premium estimated from LIC published sample premiums.',
			d1: 'This is an illustration for understanding only and is not a policy contract. The final premium and benefits will be as per LIC\'s quotation and benefit illustration at the time of proposal.',
			d2: 'Bonuses are not guaranteed. LIC declares bonus rates every year based on its experience; the figures above assume the bonus rates shown.',
			d3: 'Please read the LIC sales brochure (Plan {no}, UIN {uin}) carefully before concluding a sale.',
			d4: 'Tax benefits, if any, are as per prevailing tax laws and may change.',
			doc: 'Date of commencement', matdate: 'Maturity / last payout date', gender: 'Gender', bonusas: 'Bonus assumed (per ₹1000 SA)',
			pv: 'Total benefits in today\'s money', pvnote: 'at {i}% yearly inflation', tax: 'Tax points to note',
			solicit: 'Insurance is the subject matter of solicitation.',
			rr: 'Ready Reckoner', rrsub: 'Premium for Sum Assured {sa} by entry age and term', rryr: 'yearly premium', rrsp: 'single premium', rrnote: '— means not allowed for that age and term.',
			mix: 'Suggested product mix', mixtot: 'Combined', first: 'First-year premium', mixirr: 'Combined return (IRR, approx.)', illid: 'Illustration ID'
		},
		mr: {
			ill: 'लाभांचे उदाहरण (Benefit Illustration)', pfor: 'यांच्यासाठी', pon: 'दिनांक', pby: 'सादरकर्ते', details: 'तुमच्या योजनेचा तपशील',
			age: 'वय', sa: 'मूळ विमा रक्कम', term: 'पॉलिसी मुदत', ppt: 'हप्ता भरण्याची मुदत', gap: 'हमी वाढ (GA) कालावधी', mode: 'हप्त्याचा प्रकार', yrs: 'वर्षे', once: 'एकरकमी हप्ता',
			glance: 'योजना एका नजरेत', inst: 'हप्ता', tprem: 'एकूण भरायचा हप्ता', tben: 'अंदाजे एकूण लाभ', irr: 'परतावा (IRR, अंदाजे)',
			bymode: 'हप्त्याच्या प्रकारानुसार रक्कम', ytot: 'वर्षाची एकूण रक्कम', pdet: 'हप्त्याचा तपशील', tab: 'मूळ (tabular) हप्ता', hsa: 'जास्त विमा रकमेवरील सूट', rider: 'रायडर', gst: 'GST',
			ben: 'लाभ', g: 'हमी असलेले', ng: 'हमी नसलेले', bsa: 'मुदतपूर्तीला मूळ विमा रक्कम', surv: 'हयातीचा / उत्पन्न लाभ', ga: 'हमी वाढ (Guaranteed Additions)',
			srb: 'साधा बोनस (अंदाजे)', fab: 'अंतिम अतिरिक्त बोनस (अंदाजे)', death: 'मृत्यू झाल्यास विमा रक्कम (अंदाजे)', matage: 'मुदतपूर्ती वय', cover: 'विमा संरक्षण या वयापर्यंत',
			scen: 'बोनसच्या दोन परिस्थिती', sc1: 'सध्याच्या बोनस दराने', sc2: 'बोनस 50% कमी झाल्यास', chart: 'भरलेला हप्ता विरुद्ध मिळालेला लाभ', paid: 'एकूण भरलेला हप्ता', got: 'एकूण मिळालेला लाभ',
			insight: 'तुम्ही {p} भरता आणि अंदाजे {b} मिळतात — म्हणजे हप्त्याच्या साधारण {x} पट.',
			yw: 'वर्षवार रोख प्रवाह', yr: 'वर्ष', prem: 'हप्ता', bene: 'लाभ', net: 'निव्वळ (एकूण)', cmp: 'योजनांची तुलना', notes: 'महत्त्वाच्या सूचना',
			contact: 'तुमच्या सल्लागाराशी बोला', scan: 'WhatsApp वर बोलण्यासाठी scan करा', page: 'पान', of: 'पैकी', est: 'हप्ता LIC ने प्रसिद्ध केलेल्या नमुना हप्त्यांवरून अंदाजे काढला आहे.',
			d1: 'हे फक्त समजण्यासाठी दिलेले उदाहरण आहे, पॉलिसीचा करार नाही. अंतिम हप्ता व लाभ प्रस्तावाच्या वेळी LIC च्या quotation आणि benefit illustration नुसार असतील.',
			d2: 'बोनसची हमी नाही. LIC दरवर्षी आपल्या अनुभवानुसार बोनस दर जाहीर करते; वरील आकडे दाखवलेल्या बोनस दरांवर आधारित आहेत.',
			d3: 'विक्रीपूर्वी LIC चे sales brochure (Plan {no}, UIN {uin}) काळजीपूर्वक वाचा.',
			d4: 'कर सवलती (असल्यास) सध्याच्या कर कायद्यानुसार आहेत आणि बदलू शकतात.',
			doc: 'पॉलिसी सुरू होण्याची तारीख', matdate: 'मुदतपूर्ती / शेवटच्या लाभाची तारीख', gender: 'लिंग', bonusas: 'गृहीत बोनस (₹1000 विमा रकमेमागे)',
			pv: 'एकूण लाभ आजच्या पैशात', pvnote: 'वार्षिक {i}% महागाई धरून', tax: 'करासंबंधी लक्षात ठेवा',
			solicit: 'Insurance is the subject matter of solicitation. (विमा हा विनंतीचा विषय आहे.)',
			rr: 'हप्त्यांचा तक्ता (Ready Reckoner)', rrsub: 'विमा रक्कम {sa} साठी वय व मुदतीनुसार हप्ता', rryr: 'वार्षिक हप्ता', rrsp: 'एकरकमी हप्ता', rrnote: '— म्हणजे त्या वयाला ती मुदत घेता येत नाही.',
			mix: 'सुचवलेला योजनांचा संच', mixtot: 'एकूण', first: 'पहिल्या वर्षाचा हप्ता', mixirr: 'एकत्रित परतावा (IRR, अंदाजे)', illid: 'Illustration क्रमांक'
		},
		hi: {
			ill: 'लाभ का उदाहरण (Benefit Illustration)', pfor: 'के लिए', pon: 'दिनांक', pby: 'प्रस्तुतकर्ता', details: 'आपकी योजना का विवरण',
			age: 'आयु', sa: 'मूल बीमा राशि', term: 'पॉलिसी अवधि', ppt: 'प्रीमियम भुगतान अवधि', gap: 'गारंटीड एडिशन अवधि', mode: 'भुगतान का तरीका', yrs: 'वर्ष', once: 'एकमुश्त प्रीमियम',
			glance: 'योजना एक नज़र में', inst: 'किस्त', tprem: 'कुल देय प्रीमियम', tben: 'अनुमानित कुल लाभ', irr: 'रिटर्न (IRR, अनुमानित)',
			bymode: 'भुगतान के तरीके अनुसार प्रीमियम', ytot: 'वार्षिक कुल', pdet: 'प्रीमियम विवरण', tab: 'मूल (tabular) प्रीमियम', hsa: 'अधिक बीमा राशि पर छूट', rider: 'राइडर', gst: 'GST',
			ben: 'लाभ', g: 'गारंटीड', ng: 'गैर-गारंटीड', bsa: 'परिपक्वता पर मूल बीमा राशि', surv: 'उत्तरजीविता / आय लाभ', ga: 'गारंटीड एडिशन',
			srb: 'साधारण प्रत्यावर्ती बोनस (अनुमानित)', fab: 'अंतिम अतिरिक्त बोनस (अनुमानित)', death: 'मृत्यु पर बीमा राशि (अनुमानित)', matage: 'परिपक्वता आयु', cover: 'बीमा सुरक्षा इस आयु तक',
			scen: 'बोनस की दो स्थितियाँ', sc1: 'वर्तमान बोनस दर पर', sc2: 'बोनस 50% कम होने पर', chart: 'भरा प्रीमियम बनाम मिला लाभ', paid: 'कुल भरा प्रीमियम', got: 'कुल मिला लाभ',
			insight: 'आप {p} भरते हैं और अनुमानित {b} पाते हैं — यानी प्रीमियम का लगभग {x} गुना।',
			yw: 'वर्षवार नकद प्रवाह', yr: 'वर्ष', prem: 'प्रीमियम', bene: 'लाभ', net: 'शुद्ध (संचयी)', cmp: 'योजनाओं की तुलना', notes: 'महत्वपूर्ण सूचनाएँ',
			contact: 'अपने सलाहकार से बात करें', scan: 'WhatsApp पर बात करने के लिए scan करें', page: 'पृष्ठ', of: 'में से', est: 'प्रीमियम LIC द्वारा प्रकाशित नमूना प्रीमियम से अनुमानित है।',
			d1: 'यह केवल समझने के लिए उदाहरण है, पॉलिसी अनुबंध नहीं। अंतिम प्रीमियम व लाभ प्रस्ताव के समय LIC के quotation और benefit illustration के अनुसार होंगे।',
			d2: 'बोनस की गारंटी नहीं है। LIC हर वर्ष अपने अनुभव के आधार पर बोनस दर घोषित करती है; ऊपर के आँकड़े दिखाई गई बोनस दरों पर आधारित हैं।',
			d3: 'बिक्री से पहले LIC का sales brochure (Plan {no}, UIN {uin}) ध्यान से पढ़ें।',
			d4: 'कर लाभ (यदि हों) वर्तमान कर कानूनों के अनुसार हैं और बदल सकते हैं।',
			doc: 'पॉलिसी आरंभ तिथि', matdate: 'परिपक्वता / अंतिम भुगतान तिथि', gender: 'लिंग', bonusas: 'मान्य बोनस (₹1000 बीमा राशि पर)',
			pv: 'कुल लाभ आज के मूल्य में', pvnote: '{i}% वार्षिक महंगाई मानकर', tax: 'कर संबंधी ध्यान देने योग्य बातें',
			solicit: 'Insurance is the subject matter of solicitation. (बीमा आग्रह की विषय वस्तु है।)',
			rr: 'प्रीमियम तालिका (Ready Reckoner)', rrsub: 'बीमा राशि {sa} के लिए आयु व अवधि अनुसार प्रीमियम', rryr: 'वार्षिक प्रीमियम', rrsp: 'एकमुश्त प्रीमियम', rrnote: '— यानी उस आयु पर वह अवधि उपलब्ध नहीं।',
			mix: 'सुझाया गया योजना संयोजन', mixtot: 'कुल', first: 'पहले वर्ष का प्रीमियम', mixirr: 'संयुक्त रिटर्न (IRR, अनुमानित)', illid: 'Illustration क्रमांक'
		}
	};

	/* ---------- v3.1: cover themes (आपली स्वतःची SVG चित्रे — कुठलीही copyright अडचण नाही) ---------- */
	function svgUrl(body) {
		return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 794 300" width="794" height="300">' + body + '</svg>');
	}
	function themeSvg(k) {
		var g = GOLD, n = GREEN;
		switch (k) {
			case 'lotus': return svgUrl('<rect width="794" height="300" fill="#fbf6ea"/>' +
				[0, 1, 2, 3, 4].map(function (i) { var a = -60 + i * 30; return '<ellipse cx="397" cy="220" rx="38" ry="110" fill="' + (i % 2 ? g : n) + '" opacity=".22" transform="rotate(' + a + ' 397 250)"/>'; }).join('') +
				'<path d="M0 260 Q200 230 397 260 T794 260 V300 H0Z" fill="' + n + '" opacity=".25"/>');
			case 'sunrise': return svgUrl('<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3d6"/><stop offset="1" stop-color="#f6d79b"/></linearGradient></defs><rect width="794" height="300" fill="url(#s)"/>' +
				'<circle cx="397" cy="250" r="90" fill="' + g + '" opacity=".55"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { var a = (i * 22.5 - 180) * Math.PI / 180; return '<line x1="' + (397 + 105 * Math.cos(a)) + '" y1="' + (250 + 105 * Math.sin(a)) + '" x2="' + (397 + 170 * Math.cos(a)) + '" y2="' + (250 + 170 * Math.sin(a)) + '" stroke="' + g + '" stroke-width="6" stroke-linecap="round" opacity=".45"/>'; }).join('') +
				'<path d="M0 255 Q260 220 520 250 T794 240 V300 H0Z" fill="' + n + '" opacity=".55"/>');
			case 'family': return svgUrl('<rect width="794" height="300" fill="#f3f6ee"/>' +
				'<path d="M247 300 V190 L397 90 L547 190 V300Z" fill="' + n + '" opacity=".18"/><path d="M220 195 L397 75 L574 195" fill="none" stroke="' + n + '" stroke-width="10" stroke-linejoin="round" opacity=".5"/>' +
				[[340, 205, 26], [455, 205, 26], [397, 235, 18]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + g + '" opacity=".6"/><rect x="' + (c[0] - c[2]) + '" y="' + (c[1] + c[2] + 4) + '" width="' + (c[2] * 2) + '" height="' + (c[2] * 2) + '" rx="' + c[2] + '" fill="' + g + '" opacity=".45"/>'; }).join(''));
			case 'growth': return svgUrl('<rect width="794" height="300" fill="#f7f7f2"/>' +
				[0, 1, 2, 3, 4, 5, 6].map(function (i) { var h = 40 + i * 30; return '<rect x="' + (150 + i * 75) + '" y="' + (280 - h) + '" width="48" height="' + h + '" rx="6" fill="' + (i === 6 ? g : n) + '" opacity="' + (0.25 + i * 0.08) + '"/>'; }).join('') +
				'<path d="M150 230 C300 200 450 140 660 60" fill="none" stroke="' + g + '" stroke-width="6" stroke-linecap="round"/><path d="M660 60 l-26 4 l14 22z" fill="' + g + '"/>');
			case 'shield': return svgUrl('<rect width="794" height="300" fill="#eef2e8"/>' +
				'<path d="M397 40 L507 80 V160 C507 225 455 262 397 285 C339 262 287 225 287 160 V80Z" fill="' + n + '" opacity=".75"/>' +
				'<path d="M352 165 l32 32 l62 -70" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>' +
				'<circle cx="120" cy="80" r="60" fill="' + g + '" opacity=".15"/><circle cx="690" cy="230" r="80" fill="' + g + '" opacity=".15"/>');
			case 'classic':
			default: return svgUrl('<rect width="794" height="300" fill="' + n + '"/>' +
				'<path d="M0 220 Q397 140 794 220 V300 H0Z" fill="' + g + '" opacity=".9"/><path d="M0 240 Q397 170 794 240 V300 H0Z" fill="#fff" opacity=".12"/>' +
				[[90, 60, 40], [700, 90, 60], [560, 40, 22]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="#fff" opacity=".08"/>'; }).join(''));
		}
	}
	var THEMES = { classic: 'Classic', lotus: 'Lotus', sunrise: 'Sunrise', family: 'Family', growth: 'Growth', shield: 'Protection', none: 'No image' };
	function lsGet(k, d) { try { var v = window.localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
	function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage बंद — चालेल */ } }
	var theme = lsGet('a4u_lic_theme', 'classic'), customCover = lsGet('a4u_lic_cover', '');
	lang = lsGet('a4u_lic_lang', 'en');
	var pngCache = {};
	// SVG → PNG (html2canvas ला PNG सोपं जातं)
	function coverSrc() {
		if (theme === 'custom') { return Promise.resolve(customCover); }
		if (theme === 'none' || !THEMES[theme]) { return Promise.resolve(''); }
		var key = theme + GOLD + GREEN;
		if (pngCache[key]) { return Promise.resolve(pngCache[key]); }
		return new Promise(function (res) {
			var im = new Image();
			im.onload = function () {
				try {
					var cv = document.createElement('canvas'); cv.width = 794 * 2; cv.height = 600;
					cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
					pngCache[key] = cv.toDataURL('image/png');
				} catch (e) { pngCache[key] = im.src; }
				res(pngCache[key]);
			};
			im.onerror = function () { res(''); };
			im.src = themeSvg(theme);
		});
	}
	var coverImg = '';

	/* ---------- v3.1: Illustration ID (server वर फक्त ID + plan + SA ची नोंद) ---------- */
	var illId = '', illKey = '';
	function getIllId(r) {
		var key = r.plan.id + '|' + r.sa + '|' + r.T + '|' + r.age;
		if (illId && illKey === key) { return Promise.resolve(illId); }
		illKey = key;
		var local = function () { illId = 'L-' + Date.now().toString(36).toUpperCase(); return illId; };
		if (!A.post || C.offline) { return Promise.resolve(local()); }
		return A.post('illustration', { plan: r.plan.id, sa: r.sa, term: r.T })
			.then(function (res) { return res && res.ok ? res.json() : null; })
			.then(function (j) { illId = j && j.id ? String(j.id) : local(); return illId; })
			.catch(local);
	}
	function tt(k) { return (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k; }
	function fmtT(k, map) { return tt(k).replace(/\{(\w+)\}/g, function (m, n) { return map[n] !== undefined ? map[n] : m; }); }

	function qrImg(text) {
		try {
			var q = window.qrcode(0, 'M');
			q.addData(text);
			q.make();
			return q.createDataURL(4, 2);
		} catch (e) { return ''; }
	}

	function waLink(r) {
		var msg = 'Hello, I saw the LIC ' + r.plan.name + ' illustration (Age ' + r.age + ', SA ' + inr(r.sa) + '). Please call me.';
		return 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(msg);
	}

	function pageWrap(inner, r, n, total) {
		var p = r.plan;
		return '<div class="a4p">' +
			'<div class="a4p-head"><img src="' + esc(BR.logo || '') + '" alt="" crossorigin="anonymous"><div><b>' + esc(BR.name || '') + '</b><span>' + esc(BR.web || '') + ' · ' + esc(BR.phone || '') + '</span></div></div>' +
			'<div class="a4p-body">' + inner + '</div>' +
			'<div class="a4p-foot"><div>' + esc(BR.agent || '') + (BR.type ? ', ' + esc(BR.type) : '') + (BR.code ? ' · Agency Code: ' + esc(BR.code) : '') + (BR.branch ? ' · Branch: ' + esc(BR.branch) : '') + '</div>' +
			'<div>LIC ' + esc(p.name) + (p.uin ? ' · UIN ' + esc(p.uin) : '') + ' · ' + esc(tt('solicit')) + '</div>' +
			'<div class="a4p-pn">' + (illId ? tt('illid') + ': ' + esc(illId) + ' · ' : '') + tt('page') + ' ' + n + ' ' + tt('of') + ' ' + total + '</div></div></div>';
	}

	function kv(label, val) { return '<tr><th>' + label + '</th><td>' + val + '</td></tr>'; }

	function buildPages(r) {
		var p = r.plan, pr = r.pr, single = !!SINGLE[p.type], pages = [];
		var termLbl = p.type === 'utsav_sp' ? tt('gap') : tt('term');
		var termVal = (p.type === 'utsav_sp' ? r.G : r.T) + ' ' + tt('yrs');
		var mName = single ? tt('once') : MODES[r.mode][0];
		var today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
		var qr = qrImg(waLink(r));

		// 1. Cover
		pages.push((coverImg ? '<div class="a4p-banner"><img class="a4p-coverimg" src="' + esc(coverImg) + '" alt=""><span><img src="' + esc(BR.logo || '') + '" alt="" crossorigin="anonymous"></span></div>' : '') +
			'<div class="a4p-cover' + (coverImg ? ' a4p-cover-img' : '') + '">' + (coverImg ? '' : '<img class="a4p-logo" src="' + esc(BR.logo || '') + '" alt="" crossorigin="anonymous">') +
			'<div class="a4p-brand">' + esc(BR.name || '') + '</div>' +
			'<div class="a4p-rule"></div>' +
			'<h1>LIC ' + esc(p.name) + '</h1><h2>' + tt('ill') + '</h2>' +
			(clientName ? '<p class="a4p-for">' + tt('pfor') + ': <b>' + esc(clientName) + '</b></p>' : '') +
			'<p class="a4p-date">' + tt('pon') + ': ' + today + '</p></div>' +
			'<div class="a4p-card"><h3>' + tt('details') + '</h3><table class="a4p-kv">' +
			kv(tt('age'), r.age + ' ' + tt('yrs')) + (r.gender ? kv(tt('gender'), r.gender === 'F' ? 'Female' : 'Male') : '') +
			kv(tt('doc'), r.docText) + kv(tt('matdate'), r.matText) + kv(tt('sa'), inr(r.sa)) + kv(termLbl, termVal) +
			(single ? '' : kv(tt('ppt'), r.P + ' ' + tt('yrs'))) + kv(tt('mode'), mName) +
			kv(single ? tt('once') : tt('inst'), '<b>' + inr(r.inst) + '</b>') + '</table></div>' +
			'<div class="a4p-card a4p-advisor"><div><h3>' + tt('pby') + '</h3><p><b>' + esc(BR.agent || '') + '</b><br>' + esc(BR.type || '') +
			(BR.code ? '<br>Agency Code: ' + esc(BR.code) : '') + '<br>' + esc(BR.phone || '') + ' · ' + esc(BR.email || '') + '<br>' + esc(BR.web || '') + '</p></div>' +
			(qr ? '<div class="a4p-qr"><img src="' + qr + '" alt=""><span>' + tt('scan') + '</span></div>' : '') + '</div>');

		// 2. Plan at a glance
		var g = '<h2 class="a4p-h">' + tt('glance') + '</h2><div class="a4p-cards">' +
			'<div><span>' + (single ? tt('once') : tt('inst') + ' (' + mName + ')') + '</span><b>' + inr(r.inst) + '</b></div>' +
			'<div><span>' + tt('tprem') + '</span><b>' + inr(r.totalPrem) + '</b></div>' +
			'<div><span>' + tt('tben') + '</span><b>' + inr(r.totalBenefit) + '</b></div>' +
			'<div><span>' + tt('irr') + '</span><b>' + pct(r.irr) + '</b></div></div>';
		if (pr.modes) {
			g += '<h3>' + tt('bymode') + '</h3><table class="a4p-t"><thead><tr><th>' + tt('mode') + '</th><th>' + tt('inst') + '</th><th>' + tt('ytot') + '</th></tr></thead><tbody>' +
				pr.modes.map(function (x) { return '<tr' + (x[0] === r.mode ? ' class="sel"' : '') + '><td>' + MODES[x[0]][0] + '</td><td>' + inr(x[1]) + '</td><td>' + inr(x[2]) + '</td></tr>'; }).join('') + '</tbody></table>';
		}
		var rid = 0;
		Object.keys(pr.riders).forEach(function (k) { rid += pr.riders[k]; });
		g += '<h3>' + tt('pdet') + '</h3><table class="a4p-t a4p-kv2"><tbody>' + kv(tt('tab'), inr(pr.tabular)) +
			(pr.rebate ? kv(tt('hsa'), '− ' + inr(pr.rebate)) : '') + (rid ? kv(tt('rider'), inr(rid)) : '') + kv(tt('gst'), r.gst + '%') + '</tbody></table>';
		g += '<h3>' + tt('ben') + '</h3><table class="a4p-t a4p-kv2"><tbody>';
		if (p.type === 'utsav_sp') { g += kv('<i class="tg">' + tt('g') + '</i> ' + tt('matage') + ' ' + (r.age + r.T), inr(r.maturity)); }
		else if (p.type !== 'utsav') { g += kv('<i class="tg">' + tt('g') + '</i> ' + tt('bsa'), inr(r.sa)); }
		if (r.totalSurv) { g += kv('<i class="tg">' + tt('g') + '</i> ' + tt('surv') + ' (' + p.survival_pct + '% × SA)', inr(r.survival) + ' / yr'); }
		if (r.ga && p.type !== 'utsav_sp') { g += kv('<i class="tg">' + tt('g') + '</i> ' + tt('ga'), inr(r.ga)); }
		if (r.bonus || r.fab) { g += kv(tt('bonusas'), 'SRB ₹' + r.srb + (r.fabRate ? ' · FAB ₹' + r.fabRate : '')); }
		if (r.bonus) { g += kv('<i class="tn">' + tt('ng') + '</i> ' + tt('srb'), inr(r.bonus)); }
		if (r.fab) { g += kv('<i class="tn">' + tt('ng') + '</i> ' + tt('fab'), inr(r.fab)); }
		if (r.deathSA) { g += kv(tt('death'), inr(r.deathSA)); }
		g += kv(p.type === 'utsav' ? tt('cover') : tt('matage'), String(r.age + r.T)) + '</tbody></table>';
		if (r.basis !== 'verified') { g += '<p class="a4p-note">' + tt('est') + '</p>'; }
		pages.push(g);

		// 3. Scenarios + chart
		var c = '<h2 class="a4p-h">' + tt('scen') + '</h2><table class="a4p-t"><thead><tr><th></th><th>' + tt('tben') + '</th><th>' + tt('irr') + '</th></tr></thead><tbody>' +
			'<tr><td>' + tt('sc1') + '</td><td>' + inr(r.totalBenefit) + '</td><td>' + pct(r.irr) + '</td></tr>' +
			(r.bonusCut ? '<tr><td>' + tt('sc2') + '</td><td>' + inr(r.totalBenefitLow) + '</td><td>' + pct(r.irrLow) + '</td></tr>' : '') + '</tbody></table>';
		c += '<h3>' + tt('chart') + '</h3><img class="a4p-chart" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(chartSvg(r, GREEN, GOLD)) + '" alt="">' +
			'<p class="a4p-legend"><span style="background:' + GREEN + '"></span>' + tt('paid') + ' <span style="background:' + GOLD + '"></span>' + tt('got') + '</p>';
		c += '<table class="a4p-t a4p-kv2" style="margin-top:10px"><tbody>' + kv(tt('pv') + ' <small>(' + fmtT('pvnote', { i: C.inflation }) + ')</small>', inr(r.pvBenefit)) + '</tbody></table>';
		if (r.taxNotes && r.taxNotes.length) { c += '<h3>' + tt('tax') + '</h3><ul class="a4p-notes">' + r.taxNotes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }
		if (r.totalPrem > 0) {
			c += '<div class="a4p-insight">' + fmtT('insight', { p: inr(r.totalPrem), b: inr(r.totalBenefit), x: (r.totalBenefit / r.totalPrem).toFixed(2) }) + '</div>';
		}
		pages.push(c);

		// 4+. Year-wise (एका पानावर 34 ओळी)
		var per = 32;
		for (var i = 0; i < r.rows.length; i += per) {
			pages.push('<h2 class="a4p-h">' + tt('yw') + (r.rows.length > per ? ' (' + (i / per + 1) + ')' : '') + '</h2><table class="a4p-t a4p-yw"><thead><tr><th>' + tt('yr') + '</th><th>' + tt('age') + '</th><th>' + tt('prem') + '</th><th>' + tt('bene') + '</th><th>' + tt('net') + '</th></tr></thead><tbody>' +
				r.rows.slice(i, i + per).map(function (x) {
					return '<tr><td>' + x[0] + '</td><td>' + x[1] + '</td><td>' + (x[2] ? inr(x[2]) : '—') + '</td><td>' + (x[3] ? inr(x[3]) : '—') + '</td><td class="' + (x[4] < 0 ? 'neg' : 'pos') + '">' + inr(x[4]) + '</td></tr>';
				}).join('') + '</tbody></table>');
		}

		// v3.1: Ready Reckoner पान
		var rr = A.rr && A.rr();
		if (rr && rr.r === r) {
			pages.push('<h2 class="a4p-h">' + tt('rr') + '</h2><p class="a4p-sub">' + fmtT('rrsub', { sa: inr(r.sa) }) + ' (' + (rr.single ? tt('rrsp') : tt('rryr')) + ')</p>' +
				'<table class="a4p-t a4p-rr"><thead><tr><th>' + tt('age') + ' \\ ' + tt('term') + '</th>' + rr.terms.map(function (t) { return '<th>' + t + '</th>'; }).join('') + '</tr></thead><tbody>' +
				rr.rows.map(function (row) { return '<tr' + (row[0] === r.age ? ' class="sel"' : '') + '><th>' + row[0] + '</th>' + row[1].map(function (v) { return '<td>' + (v ? inr(v) : '—') + '</td>'; }).join('') + '</tr>'; }).join('') +
				'</tbody></table><p class="a4p-sub">' + tt('rrnote') + '</p>');
		}
		// v3.1: Product Mix पान (2+ plans असतील तर)
		var mix = A.mix ? A.mix() : [];
		if (mix.length >= 2) {
			var tp = 0, tb = 0, tf = 0;
			var mrow = mix.map(function (m) {
				var fy = SINGLE[m.plan.type] ? m.inst : m.pr.yearPay;
				tp += m.totalPrem; tb += m.totalBenefit; tf += fy;
				return '<tr><td>' + esc(m.plan.name) + '</td><td>' + inr(m.sa) + '</td><td>' + m.T + ' / ' + (SINGLE[m.plan.type] ? '1' : m.P) + '</td><td>' + inr(fy) + '</td><td>' + inr(m.totalPrem) + '</td><td>' + inr(m.totalBenefit) + '</td><td>' + pct(m.irr) + '</td></tr>';
			}).join('');
			pages.push('<h2 class="a4p-h">' + tt('mix') + '</h2><table class="a4p-t"><thead><tr><th></th><th>' + tt('sa') + '</th><th>' + tt('term') + ' / ' + tt('ppt') + '</th><th>' + tt('first') + '</th><th>' + tt('tprem') + '</th><th>' + tt('tben') + '</th><th>IRR</th></tr></thead><tbody>' + mrow +
				'<tr class="tot"><th>' + tt('mixtot') + '</th><td></td><td></td><td>' + inr(tf) + '</td><td>' + inr(tp) + '</td><td>' + inr(tb) + '</td><td></td></tr></tbody></table>' +
				(A.mixIrr ? '<div class="a4p-insight">' + tt('mixirr') + ': <b>' + pct(A.mixIrr()) + '</b></div>' : ''));
		}

		// Last: compare + notes + contact
		var l = '';
		if (lastCmp && lastCmp.a === r) {
			var b = lastCmp.b;
			var rowsC = [[tt('sa'), function (x) { return inr(x.sa); }], [tt('term') + ' / ' + tt('ppt'), function (x) { return x.T + ' / ' + (SINGLE[x.plan.type] ? '1' : x.P); }],
				[tt('inst'), function (x) { return inr(x.inst); }], [tt('tprem'), function (x) { return inr(x.totalPrem); }], [tt('tben'), function (x) { return inr(x.totalBenefit); }],
				[tt('sc2'), function (x) { return inr(x.totalBenefitLow); }], [tt('irr'), function (x) { return pct(x.irr); }]];
			l += '<h2 class="a4p-h">' + tt('cmp') + '</h2><table class="a4p-t"><thead><tr><th></th><th>' + esc(r.plan.name) + '</th><th>' + esc(b.plan.name) + '</th></tr></thead><tbody>' +
				rowsC.map(function (q) { return '<tr><td>' + q[0] + '</td><td>' + q[1](r) + '</td><td>' + q[1](b) + '</td></tr>'; }).join('') + '</tbody></table>';
		}
		l += '<h2 class="a4p-h">' + tt('notes') + '</h2><ol class="a4p-notes"><li>' + tt('d1') + '</li><li>' + tt('d2') + '</li><li>' + fmtT('d3', { no: p.id, uin: p.uin || '—' }) + '</li><li>' + tt('d4') + '</li></ol>';
		l += '<div class="a4p-card a4p-advisor"><div><h3>' + tt('contact') + '</h3><p><b>' + esc(BR.agent || '') + '</b> · ' + esc(BR.name || '') + '<br>' + esc(BR.type || '') +
			(BR.code ? '<br>Agency Code: ' + esc(BR.code) + (BR.branch ? ' · Branch: ' + esc(BR.branch) : '') : '') + '<br>' + esc(BR.phone || '') + ' · ' + esc(BR.email || '') + '<br>' + esc(BR.web || '') + '</p></div>' +
			(qr ? '<div class="a4p-qr"><img src="' + qr + '" alt=""><span>' + tt('scan') + '</span></div>' : '') + '</div>';
		pages.push(l);

		return pages.map(function (inner, k) { return pageWrap(inner, r, k + 1, pages.length); }).join('');
	}

	var modal = null;
	function closePresentation() { if (modal) { modal.remove(); modal = null; document.documentElement.classList.remove('a4u-noscroll'); } }

	function fitPreview() {
		if (!modal) { return; }
		var box = modal.querySelector('.a4u-pv-pages'), w = box.clientWidth - 24, s = Math.min(1, w / 794);
		box.style.setProperty('--s', s);
		Array.prototype.forEach.call(box.querySelectorAll('.a4u-pv-slot'), function (slot) { slot.style.width = (794 * s) + 'px'; slot.style.height = (1123 * s) + 'px'; });
	}

	function renderPreview() {
		var box = modal.querySelector('.a4u-pv-pages');
		var tmp = document.createElement('div');
		tmp.innerHTML = buildPages(last);
		box.innerHTML = '';
		Array.prototype.slice.call(tmp.children).forEach(function (pg) { // live list — आधी copy (नाहीतर अर्धी पानं गळत होती)
			var slot = document.createElement('div');
			slot.className = 'a4u-pv-slot';
			slot.appendChild(pg);
			box.appendChild(slot);
		});
		fitPreview();
	}

	function openPresentation() {
		last = A.last();
		lastCmp = A.cmp();
		if (!last) { return; }
		var ci = A.client();
		clientName = ci.name ? [ci.prefix, ci.name].filter(Boolean).join(' ') : '';
		vendor('qrcode.js').catch(function () {}).then(function () {
			closePresentation();
			modal = document.createElement('div');
			modal.className = 'a4u-pv a4u-lic';
			modal.style.setProperty('--gold', GOLD);
			modal.style.setProperty('--green', GREEN);
			modal.innerHTML = '<div class="a4u-pv-bar">' +
				'<select data-pv="lang" aria-label="Language"><option value="en">English</option><option value="mr">मराठी</option><option value="hi">हिन्दी</option></select>' +
				'<select data-pv="theme" aria-label="Cover image">' + Object.keys(THEMES).map(function (k) { return '<option value="' + k + '">Cover: ' + THEMES[k] + '</option>'; }).join('') + '<option value="custom">Cover: My image…</option></select>' +
				'<input data-pv="file" type="file" accept="image/png,image/jpeg,image/webp" hidden>' +
				'<input data-pv="client" type="text" maxlength="60" placeholder="Client name (optional)" value="' + esc(clientName) + '">' +
				'<button type="button" data-pv="pdf" class="a4u-btn a4u-gold">Download PDF</button>' +
				'<button type="button" data-pv="share" class="a4u-btn a4u-wa">Share</button>' +
				'<button type="button" data-pv="close" class="a4u-btn a4u-ghost" aria-label="Close">✕</button>' +
				'<span data-pv="msg" class="a4u-pv-msg" role="status"></span></div>' +
				'<div class="a4u-pv-pages"></div>';
			document.body.appendChild(modal);
			document.documentElement.classList.add('a4u-noscroll');
			modal.querySelector('[data-pv="lang"]').value = lang;
			var th = modal.querySelector('[data-pv="theme"]');
			th.value = theme === 'custom' && !customCover ? 'classic' : theme;
			th.addEventListener('change', function () {
				if (this.value === 'custom') { modal.querySelector('[data-pv="file"]').click(); return; }
				theme = this.value; lsSet('a4u_lic_theme', theme); refreshCover();
			});
			modal.querySelector('[data-pv="file"]').addEventListener('change', function () {
				var fl = this.files && this.files[0];
				if (!fl) { th.value = theme; return; }
				if (fl.size > 4 * 1024 * 1024) { pvMsg('Image is too large (max 4 MB).'); th.value = theme; return; }
				shrinkImage(fl).then(function (url) {
					customCover = url; theme = 'custom';
					lsSet('a4u_lic_cover', url); lsSet('a4u_lic_theme', 'custom');
					refreshCover();
				}, function () { pvMsg('Could not read this image.'); th.value = theme; });
			});
			getIllId(last).then(function () { if (modal) { renderPreview(); } });
			refreshCover();
			modal.addEventListener('click', onPvClick);
			modal.querySelector('[data-pv="lang"]').addEventListener('change', function () { lang = this.value; lsSet('a4u_lic_lang', lang); renderPreview(); });
			var cn = modal.querySelector('[data-pv="client"]');
			if (cn) { cn.addEventListener('change', function () { clientName = this.value.trim(); renderPreview(); }); }
		});
	}
	function refreshCover() { coverSrc().then(function (u) { coverImg = u || ''; if (modal) { renderPreview(); } }); }
	// upload केलेलं चित्र फक्त या browser मध्ये — 1600px पर्यंत लहान करून ठेवतो (server वर जात नाही)
	function shrinkImage(fl) {
		return new Promise(function (res, rej) {
			var rd = new FileReader();
			rd.onerror = rej;
			rd.onload = function () {
				var im = new Image();
				im.onerror = rej;
				im.onload = function () {
					var w = Math.min(1588, im.width), h = Math.round(im.height * w / im.width);
					var cv = document.createElement('canvas'); cv.width = w; cv.height = Math.min(h, Math.round(w * 0.38)); // cover band ratio
					var ctx = cv.getContext('2d'), sy = Math.max(0, (h - cv.height) / 2) * (im.width / w);
					ctx.drawImage(im, 0, sy, im.width, cv.height * im.width / w, 0, 0, cv.width, cv.height);
					res(cv.toDataURL('image/jpeg', 0.82));
				};
				im.src = rd.result;
			};
			rd.readAsDataURL(fl);
		});
	}
	window.addEventListener('resize', fitPreview);
	document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePresentation(); } });

	function pvMsg(t) { var m = modal && modal.querySelector('[data-pv="msg"]'); if (m) { m.textContent = t; } }

	function fileName(r) {
		var who = (clientName || '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
		return 'LIC-' + r.plan.id + '-Illustration' + (who ? '-' + who : '') + '.pdf';
	}

	// प्रत्येक A4 पान html2canvas ने image करून jsPDF मध्ये — मराठी अक्षरंही बरोबर दिसतात
	function makePdf() {
		var r = last;
		return Promise.all([vendor('html2canvas.min.js'), vendor('jspdf.umd.min.js'), vendor('qrcode.js')]).then(function () {
			var host = document.createElement('div');
			host.className = 'a4u-pdf-host a4u-lic';
			host.style.setProperty('--gold', GOLD);
			host.style.setProperty('--green', GREEN);
			host.innerHTML = buildPages(r);
			document.body.appendChild(host);
			var imgs = host.querySelectorAll('img');
			var ready = Array.prototype.map.call(imgs, function (im) {
				return im.complete ? Promise.resolve() : new Promise(function (res) { im.onload = im.onerror = res; });
			});
			return Promise.all(ready).then(function () {
				var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
				var pages = host.querySelectorAll('.a4p'), chain = Promise.resolve();
				Array.prototype.forEach.call(pages, function (pg, i) {
					chain = chain.then(function () {
						pvMsg('Creating page ' + (i + 1) + ' of ' + pages.length + '…');
						return window.html2canvas(pg, { scale: 1.6, backgroundColor: '#ffffff', useCORS: true, logging: false, windowWidth: 794 }).then(function (cv) {
							if (i) { pdf.addPage(); }
							pdf.addImage(cv.toDataURL('image/jpeg', 0.86), 'JPEG', 0, 0, 210, 297);
						});
					});
				});
				return chain.then(function () {
					host.remove();
					pdf.setProperties({ title: 'LIC ' + r.plan.name + ' - Benefit Illustration', author: BR.name || '', subject: 'Illustration', creator: 'A4U LIC Calculator' });
					return pdf.output('blob');
				});
			}).catch(function (e) { host.remove(); throw e; });
		});
	}

	function onPvClick(e) {
		var b = e.target.closest('[data-pv]');
		if (!b) { return; }
		var act = b.getAttribute('data-pv');
		if (act === 'close') { closePresentation(); return; }
		if (act !== 'pdf' && act !== 'share') { return; }
		var btns = modal.querySelectorAll('button');
		Array.prototype.forEach.call(btns, function (x) { x.disabled = true; });
		makePdf().then(function (blob) {
			var name = fileName(last);
			track('pdf');
			var file = window.File ? new File([blob], name, { type: 'application/pdf' }) : null;
			if (act === 'share' && file && navigator.canShare && navigator.canShare({ files: [file] })) {
				return navigator.share({ files: [file], title: 'LIC ' + last.plan.name + ' illustration' }).then(function () { pvMsg('Shared.'); }, function () { pvMsg(''); });
			}
			var a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = name;
			document.body.appendChild(a);
			a.click();
			setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
			pvMsg(act === 'share' ? 'Sharing is not supported here — PDF downloaded instead.' : 'PDF downloaded.');
		}).catch(function () {
			pvMsg('Could not create the PDF. Please try again or use Print.');
		}).then(function () {
			if (modal) { Array.prototype.forEach.call(modal.querySelectorAll('button'), function (x) { x.disabled = false; }); }
		});
	}

	window.A4U_LIC_PRESENT = { open: openPresentation };
})();
