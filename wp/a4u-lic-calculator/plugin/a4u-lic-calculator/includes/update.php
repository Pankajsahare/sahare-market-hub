<?php
// A4U LIC Calculator — GitHub वरून plugin auto-update (stable/beta)
if ( ! defined( 'ABSPATH' ) ) { exit; }

/* =====================================================================
 * 6c. Plugin auto-update (S6) — GitHub वरचा update.json
 * ===================================================================== */

function a4u_lic_remote_info( $force = false ) {
	// v4.3.6: Dashboard → Updates → "Check again" (force-check) दाबलं की लगेच नवीन तपास
	if ( ! $force && is_admin() && ! empty( $_GET['force-check'] ) ) { $force = true; } // phpcs:ignore
	$info = $force ? false : get_transient( 'a4u_lic_update_info' );
	if ( false === $info ) {
		$d   = a4u_lic_data();
		$url = (string) ( $d['settings']['update_url'] ?? '' );
		if ( 'beta' === ( $d['settings']['update_channel'] ?? 'stable' ) ) { $url = str_replace( 'update.json', 'update-beta.json', $url ); }
		$info = array();
		$ok   = false;
		// v4.6.1 (S1): आधी GitHub raw; ते अयशस्वी झालं तर jsDelivr (main branch) — एक मार्ग बंद असला तरी update दिसावा
		$urls = array( $url );
		if ( preg_match( '#^https://raw\.githubusercontent\.com/([^/]+)/([^/]+)/([^/]+)/(.+)$#', $url, $m ) ) {
			$urls[] = 'https://cdn.jsdelivr.net/gh/' . $m[1] . '/' . $m[2] . '@' . $m[3] . '/' . $m[4];
		}
		foreach ( '' !== $url ? $urls : array() as $u ) {
			$res = wp_remote_get( add_query_arg( 'nc', time(), $u ), array( 'timeout' => 15 ) );
			if ( ! is_wp_error( $res ) && 200 === wp_remote_retrieve_response_code( $res ) ) {
				$j = json_decode( wp_remote_retrieve_body( $res ), true );
				if ( is_array( $j ) && ! empty( $j['version'] ) && ! empty( $j['download_url'] ) ) {
					// दोघांपैकी जे नवीन version सांगेल ते (jsDelivr थोडा जुना असू शकतो)
					if ( empty( $info['version'] ) || version_compare( $j['version'], $info['version'], '>' ) ) { $info = $j; }
					$ok = true;
					if ( version_compare( $j['version'], A4U_LIC_VER, '>' ) ) { break; }
				}
			}
		}
		// नवीन version असेल तर 3 तास; नसेल तर 20 मिनिटं; दोन्ही मार्ग अयशस्वी झाले तर फक्त 5 मिनिटं (लगेच पुन्हा प्रयत्न)
		$newer = ! empty( $info['version'] ) && version_compare( $info['version'], A4U_LIC_VER, '>' );
		set_transient( 'a4u_lic_update_info', $info, $newer ? 3 * HOUR_IN_SECONDS : ( $ok ? 20 * MINUTE_IN_SECONDS : 5 * MINUTE_IN_SECONDS ) );
	}
	return $info;
}

add_filter( 'pre_set_site_transient_update_plugins', function ( $t ) {
	if ( ! is_object( $t ) ) { return $t; }
	$info = a4u_lic_remote_info();
	$file = plugin_basename( A4U_LIC_FILE );
	if ( $info && version_compare( $info['version'], A4U_LIC_VER, '>' ) ) {
		$t->response[ $file ] = (object) array(
			'slug'        => 'a4u-lic-calculator',
			'plugin'      => $file,
			'new_version' => $info['version'],
			'package'     => $info['download_url'],
			'url'         => 'https://www.advisor4u.in/lic-calculator/',
			'tested'      => $info['tested'] ?? '',
			'requires'    => $info['requires'] ?? '',
		);
	} elseif ( isset( $t->response[ $file ] ) ) {
		unset( $t->response[ $file ] );
	}
	return $t;
} );

add_filter( 'plugins_api', function ( $res, $action, $args ) {
	if ( 'plugin_information' !== $action || empty( $args->slug ) || 'a4u-lic-calculator' !== $args->slug ) { return $res; }
	$info = a4u_lic_remote_info();
	if ( ! $info ) { return $res; }
	return (object) array(
		'name'          => 'A4U LIC Calculator',
		'slug'          => 'a4u-lic-calculator',
		'version'       => $info['version'],
		'author'        => 'Sahare Financial Services',
		'download_link' => $info['download_url'],
		'last_updated'  => $info['last_updated'] ?? '',
		'sections'      => array( 'changelog' => wp_kses_post( $info['changelog'] ?? '' ) ),
	);
}, 10, 3 );

/* =====================================================================
 * v3.1.2: पूर्ण automation — नवीन version WordPress स्वतः install करेल (कोणतीही मंजुरी नको)
 * ===================================================================== */
add_filter( 'auto_update_plugin', function ( $update, $item ) {
	$file = plugin_basename( A4U_LIC_FILE );
	if ( is_object( $item ) && ( ( $item->plugin ?? '' ) === $file || ( $item->slug ?? '' ) === 'a4u-lic-calculator' ) ) {
		return true; // हा plugin नेहमी आपोआप update
	}
	return $update;
}, 20, 2 );

// update झाल्यावर: cache साफ, म्हणजे visitors ना लगेच नवीन calculator दिसेल
add_action( 'upgrader_process_complete', function ( $upgrader, $opts ) {
	if ( ( $opts['type'] ?? '' ) !== 'plugin' ) { return; }
	$list = (array) ( $opts['plugins'] ?? array() );
	if ( isset( $opts['plugin'] ) ) { $list[] = $opts['plugin']; }
	if ( in_array( plugin_basename( A4U_LIC_FILE ), $list, true ) ) {
		delete_transient( 'a4u_lic_update_info' );
		do_action( 'litespeed_purge_all' );
	}
}, 10, 2 );
