<?php
/**
 * India Dashboard - Optimized System v3
 * Includes: Retry logic, Admin cache button, OG tags, GA events,
 *           Loading skeleton, Responsive charts, WhatsApp share
 */

// 1. XML error protection
libxml_use_internal_errors(true);

/**
 * RSS fetch with 3-retry logic (S1)
 */
function fetch_rss_with_retry($url, $retries = 3, $timeout = 10) {
    for ($i = 0; $i < $retries; $i++) {
        $response = wp_remote_get($url, array('timeout' => $timeout));
        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            return $response;
        }
        // प्रत्येक retry आधी थोडी वाट बघा
        sleep(1);
    }
    return $response; // last error परत करा
}

/**
 * Dashboard data fetch + 24-hour cache
 */
function get_india_dashboard_data() {
    $cache_key = 'india_dashboard_optimized_v3';
    $cached_data = get_transient($cache_key);

    if (false !== $cached_data) {
        return $cached_data;
    }

    // Default fallback data
    $data = array(
        'core_industries_growth' => '4.5%',
        'latest_update' => date('d M Y'),
        'news_items' => array('Data feed temporarily unavailable'),
        'is_live' => false
    );

    $rss_url = 'https://www.data.gov.in/rss';
    $response = fetch_rss_with_retry($rss_url, 3, 10);

    if (!is_wp_error($response)) {
        $body = wp_remote_retrieve_body($response);
        $xml = @simplexml_load_string($body);

        if ($xml && isset($xml->channel->item)) {
            $data['latest_update'] = date('d M Y', strtotime((string)$xml->channel->item[0]->pubDate));
            $data['news_items'] = array();
            foreach (array_slice($xml->channel->item, 0, 3) as $item) {
                $data['news_items'][] = (string)$item->title;
            }
            $data['is_live'] = true;
        }
    }

    set_transient($cache_key, $data, 86400);
    return $data;
}

/**
 * Admin menu मध्ये "Clear Dashboard Cache" button जोडणे (S2)
 */
add_action('admin_menu', function() {
    add_menu_page(
        'India Dashboard',
        'India Dashboard',
        'manage_options',
        'india-dashboard-settings',
        'india_dashboard_admin_page',
        'dashicons-chart-area',
        80
    );
});

function india_dashboard_admin_page() {
    // Clear cache button दाबल्यावर
    if (isset($_POST['clear_dashboard_cache']) && check_admin_referer('clear_dashboard_nonce')) {
        delete_transient('india_dashboard_optimized_v3');
        echo '<div class="notice notice-success is-dismissible"><p>Dashboard cache cleared successfully. New data will load on next page visit.</p></div>';
    }

    $cached = get_transient('india_dashboard_optimized_v3');
    ?>
    <div class="wrap">
        <h1>India Dashboard Settings</h1>
        <p>Current cache status: <strong><?php echo $cached ? 'Active (data available)' : 'Empty (will fetch on next visit)'; ?></strong></p>
        <form method="post">
            <?php wp_nonce_field('clear_dashboard_nonce'); ?>
            <input type="submit" name="clear_dashboard_cache" class="button button-primary" value="Clear Dashboard Cache Now">
        </form>
    </div>
    <?php
}

/**
 * Open Graph meta tags for social sharing (S7)
 */
add_action('wp_head', function() {
    if (is_page('india-dashboard') || is_page_template()) {
        global $post;
        if ($post && has_shortcode($post->post_content, 'india_dashboard')) {
            echo '<meta property="og:title" content="Live India Economic Dashboard | Sahare Wealth">' . "\n";
            echo '<meta property="og:description" content="Real-time economic data from data.gov.in and MoSPI — GDP, Core Industries, Mandi Prices, and more.">' . "\n";
            echo '<meta property="og:type" content="website">' . "\n";
            echo '<meta property="og:url" content="' . esc_url(get_permalink()) . '">' . "\n";
            echo '<meta property="og:image" content="https://www.advisor4u.in/wp-content/uploads/dashboard-preview.jpg">' . "\n";
            echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        }
    }
});

/**
 * Frontend Shortcode
 */
function render_india_dashboard_shortcode() {
    $data = get_india_dashboard_data();

    $news_html = '';
    foreach ($data['news_items'] as $news) {
        $news_html .= '<li class="dash-news-item">' . esc_html($news) . '</li>';
    }

    $live_badge = $data['is_live']
        ? '<span class="dash-live-badge">🟢 Live</span>'
        : '<span class="dash-live-badge dash-offline">⚪ Cached</span>';

    $current_url = urlencode(get_permalink());
    $share_text = urlencode('Check out this Live India Economic Dashboard with real-time data from data.gov.in');

    // YoY growth rates published by PIB for the latest 13 months available
    // (September 2025–September 2026; September 2026 is provisional).
    $sector_chart_data = array(
        'labels' => array('Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26*'),
        'series' => array(
            'Overall Index' => array(3.1, 0.8, 3.5, 5.6, 5.2, 3.2, 2.9, 2.7, 3.2, 6.0, 5.0, 5.9, 7.9),
            'Coal' => array(-1.1, -8.4, 2.2, 3.7, 0.9, 1.4, -4.0, -9.0, -9.5, 1.4, 7.6, -3.8, 10.7),
            'Natural Gas' => array(-3.7, -5.2, -2.5, -4.4, -4.9, -5.0, -3.7, -4.2, -5.0, -4.8, -3.0, -4.9, -4.6),
            'Crude Oil' => array(-0.7, -0.8, -2.6, -5.1, -5.4, -4.8, -5.3, -3.2, -4.2, -4.2, -5.3, -3.6, -1.4),
            'Refinery Products' => array(-3.2, 5.3, -0.2, -0.3, 0.4, -0.4, 0.9, -0.2, -8.2, -4.0, 3.0, 5.6, 10.3),
            'Fertilizers' => array(1.7, 7.4, 5.5, 4.1, 3.7, 3.5, -24.6, -8.5, -1.0, -3.3, -8.0, -12.4, -11.7),
            'Steel' => array(14.3, 9.5, 11.6, 11.1, 13.8, 9.9, 9.6, 4.7, 5.1, 5.6, 1.9, 3.5, 4.9),
            'Cement' => array(5.1, 5.2, 15.1, 14.0, 11.3, 9.1, 4.7, 8.3, 8.4, 9.9, 12.7, 11.7, 9.8),
            'Electricity' => array(3.1, -7.0, -1.5, 6.2, 5.1, 2.3, 0.8, 5.5, 11.2, 11.4, 8.4, 13.1, 11.4),
            'Iron Ore' => array(0.8, 8.7, 19.3, 22.3, 12.8, 8.5, 33.3, 12.5, 19.0, 44.5, 29.5, 5.5, 18.4),
        ),
    );

    ob_start();
    ?>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts" defer></script>

    <!-- JSON-LD Schema for SEO -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "India Economic Dashboard",
        "description": "Live economic data from data.gov.in and MoSPI",
        "url": "<?php echo esc_url(get_permalink()); ?>",
        "provider": {
            "@type": "Organization",
            "name": "Sahare Wealth",
            "url": "https://www.advisor4u.in"
        }
    }
    </script>

    <style>
        .dash-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .dash-card {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            position: relative;
            min-height: 200px;
        }
        .dash-card h3 {
            margin-top: 0;
            color: #2c3e50;
            font-size: 1.1rem;
        }
        .dash-sector-card { grid-column: 1 / -1; }
        .dash-chart-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 12px 0 4px; }
        .dash-add-sectors-btn {
            background: #2c3e50;
            color: #fff;
            border: 0;
            border-radius: 5px;
            padding: 9px 14px;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
        }
        .dash-add-sectors-btn:hover { background: #1f2d3a; }
        .dash-add-sectors-btn:focus-visible { outline: 3px solid #85c1e9; outline-offset: 2px; }
        .dash-add-sectors-btn:disabled { cursor: wait; opacity: .65; }
        .dash-chart-note { margin: 0; color: #667085; font-size: .85rem; }
        .dash-chart-source { margin: 8px 0 0; color: #667085; font-size: .8rem; }
        .dash-chart-source a { color: #21618c; }
        .dash-stat {
            font-size: 2rem;
            font-weight: bold;
            color: #27ae60;
        }
        .dash-live-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #27ae60;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
        }
        .dash-live-badge.dash-offline { background: #95a5a6; }
        .dash-news-item {
            margin-bottom: 10px;
            padding-left: 15px;
            border-left: 3px solid #3498db;
            list-style: none;
        }
        /* Loading skeleton (S5) */
        .dash-skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: dash-skeleton-loading 1.5s infinite;
            border-radius: 4px;
            height: 20px;
            margin: 10px 0;
        }
        @keyframes dash-skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        /* Mobile responsive (S4) */
        @media (max-width: 768px) {
            .dash-container { grid-template-columns: 1fr; }
            .dash-stat { font-size: 1.5rem; }
            #sectorChart { min-height: 200px !important; }
        }
        .dash-whatsapp-btn, .dash-share-btn, .dash-pdf-btn {
            display: inline-block;
            color: white;
            padding: 12px 24px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
            margin-right: 10px;
            border: none;
            cursor: pointer;
        }
        .dash-whatsapp-btn { background: #25D366; }
        .dash-share-btn { background: #3498db; }
        .dash-pdf-btn { background: #e74c3c; }
    </style>

    <div class="dash-container">
        <!-- Stat Card -->
        <div class="dash-card">
            <?php echo $live_badge; ?>
            <h3>Core Industries Growth</h3>
            <div class="dash-stat"><?php echo esc_html($data['core_industries_growth']); ?></div>
            <p>Last Updated: <?php echo esc_html($data['latest_update']); ?></p>
        </div>

        <!-- News Card -->
        <div class="dash-card">
            <h3>Latest Data Updates</h3>
            <ul style="padding: 0;">
                <?php echo $news_html; ?>
            </ul>
        </div>

        <!-- Sector trend chart: start with the overall line and load all sectors on demand. -->
        <div class="dash-card dash-sector-card">
            <h3>Core Industries: Year-on-Year Growth</h3>
            <div class="dash-chart-controls">
                <button id="addAllSectors" class="dash-add-sectors-btn" type="button" aria-pressed="false">Add All Sectors</button>
                <p class="dash-chart-note">Add all nine industries to compare their monthly growth with the overall index.</p>
            </div>
            <div id="sectorChartSkeleton" class="dash-skeleton" style="height: 340px;"></div>
            <div id="sectorChart" style="display: none;"></div>
            <p class="dash-chart-source">Year-on-year growth (%), Sep 2025–Sep 2026. *Sep 2026 is provisional. Source: <a href="https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2326038&amp;lang=1&amp;reg=3" target="_blank" rel="noopener noreferrer">Ministry of Commerce &amp; Industry / PIB</a>.</p>
        </div>
    </div>

    <!-- Action Buttons (S6, S7, S8) -->
    <div>
        <a href="https://wa.me/919405908605?text=Hi,%20I%20saw%20the%20India%20Dashboard%20and%20need%20financial%20advice."
           class="dash-whatsapp-btn"
           target="_blank"
           onclick="trackEvent('whatsapp_click', 'dashboard')">
            💬 Get Free Consultation
        </a>
        <a href="https://wa.me/?text=<?php echo $share_text; ?>%20<?php echo $current_url; ?>"
           class="dash-share-btn"
           target="_blank"
           onclick="trackEvent('share_click', 'dashboard')">
            📤 Share on WhatsApp
        </a>
        <a href="#"
           class="dash-pdf-btn"
           onclick="trackEvent('pdf_click', 'dashboard'); alert('PDF download feature coming soon.'); return false;">
            📄 Download PDF Report
        </a>
    </div>

    <script>
        // Google Analytics event tracking (S9)
        function trackEvent(action, category) {
            if (typeof gtag === 'function') {
                gtag('event', action, {
                    'event_category': category,
                    'event_label': 'india_dashboard'
                });
            }
        }

        // ApexCharts initialization with all-industry toggle and responsive sizing.
        (function() {
            var initializeSectorChart = function() {
                var chartElement = document.getElementById('sectorChart');
                var skeleton = document.getElementById('sectorChartSkeleton');
                var addAllButton = document.getElementById('addAllSectors');

                if (!chartElement || typeof ApexCharts === 'undefined') {
                    return;
                }

                var chartData = <?php echo wp_json_encode($sector_chart_data, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
                var baseSeries = [{ name: 'Overall Index', data: chartData.series['Overall Index'] }];
                var sectorNames = Object.keys(chartData.series).filter(function(name) {
                    return name !== 'Overall Index';
                });
                var allSeries = baseSeries.concat(sectorNames.map(function(name) {
                    return { name: name, data: chartData.series[name] };
                }));
                var sectorColors = ['#27ae60', '#34495e', '#2980b9', '#8e44ad', '#d35400', '#16a085', '#c0392b', '#7f8c8d', '#f39c12', '#2c3e50'];
                var options = {
                    series: baseSeries,
                    chart: {
                        type: 'line',
                        height: 360,
                        toolbar: { show: false },
                        animations: { enabled: false },
                        redrawOnParentResize: true,
                        redrawOnWindowResize: true
                    },
                    colors: sectorColors,
                    stroke: { curve: 'straight', width: 2 },
                    markers: { size: 0, hover: { size: 4 } },
                    dataLabels: { enabled: false },
                    grid: { borderColor: '#e8edf2', strokeDashArray: 3 },
                    legend: { show: true, position: 'bottom', fontSize: '12px', itemMargin: { horizontal: 10, vertical: 4 } },
                    tooltip: {
                        shared: true,
                        intersect: false,
                        y: { formatter: function(value) { return value.toFixed(1) + '%'; } }
                    },
                    xaxis: {
                        categories: chartData.labels,
                        tickPlacement: 'on',
                        labels: { hideOverlappingLabels: true }
                    },
                    yaxis: {
                        title: { text: 'Growth (%)' },
                        labels: { formatter: function(value) { return value.toFixed(0) + '%'; } }
                    },
                    responsive: [{
                        breakpoint: 768,
                        options: {
                            chart: { height: 380 },
                            legend: { fontSize: '10px', itemMargin: { horizontal: 6, vertical: 3 } },
                            yaxis: { labels: { formatter: function(value) { return value.toFixed(0) + '%'; } } }
                        }
                    }]
                };

                var chart = new ApexCharts(chartElement, options);
                if (addAllButton) addAllButton.disabled = true;
                chart.render().then(function() {
                    if (skeleton) skeleton.style.display = 'none';
                    chartElement.style.display = 'block';
                    if (addAllButton) addAllButton.disabled = false;
                });

                if (addAllButton) {
                    var sectorsAdded = false;
                    addAllButton.addEventListener('click', function() {
                        sectorsAdded = !sectorsAdded;
                        addAllButton.disabled = true;
                        chart.updateSeries(sectorsAdded ? allSeries : baseSeries, false).then(function() {
                            addAllButton.textContent = sectorsAdded ? 'Remove All Sectors' : 'Add All Sectors';
                            addAllButton.setAttribute('aria-pressed', sectorsAdded ? 'true' : 'false');
                            addAllButton.disabled = false;
                        });
                    });
                }
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeSectorChart, { once: true });
            } else {
                initializeSectorChart();
            }
        })();
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('india_dashboard', 'render_india_dashboard_shortcode');

