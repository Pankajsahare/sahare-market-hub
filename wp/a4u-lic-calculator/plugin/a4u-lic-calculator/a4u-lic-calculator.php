<?php
/**
 * Plugin Name: A4U LIC Calculator
 * Plugin URI: https://www.advisor4u.in/lic-calculator/
 * Description: Advanced LIC premium & benefit illustration tool (educational, not an official LIC quotation). Shortcode: [a4u_lic_calculator]
 * Version: 3.1.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Sahare Financial Services
 * License: GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'A4U_LIC_VER', '3.1.0' );
define( 'A4U_LIC_OPT', 'a4u_lic_data' );
define( 'A4U_LIC_DB_VER', 7 );
define( 'A4U_LIC_REPO_RAW', 'https://raw.githubusercontent.com/Pankajsahare/sahare-market-hub/main/' );
define( 'A4U_LIC_FILE', __FILE__ );

foreach ( array( 'data', 'install', 'admin', 'rest', 'sync', 'update', 'frontend' ) as $a4u_lic_part ) {
	require_once __DIR__ . '/includes/' . $a4u_lic_part . '.php';
}
