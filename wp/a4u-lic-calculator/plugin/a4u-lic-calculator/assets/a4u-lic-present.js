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
			ill: 'Benefit Illustration', pfor: 'Prepared for', cont: 'continued', summary: 'Plan Summary', tagline: 'A secure step for a bright future', biok: 'Premium and values checked against LIC\'s official Benefit Illustration', thanks: 'Thank you for your trust. Call or WhatsApp any time.', valchart: 'Life cover and surrender value, year by year', ms_h: 'Key milestones', glance_h: 'Your money at a glance', ms_start: 'Policy starts', ms_risk: 'Full life cover starts', ms_ppt: 'Last premium', ms_ga: 'Guaranteed Additions stop', ms_inc: 'Yearly income starts', ms_mat: 'Maturity', ms_cover: 'Life cover continues', tot_inc: 'Total income', every: 'Back for every ₹1', wa_cta: 'Chat on WhatsApp', tap: 'Tap to open',  pon: 'Prepared on', pby: 'Presented by', details: 'Your plan details',
			age: 'Age', sa: 'Basic Sum Assured', term: 'Policy term', ppt: 'Premium paying term', gap: 'Guaranteed Addition period', mode: 'Payment mode', yrs: 'years', once: 'Single premium',
			glance: 'Plan at a glance', inst: 'Installment', tprem: 'Total premium payable', tben: 'Estimated total benefits', irr: 'Return (IRR, approx.)',
			bymode: 'Premium by payment mode', ytot: 'Yearly total', pdet: 'Premium details', tab: 'Tabular premium', hsa: 'High Sum Assured rebate', rider: 'Riders', gst: 'GST',
			ben: 'Benefits', g: 'Guaranteed', ng: 'Non-guaranteed', bsa: 'Basic Sum Assured on maturity', surv: 'Survival / income benefit', ga: 'Guaranteed Additions',
			srb: 'Simple Reversionary Bonus (est.)', fab: 'Final Additional Bonus (est.)', death: 'Sum Assured on death (approx.)', matage: 'Maturity at age', cover: 'Life cover till age',
			atirr: 'After-tax IRR', atn1: 'After-tax IRR assumes your {s}% income-tax slab plus 4% cess on the total gain of {g}, i.e. {t}, taken out of the benefits as you receive them. This is a simple estimate, not tax advice; the 80C benefit is not included.', atn0: 'Premium is within the Section 10(10D) limits, so maturity is expected to be tax-free (subject to conditions) and the after-tax IRR is the same as the IRR.',
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
			ill: 'लाभांचे उदाहरण (Benefit Illustration)', pfor: 'यांच्यासाठी', cont: 'पुढे चालू', summary: 'योजनेचा सारांश', tagline: 'उज्ज्वल भविष्यासाठी एक सुरक्षित पाऊल', biok: 'Premium आणि मूल्यं LIC च्या अधिकृत Benefit Illustration शी तपासलेली', thanks: 'तुमच्या विश्वासाबद्दल धन्यवाद. केव्हाही फोन किंवा WhatsApp करा.', valchart: 'दरवर्षीचं विमा संरक्षण आणि surrender मूल्य', ms_h: 'महत्त्वाचे टप्पे', glance_h: 'तुमचे पैसे एका नजरेत', ms_start: 'Policy सुरू', ms_risk: 'पूर्ण जीवन विमा सुरू', ms_ppt: 'शेवटचा हप्ता', ms_ga: 'Guaranteed Additions थांबतात', ms_inc: 'वार्षिक उत्पन्न सुरू', ms_mat: 'मुदतपूर्ती', ms_cover: 'विमा संरक्षण सुरू', tot_inc: 'एकूण उत्पन्न', every: '₹1 मागे परत', wa_cta: 'WhatsApp वर बोला', tap: 'उघडण्यासाठी दाबा',  pon: 'दिनांक', pby: 'सादरकर्ते', details: 'तुमच्या योजनेचा तपशील',
			age: 'वय', sa: 'मूळ विमा रक्कम', term: 'पॉलिसी मुदत', ppt: 'हप्ता भरण्याची मुदत', gap: 'हमी वाढ (GA) कालावधी', mode: 'हप्त्याचा प्रकार', yrs: 'वर्षे', once: 'एकरकमी हप्ता',
			glance: 'योजना एका नजरेत', inst: 'हप्ता', tprem: 'एकूण भरायचा हप्ता', tben: 'अंदाजे एकूण लाभ', irr: 'परतावा (IRR, अंदाजे)',
			bymode: 'हप्त्याच्या प्रकारानुसार रक्कम', ytot: 'वर्षाची एकूण रक्कम', pdet: 'हप्त्याचा तपशील', tab: 'मूळ (tabular) हप्ता', hsa: 'जास्त विमा रकमेवरील सूट', rider: 'रायडर', gst: 'GST',
			ben: 'लाभ', g: 'हमी असलेले', ng: 'हमी नसलेले', bsa: 'मुदतपूर्तीला मूळ विमा रक्कम', surv: 'हयातीचा / उत्पन्न लाभ', ga: 'हमी वाढ (Guaranteed Additions)',
			srb: 'साधा बोनस (अंदाजे)', fab: 'अंतिम अतिरिक्त बोनस (अंदाजे)', death: 'मृत्यू झाल्यास विमा रक्कम (अंदाजे)', matage: 'मुदतपूर्ती वय', cover: 'विमा संरक्षण या वयापर्यंत',
			atirr: 'करानंतरचा IRR', atn1: 'करानंतरचा IRR काढताना तुमचा {s}% कर slab आणि 4% cess एकूण नफ्यावर ({g}) म्हणजे {t} इतका कर मिळणाऱ्या लाभांतून त्या प्रमाणात वजा धरला आहे. हा साधा अंदाज आहे, कर सल्ला नाही; 80C ची बचत धरलेली नाही.', atn0: 'Premium कलम 10(10D) च्या मर्यादेत असल्याने मुदतपूर्तीची रक्कम करमुक्त असण्याची अपेक्षा आहे (अटींनुसार), म्हणून करानंतरचा IRR आणि IRR सारखाच आहे.',
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
			cvnote: '* रोख मूल्य = LIC चं Special Surrender Value (LIC चे factors असलेल्या plans साठी, अधिकृत Benefit Illustration शी तपासलेलं); नाहीतर किमान हमी समर्पण मूल्य (GSV). कर्ज = brochure नुसार त्याची ठरावीक टक्केवारी.', c_rcv: 'आत्तापर्यंत मिळालं',
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
			fv_death: 'किमान {d} (भरलेल्या प्रीमियमच्या 105% पेक्षा कमी नाही)', fv_tax: 'कलम 80C व 10(10D), अटींनुसार', fv_surr: '{y} वर्षांनंतर उपलब्ध', fv_loan: '{y} वर्षांनंतर, समर्पण मूल्यावर उपलब्ध', fv_surr_any: 'Policy च्या मुदतीत कधीही', tx_10: 'Premium विमा रकमेच्या 10% पेक्षा जास्त: कलम 80C ची वजावट (जुनी कर पद्धत) फक्त वर्षाला ₹{c} वर, आणि maturity, उत्पन्न व surrender ची रक्कम करपात्र (कलम 10(10D) ची सूट नाही).', tx_10_sp: 'Premium विमा रकमेच्या 10% पेक्षा जास्त: कलम 80C ची वजावट (जुनी कर पद्धत) फक्त ₹{c} वर, आणि maturity, उत्पन्न व surrender ची रक्कम करपात्र (कलम 10(10D) ची सूट नाही).', tx_5l: 'वर्षाचा premium ₹5 लाखांपेक्षा जास्त: 1 एप्रिल 2023 नंतरच्या policies मध्ये maturity आणि उत्पन्न करपात्र.', tx_5l_info: '1 एप्रिल 2023 नंतरच्या अशा सगळ्या policies चा एकूण वार्षिक premium ₹5 लाखांपेक्षा जास्त झाला तर maturity करपात्र होऊ शकते.', tx_death: 'Nominee ला मिळणारा मृत्यू लाभ करमुक्त. कलमांचे क्रमांक Income-tax Act, 1961 नुसार; 1 एप्रिल 2026 पासूनच्या Income-tax Act, 2025 मध्ये असेच नियम नवीन क्रमांकांनी.', fv_tax_lim: '80C फक्त {c} वर; maturity आणि उत्पन्न करपात्र (premium कर-मुक्त मर्यादेपेक्षा जास्त); मृत्यू लाभ करमुक्त', t_tax_lim: 'Premium कर-मुक्त मर्यादेपेक्षा जास्त: 80C वजावट फक्त {c} वर; maturity आणि उत्पन्न करपात्र. मृत्यू लाभ करमुक्त.', fv_death_sp: 'किमान {d} (single premium च्या 125% पेक्षा कमी नाही) + Guaranteed Additions', fv_loan_3m: 'Policy सुरू झाल्यापासून 3 महिन्यांनी, समर्पण मूल्यावर उपलब्ध',
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
			ill: 'लाभ का उदाहरण (Benefit Illustration)', pfor: 'के लिए', cont: 'जारी', summary: 'योजना सारांश', tagline: 'उज्ज्वल भविष्य के लिए एक सुरक्षित कदम', biok: 'Premium और मूल्य LIC के आधिकारिक Benefit Illustration से जाँचे गए', thanks: 'आपके भरोसे के लिए धन्यवाद। कभी भी फ़ोन या WhatsApp करें।', valchart: 'हर साल बीमा सुरक्षा और surrender मूल्य', ms_h: 'मुख्य पड़ाव', glance_h: 'आपका पैसा एक नज़र में', ms_start: 'Policy शुरू', ms_risk: 'पूरा जीवन बीमा शुरू', ms_ppt: 'आख़िरी किस्त', ms_ga: 'Guaranteed Additions रुकते हैं', ms_inc: 'वार्षिक आय शुरू', ms_mat: 'परिपक्वता', ms_cover: 'बीमा सुरक्षा जारी', tot_inc: 'कुल आय', every: '₹1 पर वापसी', wa_cta: 'WhatsApp पर बात करें', tap: 'खोलने के लिए दबाएँ',  pon: 'दिनांक', pby: 'प्रस्तुतकर्ता', details: 'आपकी योजना का विवरण',
			age: 'आयु', sa: 'मूल बीमा राशि', term: 'पॉलिसी अवधि', ppt: 'प्रीमियम भुगतान अवधि', gap: 'गारंटीड एडिशन अवधि', mode: 'भुगतान का तरीका', yrs: 'वर्ष', once: 'एकमुश्त प्रीमियम',
			glance: 'योजना एक नज़र में', inst: 'किस्त', tprem: 'कुल देय प्रीमियम', tben: 'अनुमानित कुल लाभ', irr: 'रिटर्न (IRR, अनुमानित)',
			bymode: 'भुगतान के तरीके अनुसार प्रीमियम', ytot: 'वार्षिक कुल', pdet: 'प्रीमियम विवरण', tab: 'मूल (tabular) प्रीमियम', hsa: 'अधिक बीमा राशि पर छूट', rider: 'राइडर', gst: 'GST',
			ben: 'लाभ', g: 'गारंटीड', ng: 'गैर-गारंटीड', bsa: 'परिपक्वता पर मूल बीमा राशि', surv: 'उत्तरजीविता / आय लाभ', ga: 'गारंटीड एडिशन',
			srb: 'साधारण प्रत्यावर्ती बोनस (अनुमानित)', fab: 'अंतिम अतिरिक्त बोनस (अनुमानित)', death: 'मृत्यु पर बीमा राशि (अनुमानित)', matage: 'परिपक्वता आयु', cover: 'बीमा सुरक्षा इस आयु तक',
			atirr: 'कर के बाद IRR', atn1: 'कर के बाद IRR में आपका {s}% कर स्लैब और 4% cess कुल लाभ ({g}) यानी {t} पर, मिलने वाले लाभों से अनुपात में घटाया गया है। यह सरल अनुमान है, कर सलाह नहीं; 80C का लाभ शामिल नहीं है।', atn0: 'Premium धारा 10(10D) की सीमा में है, इसलिए परिपक्वता राशि करमुक्त होने की अपेक्षा है (शर्तों के अधीन); अतः कर के बाद IRR और IRR समान हैं।',
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
			cvnote: '* नकद मूल्य = LIC का Special Surrender Value (जिन plans के LIC factors हमारे पास हैं, आधिकारिक Benefit Illustration से जाँचा गया); अन्यथा न्यूनतम गारंटीड सरेंडर मूल्य (GSV)। ऋण = ब्रोशर के अनुसार उसका तय प्रतिशत।', c_rcv: 'अब तक मिला',
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
			fv_death: 'कम से कम {d} (भरे गए प्रीमियम के 105% से कम नहीं)', fv_tax: 'धारा 80C और 10(10D), शर्तों के अधीन', fv_surr: '{y} वर्ष बाद उपलब्ध', fv_loan: '{y} वर्ष बाद, सरेंडर मूल्य पर उपलब्ध', fv_surr_any: 'Policy अवधि में कभी भी', tx_10: 'Premium बीमा राशि के 10% से अधिक: धारा 80C की कटौती (पुरानी कर व्यवस्था) केवल साल में ₹{c} पर, और maturity, आय व surrender की राशि करयोग्य (धारा 10(10D) की छूट नहीं)।', tx_10_sp: 'Premium बीमा राशि के 10% से अधिक: धारा 80C की कटौती (पुरानी कर व्यवस्था) केवल ₹{c} पर, और maturity, आय व surrender की राशि करयोग्य (धारा 10(10D) की छूट नहीं)।', tx_5l: 'साल का premium ₹5 लाख से अधिक: 1 अप्रैल 2023 के बाद की policies में maturity और आय करयोग्य।', tx_5l_info: '1 अप्रैल 2023 के बाद की ऐसी सभी policies का कुल वार्षिक premium ₹5 लाख से अधिक हुआ तो maturity करयोग्य हो सकती है।', tx_death: 'Nominee को मिलने वाला मृत्यु लाभ करमुक्त। धाराओं के क्रमांक Income-tax Act, 1961 के अनुसार; 1 अप्रैल 2026 से Income-tax Act, 2025 में ऐसे ही नियम नए क्रमांकों से।', fv_tax_lim: '80C केवल {c} पर; maturity और आय करयोग्य (premium कर-मुक्त सीमा से अधिक); मृत्यु लाभ करमुक्त', t_tax_lim: 'Premium कर-मुक्त सीमा से अधिक: 80C कटौती केवल {c} पर; maturity और आय करयोग्य। मृत्यु लाभ करमुक्त।', fv_death_sp: 'कम से कम {d} (single premium के 125% से कम नहीं) + Guaranteed Additions', fv_loan_3m: 'Policy शुरू होने के 3 महीने बाद, सरेंडर मूल्य पर उपलब्ध',
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

	// v4.7.1: पान 1 वर branding header; पान 2 पासून पानाचं शीर्षक header मध्ये आणि branding footer मध्ये. data-href = PDF मध्ये दाबता येणारी link
	function pageWrap(inner, r, n, total) {
		var p = r.plan, head, brandFoot = '';
		var web = BR.web ? (/^https?:/.test(BR.web) ? BR.web : 'https://' + BR.web) : '', tel = String(BR.phone || '').replace(/[^0-9+]/g, '');
		var brand = inner.indexOf('<!--brand-->') === 0; // v4.8: कव्हर आणि मागचं पान — branding header
		if (brand) {
			head = '<div class="a4p-head"><img src="' + esc(BR.logo || '') + '" alt="" crossorigin="anonymous"><div><b>' + esc(BR.name || '') + '</b><span>' +
				(web ? '<a data-href="' + esc(web) + '">' + esc(BR.web) + '</a>' : '') + (tel ? ' · <a data-href="tel:' + esc(tel) + '">' + esc(BR.phone) + '</a>' : '') + '</span></div></div>';
		} else {
			var m = inner.match(/<h2 class="a4p-h"[^>]*>([\s\S]*?)<\/h2>/), title = m ? m[1] : '';
			if (m) { inner = inner.slice(0, m.index) + inner.slice(m.index + m[0].length); }
			head = '<div class="a4p-head a4p-th"><h2>' + title + '</h2><span>LIC ' + esc(p.name) + '</span></div>';
			brandFoot = '<div class="a4p-fb"><img src="' + esc(BR.logo || '') + '" alt="" crossorigin="anonymous"><b>' + esc(BR.name || '') + '</b>' +
				(web ? ' · <a data-href="' + esc(web) + '">' + esc(BR.web) + '</a>' : '') + (tel ? ' · <a data-href="tel:' + esc(tel) + '">' + esc(BR.phone) + '</a>' : '') +
				(C.whatsapp ? ' · <a class="wa" data-href="' + esc(waLink(r)) + '">' + tt('wa_cta') + '</a>' : '') + '</div>';
		}
		return '<div class="a4p a4p-l-' + lang + (brand ? ' a4p-brandpg' : '') + '">' + head +
			'<div class="a4p-body">' + inner + '</div>' +
			'<div class="a4p-foot">' + brandFoot + '<div>' + esc(BR.agent || '') + (BR.type ? ', ' + esc(BR.type) : '') + (BR.code ? ' · Agency Code: ' + esc(BR.code) : '') + (BR.branch ? ' · Branch: ' + esc(BR.branch) : '') + '</div>' +
			'<div>LIC ' + esc(p.name) + (p.uin ? ' · UIN ' + esc(p.uin) : '') + ' · ' + esc(tt('solicit')) + '</div>' +
			'<div class="a4p-pn">' + (illId ? tt('illid') + ': ' + esc(illId) + ' · ' : '') + tt('page') + ' ' + n + ' ' + tt('of') + ' ' + total + '</div></div></div>';
	}

	// v4.8: रक्कम अक्षरांत — engine (a4u-lic.js) मधून, PDF च्या भाषेत
	function inWords(v, L) { return A.inWords ? A.inWords(v, L || lang) : ''; }
	// v4.8 (S4): LIC च्या अधिकृत Benefit Illustration शी तपासलेले plans
	var BI_OK = { 714: 1, 715: 1, 717: 1, 720: 1, 733: 1, 736: 1, 745: 1, 770: 1, 771: 1, 883: 1, 894: 1 };
	function wS(v) { return '<small class="a4p-w">' + esc(inWords(v)) + '</small>'; }
	function inrW(v) { return inr(v) + '<small class="a4p-w">' + esc(inWords(v)) + '</small>'; }

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
		// v4.7: पान 1 — डावीकडे portrait फोटो (अर्धं पान), उजवीकडे योजनेचं नाव + 3 मुख्य आकडे
		var isTerm = p.type === 'term' || p.type === 'term_sp';
		var hl = [[single ? tt('once') : tt('inst'), inrW(r.inst), single ? '' : mName],
			// single premium मध्ये "एकूण भरता" = तोच आकडा — त्याऐवजी वार्षिक उत्पन्न / maturity
			single ? (r.survival ? [tt('income'), inr(r.survival) + ' / yr' + wS(r.survival), tt('age') + ' ' + RI.incAge + '+'] : [tt('f_mat'), inrW(r.maturity), tt('age') + ' ' + RI.matAge]) : [tt('paytot'), inrW(r.totalPrem), r.P + yrs],
			[isTerm ? tt('lcover') : tt('gettot'), inrW(isTerm ? Math.max(r.deathSA || 0, r.sa) : r.totalBenefit), r.maturity > 0 && !(single && !r.survival) ? tt('f_mat') + ' ' + inr(r.maturity) : '']];
		// v4.8: कव्हर पान — branding header, पूर्ण फोटो (कापणी नाही), खाली नाव
		if (coverImg) {
			pages.push('<!--brand--><div class="a4p-cover2"><div class="a4p-cphoto' + (theme === 'custom' ? '' : ' art') + '"><div class="ph"><img src="' + esc(coverImg) + '" alt="">' +
				(qr ? '<div class="a4p-cqr" data-href="' + esc(waLink(r)) + '"><img src="' + qr + '" alt=""><span>' + tt('wa_cta') + '</span></div>' : '') + '</div></div>' +
				'<div class="a4p-cname">' + (clientName ? '<small>' + tt('pfor') + '</small><h1>' + esc(clientName) + '</h1>' : '<h1>LIC\'s ' + esc(p.name) + '</h1>') +
				'<i></i><p class="pl">' + (clientName ? 'LIC\'s ' + esc(p.name) + ' · ' : '') + tt('ill') + '</p><p class="tgl">' + tt('tagline') + '</p><p class="dt">' + tt('pon') + ' ' + today + '</p></div></div>');
		}
		var fImg = frontImg();
		var c1 = '<h2 class="a4p-h">' + tt('summary') + '</h2><div class="a4p-fill"><div class="a4p-hero' + (fImg ? '' : ' noimg') + '">' +
			(fImg ? '<div class="a4p-photo' + (frontMode === 'same' && theme !== 'custom' ? ' art' : '') + '"><div class="ph"><img src="' + esc(fImg) + '" alt=""></div>' + (clientName ? '<div class="a4p-pfor"><span>' + tt('pfor') + '</span><b>' + esc(clientName) + '</b><small>' + tt('age') + ' ' + r.age + ' · ' + tt('pon') + ' ' + today + '</small></div>' : '') + '</div>' : '') + // v4.9.1 (S1): 'Prepared for' आणि 'Total you get' एकाच design मध्ये, एकाच ओळीत
			'<div class="a4p-intro"><div class="a4p-plan"><h1>LIC\'s ' + esc(p.name) + '</h1><span class="no">(Plan No: ' + esc(p.id) + (p.uin ? ' · UIN ' + esc(p.uin) : '') + ')</span></div>' +
			'<p class="a4p-cust">' + (clientName ? tt('custom') + ' <b>' + esc(clientName) + '</b><br>' : '') + tt('age') + ' ' + r.age + (r.gender ? ' · ' + (r.gender === 'F' ? 'Female' : 'Male') : '') + ' · ' + tt('pon') + ' ' + today + '</p>' +
			'<p class="a4p-desc">' + tt('d_' + p.type) + '</p>' +
			'<div class="a4p-hl">' + hl.map(function (x, i) { return '<div class="h' + i + '"><span>' + x[0] + '</span><b>' + x[1] + '</b>' + (x[2] ? '<small>' + x[2] + '</small>' : '') + '</div>'; }).join('') + '</div></div></div>' +
			'<div class="a4p-2col"><div class="a4p-card"><h3>' + tt('plandet') + '</h3><table class="a4p-kv">' +
			kv(tt('sa'), inr(r.sa)) + kv(termLbl, termVal) + (single ? '' : kv(tt('ppt'), r.P + yrs)) + kv(tt('mode'), mName) +
			kv(single ? tt('once') : tt('inst'), '<b>' + inr(r.inst) + '</b>') + kv(tt('doc'), r.docText) + kv(tt('matdate'), r.matText) + '</table>' +
			'<h3 style="margin-top:10px">' + tt('riders') + '</h3><p style="font-size:12px">' + (ridList.length ? ridList.map(esc).join('<br>') : tt('none')) + '</p></div>' +
			'<div class="a4p-card"><h3>' + tt('feat') + '</h3><ul class="a4p-feat">' +
			'<li><b>' + tt('f_death') + ':</b> ' + fmtT(single ? 'fv_death_sp' : 'fv_death', { d: inr(Math.max(r.deathSA || 0, r.sa)) }) + '</li>' +
			(r.maturity > 0 ? '<li><b>' + tt('f_mat') + ':</b> ' + inr(r.maturity) + ' (' + tt('age') + ' ' + RI.matAge + ')</li>' : '') +
			(r.survival ? '<li><b>' + tt('income') + ':</b> ' + inr(r.survival) + ' / yr (' + tt('age') + ' ' + RI.incAge + '+)</li>' : '') +
			(r.ga ? '<li><b>' + tt('f_add') + ':</b> ' + tt('m_ga') + ' ' + inr(r.ga) + '</li>' : (r.bonus ? '<li><b>' + tt('f_add') + ':</b> ' + tt('m_srb') + ' ' + inr(r.bonus + r.fab) + '</li>' : '')) +
			'<li><b>' + tt('f_tax') + ':</b> ' + (r.taxLim ? fmtT('fv_tax_lim', { c: inr(r.taxCap) }) : tt('fv_tax')) + '</li>' +
			// v4.6.5: 883 brochure — surrender कधीही, कर्ज 3 महिन्यांनी
			'<li><b>' + tt('f_surr') + ':</b> ' + (single && p.loan_from === 1 ? tt('fv_surr_any') : fmtT('fv_surr', { y: single ? 1 : (p.surr_after || p.loan_from || 2) }).replace(/\b1 years\b/, '1 year')) + '</li>' +
			'<li><b>' + tt('f_loan') + ':</b> ' + (single && p.loan_from === 1 ? tt('fv_loan_3m') : fmtT('fv_loan', { y: single ? 1 : (p.loan_after || p.loan_from || 2) }).replace(/\b1 years\b/, '1 year')) + '</li></ul></div></div></div>';
		pages.push(c1);

		// 2. Benefit Illustration — timeline + Maturity Details
		// v4.7.1: टप्पे आणि एका नजरेत आकडे
		var ms = [[r.age, tt('ms_start'), (single ? tt('once') + ' ' : '') + inr(r.inst), 'out']];
		if (r.age < 8) { ms.push([r.age + Math.min(2, 8 - r.age), tt('ms_risk'), inr(Math.max(r.deathSA || 0, r.sa)), 'cov']); }
		if (!single && r.P > 1) { ms.push([r.age + r.P - 1, tt('ms_ppt'), inr(r.inst), 'out']); }
		if (r.ga && RI.gaYears) { ms.push([r.age + RI.gaYears, tt('ms_ga'), inr(r.ga), 'cov']); }
		if (r.survival && RI.incAge) { ms.push([RI.incAge, tt('ms_inc'), inr(r.survival) + ' / yr', 'in']); }
		if (r.maturity > 0) { ms.push([RI.matAge, tt('ms_mat'), inr(r.maturity), 'in']); } else if (isTerm) { ms.push([RI.coverTo, tt('lcover'), inr(Math.max(r.deathSA || 0, r.sa)), 'cov']); }
		ms.sort(function (a, b) { return a[0] - b[0]; });
		var glance = [[tt('paytot'), inrW(r.totalPrem)]];
		if (r.totalSurv) { glance.push([tt('tot_inc'), inrW(r.totalSurv)]); }
		glance.push([isTerm ? tt('lcover') : tt('gettot'), inrW(isTerm ? Math.max(r.deathSA || 0, r.sa) : r.totalBenefit)]);
		if (!isTerm && RI.ratio) { glance.push([tt('every'), '₹' + RI.ratio.toFixed(2)]); }
		if (!isTerm && r.irr) { glance.push([tt('irr'), pct(r.irr)]); }
		glance = glance.slice(0, 4);
		var c2 = '<h2 class="a4p-h">' + tt('ill') + '</h2>' +
			(V4 ? '<div class="a4p-tl"><img src="' + img(V4.timeline(r)) + '" alt=""></div>' +
				'<p class="a4p-tlleg"><i style="background:#0b4ea2"></i>' + tt('youpay') + ' <i style="background:#d9822b;opacity:.55"></i>' + tt('lcover') + ' <i style="background:#1f8f4e"></i>' + tt('youget') + ' <small>(' + tt('age') + ')</small></p>'
			: '<div class="a4p-tl"><img src="' + img(A.timelineSvg(r, GREEN, GOLD)) + '" alt=""></div>' +
			'<p class="a4p-tlleg"><i style="background:' + GREEN + '"></i>' + tt('youpay') + ' <i style="background:' + GOLD + ';opacity:.4"></i>' + tt('lcover') +
			' <i style="background:' + GOLD + '"></i>' + tt('youget') + ' <small>(' + tt('age') + ')</small></p>') +
			// v4.7.1: पान 2 — एका नजरेत 4 आकडे + टप्पे (timeline) आणि मुदतपूर्ती तपशील दोन स्तंभांत
			'<div class="a4p-glance">' + glance.map(function (g, i) { return '<div class="g' + i + '"><span>' + g[0] + '</span><b>' + g[1] + '</b></div>'; }).join('') + '</div>' +
			'<div class="a4p-2c2"><div><h3>' + tt('ms_h') + '</h3><ol class="a4p-ms">' + ms.map(function (q) { return '<li class="' + q[3] + '"><i>' + tt('age') + ' ' + q[0] + '</i><b>' + q[1] + '</b>' + (q[2] ? '<span>' + q[2] + '</span>' : '') + '</li>'; }).join('') + '</ol></div>' +
			'<div><h3>' + tt('md') + '</h3><table class="a4p-t a4p-kv2"><tbody>' + A.maturityRows(r, tt).map(function (q) { return kv(q[0], q[1]); }).join('') + '</tbody></table></div></div>' +
			(r.bonus || r.fab ? '<p class="a4p-note">' + tt('bonusas') + ': SRB ₹' + r.srb + (r.fabRate ? ' · FAB ₹' + r.fabRate : '') + ' — ' + tt('d2') + '</p>' : '') +
			(BI_OK[p.id] ? '<p class="a4p-note a4p-ok">✓ ' + tt('biok') + '</p>' : (r.basis !== 'verified' && r.basis !== 'quote' ? '<p class="a4p-note">' + tt('est') + '</p>' : ''));
		// v4.7.1: policy value chart पान 3 वरून पान 2 वर (पान 2 रिकामं वाटू नये, पान 3 भरगच्च होतं)
		var valHtml = V4 ? '<h3 style="margin-top:18px">' + tt('valchart') + '</h3>' + '<img class="a4p-chart" src="' + img(V4.value(r)) + '" alt="">' +
				'<p class="a4p-legend"><span style="background:#0b4ea2"></span>' + tt('paid') + ' <span style="background:#d9822b"></span>' + tt('lcover') + (r.table && r.table.some(function (x) { return x.cv > 0; }) ? ' <span style="background:#7a4bc2"></span>Surrender value' : '') + '</p>' : '';
		// 5 पेक्षा कमी टप्पे असतील तर पान 2 वर जागा पुरते; नाहीतर पान 3 वर
		var valOn2 = ms.length <= 4;
		if (valOn2) { c2 += valHtml; }
		pages.push(c2);

		// 3. Premium chart — modes, दिवसाला किती, भरता vs मिळते, IRR
		var c3 = '<h2 class="a4p-h">' + tt('pchart') + '</h2>';
		if (pr.modes) {
			c3 += '<div class="a4p-modes">' + pr.modes.map(function (x) { return '<div' + (x[0] === r.mode ? ' class="sel"' : '') + '><span>' + MODES[x[0]][0] + '</span><b>' + inr(x[1]) + '</b></div>'; }).join('') + '</div>';
			c3 += '<p class="a4p-perday">' + fmtT('perday', { d: '<b>' + inr(RI.perDay) + '</b>' }) + '</p>';
		} else {
			c3 += '<div class="a4p-modes"><div class="sel"><span>' + tt('once') + '</span><b>' + inr(r.inst) + '</b></div></div>';
		}
		c3 += '<div class="a4p-pg"><div><span>' + tt('paytot') + '</span><b>' + inrW(r.totalPrem) + '</b></div><div class="get"><span>' + (p.type === 'term' || p.type === 'term_sp' ? tt('lcover') : tt('gettot')) + '</span><b>' + inr(p.type === 'term' || p.type === 'term_sp' ? Math.max(r.deathSA || 0, r.sa) : r.totalBenefit) + wS(p.type === 'term' || p.type === 'term_sp' ? Math.max(r.deathSA || 0, r.sa) : r.totalBenefit) + '</b></div></div>' +
			(RI.ratio ? '<p class="a4p-every">' + fmtT('every1', { x: RI.ratio.toFixed(2) }) + '</p>' : '');
		var showAT = r.taxSlab > 0 && r.irr !== null && r.irr !== undefined && r.irrTax !== null && r.irrTax !== undefined && !isTerm; // v4.9.2: करानंतरचा IRR
		c3 += '<table class="a4p-t"><thead><tr><th></th><th>' + tt('tben') + '</th><th>' + tt('gain') + '</th><th>' + tt('irr') + '</th>' + (showAT ? '<th>' + tt('atirr') + '</th>' : '') + '</tr></thead><tbody>' +
			'<tr><td>' + tt('sc1') + '</td><td>' + inr(r.totalBenefit) + '</td><td>' + inr(r.totalBenefit - r.totalPrem) + '</td><td>' + pct(r.irr) + '</td>' + (showAT ? '<td>' + pct(r.irrTax) + '</td>' : '') + '</tr>' +
			(r.bonusCut ? '<tr><td>' + tt('sc2') + '</td><td>' + inr(r.totalBenefitLow) + '</td><td>' + inr(r.totalBenefitLow - r.totalPrem) + '</td><td>' + pct(r.irrLow) + '</td>' + (showAT ? '<td>' + pct(r.irrLowTax) + '</td>' : '') + '</tr>' : '') + '</tbody></table>' +
			(showAT ? '<p class="a4p-note">' + (r.taxExempt ? tt('atn0') : fmtT('atn1', { s: r.taxSlab, g: inr(r.taxGain), t: inr(r.taxAmt) })) + '</p>' : '');
		var c4xTail = '';
		if (V4) { // v4.1 (S1): screen वरचेच charts PDF मध्ये
			var cfs = V4.cashflow(r);
			// v4.9.1 (S3): हा chart "How the plan works" पानाच्या रिकाम्या खालच्या भागात; इथे फक्त value chart
			var cfHtml = cfs ? '<h3 style="margin-top:16px">' + tt('chart') + '</h3><img class="a4p-chart a4p-chart-s" src="' + img(cfs) + '" alt="">' +
				'<p class="a4p-legend"><span style="background:#0b4ea2"></span>' + tt('paid') + ' <span style="background:#1f8f4e"></span>' + tt('got') + '</p>' : '';
			// कराच्या टीपा लांब असतील (taxLim) तर How पानावर जागा नसते — तेव्हा chart इथेच, value chart खाली
			c3 += valOn2 ? cfHtml : valHtml + (r.taxLim ? cfHtml : '');
			if (!valOn2 && !r.taxLim) { c4xTail = cfHtml; }
		} else {
		c3 += '<h3>' + tt('chart') + '</h3><img class="a4p-chart" src="' + img(chartSvg(r, GREEN, GOLD)) + '" alt="">' +
			'<p class="a4p-legend"><span style="background:' + GREEN + '"></span>' + tt('paid') + ' <span style="background:' + GOLD + '"></span>' + tt('got') + '</p>';
		}
		// v4.6.8: पान 3 भरलेलं असतं (charts) — आजचं मूल्य + कर टीप पान 4 वर हलवले (आधी पानाबाहेर कापले जात होते)
		var c4x = '';
		c4x += '<table class="a4p-t a4p-kv2" style="margin-top:20px"><tbody>' + kv(tt('pv') + ' <small>(' + fmtT('pvnote', { i: C.inflation }) + ')</small>', inr(r.pvBenefit)) + '</tbody></table>';
		if (r.taxNotes && r.taxNotes.length) { c4x += '<h3>' + tt('tax') + '</h3><ul class="a4p-notes">' + (r.taxKeys || []).map(function (k) { return '<li>' + esc(fmtT(k[0], k[1])) + '</li>'; }).join('') /* v4.6.8: मराठी/हिंदी */ + '</ul>'; }
		pages.push(c3);

		// 4. How the plan works + Why LIC
		var acc = r.ga ? fmtT('t_acc_ga', { r: '₹' + p.ga_per_1000 }) : (r.bonus ? fmtT('t_acc_b', { r: '₹' + r.srb }) : tt('t_acc_n'));
		var matTxt = r.maturity > 0 ? fmtT('t_mat', { m: inr(r.maturity), g: RI.matAge }) : fmtT('t_mat0', { s: inr(r.survival), g: RI.incAge });
		var how = [['h_prem', single ? fmtT('t_prem1', { i: inr(r.inst) }) : fmtT('t_prem', { i: inr(r.inst), m: mName, p: r.P })],
			['h_cov', fmtT('t_cov', { a: inr(RI.coverMin), b: inr(RI.coverMax) })], ['h_mat', matTxt], ['h_acc', acc], ['h_tax', r.taxLim ? fmtT('t_tax_lim', { c: inr(r.taxCap) }) : tt('t_tax')], ['h_feat', tt('t_feat')]];
		// v4.7: "How the plan works" — वर 3 टप्प्यांचा प्रवास (भरता → वाढतं → मिळतं), खाली क्रमांक + icon असलेली कार्डं; "Why LIC" काढलं
		var ico = function (path, bg) { return '<img width="40" height="40" alt="" src="' + img('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="20" fill="' + bg + '"/>' + path + '</svg>') + '">'; };
		var W = 'stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"';
		var howIcons = [
			'<path d="M14 12h12M14 17h12M20 17c4 0 6 2 6 4s-2 4-6 4h-3l8 7" ' + W + '/>',
			'<path d="M20 9l9 3.5v6.5c0 6-4 9.5-9 11.5-5-2-9-5.5-9-11.5v-6.5z" ' + W + '/><path d="M16 20l3 3 5-6" ' + W + '/>',
			'<path d="M12 29h16M14 29V19h12v10M11 19h18v-4H11zM20 15v14M20 15c-2-4-7-4-6-1s6 1 6 1c2-4 7-4 6-1s-6 1-6 1" ' + W + '/>',
			'<path d="M11 28l6-7 5 4 8-11M24 14h6v6" ' + W + '/>',
			'<path d="M14 10h9l5 5v15H14zM23 10v5h5M17 20h8M17 24h8" ' + W + '/>',
			'<circle cx="16" cy="22" r="5" ' + W + '/><path d="M20 19l9-9M26 13l3 3M23 16l2 2" ' + W + '/>'
		];
		var grow = r.ga ? inrW(r.ga) : (r.bonus || r.fab ? inrW(r.bonus + r.fab) : '');
		var flow = [[tt('youpay'), inrW(r.totalPrem), single ? tt('once') : r.P + yrs], [tt('h_acc'), grow || '—', r.ga ? tt('m_ga') : (r.bonus ? tt('m_srb') : '')], [tt('youget'), inrW(isTerm ? Math.max(r.deathSA || 0, r.sa) : r.totalBenefit), isTerm ? tt('lcover') : '']];
		var cols = ['#0b4ea2', GREEN, '#1f8f4e', '#d9822b', '#7a4fa0', GOLD];
		pages.push('<h2 class="a4p-h">' + tt('how') + '</h2>' +
			'<div class="a4p-flow">' + flow.map(function (f, i) { return (i ? '<i>&#10140;</i>' : '') + '<div class="f' + i + '"><span>' + (i + 1) + '</span><em>' + f[0] + '</em><b>' + f[1] + '</b>' + (f[2] ? '<small>' + f[2] + '</small>' : '') + '</div>'; }).join('') + '</div>' +
			'<div class="a4p-how2">' + how.map(function (q, i) { return '<div style="--c:' + cols[i] + '">' + ico(howIcons[i], cols[i]) + '<div><b><span>' + (i + 1) + '</span>' + tt(q[0]) + '</b><p>' + q[1] + '</p></div></div>'; }).join('') + '</div>' +
			(p.type === 'anand' && p.tail_age ? '<p class="a4p-note" style="margin-top:14px">' + tt('m_coverto') + ' ' + p.tail_age + '</p>' : '') + c4x + c4xTail);

		// 5+. Benefit & Coverage Table (Option 1)
		var per = 34, tbl = r.table || [];
		// v4.9.1 (S2): शेवटच्या तक्त्याच्या पानावर जागा असेल तर notes तिथेच — वेगळं रिकामं पान नको
		var notesHtml = '<h3 class="a4p-nh">' + tt('notes') + '</h3><ol class="a4p-notes"><li>' + tt('d1') + '</li><li>' + tt('d2') + '</li><li>' + fmtT('d3', { no: p.id, uin: p.uin || '—' }) + '</li><li>' + tt('d4') + '</li></ol>';
		var notesOnTbl = !!BR.photo_full && !(lastCmp && lastCmp.a === r) && r.income !== 'flexi' && (tbl.length % per || per) <= per - 10;
		for (var i = 0; i < tbl.length; i += per) {
			var lastPg = i + per >= tbl.length;
			pages.push('<h2 class="a4p-h">' + tt('bct') + (i > 0 ? ' (' + tt('cont') + ')' : '') + '</h2>' +
				A.benefitTableHtml(r, tt, 'a4p-t a4p-bct', i, i + per, lastPg) +
				(lastPg && r.hasCV ? '<p class="a4p-note">' + tt('cvnote') + '</p>' : '') + (lastPg && r.age < 8 ? '<p class="a4p-note">' + tt('risknote') + '</p>' : '') + (lastPg && notesOnTbl ? notesHtml : ''));
		}
		// Option 2 — Flexi income
		if (r.income === 'flexi') {
			var fx = A.flexiRows(r);
			for (var j = 0; j < fx.length; j += 36) {
				pages.push('<h2 class="a4p-h">' + tt('opt2') + (j > 0 ? ' (' + tt('cont') + ')' : '') + '</h2><table class="a4p-t a4p-yw"><thead><tr><th>' + tt('c_yr') + '</th><th>' + tt('c_age') + '</th><th>' + tt('c_inc') + '</th><th>' + tt('c_bal') + '</th></tr></thead><tbody>' +
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
		var l = '<div class="a4p-fill"><div>';
		if (lastCmp && lastCmp.a === r) {
			var b = lastCmp.b;
			var rowsC = [[tt('sa'), function (x) { return inr(x.sa); }], [tt('term') + ' / ' + tt('ppt'), function (x) { return x.T + ' / ' + (SINGLE[x.plan.type] ? '1' : x.P); }],
				[tt('inst'), function (x) { return inr(x.inst); }], [tt('tprem'), function (x) { return inr(x.totalPrem); }], [tt('tben'), function (x) { return inr(x.totalBenefit); }],
				[tt('sc2'), function (x) { return inr(x.totalBenefitLow); }], [tt('irr'), function (x) { return pct(x.irr); }]];
			l += '<h2 class="a4p-h">' + tt('cmp') + '</h2><table class="a4p-t"><thead><tr><th></th><th>' + esc(r.plan.name) + '</th><th>' + esc(b.plan.name) + '</th></tr></thead><tbody>' +
				rowsC.map(function (q) { return '<tr><td>' + q[0] + '</td><td>' + q[1](r) + '</td><td>' + q[1](b) + '</td></tr>'; }).join('') + '</tbody></table>';
		}
		if (!notesOnTbl) { l += '<h2 class="a4p-h">' + tt('notes') + '</h2>' + notesHtml.replace(/^<h3[^>]*>[\s\S]*?<\/h3>/, ''); }
		if (BR.photo_full) {
			// v4.8: मागचं पान — advisor चा पूर्ण फोटो + संपर्क (notes पानावर वेगळं card नको)
			l += '</div></div>';
			if (!notesOnTbl) { pages.push(l); }
			var web2 = BR.web ? (/^https?:/.test(BR.web) ? BR.web : 'https://' + BR.web) : '', tel2 = String(BR.phone || '').replace(/[^0-9+]/g, ''), em = BR.email2 || BR.email || '';
			l = '<!--brand--><div class="a4p-back"><div class="a4p-bphoto"><img src="' + esc(BR.photo_full) + '" alt="" crossorigin="anonymous"></div>' +
				'<div class="a4p-bname"><small>' + tt('contact') + '</small><h1>' + esc(BR.agent || '') + '</h1><i></i>' +
				'<p class="ti">' + esc(BR.title || BR.type || '') + (BR.type && BR.title ? '<br>' + esc(BR.type) : '') + '</p>' +
				'<ul>' + (BR.code ? '<li>Agency Code: <b>' + esc(BR.code) + '</b>' + (BR.branch ? ' · Branch: <b>' + esc(BR.branch) + '</b>' : '') + '</li>' : '') +
				(tel2 ? '<li><a data-href="tel:' + esc(tel2) + '">📞 ' + esc(BR.phone) + '</a></li>' : '') + (em ? '<li><a data-href="mailto:' + esc(em) + '">✉ ' + esc(em) + '</a></li>' : '') +
				(web2 ? '<li><a data-href="' + esc(web2) + '">🌐 ' + esc(BR.web) + '</a></li>' : '') + (BR.address ? '<li>📍 ' + esc(BR.address) + '</li>' : '') + '</ul>' +
				(qr ? '<div class="a4p-bqr" data-href="' + esc(waLink(r)) + '"><img src="' + qr + '" alt=""><span>' + tt('scan') + '</span><em>' + tt('wa_cta') + '</em></div>' : '') +
				'<p class="ty">' + tt('thanks') + '</p></div></div>';
		} else {
		l += '</div><div class="a4p-card a4p-advisor"><div class="a4p-me">' + (BR.photo ? '<img class="ph" src="' + esc(BR.photo) + '" alt="" crossorigin="anonymous">' : '') +
			'<div><h3>' + tt('contact') + '</h3><p><b>' + esc(BR.agent || '') + '</b><br>' + esc(BR.title || BR.type || '') + (BR.type && BR.title ? ' · ' + esc(BR.type) : '') +
			(BR.code ? '<br>Agency Code: ' + esc(BR.code) + (BR.branch ? ' · Branch: ' + esc(BR.branch) : '') : '') +
			(BR.address ? '<br>' + esc(BR.address) : '') + '<br>' + esc(BR.phone || '') + (BR.email2 || BR.email ? ' · ' + esc(BR.email2 || BR.email) : '') + '<br>' + esc(BR.web || '') + '</p></div></div>' +
			(qr ? '<div class="a4p-qr" data-href="' + esc(waLink(r)) + '"><img src="' + qr + '" alt=""><span>' + tt('scan') + '</span><em>' + tt('wa_cta') + '</em></div>' : '') + '</div></div>';
		}
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
				'<select data-pv="front" aria-label="Front page photo"><option value="same">Front: same as cover</option><option value="custom">Front: My image…</option><option value="none">Front: No photo</option></select>' +
				'<input data-pv="ffile" type="file" accept="image/png,image/jpeg,image/webp" hidden>' +
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
			// v4.8.1: पुढच्या (सारांश) पानासाठी वेगळा फोटो
			var fr = modal.querySelector('[data-pv="front"]');
			fr.value = frontMode === 'custom' && !frontCustom ? 'same' : frontMode;
			fr.addEventListener('change', function () {
				if (this.value === 'custom') { modal.querySelector('[data-pv="ffile"]').click(); return; }
				frontMode = this.value; lsSet('a4u_lic_front', frontMode); renderPreview();
			});
			modal.querySelector('[data-pv="ffile"]').addEventListener('change', function () {
				var fl = this.files && this.files[0];
				if (!fl) { fr.value = frontMode; return; }
				if (fl.size > 4 * 1024 * 1024) { pvMsg('Image is too large (max 4 MB).'); fr.value = frontMode; return; }
				shrinkImage(fl).then(function (url) {
					frontCustom = url; frontMode = 'custom';
					lsSet('a4u_lic_front_img', url); lsSet('a4u_lic_front', 'custom'); renderPreview();
				}, function () { pvMsg('Could not read this image.'); fr.value = frontMode; });
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
	// v4.8.1: फोटो कधीच कापला / धूसर केला जात नाही — img ला फक्त कमाल रुंदी-उंची (स्वतःच्या प्रमाणात)
	var frontMode = lsGet('a4u_lic_front', 'same'), frontCustom = lsGet('a4u_lic_front_img', '');
	function frontImg() { return frontMode === 'none' ? '' : (frontMode === 'custom' ? frontCustom : coverImg); }
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
					// v4.8: आधी फोटोची मधली आडवी पट्टी (38%) कापली जायची — म्हणून चेहरा कापला जात होता.
					// आता पूर्ण फोटो, फक्त मोठी बाजू 1600px पर्यंत लहान; browser EXIF प्रमाणे फोटो सरळ करतो
					var sc = Math.min(1, 1600 / Math.max(im.width, im.height)), w = Math.round(im.width * sc), h = Math.round(im.height * sc);
					var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
					cv.getContext('2d').drawImage(im, 0, 0, w, h);
					res(cv.toDataURL('image/jpeg', 0.85));
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
		return 'LIC-' + r.plan.id + (who ? '-' + who : '-Illustration') + '.pdf'; // v4.9 (S3): साधं नाव
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
			// v4.6.2: font पूर्ण load होईपर्यंत थांबा — नाहीतर पहिल्या पानावर शब्द एकमेकांत घुसतात (html2canvas माप वेगळ्या font ने घेतं)
			var fontsReady = function () {
				var fs = document.fonts;
				if (!fs || !fs.ready) { return Promise.resolve(); }
				var ff = getComputedStyle(host.querySelector('.a4p') || host).fontFamily;
				return Promise.all(['400', '600', '700'].map(function (w) { return fs.load(w + ' 16px ' + ff, 'Aa₹अ').catch(function () {}); })) // v4.9: इंग्रजी + देवनागरी font (plugin मधलाच)
					.then(function () { return fs.ready; })
					.then(function () { return new Promise(function (res) { requestAnimationFrame(function () { requestAnimationFrame(res); }); }); });
			};
			return Promise.all(ready).then(fontsReady).then(function () {
				var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
				var pages = host.querySelectorAll('.a4p'), chain = Promise.resolve();
				Array.prototype.forEach.call(pages, function (pg, i) {
					chain = chain.then(function () {
						pvMsg('Creating page ' + (i + 1) + ' of ' + pages.length + '…');
						// v4.7.1: दाबता येणाऱ्या links (website, फोन, WhatsApp) — image वर PDF link क्षेत्र
						var base = pg.getBoundingClientRect(), k = 210 / base.width;
						var links = Array.prototype.map.call(pg.querySelectorAll('[data-href]'), function (a) { var b = a.getBoundingClientRect(); return [b.left - base.left, b.top - base.top, b.width, b.height, a.getAttribute('data-href')]; });
						var hd = pg.querySelector('.a4p-th h2');
						// v4.9: फोटो असलेली पानं 1.6x, बाकी 1.35x — PDF जवळजवळ अर्धी हलकी
						var hasPhoto = !!pg.querySelector('.a4p-cphoto, .a4p-photo, .a4p-bphoto');
						return window.html2canvas(pg, { scale: hasPhoto ? 1.6 : 1.35, backgroundColor: '#ffffff', useCORS: true, logging: false, windowWidth: 794 }).then(function (cv) {
							if (i) { pdf.addPage(); }
							pdf.addImage(cv.toDataURL('image/jpeg', hasPhoto ? 0.86 : 0.8), 'JPEG', 0, 0, 210, 297);
							links.forEach(function (l) { if (l[2] > 0 && l[3] > 0) { pdf.link(l[0] * k, l[1] * k, l[2] * k, l[3] * k, { url: l[4] }); } });
							// PDF bookmarks — बाजूच्या पट्टीतून थेट पानावर
							if (pdf.outline) { try { pdf.outline.add(null, i ? (hd ? hd.textContent : 'Page ' + (i + 1)) : 'LIC ' + r.plan.name, { pageNumber: i + 1 }); } catch (x) { /* जुनं jsPDF */ } }
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
