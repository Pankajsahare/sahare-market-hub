<?php
// A4U LIC Calculator — plans चा data, defaults, helpers
if ( ! defined( 'ABSPATH' ) ) { exit; }

/* =====================================================================
 * 1. डेटा: plans (LIC sales brochures, 22 Sept 2025 पासूनच्या आवृत्त्या)
 * ===================================================================== */

function a4u_lic_table( $name ) {
	global $wpdb;
	return $wpdb->prefix . 'a4u_lic_' . $name;
}

// LIC ची सर्वसाधारण mode rebate: yearly 2%, half-yearly 1% (tabular premium वर)
function a4u_lic_std_mode() {
	return array( 'yearly' => -2, 'half' => -1, 'quarter' => 0, 'month' => 0 );
}

// brochure मधून बदलणाऱ्या गोष्टी (upgrade वेळी या keys नव्याने भरल्या जातात)
function a4u_lic_brochure_keys() {
	return array( 'name', 'type', 'min_age', 'max_age', 'min_sa', 'max_maturity', 'min_maturity', 'terms', 'ppt_map', 'ppt_options', 'ppt_max_age_sum',
		'maturity_age', 'survival_pct', 'ga_per_1000', 'tail_age', 'min_age_by_term', 'sa_slabs', 'rebate_slabs', 'rebate_bands', 'mode_adj',
		'death_pct', 'death_sp', 'riders', 'samples', 'sample_sa', 'brochure', 'closed', 'uin', 'sb_years', 'sb_ages', 'mat_pct', 'mb_ppt', 'mb_end_age', 'gsv_prem', 'gsv_add', 'gsv_less_income', 'loan_from', 'loan_ga_bands', 'ppt_age', 'ga_prem_per_1000', 'booster_pct', 'ga_hsa', 'rebate_pct_bands', 'rebate_pct_bands_sp', 'allowed_modes', 'max_sa', 'loan_pct', 'ppt_less' );
}

function a4u_lic_default_plans() {
	$now  = current_time( 'mysql' );
	$base = array( 'active' => 1, 'verified' => 0, 'source' => 'LIC sales brochure sample premiums (estimate)', 'effective' => '2025-09-22',
		'rates' => array(), 'history' => array(), 'updated' => $now, 'rates_updated' => $now, 'closed' => 0, 'bonus_bands' => array(),
		'fab' => 0, 'fab_min_term' => 99, 'srb' => 0, 'mode_adj' => a4u_lic_std_mode(), 'min_age_by_term' => array(), 'min_maturity' => 0 );
	$b    = 'https://licindia.in/documents/20121/';
	$plans = array(
		'714' => array_merge( $base, array(
			'name' => 'New Endowment (714)', 'type' => 'endowment',
			'min_age' => 8, 'max_age' => 50, 'max_maturity' => 75, 'terms' => range( 12, 35 ),
			'min_sa' => 200000, 'sa_slabs' => array( array( 200000, 5000 ), array( 450001, 50000 ), array( 900001, 100000 ) ),
			'rebate_slabs' => array( array( 500000, 2.5 ), array( 1000000, 4 ) ),
			'srb' => 45, 'death_pct' => 100, 'riders' => array( 'adb', 'addb', 'term', 'pwb' ),
			'sample_sa' => 200000, 'samples' => array( array( 20, 15, 14543 ), array( 20, 25, 8369 ), array( 20, 35, 5949 ), array( 30, 15, 14592 ), array( 30, 25, 8497 ), array( 30, 35, 6213 ), array( 40, 15, 14847 ), array( 40, 25, 8987 ), array( 40, 35, 6958 ) ),
			'brochure' => $b . "1319704/LIC%27s+NEW+ENDOWMENT+PLAN+714.pdf/77f3167c-ae64-a1ea-d348-1c66f4455aed",
		) ),
		'715' => array_merge( $base, array(
			'name' => 'New Jeevan Anand (715)', 'type' => 'anand',
			'min_age' => 18, 'max_age' => 50, 'max_maturity' => 75, 'terms' => range( 15, 35 ), 'tail_age' => 100,
			'min_sa' => 200000, 'sa_slabs' => array( array( 200000, 5000 ), array( 450001, 50000 ), array( 900001, 100000 ) ),
			'rebate_slabs' => array( array( 500000, 2.5 ), array( 1000000, 4 ) ),
			'srb' => 45, 'fab' => 100, 'fab_min_term' => 20, 'death_pct' => 125, 'riders' => array( 'adb', 'addb', 'term' ),
			'sample_sa' => 200000, 'samples' => array( array( 20, 15, 16229 ), array( 20, 25, 9339 ), array( 20, 35, 6517 ), array( 30, 15, 16885 ), array( 30, 25, 9810 ), array( 30, 35, 6968 ), array( 40, 15, 18012 ), array( 40, 25, 10711 ), array( 40, 35, 7918 ), array( 50, 15, 19914 ), array( 50, 25, 12397 ) ),
			'brochure' => $b . "1319704/LIC%27s+New+Jeevan+Anand+Sales+Brochure+Eng_141025.pdf/43b60cd9-f6f1-c889-734c-47c565a47ada",
		) ),
		'733' => array_merge( $base, array(
			'name' => 'Jeevan Lakshya (733)', 'type' => 'lakshya',
			'min_age' => 18, 'max_age' => 50, 'min_maturity' => 31, 'max_maturity' => 65, 'terms' => range( 13, 25 ),
			'min_sa' => 200000, 'sa_slabs' => array( array( 200000, 10000 ), array( 400001, 50000 ) ),
			'rebate_slabs' => array( array( 500000, 4 ), array( 1000000, 5 ) ),
			'srb' => 45, 'fab' => 100, 'fab_min_term' => 20, 'death_pct' => 110, 'riders' => array( 'adb', 'addb', 'term' ),
			'sample_sa' => 200000, 'samples' => array( array( 20, 13, 20217 ), array( 20, 15, 16670 ), array( 20, 20, 11711 ), array( 20, 25, 9006 ), array( 30, 13, 20286 ), array( 30, 15, 16758 ), array( 30, 20, 11858 ), array( 30, 25, 9222 ), array( 40, 13, 20678 ), array( 40, 15, 17209 ), array( 40, 20, 12495 ), array( 40, 25, 10074 ), array( 50, 13, 22030 ), array( 50, 15, 18698 ) ),
			'brochure' => $b . "1319704/LIC+Jeevan+Lakshya+Sales+Brochure_Eng_06112025.pdf/fcc745f6-e73e-c825-d3a6-9831221c5cc9",
		) ),
		'736' => array_merge( $base, array(
			'name' => 'Jeevan Labh (736)', 'type' => 'labh',
			'min_age' => 8, 'max_age' => 59, 'max_maturity' => 75, 'ppt_map' => array( 16 => 10, 21 => 15, 25 => 16 ),
			'min_sa' => 200000, 'sa_slabs' => array( array( 200000, 10000 ), array( 450001, 25000 ) ),
			'rebate_slabs' => array( array( 500000, 2 ), array( 1000000, 3 ), array( 1500000, 3.5 ) ),
			'srb' => 49, 'fab' => 200, 'fab_min_term' => 21, 'death_pct' => 100, 'riders' => array( 'adb', 'addb', 'term', 'pwb' ),
			'sample_sa' => 200000, 'samples' => array( array( 20, 16, 17718 ), array( 20, 21, 11623 ), array( 20, 25, 9908 ), array( 30, 16, 17767 ), array( 30, 21, 11701 ), array( 30, 25, 10025 ), array( 40, 16, 18012 ), array( 40, 21, 12054 ), array( 40, 25, 10476 ), array( 50, 16, 18855 ), array( 50, 21, 13083 ), array( 50, 25, 11682 ) ),
			'brochure' => $b . "1319704/LIC_Jeevan+labh_Sales+Brochure_Eng.pdf/cafcd0b7-8f9d-6b65-f5e9-b2aad0788c98",
		) ),
		'745' => array_merge( $base, array(
			'name' => 'Jeevan Umang (745)', 'type' => 'umang',
			'min_age' => 0, 'max_age' => 55, 'max_maturity' => 100, 'ppt_options' => array( 15, 20, 25, 30 ), 'ppt_max_age_sum' => 70, 'maturity_age' => 100, 'survival_pct' => 8,
			'min_sa' => 200000, 'sa_slabs' => array( array( 200000, 25000 ), array( 450001, 50000 ), array( 900001, 100000 ) ),
			'rebate_slabs' => array( array( 500000, 2.5 ), array( 1000000, 3.5 ), array( 2500000, 4 ) ),
			'srb' => 42, 'fab' => 300, 'fab_min_term' => 25, 'death_pct' => 100, 'riders' => array( 'adb', 'addb', 'term', 'pwb' ),
			'sample_sa' => 200000, 'samples' => array( array( 20, 15, 16542 ), array( 20, 20, 11407 ), array( 20, 25, 8536 ), array( 20, 30, 6840 ), array( 30, 15, 16542 ), array( 30, 20, 11407 ), array( 30, 25, 8595 ), array( 30, 30, 7027 ), array( 40, 15, 16542 ), array( 40, 20, 11476 ), array( 40, 25, 9036 ), array( 40, 30, 7664 ), array( 50, 15, 16562 ), array( 50, 20, 12368 ) ),
			'brochure' => $b . "1319704/745+LIC_Jeevan+Umang_Eng+_141025.pdf/d67dc9dc-ca37-7e1e-d662-132423c49d15",
		) ),
		// v4.1: 770 Bima Platinum — term व PPT स्वतंत्र; terms = PPT×100 + term (उदा. 1020 = 10 वर्षं भरा, 20 वर्षं मुदत)
		'770' => array_merge( $base, array(
			'name' => 'Bima Platinum (770)', 'type' => 'platinum',
			'min_age' => 0, 'max_age' => 55, 'min_maturity' => 28, 'max_maturity' => 75,
			'terms' => array_merge( ...array_map( function ( $ppt ) { $min = array( 7 => 17, 10 => 20, 12 => 22, 15 => 25, 18 => 28 ); return array_map( function ( $t ) use ( $ppt ) { return $ppt * 100 + $t; }, range( $min[ $ppt ], 40 ) ); }, array( 10, 7, 12, 15, 18 ) ) ),
			'ppt_age' => array( 7 => array( 11, 55 ), 10 => array( 8, 55 ), 12 => array( 6, 53 ), 15 => array( 3, 50 ), 18 => array( 0, 47 ) ),
			'min_sa' => 300000, 'sa_slabs' => array( array( 300000, 10000 ) ), 'rebate_slabs' => array(),
			'survival_pct' => 10, 'booster_pct' => 70, 'ga_prem_per_1000' => 70, 'loan_pct' => 75, 'loan_from' => 1,
			// brochure: yearly factor 1.0 (सूट नाही); half 0.5090×2, quarter 0.2568×4, monthly 0.0861×12
			'mode_adj' => array( 'yearly' => 0, 'half' => 1.8, 'quarter' => 2.72, 'month' => 3.32 ),
			// high SA incentive: GA दरात वाढ (₹ per 1000 annualised premium) — PPT => [[SA पासून, वाढ]]
			'ga_hsa' => array( 7 => array( array( 500000, 3 ), array( 700000, 6 ), array( 1000000, 8 ) ), 10 => array( array( 500000, 4 ), array( 700000, 7 ), array( 1000000, 9 ) ), 12 => array( array( 500000, 5 ), array( 700000, 8 ), array( 1000000, 10 ) ), 15 => array( array( 500000, 6 ), array( 700000, 10 ), array( 1000000, 12 ) ), 18 => array( array( 500000, 7 ), array( 700000, 12 ), array( 1000000, 15 ) ) ),
			'riders' => array( 'adb', 'addb', 'term', 'pwb' ), 'sample_sa' => 0, 'samples' => array(), 'source' => 'LIC tariff rates', 'brochure' => '',
		) ),
		// v4.2: 894 Jeevan Raksha — शुद्ध term plan; terms = PPT×100 + term (PPT = term म्हणजे नियमित हप्ता)
		'894' => array_merge( $base, array(
			'name' => 'Jeevan Raksha (894)', 'type' => 'term',
			'min_age' => 18, 'max_age' => 45, 'min_maturity' => 33, 'max_maturity' => 60,
			'terms' => array_merge( array_map( function ( $t ) { return $t * 100 + $t; }, range( 15, 42 ) ), array_map( function ( $t ) { return 1500 + $t; }, range( 20, 42 ) ), array_map( function ( $t ) { return 1000 + $t; }, range( 15, 42 ) ), array_map( function ( $t ) { return 100 + $t; }, range( 15, 42 ) ) ), // 100+term = single premium
			'min_sa' => 500000, 'max_sa' => 2400000, 'sa_slabs' => array( array( 500000, 50000 ), array( 800000, 100000 ) ),
			'rebate_slabs' => array(),
			// high SA rebate, tabular premium च्या % मध्ये: [कमाल वय, [[SA पासून, %]]]
			'rebate_pct_bands' => array( array( 30, array( array( 700000, 5 ), array( 1000000, 10 ), array( 1500000, 15 ), array( 2000000, 18 ) ) ), array( 45, array( array( 700000, 3 ), array( 1000000, 6 ), array( 1500000, 10 ), array( 2000000, 14 ) ) ) ),
			'rebate_pct_bands_sp' => array( array( 30, array( array( 700000, 4 ), array( 1000000, 9 ), array( 1500000, 14 ), array( 2000000, 17 ) ) ), array( 45, array( array( 700000, 2 ), array( 1000000, 5 ), array( 1500000, 8 ), array( 2000000, 11 ) ) ) ),
			'mode_adj' => array( 'yearly' => 0, 'half' => 2 ), 'allowed_modes' => array( 'yearly', 'half' ),
			'death_pct' => 100, 'riders' => array( 'adb' ), 'sample_sa' => 0, 'samples' => array(), 'source' => 'LIC tariff rates', 'brochure' => '',
		) ),
		'760' => array_merge( $base, array(
			'name' => 'Bima Jyoti (760)', 'type' => 'ga_endow', 'ppt_less' => 5,
			'min_age' => 0, 'max_age' => 60, 'max_maturity' => 75, 'terms' => range( 15, 20 ),
			'min_sa' => 125000, 'sa_slabs' => array( array( 125000, 25000 ) ),
			'rebate_slabs' => array(), 'ga_per_1000' => 50, 'death_pct' => 125, 'riders' => array( 'adb', 'addb', 'term', 'pwb' ),
			'sample_sa' => 0, 'samples' => array(), 'source' => 'LIC tariff rates', 'loan_pct' => 90,
			'brochure' => '',
		) ),
		'717' => array_merge( $base, array(
			'name' => 'Single Premium Endowment (717)', 'type' => 'single',
			'min_age' => 0, 'max_age' => 65, 'min_maturity' => 18, 'max_maturity' => 75, 'terms' => range( 10, 25 ),
			'min_sa' => 100000, 'sa_slabs' => array( array( 100000, 10000 ), array( 250001, 25000 ) ),
			'rebate_slabs' => array( array( 200000, 20 ), array( 300000, 30 ), array( 500000, 40 ) ),
			'srb' => 45, 'death_sp' => array( array( 49, 1.25 ), array( 200, 1.10 ) ), 'death_pct' => 100, 'riders' => array( 'addb', 'term' ), 'mode_adj' => array(),
			'sample_sa' => 100000, 'samples' => array( array( 10, 10, 77910 ), array( 10, 15, 66650 ), array( 10, 25, 50005 ), array( 20, 10, 77985 ), array( 20, 15, 66775 ), array( 20, 25, 50255 ), array( 30, 10, 78010 ), array( 30, 15, 66865 ), array( 30, 25, 50695 ), array( 40, 10, 78180 ), array( 40, 15, 67335 ), array( 40, 25, 52340 ), array( 50, 10, 78800 ), array( 50, 15, 68800 ), array( 50, 25, 56160 ), array( 60, 10, 79965 ), array( 60, 15, 71405 ) ),
			'brochure' => $b . "1319704/717+LIC_Single+Premium+Endowment+plan_Eng_141025.pdf/7215c5ff-2071-669a-1a4e-71182e2a102e",
		) ),
		// v3.1: Money-back plans (LIC sales brochures; 732 ची माहिती 2025 brochure मधून)
		'720' => array_merge( $base, array(
			'name' => 'New Money Back 20 Years (720)', 'type' => 'moneyback',
			'min_age' => 13, 'max_age' => 50, 'max_maturity' => 70, 'terms' => array( 20 ), 'mb_ppt' => 15,
			'sb_years' => array( array( 5, 20 ), array( 10, 20 ), array( 15, 20 ) ), 'mat_pct' => 40,
			'min_sa' => 200000, 'sa_slabs' => array( array( 200000, 25000 ) ),
			'rebate_slabs' => array( array( 500000, 3 ) ),
			'srb' => 41, 'death_pct' => 125, 'riders' => array( 'adb', 'addb', 'term' ),
			'sample_sa' => 200000, 'samples' => array( array( 20, 20, 15896 ), array( 30, 20, 16082 ), array( 40, 20, 16846 ), array( 50, 20, 18679 ) ),
			'brochure' => $b . "1319704/LIC_Money+Back+20+yrs+Sales+Brochure+Eng_06112025.pdf/f5e34f06-86b6-c2d3-6531-3351d36a5e77",
		) ),
		'721' => array_merge( $base, array(
			'name' => 'New Money Back 25 Years (721)', 'type' => 'moneyback',
			'min_age' => 13, 'max_age' => 45, 'max_maturity' => 70, 'terms' => array( 25 ), 'mb_ppt' => 20,
			'sb_years' => array( array( 5, 15 ), array( 10, 15 ), array( 15, 15 ), array( 20, 15 ) ), 'mat_pct' => 40,
			'min_sa' => 200000, 'sa_slabs' => array( array( 200000, 25000 ) ),
			'rebate_slabs' => array( array( 500000, 3 ) ),
			'srb' => 43, 'death_pct' => 125, 'riders' => array( 'adb', 'addb', 'term' ),
			// brochure table वर "BSA 1 lakh" छापलं आहे, पण min BSA 2 lakh आहे आणि benefit illustration (age 30 = 12,573) 2 lakh ला जुळतं
			'sample_sa' => 200000, 'samples' => array( array( 20, 25, 12299 ), array( 30, 25, 12573 ), array( 40, 25, 13465 ), array( 45, 25, 14298 ) ),
			'brochure' => $b . "1319704/LIC_Money+Back+25+yrs+Sales+Brochure+Eng_06112025.pdf/7e7718e0-e37d-9fa8-c17e-f632e69c965f",
		) ),
		'732' => array_merge( $base, array(
			'name' => "New Children's Money Back (732)", 'type' => 'moneyback',
			'min_age' => 0, 'max_age' => 12, 'max_maturity' => 25, 'terms' => array( 25 ), 'mb_end_age' => 25,
			'sb_ages' => array( array( 18, 20 ), array( 20, 20 ), array( 22, 20 ) ), 'mat_pct' => 40,
			'min_sa' => 200000, 'sa_slabs' => array( array( 200000, 5000 ), array( 450001, 50000 ), array( 900001, 100000 ) ),
			'rebate_slabs' => array( array( 500000, 2.5 ), array( 1000000, 4 ) ),
			'srb' => 43, 'death_pct' => 100, 'riders' => array( 'pwb' ),
			'sample_sa' => 200000, 'samples' => array( array( 0, 25, 9006 ), array( 5, 20, 11682 ), array( 10, 15, 16395 ), array( 12, 13, 19002 ) ),
			'brochure' => $b . "1319704/Final+Sales+Brochure_New+ChildrensMoney+BackPlan.pdf/5c497b62-1ab2-45cd-08e3-d3247f6ee43c",
		) ),
		'771' => array_merge( $base, array(
			'name' => 'Jeevan Utsav (771)', 'type' => 'utsav',
			'min_age' => 0, 'max_age' => 65, 'max_maturity' => 100, 'ppt_options' => range( 5, 16 ), 'ppt_max_age_sum' => 75, 'maturity_age' => 100, 'survival_pct' => 10, 'ga_per_1000' => 40,
			'min_age_by_term' => array( 5 => 8, 6 => 8, 7 => 8, 8 => 8, 9 => 7, 10 => 6, 11 => 5, 12 => 4, 13 => 3, 14 => 2, 15 => 1, 16 => 0 ),
			'min_sa' => 500000, 'sa_slabs' => array( array( 500000, 25000 ), array( 2400001, 100000 ) ),
			'rebate_slabs' => array(), // brochure मध्ये टक्के दिलेले नाहीत — admin मध्ये भरा
			'mode_adj' => array( 'yearly' => 0, 'half' => 1.75, 'quarter' => 2.5, 'month' => 3.25 ), // Utsav मध्ये rebate नाही, loading आहे
			'death_pct' => 100, 'riders' => array( 'adb', 'addb', 'term', 'pwb' ),
			// v3.2: Guaranteed Surrender Value factors + loan नियम (brochure para 12–13)
			'gsv_prem' => array( array( 1, 0 ), array( 2, 30 ), array( 3, 35 ), array( 4, 50 ), array( 8, 51.48 ), array( 9, 52.96 ), array( 10, 54.44 ), array( 11, 55.93 ), array( 12, 57.41 ), array( 13, 58.89 ), array( 14, 60.37 ), array( 15, 61.85 ), array( 16, 63.33 ), array( 17, 64.81 ), array( 18, 66.30 ), array( 19, 67.78 ), array( 20, 69.26 ), array( 21, 70.74 ), array( 22, 72.22 ), array( 23, 73.70 ), array( 24, 75.19 ), array( 25, 76.67 ), array( 26, 78.15 ), array( 27, 79.63 ), array( 28, 81.11 ), array( 29, 82.59 ), array( 30, 84.07 ), array( 31, 85.56 ), array( 32, 87.04 ), array( 33, 88.52 ), array( 34, 90 ) ), 'gsv_add' => array( array( 1, 0 ), array( 3, 2 ), array( 4, 3.03 ), array( 5, 4.06 ), array( 6, 5.09 ), array( 7, 6.13 ), array( 8, 7.16 ), array( 9, 8.19 ), array( 10, 9.22 ), array( 11, 10.25 ), array( 12, 11.28 ), array( 13, 12.31 ), array( 14, 13.34 ), array( 15, 14.38 ), array( 16, 15.41 ), array( 17, 16.44 ), array( 18, 17.47 ), array( 19, 18.50 ), array( 20, 19.53 ), array( 21, 20.56 ), array( 22, 21.59 ), array( 23, 22.63 ), array( 24, 23.66 ), array( 25, 24.69 ), array( 26, 25.72 ), array( 27, 26.75 ), array( 28, 27.78 ), array( 29, 28.81 ), array( 30, 29.84 ), array( 31, 30.88 ), array( 32, 31.91 ), array( 33, 32.94 ), array( 34, 33.97 ), array( 35, 35 ) ), 'gsv_less_income' => 1, 'loan_from' => 2,
			'sample_sa' => 500000, 'samples' => array( array( 10, 5, 109575 ), array( 10, 8, 72600 ), array( 10, 12, 44250 ), array( 10, 16, 29900 ), array( 30, 5, 110150 ), array( 30, 8, 72600 ), array( 30, 12, 44275 ), array( 30, 16, 30025 ), array( 50, 5, 118625 ), array( 50, 8, 72600 ), array( 50, 12, 45225 ), array( 50, 16, 33475 ) ),
			'brochure' => $b . "1319704/Jeevan+Utsav+Sales+Brochure_141025.pdf/da84d78a-ef72-c80f-b8df-83bb7565f087",
		) ),
		'883' => array_merge( $base, array(
			'name' => 'Jeevan Utsav Single Premium (883)', 'type' => 'utsav_sp',
			'min_age' => 0, 'max_age' => 65, 'max_maturity' => 100, 'ppt_options' => range( 7, 17 ), 'maturity_age' => 100, 'survival_pct' => 10, 'ga_per_1000' => 40,
			'min_age_by_term' => array( 7 => 10, 8 => 9, 9 => 8, 10 => 7, 11 => 6, 12 => 5, 13 => 4, 14 => 3, 15 => 2, 16 => 1, 17 => 0 ),
			'min_sa' => 500000, 'sa_slabs' => array( array( 500000, 25000 ), array( 2450001, 50000 ) ),
			'rebate_bands' => array(
				array( 20, array( array( 1000000, 11 ), array( 2500000, 19 ), array( 5000000, 21 ) ) ),
				array( 40, array( array( 1000000, 9 ), array( 2500000, 15 ), array( 5000000, 18 ) ) ),
				array( 55, array( array( 1000000, 6.5 ), array( 2500000, 12 ), array( 5000000, 13 ) ) ),
				array( 65, array( array( 1000000, 5 ), array( 2500000, 9 ), array( 5000000, 10 ) ) ),
			),
			'death_sp' => array( array( 200, 1.25 ) ), 'death_pct' => 100, 'riders' => array(), 'mode_adj' => array(),
			// v3.2: GSV (brochure para 7) — पहिली 3 वर्षे 75%, नंतर 90% single premium; GA वर factor; loan GA काळात GA-period नुसार
			'gsv_prem' => array( array( 1, 75 ), array( 4, 90 ) ), 'gsv_add' => array( array( 1, 0 ), array( 3, 2 ), array( 4, 3.03 ), array( 5, 4.06 ), array( 6, 5.09 ), array( 7, 6.13 ), array( 8, 7.16 ), array( 9, 8.19 ), array( 10, 9.22 ), array( 11, 10.25 ), array( 12, 11.28 ), array( 13, 12.31 ), array( 14, 13.34 ), array( 15, 14.38 ), array( 16, 15.41 ), array( 17, 16.44 ), array( 18, 17.47 ), array( 19, 18.50 ), array( 20, 19.53 ), array( 21, 20.56 ), array( 22, 21.59 ), array( 23, 22.63 ), array( 24, 23.66 ), array( 25, 24.69 ), array( 26, 25.72 ), array( 27, 26.75 ), array( 28, 27.78 ), array( 29, 28.81 ), array( 30, 29.84 ), array( 31, 30.88 ), array( 32, 31.91 ), array( 33, 32.94 ), array( 34, 33.97 ), array( 35, 35 ) ), 'gsv_less_income' => 1, 'loan_from' => 2,
			'loan_ga_bands' => array( array( 7, 60 ), array( 11, 50 ), array( 15, 40 ) ),
			// खरी LIC quotation (Sep 2026): वय 3, GA period 14, SA 5 लाख, single premium ₹3,20,500 (riders नाहीत)
			'points' => array( '3|14' => 641.0 ), 'quotes' => array( array( 3, 14, 320500, 500000, '2026-09-12', 641.0 ) ),
			'sample_sa' => 500000, 'samples' => array( array( 10, 8, 464150 ), array( 10, 12, 361875 ), array( 10, 16, 285725 ), array( 30, 8, 464150 ), array( 30, 12, 361875 ), array( 30, 16, 286725 ), array( 50, 8, 464150 ), array( 50, 12, 361875 ), array( 50, 16, 300800 ) ),
			'brochure' => $b . "1639835/LIC_Jeevan+Utsav++Single+Premium_Sales+Brochure_English.pdf/4f48bd54-fab2-1b97-cc38-fb19dc663399",
		) ),
	);
	// ---- बंद plans (1 Oct 2024 पासून withdraw; जुन्या policyholders साठी, default बंद) ----
	$closed = array(
		'914' => array( 'New Endowment (914)', 'endowment', 8, 55, 100000, 70, array( 'terms' => range( 12, 35 ), 'srb' => 45, 'death_pct' => 100 ) ),
		'915' => array( 'New Jeevan Anand (915)', 'anand', 18, 50, 100000, 75, array( 'terms' => range( 15, 35 ), 'srb' => 45, 'fab' => 100, 'fab_min_term' => 20, 'tail_age' => 100, 'death_pct' => 125 ) ),
		'936' => array( 'Jeevan Labh (936)', 'labh', 8, 59, 100000, 75, array( 'ppt_map' => array( 16 => 10, 21 => 15, 25 => 16 ), 'srb' => 49, 'fab' => 200, 'fab_min_term' => 21, 'death_pct' => 100 ) ),
		'945' => array( 'Jeevan Umang (945)', 'umang', 1, 55, 200000, 100, array( 'ppt_options' => array( 15, 20, 25, 30 ), 'ppt_max_age_sum' => 70, 'maturity_age' => 100, 'survival_pct' => 8, 'srb' => 42, 'fab' => 300, 'fab_min_term' => 25, 'death_pct' => 100 ) ),
	);
	$uins = array( '714' => '512N277V03', '715' => '512N279V03', '733' => '512N297V03', '736' => '512N304V03', '745' => '512N312V03', '717' => '512N283V03', '771' => '512N363V02', '883' => '512N392V01', '720' => '512N280V03', '721' => '512N278V03', '732' => '512N296V03' );
	foreach ( $uins as $id => $u ) { $plans[ $id ]['uin'] = $u; }
	foreach ( $closed as $id => $c ) {
		$plans[ $id ] = array_merge( $base, array(
			'name' => $c[0] . ' - Closed', 'type' => $c[1], 'min_age' => $c[2], 'max_age' => $c[3], 'min_sa' => $c[4], 'max_maturity' => $c[5],
			'sa_slabs' => array( array( $c[4], 5000 ) ), 'rebate_slabs' => array( array( 200000, 2 ) ), 'riders' => array( 'adb' ),
			'active' => 0, 'closed' => 1, 'uin' => '', 'source' => 'Demo formula - closed plan', 'effective' => '', 'samples' => array(), 'sample_sa' => 0, 'brochure' => '',
		), $c[6] );
	}
	return $plans;
}

function a4u_lic_defaults() {
	return array(
		'rate_version' => 1,
		'updated'      => current_time( 'mysql' ),
		'settings'     => array(
			'gst'            => 0, // 22 Sept 2025 पासून individual life premium GST-free
			'modal'          => array( 'yearly' => 1, 'half' => 0.51, 'quarter' => 0.26, 'month' => 0.087 ), // फक्त mode_adj नसलेल्या plans साठी
			'rider_per_1000' => 0.5,
			'rider_addb'     => 1,
			'rider_term'     => 1.5,
			'rider_pwb_pct'  => 2,
			'rider_csv'      => '', // S1: rider,age,term,rate_per_1000
			'whatsapp'       => '919405908605',
			'links'          => "Home|https://www.advisor4u.in/\nWhatsApp|https://wa.me/919405908605",
			'retention_days' => 180,
			'faq'            => 1,
			'base_slug'      => 'lic-calculator', // S7: /lic-calculator/714/
			'hub_slug'       => 'lic-plans',      // v4: /lic-plans/ (सर्व plans + tools)
			'lead_email'     => '',
			'tg_token'       => '',
			'tg_chat'        => '',
			// v2.0 — PDF branding (IRDAI जाहिरात नियमांसाठी agent ची माहिती)
			'brand_name'     => 'Sahare Financial Services',
			'agent_name'     => 'Pankaj Digambar Sahare',
			'agent_type'     => 'Insurance Agent, Life Insurance Corporation of India',
			'agency_code'    => 'LIC0286499F',
			'agency_branch'  => '99F',
			'brand_phone'    => '9405908605',
			'brand_email'    => 'info@advisor4u.in',
			'brand_web'      => 'www.advisor4u.in',
			// v3.2: PDF advisor card (LIC report सारखा)
			'agent_title'    => 'Financial Advisor',
			'agent_address'  => '46, Bhande Plot, Umred Road, Nagpur - 440024',
			'agent_email'    => 'advisor4u.insurance@gmail.com',
			'photo_url'      => '', // रिकामं = plugin मधला फोटो
			'loan_rate'      => 9.5, // LIC policy loan व्याज % (brochure 2025-26) — loan मर्यादेसाठी
			'logo_url'       => '', // रिकामं = plugin मधला logo
			'color_gold'     => '#B8924A',
			'color_green'    => '#3F5A22',
			'sync_url'       => A4U_LIC_REPO_RAW . 'data/lic/lic-plans.json',
			'update_url'     => A4U_LIC_REPO_RAW . 'wp/a4u-lic-calculator/update.json',
			'update_channel' => 'stable', // staging site वर 'beta'
			'inflation'      => 6,        // आजच्या पैशात किंमत दाखवण्यासाठी (%)
		),
		'plans'        => a4u_lic_default_plans(),
	);
}

/* ---------- छोटे helpers: text ⇄ array (admin साठी) ---------- */

// "200000:5000, 450001:50000" ⇄ [[200000,5000],[450001,50000]] (2 किंवा 3 भाग)
function a4u_lic_pairs_to_text( $rows ) {
	return implode( ', ', array_map( function ( $r ) { return implode( ':', array_map( function ( $v ) { return 0 + $v; }, (array) $r ) ); }, (array) $rows ) );
}
function a4u_lic_text_to_pairs( $text, $parts = 2 ) {
	$out = array();
	foreach ( preg_split( '/[,\n]+/', (string) $text ) as $chunk ) {
		$bits = array_map( 'trim', explode( ':', $chunk ) );
		if ( count( $bits ) !== $parts ) { continue; }
		$ok = true;
		foreach ( $bits as $v ) { if ( ! is_numeric( $v ) ) { $ok = false; } }
		if ( $ok ) { $out[] = array_map( function ( $v ) { return 0 + $v; }, $bits ); }
	}
	usort( $out, function ( $a, $b ) { return $a[0] <=> $b[0]; } );
	return $out;
}
// जुना नाव ठेवला (v1.3 compatibility)
function a4u_lic_slabs_to_text( $s ) { return a4u_lic_pairs_to_text( $s ); }
function a4u_lic_text_to_slabs( $t ) { return array_values( array_filter( a4u_lic_text_to_pairs( $t ), function ( $r ) { return $r[1] > 0; } ) ); }

function a4u_lic_mode_to_text( $m ) {
	$out = array();
	foreach ( array( 'yearly', 'half', 'quarter', 'month' ) as $k ) { if ( isset( $m[ $k ] ) ) { $out[] = $k . ':' . ( 0 + $m[ $k ] ); } }
	return implode( ', ', $out );
}
function a4u_lic_text_to_mode( $text ) {
	$out = array();
	foreach ( preg_split( '/[,\n]+/', (string) $text ) as $chunk ) {
		if ( preg_match( '/^\s*(yearly|half|quarter|month)\s*:\s*(-?[\d.]+)\s*$/', $chunk, $m ) ) { $out[ $m[1] ] = max( -20, min( 20, (float) $m[2] ) ); }
	}
	return $out;
}

function a4u_lic_samples_to_text( $s ) {
	return implode( "\n", array_map( function ( $r ) { return implode( ',', $r ); }, (array) $s ) );
}
function a4u_lic_text_to_samples( $text ) {
	$out = array();
	foreach ( preg_split( '/\r\n|\r|\n/', (string) $text ) as $line ) {
		$c = array_map( 'trim', explode( ',', $line ) );
		if ( 3 === count( $c ) && is_numeric( $c[0] ) && is_numeric( $c[1] ) && is_numeric( $c[2] ) && (float) $c[2] > 0 ) { $out[] = array( (int) $c[0], (int) $c[1], (float) $c[2] ); }
	}
	return $out;
}

/* ---------- get / save ---------- */

function a4u_lic_data() {
	$d = get_option( A4U_LIC_OPT );
	if ( ! is_array( $d ) ) {
		$d = a4u_lic_defaults();
		add_option( A4U_LIC_OPT, $d, '', false );
	}
	return $d;
}

function a4u_lic_save( $d, $bump = true ) {
	if ( $bump ) { $d['rate_version'] = (int) ( $d['rate_version'] ?? 0 ) + 1; }
	$d['updated'] = current_time( 'mysql' );
	update_option( A4U_LIC_OPT, $d, false );
	do_action( 'litespeed_purge_all' ); // LiteSpeed cache साफ
}

function a4u_lic_rates_to_map( $rates ) {
	$m = array();
	foreach ( (array) $rates as $k => $r ) {
		if ( is_array( $r ) && count( $r ) >= 3 ) {
			$m[ (int) $r[0] . '|' . (int) $r[1] ] = (float) $r[2];
		} elseif ( is_numeric( $r ) && is_string( $k ) && false !== strpos( $k, '|' ) ) {
			$m[ $k ] = (float) $r;
		}
	}
	return $m;
}

// plan चे term / PPT / GA period पर्याय
function a4u_lic_plan_terms( $p ) {
	switch ( $p['type'] ) {
		case 'labh':
			return array_map( 'intval', array_keys( (array) ( $p['ppt_map'] ?? array() ) ) );
		case 'umang':
		case 'utsav':
		case 'utsav_sp':
			return array_map( 'intval', (array) ( $p['ppt_options'] ?? array() ) );
		default:
			return array_map( 'intval', (array) ( $p['terms'] ?? array() ) );
	}
}

// HSA rebate (Rs. per 1000 BSA) — JS मधल्या rebatePer1000 सारखंच
function a4u_lic_rebate_per_1000( $p, $sa, $age ) {
	$slabs = (array) ( $p['rebate_slabs'] ?? array() );
	if ( ! empty( $p['rebate_bands'] ) ) {
		$slabs = array();
		foreach ( (array) $p['rebate_bands'] as $b ) { if ( $age <= $b[0] ) { $slabs = $b[1]; break; } }
	}
	$r = 0;
	foreach ( $slabs as $x ) { if ( $sa >= $x[0] ) { $r = $x[1]; } }
	return (float) $r;
}

// F: खऱ्या LIC quotation वरून tabular rate (per 1000) — yearly premium = tabular × (1 + yearly adj) − HSA rebate
function a4u_lic_quote_rate( $p, $age, $sa, $yearly_premium ) {
	$single = in_array( $p['type'], array( 'single', 'utsav_sp' ), true );
	$adj    = $single ? 0 : (float) ( $p['mode_adj']['yearly'] ?? 0 );
	$rebate = a4u_lic_rebate_per_1000( $p, $sa, $age ) * $sa / 1000;
	return ( ( $yearly_premium + $rebate ) / ( 1 + $adj / 100 ) ) / ( $sa / 1000 );
}

function a4u_lic_stat_add( $event, $n = 1 ) {
	global $wpdb;
	$t = a4u_lic_table( 'stats' );
	$wpdb->query( $wpdb->prepare( "INSERT INTO {$t} (event, hits) VALUES (%s, %d) ON DUPLICATE KEY UPDATE hits = hits + %d", $event, $n, $n ) ); // phpcs:ignore
}

// S1: rider CSV "adb,30,20,0.55" → ['adb|30|20' => 0.55]
function a4u_lic_rider_map( $csv ) {
	$m = array();
	foreach ( preg_split( '/\r\n|\r|\n/', (string) $csv ) as $line ) {
		$c = array_map( 'trim', explode( ',', $line ) );
		if ( 4 === count( $c ) && in_array( $c[0], array( 'adb', 'addb', 'term', 'pwb' ), true ) && is_numeric( $c[1] ) && is_numeric( $c[2] ) && is_numeric( $c[3] ) ) {
			$m[ $c[0] . '|' . (int) $c[1] . '|' . (int) $c[2] ] = (float) $c[3];
		}
	}
	return $m;
}
