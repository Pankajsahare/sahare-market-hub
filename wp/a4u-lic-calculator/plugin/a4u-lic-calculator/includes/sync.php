<?php
// A4U LIC Calculator — GitHub वरून LIC data sync (Approve नंतरच लागू)
if ( ! defined( 'ABSPATH' ) ) { exit; }

/* =====================================================================
 * 6b. Data sync — GitHub pipeline चा lic-plans.json (रोज), admin Approve नंतरच लागू
 * ===================================================================== */

// JSON मधून कोणत्या keys येऊ शकतात (rates, verified, bonus, active कधीच नाही)
function a4u_lic_sync_keys() {
	return array( 'uin', 'min_age', 'max_age', 'min_sa', 'max_maturity', 'min_maturity', 'terms', 'ppt_map', 'ppt_options', 'ppt_max_age_sum',
		'maturity_age', 'survival_pct', 'ga_per_1000', 'min_age_by_term', 'sa_slabs', 'rebate_slabs', 'rebate_bands', 'mode_adj', 'death_pct',
		'samples', 'sample_sa', 'brochure' );
}

function a4u_lic_sync_check( $manual = false ) {
	$d   = a4u_lic_data();
	$url = (string) ( $d['settings']['sync_url'] ?? '' );
	$log = array( 'checked_at' => current_time( 'mysql' ), 'ok' => 0, 'msg' => '' );
	if ( '' === $url ) { $log['msg'] = 'Sync URL empty'; update_option( 'a4u_lic_sync_log', $log, false ); return $log; }
	$res = wp_remote_get( add_query_arg( 'nc', time(), $url ), array( 'timeout' => 20 ) );
	if ( is_wp_error( $res ) || 200 !== wp_remote_retrieve_response_code( $res ) ) {
		$log['msg'] = 'Download failed: ' . ( is_wp_error( $res ) ? $res->get_error_message() : wp_remote_retrieve_response_code( $res ) );
		update_option( 'a4u_lic_sync_log', $log, false );
		return $log;
	}
	$json = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( ! is_array( $json ) || empty( $json['plans'] ) || ! is_array( $json['plans'] ) ) {
		$log['msg'] = 'Invalid JSON';
		update_option( 'a4u_lic_sync_log', $log, false );
		return $log;
	}
	$applied = (int) get_option( 'a4u_lic_sync_applied', 0 );
	$log['ok']       = 1;
	$log['remote']   = (int) ( $json['version'] ?? 0 );
	$log['remote_checked'] = (string) ( $json['checked_at'] ?? '' );
	$diff = a4u_lic_sync_diff( $d, $json );
	if ( $log['remote'] > $applied && $diff ) {
		update_option( 'a4u_lic_pending', array( 'version' => $log['remote'], 'json' => $json, 'diff' => $diff, 'fetched' => current_time( 'mysql' ) ), false );
		$log['msg'] = count( $diff ) . ' change(s) waiting for approval';
	} else {
		if ( $log['remote'] > $applied ) { update_option( 'a4u_lic_sync_applied', $log['remote'], false ); }
		delete_option( 'a4u_lic_pending' );
		$log['msg'] = 'Up to date';
	}
	update_option( 'a4u_lic_sync_log', $log, false );
	return $log;
}
add_action( 'a4u_lic_sync', function () { a4u_lic_sync_check(); } );

// [plan, field, old, new] यादी
// pipeline ने LIC च्या bonus circular मधून दर काढले असतील तरच bonus keys पण
function a4u_lic_sync_keys_for( $np ) {
	$k = a4u_lic_sync_keys();
	if ( ! empty( $np['bonus_circular'] ) ) { $k = array_merge( $k, array( 'srb', 'fab', 'fab_min_term', 'bonus_bands' ) ); }
	return $k;
}

function a4u_lic_sync_diff( $d, $json ) {
	$out = array();
	foreach ( $json['plans'] as $id => $np ) {
		$id = sanitize_key( (string) $id );
		if ( ! is_array( $np ) ) { continue; }
		if ( ! isset( $d['plans'][ $id ] ) ) {
			$out[] = array( $id, 'NEW PLAN', '', (string) ( $np['name'] ?? '' ) . ' (' . (string) ( $np['type'] ?? '?' ) . ')' );
			continue;
		}
		foreach ( a4u_lic_sync_keys_for( $np ) as $k ) {
			if ( ! array_key_exists( $k, $np ) ) { continue; }
			$old = $d['plans'][ $id ][ $k ] ?? null;
			if ( wp_json_encode( $old ) !== wp_json_encode( $np[ $k ] ) && json_encode( a4u_lic_num_norm( $old ) ) !== json_encode( a4u_lic_num_norm( $np[ $k ] ) ) ) {
				$out[] = array( $id, $k, a4u_lic_short( $old ), a4u_lic_short( $np[ $k ] ) );
			}
		}
	}
	return $out;
}
// 2 आणि 2.0 सारखे फरक दुर्लक्षित करण्यासाठी
function a4u_lic_num_norm( $v ) {
	if ( is_array( $v ) ) { return array_map( 'a4u_lic_num_norm', $v ); }
	return is_numeric( $v ) ? 0 + $v : $v;
}
function a4u_lic_short( $v ) {
	$t = is_scalar( $v ) || null === $v ? (string) $v : wp_json_encode( $v );
	return strlen( $t ) > 140 ? substr( $t, 0, 137 ) . '...' : $t;
}

function a4u_lic_sync_apply() {
	$pending = get_option( 'a4u_lic_pending' );
	if ( ! is_array( $pending ) || empty( $pending['json']['plans'] ) ) { return 0; }
	$d     = a4u_lic_data();
	$types = array( 'endowment', 'anand', 'lakshya', 'labh', 'umang', 'single', 'utsav', 'utsav_sp' );
	$n     = 0;
	foreach ( $pending['json']['plans'] as $id => $np ) {
		$id = sanitize_key( (string) $id );
		if ( ! is_array( $np ) ) { continue; }
		if ( ! isset( $d['plans'][ $id ] ) ) {
			if ( empty( $np['type'] ) || ! in_array( $np['type'], $types, true ) || empty( $np['name'] ) ) { continue; }
			$base             = a4u_lic_default_plans()['714'];
			$base             = array_merge( $base, array( 'name' => sanitize_text_field( $np['name'] ), 'type' => $np['type'], 'active' => 0, 'samples' => array(), 'rates' => array(), 'history' => array() ) );
			$d['plans'][ $id ] = $base; // नवीन plan बंद (inactive) स्थितीत येतो — admin ने तपासून चालू करायचा
		}
		foreach ( a4u_lic_sync_keys_for( $np ) as $k ) {
			if ( array_key_exists( $k, $np ) ) { $d['plans'][ $id ][ $k ] = $np[ $k ]; }
		}
		$d['plans'][ $id ]['source']    = 'LIC sales brochure (auto-sync v' . (int) $pending['version'] . ')';
		$d['plans'][ $id ]['effective'] = substr( (string) ( $np['extracted_at'] ?? $pending['json']['checked_at'] ?? '' ), 0, 10 );
		$n++;
	}
	a4u_lic_save( $d );
	update_option( 'a4u_lic_sync_applied', (int) $pending['version'], false );
	delete_option( 'a4u_lic_pending' );
	return $n;
}

add_action( 'admin_post_a4u_lic_sync', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_sync' );
	$do = sanitize_key( $_GET['do'] ?? 'check' ); // phpcs:ignore
	if ( 'approve' === $do ) {
		a4u_lic_flash( 'LIC data applied to ' . a4u_lic_sync_apply() . ' plan(s)' );
	} elseif ( 'dismiss' === $do ) {
		$pending = get_option( 'a4u_lic_pending' );
		if ( is_array( $pending ) ) { update_option( 'a4u_lic_sync_applied', (int) $pending['version'], false ); }
		delete_option( 'a4u_lic_pending' );
		a4u_lic_flash( 'pending update dismissed' );
	} else {
		$log = a4u_lic_sync_check( true );
		a4u_lic_flash( 'sync check: ' . $log['msg'] );
	}
	wp_safe_redirect( admin_url( 'admin.php?page=a4u-lic&tab=sync' ) );
	exit;
} );
