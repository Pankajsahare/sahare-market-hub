<?php
// A4U LIC Calculator — install/upgrade, cron, plan pages चे URLs
if ( ! defined( 'ABSPATH' ) ) { exit; }

/* =====================================================================
 * 2. Install / Upgrade + Cron + Rewrite (S7)
 * ===================================================================== */

function a4u_lic_install() {
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$c = $wpdb->get_charset_collate();
	dbDelta( 'CREATE TABLE ' . a4u_lic_table( 'leads' ) . " (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		created datetime NOT NULL,
		name varchar(100) NOT NULL,
		mobile varchar(15) NOT NULL,
		plan varchar(100) NOT NULL DEFAULT '',
		sa bigint(20) unsigned NOT NULL DEFAULT 0,
		premium decimal(12,2) NOT NULL DEFAULT 0,
		PRIMARY KEY  (id),
		KEY created (created)
	) {$c};" );
	dbDelta( 'CREATE TABLE ' . a4u_lic_table( 'stats' ) . " (
		event varchar(20) NOT NULL,
		hits bigint(20) unsigned NOT NULL DEFAULT 0,
		PRIMARY KEY  (event)
	) {$c};" );

	$old_ver = (int) get_option( 'a4u_lic_db_ver', 0 );
	$d       = get_option( A4U_LIC_OPT );
	if ( is_array( $d ) ) {
		$def = a4u_lic_defaults();
		if ( ! isset( $d['rate_version'] ) ) { $d['rate_version'] = (int) ( $d['version'] ?? 1 ); }
		unset( $d['version'] );
		$d['settings']          = ( is_array( $d['settings'] ?? null ) ? $d['settings'] : array() ) + $def['settings'];
		$d['settings']['modal'] = (array) $d['settings']['modal'] + $def['settings']['modal'];
		foreach ( $def['plans'] as $id => $dp ) {
			if ( ! isset( $d['plans'][ $id ] ) ) { $d['plans'][ $id ] = $dp; continue; }
			$d['plans'][ $id ] = (array) $d['plans'][ $id ] + $dp;
			// v1.4: brochure मधले अधिकृत नियम नव्याने भर (rates, verified, source, bonus तसेच राहतात)
			if ( $old_ver < 5 ) {
				foreach ( a4u_lic_brochure_keys() as $k ) {
					if ( 'name' === $k && ! empty( $d['plans'][ $id ]['closed'] ) ) { continue; }
					if ( array_key_exists( $k, $dp ) ) { $d['plans'][ $id ][ $k ] = $dp[ $k ]; }
				}
				if ( ! empty( $dp['closed'] ) ) { $d['plans'][ $id ]['active'] = 0; }
			}
		}
		foreach ( $d['plans'] as $id => $p ) {
			$d['plans'][ $id ]['rates'] = a4u_lic_rates_to_map( $p['rates'] ?? array() );
			foreach ( (array) ( $p['history'] ?? array() ) as $i => $h ) {
				$d['plans'][ $id ]['history'][ $i ]['rates'] = a4u_lic_rates_to_map( $h['rates'] ?? array() );
			}
		}
		foreach ( (array) ( $d['leads'] ?? array() ) as $l ) {
			$wpdb->insert( a4u_lic_table( 'leads' ), array(
				'created' => $l['date'] ?? current_time( 'mysql' ),
				'name'    => (string) ( $l['name'] ?? '' ),
				'mobile'  => (string) ( $l['mobile'] ?? '' ),
				'plan'    => (string) ( $l['plan'] ?? '' ),
				'sa'      => absint( $l['sa'] ?? 0 ),
				'premium' => (float) ( $l['premium'] ?? 0 ),
			) );
		}
		foreach ( (array) ( $d['stats'] ?? array() ) as $k => $v ) {
			if ( (int) $v > 0 ) { a4u_lic_stat_add( sanitize_key( $k ), (int) $v ); }
		}
		unset( $d['leads'], $d['stats'] );
		$d['rate_version'] = (int) $d['rate_version'] + 1;
		update_option( A4U_LIC_OPT, $d, false );
	} else {
		add_option( A4U_LIC_OPT, a4u_lic_defaults(), '', false );
	}

	if ( ! wp_next_scheduled( 'a4u_lic_purge' ) ) {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'a4u_lic_purge' );
	}
	if ( ! wp_next_scheduled( 'a4u_lic_sync' ) ) {
		wp_schedule_event( time() + 300, 'daily', 'a4u_lic_sync' );
	}
	update_option( 'a4u_lic_flush', 1, false ); // पुढच्या init ला rewrite rules refresh
	update_option( 'a4u_lic_db_ver', A4U_LIC_DB_VER, false );
}
register_activation_hook( A4U_LIC_FILE, 'a4u_lic_install' );

add_action( 'plugins_loaded', function () {
	if ( (int) get_option( 'a4u_lic_db_ver', 0 ) < A4U_LIC_DB_VER ) { a4u_lic_install(); }
} );

register_deactivation_hook( A4U_LIC_FILE, function () {
	wp_clear_scheduled_hook( 'a4u_lic_purge' );
	wp_clear_scheduled_hook( 'a4u_lic_sync' );
	flush_rewrite_rules();
} );

add_action( 'a4u_lic_purge', function () {
	global $wpdb;
	$d    = a4u_lic_data();
	$days = max( 30, (int) ( $d['settings']['retention_days'] ?? 180 ) );
	$cut  = wp_date( 'Y-m-d H:i:s', time() - $days * DAY_IN_SECONDS );
	$t    = a4u_lic_table( 'leads' );
	$wpdb->query( $wpdb->prepare( "DELETE FROM {$t} WHERE created < %s", $cut ) ); // phpcs:ignore
} );

// S7: /lic-calculator/714/ → त्याच page वर plan 714 आधीच निवडलेला
function a4u_lic_base_slug() {
	$d = a4u_lic_data();
	return trim( (string) ( $d['settings']['base_slug'] ?? 'lic-calculator' ), '/' );
}
add_action( 'init', function () {
	$slug = a4u_lic_base_slug();
	if ( '' !== $slug ) {
		add_rewrite_rule( '^' . preg_quote( $slug, '#' ) . '/([0-9]{3})/?$', 'index.php?pagename=' . $slug . '&a4u_plan=$matches[1]', 'top' );
	}
	if ( get_option( 'a4u_lic_flush' ) ) {
		flush_rewrite_rules( false );
		delete_option( 'a4u_lic_flush' );
	}
} );
add_filter( 'query_vars', function ( $v ) { $v[] = 'a4u_plan'; return $v; } );

function a4u_lic_current_plan() {
	$id = sanitize_key( (string) get_query_var( 'a4u_plan' ) );
	if ( '' === $id ) { return null; }
	$d = a4u_lic_data();
	return ( ! empty( $d['plans'][ $id ]['active'] ) ) ? array( $id, $d['plans'][ $id ] ) : null;
}
// plan page चं title + canonical (WordPress + Rank Math)
function a4u_lic_plan_title( $title ) {
	$cp = a4u_lic_current_plan();
	return $cp ? 'LIC ' . $cp[1]['name'] . ' Premium Calculator | Advisor4u' : $title;
}
add_filter( 'pre_get_document_title', function ( $t ) { return a4u_lic_current_plan() ? a4u_lic_plan_title( $t ) : $t; }, 20 );
add_filter( 'rank_math/frontend/title', 'a4u_lic_plan_title' );
add_filter( 'rank_math/frontend/canonical', function ( $url ) {
	$cp = a4u_lic_current_plan();
	return $cp ? home_url( '/' . a4u_lic_base_slug() . '/' . $cp[0] . '/' ) : $url;
} );
add_filter( 'rank_math/frontend/description', function ( $desc ) {
	$cp = a4u_lic_current_plan();
	return $cp ? 'Calculate premium, maturity and year-wise benefits for LIC ' . $cp[1]['name'] . '. Free educational illustration based on LIC brochure figures.' : $desc;
} );
