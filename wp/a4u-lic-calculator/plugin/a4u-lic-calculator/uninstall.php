<?php
// plugin "Delete" केल्यावरच चालतो (Deactivate वर नाही) — S10: सगळा data साफ
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) { exit; }

global $wpdb;
delete_option( 'a4u_lic_data' );
delete_option( 'a4u_lic_db_ver' );
wp_clear_scheduled_hook( 'a4u_lic_purge' );
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}a4u_lic_leads" ); // phpcs:ignore
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}a4u_lic_stats" ); // phpcs:ignore
delete_option( 'a4u_lic_pending' );
delete_option( 'a4u_lic_sync_log' );
delete_option( 'a4u_lic_sync_applied' );
delete_option( 'a4u_lic_flush' );
delete_transient( 'a4u_lic_update_info' );
wp_clear_scheduled_hook( 'a4u_lic_sync' );
delete_option( 'a4u_lic_ill_seq' );
delete_option( 'a4u_lic_data_presync' );
delete_option( 'a4u_lic_sync_history' );
delete_option( 'a4u_lic_ill_log' );
delete_option( 'a4u_lic_errors' );
delete_option( 'a4u_lic_data_prev' );
