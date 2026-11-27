/* A4U LIC Calculator v3.2 — branded presentation + PDF (lazy-loaded) */
(function () {
	'use strict';
	var A = window.A4U_LIC_API;
	if (!A) { return; }
	var V4 = window.A4U_CHARTS && window.A4U_CHARTS.pdf; // v4.1: नवीन charts (hub.js) असतील तर
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
			mix: 'Suggested product mix', mixtot: 'Combined', first: 'First-year premium', mixirr: 'Combined return (IRR, approx.)', illid: 'Illustration ID', mb: 'Money back'
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
			mix: 'सुचवलेला योजनांचा संच', mixtot: 'एकूण', first: 'पहिल्या वर्षाचा हप्ता', mixirr: 'एकत्रित परतावा (IRR, अंदाजे)', illid: 'Illustration क्रमांक', mb: 'मनी बॅक हप्ता'
,
			md: 'मुदतपूर्ती तपशील', youpay: 'तुम्ही भरता', youget: 'तुम्हाला मिळते', lcover: 'जीवन विमा संरक्षण', lumpsum: 'एकरकमी रक्कम', income: 'वार्षिक उत्पन्न', mback: 'मनी बॅक',
			perday: 'म्हणजे दिवसाला फक्त {d}', every1: 'तुम्ही भरलेल्या प्रत्येक ₹1 मागे ₹{x} परत', pchart: 'प्रीमियम तक्ता', paytot: 'तुम्ही एकूण भरता', gettot: 'तुम्हाला एकूण मिळते', gain: 'फायदा',
			how: 'योजना कशी काम करते', why: 'LIC च का?', bct: 'लाभ आणि संरक्षण तक्ता', opt2: 'फ्लेक्सी उत्पन्न — रक्कम न काढल्यास',
			c_age: 'वय', c_yr: 'वर्ष', c_prem: 'प्रीमियम', c_cum: 'एकूण प्रीमियम', c_add: 'GA / बोनस (वर्ष)', c_cumadd: 'GA / बोनस (एकूण)', c_cover: 'सामान्य मृत्यू संरक्षण',
			c_acc: 'अपघाती मृत्यू संरक्षण', c_loan: 'कर्ज*', c_cv: 'रोख मूल्य*', c_ret: 'परतावा', c_inc: 'जमा झालेले उत्पन्न', c_bal: '5.5% ने जमा रक्कम',
			cvnote: '* कर्ज आणि रोख मूल्य LIC brochure मधील किमान हमी समर्पण मूल्यावर (GSV) आधारित आहेत. प्रत्यक्ष विशेष समर्पण मूल्य (SSV) साधारणपणे जास्त असते.',
			risknote: '8 वर्षांखालील मुलासाठी जोखीम संरक्षण उशिरा सुरू होते; तोपर्यंत मृत्यू लाभ म्हणजे भरलेला प्रीमियम परत.',
			totpaid: 'एकूण भरलेला प्रीमियम', totret: 'एकूण परतावा',
			m_sa: 'मूळ विमा रक्कम', m_ga: 'हमी वाढ (Guaranteed Additions)', m_srb: 'बोनस (अंदाजे)', m_fab: 'अंतिम अतिरिक्त बोनस (अंदाजे)', m_inc: 'दरवर्षी उत्पन्न', m_incage: 'उत्पन्न सुरू होण्याचे वय',
			m_tsurv: 'एकूण हयाती लाभ', m_mat: 'मुदतपूर्ती रक्कम', m_matage: 'मुदतपूर्तीचे वय', m_mb: 'मनी बॅक — वय', m_coverto: 'विमा संरक्षण या वयापर्यंत',
			h_prem: 'प्रीमियम', h_cov: 'संरक्षण', h_mat: 'मुदतपूर्ती', h_acc: 'वाढ', h_tax: 'कर', h_feat: 'वैशिष्ट्ये',
			t_prem: '{p} वर्षे {m} {i} भरा.', t_prem1: 'एकदाच {i} भरा.', t_cov: 'पॉलिसी काळात {a} ते {b} जीवन विमा संरक्षण.', t_mat: 'वय {g} ला {m} मिळतील.', t_mat0: 'वय {g} पासून दरवर्षी {s} मिळतील.',
			t_acc_ga: 'दर ₹1000 विमा रकमेमागे दरवर्षी {r} हमी वाढ.', t_acc_b: 'LIC दरवर्षी बोनस जाहीर करते (गृहीत {r} प्रति ₹1000).', t_acc_n: 'योजनेनुसार हमी असलेली रक्कम.',
			t_tax: 'प्रीमियमवर कलम 80C आणि मुदतपूर्तीवर कलम 10(10D) — अटींनुसार.', t_feat: 'कर्ज व समर्पण सुविधा, पर्यायी रायडर आणि नामनिर्देशन.',
			w1: 'भारत सरकारच्या मालकीची कंपनी', w2: 'पॉलिसीच्या रकमेची केंद्र सरकारची हमी (कलम 37, LIC कायदा 1956)', w3: '1956 पासून कुटुंबांच्या सेवेत', w4: 'देशभर शाखा आणि एजंट',
			feat: 'योजनेची वैशिष्ट्ये', f_death: 'मृत्यू लाभ', f_mat: 'मुदतपूर्ती लाभ', f_add: 'वाढ', f_tax: 'आयकर', f_surr: 'समर्पण (Surrender)', f_loan: 'कर्ज',
			fv_death: 'किमान {d} (भरलेल्या प्रीमियमच्या 105% पेक्षा कमी नाही)', fv_tax: 'कलम 80C व 10(10D), अटींनुसार', fv_surr: '{y} वर्षांनंतर उपलब्ध', fv_loan: '{y} वर्षांनंतर, समर्पण मूल्यावर उपलब्ध',
			plandet: 'योजनेचा तपशील', riders: 'निवडलेले रायडर', none: 'नाही', custom: 'यांच्यासाठी खास तयार केलेले सादरीकरण',
			d_endowment: 'बचत आणि संरक्षण देणारी योजना. तुम्हाला काही झाले तर कुटुंबाला आर्थिक आधार, आणि मुदतपूर्तीला बोनससह एकरकमी रक्कम.',
			d_lakshya: 'मुलांच्या ध्येयांसाठी योजना. तुम्हाला काही झाले तर कुटुंबाला वार्षिक उत्पन्न, आणि मुदतपूर्तीची पूर्ण रक्कम वेळेवर मिळते.',
			d_labh: 'कमी वर्षे प्रीमियम भरण्याची बचत योजना. पूर्ण मुदतभर संरक्षण आणि मुदतपूर्तीला बोनससह एकरकमी रक्कम.',
			d_anand: 'मुदतपूर्तीनंतरही विमा संरक्षण चालू राहणारी एंडोमेंट योजना.',
			d_umang: 'प्रीमियम भरून झाल्यावर दरवर्षी हमी उत्पन्न आणि शेवटी एकरकमी रक्कम देणारी आजीवन योजना.',
			d_utsav: 'प्रीमियम भरून झाल्यावर आयुष्यभर दरवर्षी हमी उत्पन्न आणि वय 100 पर्यंत विमा संरक्षण.',
			d_utsav_sp: 'एकदाच प्रीमियम भरण्याची योजना — हमी वाढ आणि आयुष्यभर हमी उत्पन्नाचे पर्याय.',
			d_single: 'एकदाच भरा, पूर्ण मुदतभर संरक्षण आणि मुदतपूर्तीला बोनससह एकरकमी रक्कम.',
			d_moneyback: 'मनी बॅक योजना: ठराविक अंतराने विमा रकमेचा काही भाग, आणि उरलेली रक्कम बोनससह मुदतपूर्तीला.'
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
			mix: 'सुझाया गया योजना संयोजन', mixtot: 'कुल', first: 'पहले वर्ष का प्रीमियम', mixirr: 'संयुक्त रिटर्न (IRR, अनुमानित)', illid: 'Illustration क्रमांक', mb: 'मनी बैक किस्त',
			md: 'परिपक्वता विवरण', youpay: 'आप भरते हैं', youget: 'आपको मिलता है', lcover: 'जीवन बीमा सुरक्षा', lumpsum: 'एकमुश्त राशि', income: 'वार्षिक आय', mback: 'मनी बैक',
			perday: 'यानी रोज़ सिर्फ़ {d}', every1: 'आपके हर ₹1 पर ₹{x} वापस', pchart: 'प्रीमियम चार्ट', paytot: 'आप कुल भरते हैं', gettot: 'आपको कुल मिलता है', gain: 'लाभ',
			how: 'योजना कैसे काम करती है', why: 'LIC ही क्यों?', bct: 'लाभ और सुरक्षा तालिका', opt2: 'फ्लेक्सी आय — राशि न निकालने पर',
			c_age: 'आयु', c_yr: 'वर्ष', c_prem: 'प्रीमियम', c_cum: 'कुल प्रीमियम', c_add: 'GA / बोनस (वर्ष)', c_cumadd: 'GA / बोनस (कुल)', c_cover: 'सामान्य मृत्यु सुरक्षा',
			c_acc: 'दुर्घटना मृत्यु सुरक्षा', c_loan: 'ऋण*', c_cv: 'नकद मूल्य*', c_ret: 'रिटर्न', c_inc: 'जमा आय', c_bal: '5.5% पर जमा राशि',
			cvnote: '* ऋण और नकद मूल्य LIC ब्रोशर के न्यूनतम गारंटीड सरेंडर मूल्य (GSV) पर आधारित हैं। वास्तविक स्पेशल सरेंडर मूल्य (SSV) आमतौर पर अधिक होता है।',
			risknote: '8 वर्ष से कम आयु के बच्चे के लिए जोखिम सुरक्षा बाद में शुरू होती है; तब तक मृत्यु लाभ भरे गए प्रीमियम की वापसी है।',
			totpaid: 'कुल भरा गया प्रीमियम', totret: 'कुल रिटर्न',
			m_sa: 'मूल बीमा राशि', m_ga: 'गारंटीड एडिशन', m_srb: 'बोनस (अनुमानित)', m_fab: 'अंतिम अतिरिक्त बोनस (अनुमानित)', m_inc: 'हर साल आय', m_incage: 'आय शुरू होने की आयु',
			m_tsurv: 'कुल उत्तरजीविता लाभ', m_mat: 'परिपक्वता राशि', m_matage: 'परिपक्वता आयु', m_mb: 'मनी बैक — आयु', m_coverto: 'बीमा सुरक्षा इस आयु तक',
			h_prem: 'प्रीमियम', h_cov: 'सुरक्षा', h_mat: 'परिपक्वता', h_acc: 'वृद्धि', h_tax: 'कर', h_feat: 'विशेषताएँ',
			t_prem: '{p} वर्ष {m} {i} भरें।', t_prem1: 'एक बार {i} भरें।', t_cov: 'पॉलिसी अवधि में {a} से {b} तक जीवन सुरक्षा।', t_mat: 'आयु {g} पर {m} पाएँ।', t_mat0: 'आयु {g} से हर साल {s} पाएँ।',
			t_acc_ga: 'हर ₹1000 बीमा राशि पर हर साल {r} गारंटीड एडिशन।', t_acc_b: 'LIC हर साल बोनस घोषित करती है (मान लिया {r} प्रति ₹1000)।', t_acc_n: 'योजना के अनुसार गारंटीड भुगतान।',
			t_tax: 'प्रीमियम पर धारा 80C और परिपक्वता पर धारा 10(10D) — शर्तों के अधीन।', t_feat: 'ऋण और सरेंडर सुविधा, वैकल्पिक राइडर और नामांकन।',
			w1: 'भारत सरकार के स्वामित्व वाली कंपनी', w2: 'पॉलिसी राशि पर केंद्र सरकार की गारंटी (धारा 37, LIC अधिनियम 1956)', w3: '1956 से परिवारों की सेवा में', w4: 'पूरे देश में शाखाएँ और एजेंट',
			feat: 'योजना की विशेषताएँ', f_death: 'मृत्यु लाभ', f_mat: 'परिपक्वता लाभ', f_add: 'वृद्धि', f_tax: 'आयकर', f_surr: 'सरेंडर', f_loan: 'ऋण',
			fv_death: 'कम से कम {d} (भरे गए प्रीमियम के 105% से कम नहीं)', fv_tax: 'धारा 80C और 10(10D), शर्तों के अधीन', fv_surr: '{y} वर्ष बाद उपलब्ध', fv_loan: '{y} वर्ष बाद, सरेंडर मूल्य पर उपलब्ध',
			plandet: 'योजना का विवरण', riders: 'चुने गए राइडर', none: 'कोई नहीं', custom: 'इनके लिए विशेष रूप से तैयार प्रस्तुति',
			d_endowment: 'बचत और सुरक्षा देने वाली योजना। आपको कुछ होने पर परिवार को आर्थिक सहारा, और परिपक्वता पर बोनस सहित एकमुश्त राशि।',
			d_lakshya: 'बच्चों के लक्ष्यों के लिए योजना। आपको कुछ होने पर परिवार को वार्षिक आय, और परिपक्वता की पूरी राशि समय पर मिलती है।',
			d_labh: 'कम वर्षों तक प्रीमियम भरने वाली बचत योजना। पूरी अवधि सुरक्षा और परिपक्वता पर बोनस सहित एकमुश्त राशि।',
			d_anand: 'परिपक्वता के बाद भी बीमा सुरक्षा जारी रखने वाली एंडोमेंट योजना।',
			d_umang: 'प्रीमियम पूरा होने के बाद हर साल गारंटीड आय और अंत में एकमुश्त राशि देने वाली आजीवन योजना।',
			d_utsav: 'प्रीमियम पूरा होने के बाद जीवनभर हर साल गारंटीड आय और 100 वर्ष की आयु तक बीमा सुरक्षा।',
			d_utsav_sp: 'एकल प्रीमियम योजना — गारंटीड एडिशन और जीवनभर गारंटीड आय के विकल्प।',
			d_single: 'एक बार भरें, पूरी अवधि सुरक्षा और परिपक्वता पर बोनस सहित एकमुश्त राशि।',
			d_moneyback: 'मनी बैक योजना: तय अंतराल पर बीमा राशि का हिस्सा, और बाकी राशि बोनस सहित परिपक्वता पर।'
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
	function tt(k) { return (I18N[lang] && I18N[lang][k]) || I18N.en[k] || (A.RL && A.RL[k]) || k; }
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

		var RI = A.reportInfo(r), sp1 = single, img = function (svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); };
		var yrs = ' ' + tt('yrs');
		var RN = { adb: 'Accident Benefit', addb: 'Accidental Death & Disability', term: 'Term Assurance', pwb: 'Premium Waiver Benefit' };
		var ridList = Object.keys(pr.riders).map(function (k) { return (RN[k] || k) + (k === 'adb' && r.r && r.r.adbSA ? ' (' + inr(r.r.adbSA) + ')' : '') + ' — ' + inr(pr.riders[k]) + ' / yr'; });

		// 1. Cover — योजनेचं नाव, कोणासाठी, वर्णन, तपशील, वैशिष्ट्ये
		var c1 = (coverImg ? '<div class="a4p-banner"><img class="a4p-coverimg" src="' + esc(coverImg) + '" alt=""><span><img src="' + esc(BR.logo || '') + '" alt="" crossorigin="anonymous"></span></div>' : '') +
			'<div class="a4p-plan"><h1>LIC\'s ' + esc(p.name) + '</h1><span class="no">(Plan No: ' + esc(p.id) + (p.uin ? ' · UIN ' + esc(p.uin) : '') + ')</span></div>' +
			'<p class="a4p-cust">' + (clientName ? tt('custom') + ' <b>' + esc(clientName) + '</b> · ' : '') + tt('age') + ' ' + r.age + (r.gender ? ' · ' + (r.gender === 'F' ? 'Female' : 'Male') : '') + ' · ' + tt('pon') + ' ' + today + '</p>' +
			'<p class="a4p-desc">' + tt('d_' + p.type) + '</p>' +
			'<div class="a4p-2col"><div class="a4p-card"><h3>' + tt('plandet') + '</h3><table class="a4p-kv">' +
			kv(tt('sa'), inr(r.sa)) + kv(termLbl, termVal) + (single ? '' : kv(tt('ppt'), r.P + yrs)) + kv(tt('mode'), mName) +
			kv(single ? tt('once') : tt('inst'), '<b>' + inr(r.inst) + '</b>') + kv(tt('doc'), r.docText) + kv(tt('matdate'), r.matText) + '</table>' +
			'<h3 style="margin-top:10px">' + tt('riders') + '</h3><p style="font-size:12px">' + (ridList.length ? ridList.map(esc).join('<br>') : tt('none')) + '</p></div>' +
			'<div class="a4p-card"><h3>' + tt('feat') + '</h3><ul class="a4p-feat">' +
			'<li><b>' + tt('f_death') + ':</b> ' + fmtT('fv_death', { d: inr(Math.max(r.deathSA || 0, r.sa)) }) + '</li>' +
			(r.maturity > 0 ? '<li><b>' + tt('f_mat') + ':</b> ' + inr(r.maturity) + ' (' + tt('age') + ' ' + RI.matAge + ')</li>' : '') +
			(r.survival ? '<li><b>' + tt('income') + ':</b> ' + inr(r.survival) + ' / yr (' + tt('age') + ' ' + RI.incAge + '+)</li>' : '') +
			(r.ga ? '<li><b>' + tt('f_add') + ':</b> ' + tt('m_ga') + ' ' + inr(r.ga) + '</li>' : (r.bonus ? '<li><b>' + tt('f_add') + ':</b> ' + tt('m_srb') + ' ' + inr(r.bonus + r.fab) + '</li>' : '')) +
			'<li><b>' + tt('f_tax') + ':</b> ' + tt('fv_tax') + '</li>' +
			'<li><b>' + tt('f_surr') + ':</b> ' + fmtT('fv_surr', { y: single ? 1 : (p.loan_from || 2) }).replace(/\b1 years\b/, '1 year') + '</li>' +
			'<li><b>' + tt('f_loan') + ':</b> ' + fmtT('fv_loan', { y: single ? 1 : (p.loan_from || 2) }).replace(/\b1 years\b/, '1 year') + '</li></ul></div></div>';
		pages.push(c1);

		// 2. Benefit Illustration — timeline + Maturity Details
		var c2 = '<h2 class="a4p-h">' + tt('ill') + '</h2>' +
			(V4 ? '<div class="a4p-tl"><img src="' + img(V4.timeline(r)) + '" alt=""></div>' +
				'<p class="a4p-tlleg"><i style="background:#0b4ea2"></i>' + tt('youpay') + ' <i style="background:#d9822b;opacity:.55"></i>' + tt('lcover') + ' <i style="background:#1f8f4e"></i>' + tt('youget') + ' <small>(' + tt('age') + ')</small></p>'
			: '<div class="a4p-tl"><img src="' + img(A.timelineSvg(r, GREEN, GOLD)) + '" alt=""></div>' +
			'<p class="a4p-tlleg"><i style="background:' + GREEN + '"></i>' + tt('youpay') + ' <i style="background:' + GOLD + ';opacity:.4"></i>' + tt('lcover') +
			' <i style="background:' + GOLD + '"></i>' + tt('youget') + ' <small>(' + tt('age') + ')</small></p>') +
			'<h3>' + tt('md') + '</h3><table class="a4p-t a4p-kv2"><tbody>' + A.maturityRows(r, tt).map(function (q) { return kv(q[0], q[1]); }).join('') + '</tbody></table>' +
			(r.bonus || r.fab ? '<p class="a4p-note">' + tt('bonusas') + ': SRB ₹' + r.srb + (r.fabRate ? ' · FAB ₹' + r.fabRate : '') + ' — ' + tt('d2') + '</p>' : '') +
			(r.basis !== 'verified' && r.basis !== 'quote' ? '<p class="a4p-note">' + tt('est') + '</p>' : '');
		pages.push(c2);

		// 3. Premium chart — modes, दिवसाला किती, भरता vs मिळते, IRR
		var c3 = '<h2 class="a4p-h">' + tt('pchart') + '</h2>';
		if (pr.modes) {
			c3 += '<div class="a4p-modes">' + pr.modes.map(function (x) { return '<div' + (x[0] === r.mode ? ' class="sel"' : '') + '><span>' + MODES[x[0]][0] + '</span><b>' + inr(x[1]) + '</b></div>'; }).join('') + '</div>';
			c3 += '<p class="a4p-perday">' + fmtT('perday', { d: '<b>' + inr(RI.perDay) + '</b>' }) + '</p>';
		} else {
			c3 += '<div class="a4p-modes"><div class="sel"><span>' + tt('once') + '</span><b>' + inr(r.inst) + '</b></div></div>';
		}
		c3 += '<div class="a4p-pg"><div><span>' + tt('paytot') + '</span><b>' + inr(r.totalPrem) + '</b></div><div class="get"><span>' + (p.type === 'term' || p.type === 'term_sp' ? tt('lcover') : tt('gettot')) + '</span><b>' + inr(p.type === 'term' || p.type === 'term_sp' ? Math.max(r.deathSA || 0, r.sa) : r.totalBenefit) + '</b></div></div>' +
			(RI.ratio ? '<p class="a4p-every">' + fmtT('every1', { x: RI.ratio.toFixed(2) }) + '</p>' : '');
		c3 += '<table class="a4p-t"><thead><tr><th></th><th>' + tt('tben') + '</th><th>' + tt('gain') + '</th><th>' + tt('irr') + '</th></tr></thead><tbody>' +
			'<tr><td>' + tt('sc1') + '</td><td>' + inr(r.totalBenefit) + '</td><td>' + inr(r.totalBenefit - r.totalPrem) + '</td><td>' + pct(r.irr) + '</td></tr>' +
			(r.bonusCut ? '<tr><td>' + tt('sc2') + '</td><td>' + inr(r.totalBenefitLow) + '</td><td>' + inr(r.totalBenefitLow - r.totalPrem) + '</td><td>' + pct(r.irrLow) + '</td></tr>' : '') + '</tbody></table>';
		if (V4) { // v4.1 (S1): screen वरचेच charts PDF मध्ये
			var cfs = V4.cashflow(r);
			c3 += '<h3>' + tt('chart') + '</h3>' + (cfs ? '<img class="a4p-chart" src="' + img(cfs) + '" alt="">' +
				'<p class="a4p-legend"><span style="background:#0b4ea2"></span>' + tt('paid') + ' <span style="background:#1f8f4e"></span>' + tt('got') + '</p>' : '') +
				'<img class="a4p-chart" src="' + img(V4.value(r)) + '" alt="">' +
				'<p class="a4p-legend"><span style="background:#0b4ea2"></span>' + tt('paid') + ' <span style="background:#d9822b"></span>' + tt('lcover') + (r.table && r.table.some(function (x) { return x.cv > 0; }) ? ' <span style="background:#7a4bc2"></span>Surrender value' : '') + '</p>';
		} else {
		c3 += '<h3>' + tt('chart') + '</h3><img class="a4p-chart" src="' + img(chartSvg(r, GREEN, GOLD)) + '" alt="">' +
			'<p class="a4p-legend"><span style="background:' + GREEN + '"></span>' + tt('paid') + ' <span style="background:' + GOLD + '"></span>' + tt('got') + '</p>';
		}
		c3 += '<table class="a4p-t a4p-kv2" style="margin-top:8px"><tbody>' + kv(tt('pv') + ' <small>(' + fmtT('pvnote', { i: C.inflation }) + ')</small>', inr(r.pvBenefit)) + '</tbody></table>';
		if (r.taxNotes && r.taxNotes.length) { c3 += '<h3>' + tt('tax') + '</h3><ul class="a4p-notes">' + r.taxNotes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }
		pages.push(c3);

		// 4. How the plan works + Why LIC
		var acc = r.ga ? fmtT('t_acc_ga', { r: '₹' + p.ga_per_1000 }) : (r.bonus ? fmtT('t_acc_b', { r: '₹' + r.srb }) : tt('t_acc_n'));
		var matTxt = r.maturity > 0 ? fmtT('t_mat', { m: inr(r.maturity), g: RI.matAge }) : fmtT('t_mat0', { s: inr(r.survival), g: RI.incAge });
		var how = [['h_prem', single ? fmtT('t_prem1', { i: inr(r.inst) }) : fmtT('t_prem', { i: inr(r.inst), m: mName, p: r.P })],
			['h_cov', fmtT('t_cov', { a: inr(RI.coverMin), b: inr(RI.coverMax) })], ['h_mat', matTxt], ['h_acc', acc], ['h_tax', tt('t_tax')], ['h_feat', tt('t_feat')]];
		var ic = function (path) { return '<img width="34" height="34" alt="" src="' + img('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34" width="34" height="34"><circle cx="17" cy="17" r="17" fill="' + GREEN + '"/>' + path + '</svg>') + '">'; };
		var icons = [
			'<path d="M9 25h16M11 25V15m4 10V15m4 10V15m4 10V15M8 13l9-6 9 6z" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round"/>',
			'<path d="M17 7l8 3v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10v-6z" fill="none" stroke="#fff" stroke-width="2"/><path d="M13 17l3 3 5-6" stroke="#fff" stroke-width="2" fill="none"/>',
			'<circle cx="17" cy="17" r="8" fill="none" stroke="#fff" stroke-width="2"/><path d="M17 12v5l3 3" stroke="#fff" stroke-width="2" fill="none"/>',
			'<circle cx="17" cy="17" r="8" fill="none" stroke="#fff" stroke-width="2"/><path d="M9 17h16M17 9c3 3 3 13 0 16M17 9c-3 3-3 13 0 16" stroke="#fff" stroke-width="1.5" fill="none"/>'
		];
		pages.push('<h2 class="a4p-h">' + tt('how') + '</h2><div class="a4p-how">' + how.map(function (q) { return '<div><b>' + tt(q[0]) + '</b><p>' + q[1] + '</p></div>'; }).join('') + '</div>' +
			'<h2 class="a4p-h" style="margin-top:24px">' + tt('why') + '</h2><div class="a4p-why">' + ['w1', 'w2', 'w3', 'w4'].map(function (k, i) { return '<div>' + ic(icons[i]) + '<span>' + tt(k) + '</span></div>'; }).join('') + '</div>' +
			(p.type === 'anand' && p.tail_age ? '<p class="a4p-note" style="margin-top:14px">' + tt('m_coverto') + ' ' + p.tail_age + '</p>' : ''));

		// 5+. Benefit & Coverage Table (Option 1)
		var per = 34, tbl = r.table || [];
		for (var i = 0; i < tbl.length; i += per) {
			var lastPg = i + per >= tbl.length;
			pages.push('<h2 class="a4p-h">' + tt('bct') + (tbl.length > per ? ' (' + (i / per + 1) + ')' : '') + '</h2>' +
				A.benefitTableHtml(r, tt, 'a4p-t a4p-bct', i, i + per, lastPg) +
				(lastPg && r.hasCV ? '<p class="a4p-note">' + tt('cvnote') + '</p>' : '') + (lastPg && r.age < 8 ? '<p class="a4p-note">' + tt('risknote') + '</p>' : ''));
		}
		// Option 2 — Flexi income
		if (r.income === 'flexi') {
			var fx = A.flexiRows(r);
			for (var j = 0; j < fx.length; j += 36) {
				pages.push('<h2 class="a4p-h">' + tt('opt2') + '</h2><table class="a4p-t a4p-yw"><thead><tr><th>' + tt('c_yr') + '</th><th>' + tt('c_age') + '</th><th>' + tt('c_inc') + '</th><th>' + tt('c_bal') + '</th></tr></thead><tbody>' +
					fx.slice(j, j + 36).map(function (q) { return '<tr><td>' + q[0] + '</td><td>' + q[1] + '</td><td>' + inr(q[2]) + '</td><td>' + inr(q[3]) + '</td></tr>'; }).join('') + '</tbody></table>');
			}
		}

		// v3.1: Ready Reckoner पान
		var rr = A.rr && A.rr();
		if (rr && rr.r === r) {
			pages.push('<h2 class="a4p-h">' + tt('rr') + '</h2><p class="a4p-sub">' + fmtT('rrsub', { sa: inr(r.sa) }) + ' (' + (rr.single ? tt('rrsp') : tt('rryr')) + ')</p>' +
				'<table class="a4p-t a4p-rr"><thead><tr><th>' + tt('age') + ' \\ ' + tt('term') + '</th>' + (rr.labels || rr.terms).map(function (t) { return '<th>' + esc(String(t)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
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
		l += '<div class="a4p-card a4p-advisor"><div class="a4p-me">' + (BR.photo ? '<img class="ph" src="' + esc(BR.photo) + '" alt="" crossorigin="anonymous">' : '') +
			'<div><h3>' + tt('contact') + '</h3><p><b>' + esc(BR.agent || '') + '</b><br>' + esc(BR.title || BR.type || '') + (BR.type && BR.title ? ' · ' + esc(BR.type) : '') +
			(BR.code ? '<br>Agency Code: ' + esc(BR.code) + (BR.branch ? ' · Branch: ' + esc(BR.branch) : '') : '') +
			(BR.address ? '<br>' + esc(BR.address) : '') + '<br>' + esc(BR.phone || '') + (BR.email2 || BR.email ? ' · ' + esc(BR.email2 || BR.email) : '') + '<br>' + esc(BR.web || '') + '</p></div></div>' +
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
