<?php
// A4U LIC Calculator v4 — LIC tools: तुलना, revival, bonus दर, शाखा, सेवा
if ( ! defined( 'ABSPATH' ) ) { exit; }

function a4u_lic_tool_head( $k ) {
	$t = a4u_lic_tools()[ $k ];
	return '<nav class="a4h-crumb" aria-label="Breadcrumb"><a href="' . esc_url( home_url( '/' ) ) . '">Home</a> › <a href="' . esc_url( home_url( '/' . a4u_lic_hub_slug() . '/' ) ) . '">LIC Plans</a> › <span>' . esc_html( $t[0] ) . '</span></nav>' .
		'<header class="a4h-hero"><p class="a4h-kicker">LIC tools</p><h1>' . esc_html( $t[0] ) . '</h1><p class="a4h-lede">' . esc_html( $t[1] ) . '</p>' .
		'<div class="a4h-langs" role="group" aria-label="Language"><button type="button" data-lang="en" class="on">English</button><button type="button" data-lang="mr">मराठी</button><button type="button" data-lang="hi">हिंदी</button></div></header>';
}

function a4u_lic_render_tool( $k, $with_head = true ) {
	$h = $with_head ? a4u_lic_tool_head( $k ) : '';
	switch ( $k ) {
		case 'premium-calculator':
			$h .= '<section class="a4h-box" id="a4h-calc">' . do_shortcode( '[a4u_lic_calculator]' ) . '</section>';
			break;
		case 'compare-plans':
			$h .= a4u_lic_compare_html();
			break;
		case 'revival-calculator':
			$h .= a4u_lic_revival_html();
			break;
		case 'bonus-rates':
			$h .= a4u_lic_bonus_html();
			break;
		case 'branch-locator':
			$h .= '<section class="a4h-box a4h-branch"><div class="a4h-frow"><label><span data-a4h-i18n="bsearch">City, PIN code or branch</span><input type="search" id="a4h-bq" placeholder="e.g. Nagpur or 440001" autocomplete="off"></label><label><span data-a4h-i18n="division">Division</span><select id="a4h-bdo"><option value="">All divisions</option></select></label></div><p class="a4h-count" aria-live="polite">Loading branches…</p><div class="a4h-blist"></div></section>' .
				'<p class="a4h-note">Branch details are from LIC\'s published branch list. Please confirm timings and contact details with the branch.</p>';
			break;
		case 'lic-services':
			$h .= a4u_lic_services_html();
			break;
		case 'policy-service-guide':
			$h .= a4u_lic_service_guide_html();
			break;
	}
	$h .= a4u_lic_lead_box( a4u_lic_tools()[ $k ][0] ) . a4u_lic_disclaimer();
	return $h;
}

/* ---------- तुलना ---------- */
function a4u_lic_compare_html() {
	$opts = '';
	foreach ( a4u_lic_catalog() as $p ) {
		if ( $p['calc'] ) { $opts .= '<option value="' . esc_attr( $p['id'] ) . '">' . esc_html( $p['name'] . ' (' . $p['id'] . ')' ) . '</option>'; }
	}
	$sel = function ( $n, $def ) use ( $opts ) {
		return '<label><span>Plan ' . $n . '</span><select class="a4h-cp" data-def="' . esc_attr( $def ) . '"><option value="">— choose —</option>' . $opts . '</select></label>';
	};
	return '<section class="a4h-box a4h-compare"><div class="a4h-frow">' . $sel( 1, '736' ) . $sel( 2, '715' ) . $sel( 3, '' ) . '</div>' .
		'<div class="a4h-frow"><label><span data-a4h-i18n="age">Age</span><input type="number" id="a4h-cage" min="0" max="65" value="30"></label>' .
		'<label><span data-a4h-i18n="sa">Sum Assured (₹)</span><input type="number" id="a4h-csa" min="100000" step="25000" value="1000000"></label>' .
		'<label><span data-a4h-i18n="term">Preferred term (years)</span><input type="number" id="a4h-cterm" min="5" max="40" value="21"></label>' .
		'<button type="button" class="a4h-btn" id="a4h-cgo" data-a4h-i18n="compare">Compare</button></div>' .
		'<p class="a4h-sub">For each plan we use the nearest allowed term or premium paying term. Figures use LIC tariff rates where available and current bonus rates (not guaranteed).</p>' .
		'<div class="a4h-cout"></div></section>' . a4u_lic_engine_tag();
}

// engine (a4u-lic.js) फक्त API म्हणून — compare/plan illustration साठी
function a4u_lic_engine_tag() {
	$cfg            = a4u_lic_build_config();
	$cfg['apiOnly'] = 1;
	wp_enqueue_script( 'a4u-lic' );
	wp_add_inline_script( 'a4u-lic', 'window.A4U_LIC=window.A4U_LIC||' . wp_json_encode( $cfg ) . ';', 'before' );
	return '';
}

/* ---------- Revival ---------- */
function a4u_lic_revival_html() {
	return '<section class="a4h-box a4h-rev"><div class="a4h-frow">' .
		'<label><span data-a4h-i18n="mode">Premium mode</span><select id="a4h-rmode"><option value="yearly">Yearly</option><option value="half">Half-yearly</option><option value="quarter">Quarterly</option><option value="month">Monthly</option></select></label>' .
		'<label><span data-a4h-i18n="inst">Instalment premium (₹)</span><input type="number" id="a4h-rprem" min="100" step="1" placeholder="e.g. 12500"></label>' .
		'<label><span data-a4h-i18n="fup">First unpaid premium due date (FUP)</span><input type="date" id="a4h-rfup"></label>' .
		'<label><span data-a4h-i18n="revdate">Revival date</span><input type="date" id="a4h-rdate"></label>' .
		'<button type="button" class="a4h-btn" id="a4h-rgo" data-a4h-i18n="calc">Calculate</button></div><div class="a4h-rout"></div>' .
		'<ul class="a4h-ticks a4h-small"><li>A lapsed LIC policy can usually be revived within 5 years from the first unpaid premium (check your plan\'s rules).</li><li>LIC charges interest on each late instalment; the rate is set by LIC from time to time. This tool uses LIC\'s published revival interest factors.</li><li>LIC may ask for a health declaration or medical reports, and may run revival campaigns with concessions on late fees.</li><li>The final amount is shown by LIC at the branch, on the LIC customer portal or by your agent.</li></ul></section>';
}

/* ---------- Bonus दर ---------- */
function a4u_lic_bonus_html() {
	$rows = '';
	foreach ( a4u_lic_catalog() as $p ) {
		if ( $p['srb'] > 0 ) {
			$rows .= '<tr><td><a href="' . esc_url( a4u_lic_plan_url( $p ) ) . '">' . esc_html( $p['name'] ) . '</a></td><td>' . esc_html( $p['id'] ) . '</td><td>₹' . esc_html( 0 + $p['srb'] ) . '</td><td>' . ( $p['fab'] > 0 ? '₹' . esc_html( 0 + $p['fab'] ) : '—' ) . '</td></tr>';
		}
	}
	return '<section class="a4h-box"><div class="a4h-scroll"><table class="a4h-table"><thead><tr><th>Plan</th><th>No.</th><th>Simple Reversionary Bonus<br><small>per ₹1,000 SA per year</small></th><th>Final Additional Bonus<br><small>per ₹1,000 SA (max)</small></th></tr></thead><tbody>' . $rows . '</tbody></table></div>' .
		'<p class="a4h-note">These are the bonus rates we use in our illustrations, based on LIC\'s latest declared rates for these plans and the policy term. LIC declares bonus every year after its valuation; past or current rates do not guarantee future rates. Final Additional Bonus depends on the policy term and is paid only on maturity or death after a minimum term.</p>' .
		'<h2>How bonus adds up — example</h2><div class="a4h-viz" data-bonus="736"></div></section>' . a4u_lic_engine_tag();
}

/* ---------- LIC सेवा (फक्त अधिकृत दुवे) ---------- */
function a4u_lic_services_html() {
	$g = array(
		'Pay & manage premium' => array(
			array( 'Pay premium online (customer portal)', 'https://ebiz.licindia.in/D2CPM/#Login', 'Log in to pay premium, see policy status and download receipts.' ),
			array( 'Pay premium without login', 'https://customer.onlinelic.in/LICEPS/appmanager/OnlinePayment/OnlinePaymentHome', 'Pay using policy number and date of birth.' ),
			array( 'Register e-NACH (auto debit)', 'https://enach.licindia.in/LICNACHClient/', 'Set up automatic premium payment from your bank account.' ),
			array( 'NRI customer portal', 'https://nriebiz.licindia.in/D2CPM/#Login', 'Services for policyholders living abroad.' ),
		),
		'Buy & track' => array(
			array( 'Buy LIC plans online', 'https://esales.licindia.in', 'LIC\'s official online sales platform.' ),
			array( 'ULIP fund NAV', 'https://services.licindia.in/LICEPS/portlets/visitor/CurrentNAV/CurrentNAVDay/CurrentNAVDayController.jpf', 'Daily NAV of LIC unit-linked funds.' ),
			array( 'Find your LIC branch', a4u_lic_tool_url( 'branch-locator' ), 'Search LIC branch offices by city or PIN.' ),
		),
		'Help & complaints' => array(
			array( 'LIC on WhatsApp', 'https://wa.me/918976862090?text=Hi', 'LIC\'s official WhatsApp service for policy information.' ),
			array( 'Raise a service request', 'https://csticket.licindia.in/csTicket/index.php', 'Register a query or complaint with LIC customer service.' ),
			array( 'IRDAI Bima Bharosa', 'https://bimabharosa.irdai.gov.in/', 'Insurance regulator\'s grievance portal, if LIC does not resolve your complaint.' ),
			array( 'LIC official website', 'https://licindia.in', 'Plans, forms, claims and announcements.' ),
		),
	);
	$h = '<div class="a4h-svc">';
	foreach ( $g as $title => $links ) {
		$h .= '<section class="a4h-box"><h2>' . esc_html( $title ) . '</h2><ul class="a4h-links">';
		foreach ( $links as $l ) {
			$ext = 0 !== strpos( $l[1], home_url() );
			$h  .= '<li><a href="' . esc_url( $l[1] ) . '"' . ( $ext ? ' target="_blank" rel="noopener"' : '' ) . '><b>' . esc_html( $l[0] ) . '</b><small>' . esc_html( $l[2] ) . '</small></a></li>';
		}
		$h .= '</ul></section>';
	}
	return $h . '</div><p class="a4h-note">These links open LIC\'s or IRDAI\'s own websites. Never share your OTP or password with anyone, including us.</p>';
}

/* ---------- shortcodes: कुठल्याही Elementor पानात tool ---------- */
foreach ( array( 'revival' => 'revival-calculator', 'compare' => 'compare-plans', 'branches' => 'branch-locator', 'services' => 'lic-services', 'bonus' => 'bonus-rates' ) as $a4u_sc => $a4u_key ) {
	add_shortcode( 'a4u_lic_' . $a4u_sc, function () use ( $a4u_key ) {
		a4u_lic_hub_inline_assets( array( 'type' => 'tool', 'key' => $a4u_key ) );
		return '<div class="a4h" data-page="tool">' . a4u_lic_render_tool( $a4u_key, false ) . '</div>';
	} );
}

/* =====================================================================
 * Lead सूचना: email + Telegram (S3) — rest.php मधून lead जतन झाल्यावर
 * ===================================================================== */
add_action( 'a4u_lic_lead_saved', function ( $lead ) {
	$s    = a4u_lic_data()['settings'];
	$text = "New LIC lead\nName: {$lead['name']}\nMobile: {$lead['mobile']}\nPlan: {$lead['plan']}" . ( $lead['sa'] ? "\nSum Assured: ₹" . number_format_i18n( $lead['sa'] ) : '' ) . "\nPage: " . ( $lead['page'] ?: '-' );
	$to   = sanitize_email( (string) ( $s['lead_email'] ?? '' ) );
	if ( $to ) { wp_mail( $to, 'New LIC lead: ' . $lead['name'], $text ); }
	$tok  = trim( (string) ( $s['tg_token'] ?? '' ) );
	$chat = trim( (string) ( $s['tg_chat'] ?? '' ) );
	if ( $tok && $chat && preg_match( '/^\d+:[A-Za-z0-9_-]{20,}$/', $tok ) ) {
		wp_remote_post( 'https://api.telegram.org/bot' . $tok . '/sendMessage', array( 'timeout' => 5, 'blocking' => false, 'body' => array( 'chat_id' => $chat, 'text' => $text ) ) );
	}
} );

/* =====================================================================
 * v4.1 (S3): शाखा शोध server वर — 460KB file browser ला पाठवायची गरज नाही
 * GET /wp-json/a4u-lic/v1/branches?q=nagpur&do=  (कमाल 60 नोंदी)
 * ===================================================================== */
add_action( 'rest_api_init', function () {
	register_rest_route( 'a4u-lic/v1', '/branches', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'args'                => array(
			'q'  => array( 'type' => 'string', 'default' => '' ),
			'do' => array( 'type' => 'string', 'default' => '' ),
		),
		'callback'            => function ( WP_REST_Request $req ) {
			$q    = strtolower( trim( substr( sanitize_text_field( (string) $req->get_param( 'q' ) ), 0, 60 ) ) );
			$dv   = trim( substr( sanitize_text_field( (string) $req->get_param( 'do' ) ), 0, 80 ) );
			// v4.3 (S5): एकाच शोधाचा निकाल 1 दिवस cache — मोठी file पुन्हा पुन्हा वाचायची गरज नाही
			$ck   = 'a4u_lic_br_' . md5( A4U_LIC_VER . '|' . $q . '|' . $dv );
			$hit  = get_transient( $ck );
			if ( is_array( $hit ) ) {
				$res = rest_ensure_response( $hit );
				$res->header( 'Cache-Control', 'public, max-age=3600' );
				return $res;
			}
			$all  = a4u_lic_json( 'lic-branches.json' );
			$rows = (array) ( $all['rows'] ?? array() );
			$out  = array();
			if ( '' !== $q || '' !== $dv ) {
				foreach ( $rows as $r ) {
					if ( '' !== $dv && $r[6] !== $dv ) { continue; }
					if ( '' !== $q && false === strpos( strtolower( $r[1] . ' ' . $r[3] . ' ' . $r[4] . ' ' . $r[6] . ' ' . $r[0] ), $q ) ) { continue; }
					$out[] = $r;
					if ( count( $out ) >= 60 ) { break; }
				}
			}
			$divs = get_transient( 'a4u_lic_divs' );
			if ( false === $divs ) {
				$divs = array_values( array_unique( array_filter( array_map( function ( $r ) { return $r[6]; }, $rows ) ) ) );
				sort( $divs );
				set_transient( 'a4u_lic_divs', $divs, WEEK_IN_SECONDS );
			}
			$data = array( 'total' => count( $rows ), 'rows' => $out, 'divisions' => $divs, 'more' => count( $out ) >= 60 );
			if ( strlen( $q ) <= 30 ) { set_transient( $ck, $data, DAY_IN_SECONDS ); }
			$res = rest_ensure_response( $data );
			$res->header( 'Cache-Control', 'public, max-age=3600' );
			return $res;
		},
	) );
} );

/* =====================================================================
 * v4.1 (S6): जुनी /lic-calculator/<plan>/ पानं → नवीन plan पानाकडे 301
 * ===================================================================== */
add_action( 'template_redirect', function () {
	$id = (string) get_query_var( 'a4u_plan' );
	if ( '' === $id ) { return; }
	$cat = a4u_lic_catalog();
	if ( isset( $cat[ $id ] ) ) {
		wp_safe_redirect( a4u_lic_plan_url( $cat[ $id ] ) . '#a4h-calc', 301 );
		exit;
	}
}, 5 );

/* =====================================================================
 * v4.1 (S7): hub पानांवर इतर SEO plugin (ThinkRank वगैरे) चे canonical /
 * description / og tags काढून फक्त आपले ठेवायचे — चुकीचा (homepage) canonical जाऊ नये
 * ===================================================================== */
add_action( 'wp_head', function () {
	if ( a4u_lic_hub_route() ) { ob_start(); }
}, -1000 );
add_action( 'wp_head', function () {
	if ( ! a4u_lic_hub_route() ) { return; }
	$html = (string) ob_get_clean();
	$m    = a4u_lic_hub_meta();
	$html = preg_replace( '#<link[^>]+rel=["\']canonical["\'][^>]*>\s*#i', '', $html );
	$html = preg_replace( '#<meta[^>]+(name|property)=["\'](description|og:title|og:description|og:url|og:type|twitter:title|twitter:description)["\'][^>]*>\s*#i', '', $html );
	$html = preg_replace( '#<meta[^>]+name=["\']robots["\'][^>]*>\s*#i', '', $html );
	echo $html; // phpcs:ignore -- WordPress head जसाच्या तसा
	if ( $m ) {
		echo '<link rel="canonical" href="' . esc_url( $m[2] ) . '">' . "\n";
		echo '<meta name="description" content="' . esc_attr( $m[1] ) . '">' . "\n";
		echo '<meta name="robots" content="index, follow, max-image-preview:large">' . "\n";
		echo '<meta property="og:type" content="website"><meta property="og:title" content="' . esc_attr( $m[0] ) . '"><meta property="og:description" content="' . esc_attr( $m[1] ) . '"><meta property="og:url" content="' . esc_url( $m[2] ) . '">' . "\n";
		echo '<meta name="twitter:title" content="' . esc_attr( $m[0] ) . '"><meta name="twitter:description" content="' . esc_attr( $m[1] ) . '">' . "\n";
	}
}, PHP_INT_MAX );

/* =====================================================================
 * v4.4: LIC policy सेवा मार्गदर्शक + जुन्या plan आवृत्त्या (आपल्या शब्दांत;
 * नियम LIC च्या online सेवा पानांवरून, plan अटी LIC च्या V02 आवृत्त्यांवरून)
 * ===================================================================== */
function a4u_lic_service_guide_html() {
	$li = function ( $en, $mr ) { return '<li data-mr="' . esc_attr( $mr ) . '">' . esc_html( $en ) . '</li>'; };
	$g = array(
		array( 'Policy loan', 'पॉलिसीवर कर्ज', array(
			array( 'Loan is available once the policy has acquired surrender value (usually after 2 full years of premium in current plans; 3 years in many older plans).', 'पॉलिसीला surrender value आल्यानंतर कर्ज मिळतं (सध्याच्या plans मध्ये साधारण 2 वर्षांचे पूर्ण हप्ते भरल्यानंतर; अनेक जुन्या plans मध्ये 3 वर्षांनंतर).' ),
			array( 'You can apply online with OTP; the money is paid by NEFT to your registered bank account.', 'OTP वापरून online अर्ज करता येतो; रक्कम नोंदवलेल्या बँक खात्यात NEFT ने जमा होते.' ),
			array( 'For the first loan, the original policy bond and a signed loan form are given to the branch, assigning the policy to LIC.', 'पहिल्या कर्जासाठी मूळ policy bond आणि सही केलेला loan form शाखेत द्यावा लागतो (policy LIC च्या नावे assign होते).' ),
			array( 'The final loan amount can change on the payment date, depending on premiums paid and interest due.', 'प्रत्यक्ष पैसे मिळण्याच्या दिवशी, भरलेले हप्ते आणि थकलेलं व्याज यानुसार कर्जाची रक्कम थोडी बदलू शकते.' ),
		) ),
		array( 'Nomination', 'Nominee नोंदणी', array(
			array( 'The policyholder must be 18 or older to make a nomination.', 'Nomination करायला policyholder चं वय 18 पूर्ण असावं लागतं.' ),
			array( 'If the nominee is below 18, name an adult appointee who gives consent.', 'Nominee 18 पेक्षा लहान असेल तर एक प्रौढ appointee नेमावा लागतो आणि त्याची संमती लागते.' ),
			array( 'An online request alone is not enough: submit the signed nomination form with the original policy bond and ID proof at any branch.', 'फक्त online अर्ज पुरेसा नाही: सही केलेला nomination form, मूळ policy bond आणि ओळखपत्र कोणत्याही शाखेत द्यावं लागतं.' ),
			array( 'Changing an existing nomination carries a small fee as per LIC rules.', 'आधीचं nomination बदलायला LIC च्या नियमानुसार छोटं शुल्क लागतं.' ),
		) ),
		array( 'Auto-debit (NACH)', 'बँकेतून आपोआप हप्ता (NACH)', array(
			array( 'NACH works for yearly, half-yearly, quarterly and monthly modes, for new and existing policies.', 'NACH वार्षिक, सहामाही, तिमाही आणि मासिक सगळ्या modes साठी, नवीन आणि जुन्या policies वर चालतं.' ),
			array( 'On monthly mode, the 5% extra that LIC charges for monthly payment is waived when you pay by NACH.', 'मासिक mode वर LIC जो 5% जादा हप्ता घेते, तो NACH ने भरल्यास माफ होतो.' ),
			array( 'Keep money in the account for at least 3 days after the debit date. A bounced debit has to be paid at the branch, with charges.', 'Debit च्या तारखेनंतर किमान 3 दिवस खात्यात पैसे ठेवा. Debit परत गेला तर हप्ता शुल्कासह शाखेत भरावा लागतो.' ),
			array( 'To stop NACH, tell your branch about 20 days (monthly) or 30 days (other modes) before the debit date.', 'NACH बंद करायचं असेल तर debit तारखेच्या साधारण 20 दिवस (मासिक) किंवा 30 दिवस (इतर modes) आधी शाखेला कळवा.' ),
		) ),
		array( 'Change of premium mode', 'हप्त्याचा mode बदलणे', array(
			array( 'Only in-force policies can change mode. A lapsed policy must first be revived in its current mode.', 'फक्त चालू (in-force) policy चा mode बदलता येतो. बंद पडलेली policy आधी आहे त्याच mode मध्ये revive करावी लागते.' ),
			array( 'Single premium cannot be changed to a regular mode, or the other way round.', 'Single premium मधून regular mode मध्ये, किंवा उलट, बदल करता येत नाही.' ),
			array( 'GST and a small alteration fee may apply.', 'GST आणि छोटं बदल शुल्क लागू शकतं.' ),
		) ),
		array( 'Bank account (NEFT) and PAN', 'बँक खाते (NEFT) आणि PAN', array(
			array( 'Register your bank account with a scanned cancelled cheque and PAN card; all future policy payments go to this account.', 'Cancelled cheque आणि PAN card ची scan प्रत देऊन बँक खाते नोंदवा; पुढचे सगळे पैसे याच खात्यात येतात.' ),
			array( 'PAN can be registered online for policies on your own life and on your minor children.', 'स्वतःच्या आणि अल्पवयीन मुलांच्या policies वर PAN online नोंदवता येतो.' ),
		) ),
		array( 'Change of address', 'पत्ता बदल', array(
			array( 'With Aadhaar: approve with the OTP sent to your Aadhaar-linked mobile (for policies where Aadhaar is linked).', 'Aadhaar सह: Aadhaar शी जोडलेल्या mobile वर आलेल्या OTP ने मंजुरी (ज्या policies ला Aadhaar जोडलेला आहे त्यांच्यासाठी).' ),
			array( 'Without Aadhaar: upload a self-attested address proof in your own name (in-force or paid-up policies only).', 'Aadhaar शिवाय: स्वतःच्या नावाचा, स्वसाक्षांकित पत्त्याचा पुरावा upload करा (फक्त चालू किंवा paid-up policies साठी).' ),
		) ),
		array( 'Assignment (transfer of rights)', 'Assignment (हक्क हस्तांतरण)', array(
			array( 'Write the assignee\'s full name and age, and the amount received in words.', 'ज्याच्या नावे हक्क देत आहात त्याचं पूर्ण नाव आणि वय, आणि मिळालेली रक्कम शब्दांत लिहा.' ),
			array( 'Sign in front of a witness who is not the assignee, then send the deed to LIC\'s divisional office for registration.', 'Assignee नसलेल्या साक्षीदारासमोर सही करा, आणि नोंदणीसाठी ते पत्र LIC च्या divisional office ला पाठवा.' ),
			array( 'For assignment as loan security, take legal advice on the form and stamp duty.', 'कर्जासाठी तारण म्हणून assignment करताना form आणि stamp duty बद्दल कायदेशीर सल्ला घ्या.' ),
		) ),
		array( 'ULIP: fund switch and partial withdrawal', 'ULIP: fund switch आणि partial withdrawal', array(
			array( 'Four fund switches in a policy year are free; the 5th and 6th cost ₹100 each, taken from your units.', 'एका policy वर्षात 4 fund switch मोफत; 5 वा आणि 6 वा switch प्रत्येकी ₹100 ला, units मधून कापून.' ),
			array( 'Partial withdrawal is allowed after the 3rd or 5th policy anniversary (as per plan), when all premiums are paid and no loan is outstanding.', 'सगळे हप्ते भरलेले आणि कर्ज नसल्यास, 3 ऱ्या किंवा 5 व्या policy वर्धापनदिनानंतर (plan प्रमाणे) partial withdrawal करता येतं.' ),
			array( 'Requests complete at the branch before 3 pm get that day\'s closing NAV; later requests get the next working day\'s NAV.', 'शाखेत दुपारी 3 पूर्वी पूर्ण झालेल्या अर्जाला त्याच दिवसाचा NAV, नंतरच्या अर्जाला पुढच्या कामाच्या दिवसाचा NAV.' ),
		) ),
	);
	$h = '<section class="a4h-box"><p data-mr="जुनी LIC policy आहे? कर्ज, nominee, NACH, पत्ता बदल यांसारख्या सेवा कशा मिळवायच्या, ते इथे थोडक्यात. अंतिम नियम तुमच्या policy च्या अटी आणि LIC शाखा सांगेल.">Have an existing LIC policy? Here is how the common services work, in short. Your policy document and LIC branch have the final rules.</p></section>';
	foreach ( $g as $sec ) {
		$h .= '<section class="a4h-box"><h2 data-mr="' . esc_attr( $sec[1] ) . '">' . esc_html( $sec[0] ) . '</h2><ul class="a4h-ticks">';
		foreach ( $sec[2] as $r ) { $h .= $li( $r[0], $r[1] ); }
		$h .= '</ul></section>';
	}
	// जुन्या आवृत्त्या (V02, 2020–21) — फक्त संदर्भासाठी
	$old = array(
		array( '914', 'New Endowment', '512N277V02', '8–55', '12–35', 'Same as term', '1 lakh', '714' ),
		array( '915', 'New Jeevan Anand', '512N279V02', '18–50', '15–35', 'Same as term', '1 lakh', '715' ),
		array( '933', 'New Jeevan Lakshya', '512N297V02', '18–50', '13–25', 'Term − 3', '1 lakh', '733' ),
		array( '920', 'New Money Back 20 years', '512N280V02', '13–50', '20', '15', '1 lakh', '720' ),
		array( '921', 'New Money Back 25 years', '512N278V02', '13–45', '25', '20', '1 lakh', '721' ),
		array( '936', 'New Jeevan Labh', '512N304V02', '8–59', '16, 21, 25', '10, 15, 16', '2 lakh', '736' ),
		array( '945', 'Jeevan Umang', '512N312V02', '90 days–55', '100 − age', '15, 20, 25, 30', '2 lakh', '745' ),
		array( '948', 'Bima Shree', '512N316V02', '8–55', '14–20', 'Term − 4', '10 lakh', '' ),
		array( '947', 'Jeevan Shiromani', '512N315V02', '18–55', '14–20', 'Term − 4', '1 crore', '' ),
		array( '943', 'Aadhaar Stambh', '512N310V02', '8–55', '10–20', 'Same as term', '75,000', '' ),
		array( '944', 'Aadhaar Shila', '512N309V02', '8–55', '10–20', 'Same as term', '75,000', '' ),
		array( '916', 'New Bima Bachat', '512N284V02', '15–50', '9, 12, 15', 'Single', '35,000', '' ),
		array( '917', 'Single Premium Endowment', '512N283V02', '90 days–65', '10–25', 'Single', '50,000', '' ),
	);
	$cat = function_exists( 'a4u_lic_catalog' ) ? a4u_lic_catalog() : array();
	$h .= '<section class="a4h-box"><h2 data-mr="जुन्या plan आवृत्त्या (2020–21)">Older plan versions (2020–21)</h2><p data-mr="या plans आता नवीन क्रमांकाने (7xx) विकले जातात. जुन्या policies च्या अटी या आवृत्तीनुसारच राहतात. फक्त संदर्भासाठी — नवीन policy साठी सध्याचा plan पाहा.">These plans are now sold under new numbers (7xx). Existing policies keep the terms of the version they were issued under. For reference only; for a new policy see the current plan.</p><div class="a4u-scroll"><table class="a4h-table"><thead><tr><th>Plan</th><th>UIN</th><th>Entry age</th><th>Term (years)</th><th>Premium paying</th><th>Min. Sum Assured</th><th>Current version</th></tr></thead><tbody>';
	foreach ( $old as $o ) {
		$cur = ( $o[7] && isset( $cat[ $o[7] ] ) ) ? '<a href="' . esc_url( a4u_lic_plan_url( $cat[ $o[7] ] ) ) . '">' . esc_html( $cat[ $o[7] ]['name'] ?? $o[7] ) . ' (' . $o[7] . ')</a>' : '—';
		$h .= '<tr><td>' . esc_html( $o[0] . ' ' . $o[1] ) . '</td><td>' . esc_html( $o[2] ) . '</td><td>' . esc_html( $o[3] ) . '</td><td>' . esc_html( $o[4] ) . '</td><td>' . esc_html( $o[5] ) . '</td><td>₹' . esc_html( $o[6] ) . '</td><td>' . $cur . '</td></tr>';
	}
	$h .= '</tbody></table></div><p class="a4h-note">Riders on most of these plans: Term and Critical Illness ₹1 lakh–₹25 lakh; Accidental Death &amp; Disability ₹10,000–₹1 crore; Accident Benefit ₹20,000–₹1 crore.</p></section>';
	$h .= '<p class="a4h-note">Source: rules shown on LIC\'s online service pages and LIC plan terms, written in our own words. Please confirm with your LIC branch or agent before acting.</p>';
	return $h;
}
