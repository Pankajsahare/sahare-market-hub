<?php
// A4U LIC Calculator — shortcode, FAQ, frontend config
if ( ! defined( 'ABSPATH' ) ) { exit; }

/* =====================================================================
 * 7. Frontend: shortcode
 * ===================================================================== */

add_action( 'wp_enqueue_scripts', function () {
	$url = plugin_dir_url( A4U_LIC_FILE );
	wp_register_style( 'a4u-lic', $url . 'assets/a4u-lic.css', array(), A4U_LIC_VER );
	wp_register_script( 'a4u-lic', $url . 'assets/a4u-lic.js', array(), A4U_LIC_VER, true );
} );

// v3.1: config एकाच ठिकाणी — shortcode आणि offline file दोघांसाठी
function a4u_lic_build_config( $init = '', $title = '' ) {
	$d     = a4u_lic_data();
	$s     = $d['settings'];
	$plans = array();
	foreach ( $d['plans'] as $id => $p ) {
		if ( empty( $p['active'] ) ) { continue; }
		$plans[] = array(
			'id'              => (string) $id,
			'name'            => $p['name'],
			'type'            => $p['type'],
			'min_age'         => (int) $p['min_age'],
			'max_age'         => (int) $p['max_age'],
			'min_sa'          => (int) $p['min_sa'],
			'max_maturity'    => (int) $p['max_maturity'],
			'min_maturity'    => (int) ( $p['min_maturity'] ?? 0 ),
			'terms'           => a4u_lic_plan_terms( $p ),
			'ppt_map'         => (object) ( $p['ppt_map'] ?? array() ),
			'ppt_max_age_sum' => (int) ( $p['ppt_max_age_sum'] ?? 0 ),
			'maturity_age'    => (int) ( $p['maturity_age'] ?? 100 ),
			'sb_years'        => array_values( (array) ( $p['sb_years'] ?? array() ) ),
			'sb_ages'         => array_values( (array) ( $p['sb_ages'] ?? array() ) ),
			'mat_pct'         => (float) ( $p['mat_pct'] ?? 100 ),
			'mb_ppt'          => (int) ( $p['mb_ppt'] ?? 0 ),
			'mb_end_age'      => (int) ( $p['mb_end_age'] ?? 0 ),
			'gsv_prem'        => array_values( (array) ( $p['gsv_prem'] ?? array() ) ),
			'gsv_add'         => array_values( (array) ( $p['gsv_add'] ?? array() ) ),
			'gsv_less_income' => (int) ( $p['gsv_less_income'] ?? 0 ),
			'loan_from'       => (int) ( $p['loan_from'] ?? 2 ),
			'loan_ga_bands'   => array_values( (array) ( $p['loan_ga_bands'] ?? array() ) ),
			'survival_pct'    => (float) ( $p['survival_pct'] ?? 0 ),
			'tail_age'        => (int) ( $p['tail_age'] ?? 0 ),
			'min_age_by_term' => (object) ( $p['min_age_by_term'] ?? array() ),
			'sa_slabs'        => array_values( (array) ( $p['sa_slabs'] ?? array() ) ),
			'rebate_slabs'    => array_values( (array) ( $p['rebate_slabs'] ?? array() ) ),
			'rebate_bands'    => array_values( (array) ( $p['rebate_bands'] ?? array() ) ),
			'mode_adj'        => (object) ( $p['mode_adj'] ?? array() ),
			'srb'             => (float) $p['srb'],
			'fab'             => (float) $p['fab'],
			'fab_min_term'    => (int) $p['fab_min_term'],
			'bonus_bands'     => array_values( (array) ( $p['bonus_bands'] ?? array() ) ),
			'death_pct'       => (int) ( $p['death_pct'] ?? 0 ),
			'death_sp'        => array_values( (array) ( $p['death_sp'] ?? array() ) ),
			'riders'          => array_values( (array) ( $p['riders'] ?? array() ) ),
			'ga_per_1000'     => (float) ( $p['ga_per_1000'] ?? 0 ),
			'samples'         => array_values( (array) ( $p['samples'] ?? array() ) ),
			'sample_sa'       => (int) ( $p['sample_sa'] ?? 0 ),
			'closed'          => (int) ( $p['closed'] ?? 0 ),
			'verified'        => (int) $p['verified'],
			'has_rates'       => ! empty( $p['rates'] ),
			'effective'       => (string) $p['effective'],
			'brochure'        => (string) ( $p['brochure'] ?? '' ),
			'uin'             => (string) ( $p['uin'] ?? '' ),
			'points'          => (object) ( $p['points'] ?? array() ),
			'ppt_less'        => (int) ( $p['ppt_less'] ?? 0 ),
			'loan_pct'        => (int) ( $p['loan_pct'] ?? 75 ),
			'has_tariff'      => is_readable( plugin_dir_path( A4U_LIC_FILE ) . 'assets/data/tariff/' . $id . '.json' ), // v4.1: tariff लागेल तेव्हा
			'ppt_age'         => (object) ( $p['ppt_age'] ?? array() ),
			'ga_prem_per_1000' => (float) ( $p['ga_prem_per_1000'] ?? 0 ),
			'booster_pct'     => (float) ( $p['booster_pct'] ?? 0 ),
			'ga_hsa'          => (object) ( $p['ga_hsa'] ?? array() ),
			'rebate_pct_bands' => array_values( (array) ( $p['rebate_pct_bands'] ?? array() ) ),
			'rebate_pct_bands_sp' => array_values( (array) ( $p['rebate_pct_bands_sp'] ?? array() ) ),
			'allowed_modes'   => array_values( (array) ( $p['allowed_modes'] ?? array() ) ),
			'max_sa'          => (int) ( $p['max_sa'] ?? 0 ),
		);
	}
	$links = array();
	foreach ( preg_split( '/\r\n|\r|\n/', (string) $s['links'] ) as $line ) {
		$parts = array_map( 'trim', explode( '|', $line, 2 ) );
		if ( 2 === count( $parts ) && '' !== $parts[0] && esc_url_raw( $parts[1] ) ) {
			$links[] = array( 'label' => $parts[0], 'url' => esc_url_raw( $parts[1] ) );
		}
	}
	$cfg = array(
		'rest'       => esc_url_raw( rest_url( 'a4u-lic/v1/' ) ),
		'version'    => (int) $d['rate_version'],
		'dataUrl'    => plugin_dir_url( A4U_LIC_FILE ) . 'assets/data/',
		'gst'        => (float) $s['gst'],
		'modal'      => $s['modal'],
		'riderRates' => array( 'adb' => (float) $s['rider_per_1000'], 'addb' => (float) ( $s['rider_addb'] ?? 1 ), 'term' => (float) ( $s['rider_term'] ?? 1.5 ), 'pwb' => (float) ( $s['rider_pwb_pct'] ?? 2 ) ),
		'riderMap'   => (object) a4u_lic_rider_map( $s['rider_csv'] ?? '' ),
		'whatsapp'   => (string) $s['whatsapp'],
		'links'      => $links,
		'plans'      => $plans,
		'initPlan'   => $init,
		'title'      => $title,
		// v2.0: presentation + PDF
		'advisor'    => is_user_logged_in() && current_user_can( 'edit_posts' ),
		'vendor'     => plugin_dir_url( A4U_LIC_FILE ) . 'assets/vendor/',
		'present'    => plugin_dir_url( A4U_LIC_FILE ) . 'assets/a4u-lic-present.js?v=' . A4U_LIC_VER,
		'inflation'  => (float) ( $s['inflation'] ?? 6 ),
		'loanRate'   => (float) ( $s['loan_rate'] ?? 9.5 ),
		'brand'      => array(
			'name'   => (string) ( $s['brand_name'] ?? '' ),
			'agent'  => (string) ( $s['agent_name'] ?? '' ),
			'type'   => (string) ( $s['agent_type'] ?? '' ),
			'code'   => (string) ( $s['agency_code'] ?? '' ),
			'branch' => (string) ( $s['agency_branch'] ?? '' ),
			'phone'  => (string) ( $s['brand_phone'] ?? '' ),
			'email'  => (string) ( $s['brand_email'] ?? '' ),
			'web'    => (string) ( $s['brand_web'] ?? '' ),
			'title'   => (string) ( $s['agent_title'] ?? '' ),
			'address' => (string) ( $s['agent_address'] ?? '' ),
			'email2'  => (string) ( $s['agent_email'] ?? '' ),
			'photo'   => '' !== (string) ( $s['photo_url'] ?? '' ) ? (string) $s['photo_url'] : plugin_dir_url( A4U_LIC_FILE ) . 'assets/advisor-photo.jpg',
			'logo'   => '' !== (string) ( $s['logo_url'] ?? '' ) ? (string) $s['logo_url'] : plugin_dir_url( A4U_LIC_FILE ) . 'assets/brand-logo.png',
			'gold'   => (string) ( $s['color_gold'] ?? '#B8924A' ),
			'green'  => (string) ( $s['color_green'] ?? '#3F5A22' ),
		),
	);
	return $cfg;
}

add_shortcode( 'a4u_lic_calculator', function ( $atts = array() ) {
	$atts = shortcode_atts( array( 'plan' => '', 'title' => '' ), $atts, 'a4u_lic_calculator' );
	$init = sanitize_key( $atts['plan'] );
	if ( '' === $init ) { $init = sanitize_key( (string) get_query_var( 'a4u_plan' ) ); }
	$title = sanitize_text_field( $atts['title'] );
	$cp    = a4u_lic_current_plan();
	if ( '' === $title && $cp ) { $title = 'LIC ' . $cp[1]['name'] . ' Premium Calculator'; }
	if ( '' === $title && a4u_lic_is_main_calc_page() ) { $title = 'LIC Premium Calculator 2026 — Maturity, Bonus & Surrender Value'; } // v4.3.5
	$cfg   = a4u_lic_build_config( $init, $title );
	$plans = $cfg['plans'];
	$s     = a4u_lic_data()['settings'];
	if ( $cfg['advisor'] ) {
		$cfg['offlineUrl'] = wp_nonce_url( admin_url( 'admin-post.php?action=a4u_lic_offline' ), 'a4u_lic_offline' );
	}
	wp_enqueue_style( 'a4u-lic' );
	wp_enqueue_script( 'a4u-lic' );
	wp_add_inline_script( 'a4u-lic', 'window.A4U_LIC=' . wp_json_encode( $cfg ) . ';', 'before' );
	if ( function_exists( 'a4u_lic_hub_inline_assets' ) ) { a4u_lic_hub_inline_assets( a4u_lic_hub_route() ); } // v4: नवीन charts
	$html = '<div id="a4u-lic-app" class="a4u-lic"><noscript>Please enable JavaScript to use the LIC calculator.</noscript></div>';
	if ( function_exists( 'a4u_lic_hub_route' ) && a4u_lic_hub_route() ) { return $html; } // v4: hub/plan पानावर links व FAQ आधीच आहेत
	$slug = a4u_lic_base_slug();
	$cat  = function_exists( 'a4u_lic_catalog' ) ? a4u_lic_catalog() : array();
	if ( $cat ) {
		$strip = '<nav class="a4u-lic a4u-hub-strip" aria-label="LIC plans and tools"><a class="a4u-hub-main" href="' . esc_url( home_url( '/' . a4u_lic_hub_slug() . '/' ) ) . '">📚 All LIC Plans — details, benefits &amp; calculators →</a><span>';
		foreach ( array( 'compare-plans', 'revival-calculator', 'medical-tests', 'bonus-rates', 'branch-locator', 'lic-services', 'policy-service-guide' ) as $k ) {
			$t = a4u_lic_tools()[ $k ];
			$strip .= '<a href="' . esc_url( a4u_lic_tool_url( $k ) ) . '">' . $t[2] . ' ' . esc_html( $t[0] ) . '</a>';
		}
		$strip .= '</span></nav>';
		$html  = $strip . $html; // v4.3.5: calculator च्या वर
	}
	// v4.3.3: plan links थेट नवीन /lic-plans/<plan>/ पानांकडे (जुनी /lic-calculator/<id>/ लिंक 301 घेत होती) + सगळ्या plans / tools ची पट्टी
	$html .= '<nav class="a4u-lic a4u-plan-links" aria-label="LIC plan calculators"><strong>Plan-wise calculators:</strong> ';
	$html .= implode( ' · ', array_map( function ( $p ) use ( $slug, $cat ) {
		$url = isset( $cat[ (string) $p['id'] ] ) ? a4u_lic_plan_url( $cat[ (string) $p['id'] ] ) . '#a4h-calc' : home_url( '/' . $slug . '/' . $p['id'] . '/' );
		return '<a href="' . esc_url( $url ) . '">' . esc_html( $p['name'] ) . '</a>';
	}, $plans ) ) . '</nav>';
	static $faq_done = false;
	if ( ! empty( $s['faq'] ) && ! $faq_done ) { $html .= a4u_lic_faq_html(); $faq_done = true; }
	return $html;
} );

function a4u_lic_faq_items() {
	return array(
		array( 'Is this an official LIC premium calculator?', 'No. This is an educational illustration tool by Sahare Financial Services. It is not provided by LIC of India. Please check the final premium and benefits in the official LIC policy document or sales illustration before buying.' ),
		array( 'How accurate are the premiums shown?', 'Where exact LIC tariff rates are loaded, the premium is exact. Otherwise the calculator estimates the premium from the sample premiums printed in the official LIC sales brochure for that plan, so results for ages and terms between the printed samples may differ slightly from the actual premium.' ),
		array( 'Is GST charged on LIC premiums?', 'Premiums for individual life insurance policies are exempt from GST from 22 September 2025. You can still change the GST % in the options to see other scenarios.' ),
		array( 'What is the difference between guaranteed and non-guaranteed benefits?', 'Basic Sum Assured, survival or income benefits and Guaranteed Additions written in the policy are guaranteed. Bonuses such as Simple Reversionary Bonus and Final Additional Bonus are declared by LIC every year and are not guaranteed.' ),
		array( 'Why are plans 914, 915, 936 and 945 not available?', 'LIC withdrew these versions from 1 October 2024 and replaced them with modified plans 714, 715, 736 and 745, with revised premium rates and a higher minimum Sum Assured. Existing policies under the old plan numbers continue as per their original terms.' ),
		array( 'Can I calculate by my premium budget instead of Sum Assured?', 'Yes. Choose "By Premium budget", enter how much you can pay per installment, and the calculator finds the highest Sum Assured that fits your budget, rounded to the allowed multiple.' ),
		array( 'How is age calculated for LIC plans?', 'Most LIC plans use age nearer birthday. If your last birthday was more than six months ago, your age is counted as the next year. Enter your date of birth and the calculator works it out for you.' ),
		array( 'How can I compare two LIC plans?', 'Calculate one plan, then use the Compare section below the result. The second plan is calculated with the same age, Sum Assured and payment mode so the figures are easy to compare side by side.' ),
	);
}

function a4u_lic_faq_html() {
	$items  = a4u_lic_faq_items();
	$schema = array( '@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => array() );
	$out    = '<section class="a4u-lic a4u-faq"><h2>LIC Calculator – FAQs</h2>';
	foreach ( $items as $it ) {
		$out .= '<details><summary>' . esc_html( $it[0] ) . '</summary><p>' . esc_html( $it[1] ) . '</p></details>';
		$schema['mainEntity'][] = array( '@type' => 'Question', 'name' => $it[0], 'acceptedAnswer' => array( '@type' => 'Answer', 'text' => $it[1] ) );
	}
	$out .= '</section>';
	$out .= '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>';
	return $out;
}

/* =====================================================================
 * v3.1: Offline calculator — advisor साठी एकच HTML file (internet नसतानाही चालते)
 * ===================================================================== */
add_action( 'admin_post_a4u_lic_offline', function () {
	if ( ! current_user_can( 'edit_posts' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_offline' );
	$dir = plugin_dir_path( A4U_LIC_FILE ) . 'assets/';
	$d   = a4u_lic_data();
	$cfg = a4u_lic_build_config( '', '' );
	$cfg['advisor'] = true;
	$cfg['offline'] = true;
	$cfg['rest']    = '';
	$rates = array();
	foreach ( $d['plans'] as $id => $p ) {
		if ( ! empty( $p['active'] ) && ! empty( $p['rates'] ) ) { $rates[ (string) $id ] = (object) $p['rates']; }
	}
	$cfg['offlineRates'] = (object) $rates;
	foreach ( $cfg['plans'] as $i => $pl ) { $cfg['plans'][ $i ]['tariff'] = a4u_lic_tariff_for( (string) $pl['id'] ); } // offline: tariff आतच
	// logo data URL मध्ये (बाहेरचा URL असेल तर default logo)
	$logo = $dir . 'brand-logo.png';
	if ( is_readable( $logo ) ) { $cfg['brand']['logo'] = 'data:image/png;base64,' . base64_encode( file_get_contents( $logo ) ); } // phpcs:ignore
	$read = function ( $f ) use ( $dir ) { return is_readable( $dir . $f ) ? (string) file_get_contents( $dir . $f ) : ''; }; // phpcs:ignore
	$js   = '';
	foreach ( array( 'vendor/jspdf.umd.min.js', 'vendor/html2canvas.min.js', 'vendor/qrcode.js' ) as $f ) { $js .= $read( $f ) . "\n;\n"; }
	$safe = function ( $code ) { return str_replace( '</script', '<\/script', $code ); };
	$name = 'lic-calculator-offline-' . gmdate( 'Y-m-d' ) . '.html';
	nocache_headers();
	header( 'Content-Type: text/html; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="' . $name . '"' );
	echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
	echo '<title>LIC Calculator (offline) — ' . esc_html( $cfg['brand']['name'] ) . '</title>';
	echo '<style>body{margin:0;padding:16px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#faf8f3}.a4u-offline-note{max-width:900px;margin:0 auto 12px;font-size:13px;color:#555}</style>';
	echo '<style>' . $read( 'a4u-lic.css' ) . '</style></head><body>'; // phpcs:ignore
	echo '<p class="a4u-offline-note">Offline copy · rates as on ' . esc_html( gmdate( 'd M Y' ) ) . ' (data version ' . (int) $d['rate_version'] . '). Download a fresh copy when LIC changes rates.</p>';
	echo '<div id="a4u-lic-app" class="a4u-lic"></div>';
	echo '<script>' . $safe( $js ) . '</script>'; // phpcs:ignore
	echo '<script>window.A4U_LIC=' . wp_json_encode( $cfg ) . ';</script>';
	echo '<script>' . $safe( $read( 'a4u-lic.js' ) ) . '</script>'; // phpcs:ignore
	echo '<script>' . $safe( $read( 'a4u-lic-present.js' ) ) . '</script>'; // phpcs:ignore
	echo '</body></html>';
	exit;
} );

/* =====================================================================
 * v4.3.3: मुख्य calculator पान (/lic-calculator/) — "Lic Calculator" ऐवजी
 * स्पष्ट title, heading आणि description (फक्त याच पानापुरतं)
 * ===================================================================== */
function a4u_lic_is_main_calc_page() {
	if ( is_admin() || ! is_page() || '' !== (string) get_query_var( 'a4u_plan' ) ) { return false; }
	$slug = a4u_lic_base_slug();
	return '' !== $slug && is_page( $slug );
}
function a4u_lic_main_calc_meta() {
	return array(
		'LIC Premium Calculator 2026 — Maturity, Bonus & Surrender Value | Advisor4u',
		'LIC Premium Calculator 2026',
		'Free LIC premium calculator for 2026: premium, maturity, bonus, year-wise surrender value and loan for popular LIC plans, based on LIC tariff and brochure figures.',
	);
}
add_filter( 'pre_get_document_title', function ( $t ) { return a4u_lic_is_main_calc_page() ? a4u_lic_main_calc_meta()[0] : $t; }, 40 );
add_filter( 'rank_math/frontend/title', function ( $t ) { return a4u_lic_is_main_calc_page() ? a4u_lic_main_calc_meta()[0] : $t; } );
add_filter( 'rank_math/frontend/description', function ( $t ) { return a4u_lic_is_main_calc_page() ? a4u_lic_main_calc_meta()[2] : $t; } );
add_filter( 'the_title', function ( $title, $id = 0 ) {
	if ( ! $id || ! a4u_lic_is_main_calc_page() || (int) $id !== (int) get_queried_object_id() ) { return $title; }
	return a4u_lic_main_calc_meta()[1];
}, 20, 2 );
// इतर SEO plugin (ThinkRank) चा description नसेल तर आपला; असल्यास तो तसाच ठेवायचा नाही — बदलायचा
add_action( 'wp_head', function () { if ( a4u_lic_is_main_calc_page() ) { ob_start(); } }, -999 );
add_action( 'wp_head', function () {
	if ( ! a4u_lic_is_main_calc_page() ) { return; }
	$h = (string) ob_get_clean();
	$h = preg_replace( '#<meta[^>]+(name|property)=["\'](description|og:description|twitter:description|og:title|twitter:title)["\'][^>]*>\s*#i', '', $h );
	$m = a4u_lic_main_calc_meta();
	echo $h; // phpcs:ignore
	echo '<meta name="description" content="' . esc_attr( $m[2] ) . '">' . "\n";
	echo '<meta property="og:title" content="' . esc_attr( $m[0] ) . '">' . "\n";
	echo '<meta property="og:description" content="' . esc_attr( $m[2] ) . '">' . "\n";
}, PHP_INT_MAX - 1 );
