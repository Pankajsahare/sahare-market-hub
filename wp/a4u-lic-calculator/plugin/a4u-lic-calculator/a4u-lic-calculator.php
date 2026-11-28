<?php
/**
 * Plugin Name: A4U LIC Calculator
 * Plugin URI: https://www.advisor4u.in/lic-calculator/
 * Description: LIC plan hub, plan pages, premium & benefit calculator and LIC tools (educational, not an official LIC quotation). Shortcodes: [a4u_lic_calculator] [a4u_lic_hub] [a4u_lic_revival] [a4u_lic_compare] [a4u_lic_branches] [a4u_lic_services] [a4u_lic_bonus] [a4u_lic_medical]
 * Version: 4.9.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Sahare Financial Services
 * License: GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'A4U_LIC_VER', '4.9.0' );
define( 'A4U_LIC_OPT', 'a4u_lic_data' );
define( 'A4U_LIC_DB_VER', 15 ); // v4.9: 883 loan/surrender आणि 771 नियम (4.6.5–4.6.6) साईटच्या database मध्ये
define( 'A4U_LIC_REPO_RAW', 'https://raw.githubusercontent.com/Pankajsahare/sahare-market-hub/main/' );
define( 'A4U_LIC_FILE', __FILE__ );

foreach ( array( 'data', 'install', 'admin', 'rest', 'sync', 'update', 'frontend', 'hub', 'tools' ) as $a4u_lic_part ) {
	require_once __DIR__ . '/includes/' . $a4u_lic_part . '.php';
}
