<?php
// A4U LIC Hub — theme च्या header/footer मध्ये आपलं पान
if ( ! defined( 'ABSPATH' ) ) { exit; }
$a4u_r = a4u_lic_hub_route();
get_header();
echo '<main id="a4h-main" class="a4h a4h-page" data-page="' . esc_attr( $a4u_r ? $a4u_r['type'] : '' ) . '">';
if ( $a4u_r && 'hub' === $a4u_r['type'] ) {
	echo a4u_lic_render_hub(); // phpcs:ignore -- आत escape केलेलं
} elseif ( $a4u_r && 'plan' === $a4u_r['type'] ) {
	echo a4u_lic_render_plan( $a4u_r['plan'] ); // phpcs:ignore
} elseif ( $a4u_r && 'tool' === $a4u_r['type'] ) {
	echo a4u_lic_render_tool( $a4u_r['key'] ); // phpcs:ignore
}
echo '</main>';
get_footer();
