<?php
// A4U LIC Calculator — public REST API (rates, stats, leads, errors)
if ( ! defined( 'ABSPATH' ) ) { exit; }

/* =====================================================================
 * 6. REST API
 * ===================================================================== */

function a4u_lic_throttle( $bucket, $max, $window ) {
	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '0';
	$key = 'a4u_lic_' . $bucket . '_' . md5( $ip . wp_salt( 'nonce' ) );
	$n   = (int) get_transient( $key );
	if ( $n >= $max ) { return false; }
	set_transient( $key, $n + 1, $window );
	return true;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'a4u-lic/v1', '/plan/(?P<id>[a-z0-9_-]+)', array( 'methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => 'a4u_lic_rest_plan' ) );
	register_rest_route( 'a4u-lic/v1', '/track', array( 'methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => 'a4u_lic_rest_track' ) );
	register_rest_route( 'a4u-lic/v1', '/lead', array( 'methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => 'a4u_lic_rest_lead' ) );
	register_rest_route( 'a4u-lic/v1', '/error', array( 'methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => 'a4u_lic_rest_error' ) );
	register_rest_route( 'a4u-lic/v1', '/illustration', array( 'methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => 'a4u_lic_rest_illustration' ) );
} );

function a4u_lic_rest_plan( WP_REST_Request $req ) {
	$d  = a4u_lic_data();
	$id = sanitize_key( $req['id'] );
	if ( empty( $d['plans'][ $id ]['active'] ) ) {
		return new WP_Error( 'not_found', 'Plan not found', array( 'status' => 404 ) );
	}
	$res = rest_ensure_response( array( 'id' => $id, 'version' => (int) $d['rate_version'], 'rates' => (object) $d['plans'][ $id ]['rates'] ) );
	$res->header( 'Cache-Control', 'public, max-age=3600' );
	return $res;
}

function a4u_lic_rest_track( WP_REST_Request $req ) {
	$e = sanitize_key( (string) $req->get_param( 'event' ) );
	if ( ! in_array( $e, array( 'calculate', 'compare', 'pdf', 'whatsapp' ), true ) ) {
		return new WP_Error( 'bad_event', 'Invalid event', array( 'status' => 400 ) );
	}
	if ( a4u_lic_throttle( 't', 120, HOUR_IN_SECONDS ) ) { a4u_lic_stat_add( $e ); }
	return array( 'ok' => 1 );
}

function a4u_lic_rest_lead( WP_REST_Request $req ) {
	if ( '' !== (string) $req->get_param( 'company' ) ) { return array( 'ok' => 1, 'message' => 'Thank you!' ); }
	$consent = (int) $req->get_param( 'consent' );
	$name    = sanitize_text_field( (string) $req->get_param( 'name' ) );
	$mobile  = preg_replace( '/\D/', '', (string) $req->get_param( 'mobile' ) );
	if ( 12 === strlen( $mobile ) && 0 === strpos( $mobile, '91' ) ) { $mobile = substr( $mobile, 2 ); }
	if ( 1 !== $consent || '' === $name || strlen( $name ) > 100 || ! preg_match( '/^[6-9]\d{9}$/', $mobile ) ) {
		return new WP_Error( 'invalid', 'Please enter your name, a valid 10-digit mobile number and tick the consent box.', array( 'status' => 400 ) );
	}
	if ( ! a4u_lic_throttle( 'l', 3, 10 * MINUTE_IN_SECONDS ) ) {
		return new WP_Error( 'too_many', 'Too many requests. Please try again after some time.', array( 'status' => 429 ) );
	}
	global $wpdb;
	$ok = $wpdb->insert(
		a4u_lic_table( 'leads' ),
		array(
			'created' => current_time( 'mysql' ),
			'name'    => $name,
			'mobile'  => $mobile,
			'plan'    => substr( sanitize_text_field( (string) $req->get_param( 'plan' ) ), 0, 100 ),
			'sa'      => absint( $req->get_param( 'sa' ) ),
			'premium' => round( (float) $req->get_param( 'premium' ), 2 ),
		),
		array( '%s', '%s', '%s', '%s', '%d', '%f' )
	);
	if ( ! $ok ) {
		return new WP_Error( 'db', 'Could not save right now. Please contact us on WhatsApp.', array( 'status' => 500 ) );
	}
	a4u_lic_stat_add( 'lead' );
	// v4: email / Telegram सूचना (tools.php)
	do_action( 'a4u_lic_lead_saved', array(
		'name'   => $name,
		'mobile' => $mobile,
		'plan'   => substr( sanitize_text_field( (string) $req->get_param( 'plan' ) ), 0, 100 ),
		'sa'     => absint( $req->get_param( 'sa' ) ),
		'page'   => esc_url_raw( (string) $req->get_param( 'page' ) ),
		'note'   => substr( sanitize_textarea_field( (string) $req->get_param( 'note' ) ), 0, 600 ), // v4.6: Goal Planner निकाल
	) );
	return array( 'ok' => 1, 'message' => 'Thank you! Our advisor will contact you shortly.' );
}

// H: visitors च्या phone वरचे JS errors (फक्त message + file:line, कोणताही खाजगी data नाही)
function a4u_lic_rest_error( WP_REST_Request $req ) {
	if ( ! a4u_lic_throttle( 'e', 20, HOUR_IN_SECONDS ) ) { return array( 'ok' => 1 ); }
	$msg = substr( sanitize_text_field( (string) $req->get_param( 'msg' ) ), 0, 200 );
	$src = substr( sanitize_text_field( (string) $req->get_param( 'src' ) ), 0, 80 );
	if ( '' === $msg ) { return array( 'ok' => 1 ); }
	$log = (array) get_option( 'a4u_lic_errors', array() );
	$key = md5( $msg . $src );
	$row = $log[ $key ] ?? array( 'msg' => $msg, 'src' => $src, 'n' => 0 );
	$row['n']++;
	$row['last'] = current_time( 'mysql' );
	unset( $log[ $key ] );
	$log = array( $key => $row ) + $log;
	update_option( 'a4u_lic_errors', array_slice( $log, 0, 30, true ), false );
	return array( 'ok' => 1 );
}

// v3.1: Illustration ID — फक्त ID, तारीख, plan, SA, term, rate version (नाव/mobile काहीच नाही)
function a4u_lic_rest_illustration( WP_REST_Request $req ) {
	if ( ! a4u_lic_throttle( 'i', 60, HOUR_IN_SECONDS ) ) {
		return new WP_Error( 'too_many', 'Too many requests', array( 'status' => 429 ) );
	}
	$d    = a4u_lic_data();
	$plan = sanitize_key( (string) $req->get_param( 'plan' ) );
	if ( empty( $d['plans'][ $plan ] ) ) { return new WP_Error( 'bad_plan', 'Invalid plan', array( 'status' => 400 ) ); }
	$seq = (int) get_option( 'a4u_lic_ill_seq', 0 ) + 1;
	update_option( 'a4u_lic_ill_seq', $seq, false );
	$id  = 'A4U-' . wp_date( 'ymd' ) . '-' . str_pad( (string) $seq, 4, '0', STR_PAD_LEFT );
	$log = (array) get_option( 'a4u_lic_ill_log', array() );
	array_unshift( $log, array( $id, current_time( 'mysql' ), $plan, absint( $req->get_param( 'sa' ) ), absint( $req->get_param( 'term' ) ), (int) $d['rate_version'] ) );
	update_option( 'a4u_lic_ill_log', array_slice( $log, 0, 500 ), false );
	return array( 'ok' => 1, 'id' => $id );
}
