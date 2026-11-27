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
			$h .= '<section class="a4h-box a4h-branch"><div class="a4h-frow"><label><span data-i18n="bsearch">City, PIN code or branch</span><input type="search" id="a4h-bq" placeholder="e.g. Nagpur or 440001" autocomplete="off"></label><label><span data-i18n="division">Division</span><select id="a4h-bdo"><option value="">All divisions</option></select></label></div><p class="a4h-count" aria-live="polite">Loading branches…</p><div class="a4h-blist"></div></section>' .
				'<p class="a4h-note">Branch details are from LIC\'s published branch list. Please confirm timings and contact details with the branch.</p>';
			break;
		case 'lic-services':
			$h .= a4u_lic_services_html();
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
		'<div class="a4h-frow"><label><span data-i18n="age">Age</span><input type="number" id="a4h-cage" min="0" max="65" value="30"></label>' .
		'<label><span data-i18n="sa">Sum Assured (₹)</span><input type="number" id="a4h-csa" min="100000" step="25000" value="1000000"></label>' .
		'<label><span data-i18n="term">Preferred term (years)</span><input type="number" id="a4h-cterm" min="5" max="40" value="21"></label>' .
		'<button type="button" class="a4h-btn" id="a4h-cgo" data-i18n="compare">Compare</button></div>' .
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
		'<label><span data-i18n="mode">Premium mode</span><select id="a4h-rmode"><option value="yearly">Yearly</option><option value="half">Half-yearly</option><option value="quarter">Quarterly</option><option value="month">Monthly</option></select></label>' .
		'<label><span data-i18n="inst">Instalment premium (₹)</span><input type="number" id="a4h-rprem" min="100" step="1" placeholder="e.g. 12500"></label>' .
		'<label><span data-i18n="fup">First unpaid premium due date (FUP)</span><input type="date" id="a4h-rfup"></label>' .
		'<label><span data-i18n="revdate">Revival date</span><input type="date" id="a4h-rdate"></label>' .
		'<button type="button" class="a4h-btn" id="a4h-rgo" data-i18n="calc">Calculate</button></div><div class="a4h-rout"></div>' .
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
			$all  = a4u_lic_json( 'lic-branches.json' );
			$rows = (array) ( $all['rows'] ?? array() );
			$q    = strtolower( trim( substr( sanitize_text_field( (string) $req->get_param( 'q' ) ), 0, 60 ) ) );
			$dv   = trim( substr( sanitize_text_field( (string) $req->get_param( 'do' ) ), 0, 80 ) );
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
				set_transient( 'a4u_lic_divs', $divs, DAY_IN_SECONDS );
			}
			$res = rest_ensure_response( array( 'total' => count( $rows ), 'rows' => $out, 'divisions' => $divs, 'more' => count( $out ) >= 60 ) );
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
