<?php
// A4U LIC Calculator — admin पानं आणि त्यांचे form handlers
if ( ! defined( 'ABSPATH' ) ) { exit; }

/* =====================================================================
 * 3. Admin: flash + menu + notice
 * ===================================================================== */

function a4u_lic_flash( $ok = '', $errors = array() ) {
	set_transient( 'a4u_lic_flash_' . get_current_user_id(), array( 'ok' => $ok, 'err' => $errors ), 120 );
}
function a4u_lic_flash_take() {
	$k = 'a4u_lic_flash_' . get_current_user_id();
	$f = get_transient( $k );
	if ( $f ) { delete_transient( $k ); }
	return is_array( $f ) ? $f : array( 'ok' => '', 'err' => array() );
}

add_action( 'admin_menu', function () {
	add_menu_page( 'A4U LIC Calculator', 'A4U LIC', 'manage_options', 'a4u-lic', 'a4u_lic_admin_page', 'dashicons-calculator', 26 );
} );

add_action( 'admin_notices', function () {
	if ( ! current_user_can( 'manage_options' ) ) { return; }
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || ! in_array( $screen->id, array( 'dashboard', 'toplevel_page_a4u-lic' ), true ) ) { return; }
	$d    = a4u_lic_data();
	$warn = array();
	foreach ( $d['plans'] as $p ) {
		if ( empty( $p['active'] ) ) { continue; }
		$stale = ( time() - strtotime( $p['rates_updated'] ?? $p['updated'] ) ) > 90 * DAY_IN_SECONDS;
		if ( empty( $p['verified'] ) || empty( $p['rates'] ) || $stale ) { $warn[] = $p['name']; }
	}
	if ( $warn ) {
		echo '<div class="notice notice-warning"><p><strong>A4U LIC:</strong> Showing brochure-based estimates (no verified CSV) for: ' . esc_html( implode( ', ', $warn ) ) . '. <a href="' . esc_url( admin_url( 'admin.php?page=a4u-lic' ) ) . '">Open Rates panel</a></p></div>';
	}
} );

/* ---------- S4: Quick check — brochure sample vs आपले CSV rates ---------- */

function a4u_lic_quick_check( $p ) {
	$rows = array();
	if ( empty( $p['samples'] ) || empty( $p['sample_sa'] ) ) { return $rows; }
	$single = in_array( $p['type'], array( 'single', 'utsav_sp' ), true );
	$adj    = $single ? 0 : (float) ( $p['mode_adj']['yearly'] ?? 0 );
	foreach ( $p['samples'] as $s ) {
		$key  = (int) $s[0] . '|' . (int) $s[1];
		$rate = $p['rates'][ $key ] ?? null;
		$ours = null === $rate ? null : $rate * $p['sample_sa'] / 1000 * ( 1 + $adj / 100 );
		$diff = null === $ours ? null : ( $ours - $s[2] ) / $s[2] * 100;
		$rows[] = array( $s[0], $s[1], $s[2], $ours, $diff );
	}
	return $rows;
}

/* =====================================================================
 * 4. Admin: page render
 * ===================================================================== */

function a4u_lic_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	global $wpdb;
	$d     = a4u_lic_data();
	$tab   = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'plans'; // phpcs:ignore
	$base  = admin_url( 'admin.php?page=a4u-lic' );
	$flash = a4u_lic_flash_take();
	$lt    = a4u_lic_table( 'leads' );
	$st    = a4u_lic_table( 'stats' );
	$lead_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$lt}" ); // phpcs:ignore
	$in    = 'style="width:100%"';
	?>
	<div class="wrap">
		<h1>A4U LIC Calculator <span style="font-size:13px;color:#666;">Rate v<?php echo (int) $d['rate_version']; ?> &bull; <?php echo esc_html( $d['updated'] ); ?></span></h1>
		<?php if ( $flash['ok'] ) : ?><div class="notice notice-success is-dismissible"><p>Saved: <?php echo esc_html( $flash['ok'] ); ?></p></div><?php endif; ?>
		<h2 class="nav-tab-wrapper">
			<a class="nav-tab <?php echo 'plans' === $tab ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url( $base . '&tab=plans' ); ?>">Plans &amp; Rates</a>
			<a class="nav-tab <?php echo 'leads' === $tab ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url( $base . '&tab=leads' ); ?>">Leads (<?php echo (int) $lead_count; ?>)</a>
			<a class="nav-tab <?php echo 'stats' === $tab ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url( $base . '&tab=stats' ); ?>">Stats</a>
			<a class="nav-tab <?php echo 'sync' === $tab ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url( $base . '&tab=sync' ); ?>">Data sync</a>
			<a class="nav-tab <?php echo 'settings' === $tab ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url( $base . '&tab=settings' ); ?>">Settings</a>
		</h2>

		<?php if ( 'plans' === $tab ) : ?>
			<p style="max-width:860px;">Three levels of accuracy: <strong>1) Verified CSV</strong> (exact, from LIC tariff) &rarr; <strong>2) Brochure estimate</strong> (interpolated from the sample premiums printed in the official LIC sales brochure) &rarr; <strong>3) Demo</strong>. CSV format: <code>age,term,rate_per_1000</code> &mdash; for Umang/Utsav the term column means PPT, for Utsav Single Premium it means GA period. Rates are the <em>tabular annual</em> premium per Rs.1000 BSA (before mode/HSA rebate).</p>
			<?php foreach ( $d['plans'] as $id => $p ) : $qc = a4u_lic_quick_check( $p ); ?>
			<div style="background:#fff;border:1px solid #dcdcde;border-radius:8px;padding:16px;margin:14px 0;max-width:960px;">
				<h3 style="margin-top:0;"><?php echo esc_html( $p['name'] ); ?>
					<?php echo ! empty( $p['closed'] ) ? '<span style="background:#eee;padding:1px 6px;border-radius:4px;font-size:11px;">CLOSED PLAN</span>' : ''; ?>
					<?php echo ! empty( $p['verified'] ) ? '<span style="color:#00701a;font-size:12px;">&#9679; Verified CSV</span>' : ( ! empty( $p['samples'] ) ? '<span style="color:#996800;font-size:12px;">&#9679; Brochure estimate</span>' : '<span style="color:#b32d2e;font-size:12px;">&#9679; Demo</span>' ); ?>
					<span style="font-size:12px;color:#666;">CSV rows: <?php echo count( $p['rates'] ); ?> | rates updated: <?php echo esc_html( $p['rates_updated'] ?? $p['updated'] ); ?></span>
				</h3>
				<?php if ( ! empty( $p['brochure'] ) ) : ?><p style="margin-top:-6px;"><a href="<?php echo esc_url( $p['brochure'] ); ?>" target="_blank" rel="noopener">Official LIC sales brochure (PDF)</a></p><?php endif; ?>
				<?php if ( ! empty( $flash['err'][ $id ] ) ) : ?><div class="notice notice-error inline"><p><?php echo esc_html( $flash['err'][ $id ] ); ?></p></div><?php endif; ?>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<input type="hidden" name="action" value="a4u_lic_save_plan">
					<input type="hidden" name="plan" value="<?php echo esc_attr( $id ); ?>">
					<?php wp_nonce_field( 'a4u_lic_save_plan', 'a4u_nonce' ); ?>
					<table class="form-table" role="presentation"><tbody>
						<tr><th>Active</th><td><label><input type="checkbox" name="active" value="1" <?php checked( $p['active'], 1 ); ?>> Show in calculator</label></td></tr>
						<tr><th>Entry age (min / max)</th><td><input type="number" min="0" max="99" name="min_age" value="<?php echo (int) $p['min_age']; ?>" style="width:80px"> / <input type="number" min="0" max="99" name="max_age" value="<?php echo (int) $p['max_age']; ?>" style="width:80px"></td></tr>
						<tr><th>Min Sum Assured / Max maturity age</th><td><input type="number" min="1000" name="min_sa" value="<?php echo (int) $p['min_sa']; ?>" style="width:120px"> / <input type="number" min="18" max="100" name="max_maturity" value="<?php echo (int) $p['max_maturity']; ?>" style="width:80px"></td></tr>
						<tr><th>Allowed term / PPT</th><td><code><?php echo esc_html( implode( ', ', a4u_lic_plan_terms( $p ) ) ); ?></code></td></tr>
						<tr><th>SA multiples <small>(from SA : multiple)</small></th><td><input type="text" name="sa_slabs" value="<?php echo esc_attr( a4u_lic_pairs_to_text( $p['sa_slabs'] ?? array() ) ); ?>" <?php echo $in; // phpcs:ignore ?>></td></tr>
						<?php if ( empty( $p['rebate_bands'] ) ) : ?>
						<tr><th>HSA rebate <small>(from SA : Rs. per 1000 BSA)</small></th><td><input type="text" name="rebate_slabs" value="<?php echo esc_attr( a4u_lic_pairs_to_text( $p['rebate_slabs'] ?? array() ) ); ?>" <?php echo $in; // phpcs:ignore ?> placeholder="500000:2.5, 1000000:4"></td></tr>
						<?php else : ?>
						<tr><th>HSA rebate</th><td><span style="color:#666;">Age-band table from brochure (fixed in code).</span></td></tr>
						<?php endif; ?>
						<?php if ( ! in_array( $p['type'], array( 'single', 'utsav_sp' ), true ) ) : ?>
						<tr><th>Mode rebate(−) / loading(+) %</th><td><input type="text" name="mode_adj" value="<?php echo esc_attr( a4u_lic_mode_to_text( $p['mode_adj'] ?? array() ) ); ?>" <?php echo $in; // phpcs:ignore ?> placeholder="yearly:-2, half:-1, quarter:0, month:0"></td></tr>
						<?php endif; ?>
						<tr><th>Bonus: SRB / FAB (Rs. per 1000) / FAB min term</th><td><input type="number" min="0" step="0.01" name="srb" value="<?php echo esc_attr( $p['srb'] ); ?>" style="width:80px"> / <input type="number" min="0" step="0.01" name="fab" value="<?php echo esc_attr( $p['fab'] ); ?>" style="width:80px"> / <input type="number" min="0" name="fab_min_term" value="<?php echo (int) $p['fab_min_term']; ?>" style="width:80px"> <span style="color:#666;">(non-guaranteed; latest LIC bonus circular)</span></td></tr>
						<tr><th>Bonus by term band <small>(from term : SRB : FAB)</small></th><td><input type="text" name="bonus_bands" value="<?php echo esc_attr( a4u_lic_pairs_to_text( $p['bonus_bands'] ?? array() ) ); ?>" <?php echo $in; // phpcs:ignore ?> placeholder="12:40:0, 21:45:50, 26:47:100"><p style="color:#666;margin:2px 0 0;">Optional. If filled, overrides the single SRB/FAB above for that term range.</p></td></tr>
						<tr><th>Death SA (% of BSA)</th><td><input type="number" min="0" max="500" name="death_pct" value="<?php echo (int) ( $p['death_pct'] ?? 0 ); ?>" style="width:80px"> <span style="color:#666;">Regular premium: higher of this % of BSA and 7 &times; annualised premium (0 = hide)</span></td></tr>
						<tr><th>Riders allowed</th><td><?php foreach ( array( 'adb' => 'Accident Benefit', 'addb' => 'AD&amp;DB', 'term' => 'Term rider', 'pwb' => 'Premium Waiver (PWB)' ) as $rk => $rl ) : ?><label style="margin-right:12px;"><input type="checkbox" name="riders[]" value="<?php echo esc_attr( $rk ); ?>" <?php checked( in_array( $rk, (array) ( $p['riders'] ?? array() ), true ) ); ?>> <?php echo $rl; // phpcs:ignore ?></label><?php endforeach; ?></td></tr>
						<tr><th>Brochure sample premiums</th><td>Sample BSA <input type="number" min="0" name="sample_sa" value="<?php echo (int) ( $p['sample_sa'] ?? 0 ); ?>" style="width:110px"><textarea name="samples" rows="3" style="width:100%;font-family:monospace;margin-top:4px;" placeholder="age,term,premium"><?php echo esc_textarea( a4u_lic_samples_to_text( $p['samples'] ?? array() ) ); ?></textarea><p style="color:#666;margin:2px 0 0;">Yearly-mode premium for the sample BSA, exactly as printed in the brochure.</p></td></tr>
						<tr><th>Source (document reference)</th><td><input type="text" name="source" value="<?php echo esc_attr( $p['source'] ); ?>" <?php echo $in; // phpcs:ignore ?>></td></tr>
						<tr><th>Effective date</th><td><input type="date" name="effective" value="<?php echo esc_attr( $p['effective'] ); ?>"></td></tr>
						<tr><th>Verified</th><td><label><input type="checkbox" name="verified" value="1" <?php checked( $p['verified'], 1 ); ?>> I have cross-checked the CSV rates with the official LIC tariff</label></td></tr>
						<tr><th>Import rates CSV</th><td><textarea name="csv" rows="5" style="width:100%;font-family:monospace;" placeholder="30,20,74.45&#10;31,20,74.80&#10;..."></textarea><p style="color:#666;">Leave empty to keep current rates. Invalid / duplicate / out-of-range rows block the import and are listed.</p></td></tr>
					</tbody></table>
					<?php submit_button( 'Save plan', 'primary', 'submit', false ); ?>
				</form>
				<?php if ( $qc ) : ?>
					<details style="margin-top:10px;"><summary><strong>Quick check:</strong> brochure sample vs your CSV</summary>
					<table class="widefat striped" style="max-width:620px;margin-top:6px;"><thead><tr><th>Age</th><th>Term/PPT</th><th>Brochure</th><th>Your CSV</th><th>Diff</th></tr></thead><tbody>
					<?php foreach ( $qc as $r ) : $bad = null !== $r[4] && abs( $r[4] ) > 1; ?>
						<tr><td><?php echo (int) $r[0]; ?></td><td><?php echo (int) $r[1]; ?></td><td><?php echo esc_html( number_format_i18n( $r[2] ) ); ?></td><td><?php echo null === $r[3] ? '&mdash;' : esc_html( number_format_i18n( $r[3] ) ); ?></td><td style="<?php echo $bad ? 'color:#b32d2e;font-weight:600;' : ''; ?>"><?php echo null === $r[4] ? 'no CSV row' : esc_html( sprintf( '%+.2f%%', $r[4] ) ); ?></td></tr>
					<?php endforeach; ?>
					</tbody></table><p style="color:#666;">More than &plusmn;1% (red) usually means a wrong CSV row or wrong mode rebate.</p></details>
				<?php endif; ?>
				<?php $qn = wp_nonce_url( admin_url( 'admin-post.php?action=a4u_lic_quote' ), 'a4u_lic_quote' ); ?>
				<details style="margin-top:10px;" <?php echo ! empty( $p['quotes'] ) ? 'open' : ''; ?>><summary><strong>Actual LIC quotations</strong> (<?php echo count( (array) ( $p['quotes'] ?? array() ) ); ?>) &mdash; each one becomes an exact rate point</summary>
					<?php if ( ! empty( $p['quotes'] ) ) : ?>
					<table class="widefat striped" style="max-width:720px;margin-top:6px;"><thead><tr><th>Age</th><th>Term/PPT</th><th>BSA</th><th>Yearly premium</th><th>Rate / 1000</th><th>Added</th><th></th></tr></thead><tbody>
					<?php foreach ( $p['quotes'] as $qi => $q ) : ?>
						<tr><td><?php echo (int) $q[0]; ?></td><td><?php echo (int) $q[1]; ?></td><td><?php echo esc_html( number_format_i18n( $q[3] ) ); ?></td><td><?php echo esc_html( number_format_i18n( $q[2], 2 ) ); ?></td><td><?php echo esc_html( number_format_i18n( $q[5], 4 ) ); ?></td><td><?php echo esc_html( $q[4] ); ?></td>
						<td><a href="<?php echo esc_url( add_query_arg( array( 'plan' => $id, 'del' => $qi ), $qn ) ); ?>" onclick="return confirm('Remove this quotation?');">Remove</a></td></tr>
					<?php endforeach; ?></tbody></table>
					<?php endif; ?>
					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="margin-top:8px;">
						<input type="hidden" name="action" value="a4u_lic_quote"><input type="hidden" name="plan" value="<?php echo esc_attr( $id ); ?>">
						<?php wp_nonce_field( 'a4u_lic_quote' ); ?>
						Age <input type="number" name="q_age" min="0" max="99" style="width:70px" required>
						Term/PPT <input type="number" name="q_term" min="1" max="100" style="width:70px" required>
						BSA <input type="number" name="q_sa" min="1000" step="1000" style="width:120px" required>
						Yearly-mode premium (excl. GST, without riders) <input type="number" name="q_prem" min="1" step="0.01" style="width:120px" required>
						<?php submit_button( 'Add quotation', 'secondary', 'submit', false ); ?>
					</form>
				</details>
				<?php if ( ! empty( $p['history'] ) ) : ?>
					<p><strong>Version history:</strong>
					<?php foreach ( $p['history'] as $i => $h ) : ?>
						<a class="button button-small" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=a4u_lic_restore&plan=' . $id . '&idx=' . $i ), 'a4u_lic_restore' ) ); ?>">Restore v<?php echo (int) $h['version']; ?> (<?php echo esc_html( $h['updated'] ); ?>, <?php echo count( (array) $h['rates'] ); ?> rows)</a>
					<?php endforeach; ?></p>
				<?php endif; ?>
			</div>
			<?php endforeach; ?>

		<?php elseif ( 'leads' === $tab ) :
			$leads = $wpdb->get_results( "SELECT * FROM {$lt} ORDER BY id DESC LIMIT 500", ARRAY_A ); // phpcs:ignore
			?>
			<p>Opt-in leads only (consent required). Auto-deleted after <?php echo (int) $d['settings']['retention_days']; ?> days. <a class="button" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=a4u_lic_export_leads' ), 'a4u_lic_export' ) ); ?>">Export CSV</a></p>
			<table class="widefat striped" style="max-width:1000px;"><thead><tr><th>Date</th><th>Name</th><th>Mobile</th><th>Plan</th><th>SA</th><th>Premium</th><th></th></tr></thead><tbody>
			<?php if ( empty( $leads ) ) : ?><tr><td colspan="7">No leads yet.</td></tr><?php endif; ?>
			<?php foreach ( $leads as $l ) : ?>
				<tr><td><?php echo esc_html( $l['created'] ); ?></td><td><?php echo esc_html( $l['name'] ); ?></td><td><a href="<?php echo esc_url( 'https://wa.me/91' . $l['mobile'] ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $l['mobile'] ); ?></a></td><td><?php echo esc_html( $l['plan'] ); ?></td><td><?php echo esc_html( number_format_i18n( (float) $l['sa'] ) ); ?></td><td><?php echo esc_html( number_format_i18n( (float) $l['premium'] ) ); ?></td>
				<td><a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=a4u_lic_del_lead&id=' . (int) $l['id'] ), 'a4u_lic_del_lead' ) ); ?>" onclick="return confirm('Delete this lead?');">Delete</a></td></tr>
			<?php endforeach; ?></tbody></table>

		<?php elseif ( 'stats' === $tab ) :
			$stats = array( 'calculate' => 0, 'compare' => 0, 'pdf' => 0, 'whatsapp' => 0, 'lead' => 0 );
			foreach ( (array) $wpdb->get_results( "SELECT event, hits FROM {$st}", ARRAY_A ) as $r ) { $stats[ $r['event'] ] = (int) $r['hits']; } // phpcs:ignore
			?>
			<table class="widefat striped" style="max-width:500px;"><tbody>
			<?php foreach ( $stats as $k => $v ) : ?><tr><td><?php echo esc_html( ucfirst( $k ) ); ?></td><td><strong><?php echo (int) $v; ?></strong></td></tr><?php endforeach; ?>
			</tbody></table>
			<p><a class="button" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=a4u_lic_reset_stats' ), 'a4u_lic_reset_stats' ) ); ?>" onclick="return confirm('Reset all counters?');">Reset counters</a></p>
			<p style="color:#666;">No personal data is counted.</p>
			<?php $errs = (array) get_option( 'a4u_lic_errors', array() ); ?>
			<h2>Calculator errors on visitors' devices (<?php echo count( $errs ); ?>)</h2>
			<?php if ( $errs ) : ?>
			<table class="widefat striped" style="max-width:1000px;"><thead><tr><th>Last seen</th><th>Count</th><th>Message</th><th>Where</th></tr></thead><tbody>
			<?php foreach ( $errs as $e ) : ?><tr><td><?php echo esc_html( $e['last'] ); ?></td><td><?php echo (int) $e['n']; ?></td><td><?php echo esc_html( $e['msg'] ); ?></td><td><?php echo esc_html( $e['src'] ); ?></td></tr><?php endforeach; ?>
			</tbody></table>
			<p><a class="button" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=a4u_lic_clear_errors' ), 'a4u_lic_clear_errors' ) ); ?>">Clear error log</a></p>
			<?php else : ?><p><em>No errors reported. 👍</em></p><?php endif; ?>

			<?php $ills = (array) get_option( 'a4u_lic_ill_log', array() ); ?>
			<h2>Illustration IDs issued (last <?php echo count( $ills ); ?>)</h2>
			<p style="color:#666;max-width:800px;">Every PDF presentation gets an ID printed in its footer. If a client shows you a PDF, search its ID here to see the plan, Sum Assured, term and the rate version used. No client name or mobile is stored.</p>
			<?php if ( $ills ) : ?>
			<table class="widefat striped" style="max-width:800px;"><thead><tr><th>ID</th><th>Date</th><th>Plan</th><th>Sum Assured</th><th>Term</th><th>Rate version</th></tr></thead><tbody>
			<?php foreach ( array_slice( $ills, 0, 100 ) as $i ) : ?><tr><td><code><?php echo esc_html( $i[0] ); ?></code></td><td><?php echo esc_html( $i[1] ); ?></td><td><?php echo esc_html( $i[2] ); ?></td><td><?php echo esc_html( number_format_i18n( (int) $i[3] ) ); ?></td><td><?php echo (int) $i[4]; ?></td><td><?php echo (int) $i[5]; ?></td></tr><?php endforeach; ?>
			</tbody></table>
			<?php else : ?><p><em>No presentations made yet.</em></p><?php endif; ?>

		<?php elseif ( 'sync' === $tab ) :
			$log = (array) get_option( 'a4u_lic_sync_log', array() ); $hist = (array) get_option( 'a4u_lic_sync_history', array() ); $prev = get_option( 'a4u_lic_data_presync' );
			$su  = wp_nonce_url( admin_url( 'admin-post.php?action=a4u_lic_sync' ), 'a4u_lic_sync' );
			?>
			<p style="max-width:860px;">The plan data is checked against the official LIC benefit illustrations (BI) and published as <code>lic-plans.json</code> on GitHub. This site checks it daily and <strong>applies new data automatically</strong> when a new version is published. The automatic LIC-website reading is switched off. If something looks wrong, use <strong>Undo last update</strong>.</p>
			<table class="widefat striped" style="max-width:700px;"><tbody>
				<tr><td>Last check</td><td><?php echo esc_html( $log['checked_at'] ?? 'never' ); ?> &mdash; <?php echo esc_html( $log['msg'] ?? '' ); ?></td></tr>
				<tr><td>LIC data version (applied / latest)</td><td><?php echo (int) get_option( 'a4u_lic_sync_applied', 0 ); ?> / <?php echo (int) ( $log['remote'] ?? 0 ); ?> <span style="color:#666;">(pipeline checked LIC on <?php echo esc_html( $log['remote_checked'] ?? '?' ); ?>)</span></td></tr>
				<tr><td>Source</td><td><code><?php echo esc_html( $d['settings']['sync_url'] ); ?></code></td></tr>
			</tbody></table>
			<p><a class="button" href="<?php echo esc_url( add_query_arg( 'do', 'check', $su ) ); ?>">Check now</a>
			<?php if ( is_array( $prev ) ) : ?> <a class="button" href="<?php echo esc_url( add_query_arg( 'do', 'undo', $su ) ); ?>">Undo last update</a><?php endif; ?></p>
			<h2>Recent automatic updates</h2>
			<?php if ( $hist ) : foreach ( array_slice( $hist, 0, 5 ) as $h ) : ?>
				<h3 style="margin:14px 0 6px;">v<?php echo (int) $h['version']; ?> &mdash; <?php echo esc_html( $h['at'] ); ?> <small style="font-weight:400;color:#666;"><?php echo (int) $h['plans']; ?> plan(s)<?php echo ! empty( $h['undone'] ) ? ' &middot; <b style="color:#b32d2e;">undone ' . esc_html( $h['undone'] ) . '</b>' : ''; ?></small></h3>
				<table class="widefat striped" style="max-width:1000px;"><thead><tr><th>Plan</th><th>Field</th><th>Before</th><th>After (LIC brochure)</th></tr></thead><tbody>
				<?php foreach ( (array) $h['diff'] as $r ) : ?><tr><td><?php echo esc_html( $r[0] ); ?></td><td><code><?php echo esc_html( $r[1] ); ?></code></td><td style="color:#b32d2e;word-break:break-all;"><?php echo esc_html( $r[2] ); ?></td><td style="color:#00701a;word-break:break-all;"><?php echo esc_html( $r[3] ); ?></td></tr><?php endforeach; ?>
				</tbody></table>
			<?php endforeach; else : ?><p><em>No automatic updates yet.</em></p><?php endif; ?>
			<p style="color:#666;">CSV rates, quotation points, Verified flag and Active status are never changed by sync. Bonus rates change only when the pipeline read them from LIC's bonus circular. New plans arrive switched off.</p>

		<?php elseif ( 'settings' === $tab ) : $s = $d['settings']; ?>
			<?php if ( ! empty( $flash['err']['settings'] ) ) : ?><div class="notice notice-error inline"><p><?php echo esc_html( $flash['err']['settings'] ); ?></p></div><?php endif; ?>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="max-width:760px;">
				<input type="hidden" name="action" value="a4u_lic_settings">
				<?php wp_nonce_field( 'a4u_lic_settings', 'a4u_nonce' ); ?>
				<table class="form-table" role="presentation"><tbody>
					<tr><th>GST % (default)</th><td><input type="number" min="0" max="28" step="0.01" name="gst" value="<?php echo esc_attr( $s['gst'] ); ?>" style="width:90px"> <span style="color:#666;">Individual life premiums: 0% since 22 Sept 2025.</span></td></tr>
					<tr><th>Fallback modal factors</th><td>Half-yearly <input type="number" min="0.01" max="1" step="0.001" name="m_half" value="<?php echo esc_attr( $s['modal']['half'] ); ?>" style="width:80px"> Quarterly <input type="number" min="0.01" max="1" step="0.001" name="m_quarter" value="<?php echo esc_attr( $s['modal']['quarter'] ); ?>" style="width:80px"> Monthly <input type="number" min="0.01" max="1" step="0.001" name="m_month" value="<?php echo esc_attr( $s['modal']['month'] ); ?>" style="width:80px"><p style="color:#666;margin:2px 0 0;">Used only by plans without a mode rebate setting.</p></td></tr>
					<tr><th>Rider flat rates (fallback)</th><td>Accident Benefit <input type="number" min="0" max="50" step="0.01" name="rider" value="<?php echo esc_attr( $s['rider_per_1000'] ); ?>" style="width:70px"> / 1000 rider SA &nbsp; AD&amp;DB <input type="number" min="0" max="50" step="0.01" name="rider_addb" value="<?php echo esc_attr( $s['rider_addb'] ); ?>" style="width:70px"> / 1000 BSA<br>Term rider <input type="number" min="0" max="50" step="0.01" name="rider_term" value="<?php echo esc_attr( $s['rider_term'] ); ?>" style="width:70px"> / 1000 rider SA &nbsp; PWB <input type="number" min="0" max="50" step="0.01" name="rider_pwb_pct" value="<?php echo esc_attr( $s['rider_pwb_pct'] ); ?>" style="width:70px"> % of base premium</td></tr>
					<tr><th>Rider rates CSV (exact)</th><td><textarea name="rider_csv" rows="5" style="width:100%;font-family:monospace;" placeholder="adb,30,20,0.50&#10;term,30,20,1.42&#10;pwb,35,15,2.10"><?php echo esc_textarea( $s['rider_csv'] ); ?></textarea><p style="color:#666;margin:2px 0 0;"><code>rider,age,term,rate</code> &mdash; rider = adb / addb / term / pwb. Rate is per 1000 (pwb: % of base premium, age = proposer age). Missing rows use the flat rate above.</p></td></tr>
					<tr><th colspan="2"><h3 style="margin:10px 0 0;">PDF branding &amp; IRDAI details</h3></th></tr>
					<?php foreach ( array( 'brand_name' => 'Business name', 'agent_name' => 'Agent name (as per licence)', 'agent_type' => 'Agent type', 'agency_code' => 'Agency code', 'agency_branch' => 'Branch', 'brand_phone' => 'Phone', 'brand_email' => 'Email', 'brand_web' => 'Website', 'agent_title' => 'Title on PDF', 'agent_address' => 'Address on PDF', 'agent_email' => 'Email on PDF', 'photo_url' => 'Photo URL (blank = built-in)', 'photo_full_url' => 'Back page photo URL - full-length, transparent PNG/WebP (blank = built-in)', 'loan_rate' => 'Policy loan interest % (for loan limit)', 'logo_url' => 'Logo URL (blank = built-in)', 'color_gold' => 'Accent colour', 'color_green' => 'Main colour' ) as $bk => $bl ) : ?>
					<tr><th><?php echo esc_html( $bl ); ?></th><td><input type="text" name="<?php echo esc_attr( $bk ); ?>" value="<?php echo esc_attr( $s[ $bk ] ?? '' ); ?>" style="width:100%"></td></tr>
					<?php endforeach; ?>
					<tr><th colspan="2"><h3 style="margin:10px 0 0;">Data sync &amp; updates</h3></th></tr>
					<tr><th>LIC data JSON URL</th><td><input type="url" name="sync_url" value="<?php echo esc_attr( $s['sync_url'] ); ?>" style="width:100%"></td></tr>
					<tr><th>Plugin update JSON URL</th><td><input type="url" name="update_url" value="<?php echo esc_attr( $s['update_url'] ); ?>" style="width:100%"></td></tr>
					<tr><th>WhatsApp number</th><td><input type="text" name="whatsapp" value="<?php echo esc_attr( $s['whatsapp'] ); ?>" style="width:160px"> (country code + number)</td></tr>
					<tr><th>Lead retention (days)</th><td><input type="number" min="30" max="1095" name="retention_days" value="<?php echo (int) $s['retention_days']; ?>" style="width:90px"></td></tr>
					<tr><th>LIC plan hub slug</th><td><input type="text" name="hub_slug" value="<?php echo esc_attr( $s['hub_slug'] ?? 'lic-plans' ); ?>" style="width:200px"> <span style="color:#666;">All plans: <a href="<?php echo esc_url( home_url( '/' . ( $s['hub_slug'] ?? 'lic-plans' ) . '/' ) ); ?>" target="_blank"><code>/<?php echo esc_html( $s['hub_slug'] ?? 'lic-plans' ); ?>/</code></a></span></td></tr>
					<tr><th>Lead alert email</th><td><input type="email" name="lead_email" value="<?php echo esc_attr( $s['lead_email'] ?? '' ); ?>" style="width:260px"> <span style="color:#666;">Each new lead is emailed here (leave blank to switch off).</span></td></tr>
					<tr><th>Lead alert on Telegram</th><td><input type="password" name="tg_token" value="" placeholder="<?php echo '' !== (string) ( $s['tg_token'] ?? '' ) ? 'Saved — leave blank to keep' : 'Bot token'; ?>" style="width:260px" autocomplete="off"> <input type="text" name="tg_chat" value="<?php echo esc_attr( $s['tg_chat'] ?? '' ); ?>" placeholder="Chat ID" style="width:140px"> <label><input type="checkbox" name="tg_clear" value="1"> remove token</label></td></tr>
					<tr><th>Calculator page slug</th><td><input type="text" name="base_slug" value="<?php echo esc_attr( $s['base_slug'] ); ?>" style="width:200px"> <span style="color:#666;">Plan pages auto-work at <code>/<?php echo esc_html( $s['base_slug'] ); ?>/714/</code></span></td></tr>
					<tr><th>Update channel</th><td><select name="update_channel"><option value="stable" <?php selected( $s['update_channel'] ?? 'stable', 'stable' ); ?>>Stable (live site)</option><option value="beta" <?php selected( $s['update_channel'] ?? 'stable', 'beta' ); ?>>Beta (staging site — gets new versions first)</option></select></td></tr>
					<tr><th>Inflation for "today's money" (%)</th><td><input type="number" min="0" max="15" step="0.1" name="inflation" value="<?php echo esc_attr( $s['inflation'] ?? 6 ); ?>" style="width:80px"></td></tr>
					<tr><th>FAQ section</th><td><label><input type="checkbox" name="faq" value="1" <?php checked( ! empty( $s['faq'] ), true ); ?>> Show FAQ below calculator + FAQPage schema</label></td></tr>
					<tr><th>Related links (Label|URL per line)</th><td><textarea name="links" rows="4" style="width:100%;"><?php echo esc_textarea( $s['links'] ); ?></textarea></td></tr>
				</tbody></table>
				<?php submit_button( 'Save settings' ); ?>
			</form>
			<h2>Backup &amp; restore</h2>
			<p>Exports settings, branding, plans, CSV rates and quotations (no leads). <a class="button" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=a4u_lic_backup' ), 'a4u_lic_backup' ) ); ?>">Download backup (.json)</a></p>
			<form method="post" enctype="multipart/form-data" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('Replace current calculator data with this backup?');">
				<input type="hidden" name="action" value="a4u_lic_restore_backup"><?php wp_nonce_field( 'a4u_lic_restore_backup' ); ?>
				<input type="file" name="backup" accept=".json,application/json" required> <?php submit_button( 'Restore from backup', 'secondary', 'submit', false ); ?>
				<?php if ( get_option( 'a4u_lic_data_prev' ) ) : ?><span style="color:#666;margin-left:8px;">(the data before your last restore is kept and can be restored by uploading an older backup)</span><?php endif; ?>
			</form>
		<?php endif; ?>
	</div>
	<?php
}

/* =====================================================================
 * 5. Admin: form handlers
 * ===================================================================== */

function a4u_lic_parse_csv( $text, $p ) {
	$rows    = array();
	$errors  = array();
	$allowed = a4u_lic_plan_terms( $p );
	foreach ( preg_split( '/\r\n|\r|\n/', trim( $text ) ) as $n => $line ) {
		$line = trim( $line );
		if ( '' === $line ) { continue; }
		$c  = array_map( 'trim', explode( ',', $line ) );
		$ln = 'Line ' . ( $n + 1 ) . ': ';
		if ( count( $c ) < 3 || ! is_numeric( $c[0] ) || ! is_numeric( $c[1] ) || ! is_numeric( $c[2] ) ) {
			if ( 0 === $n ) { continue; }
			$errors[] = $ln . 'need age,term,rate';
			continue;
		}
		$age  = (int) $c[0];
		$term = (int) $c[1];
		$rate = (float) $c[2];
		if ( $rate <= 0 || $rate > 1500 ) { $errors[] = $ln . 'rate out of range'; continue; }
		if ( $age < (int) $p['min_age'] || $age > (int) $p['max_age'] ) { $errors[] = $ln . "age {$age} outside {$p['min_age']}-{$p['max_age']}"; continue; }
		if ( $allowed && ! in_array( $term, $allowed, true ) ) { $errors[] = $ln . "term {$term} not allowed for this plan"; continue; }
		$key = $age . '|' . $term;
		if ( isset( $rows[ $key ] ) ) { $errors[] = $ln . "duplicate age {$age} / term {$term}"; continue; }
		$rows[ $key ] = $rate;
	}
	return array( $rows, $errors );
}

function a4u_lic_snapshot( $p, $version ) {
	return array(
		'version'   => (int) $version,
		'rates'     => $p['rates'],
		'source'    => $p['source'],
		'effective' => $p['effective'],
		'verified'  => (int) $p['verified'],
		'updated'   => $p['rates_updated'] ?? $p['updated'],
	);
}

add_action( 'admin_post_a4u_lic_save_plan', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_save_plan', 'a4u_nonce' );
	$post = wp_unslash( $_POST ); // phpcs:ignore
	$d    = a4u_lic_data();
	$id   = sanitize_key( $post['plan'] ?? '' );
	if ( ! isset( $d['plans'][ $id ] ) ) { wp_die( 'Unknown plan' ); }
	$p        = $d['plans'][ $id ];
	$errors   = array();
	$snapshot = a4u_lic_snapshot( $p, $d['rate_version'] );

	$p['active'] = isset( $post['active'] ) ? 1 : 0;
	$min_age     = max( 0, min( 99, (int) ( $post['min_age'] ?? $p['min_age'] ) ) );
	$max_age     = max( 0, min( 99, (int) ( $post['max_age'] ?? $p['max_age'] ) ) );
	if ( $min_age > $max_age ) {
		$errors[] = 'Min age cannot be more than max age (ages not changed).';
	} else {
		$p['min_age'] = $min_age;
		$p['max_age'] = $max_age;
	}
	$p['min_sa']       = max( 1000, (int) ( $post['min_sa'] ?? $p['min_sa'] ) );
	$p['max_maturity'] = max( 18, min( 100, (int) ( $post['max_maturity'] ?? $p['max_maturity'] ) ) );
	$p['fab_min_term'] = max( 0, min( 100, (int) ( $post['fab_min_term'] ?? $p['fab_min_term'] ) ) );
	foreach ( array( 'srb', 'fab' ) as $k ) { $p[ $k ] = max( 0, min( 1000, (float) ( $post[ $k ] ?? $p[ $k ] ) ) ); }

	$slabs = a4u_lic_text_to_slabs( $post['sa_slabs'] ?? '' );
	if ( $slabs ) { $p['sa_slabs'] = $slabs; } else { $errors[] = 'SA multiples format: 200000:5000, 450001:50000 (not changed).'; }
	if ( isset( $post['rebate_slabs'] ) ) { $p['rebate_slabs'] = a4u_lic_text_to_pairs( $post['rebate_slabs'] ); }
	if ( isset( $post['mode_adj'] ) ) {
		$m = a4u_lic_text_to_mode( $post['mode_adj'] );
		if ( 4 === count( $m ) ) { $p['mode_adj'] = $m; } else { $errors[] = 'Mode format: yearly:-2, half:-1, quarter:0, month:0 (not changed).'; }
	}
	$p['bonus_bands'] = a4u_lic_text_to_pairs( $post['bonus_bands'] ?? '', 3 );
	$p['death_pct']   = max( 0, min( 500, (int) ( $post['death_pct'] ?? 0 ) ) );
	$p['riders']      = array_values( array_intersect( array( 'adb', 'addb', 'term', 'pwb' ), (array) ( $post['riders'] ?? array() ) ) );
	$p['sample_sa']   = max( 0, (int) ( $post['sample_sa'] ?? 0 ) );
	$p['samples']     = a4u_lic_text_to_samples( $post['samples'] ?? '' );
	$p['source']      = sanitize_text_field( $post['source'] ?? '' );
	$eff              = sanitize_text_field( $post['effective'] ?? '' );
	if ( '' !== $eff && ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $eff ) ) {
		$errors[] = 'Effective date must be YYYY-MM-DD.';
		$eff      = '';
	}
	$p['effective'] = $eff;

	$csv = trim( (string) ( $post['csv'] ?? '' ) );
	if ( '' !== $csv ) {
		list( $rows, $csv_err ) = a4u_lic_parse_csv( $csv, $p );
		if ( $csv_err ) {
			$errors = array_merge( $errors, array( 'CSV not imported' ), array_slice( $csv_err, 0, 5 ) );
		} elseif ( ! $rows ) {
			$errors[] = 'No valid rows found.';
		} else {
			array_unshift( $p['history'], $snapshot );
			$p['history']       = array_slice( (array) $p['history'], 0, 5 );
			$p['rates']         = $rows;
			$p['rates_updated'] = current_time( 'mysql' );
		}
	}

	$want          = isset( $post['verified'] );
	$p['verified'] = ( $want && '' !== $p['source'] && '' !== $p['effective'] && ! empty( $p['rates'] ) ) ? 1 : 0;
	if ( $want && ! $p['verified'] ) { $errors[] = 'Verified needs Source + Effective date + at least 1 CSV rate row.'; }

	$p['updated']      = current_time( 'mysql' );
	$d['plans'][ $id ] = $p;
	a4u_lic_save( $d );
	a4u_lic_flash( 'plan ' . $id, $errors ? array( $id => implode( ' | ', $errors ) ) : array() );
	wp_safe_redirect( admin_url( 'admin.php?page=a4u-lic' ) );
	exit;
} );

add_action( 'admin_post_a4u_lic_restore', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_restore' );
	$d  = a4u_lic_data();
	$id = sanitize_key( $_GET['plan'] ?? '' ); // phpcs:ignore
	$i  = (int) ( $_GET['idx'] ?? -1 ); // phpcs:ignore
	if ( isset( $d['plans'][ $id ]['history'][ $i ] ) ) {
		$p = $d['plans'][ $id ];
		$h = $p['history'][ $i ];
		array_unshift( $p['history'], a4u_lic_snapshot( $p, $d['rate_version'] ) );
		$p['history']       = array_slice( $p['history'], 0, 5 );
		$p['rates']         = a4u_lic_rates_to_map( $h['rates'] ?? array() );
		$p['source']        = (string) ( $h['source'] ?? '' );
		$p['effective']     = (string) ( $h['effective'] ?? '' );
		$p['verified']      = ( ! empty( $h['verified'] ) && '' !== $p['source'] && '' !== $p['effective'] && ! empty( $p['rates'] ) ) ? 1 : 0;
		$p['rates_updated'] = current_time( 'mysql' );
		$p['updated']       = current_time( 'mysql' );
		$d['plans'][ $id ]  = $p;
		a4u_lic_save( $d );
		a4u_lic_flash( 'restored ' . $id );
	}
	wp_safe_redirect( admin_url( 'admin.php?page=a4u-lic' ) );
	exit;
} );

add_action( 'admin_post_a4u_lic_settings', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_settings', 'a4u_nonce' );
	$post  = wp_unslash( $_POST ); // phpcs:ignore
	$d     = a4u_lic_data();
	$s     = $d['settings'];
	$clamp = function ( $v, $min, $max, $def ) {
		$v = is_numeric( $v ) ? (float) $v : $def;
		return max( $min, min( $max, $v ) );
	};
	$s['gst']              = $clamp( $post['gst'] ?? 0, 0, 28, 0 );
	$s['modal']['yearly']  = 1;
	$s['modal']['half']    = $clamp( $post['m_half'] ?? null, 0.01, 1, 0.51 );
	$s['modal']['quarter'] = $clamp( $post['m_quarter'] ?? null, 0.01, 1, 0.26 );
	$s['modal']['month']   = $clamp( $post['m_month'] ?? null, 0.01, 1, 0.087 );
	$s['rider_per_1000']   = $clamp( $post['rider'] ?? null, 0, 50, 0.5 );
	$s['rider_addb']       = $clamp( $post['rider_addb'] ?? null, 0, 50, 1 );
	$s['rider_term']       = $clamp( $post['rider_term'] ?? null, 0, 50, 1.5 );
	$s['rider_pwb_pct']    = $clamp( $post['rider_pwb_pct'] ?? null, 0, 50, 2 );
	// rider CSV: फक्त बरोबर ओळी ठेव
	$keep = array();
	foreach ( a4u_lic_rider_map( $post['rider_csv'] ?? '' ) as $k => $v ) { $keep[] = str_replace( '|', ',', $k ) . ',' . $v; }
	$s['rider_csv']      = implode( "\n", $keep );
	$s['retention_days'] = (int) $clamp( $post['retention_days'] ?? null, 30, 1095, 180 );
	$s['faq']            = isset( $post['faq'] ) ? 1 : 0;
	$new_slug            = sanitize_title( $post['base_slug'] ?? 'lic-calculator' );
	if ( '' !== $new_slug && $new_slug !== $s['base_slug'] ) { update_option( 'a4u_lic_flush', 1, false ); }
	$s['base_slug'] = '' !== $new_slug ? $new_slug : 'lic-calculator';
	$hub_slug = sanitize_title( $post['hub_slug'] ?? 'lic-plans' );
	if ( '' === $hub_slug ) { $hub_slug = 'lic-plans'; }
	if ( $hub_slug !== ( $s['hub_slug'] ?? 'lic-plans' ) ) { update_option( 'a4u_lic_flush', 1, false ); }
	$s['hub_slug']   = $hub_slug;
	$s['lead_email'] = sanitize_email( (string) ( $post['lead_email'] ?? '' ) );
	$s['tg_chat']    = preg_replace( '/[^0-9@A-Za-z_-]/', '', (string) ( $post['tg_chat'] ?? '' ) );
	$tg_new          = trim( (string) ( $post['tg_token'] ?? '' ) );
	if ( ! empty( $post['tg_clear'] ) ) { $s['tg_token'] = ''; }
	elseif ( '' !== $tg_new && preg_match( '/^\d+:[A-Za-z0-9_-]{20,}$/', $tg_new ) ) { $s['tg_token'] = $tg_new; }
	$s['whatsapp']  = preg_replace( '/\D/', '', (string) ( $post['whatsapp'] ?? '' ) );
	foreach ( array( 'brand_name', 'agent_name', 'agent_type', 'agency_code', 'agency_branch', 'brand_phone', 'brand_web', 'agent_title', 'agent_address' ) as $bk ) { $s[ $bk ] = sanitize_text_field( $post[ $bk ] ?? '' ); }
	$s['agent_email'] = sanitize_email( $post['agent_email'] ?? '' );
	$s['photo_url']   = esc_url_raw( $post['photo_url'] ?? '' );
	$s['photo_full_url'] = esc_url_raw( $post['photo_full_url'] ?? '' ); // v4.8.1 (S1): PDF मागच्या पानाचा फोटो
	$s['loan_rate']   = max( 0.5, min( 20, (float) ( $post['loan_rate'] ?? 9.5 ) ) );
	$s['brand_email'] = sanitize_email( $post['brand_email'] ?? '' );
	$s['logo_url']    = esc_url_raw( $post['logo_url'] ?? '' );
	foreach ( array( 'color_gold' => '#B8924A', 'color_green' => '#3F5A22' ) as $ck => $cd ) { $s[ $ck ] = sanitize_hex_color( $post[ $ck ] ?? '' ) ?: $cd; }
	$s['update_channel'] = 'beta' === ( $post['update_channel'] ?? '' ) ? 'beta' : 'stable';
	$s['inflation']      = $clamp( $post['inflation'] ?? 6, 0, 15, 6 );
	$s['sync_url']   = esc_url_raw( $post['sync_url'] ?? '' );
	$s['update_url'] = esc_url_raw( $post['update_url'] ?? '' );
	delete_transient( 'a4u_lic_update_info' );
	$links          = array();
	foreach ( preg_split( '/\r\n|\r|\n/', (string) ( $post['links'] ?? '' ) ) as $line ) {
		$parts = array_map( 'trim', explode( '|', $line, 2 ) );
		if ( 2 === count( $parts ) && '' !== $parts[0] && esc_url_raw( $parts[1] ) ) {
			$links[] = sanitize_text_field( $parts[0] ) . '|' . esc_url_raw( $parts[1] );
		}
	}
	$s['links']    = implode( "\n", $links );
	$d['settings'] = $s;
	a4u_lic_save( $d );
	a4u_lic_flash( 'settings' );
	wp_safe_redirect( admin_url( 'admin.php?page=a4u-lic&tab=settings' ) );
	exit;
} );

add_action( 'admin_post_a4u_lic_del_lead', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_del_lead' );
	global $wpdb;
	$lid = absint( $_GET['id'] ?? 0 ); // phpcs:ignore
	if ( $lid ) { $wpdb->delete( a4u_lic_table( 'leads' ), array( 'id' => $lid ), array( '%d' ) ); }
	a4u_lic_flash( 'lead deleted' );
	wp_safe_redirect( admin_url( 'admin.php?page=a4u-lic&tab=leads' ) );
	exit;
} );

function a4u_lic_csv_cell( $v ) {
	$v = (string) $v;
	return ( '' !== $v && false !== strpos( "=+-@\t\r", $v[0] ) ) ? "'" . $v : $v;
}

add_action( 'admin_post_a4u_lic_export_leads', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_export' );
	global $wpdb;
	$t    = a4u_lic_table( 'leads' );
	$rows = $wpdb->get_results( "SELECT created, name, mobile, plan, sa, premium FROM {$t} ORDER BY id DESC", ARRAY_A ); // phpcs:ignore
	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename=a4u-lic-leads-' . gmdate( 'Y-m-d' ) . '.csv' );
	$out = fopen( 'php://output', 'w' );
	fwrite( $out, "\xEF\xBB\xBF" );
	fputcsv( $out, array( 'date', 'name', 'mobile', 'plan', 'sa', 'premium' ) );
	foreach ( (array) $rows as $l ) { fputcsv( $out, array_map( 'a4u_lic_csv_cell', array_values( $l ) ) ); }
	fclose( $out );
	exit;
} );

add_action( 'admin_post_a4u_lic_reset_stats', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_reset_stats' );
	global $wpdb;
	$wpdb->query( 'DELETE FROM ' . a4u_lic_table( 'stats' ) ); // phpcs:ignore
	a4u_lic_flash( 'stats reset' );
	wp_safe_redirect( admin_url( 'admin.php?page=a4u-lic&tab=stats' ) );
	exit;
} );

// F: खरी LIC quotation → अचूक rate point
add_action( 'admin_post_a4u_lic_quote', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_quote' );
	$d   = a4u_lic_data();
	$req = wp_unslash( $_REQUEST ); // phpcs:ignore
	$id  = sanitize_key( $req['plan'] ?? '' );
	if ( ! isset( $d['plans'][ $id ] ) ) { wp_die( 'Unknown plan' ); }
	$p = $d['plans'][ $id ];
	$p['quotes'] = (array) ( $p['quotes'] ?? array() );
	$p['points'] = (array) ( $p['points'] ?? array() );
	$err = '';
	if ( isset( $req['del'] ) ) {
		$i = (int) $req['del'];
		if ( isset( $p['quotes'][ $i ] ) ) {
			unset( $p['points'][ (int) $p['quotes'][ $i ][0] . '|' . (int) $p['quotes'][ $i ][1] ] );
			array_splice( $p['quotes'], $i, 1 );
		}
	} else {
		$age  = (int) ( $req['q_age'] ?? -1 );
		$term = (int) ( $req['q_term'] ?? 0 );
		$sa   = (int) ( $req['q_sa'] ?? 0 );
		$prem = (float) ( $req['q_prem'] ?? 0 );
		if ( $age < $p['min_age'] || $age > $p['max_age'] ) { $err = 'Age outside plan limits.'; }
		elseif ( ! in_array( $term, a4u_lic_plan_terms( $p ), true ) ) { $err = 'Term/PPT not allowed for this plan.'; }
		elseif ( $sa < $p['min_sa'] || $prem <= 0 ) { $err = 'Check BSA and premium.'; }
		else {
			$rate = a4u_lic_quote_rate( $p, $age, $sa, $prem );
			if ( $rate <= 0 || $rate > 1500 ) { $err = 'This premium gives an impossible rate — please re-check.'; }
			else {
				foreach ( $p['quotes'] as $i => $q ) { if ( (int) $q[0] === $age && (int) $q[1] === $term ) { array_splice( $p['quotes'], $i, 1 ); break; } }
				$p['quotes'][]                     = array( $age, $term, $prem, $sa, current_time( 'Y-m-d' ), round( $rate, 6 ) );
				$p['points'][ $age . '|' . $term ] = round( $rate, 6 );
			}
		}
	}
	if ( ! $err ) {
		$d['plans'][ $id ] = $p;
		a4u_lic_save( $d );
	}
	a4u_lic_flash( $err ? '' : 'quotation for plan ' . $id, $err ? array( $id => $err ) : array() );
	wp_safe_redirect( admin_url( 'admin.php?page=a4u-lic' ) );
	exit;
} );

add_action( 'admin_post_a4u_lic_clear_errors', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_clear_errors' );
	delete_option( 'a4u_lic_errors' );
	wp_safe_redirect( admin_url( 'admin.php?page=a4u-lic&tab=stats' ) );
	exit;
} );

// Backup: settings + plans (leads नाहीत)
add_action( 'admin_post_a4u_lic_backup', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_backup' );
	$d = a4u_lic_data();
	nocache_headers();
	header( 'Content-Type: application/json; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename=a4u-lic-backup-' . gmdate( 'Y-m-d' ) . '.json' );
	echo wp_json_encode( array( 'a4u_lic_backup' => 1, 'plugin' => A4U_LIC_VER, 'saved' => current_time( 'mysql' ), 'data' => $d ), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	exit;
} );

add_action( 'admin_post_a4u_lic_restore_backup', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed' ); }
	check_admin_referer( 'a4u_lic_restore_backup' );
	$ok  = false;
	$tmp = $_FILES['backup']['tmp_name'] ?? ''; // phpcs:ignore
	if ( $tmp && is_uploaded_file( $tmp ) && filesize( $tmp ) < 5 * MB_IN_BYTES ) {
		$j = json_decode( (string) file_get_contents( $tmp ), true ); // phpcs:ignore
		if ( is_array( $j ) && ! empty( $j['a4u_lic_backup'] ) && is_array( $j['data']['plans'] ?? null ) && is_array( $j['data']['settings'] ?? null ) ) {
			update_option( 'a4u_lic_data_prev', a4u_lic_data(), false );
			$new = $j['data'];
			$new['rate_version'] = (int) ( a4u_lic_data()['rate_version'] ?? 1 );
			a4u_lic_save( $new );
			$ok = true;
		}
	}
	a4u_lic_flash( $ok ? 'backup restored' : '', $ok ? array() : array( 'settings' => 'Not a valid A4U LIC backup file.' ) );
	wp_safe_redirect( admin_url( 'admin.php?page=a4u-lic&tab=settings' ) );
	exit;
} );
