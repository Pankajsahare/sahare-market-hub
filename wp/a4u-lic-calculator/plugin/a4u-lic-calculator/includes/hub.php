<?php
// A4U LIC Calculator v4 — LIC Plan Hub: सर्व plans ची पानं, SEO, sitemap
if ( ! defined( 'ABSPATH' ) ) { exit; }

/* =====================================================================
 * 1. Data (plugin सोबत येणाऱ्या JSON files)
 * ===================================================================== */

function a4u_lic_json( $file ) {
	static $cache = array();
	if ( ! isset( $cache[ $file ] ) ) {
		$path           = plugin_dir_path( A4U_LIC_FILE ) . 'assets/data/' . $file;
		$raw            = is_readable( $path ) ? file_get_contents( $path ) : ''; // phpcs:ignore
		$cache[ $file ] = $raw ? (array) json_decode( $raw, true ) : array();
	}
	return $cache[ $file ];
}

// calculator साठी एका plan चा tariff (दर, GSV/SSV factors, term rider)
function a4u_lic_tariff_for( $id ) {
	if ( ! preg_match( '/^\d{3}$/', (string) $id ) ) { return null; }
	$t = a4u_lic_json( 'tariff/' . $id . '.json' ); // v4.1: प्रत्येक plan ची स्वतंत्र file
	return $t ? $t : null;
}

function a4u_lic_hub_slug() {
	$d = a4u_lic_data();
	$s = trim( (string) ( $d['settings']['hub_slug'] ?? 'lic-plans' ), '/' );
	return '' !== $s ? $s : 'lic-plans';
}

function a4u_lic_cat_labels() {
	return array(
		'endowment' => array( 'Endowment & savings', '#0b4ea2' ),
		'moneyback' => array( 'Money back', '#7a4bc2' ),
		'wholelife' => array( 'Whole life & income', '#1f8f4e' ),
		'child'     => array( 'Child plans', '#d9822b' ),
		'term'      => array( 'Term insurance', '#c0392b' ),
		'pension'   => array( 'Pension & annuity', '#0f7c8c' ),
		'ulip'      => array( 'Unit linked (ULIP)', '#8a6d1f' ),
		'health'    => array( 'Health', '#b5179e' ),
	);
}

// proposal form (LIC form क्रमांक) — plan-specific, नाहीतर प्रौढ 300 / अल्पवयीन 360
function a4u_lic_form_for( $id ) {
	$map = array(
		'751' => 'Form 505 (micro insurance)', '880' => 'Form 505 (micro insurance)', '857' => 'Form 440', '758' => 'Form 441',
		'862' => 'Form 442', '872' => 'Form 443', '892' => 'Form 443 (Rev 2026)', '879' => 'Form 444', '749' => 'Nivesh / SIIP ULIP form',
		'752' => 'Nivesh / SIIP ULIP form', '886' => 'Form 606', '867' => 'Form 867', '873' => 'Form 873', '907' => 'Form HPF-3', '908' => 'Form HPF-4',
	);
	return $map[ $id ] ?? 'Form 300 (adult life) / Form 360 (minor life)';
}

/**
 * सगळे plans: तथ्यं (lic-catalog.json) + आपला मजकूर (lic-plan-notes.json) + calculator माहिती
 * return: id => array
 */
function a4u_lic_catalog() {
	static $out = null;
	if ( null !== $out ) { return $out; }
	// v4.3 (S5): object cache (LiteSpeed/Redis असल्यास) — data बदलल्यावर version मुळे आपोआप नवीन
	$ck  = 'catalog_' . A4U_LIC_VER . '_' . (int) ( a4u_lic_data()['rate_version'] ?? 0 );
	$hit = wp_cache_get( $ck, 'a4u_lic' );
	if ( is_array( $hit ) ) { $out = $hit; return $out; }
	$facts = (array) ( a4u_lic_json( 'lic-catalog.json' )['plans'] ?? array() );
	$notes = (array) ( a4u_lic_json( 'lic-plan-notes.json' )['plans'] ?? array() );
	$d     = a4u_lic_data();
	$out   = array();
	foreach ( $notes as $id => $n ) {
		$f    = (array) ( $facts[ $id ] ?? array() );
		$calc = ! empty( $d['plans'][ $id ]['active'] ) && empty( $d['plans'][ $id ]['closed'] );
		$out[ (string) $id ] = array(
			'id'       => (string) $id,
			'name'     => (string) $n['name'],
			'slug'     => (string) $n['slug'],
			'cat'      => (string) $n['category'],
			'status'   => (string) $n['status'],
			'tagline'  => (string) $n['tagline'],
			'points'   => (array) $n['points'],
			'best_for' => (string) $n['best_for'],
			'facts'    => $f,
			'calc'     => $calc,
			'brochure' => (string) ( $d['plans'][ $id ]['brochure'] ?? '' ),
			'uin'      => (string) ( ( $n['uin'] ?? '' ) ?: ( $d['plans'][ $id ]['uin'] ?? ( $f['uin'] ?? '' ) ) ),
			'lic_url'  => (string) ( $n['lic_url'] ?? '' ),     // LIC चं अधिकृत plan पान
			'replaced' => (string) ( $n['replaced_by'] ?? '' ),
			'tr'       => (array) ( $n['tr'] ?? array() ),       // mr/hi: [ओळख, कोणासाठी]
			'srb'      => (float) ( $d['plans'][ $id ]['srb'] ?? 0 ),
			'fab'      => (float) ( $d['plans'][ $id ]['fab'] ?? 0 ),
			'form'     => a4u_lic_form_for( (string) $id ),
		);
	}
	uasort( $out, function ( $a, $b ) {
		$o = array_keys( a4u_lic_cat_labels() );
		$c = array_search( $a['cat'], $o, true ) <=> array_search( $b['cat'], $o, true );
		if ( 0 !== $c ) { return $c; }
		$s = ( 'closed' === $a['status'] ) <=> ( 'closed' === $b['status'] );
		return 0 !== $s ? $s : strcmp( $a['id'], $b['id'] );
	} );
	wp_cache_set( $ck, $out, 'a4u_lic', HOUR_IN_SECONDS );
	return $out;
}

// मराठी/हिंदी मजकूर data-mr / data-hi attributes मध्ये (भाषा-बटणाने बदलतो)
function a4u_lic_tr_attr( $p, $i ) {
	$o = '';
	foreach ( array( 'mr', 'hi' ) as $l ) {
		if ( ! empty( $p['tr'][ $l ][ $i ] ) ) { $o .= ' data-' . $l . '="' . esc_attr( $p['tr'][ $l ][ $i ] ) . '"'; }
	}
	return $o;
}

function a4u_lic_plan_by_slug( $slug ) {
	foreach ( a4u_lic_catalog() as $p ) {
		if ( $p['slug'] === $slug ) { return $p; }
	}
	// फक्त plan नंबर दिला असेल (उदा. /lic-plans/736/)
	$cat = a4u_lic_catalog();
	return isset( $cat[ $slug ] ) ? $cat[ $slug ] : null;
}

function a4u_lic_plan_url( $p ) { return home_url( '/' . a4u_lic_hub_slug() . '/' . $p['slug'] . '/' ); }

// tools (प्रत्येकाचं स्वतंत्र पान /lic-plans/<key>/)
function a4u_lic_tools() {
	// [0] title, [1] description, [2] icon, [3] [mr title, mr description], [4] [hi title, hi description] — v4.6 (S1)
	return array(
		'premium-calculator'  => array( 'LIC Premium Calculator', 'Premium, maturity, year-wise surrender and loan value for popular LIC plans.', '🧮', array( 'LIC Premium Calculator', 'लोकप्रिय LIC plans चा premium, maturity, दरवर्षीचं surrender आणि कर्ज मूल्य.' ), array( 'LIC Premium Calculator', 'लोकप्रिय LIC plans का premium, maturity, हर साल का surrender और लोन मूल्य.' ) ),
		'compare-plans'       => array( 'Compare LIC Plans', 'Put 2 or 3 LIC plans side by side for the same age and cover.', '⚖️', array( 'LIC Plans ची तुलना', 'एकाच वयासाठी आणि विमा रकमेसाठी 2 किंवा 3 LIC plans शेजारी शेजारी पहा.' ), array( 'LIC Plans की तुलना', 'एक ही उम्र और बीमा राशि के लिए 2 या 3 LIC plans साथ-साथ देखें.' ) ),
		'revival-calculator'  => array( 'Policy Revival Calculator', 'Estimate the amount needed to restart a lapsed LIC policy.', '🔄', array( 'Policy Revival Calculator', 'बंद पडलेली LIC policy पुन्हा सुरू करायला किती रक्कम लागेल त्याचा अंदाज.' ), array( 'Policy Revival Calculator', 'बंद हुई LIC policy दोबारा शुरू करने के लिए ज़रूरी राशि का अनुमान.' ) ),
		'bonus-rates'         => array( 'LIC Bonus Rates', 'Bonus rates used for LIC with-profit plans in our illustrations.', '🎁', array( 'LIC Bonus दर', 'आमच्या हिशोबात LIC with-profit plans साठी वापरलेले bonus दर.' ), array( 'LIC Bonus दरें', 'हमारी गणना में LIC with-profit plans के लिए इस्तेमाल bonus दरें.' ) ),
		'branch-locator'      => array( 'LIC Branch Locator', 'Find an LIC branch office by city, PIN code or name.', '📍', array( 'LIC शाखा शोधा', 'शहर, पिन कोड किंवा नावाने LIC शाखा कार्यालय शोधा.' ), array( 'LIC शाखा खोजें', 'शहर, पिन कोड या नाम से LIC शाखा कार्यालय खोजें.' ) ),
		'lic-services'        => array( 'LIC Online Services', 'Official LIC links: pay premium, e-NACH, policy status, NAV, claims.', '🔗', array( 'LIC Online सेवा', 'LIC च्या अधिकृत links: premium भरणे, e-NACH, policy status, NAV, claims.' ), array( 'LIC Online सेवाएँ', 'LIC के आधिकारिक links: premium भरें, e-NACH, policy status, NAV, claims.' ) ),
		'goal-planner'        => array( 'Goal Planner (Needs Analysis)', 'Cost of your goal, cover your family needs, retirement corpus, and the monthly saving to get there, with LIC plans and SIP options to discuss.', '🎯', array( 'ध्येय नियोजन (गरजांचं विश्लेषण)', 'ध्येयाचा खर्च, कुटुंबाला लागणारं cover, निवृत्तीची रक्कम आणि त्यासाठी लागणारी मासिक बचत — चर्चेसाठी LIC plans आणि SIP पर्यायांसह.' ), array( 'लक्ष्य योजना (ज़रूरतों का विश्लेषण)', 'लक्ष्य की लागत, परिवार को ज़रूरी cover, सेवानिवृत्ति राशि और उसके लिए ज़रूरी मासिक बचत — चर्चा के लिए LIC plans और SIP विकल्पों के साथ.' ) ),
		'medical-tests'       => array( 'LIC Medical Tests Checker', 'Which special medical reports LIC may ask for, by age and total sum assured.', '🩺', array( 'LIC Medical तपासण्या', 'वय आणि एकूण विमा रकमेनुसार LIC कोणते विशेष medical reports मागू शकते.' ), array( 'LIC Medical जाँच', 'उम्र और कुल बीमा राशि के अनुसार LIC कौन-सी विशेष medical reports माँग सकता है.' ) ),
		'policy-service-guide' => array( 'LIC Policy Service Guide', 'Loan, nominee, NACH, mode change, bank and PAN update, address change, assignment and ULIP rules, plus older plan versions (914, 915, 936, 945…).', '📘', array( 'LIC Policy सेवा मार्गदर्शक', 'कर्ज, nominee, NACH, हप्त्याची पद्धत बदल, बँक आणि PAN update, पत्ता बदल, assignment आणि ULIP नियम, तसेच जुने plans (914, 915, 936, 945…).' ), array( 'LIC Policy सेवा गाइड', 'लोन, nominee, NACH, किस्त का तरीका बदलना, बैंक और PAN update, पता बदलना, assignment और ULIP नियम, साथ में पुराने plans (914, 915, 936, 945…).' ) ),
	);
}
function a4u_lic_tool_url( $k ) { return home_url( '/' . a4u_lic_hub_slug() . '/' . $k . '/' ); }

/* =====================================================================
 * 2. URLs (rewrite) — /lic-plans/, /lic-plans/<plan-slug>/, /lic-plans/<tool>/
 * ===================================================================== */

add_action( 'init', function () {
	$h = preg_quote( a4u_lic_hub_slug(), '#' );
	add_rewrite_rule( '^' . $h . '/?$', 'index.php?a4u_hub=hub', 'top' );
	add_rewrite_rule( '^' . $h . '/([a-z0-9-]+)/?$', 'index.php?a4u_hub=$matches[1]', 'top' );
	add_rewrite_rule( '^lic-plans-sitemap\.xml$', 'index.php?a4u_hub=sitemap', 'top' );
}, 9 );
add_filter( 'query_vars', function ( $v ) { $v[] = 'a4u_hub'; return $v; } );

// सध्याचं hub पान: array( 'type' => hub|plan|tool|sitemap, ... ) किंवा null
function a4u_lic_hub_route() {
	static $r = false;
	if ( false !== $r ) { return $r; }
	$q = sanitize_title( (string) get_query_var( 'a4u_hub' ) );
	$r = null;
	if ( '' === $q ) { return $r; }
	if ( 'hub' === $q ) { $r = array( 'type' => 'hub' ); }
	elseif ( 'sitemap' === $q ) { $r = array( 'type' => 'sitemap' ); }
	elseif ( isset( a4u_lic_tools()[ $q ] ) ) { $r = array( 'type' => 'tool', 'key' => $q ); }
	elseif ( ( $p = a4u_lic_plan_by_slug( $q ) ) ) { $r = array( 'type' => 'plan', 'plan' => $p ); }
	return $r;
}

add_filter( 'pre_handle_404', function ( $pre ) { return a4u_lic_hub_route() ? true : $pre; } );

add_action( 'template_redirect', function () {
	$r = a4u_lic_hub_route();
	if ( ! $r ) {
		if ( '' !== (string) get_query_var( 'a4u_hub' ) ) { return; } // चुकीचा slug → WordPress चं 404
		return;
	}
	global $wp_query;
	$wp_query->is_404  = false;
	$wp_query->is_home = false;
	$wp_query->is_page = true;
	status_header( 200 );
	if ( 'sitemap' === $r['type'] ) { a4u_lic_sitemap_xml(); exit; }
	// plan नंबरने आलं तर canonical slug वर पाठवा
	if ( 'plan' === $r['type'] && sanitize_title( (string) get_query_var( 'a4u_hub' ) ) !== $r['plan']['slug'] ) {
		wp_safe_redirect( a4u_lic_plan_url( $r['plan'] ), 301 );
		exit;
	}
	a4u_lic_hub_assets( $r );
} );

add_filter( 'template_include', function ( $tpl ) {
	return a4u_lic_hub_route() ? plugin_dir_path( A4U_LIC_FILE ) . 'includes/hub-template.php' : $tpl;
}, 99 );

add_filter( 'body_class', function ( $c ) {
	if ( a4u_lic_hub_route() ) { $c[] = 'a4u-hub-page'; }
	return $c;
} );

/* =====================================================================
 * 3. SEO: title, description, canonical, JSON-LD, sitemap
 * ===================================================================== */

function a4u_lic_hub_meta() {
	$r = a4u_lic_hub_route();
	if ( ! $r ) { return null; }
	$brand = 'Advisor4u';
	if ( 'hub' === $r['type'] ) {
		return array( 'All LIC Plans 2026 — Details, Benefits & Calculators | ' . $brand, 'Every current LIC plan in one place: eligibility, benefits, riders, loan, surrender, tax and proposal form, with free premium calculators.', home_url( '/' . a4u_lic_hub_slug() . '/' ) );
	}
	if ( 'tool' === $r['type'] ) {
		$t = a4u_lic_tools()[ $r['key'] ];
		return array( $t[0] . ' | ' . $brand, $t[1], a4u_lic_tool_url( $r['key'] ) );
	}
	if ( 'plan' === $r['type'] ) {
		$p = $r['plan'];
		return array( 'LIC ' . $p['name'] . ' (Plan ' . $p['id'] . ') — Benefits, Eligibility' . ( $p['calc'] ? ' & Calculator' : '' ) . ' | ' . $brand, wp_trim_words( $p['tagline'], 28, '' ) . ' Entry age, term, Sum Assured, riders, loan and tax explained.', a4u_lic_plan_url( $p ) );
	}
	return null;
}
add_filter( 'pre_get_document_title', function ( $t ) { $m = a4u_lic_hub_meta(); return $m ? $m[0] : $t; }, 30 );
add_filter( 'rank_math/frontend/title', function ( $t ) { $m = a4u_lic_hub_meta(); return $m ? $m[0] : $t; } );
add_filter( 'rank_math/frontend/description', function ( $t ) { $m = a4u_lic_hub_meta(); return $m ? $m[1] : $t; } );
add_filter( 'rank_math/frontend/canonical', function ( $t ) { $m = a4u_lic_hub_meta(); return $m ? $m[2] : $t; } );
add_filter( 'rank_math/frontend/robots', function ( $robots ) {
	if ( a4u_lic_hub_route() ) { $robots['index'] = 'index'; $robots['follow'] = 'follow'; }
	return $robots;
} );

add_action( 'wp_head', function () {
	$r = a4u_lic_hub_route();
	$m = a4u_lic_hub_meta();
	if ( ! $r || ! $m ) { return; }
	// description / canonical: tools.php (S7) मध्ये — इतर SEO plugin चे tags काढून
	$crumbs = array( array( 'Home', home_url( '/' ) ), array( 'LIC Plans', home_url( '/' . a4u_lic_hub_slug() . '/' ) ) );
	if ( 'plan' === $r['type'] ) { $crumbs[] = array( $r['plan']['name'], $m[2] ); }
	if ( 'tool' === $r['type'] ) { $crumbs[] = array( a4u_lic_tools()[ $r['key'] ][0], $m[2] ); }
	$graph = array(
		array(
			'@type'           => 'BreadcrumbList',
			'itemListElement' => array_map( function ( $c, $i ) { return array( '@type' => 'ListItem', 'position' => $i + 1, 'name' => $c[0], 'item' => $c[1] ); }, $crumbs, array_keys( $crumbs ) ),
		),
	);
	if ( 'plan' === $r['type'] ) {
		$graph[] = array( '@type' => 'FAQPage', 'mainEntity' => array_map( function ( $q ) {
			return array( '@type' => 'Question', 'name' => $q[0], 'acceptedAnswer' => array( '@type' => 'Answer', 'text' => wp_strip_all_tags( $q[1] ) ) );
		}, a4u_lic_plan_faq( $r['plan'] ) ) );
	}
	echo '<script type="application/ld+json">' . wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => $graph ) ) . "</script>\n";
}, 5 );

function a4u_lic_hub_urls() {
	$u = array( home_url( '/' . a4u_lic_hub_slug() . '/' ) );
	foreach ( a4u_lic_tools() as $k => $t ) { $u[] = a4u_lic_tool_url( $k ); }
	foreach ( a4u_lic_catalog() as $p ) { $u[] = a4u_lic_plan_url( $p ); }
	return $u;
}
function a4u_lic_sitemap_xml() {
	header( 'Content-Type: application/xml; charset=UTF-8' );
	$mod = gmdate( 'Y-m-d', (int) filemtime( plugin_dir_path( A4U_LIC_FILE ) . 'assets/data/lic-catalog.json' ) );
	echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
	foreach ( a4u_lic_hub_urls() as $u ) { echo '<url><loc>' . esc_url( $u ) . '</loc><lastmod>' . esc_html( $mod ) . "</lastmod></url>\n"; }
	echo '</urlset>';
}
// Rank Math sitemap index मध्ये आपला sitemap; robots.txt मध्येही
add_filter( 'rank_math/sitemap/index', function ( $xml ) {
	return $xml . '<sitemap><loc>' . esc_url( home_url( '/lic-plans-sitemap.xml' ) ) . '</loc><lastmod>' . esc_html( gmdate( 'c' ) ) . '</lastmod></sitemap>';
} );
add_filter( 'robots_txt', function ( $txt ) { return $txt . "\nSitemap: " . home_url( '/lic-plans-sitemap.xml' ) . "\n"; }, 20 );

/* =====================================================================
 * 4. Assets
 * ===================================================================== */

function a4u_lic_hub_assets( $r ) {
	$url = plugin_dir_url( A4U_LIC_FILE );
	add_action( 'wp_enqueue_scripts', function () use ( $url, $r ) {
		wp_enqueue_style( 'a4u-lic', $url . 'assets/a4u-lic.css', array(), A4U_LIC_VER );
		wp_enqueue_style( 'a4u-lic-hub', $url . 'assets/a4u-lic-hub.css', array( 'a4u-lic' ), A4U_LIC_VER );
		wp_enqueue_script( 'a4u-lic-hub', $url . 'assets/a4u-lic-hub.js', array(), A4U_LIC_VER, true );
		wp_add_inline_script( 'a4u-lic-hub', 'window.A4U_HUB=' . wp_json_encode( a4u_lic_hub_config( $r ) ) . ';', 'before' );
	}, 20 );
}

function a4u_lic_hub_config( $r = null ) {
	$d = a4u_lic_data();
	$s = $d['settings'];
	return array(
		'rest'     => esc_url_raw( rest_url( 'a4u-lic/v1/' ) ),
		'data'     => plugin_dir_url( A4U_LIC_FILE ) . 'assets/data/',
		'ver'      => A4U_LIC_VER,
		'vendor'   => plugin_dir_url( A4U_LIC_FILE ) . 'assets/vendor/',
		'whatsapp' => preg_replace( '/\D/', '', (string) ( $s['whatsapp'] ?? '' ) ),
		'page'     => $r ? $r['type'] : '',
		'plan'     => ( $r && 'plan' === $r['type'] ) ? $r['plan']['id'] : '',
		'planName' => ( $r && 'plan' === $r['type'] ) ? 'LIC ' . $r['plan']['name'] . ' (' . $r['plan']['id'] . ')' : '',
		'brand'    => array(
			'name'  => (string) ( $s['brand_name'] ?? 'Sahare Financial Services' ),
			'agent' => (string) ( $s['agent_name'] ?? '' ),
			'code'  => (string) ( $s['agency_code'] ?? '' ),
			'phone' => (string) ( $s['brand_phone'] ?? '' ),
			'web'   => (string) ( $s['brand_web'] ?? home_url( '/' ) ),
			'logo'  => '' !== (string) ( $s['logo_url'] ?? '' ) ? (string) $s['logo_url'] : plugin_dir_url( A4U_LIC_FILE ) . 'assets/brand-logo.png',
		),
	);
}

/* =====================================================================
 * 5. मजकूर तयार करणारे helpers
 * ===================================================================== */

function a4u_lic_fact_rows( $p ) {
	$f   = $p['facts'];
	$map = array(
		'min_age'      => 'Minimum entry age',
		'max_age'      => 'Maximum entry age',
		'term'         => 'Policy term',
		'ppt'          => 'Premium paying term',
		'max_maturity' => 'Maximum maturity age',
		'min_sa'       => 'Minimum Sum Assured',
		'max_sa'       => 'Maximum Sum Assured',
		'min_price'    => 'Minimum premium / purchase price',
		'max_price'    => 'Maximum premium / purchase price',
		'deferment'    => 'Deferment period',
		'modes'        => 'Premium payment modes',
		'riders'       => 'Riders available',
		'loan'         => 'Policy loan',
		'tax'          => 'Income tax',
		'launch'       => 'Launched',
	);
	$rows = array();
	foreach ( $map as $k => $label ) {
		if ( ! empty( $f[ $k ] ) ) { $rows[] = array( $label, $f[ $k ] ); }
	}
	$rows[] = array( 'Proposal form', $p['form'] );
	if ( '' !== $p['uin'] ) { $rows[] = array( 'UIN', $p['uin'] ); }
	return $rows;
}

/* =====================================================================
 * v4.6.8 (S1): प्रत्येक plan प्रकारासाठी कर नियम — en / mr / hi (सामान्य माहिती, plan च्या category + single premium वरून)
 * ===================================================================== */
function a4u_lic_tax_rules( $p ) {
	$cat    = (string) $p['cat'];
	$modes  = strtolower( (string) ( $p['facts']['modes'] ?? '' ) );
	$single = false !== strpos( $modes, 'single' );
	$onlysp = $single && ! preg_match( '/yearly|monthly|quarter|regular|limited/', $modes );
	$r      = array();
	$r80c   = array( 'Premium deduction under Section 80C (old tax regime only) is allowed on premium up to 10% of the Sum Assured, within the overall ₹1.5 lakh limit.', 'Premium वर कलम 80C ची वजावट (फक्त जुनी कर पद्धत) विमा रकमेच्या 10% पर्यंतच्या premium वर, एकूण ₹1.5 लाख मर्यादेत मिळते.', 'Premium पर धारा 80C की कटौती (केवल पुरानी कर व्यवस्था) बीमा राशि के 10% तक के premium पर, कुल ₹1.5 लाख सीमा में मिलती है।' );
	$death  = array( 'Death benefit paid to the nominee is tax-free.', 'Nominee ला मिळणारा मृत्यू लाभ करमुक्त असतो.', 'Nominee को मिलने वाला मृत्यु लाभ करमुक्त होता है।' );
	if ( 'health' === $cat ) {
		$r[] = array( 'Premium may qualify for deduction under Section 80D (health insurance, old tax regime).', 'Premium वर कलम 80D (आरोग्य विमा, जुनी कर पद्धत) ची वजावट मिळू शकते.', 'Premium पर धारा 80D (स्वास्थ्य बीमा, पुरानी कर व्यवस्था) की कटौती मिल सकती है।' );
		$r[] = array( 'Benefit amounts paid on diagnosis or hospitalisation are generally not taxable.', 'आजाराचं निदान किंवा hospital खर्चासाठी मिळणारी रक्कम साधारणपणे करपात्र नसते.', 'बीमारी के निदान या अस्पताल खर्च पर मिलने वाली राशि सामान्यतः करयोग्य नहीं होती।' );
	} elseif ( 'pension' === $cat ) {
		$r[] = array( 'Pension (annuity) received is taxable every year as income at your slab rate.', 'मिळणारी pension (annuity) दरवर्षी तुमच्या slab नुसार उत्पन्न म्हणून करपात्र असते.', 'मिलने वाली pension (annuity) हर साल आपके slab के अनुसार आय के रूप में करयोग्य होती है।' );
		$r[] = array( 'Deduction on the purchase price depends on the plan (some deferred pension plans qualify under Section 80CCC; immediate annuity plans usually do not) - see the LIC note above.', 'खरेदी रकमेवर वजावट plan नुसार ठरते (काही deferred pension plans ना कलम 80CCC; immediate annuity ला साधारणपणे नाही) — वरची LIC ची टीप पहा.', 'खरीद राशि पर कटौती plan पर निर्भर है (कुछ deferred pension plans को धारा 80CCC; immediate annuity को आमतौर पर नहीं) — ऊपर LIC की टिप्पणी देखें।' );
		$r[] = $death;
	} elseif ( 'ulip' === $cat ) {
		$r[] = $r80c;
		$r[] = array( 'Maturity is tax-free only if the yearly premium is not more than 10% of the Sum Assured and, for ULIPs issued on or after 1 February 2021, your total ULIP premium is not more than ₹2.5 lakh a year; otherwise gains are taxed as capital gains.', 'Maturity करमुक्त फक्त तेव्हा: वर्षाचा premium विमा रकमेच्या 10% पेक्षा जास्त नसेल आणि 1 फेब्रुवारी 2021 नंतरच्या ULIP चा एकूण premium वर्षाला ₹2.5 लाखांपेक्षा जास्त नसेल; नाहीतर नफ्यावर capital gains कर.', 'Maturity करमुक्त तभी: साल का premium बीमा राशि के 10% से अधिक न हो और 1 फरवरी 2021 के बाद के ULIP का कुल premium साल में ₹2.5 लाख से अधिक न हो; अन्यथा लाभ पर capital gains कर।' );
		$r[] = $death;
	} else {
		$r[] = $r80c;
		if ( 'term' === $cat ) {
			$r[] = $death;
			$r[] = array( 'If the plan returns premiums at maturity, that amount follows the same Section 10(10D) conditions as savings plans.', 'Plan मध्ये maturity ला premium परत मिळत असतील तर त्या रकमेला बचत plans सारख्याच कलम 10(10D) च्या अटी लागू.', 'यदि plan में maturity पर premium वापस मिलते हैं तो उस राशि पर बचत plans जैसी ही धारा 10(10D) की शर्तें लागू।' );
		} else {
			$r[] = array( 'Maturity, survival benefits (money back / income) and bonus are tax-free under Section 10(10D) only if the premium in every year is not more than 10% of the Sum Assured and, for policies issued on or after 1 April 2023, your total premium on such policies is not more than ₹5 lakh a year. Otherwise they are taxable as income.', 'Maturity, survival लाभ (money back / उत्पन्न) आणि bonus कलम 10(10D) खाली करमुक्त फक्त तेव्हा: प्रत्येक वर्षीचा premium विमा रकमेच्या 10% पेक्षा जास्त नसेल आणि 1 एप्रिल 2023 नंतरच्या अशा policies चा एकूण premium वर्षाला ₹5 लाखांपेक्षा जास्त नसेल. नाहीतर ते उत्पन्न म्हणून करपात्र.', 'Maturity, survival लाभ (money back / आय) और bonus धारा 10(10D) के तहत करमुक्त तभी: हर साल का premium बीमा राशि के 10% से अधिक न हो और 1 अप्रैल 2023 के बाद की ऐसी policies का कुल premium साल में ₹5 लाख से अधिक न हो। अन्यथा आय के रूप में करयोग्य।' );
			if ( $single ) {
				$r[] = array( $onlysp ? 'This is a single premium plan: the one-time premium is usually more than 10% of the Sum Assured, so 80C is limited to 10% of the Sum Assured and maturity / income is usually taxable. Our calculator shows this for your figures.' : 'If you choose single premium, the premium is usually more than 10% of the Sum Assured: 80C is then limited to 10% of the Sum Assured and maturity / income is usually taxable.', $onlysp ? 'हा single premium plan आहे: एकरकमी premium साधारणपणे विमा रकमेच्या 10% पेक्षा जास्त असतो, त्यामुळे 80C फक्त विमा रकमेच्या 10% पर्यंत आणि maturity / उत्पन्न साधारणपणे करपात्र. आपला calculator तुमच्या आकड्यांसाठी हे दाखवतो.' : 'Single premium निवडल्यास premium साधारणपणे विमा रकमेच्या 10% पेक्षा जास्त असतो: तेव्हा 80C फक्त 10% पर्यंत आणि maturity / उत्पन्न साधारणपणे करपात्र.', $onlysp ? 'यह single premium plan है: एकमुश्त premium आमतौर पर बीमा राशि के 10% से अधिक होता है, इसलिए 80C केवल बीमा राशि के 10% तक और maturity / आय आमतौर पर करयोग्य। हमारा calculator आपके आँकड़ों के लिए यह दिखाता है।' : 'Single premium चुनने पर premium आमतौर पर बीमा राशि के 10% से अधिक होता है: तब 80C केवल 10% तक और maturity / आय आमतौर पर करयोग्य।' );
			}
			$r[] = $death;
		}
	}
	$r[] = array( 'Section numbers are from the Income-tax Act, 1961; the Income-tax Act, 2025 (from 1 April 2026) carries similar rules under new section numbers. General information only - please check with your tax adviser.', 'कलमांचे क्रमांक Income-tax Act, 1961 नुसार; 1 एप्रिल 2026 पासूनच्या Income-tax Act, 2025 मध्ये असेच नियम नवीन क्रमांकांनी आहेत. ही सामान्य माहिती आहे — तुमच्या कर सल्लागाराशी खात्री करा.', 'धाराओं के क्रमांक Income-tax Act, 1961 के अनुसार; 1 अप्रैल 2026 से Income-tax Act, 2025 में ऐसे ही नियम नए क्रमांकों से हैं। यह सामान्य जानकारी है — अपने कर सलाहकार से पुष्टि करें।' );
	return $r;
}

function a4u_lic_plan_faq( $p ) {
	$f  = $p['facts'];
	$nm = 'LIC ' . $p['name'];
	$q  = array();
	$q[] = array( 'What is ' . $nm . ' (Plan ' . $p['id'] . ')?', $p['tagline'] );
	if ( ! empty( $f['min_age'] ) || ! empty( $f['max_age'] ) ) {
		$q[] = array( 'Who can buy ' . $nm . '?', 'Minimum entry age: ' . ( $f['min_age'] ?? '—' ) . '. Maximum entry age: ' . ( $f['max_age'] ?? '—' ) . '.' . ( ! empty( $f['max_maturity'] ) ? ' Maximum age at maturity: ' . $f['max_maturity'] . '.' : '' ) );
	}
	if ( ! empty( $f['min_sa'] ) ) {
		$q[] = array( 'What is the minimum Sum Assured in ' . $nm . '?', $f['min_sa'] . ( ! empty( $f['max_sa'] ) ? ' Maximum: ' . $f['max_sa'] . '.' : '' ) );
	}
	if ( ! empty( $f['loan'] ) ) { $q[] = array( 'Can I take a loan on ' . $nm . '?', $f['loan'] ); }
	$q[] = array( 'Which proposal form is used for ' . $nm . '?', $p['form'] . '.' );
	$tx = implode( ' ', array_map( function ( $x ) { return $x[0]; }, a4u_lic_tax_rules( $p ) ) );
	$q[] = array( 'Is ' . $nm . ' eligible for tax benefits?', ( ! empty( $f['tax'] ) ? 'LIC note: ' . rtrim( $f['tax'], '. ' ) . '. ' : '' ) . $tx ); // v4.6.8
	$q[] = array( 'Who is ' . $nm . ' best suited for?', $p['best_for'] . '.' );
	return $q;
}

function a4u_lic_badge( $p ) {
	$cats = a4u_lic_cat_labels();
	$c    = $cats[ $p['cat'] ] ?? array( 'LIC plan', '#555' );
	$h    = '<span class="a4h-badge" style="--c:' . esc_attr( $c[1] ) . '">' . esc_html( $c[0] ) . '</span>';
	if ( 'closed' === $p['status'] ) { $h .= '<span class="a4h-badge a4h-closed">Closed for new business</span>'; }
	if ( $p['calc'] ) { $h .= '<span class="a4h-badge a4h-calc">Calculator</span>'; }
	return $h;
}

function a4u_lic_disclaimer() {
	$d     = a4u_lic_data();
	$s     = $d['settings'];
	$agent = trim( (string) ( $s['agent_name'] ?? '' ) );
	$code  = trim( (string) ( $s['agency_code'] ?? '' ) );
	$h     = '<div class="a4h-disc"><p><b>Important:</b> This page is prepared by ' . esc_html( (string) ( $s['brand_name'] ?? 'Sahare Financial Services' ) ) . ' for general information. It is not an official LIC of India page. Benefits, bonus rates, premiums and terms are as per the LIC sales brochure and can change; the policy document and LIC\'s official sales illustration are final. Bonuses are not guaranteed. Please read the sales brochure carefully before concluding a sale.</p>';
	if ( '' !== $agent ) {
		$h .= '<p>Insurance is offered by ' . esc_html( $agent ) . ', LIC of India agent' . ( '' !== $code ? ' (Agency code ' . esc_html( $code ) . ')' : '' ) . '. Insurance is the subject matter of solicitation.</p>';
	}
	return $h . '</div>';
}

function a4u_lic_lead_box( $plan_label ) {
	return '<section class="a4h-lead" id="a4h-lead"><h2 data-a4h-i18n="lead_h">Get a free quote and advice</h2><p data-a4h-i18n="lead_p">Share your name and mobile number. Our advisor will call you with an exact LIC quote.</p>' .
		'<form class="a4h-leadform" novalidate><input type="hidden" name="plan" value="' . esc_attr( $plan_label ) . '">' .
		'<label><span data-a4h-i18n="name">Name</span><input name="name" maxlength="100" autocomplete="name" required></label>' .
		'<label><span data-a4h-i18n="mobile">Mobile</span><input name="mobile" inputmode="numeric" maxlength="13" autocomplete="tel" required></label>' .
		'<input class="a4h-hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' .
		'<label class="a4h-ck"><input type="checkbox" name="consent" value="1" required> <span data-a4h-i18n="consent">I agree to be contacted by phone or WhatsApp about LIC plans.</span></label>' .
		'<button type="submit" class="a4h-btn" data-a4h-i18n="send">Request call back</button><p class="a4h-msg" role="status"></p></form></section>';
}

/* =====================================================================
 * 6. Hub पान
 * ===================================================================== */

function a4u_lic_render_hub() {
	$cats = a4u_lic_cat_labels();
	$all  = a4u_lic_catalog();
	$h    = '<header class="a4h-hero"><p class="a4h-kicker">LIC of India · Plan guide 2026</p><h1 data-a4h-i18n="hub_h">All LIC Plans — details, benefits and calculators</h1>' .
		'<p class="a4h-lede" data-a4h-i18n="hub_p">Choose a plan to see who can buy it, what it pays, riders, loan, surrender value, tax and the proposal form. Popular plans have a free premium and benefit calculator.</p>' .
		'<div class="a4h-langs" role="group" aria-label="Language"><button type="button" data-lang="en" class="on">English</button><button type="button" data-lang="mr">मराठी</button><button type="button" data-lang="hi">हिंदी</button></div></header>';
	// tools पट्टी
	$h .= '<nav class="a4h-tools" aria-label="LIC tools">';
	foreach ( a4u_lic_tools() as $k => $t ) {
		$h .= '<a class="a4h-tool" href="' . esc_url( a4u_lic_tool_url( $k ) ) . '"><span class="i" aria-hidden="true">' . esc_html( $t[2] ) . '</span><b>' . esc_html( $t[0] ) . '</b><small>' . esc_html( $t[1] ) . '</small></a>';
	}
	$h .= '</nav>';
	// Plan finder
	$h .= '<section class="a4h-finder" aria-label="Plan finder"><h2 data-a4h-i18n="finder_h">Find the right plan</h2><div class="a4h-frow">' .
		'<label><span data-a4h-i18n="age">Your age</span><input type="number" min="0" max="85" id="a4h-age" placeholder="e.g. 32"></label>' .
		'<label><span data-a4h-i18n="search">Search</span><input type="search" id="a4h-q" placeholder="Plan name or number"></label>' .
		'<label class="a4h-ck"><input type="checkbox" id="a4h-open" checked> <span data-a4h-i18n="open_only">Only plans open for sale</span></label></div>' .
		'<div class="a4h-chips" role="group" aria-label="Plan type"><button type="button" class="on" data-cat="">All</button>';
	foreach ( $cats as $k => $c ) { $h .= '<button type="button" data-cat="' . esc_attr( $k ) . '" style="--c:' . esc_attr( $c[1] ) . '">' . esc_html( $c[0] ) . '</button>'; }
	$h .= '</div><p class="a4h-count" aria-live="polite"></p></section>';
	// cards
	$h .= '<div class="a4h-grid">';
	foreach ( $all as $p ) {
		$f   = $p['facts'];
		$ma  = a4u_lic_age_num( $f['min_age'] ?? '' );
		$xa  = a4u_lic_age_num( $f['max_age'] ?? '', 99 );
		$h  .= '<article class="a4h-card" data-cat="' . esc_attr( $p['cat'] ) . '" data-status="' . esc_attr( $p['status'] ) . '" data-min="' . esc_attr( $ma ) . '" data-max="' . esc_attr( $xa ) . '" data-q="' . esc_attr( strtolower( $p['name'] . ' ' . $p['id'] ) ) . '">' .
			'<div class="a4h-badges">' . a4u_lic_badge( $p ) . '</div>' .
			'<h3><a href="' . esc_url( a4u_lic_plan_url( $p ) ) . '">' . esc_html( $p['name'] ) . ' <span class="no">' . esc_html( $p['id'] ) . '</span></a></h3>' .
			'<p' . a4u_lic_tr_attr( $p, 0 ) . '>' . esc_html( $p['tagline'] ) . '</p><dl class="a4h-mini">' .
			a4u_lic_mini( 'Entry age', a4u_lic_card_age( $f['min_age'] ?? '', $f['max_age'] ?? '' ) ) .
			a4u_lic_mini( 'Term', a4u_lic_card_term( $f['term'] ?? '' ) ) .
			a4u_lic_mini( 'Min. cover', a4u_lic_card_money( $f['min_sa'] ?? ( $f['min_price'] ?? '' ) ) ) .
			'</dl><div class="a4h-actions"><a class="a4h-btn ghost" href="' . esc_url( a4u_lic_plan_url( $p ) ) . '" data-a4h-i18n="details">Plan details</a>' .
			( $p['calc'] ? '<a class="a4h-btn" href="' . esc_url( a4u_lic_plan_url( $p ) ) . '#a4h-calc" data-a4h-i18n="calc">Calculate</a>' : '' ) . '</div></article>';
	}
	$h .= '</div><p class="a4h-none" hidden data-a4h-i18n="none">No plan matches. Clear the filters or ask us on WhatsApp.</p>';
	$h .= a4u_lic_lead_box( 'LIC plan hub' ) . a4u_lic_disclaimer();
	return $h;
}

// cards साठी स्वच्छ छोटे आकडे (नाहीतर काहीच नाही)
function a4u_lic_mini( $label, $val ) { return '' === $val ? '' : '<div><dt>' . esc_html( $label ) . '</dt><dd>' . esc_html( $val ) . '</dd></div>'; }
function a4u_lic_card_age_one( $t ) {
	$t = (string) $t;
	if ( preg_match( '/^\D{0,12}?(\d{1,3})\s*(days?|months?|years?|yrs?)?/i', $t, $m ) ) {
		$u = strtolower( $m[2] ?? '' );
		return $m[1] . ( 0 === strpos( $u, 'day' ) ? ' days' : ( 0 === strpos( $u, 'month' ) ? ' months' : '' ) );
	}
	return '';
}
function a4u_lic_card_age( $min, $max ) {
	$a = a4u_lic_card_age_one( $min );
	$b = a4u_lic_card_age_one( $max );
	if ( '' === $a || '' === $b ) { return ''; }
	if ( false === strpos( $a, ' ' ) && (int) $b < (int) $a ) { return ''; } // उलटं वाचलं → दाखवू नका
	return $a . ' – ' . $b . ( false === strpos( $b, ' ' ) ? ' yrs' : '' );
}
function a4u_lic_card_term( $t ) {
	$t = (string) $t;
	if ( preg_match( '/^\s*(\d{1,2})\s*(?:to|-|–)\s*(\d{1,2})\s*(years?|yrs?)?/i', $t, $m ) ) { return $m[1] . '–' . $m[2] . ' yrs'; }
	if ( preg_match_all( '/(\d{1,2})\s*years?\s*(?:,|\.|and\s+\d)/i', $t, $mm ) && count( $mm[1] ) > 1 ) { return implode( '/', $mm[1] ) . ' yrs'; }
	if ( preg_match( '/^\s*(\d{1,2})\s*(years?|yrs?)?\s*(\(|$|fixed|and\b)/i', $t, $m ) ) { return $m[1] . ' yrs'; }
	if ( preg_match( '/^\s*(\d{2})\s*[-_–]\s*age/i', $t, $m ) ) { return 'Till age ' . $m[1]; }
	if ( preg_match( '/^\s*100\b/', $t ) ) { return 'Till age 100'; }
	return '';
}
function a4u_lic_card_money( $t ) {
	if ( ! preg_match( '/(\d[\d,]{3,})/', (string) $t, $m ) ) { return ''; }
	$v = (int) str_replace( ',', '', $m[1] );
	if ( $v >= 10000000 ) { return '₹' . rtrim( rtrim( number_format( $v / 10000000, 2 ), '0' ), '.' ) . ' Cr'; }
	if ( $v >= 100000 ) { return '₹' . rtrim( rtrim( number_format( $v / 100000, 2 ), '0' ), '.' ) . ' L'; }
	return '₹' . number_format( $v );
}

function a4u_lic_age_num( $txt, $def = 0 ) {
	if ( preg_match( '/(\d+)\s*days?/i', (string) $txt ) && ! preg_match( '/\b(\d{1,2})\s*(years?|yrs?)/i', (string) $txt ) ) { return 0; }
	if ( preg_match( '/(\d{1,3})/', (string) $txt, $m ) ) {
		if ( preg_match( '/^\s*\d+\s*days?/i', (string) $txt ) ) { return 0; }
		return (int) $m[1];
	}
	return $def;
}
function a4u_lic_hub_short( $t ) {
	$t = trim( (string) $t );
	$t = preg_replace( '/\s*\(.*?\)\s*/', ' ', $t );
	$t = preg_replace( '/\s+/', ' ', $t );
	return mb_strlen( $t ) > 34 ? rtrim( mb_substr( $t, 0, 32 ) ) . '…' : trim( $t );
}

/* =====================================================================
 * 7. Plan पान
 * ===================================================================== */

function a4u_lic_render_plan( $p ) {
	$hub = home_url( '/' . a4u_lic_hub_slug() . '/' );
	$wa  = preg_replace( '/\D/', '', (string) ( a4u_lic_data()['settings']['whatsapp'] ?? '' ) );
	$lbl = 'LIC ' . $p['name'] . ' (' . $p['id'] . ')';
	$h   = '<nav class="a4h-crumb" aria-label="Breadcrumb"><a href="' . esc_url( home_url( '/' ) ) . '">Home</a> › <a href="' . esc_url( $hub ) . '">LIC Plans</a> › <span>' . esc_html( $p['name'] ) . '</span></nav>';
	$h  .= '<header class="a4h-hero a4h-plan"><div class="a4h-badges">' . a4u_lic_badge( $p ) . '</div>' .
		'<h1>LIC ' . esc_html( $p['name'] ) . ' <span class="no">Plan ' . esc_html( $p['id'] ) . '</span></h1><p class="a4h-lede"' . a4u_lic_tr_attr( $p, 0 ) . '>' . esc_html( $p['tagline'] ) . '</p>' .
		'<div class="a4h-langs" role="group" aria-label="Language"><button type="button" data-lang="en" class="on">English</button><button type="button" data-lang="mr">मराठी</button><button type="button" data-lang="hi">हिंदी</button></div>' .
		'<div class="a4h-cta">' . ( $p['calc'] ? '<a class="a4h-btn" href="#a4h-calc" data-a4h-i18n="calc_prem">Calculate premium</a>' : '' ) .
		( $wa ? '<a class="a4h-btn wa" target="_blank" rel="noopener" href="' . esc_url( 'https://wa.me/' . $wa . '?text=' . rawurlencode( 'Hi, I want details of ' . $lbl . '.' ) ) . '" data-a4h-i18n="wa">Ask on WhatsApp</a>' : '' ) .
		'<button type="button" class="a4h-btn ghost" id="a4h-card-pdf" data-a4h-i18n="card">Download plan card</button>' .
		( $p['lic_url'] ? '<a class="a4h-btn ghost" target="_blank" rel="noopener" href="' . esc_url( $p['lic_url'] ) . '" data-a4h-i18n="licpage">Official LIC page</a>' : '' ) . '</div></header>';
	if ( 'closed' === $p['status'] ) {
		$rep = $p['replaced'] && isset( a4u_lic_catalog()[ $p['replaced'] ] ) ? a4u_lic_catalog()[ $p['replaced'] ] : null;
		$h  .= '<p class="a4h-warn">This plan is closed for new business. The details are for existing policyholders.' . ( $rep ? ' The current plan in its place is <a href="' . esc_url( a4u_lic_plan_url( $rep ) ) . '">LIC ' . esc_html( $rep['name'] ) . ' (' . esc_html( $rep['id'] ) . ')</a>.' : '' ) . '</p>';
	}
	elseif ( 'check' === $p['status'] ) { $h .= '<p class="a4h-note">Please confirm with us that this plan is currently on sale before you apply.</p>'; }

	$h .= '<div class="a4h-two"><section class="a4h-box"><h2 data-a4h-i18n="glance">At a glance</h2><table class="a4h-facts"><tbody>';
	foreach ( a4u_lic_fact_rows( $p ) as $row ) { $h .= '<tr><th>' . esc_html( $row[0] ) . '</th><td>' . esc_html( $row[1] ) . '</td></tr>'; }
	$h .= '</tbody></table></section><section class="a4h-box"><h2 data-a4h-i18n="benefits">Key benefits</h2><ul class="a4h-ticks">';
	foreach ( $p['points'] as $pt ) { $h .= '<li>' . esc_html( $pt ) . '</li>'; }
	$h .= '</ul><p class="a4h-best"><b data-a4h-i18n="best">Best for:</b> <span' . a4u_lic_tr_attr( $p, 1 ) . '>' . esc_html( $p['best_for'] ) . '</span></p>';
	if ( $p['srb'] > 0 ) { $h .= '<p class="a4h-note">Bonus used in our illustration: Simple Reversionary Bonus ₹' . esc_html( 0 + $p['srb'] ) . ' per ₹1,000 Sum Assured per year' . ( $p['fab'] > 0 ? ', Final Additional Bonus up to ₹' . esc_html( 0 + $p['fab'] ) . ' per ₹1,000' : '' ) . ' (not guaranteed).</p>'; }
	$h .= '</section></div>';

	// दृश्य: plan कसा चालतो (calculator plans साठी JS नमुना illustration ने भरलं जातं)
	$h .= '<section class="a4h-box a4h-how" id="a4h-how"><h2 data-a4h-i18n="how">How the plan works</h2>';
	if ( $p['calc'] ) {
		$h .= '<p class="a4h-sub" data-a4h-i18n="sample">Example for age 30 with a typical Sum Assured. Use the calculator below for your own figures.</p><div class="a4h-viz" data-sample="' . esc_attr( $p['id'] ) . '"><div class="a4h-skel">Loading illustration…</div></div>';
	} else {
		$h .= a4u_lic_steps_html( $p );
	}
	$h .= '</section>';

	if ( $p['calc'] ) {
		$h .= '<section class="a4h-box" id="a4h-calc"><h2 data-a4h-i18n="calc_h">Premium & benefit calculator</h2>' . do_shortcode( '[a4u_lic_calculator plan="' . esc_attr( $p['id'] ) . '" title="LIC ' . esc_attr( $p['name'] ) . ' Calculator"]' ) . '</section>';
	} else {
		$h .= '<section class="a4h-box"><h2 data-a4h-i18n="quote_h">Get an exact quote</h2><p>This plan\'s premium depends on details that need an official LIC quotation. Ask us for a free quote, or open LIC\'s official online services.</p><p><a class="a4h-btn ghost" href="' . esc_url( a4u_lic_tool_url( 'lic-services' ) ) . '">LIC online services</a></p></section>';
	}

	// documents
	$h .= '<section class="a4h-box"><h2 data-a4h-i18n="docs">Documents usually needed</h2><ul class="a4h-ticks"><li>Proposal form: ' . esc_html( $p['form'] ) . '</li><li>Age proof (birth certificate, school certificate, passport or similar)</li><li>Identity and address proof with KYC (Aadhaar, PAN)</li><li>Recent photograph and bank details for payouts (cancelled cheque)</li><li>Income proof for higher covers; medical reports if LIC asks</li></ul>' .
		( $p['brochure'] || $p['lic_url'] ? '<p class="a4h-actions">' . ( $p['brochure'] ? '<a class="a4h-btn ghost" target="_blank" rel="noopener" href="' . esc_url( $p['brochure'] ) . '">Official LIC sales brochure (PDF)</a>' : '' ) . ( $p['lic_url'] ? '<a class="a4h-btn ghost" target="_blank" rel="noopener" href="' . esc_url( $p['lic_url'] ) . '">Plan page on licindia.in</a>' : '' ) . '</p>' : '' ) . '</section>';

	// v4.6.8 (S1): कर नियम — en / mr / hi
	$h .= '<section class="a4h-box a4h-tax">' . a4u_lic_t( 'Income tax: what to know', 'आयकर: काय लक्षात ठेवायचं', 'आयकर: क्या ध्यान रखें', 'h2' ) . '<ul class="a4h-ticks">';
	foreach ( a4u_lic_tax_rules( $p ) as $x ) { $h .= a4u_lic_t( $x[0], $x[1], $x[2], 'li' ); }
	$h .= '</ul></section>';

	// FAQ
	$h .= '<section class="a4h-box a4h-faq"><h2 data-a4h-i18n="faq">Frequently asked questions</h2>';
	foreach ( a4u_lic_plan_faq( $p ) as $q ) { $h .= '<details><summary>' . esc_html( $q[0] ) . '</summary><p>' . esc_html( $q[1] ) . '</p></details>'; }
	$h .= '</section>';

	// मिळतेजुळते plans
	$sim = array_filter( a4u_lic_catalog(), function ( $x ) use ( $p ) { return $x['cat'] === $p['cat'] && $x['id'] !== $p['id'] && 'closed' !== $x['status']; } );
	if ( $sim ) {
		$h .= '<section class="a4h-box"><h2 data-a4h-i18n="similar">Similar LIC plans</h2><div class="a4h-sim">';
		foreach ( array_slice( $sim, 0, 6 ) as $x ) { $h .= '<a href="' . esc_url( a4u_lic_plan_url( $x ) ) . '"><b>' . esc_html( $x['name'] ) . '</b> <span class="no">' . esc_html( $x['id'] ) . '</span></a>'; }
		$h .= '</div><p><a href="' . esc_url( a4u_lic_tool_url( 'compare-plans' ) . '?plans=' . $p['id'] ) . '">Compare with other plans →</a></p></section>';
	}
	$h .= a4u_lic_lead_box( $lbl ) . a4u_lic_disclaimer();
	return $h;
}

// calculator नसलेल्या plans साठी पायऱ्यांचा diagram (category नुसार)
function a4u_lic_steps_html( $p ) {
	$f     = $p['facts'];
	$steps = array(
		'term'      => array( array( 'Pay premium', 'Regular, limited or single premium' ), array( 'Life cover', 'Family protected for the full term' ), array( 'On death', 'Sum Assured paid to the nominee' ), array( 'On survival', 'Nothing is paid (pure protection)' ) ),
		'pension'   => array( array( 'Invest', 'Single or regular premium' ), array( 'Wait (if deferred)', $f['deferment'] ?? 'Annuity can start immediately' ), array( 'Pension', 'Guaranteed annuity for life' ), array( 'On death', 'As per the annuity option chosen' ) ),
		'ulip'      => array( array( 'Pay premium', 'Invested in chosen LIC fund' ), array( 'Fund grows', 'Value moves with the market (NAV)' ), array( 'Lock-in', 'Partial withdrawal after 5 years' ), array( 'Maturity', 'Fund value is paid' ) ),
		'health'    => array( array( 'Pay premium', 'Yearly or half-yearly' ), array( 'Cover', 'Fixed benefit health protection' ), array( 'On claim', 'Defined amount paid as per the event' ), array( 'No maturity', 'Health plans have no maturity value' ) ),
		'moneyback' => array( array( 'Pay premium', $f['ppt'] ?? 'During the premium paying term' ), array( 'Money back', 'Part of the cover paid back during the term' ), array( 'Life cover', 'Full cover continues even after payouts' ), array( 'Maturity', 'Balance amount with additions or bonuses' ) ),
	);
	$s = $steps[ $p['cat'] ] ?? array( array( 'Pay premium', $f['ppt'] ?? 'During the premium paying term' ), array( 'Life cover', 'Family protected for the full term' ), array( 'Additions', 'Bonus or guaranteed additions accrue' ), array( 'Maturity', 'Sum Assured plus additions paid' ) );
	$h = '<ol class="a4h-steps">';
	foreach ( $s as $i => $x ) { $h .= '<li><span class="n">' . ( $i + 1 ) . '</span><b>' . esc_html( $x[0] ) . '</b><small>' . esc_html( $x[1] ) . '</small></li>'; }
	return $h . '</ol>';
}

/* =====================================================================
 * 8. shortcode: [a4u_lic_hub] — कुठल्याही पानात hub
 * ===================================================================== */

add_shortcode( 'a4u_lic_hub', function () {
	a4u_lic_hub_inline_assets( array( 'type' => 'hub' ) );
	return '<div class="a4h">' . a4u_lic_render_hub() . '</div>';
} );

// shortcode मधून (template_redirect नंतर) assets
function a4u_lic_hub_inline_assets( $r ) {
	$url = plugin_dir_url( A4U_LIC_FILE );
	wp_enqueue_style( 'a4u-lic', $url . 'assets/a4u-lic.css', array(), A4U_LIC_VER );
	wp_enqueue_style( 'a4u-lic-hub', $url . 'assets/a4u-lic-hub.css', array( 'a4u-lic' ), A4U_LIC_VER );
	wp_enqueue_script( 'a4u-lic-hub', $url . 'assets/a4u-lic-hub.js', array(), A4U_LIC_VER, true );
	static $done = false;
	if ( ! $done ) {
		wp_add_inline_script( 'a4u-lic-hub', 'window.A4U_HUB=window.A4U_HUB||' . wp_json_encode( a4u_lic_hub_config( $r ) ) . ';', 'before' );
		$done = true;
	}
}
