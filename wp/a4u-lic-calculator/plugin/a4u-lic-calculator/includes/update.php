<?php
// A4U LIC Calculator — GitHub वरून plugin auto-update (stable/beta)
if ( ! defined( 'ABSPATH' ) ) { exit; }

/* =====================================================================
 * 6c. Plugin auto-update (S6) — GitHub वरचा update.json
 * ===================================================================== */

function a4u_lic_remote_info( $force = false ) {
	$info = $force ? false : get_transient( 'a4u_lic_update_info' );
	if ( false === $info ) {
		$d   = a4u_lic_data();
		$url = (string) ( $d['settings']['update_url'] ?? '' );
		if ( 'beta' === ( $d['settings']['update_channel'] ?? 'stable' ) ) { $url = str_replace( 'update.json', 'update-beta.json', $url ); }
		$info = array();
		if ( '' !== $url ) {
			$res = wp_remote_get( add_query_arg( 'nc', time(), $url ), array( 'timeout' => 15 ) );
			if ( ! is_wp_error( $res ) && 200 === wp_remote_retrieve_response_code( $res ) ) {
				$j = json_decode( wp_remote_retrieve_body( $res ), true );
				if ( is_array( $j ) && ! empty( $j['version'] ) && ! empty( $j['download_url'] ) ) { $info = $j; }
			}
		}
		set_transient( 'a4u_lic_update_info', $info, 6 * HOUR_IN_SECONDS );
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
