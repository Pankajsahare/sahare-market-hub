/*! A4U Bond Centre v6 — advisor4u.in. ही file GitHub (assets/bond-centre/) वरून jsDelivr मार्फत load होते.
   Elementor मधल्या छोट्या loader मध्ये window.A4U_BC = {...} देऊन खालची settings बदलता येतात. */
(function(){
  var root = document.getElementById("a4u-bc");
  if(!root || root.getAttribute("data-a4u-ready")) return;   // widget दोनदा टाकला तरी एकदाच चालतं
  root.setAttribute("data-a4u-ready","1");
  var CFG = window.A4U_BC || {};
  root.innerHTML = "<div class=\"bc-banner\" id=\"bc-banner\" hidden></div>\n<header class=\"bc-hero\">\n  <h2>Bond Centre</h2>\n  <p>Government securities, Sovereign Gold Bonds and listed corporate bonds in one place, with ratings and issue details from NSDL, a yield calculator and a portfolio check. Data refreshes every trading evening.</p>\n  <div class=\"bc-status\" id=\"bc-status\"><span>Loading data…</span></div>\n</header>\n\n<div class=\"alnote\" id=\"bc-alnote\" hidden></div>\n<nav class=\"bc-tabs\" role=\"tablist\" aria-label=\"Bond Centre sections\">\n  <button class=\"bc-tab\" role=\"tab\" aria-selected=\"true\" data-tab=\"gov\">Govt &amp; Gold</button>\n  <button class=\"bc-tab\" role=\"tab\" aria-selected=\"false\" data-tab=\"corp\">Corporate bonds</button>\n  <button class=\"bc-tab\" role=\"tab\" aria-selected=\"false\" data-tab=\"cmp\">Compare <span id=\"bc-cc\"></span></button>\n  <button class=\"bc-tab\" role=\"tab\" aria-selected=\"false\" data-tab=\"calc\">Yield calculator</button>\n  <button class=\"bc-tab\" role=\"tab\" aria-selected=\"false\" data-tab=\"plan\">Income planner</button>\n  <button class=\"bc-tab\" role=\"tab\" aria-selected=\"false\" data-tab=\"pf\">My portfolio</button>\n</nav>\n\n<!-- GOVT -->\n<section class=\"bc-panel on\" id=\"bc-gov\" role=\"tabpanel\">\n  <div class=\"kpis thin\" id=\"r-kpis\"></div>\n  <p class=\"bc-intro\">Exchange-traded Government Securities (G-Secs) and Sovereign Gold Bonds (SGBs). Choose how long you plan to hold; the list shows which bonds mature around then.</p>\n  <div class=\"bc-filters\">\n    <label>Holding period<select id=\"g-h\"><option value=\"1-3\">1–3 years</option><option value=\"3-5\" selected>3–5 years</option><option value=\"5-10\">5–10 years</option><option value=\"10-99\">10+ years</option></select></label>\n    <label>Type<select id=\"g-t\"><option value=\"\">All</option><option value=\"G-Sec\">G-Secs</option><option value=\"SGB\">Sovereign Gold Bonds</option></select></label>\n    <label>Sort by<select id=\"g-s\"><option value=\"fit\">Best fit first</option><option value=\"yield\">Yield (high to low)</option><option value=\"mat\">Maturity (soonest)</option></select></label>\n  </div>\n  <div class=\"bc-toolbar\"><button type=\"button\" class=\"linkbtn\" id=\"g-reset\">Reset to default</button></div>\n  <div id=\"g-list\"><div class=\"sk\" aria-hidden=\"true\"><i></i><i></i><i></i><i></i><i></i><i></i></div><span class=\"sr\">Loading bonds…</span></div>\n  <h3 class=\"sec-h\">Interest rates &amp; the G-Sec curve</h3>\n  <div class=\"box\"><h3>G-Sec yield curve</h3><p class=\"muted\" id=\"r-curve-sub\"></p><div class=\"chart\" id=\"r-curve\"></div><div class=\"tw\" style=\"margin-top:.8rem\"><table id=\"r-curve-tbl\"></table></div></div>\n  <div class=\"box\"><h3>What if yields move?</h3>\n    <p class=\"muted\">An illustration of how a bond's 12-month return changes if yields shift, using par G-Secs at today's curve. Return = one year of yield + price change. It is not a forecast.</p>\n    <div class=\"seg\" id=\"r-seg\" role=\"group\" aria-label=\"Yield shift\"></div>\n    <div class=\"tw\"><table id=\"r-scen\"></table></div>\n    <p class=\"muted\" style=\"margin-top:.5rem\">Breakeven = how many basis points yields can rise over a year before the price fall cancels a year of interest. Longer bonds move more.</p>\n  </div>\n</section>\n\n<!-- CORPORATE -->\n<section class=\"bc-panel\" id=\"bc-corp\" role=\"tabpanel\">\n  <p class=\"bc-intro\">Listed corporate bonds and NCDs that traded on BSE or NSE in the last 30 days. Ratings, security, interest dates and documents come from NSDL India Bond Info. Tick up to 3 bonds to compare.</p>\n  <div class=\"stats\" id=\"c-stats\" hidden></div>\n  <div class=\"colls\" id=\"c-colls\" role=\"group\" aria-label=\"Quick collections\"></div>\n  <div class=\"bc-filters\">\n    <label class=\"wide\">Search issuer or ISIN<span class=\"qwrap\"><input id=\"f-q\" type=\"text\" inputmode=\"search\" enterkeyhint=\"search\" autocomplete=\"off\" placeholder=\"e.g. REC, Tata Capital or INE…\"><button type=\"button\" class=\"qx\" id=\"f-qx\" aria-label=\"Clear search\" title=\"Clear\" hidden>×</button><button type=\"button\" class=\"qp\" id=\"f-qp\" title=\"Paste from clipboard\" aria-label=\"Paste\"><svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M19 3h-4.2A3 3 0 0 0 12 1a3 3 0 0 0-2.8 2H5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 17H5V5h2v3h10V5h2v15z\"/></svg></button></span></label>\n    <label>Credit rating<select id=\"f-r\"><option value=\"\">All</option><option value=\"AAA\">AAA</option><option value=\"AA\">AA (AA+, AA, AA-)</option><option value=\"A\">A (A+, A, A-)</option><option value=\"BBB\">BBB</option><option value=\"BB\">BB and below</option><option value=\"NR\">Unrated / not yet checked</option></select></label>\n    <label>Maturity<select id=\"f-m\"><option value=\"\">Any</option><option value=\"1\">Within 1 year</option><option value=\"3\">Within 3 years</option><option value=\"5\">Within 5 years</option><option value=\"99\">More than 5 years</option></select></label>\n    <label>Minimum yield (%)<input id=\"f-y\" type=\"number\" step=\"0.1\" min=\"0\" placeholder=\"e.g. 8\"></label>\n  </div>\n  <div class=\"bc-filters bc-more\" id=\"f-more\">\n    <label>Maximum yield (%)<input id=\"f-ym\" type=\"number\" step=\"0.1\" min=\"0\" placeholder=\"e.g. 12\"></label>\n    <label>Issuer type<select id=\"f-o\"><option value=\"\">Any</option><option value=\"psu\">PSU / government-owned</option><option value=\"pvt\">Non-PSU</option></select></label>\n    <label>Security<select id=\"f-sec\"><option value=\"\">Any</option><option value=\"1\">Secured only</option><option value=\"0\">Unsecured only</option></select></label>\n    <label>Tax status<select id=\"f-t\"><option value=\"\">Any</option><option value=\"free\">Tax-free bonds</option><option value=\"tax\">Taxable bonds</option></select></label>\n    <label>Interest paid<select id=\"f-p\"><option value=\"\">Any</option><option value=\"12\">Monthly</option><option value=\"4\">Quarterly</option><option value=\"2\">Half-yearly</option><option value=\"1\">Yearly</option><option value=\"0\">At maturity</option></select></label>\n    <label>Price vs ₹100<select id=\"f-pr\"><option value=\"\">Any</option><option value=\"disc\">Discount (below 99.50)</option><option value=\"par\">Around par (99.50–100.50)</option><option value=\"prem\">Premium (above 100.50)</option></select></label>\n    <label>Last traded<select id=\"f-d\"><option value=\"\">Last 30 days</option><option value=\"0\">Latest trading day</option><option value=\"7\">Within 7 days</option></select></label>\n  </div>\n  <div class=\"bc-toolbar\">\n    <button type=\"button\" class=\"linkbtn\" id=\"f-morebtn\" aria-expanded=\"false\" aria-controls=\"f-more\">More filters</button>\n    <button type=\"button\" class=\"linkbtn\" id=\"f-reset\">Reset to default</button>\n    <label class=\"chk\"><input type=\"checkbox\" id=\"f-risk\" checked> Hide bonds with risk flags</label>\n    <label class=\"chk\"><input type=\"checkbox\" id=\"f-call\"> Hide callable &amp; perpetual</label>\n    <label class=\"sort\">Sort by<select id=\"f-s\">\n      <option value=\"turnover|-1\">Most traded</option><option value=\"ytm|-1\">Yield (high to low)</option><option value=\"spread|-1\">Extra yield over G-Sec</option><option value=\"rating|1\">Rating (best first)</option>\n      <option value=\"maturity|1\">Maturity (soonest)</option><option value=\"coupon|-1\">Coupon (high to low)</option><option value=\"price|1\">Price (deepest discount first)</option><option value=\"price|-1\">Price (highest premium first)</option><option value=\"issuer|1\">Issuer (A–Z)</option><option value=\"tradeDate|-1\">Last traded (latest)</option></select></label>\n  </div>\n  <details class=\"myal\" id=\"c-my\" hidden><summary id=\"c-my-s\"></summary><div id=\"c-my-b\"></div></details>\n  <div class=\"bc-count\" id=\"c-count\" aria-live=\"polite\"></div>\n  <div class=\"bc-msg\" id=\"c-msg\" aria-live=\"polite\"></div>\n  <div id=\"c-list\"><div class=\"sk\" aria-hidden=\"true\"><i></i><i></i><i></i><i></i><i></i><i></i></div><span class=\"sr\">Loading bonds…</span></div>\n  <button type=\"button\" class=\"btn showmore\" id=\"c-more\" hidden></button>\n  <p class=\"muted\" style=\"margin-top:.8rem\">Risk flags: unrated, negative outlook, rating watch, issuer not cooperating, rating withdrawn, default or restructuring reported, perpetual, or yield above 14%. A very high yield usually means higher risk.</p>\n  <h3 class=\"sec-h\">More for decisions</h3>\n  <details class=\"more\" id=\"m-fd\"><summary>Bonds vs bank FDs <span>— how today's yields compare with FD rates</span></summary><div class=\"box\" id=\"r-fd\"></div></details>\n  <details class=\"more\" id=\"m-act\"><summary>New issues &amp; maturing soon <span>— as reported to NSDL</span></summary><div class=\"two\">\n    <div class=\"box\"><h3>New bond issues</h3><p class=\"muted\">Recently allotted, as reported to NSDL.</p><div class=\"tw\" style=\"margin-top:.6rem\"><table id=\"r-new\"></table></div></div>\n    <div class=\"box\"><h3>Maturing soon</h3><p class=\"muted\">Bonds due for redemption shortly, as reported to NSDL.</p><div class=\"tw\" style=\"margin-top:.6rem\"><table id=\"r-due\"></table></div></div>\n  </div></details>\n  <details class=\"more\" id=\"m-mkt\"><summary>Corporate bond market at a glance <span>— size and activity</span></summary><div class=\"box\" id=\"r-mkt\"></div></details>\n</section>\n\n<!-- COMPARE -->\n<section class=\"bc-panel\" id=\"bc-cmp\" role=\"tabpanel\"><div class=\"tgl cmpgoal\" id=\"cmp-goal\" role=\"group\" aria-label=\"What matters most\"><span class=\"lbl\">What matters most to you?</span><button type=\"button\" data-goal=\"bal\" aria-pressed=\"true\">Balanced</button><button type=\"button\" data-goal=\"safe\" aria-pressed=\"false\">Safety first</button><button type=\"button\" data-goal=\"inc\" aria-pressed=\"false\">Higher income</button><button type=\"button\" data-goal=\"liq\" aria-pressed=\"false\">Easy to sell</button></div><div id=\"cmp-body\"></div></section>\n\n<!-- CALCULATOR -->\n<section class=\"bc-panel\" id=\"bc-calc\" role=\"tabpanel\">\n  <p class=\"bc-intro\">Estimate the yield to maturity and the income from a bond. Pick a corporate bond to fill the form, or enter your own numbers.</p>\n  <div class=\"calc\">\n    <div class=\"form\">\n      <div class=\"full\"><div class=\"muted\" style=\"font-weight:600;font-size:.8rem;margin-bottom:.3rem\">What do you want to work out?</div><div class=\"kmode\"><div class=\"tgl\" role=\"group\" aria-label=\"Calculator mode\"><button type=\"button\" data-cm=\"p2y\" aria-pressed=\"true\">Yield from price</button><button type=\"button\" data-cm=\"y2p\" aria-pressed=\"false\">Price from yield</button></div><button type=\"button\" class=\"ic rst\" id=\"k-reset\" title=\"Reset to the bond's values\" aria-label=\"Reset\">↺</button></div><p class=\"klock\" id=\"k-lock\" hidden>🔒 Filled from the selected bond. Only the fields that are open can be changed. Choose “Enter manually” to edit everything.</p></div>\n      <label class=\"full\">Find a corporate bond by ISIN or name<span class=\"qwrap\"><input id=\"k-find\" type=\"text\" list=\"k-list\" inputmode=\"search\" autocomplete=\"off\" placeholder=\"Paste an ISIN (e.g. INE556F08LJ5) or type a name\"><button type=\"button\" class=\"qx\" id=\"k-qx\" aria-label=\"Clear\" title=\"Clear\" hidden>×</button><button type=\"button\" class=\"qp\" id=\"k-qp\" title=\"Paste from clipboard\" aria-label=\"Paste\"><svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M19 3h-4.2A3 3 0 0 0 12 1a3 3 0 0 0-2.8 2H5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 17H5V5h2v3h10V5h2v15z\"/></svg></button></span></label><datalist id=\"k-list\"></datalist><div class=\"bc-msg full\" id=\"k-msg\" aria-live=\"polite\"></div>\n      <label class=\"full\">Or pick from the list<select id=\"k-pick\"><option value=\"\">Enter manually</option></select></label>\n      <label>Face value per bond (₹)<input id=\"k-face\" type=\"number\" value=\"100000\" min=\"1\"></label>\n      <label id=\"k-price-l\">Buy price (per ₹100 of face)<input id=\"k-price\" type=\"number\" value=\"100\" min=\"1\" step=\"0.01\"></label>\n      <label id=\"k-yld-l\" hidden>Yield you want to quote (%)<input id=\"k-yld\" type=\"number\" value=\"9\" min=\"0\" step=\"0.01\"></label>\n      <label>Coupon rate (% a year)<input id=\"k-cpn\" type=\"number\" value=\"9\" step=\"0.01\" min=\"0\"></label>\n      <label>Interest paid<select id=\"k-freq\"><option value=\"1\">Yearly</option><option value=\"2\">Half-yearly</option><option value=\"4\">Quarterly</option><option value=\"12\">Monthly</option><option value=\"0\">At maturity (cumulative)</option></select></label>\n      <label>Maturity date<input id=\"k-mat\" type=\"date\"></label>\n      <label>Number of bonds<input id=\"k-qty\" type=\"number\" value=\"1\" min=\"1\" step=\"1\"></label>\n      <label class=\"full\">Tax on interest (%) — optional<input id=\"k-tax\" type=\"number\" value=\"0\" min=\"0\" max=\"50\" step=\"1\"></label>\n    </div>\n    <div class=\"res\" aria-live=\"polite\">\n      <div class=\"cap\" id=\"k-cap\">Yield to maturity (estimate)</div>\n      <div class=\"big num\" id=\"k-ytm\">–</div>\n      <dl class=\"num\">\n        <dt id=\"k-alt-l\">Price per ₹100</dt><dd id=\"k-alt\">–</dd>\n        <dt>Current yield</dt><dd id=\"k-cy\">–</dd>\n        <dt>Amount invested</dt><dd id=\"k-inv\">–</dd>\n        <dt>Interest per year</dt><dd id=\"k-int\">–</dd>\n        <dt>Total interest to maturity</dt><dd id=\"k-tot\">–</dd>\n        <dt>Face value returned</dt><dd id=\"k-ret\">–</dd>\n        <dt>Total gain (after tax if entered)</dt><dd id=\"k-gain\">–</dd>\n      </dl>\n      <div class=\"flows\" id=\"k-flows\" aria-hidden=\"true\"></div>\n      <div class=\"note\" id=\"k-note\" hidden></div>\n      <div class=\"cap\" style=\"margin-top:.7rem;font-size:.75rem\">Estimate only. Assumes every payment arrives on time and the bond is held to maturity. Ignores brokerage, accrued-interest timing and call/put options.</div>\n    </div>\n  </div>\n</section>\n\n<!-- INCOME PLANNER -->\n<section class=\"bc-panel\" id=\"bc-plan\" role=\"tabpanel\">\n  <p class=\"bc-intro\">See how a mix of listed bonds that pay interest in different months could add up to a regular monthly income. The tool only does the arithmetic on today's prices and NSDL payout schedules.</p>\n  <div class=\"warnbox\"><b>This is an illustration, not a recommendation or a portfolio.</b> Bonds are picked by simple rules (rating, maturity, spread of payout months, yield). Prices change daily, issuers can default, and some bonds are hard to sell. Please talk to us and a SEBI-registered investment adviser before acting on it.</div>\n  <div class=\"tgl\" role=\"group\" aria-label=\"Planner mode\" style=\"margin-bottom:.8rem\"><button type=\"button\" data-plm=\"inc\" aria-pressed=\"true\">Monthly income</button><button type=\"button\" data-plm=\"lad\" aria-pressed=\"false\">Bond ladder</button></div>\n  <p class=\"muted\" id=\"pl-help\" style=\"margin-bottom:.6rem\">Picks bonds that pay in different months so the interest adds up to a steady monthly amount.</p>\n  <div class=\"bc-filters\">\n    <label data-pl=\"inc\">Monthly income wanted (₹)<input id=\"pl-t\" type=\"number\" min=\"1000\" step=\"1000\" value=\"10000\"></label>\n    <label data-pl=\"lad\" hidden>Amount to invest (₹)<input id=\"pl-amt\" type=\"number\" min=\"50000\" step=\"10000\" value=\"1000000\"></label>\n    <label data-pl=\"lad\" hidden>Ladder length<select id=\"pl-rungs\"><option value=\"3\">3 years (1 bond a year)</option><option value=\"5\" selected>5 years (1 bond a year)</option><option value=\"7\">7 years (1 bond a year)</option></select></label>\n    <label>Minimum rating<select id=\"pl-r\"><option value=\"0\">AAA only</option><option value=\"3\" selected>AA- and above</option><option value=\"6\">A- and above</option></select></label>\n    <label data-pl=\"inc\">Maturity up to<select id=\"pl-y\"><option value=\"3\">3 years</option><option value=\"5\" selected>5 years</option><option value=\"10\">10 years</option></select></label>\n    <label data-pl=\"inc\">Number of bonds<select id=\"pl-n\"><option>3</option><option selected>4</option><option>5</option></select></label>\n  </div>\n  <div class=\"bc-toolbar\"><label class=\"chk\"><input type=\"checkbox\" id=\"pl-sec\"> Secured bonds only</label><label class=\"chk\"><input type=\"checkbox\" id=\"pl-psu\"> PSU issuers only</label><button type=\"button\" class=\"btn solid\" id=\"pl-go\">Show the mix</button><button type=\"button\" class=\"linkbtn\" id=\"pl-reset\">Reset to default</button></div>\n  <div id=\"pl-out\"></div>\n</section>\n\n<!-- RATES -->\n\n\n<!-- PORTFOLIO -->\n<section class=\"bc-panel\" id=\"bc-pf\" role=\"tabpanel\">\n  <p class=\"bc-intro\">Check your own bond holdings. Upload a CSV file; everything is calculated in your browser and nothing is uploaded or stored. (From Excel: File → Save As → CSV.)</p>\n  <div class=\"drop\" id=\"p-drop\">\n    <div><b>Drop a CSV file here</b> or choose one<div class=\"muted\">Columns: name, coupon, maturity, face, price (optional: frequency, type). Price = what you would pay per ₹100, including accrued interest.</div></div>\n    <div class=\"acts\"><label class=\"btn solid\" for=\"p-file\" style=\"flex-direction:row;color:#fff\">Choose CSV</label><input type=\"file\" id=\"p-file\" accept=\".csv,text/csv\">\n      <button type=\"button\" class=\"btn\" id=\"p-dl\">Download sample CSV</button></div>\n  </div>\n  <div class=\"callout\" id=\"p-banner\">Showing example holdings so you can see the layout. Upload your file to replace them.</div>\n  <div class=\"bc-msg\" id=\"p-err\" role=\"alert\"></div>\n  <label style=\"flex-direction:row;align-items:center;gap:.6rem;max-width:320px\">Valuation date<input id=\"p-asof\" type=\"date\"></label>\n  <div class=\"tiles\" id=\"p-tiles\"></div>\n  <div class=\"two\">\n    <div class=\"box\"><h3>If yields move by…</h3><div class=\"tw\" style=\"margin-top:.5rem\"><table id=\"p-shock\"></table></div><p class=\"muted\" style=\"margin-top:.4rem\">12-month outcome = one year of yield income + price change.</p></div>\n    <div class=\"box\"><h3>Where your money sits</h3><h4 style=\"margin:.5rem 0 .2rem!important\">By time to maturity</h4><div id=\"p-buckets\"></div><h4 style=\"margin:.8rem 0 .2rem!important\">By type</h4><div id=\"p-types\"></div></div>\n  </div>\n  <div class=\"box\"><h3>Holdings</h3><div class=\"tw\" style=\"margin-top:.5rem\"><table id=\"p-hold\"></table></div><pre id=\"p-sampletxt\" hidden></pre></div>\n</section>\n\n<section class=\"band\" id=\"bc-band\">\n  <div class=\"band-l\">\n    <h2>Ready to invest in bonds?</h2>\n    <p>Open a bond account with our partner platform, or message us on WhatsApp with a bond name or ISIN and our team will get back to you.</p>\n    <div class=\"band-acts\"><a class=\"cta-btn\" id=\"bc-cta\" href=\"https://www.bondbazaar.com/open-trading-account?param=UlBTMDk=\" target=\"_blank\" rel=\"noopener sponsored\">Open your bond account</a><a class=\"wa big\" id=\"bc-wa\" href=\"#\" target=\"_blank\" rel=\"noopener\"></a></div>\n  </div>\n  <p class=\"small\">We are an authorised partner of Bondbazaar Securities Private Limited and may receive a fee if you open an account or invest through this link.</p>\n</section>\n\n<section class=\"faq\" id=\"bc-learn\">\n  <h2 style=\"margin-bottom:.2rem!important\">Learn about bonds</h2>\n  <p class=\"muted\">Short answers to the questions investors ask us most. <a id=\"bc-cat-link\" href=\"#\" hidden>Browse bonds by type →</a></p>\n  <div class=\"learn\" id=\"bc-learn-cards\"></div>\n  <div id=\"bc-vids\"></div>\n</section>\n\n<section class=\"faq\" id=\"bc-faqs\">\n  <h2 style=\"margin-bottom:.6rem!important\">Frequently asked questions</h2>\n  <div class=\"faq-groups\" id=\"bc-faq\"></div>\n</section>\n\n\n<div class=\"disc\">\n  <p><strong>Disclaimer:</strong> This page is for information and education only. It is not investment advice or a recommendation to buy, sell or hold any security. Prices are from the latest BSE/NSE trade reports and may be old for rarely traded bonds; yields marked “~” are estimated here. Ratings and issue details are as reported on NSDL India Bond Info and may lag the rating agencies — always check the latest rating rationale and the offer document. Bonds carry credit, interest-rate, liquidity and, for SGBs, gold-price risk. Please consult a SEBI-registered investment adviser before investing.</p>\n  <p id=\"bc-arn\">Sahare Financial Services is an AMFI-registered Mutual Fund Distributor (ARN-XXXXX).</p>\n  <p id=\"bc-src\"></p>\n</div>\n\n<a class=\"mbar\" id=\"bc-mbar\" href=\"#\" target=\"_blank\" rel=\"noopener\" hidden></a>\n\n<div class=\"md-back\" id=\"md\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"md-title\"><div class=\"md\" id=\"md-box\"></div></div>\n\n<script type=\"application/ld+json\" id=\"bc-ld\"><\/script>";
  /* ================= SETTINGS (loader मधून बदलता येतात) ================= */
  var ASSETS = CFG.assets || "https://cdn.jsdelivr.net/gh/Pankajsahare/sahare-market-hub@main/assets/bond-centre/";
  var DATA = CFG.data || "https://raw.githubusercontent.com/Pankajsahare/sahare-market-hub/main/data/"; // GitHub data folder
  var WA_NUMBER = CFG.wa || "919405908605";      // WhatsApp: देश-कोडसह, + किंवा space नको
  var ARN_DEFAULT = "Sahare Wealth is an AMFI-registered Mutual Fund Distributor (ARN-151469).";   // साईटच्या footer प्रमाणे
  var ARN_TEXT = (CFG.arn && CFG.arn.indexOf("XXXXX")<0) ? CFG.arn : ARN_DEFAULT;   // loader मध्ये ARN भरला नसेल तर हाच दिसतो
  var BRAND = "Sahare Financial Services";     // PDF वरचं नाव — TODO: अधिकृत नाव तपासा
  var BRAND_LINE = "www.advisor4u.in  |  WhatsApp +91 94059 08605  |  info@advisor4u.in";
  var BOND_PAGE_BASE = "https://www.advisor4u.in/bond/"; // SEO bond पानं (PHP snippet) — "" ठेवलं तर link दिसणार नाही
  var TDS_RATE = 10;
  var STAMP_DUTY = 0.0001;              // % — debenture खरेदी (transfer) वर stamp duty, Indian Stamp Act (1 Jul 2020 पासून)
  var SETTLE_DAYS = 1;                  // T+1 settlement (accrued interest या तारखेपर्यंत)
  // TODO [FD दर — महिन्यातून एकदा तपासा]: सामान्य ग्राहक, % p.a.
  var FD_RATES = { asOf: "May 2026", source: "Zee Business compilation of bank websites",
    banks: [["SBI",6.25,6.30,6.05],["HDFC Bank",6.25,6.45,6.40],["ICICI Bank",6.25,6.45,6.50],["Bank of Baroda",6.10,6.25,6.30],["PNB",6.25,6.30,6.10]] };                    // Post-TDS: व्याजावर % (बदलता येतो)
  var LOGO = null;   // PDF बनवतानाच logo.png आणतो (पान हलकं राहतं)
  // Small finance banks (DICGC विमा ₹5 लाखांपर्यंत) — TODO: महिन्यातून एकदा तपासा, हवे तर आणखी bank जोडा ["नाव",1yr,3yr,5yr]
  FD_RATES.sfb = { asOf: "28 Oct 2026", source: "Paisabazaar",
    banks: [["Suryoday Small Finance Bank",7.25,7.25,8.25]] };
  var CAT_PAGE_BASE = "https://www.advisor4u.in/bonds/";  // SEO "bond प्रकार" पानं (PHP snippet) — "" ठेवलं तर link दिसणार नाही
  // TODO [YouTube]: तुमच्या bond-विषयक videos चे ID टाका — youtube.com/watch?v=XXXXXXXXXXX मधला XXXXXXXXXXX
  var VIDEOS = { channel: CFG.channel || "https://www.youtube.com/@pankajsahare8571", list: CFG.videos || [] };
  // Campaign banner: text रिकामा ठेवला तर दिसणार नाही; "until" तारखेनंतर आपोआप लपतो (YYYY-MM-DD)
  var BANNER = CFG.banner || { text: "", link: "", linkText: "Know more", until: "" };   // उदा. text:"New PSU bond issue open till 20 Nov", until:"2026-11-20"
  var PAGE = 40;                        // corporate bonds प्रति पान
  var HIGH_YIELD = 14;
  /* =============================================================== */

  if(CFG.fd) FD_RATES = CFG.fd;
  /* साईटचा fixed header (आणि admin bar) किती उंच आहे ते मोजतो → tabs त्याच्या खाली चिकटतात, popup header खाली जात नाही */
  var FX=null, fxAt=0;
  function fixedEls(){   // साईटचे fixed/sticky पट्टे (header, admin bar, bottom nav) — 3 सेकंदांनी एकदाच पुन्हा शोधतो
    if(FX&&Date.now()-fxAt<3000) return FX; FX=[]; fxAt=Date.now();
    document.querySelectorAll("body > *, body > * > *, body > * > * > *").forEach(function(e){
      if(root.contains(e)||e===root) return; var st=getComputedStyle(e); if(st.position==="fixed"||st.position==="sticky") FX.push(e);
    }); return FX;
  }
  function edgeFixed(edge){
    var L=[]; fixedEls().forEach(function(e){
      var st=getComputedStyle(e); if(st.display==="none"||st.visibility==="hidden"||+st.opacity===0) return;
      var r=e.getBoundingClientRect(); if(r.width<innerWidth*0.6||r.height<8||r.height>innerHeight*0.4||r.bottom<=0||r.top>=innerHeight) return;
      L.push(edge==="top"?[Math.max(0,r.top),r.bottom]:[innerHeight-r.bottom,innerHeight-r.top]);
    });
    // admin bar + त्याखालचा header असे एकावर एक असले तरी एकूण उंची मोजतो
    L.sort(function(a,b){return a[0]-b[0];}); var m=0; L.forEach(function(x){ if(x[0]<=m+2) m=Math.max(m,x[1]); });
    return Math.round(m);
  }
  function bottomInset(){ return edgeFixed("bottom"); }
  function siteWa(){   // साईटची स्वतःची खाली चिकटलेली पट्टी (bottom nav) आणि त्यात WhatsApp आहे का
    FX=null; return fixedEls().some(function(e){ var r=e.getBoundingClientRect(), st=getComputedStyle(e);
      return st.display!=="none" && r.bottom>=innerHeight-2 && r.width>=innerWidth*0.6 && r.height<innerHeight*0.4 && !!e.querySelector('a[href*="wa.me"],a[href*="whatsapp"]'); });
  }
  function syncTop(){ root.style.setProperty("--bc-top",edgeFixed("top")+"px"); var tb=root.querySelector(".bc-tabs"); if(tb) root.style.setProperty("--bc-tabs-h",tb.offsetHeight+"px"); }
  var $ = function(id){ return document.getElementById(id); };
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
  function n2(v,d){ return (typeof v==="number"&&isFinite(v)) ? v.toLocaleString("en-IN",{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d}) : "–"; }
  function pct(v){ return (typeof v==="number"&&isFinite(v)) ? v.toFixed(2)+"%" : "–"; }
  function inr(v){ return (typeof v==="number"&&isFinite(v)) ? "₹"+Math.round(v).toLocaleString("en-IN") : "–"; }
  var today = new Date(); today.setHours(0,0,0,0);
  function yrs(s){ return s ? (new Date(s+"T00:00:00")-today)/(365.25*864e5) : NaN; }
  function fd(s){ if(!s) return "–"; var d=new Date(s+"T00:00:00"); return isNaN(d)?"–":d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
  function track(name,params){ try{ window.dataLayer=window.dataLayer||[]; var o={event:name}; for(var k in (params||{})) o[k]=params[k]; window.dataLayer.push(o); if(typeof window.gtag==="function") window.gtag("event",name,params||{}); }catch(e){} }
  var WA_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3z"/></svg>';
  function waUrl(t){ return "https://wa.me/"+WA_NUMBER+"?text="+encodeURIComponent(t); }
  function waLink(text,label,id){ return '<a class="wa" href="'+esc(waUrl(text))+'" target="_blank" rel="noopener" data-wa="'+esc(id||"")+'" title="'+esc(label)+'">'+WA_ICON+'<span class="wa-t">'+esc(label)+'</span></a>'; }

  var S = { gov:null, corp:null, mkt:null, picked:[], shown:PAGE, sortKey:"turnover", sortDir:-1, open:{} };
  var mq = window.matchMedia ? window.matchMedia("(max-width:760px)") : {matches:false};

  /* ---------------- tabs ---------------- */
  function showTab(t,push){
    root.querySelectorAll(".bc-tab").forEach(function(b){ b.setAttribute("aria-selected", b.getAttribute("data-tab")===t); });
    root.querySelectorAll(".bc-panel").forEach(function(p){ p.classList.toggle("on", p.id==="bc-"+t); });
    if(t==="cmp"){ renderCompare(); if(S.corp&&!S.corp.full) loadDetails().then(renderCompare); }
    curTab=t;
    if(push && history.replaceState){ var fq=(t==="corp"&&hashReady)?filterQuery():""; history.replaceState(null,"","#bonds-"+t+(fq?"?"+fq:"")); }
    track("bond_tab",{tab:t});
  }
  root.querySelectorAll(".bc-tab").forEach(function(b){ b.addEventListener("click",function(){ showTab(b.getAttribute("data-tab"),true); }); });

  /* ================= GOVT & GOLD ================= */
  function renderGov(){
    var el=$("g-list"), d=S.gov;
    if(!d||!d.bonds){ el.innerHTML='<p class="muted">Government bond data could not be loaded right now. Please refresh the page.</p>'; return; }
    var hz=$("g-h").value.split("-").map(Number), type=$("g-t").value, sort=$("g-s").value;
    var rows=d.bonds.map(function(b){
      var y=yrs(b.maturity_date), fit;
      if(y>=hz[0]-0.5 && y<=hz[1]+0.5) fit={c:"m",t:"Matures within your holding period"};
      else fit={c:"p",t:y<hz[0]-0.5?"Matures earlier than your holding period":"Matures later; selling early depends on market price"};
      return {b:b,y:y,fit:fit};
    }).filter(function(r){ return r.y>0 && (!type||r.b.type===type); });
    rows.sort(function(a,b){
      if(sort==="yield") return (b.b.yield||0)-(a.b.yield||0);
      if(sort==="mat") return a.y-b.y;
      return (a.fit.c==="m"?0:1)-(b.fit.c==="m"?0:1) || (b.b.yield||0)-(a.b.yield||0);
    });
    if(!rows.length){ el.innerHTML='<p class="muted">No bonds for this choice.</p>'; return; }
    function chg(b){ return typeof b.change==="number"&&b.price!=null ? '<span class="'+(b.change>=0?"cg":"cr")+'">'+(b.change>=0?"▲ ":"▼ ")+n2(Math.abs(b.change))+"%</span>" : "–"; }
    function tag(b){ return b.stale?'<span class="tag w">Delayed price</span>':(b.source!=="live"?'<span class="tag w">Not live</span>':""); }
    function wa(b){ return waLink("Hello Sahare Wealth, I would like to know more about "+b.name+". Please contact me.","Ask on WhatsApp",b.id); }
    if(mq.matches){
      el.innerHTML='<div class="cards">'+rows.map(function(r){ var b=r.b;
        return '<div class="card"><div class="top"><span class="pill">'+esc(b.type)+'</span><span class="fit '+r.fit.c+'">'+esc(r.fit.t)+'</span></div><h4>'+esc(b.name)+'</h4>'+
        '<div class="yl"><b class="num">'+(typeof b.yield==="number"?pct(b.yield):"–")+'</b><span>'+esc(b.yield_note||"yield")+'</span></div>'+
        '<dl class="kv"><div><dt>Price</dt><dd class="num">₹'+n2(b.price)+'</dd></div><div><dt>Day change</dt><dd>'+chg(b)+'</dd></div><div><dt>Matures</dt><dd>'+fd(b.maturity_date)+'</dd></div><div><dt>Years left</dt><dd class="num">'+n2(r.y,1)+'</dd></div></dl>'+
        '<div class="tags">'+tag(b)+'</div><div class="acts" style="margin-top:.6rem">'+wa(b)+'</div></div>'; }).join("")+'</div>';
    } else {
      el.innerHTML='<div class="tw"><table><thead><tr><th>Bond</th><th class="r">Price</th><th class="r">Yield</th><th class="r">Day change</th><th>Maturity</th><th>Holding-period fit</th><th></th></tr></thead><tbody>'+
      rows.map(function(r){ var b=r.b; return '<tr class="plain"><td class="iss">'+esc(b.name)+'<span class="isin">'+esc(b.type)+(b.isin?' · '+esc(b.isin)+cp(b.isin):'')+'</span>'+(tag(b)?'<div class="tags">'+tag(b)+'</div>':"")+'</td><td class="r num">₹'+n2(b.price)+'</td><td class="r num"><span class="y">'+(typeof b.yield==="number"?pct(b.yield):"–")+'</span><span class="isin" style="white-space:normal;max-width:180px">'+esc(b.yield_note||"")+'</span></td><td class="r num">'+chg(b)+'</td><td>'+fd(b.maturity_date)+'<span class="isin">'+n2(r.y,1)+' yrs left</span></td><td><span class="fit '+r.fit.c+'">'+esc(r.fit.t)+'</span></td><td>'+wa(b)+'</td></tr>'; }).join("")+'</tbody></table></div>';
    }
  }
  ["g-h","g-t","g-s"].forEach(function(i){ $(i).addEventListener("change",renderGov); });
  /* Reset to default: पान उघडताना जशा values होत्या तशा परत */
  function snap(ids){ return ids.map(function(i){ var e=$(i); return [e, e.type==="checkbox"?e.checked:e.value]; }); }
  function restore(sn){ sn.forEach(function(x){ if(x[0].type==="checkbox") x[0].checked=x[1]; else x[0].value=x[1]; }); }
  var DEF_G=snap(["g-h","g-t","g-s"]);
  $("g-reset").addEventListener("click",function(){ restore(DEF_G); renderGov(); track("bond_reset",{tab:"gov"}); });

  /* ================= CORPORATE ================= */
  var RANK=["AAA","AA+","AA","AA-","A+","A","A-","BBB+","BBB","BBB-","BB+","BB","BB-","B+","B","B-","C","D"];
  var FREQ={12:"Monthly",4:"Quarterly",2:"Half-yearly",1:"Yearly",0:"At maturity"};
  function rbase(r){ if(!r) return ""; return String(r).replace(/\((CE|SO)\)/gi,"").split("/")[0].trim().split(/\s+/).pop().toUpperCase(); }
  function bucket(r){ var b=rbase(r); if(!b) return "NR"; if(b==="AAA") return "AAA"; if(b.indexOf("AA")===0) return "AA"; if(b.indexOf("BBB")===0) return "BBB"; if(b.charAt(0)==="A") return "A"; return "BB"; }
  function realWatch(w){ return w && !/^\s*(no|not)\b/i.test(w); }
  function has(b,f){ if(f==="watch"&&b.ratings) return b.ratings.some(function(r){return realWatch(r.w);}); return (b.flags||[]).indexOf(f)>=0; }
  /* जड तपशील (documents, सगळ्या ratings, पत्ता, trustee) — bond उघडल्यावर / तुलना / PDF वेळीच आणतो */
  var detP=null;
  function loadDetails(){
    if(!S.corp || S.corp.full) return Promise.resolve();
    if(!detP) detP=get("corp_details.json").then(function(j){
      var d=(j&&j.details)||{}; S.corp.list.forEach(function(b){ var x=d[b.isin]; if(x) for(var k in x) b[k]=x[k]; }); S.corp.full=true;
    },function(){ detP=null; });
    return detP;
  }
  function prepCorp(list){
    return list.map(function(b){
      b.years = b.perp ? 999 : yrs(b.maturity);
      b.rankN = b.rating ? (RANK.indexOf(rbase(b.rating))>=0?RANK.indexOf(rbase(b.rating)):98) : 99;
      b.unrated = b.nsdl && !b.rating;
      b.risk = b.unrated || b.perp || has(b,"neg") || has(b,"inc") || has(b,"watch") || has(b,"withdrawn") || has(b,"default") || has(b,"restructured") || has(b,"highyield");
      b.search = ((b.issuer||"")+" "+b.isin).toLowerCase();
      // Part-repaid bond + अंदाजे yield: exchange चा भाव कोणत्या रकमेवर आहे ते स्पष्ट नसतं → yield 30–60% असा चुकीचा येतो. दाखवत नाही.
      if(b.amortising && b.ytmEst && b.ytm!=null){ b.ytmRaw=b.ytm; b.ytm=null; b.ytmHide=true; }
      return b;
    }).filter(function(b){ return b.years>0; });
  }
  /* ---------- browser मध्ये साठवण (favourites, alerts) — फक्त या device/browser पुरतं ---------- */
  function lsGet(k,d){ try{ var v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ return false; } }
  var FAV=lsGet("a4u_bc_fav",[]), ALERTS=lsGet("a4u_bc_alerts",[]);
  function isFav(b){ return FAV.indexOf(b.isin)>=0; }
  /* ---------- निर्णयासाठी: त्याच मुदतीच्या G-Sec पेक्षा किती जास्त yield, आणि तसल्याच bonds चा सरासरी yield ---------- */
  function gsecAt(y){
    var c=(S.mkt&&S.mkt.curve||[]).filter(function(p){return p.ytm!=null;}).slice().sort(function(a,b){return a.t-b.t;});
    if(!c.length||!(y>0)||y>60) return null; if(y<=c[0].t) return c[0].ytm; if(y>=c[c.length-1].t) return c[c.length-1].ytm;
    for(var k=1;k<c.length;k++) if(y<=c[k].t){ var a=c[k-1], z=c[k]; return a.ytm+(z.ytm-a.ytm)*(y-a.t)/(z.t-a.t); }
    return null;
  }
  function band(y){ return y<=1?"up to 1 year":y<=3?"1–3 years":y<=5?"3–5 years":"over 5 years"; }
  var PEER=null;
  function peers(){
    if(PEER) return PEER; PEER={}; var g={};
    S.corp.list.forEach(function(b){ if(b.ytm==null||b.ytmEst||b.risk||b.perp||!b.rating) return; var k=bucket(b.rating)+"|"+band(b.years); (g[k]=g[k]||[]).push(b.ytm); });
    Object.keys(g).forEach(function(k){ if(g[k].length>=5) PEER[k]={m:median(g[k]),n:g[k].length}; });
    return PEER;
  }
  function addSpreads(){
    if(!S.corp) return; PEER=null;
    S.corp.list.forEach(function(b){ var g=b.perp?null:gsecAt(b.years); /* अंदाजे yield / part-repaid bond साठी spread दाखवत नाही */ b.spread=(g!=null&&b.ytm!=null&&!b.ytmEst&&!b.amortising)?b.ytm-g:null; b.gsec=g; });
  }
  function bestFd(y){
    if(!FD_RATES||!FD_RATES.banks) return null; var col=y<=2?1:y<=4?2:3, best=null;
    FD_RATES.banks.forEach(function(r){ if(r[col]!=null&&(!best||r[col]>best[1])) best=[r[0],r[col]]; }); return best;
  }
  function quickTake(b){
    var L=[], y=b.ytm; if(y==null) return L;
    if(b.spread!=null) L.push([b.spread>=0?"i":"w","Yield "+pct(y)+" is "+(b.spread>=0?"+":"−")+Math.abs(b.spread).toFixed(2)+"% "+(b.spread>=0?"over":"below")+" a G-Sec of the same term ("+pct(b.gsec)+"). That extra yield is the reward for taking this issuer's credit and liquidity risk."]);
    var f=b.perp?null:bestFd(b.years); if(f) L.push(["i",(y>=f[1]?"About "+(y-f[1]).toFixed(2)+"% more":"About "+(f[1]-y).toFixed(2)+"% less")+" than the best big-bank FD we track for a similar term ("+esc(f[0])+" "+pct(f[1])+"). FDs are insured up to ₹5 lakh per bank; bonds are not."]);
    var pr=b.rating&&!b.perp?peers()[bucket(b.rating)+"|"+band(b.years)]:null;
    if(pr){ var d=y-pr.m, txt=Math.abs(d)<0.25?"In line with":(d>0?(d>1.5?"Much higher than":"Above"):"Below");
      L.push([d>1.5?"w":"i",txt+" other "+bucket(b.rating)+"-rated bonds maturing in "+band(b.years)+" (median "+pct(pr.m)+", "+pr.n+" bonds)."+(d>1.5?" A yield this far above similar bonds usually signals extra risk — find out why before investing.":"")]); }
    if(b.liq&&b.liq.label==="rare") L.push(["w","Rarely traded: plan to hold until maturity, as selling early may be slow or at a lower price."]);
    if(b.price!=null&&b.price<97&&!b.cumulative) L.push(["i","Trading at "+n2(b.price)+" per ₹100: part of the return comes from getting ₹100 back at maturity."]);
    return L;
  }
  function ratingPill(b){
    if(b.rating){ var t=b.ratings?b.ratings.map(function(r){return r.a+": "+r.r+(r.o?" ("+r.o+")":"");}).join("; "):(b.rt||""); return '<span class="pill r-'+bucket(b.rating)+'" title="'+esc(t)+'">'+esc(b.rating)+'</span>'; }
    return '<span class="pill r-NR">'+(b.nsdl?"Unrated":"Checking…")+'</span>';
  }
  function tagsHtml(b){
    var t=[];
    if(has(b,"default")) t.push(["Default reported","b"]);
    if(has(b,"restructured")) t.push(["Restructured","b"]);
    if(has(b,"highyield")) t.push(["High yield, higher risk","w"]);
    if(has(b,"neg")) t.push(["Negative outlook","w"]);
    if(has(b,"watch")) t.push(["Rating watch","w"]);
    if(has(b,"inc")) t.push(["Issuer not cooperating","w"]);
    if(has(b,"withdrawn")) t.push(["Rating withdrawn","w"]);
    if(b.perp) t.push(["Perpetual: may be called or written down","w"]);
    if(b.callable) t.push(["Callable"+(b.callDate&&/^\d{4}-/.test(b.callDate)?" "+fd(b.callDate):""),"w"]);
    if(b.amortising) t.push(["Part-repaid before maturity",""]);
    if(has(b,"provisional")) t.push(["Provisional rating",""]);
    if(has(b,"ce")) t.push(["Credit-enhanced rating",""]);
    if(b.secured===true) t.push(["Secured","g"]); else if(b.secured===false) t.push(["Unsecured",""]);
    if(b.price<99.5) t.push(["Discount: "+n2(100-b.price)+" below par",""]); else if(b.price>100.5) t.push(["Premium: "+n2(b.price-100)+" above par",""]);
    if(b.taxFree) t.push(["Tax-free","g"]);
    if(b.psu) t.push(["PSU","g"]);
    if(b.cumulative) t.push(["Interest paid at maturity",""]);
    if(b.floating) t.push(["Floating rate",""]);
    return t.length ? '<div class="tags">'+t.map(function(x){return '<span class="tag '+x[1]+'">'+esc(x[0])+'</span>';}).join("")+'</div>' : "";
  }
  function ytmTxt(b){ if(b.ytmHide) return '<span class="na" title="Part-repaid bond: the exchange price basis is unclear, so we do not show an estimated yield. Ask us for an exact quote.">Ask us</span>'; return (b.ytmEst&&b.ytm!=null?"~":"")+pct(b.ytm); }
  function freqTxt(b){ if(b.coupon===0) return "Zero coupon"; if(b.freq!=null&&FREQ[b.freq]) return FREQ[b.freq]; return b.freqText?esc(b.freqText):"–"; }
  function matTxt(b){ return b.perp?"Perpetual":fd(b.maturity); }
  function waBond(b,short){ return waLink("Hello Sahare Wealth, I would like to know more about this bond:\n"+b.issuer+" ("+b.isin+")\nCoupon "+(b.coupon!=null?b.coupon+"%":"–")+", yield "+(b.ytm!=null?b.ytm.toFixed(2)+"%":"–")+".\nPlease contact me.", short?"WhatsApp":"Ask on WhatsApp", b.isin); }

  // risk flags लपवल्यामुळे किती bonds यादीतून बाहेर गेले
  function rowsNoRisk(){ var c=$("f-risk"); c.checked=false; var n=filtered().length; c.checked=true; return n-filtered().length; }
  function filtered(){
    var q=$("f-q").value.trim().toLowerCase(), r=$("f-r").value, m=$("f-m").value, y=parseFloat($("f-y").value), ym=parseFloat($("f-ym").value),
        o=$("f-o").value, sec=$("f-sec").value, t=$("f-t").value, p=$("f-p").value, pr=$("f-pr").value, d=$("f-d").value, risk=$("f-risk").checked, call=$("f-call").checked;
    var ref = S.corp.pricesAsOf ? new Date(S.corp.pricesAsOf+"T00:00:00") : today;
    var out = S.corp.list.filter(function(b){
      if(q && b.search.indexOf(q)<0) return false;
      if(r && bucket(b.rating)!==r) return false;
      if(m && m!=="99" && b.years>+m) return false;
      if(m==="99" && b.years<=5) return false;
      if(!isNaN(y) && !(b.ytm>=y)) return false;
      if(!isNaN(ym) && !(b.ytm<=ym)) return false;
      if(o==="psu" && !b.psu) return false;
      if(o==="pvt" && b.psu!==false) return false;
      if(sec==="1" && b.secured!==true) return false;
      if(sec==="0" && b.secured!==false) return false;
      if(t==="free" && !b.taxFree) return false;
      if(t==="tax" && b.taxFree) return false;
      if(p!=="" && String(b.freq)!==p) return false;
      if(pr==="disc" && !(b.price<99.5)) return false;
      if(pr==="par" && !(b.price>=99.5&&b.price<=100.5)) return false;
      if(pr==="prem" && !(b.price>100.5)) return false;
      if(d!==""){ var age=(ref-new Date(b.tradeDate+"T00:00:00"))/864e5; if(age>+d+0.5) return false; }
      if(risk && b.risk) return false;
      if(call && (b.callable||b.perp)) return false;
      if(S.coll && COLLS[S.coll] && COLLS[S.coll].x && !COLLS[S.coll].x(b)) return false;
      return true;
    });
    var k=S.sortKey, dir=S.sortDir;
    return out.sort(function(a,b){
      var A,B;
      if(k==="maturity"){A=a.years;B=b.years;} else if(k==="spread"){A=a.spread;B=b.spread; if(A==null) return 1; if(B==null) return -1;} else if(k==="rating"){A=a.rankN;B=b.rankN;} else {A=a[k];B=b[k];}
      if(typeof A==="string"||typeof B==="string") return String(A||"").localeCompare(String(B||""))*dir;
      if(A==null) return 1; if(B==null) return -1;
      return (A-B)*dir;
    });
  }
  /* ---------- Collections: एका click मध्ये तयार filter (Jiraaf-सारखे) ---------- */
  var COLLS = {
    aaapsu: {t:"AAA PSU bonds", f:{"f-r":"AAA","f-o":"psu"}, risk:false, s:"turnover|-1", slug:"psu"},
    monthly:{t:"Monthly income", f:{"f-p":"12"}, risk:true, s:"ytm|-1", slug:"monthly-interest"},
    short:  {t:"Maturing within 1 year", f:{"f-m":"1"}, risk:true, s:"maturity|1", slug:"maturing-within-1-year"},
    secA:   {t:"Secured, A-rated or better", f:{"f-sec":"1"}, risk:true, s:"ytm|-1", x:function(b){ return b.rankN<=6; }, slug:"secured"},
    disc:   {t:"Discount bonds", f:{"f-pr":"disc"}, risk:true, s:"price|1", slug:"discount"},
    taxfree:{t:"Tax-free", f:{"f-t":"free"}, risk:false, s:"ytm|-1", slug:"tax-free"},
    fav:    {t:"★ My favourites", f:{}, risk:false, s:"ytm|-1", x:function(b){ return isFav(b); }},
    shared: {t:"Shared list", f:{}, risk:false, s:"ytm|-1", x:function(b){ return !!S.shared&&S.shared.indexOf(b.isin)>=0; }},
    liquid: {t:"Easy to sell", f:{}, risk:true, s:"turnover|-1", x:function(b){ return b.liq&&b.liq.label==="frequent"; }, slug:"frequently-traded"}
  };
  var FKEYS=["f-q","f-r","f-m","f-y","f-ym","f-o","f-sec","f-t","f-p","f-pr","f-d"];
  /* Filters ची स्थिती link मध्ये: #bonds-corp?r=AAA&p=12 — ही link WhatsApp वर पाठवली की तीच यादी उघडते */
  var curTab="gov", hashReady=false;
  function filterQuery(){
    var p=[]; FKEYS.forEach(function(i){ var v=$(i).value; if(v!=="") p.push(i.slice(2)+"="+encodeURIComponent(v)); });
    if(!$("f-risk").checked) p.push("risk=0"); if($("f-call").checked) p.push("call=1");
    if(S.coll==="shared"&&S.shared&&S.shared.length) p.push("fav="+S.shared.join(","));
    if(S.coll) p.push("c="+S.coll);
    if(S.sortKey!=="turnover"||S.sortDir!==-1) p.push("s="+S.sortKey+"."+(S.sortDir>0?"a":"d"));
    return p.join("&");
  }
  function saveHash(){
    if(!hashReady||curTab!=="corp"||MD.b||!history.replaceState) return;
    var q=filterQuery(); history.replaceState(null,"","#bonds-corp"+(q?"?"+q:""));
  }
  function applyQuery(q){
    q.split("&").forEach(function(kv){
      var i=kv.indexOf("="); if(i<1) return; var k=kv.slice(0,i), v=""; try{ v=decodeURIComponent(kv.slice(i+1)); }catch(e){ return; }
      if(k==="risk") $("f-risk").checked=v==="1"; else if(k==="call") $("f-call").checked=v==="1";
      else if(k==="c"){ if(COLLS[v]&&v!=="shared") S.coll=v; }
      else if(k==="fav"){ var L=v.toUpperCase().split(",").filter(function(x){return /^[A-Z0-9]{12}$/.test(x);}).slice(0,30); if(L.length){ S.shared=L; S.coll="shared"; $("f-risk").checked=false; } }
      else if(k==="s"){ var m=v.match(/^([a-zA-Z]+)\.(a|d)$/); if(m){ S.sortKey=m[1]; S.sortDir=m[2]==="a"?1:-1; } }
      else if(FKEYS.indexOf("f-"+k)>=0){ var el=$("f-"+k); el.value=v; if(el.tagName==="SELECT"&&el.value!==v) el.value=""; }
    });
    if(FKEYS.slice(4).some(function(i){ return $(i).value!==""; })){ var mo=$("f-more"); if(mo&&!mo.classList.contains("open")) $("f-morebtn").click(); }
  }
  function median(a){ a=a.slice().sort(function(x,y){return x-y;}); var n=a.length; return n?(n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2):null; }
  function renderStats(){
    var el=$("c-stats"); if(!S.corp){ el.hidden=true; return; }
    var L=S.corp.list, aaa=median(L.filter(function(b){return bucket(b.rating)==="AAA"&&b.ytm!=null&&!b.ytmEst;}).map(function(b){return b.ytm;})),
        mon=L.filter(function(b){return b.freq===12&&!b.cumulative;}).length, last=S.corp.pricesAsOf, tdy=L.filter(function(b){return b.tradeDate===last;}).length;
    var it=[[n2(L.length,0),"bonds traded in 30 days",""],[pct(aaa),"median AAA yield","aaa"],[n2(mon,0),"pay interest monthly","monthly"],[n2(tdy,0),"traded on "+fd(last),"today"]];
    el.innerHTML=it.map(function(x){ return x[2]?'<button type="button" data-stat="'+x[2]+'"><b class="num">'+x[0]+'</b><span>'+esc(x[1])+'</span></button>':'<div><b class="num">'+x[0]+'</b><span>'+esc(x[1])+'</span></div>'; }).join(""); el.hidden=false;
  }
  $("c-stats").addEventListener("click",function(e){
    var b=e.target.closest("[data-stat]"); if(!b) return; var k=b.getAttribute("data-stat"); track("bond_stat_click",{k:k});
    if(k==="monthly"){ applyColl("monthly"); return; }
    FKEYS.forEach(function(i){ $(i).value=""; }); $("f-risk").checked=true; $("f-call").checked=false; S.coll=null; renderColls();
    if(k==="aaa"){ $("f-r").value="AAA"; S.sortKey="ytm"; S.sortDir=-1; } else { $("f-d").value="0"; S.sortKey="turnover"; S.sortDir=-1; }
    syncSort(); S.shown=PAGE; renderCorp();
  });
  function renderColls(){
    COLLS.fav.t="★ My favourites ("+FAV.length+")"; COLLS.shared.t="📎 Shared list ("+((S.shared||[]).length)+")";
    $("c-colls").innerHTML='<span class="lbl">Quick picks:</span>'+Object.keys(COLLS).filter(function(k){ return (k!=="shared"||S.coll==="shared") && (k!=="fav"||FAV.length) && (!COLLS[k].x || !S.corp || S.corp.list.some(COLLS[k].x)); }).map(function(k){ return '<button type="button" data-coll="'+k+'" aria-pressed="'+(S.coll===k)+'">'+esc(COLLS[k].t)+'</button>'; }).join("");
  }
  function applyColl(k){
    FKEYS.forEach(function(i){ $(i).value=""; }); $("f-risk").checked=true; $("f-call").checked=false;
    S.coll = (S.coll===k) ? null : k;
    if(S.coll){ var c=COLLS[k]; Object.keys(c.f).forEach(function(i){ $(i).value=c.f[i]; }); $("f-risk").checked=c.risk!==false; var p=c.s.split("|"); S.sortKey=p[0]; S.sortDir=+p[1]; syncSort(); track("bond_collection",{c:k}); }
    S.shown=PAGE; renderColls(); renderCorp();
  }
  $("c-count").addEventListener("click",function(e){
    if(e.target.closest("#c-showrisk")){ $("f-risk").checked=false; S.shown=PAGE; renderCorp(); track("bond_show_risky"); return; }
    if(e.target.closest("#c-saveshared")){ (S.shared||[]).forEach(function(i){ if(FAV.indexOf(i)<0) FAV.push(i); }); lsSet("a4u_bc_fav",FAV); track("bond_shared_saved"); S.coll="fav"; S.sig=null; renderColls(); renderCorp(); renderMy(); return; }
    var b=e.target.closest("#c-copy"); if(!b) return;
    var q=filterQuery(), url=location.href.split("#")[0]+"#bonds-corp"+(q?"?"+q:"");
    function done(ok){ b.textContent=ok?"Link copied ✓":"Copy failed — copy from the address bar"; track("bond_copy_link"); }
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function(){done(true);},function(){done(false);}); else done(false);
  });
  /* ISIN copy (कुठेही) — इतर click (popup उघडणे इ.) होऊ देत नाही */
  root.addEventListener("click",function(e){
    var c=e.target.closest("[data-copy]"); if(!c) return; e.preventDefault(); e.stopPropagation();
    var v=c.getAttribute("data-copy");
    function done(ok){ c.classList.add(ok?"ok":"bad"); c.title=ok?"Copied":"Copy failed"; setTimeout(function(){ c.classList.remove("ok","bad"); c.title="Copy ISIN"; },1200); }
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(function(){done(true);},function(){done(fallbackCopy(v));});
    else done(fallbackCopy(v));
    track("isin_copy",{isin:v});
  },true);
  function fallbackCopy(v){ try{ var ta=document.createElement("textarea"); ta.value=v; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); var ok=document.execCommand("copy"); ta.remove(); return ok; }catch(e){ return false; } }
  $("c-colls").addEventListener("click",function(e){ var b=e.target.closest("[data-coll]"); if(b) applyColl(b.getAttribute("data-coll")); });

  /* ---------- Risk checklist: ✓/✗ तथ्यं (score नाही) ---------- */
  function checklist(b){
    var c=[], bk=bucket(b.rating), hi=(bk==="AAA"||bk==="AA");
    c.push(b.rating?[hi,"Rated "+b.rating+(hi?" (high safety)":" (below AA, higher credit risk)")]:[false,b.nsdl?"No credit rating reported":"Rating not yet checked"]);
    if(b.secured!=null) c.push([b.secured,b.secured?"Secured by the issuer's assets":"Unsecured"]);
    if(b.seniority) c.push([!/sub/i.test(b.seniority),b.seniority.charAt(0).toUpperCase()+b.seniority.slice(1).toLowerCase()+" in repayment order"]);
    if(b.guarantee) c.push([true,"Guaranteed by "+b.guarantee]);
    if(b.psu) c.push([true,"Issued by a public sector company"]);
    if(b.liq&&LIQ[b.liq.label]) c.push([b.liq.label==="frequent",{frequent:"Trades frequently on the exchange",occasional:"Trades only occasionally; may take time to sell",rare:"Rarely traded; may be hard to sell before maturity"}[b.liq.label]||"Liquidity unknown"]);
    if(b.perp) c.push([false,"Perpetual: no fixed maturity date"]); else if(b.callable) c.push([false,"Issuer can repay early (call option)"]);
    var w=b.ratings?b.ratings.filter(function(r){return realWatch(r.w);}):(has(b,"watch")?[{w:"watch"}]:[]), pos=w.length&&w.every(function(r){return /positive/i.test(r.w);});
    c.push([!w.length||pos,!w.length?"No rating watch reported":(pos?"On rating watch with positive implications":"A rating agency has it on watch")]);
    if(has(b,"neg")) c.push([false,"Negative rating outlook"]);
    if(has(b,"default")||has(b,"restructured")) c.push([false,"Default or restructuring reported"]);
    if(b.tradeDate){ var age=(today-new Date(b.tradeDate+"T00:00:00"))/864e5; c.push([age<=10,age<=10?"Price is recent ("+fd(b.tradeDate)+")":"Last trade "+fd(b.tradeDate)+"; price may be stale"]); }
    return c;
  }
  function checklistHtml(b){
    return '<ul class="chk-list">'+checklist(b).map(function(x){ return '<li><span class="'+(x[0]?"y":"n")+'" aria-label="'+(x[0]?"Yes":"Watch out")+'">'+(x[0]?"✓":"✗")+'</span><span>'+esc(x[1])+'</span></li>'; }).join("")+'</ul><p class="muted" style="margin-top:.35rem;font-size:.78rem">Facts from NSDL and exchange data, not a rating or a recommendation.</p>';
  }

  /* ---------- Price history (corp_prices.json, bond उघडल्यावरच load) ---------- */
  var PRICES=null, priceP=null;
  function loadPrices(){ if(!priceP) priceP=get("corp_prices.json").then(function(j){ PRICES=(j&&j.prices)||{}; return PRICES; },function(){ PRICES={}; return PRICES; }); return priceP; }
  function priceChart(b){
    if(!PRICES) return '<p class="muted">Loading price history…</p>';
    var days=MD.pdays||90, cut=new Date(today.getTime()-days*864e5), rows=(PRICES[b.isin]||[]).filter(function(r){ return new Date(r[0]+"T00:00:00")>=cut && r[1]>0; });
    var seg='<div class="seg" role="group" aria-label="Period" style="margin-bottom:.4rem">'+[30,90].map(function(d){ return '<button type="button" data-md-pd="'+d+'" aria-pressed="'+(days===d)+'">'+d+' days</button>'; }).join("")+'</div>';
    if(rows.length<2) return seg+'<p class="muted">Not enough trades in the last '+days+' days to draw a chart'+(b.liq&&b.liq.label!=="frequent"?" (this bond trades rarely)":"")+'. History builds up every trading day.</p>';
    var p=rows.map(function(r){return r[1];}), lo=Math.min.apply(null,p), hi=Math.max.apply(null,p); if(hi-lo<0.2){ lo-=0.1; hi+=0.1; }
    var W=640,H=170,L=48,R=10,T=12,B=24, t0=new Date(rows[0][0]).getTime(), t1=Math.max(t0+864e5,new Date(rows[rows.length-1][0]).getTime());
    function X(d){ return L+(new Date(d).getTime()-t0)/(t1-t0)*(W-L-R); } function Y(v){ return T+(hi-v)/(hi-lo)*(H-T-B); }
    var g=[hi,(hi+lo)/2,lo].map(function(v){ return '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'" stroke="#e6e9ee"/><text x="'+(L-6)+'" y="'+(Y(v)+4).toFixed(1)+'" font-size="11" text-anchor="end" fill="#5f6573">'+v.toFixed(2)+'</text>'; }).join("");
    var par=(100>lo&&100<hi)?'<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(100).toFixed(1)+'" y2="'+Y(100).toFixed(1)+'" stroke="#0f7a4f" stroke-dasharray="4 4"/><text x="'+(W-R)+'" y="'+(Y(100)-4).toFixed(1)+'" font-size="10" text-anchor="end" fill="#0f7a4f">par 100</text>':"";
    var pts=rows.map(function(r){ return X(r[0]).toFixed(1)+","+Y(r[1]).toFixed(1); }).join(" ");
    var dots=rows.map(function(r){ return '<circle cx="'+X(r[0]).toFixed(1)+'" cy="'+Y(r[1]).toFixed(1)+'" r="2.6" fill="#f8b526"><title>'+fd(r[0])+": "+r[1].toFixed(2)+'</title></circle>'; }).join("");
    var chg=p[p.length-1]-p[0];
    return seg+'<div class="pchart"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Price per ₹100 over the last '+days+' days">'+g+par+'<polyline fill="none" stroke="#212d45" stroke-width="2" points="'+pts+'"/>'+dots+
      '<text x="'+L+'" y="'+(H-6)+'" font-size="11" fill="#5f6573">'+fd(rows[0][0])+'</text><text x="'+(W-R)+'" y="'+(H-6)+'" font-size="11" text-anchor="end" fill="#5f6573">'+fd(rows[rows.length-1][0])+'</text></svg></div>'+
      '<p class="muted" style="font-size:.8rem">Closing price per ₹100 face on '+rows.length+' trading days (days without trades are skipped). Change: '+(chg>=0?"+":"")+chg.toFixed(2)+'.</p>';
  }

  function detailHtml(b){
    var rat=(b.ratings||[]).map(function(r){ return '<li><b>'+esc(r.r)+'</b> by '+esc(r.a)+(r.o?" · "+esc(r.o):"")+(r.dt?" · "+fd(r.dt):"")+(realWatch(r.w)?'<br><span class="muted">'+esc(r.w)+'</span>':"")+(r.u?' · <a href="'+esc(r.u)+'" target="_blank" rel="noopener nofollow">Rating rationale</a>':"")+'</li>'; }).join("");
    var seenU={}, docs=(b.docs||[]).filter(function(x){ if(seenU[x.u]) return false; seenU[x.u]=1; return !(b.ratings||[]).some(function(r){return r.u===x.u;}); }).map(function(x){ return '<li><a href="'+esc(x.u)+'" target="_blank" rel="noopener nofollow">'+esc(x.n.replace(/_-$/,""))+'</a></li>'; }).join("");
    var feat=[];
    if(b.face) feat.push("Face value per bond: "+inr(b.face));
    feat.push("Interest paid: "+freqTxt(b));
    if(b.nextPay) feat.push("Next payment: "+fd(b.nextPay.d)+(b.nextPay.a!=null?" · ₹"+n2(b.nextPay.a)+" per bond":"")+(b.nextPay.e&&b.nextPay.e!=="Interest"?" ("+esc(b.nextPay.e)+")":""));
    if(b.secured!=null) feat.push((b.secured?"Secured":"Unsecured")+(b.seniority?" · "+esc(b.seniority):""));
    if(b.assetCover) feat.push("Asset cover: "+n2(b.assetCover,0)+"%");
    if(b.guarantee) feat.push("Guarantee: "+esc(b.guarantee));
    if(b.callable) feat.push("Issuer call option"+(b.callDate?": "+(/^\d{4}-/.test(b.callDate)?fd(b.callDate):esc(b.callDate)):""));
    if(b.putable) feat.push("Investor put option"+(b.putDate?": "+(/^\d{4}-/.test(b.putDate)?fd(b.putDate):esc(b.putDate)):""));
    if(b.stepUp) feat.push("Coupon step-up clause (e.g. on rating downgrade)");
    if(b.issueMode) feat.push("Issue: "+esc(b.issueMode));
    var who=[];
    if(b.sector) who.push("Sector: "+esc(b.sector)+(b.industry&&b.industry!==b.sector?" · "+esc(b.industry):""));
    who.push("Issuer type (per NSDL): "+(b.psu?"PSU / government-owned":(b.psu===false?"Non-PSU":"–")));
    if(b.address) who.push('Registered office: '+esc(b.address.toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();}))+' · <a href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(b.address)+'" target="_blank" rel="noopener">Map</a>');
    if(b.trustee) who.push("Debenture trustee: "+esc(b.trustee));
    if(b.registrar) who.push("Registrar: "+esc(b.registrar));
    who.push('<a href="https://www.indiabondinfo.nsdl.com/" target="_blank" rel="noopener">Verify on NSDL India Bond Info</a> (search '+esc(b.isin)+')');
    return '<div class="det-grid"><div><h4>Credit ratings</h4><ul>'+(rat||"<li>"+(b.nsdl?"No rating reported to NSDL":"Details are being fetched; check again tomorrow")+"</li>")+'</ul></div>'+
      '<div><h4>Features</h4><ul>'+feat.map(function(x){return "<li>"+x+"</li>";}).join("")+'</ul></div>'+
      '<div><h4>Issuer & documents</h4><ul>'+who.map(function(x){return "<li>"+x+"</li>";}).join("")+(docs||"")+'</ul></div></div>';
  }
  function rowHtml(b){
    var on=S.picked.indexOf(b.isin)>=0;
    return '<tr class="rb-'+bucket(b.rating)+(on?" sel":"")+'"><td><input type="checkbox" data-pick="'+esc(b.isin)+'" '+(on?"checked":"")+' aria-label="Compare '+esc(b.issuer)+'"></td>'+
      '<td class="iss"><button type="button" class="nm" data-open="'+esc(b.isin)+'" title="Open details">'+esc(b.issuer)+'</button><span class="isin">'+esc(b.isin)+cp(b.isin)+'<span class="mini">'+favBtn(b)+bellBtn(b)+'</span></span>'+tagsHtml(b)+'</td><td>'+ratingPill(b)+'</td>'+
      '<td class="r num">'+pct(b.coupon)+'</td><td class="r num">'+n2(b.price)+'</td><td class="r num y">'+ytmTxt(b)+yBar(b)+sprTxt(b)+'</td>'+
      '<td>'+matTxt(b)+'</td><td>'+freqTxt(b)+'</td><td>'+fd(b.tradeDate)+'<span class="isin">'+esc(b.exch||"")+'</span></td>'+
      '<td><div class="acts row"><button type="button" class="btn" data-calc="'+esc(b.isin)+'">Calculate</button>'+waBond(b,true)+'</div></td></tr>';
  }
  function sprTxt(b){ return b.spread!=null?'<span class="spr" title="Extra yield over a G-Sec of the same term">'+(b.spread>=0?"+":"−")+Math.abs(b.spread).toFixed(2)+'% vs G-Sec</span>':""; }
  var CP_SVG="<svg viewBox=\"0 0 24 24\" width=\"15\" height=\"15\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z\"/></svg>";
  function cp(isin){ return isin?'<button type="button" class="cp" data-copy="'+esc(isin)+'" title="Copy ISIN" aria-label="Copy ISIN '+esc(isin)+'">'+CP_SVG+'</button>':""; }
  function favBtn(b){ var on=isFav(b); return '<button type="button" class="ic fav'+(on?" on":"")+'" data-fav="'+esc(b.isin)+'" aria-pressed="'+on+'" title="'+(on?"Remove from":"Add to")+' favourites" aria-label="'+(on?"Remove from":"Add to")+' favourites">'+(on?"★":"☆")+'</button>'; }
  function bellBtn(b){ var n=ALERTS.filter(function(a){return a.isin===b.isin;}).length; return '<button type="button" class="ic bell'+(n?" on":"")+'" data-bell="'+esc(b.isin)+'" title="'+(n?n+" alert"+(n>1?"s":"")+" set":"Set a price / yield alert")+'" aria-label="Price or yield alert">🔔</button>'; }
  function yBar(b){   // 5% ते 14% मधली छोटी पट्टी — yield पटकन तुलना करायला
    if(b.ytm==null) return ""; var w=Math.max(4,Math.min(100,(b.ytm-5)/9*100));
    return '<span class="ybar'+(b.ytm>=HIGH_YIELD?" hi":"")+'" aria-hidden="true"><i style="width:'+w.toFixed(0)+'%"></i></span>';
  }
  function cardHtml(b){
    var on=S.picked.indexOf(b.isin)>=0;
    return '<div class="card'+(on?" sel":"")+'"><div class="top"><label><input type="checkbox" data-pick="'+esc(b.isin)+'" '+(on?"checked":"")+'> Compare</label><span class="topr">'+favBtn(b)+bellBtn(b)+ratingPill(b)+'</span></div>'+
      '<h4><button type="button" class="nm" data-open="'+esc(b.isin)+'">'+esc(b.issuer)+' <span aria-hidden="true">›</span></button></h4><span class="isin">'+esc(b.isin)+cp(b.isin)+'</span>'+
      '<div class="yl"><b class="num">'+ytmTxt(b)+'</b><span>yield to maturity</span>'+sprTxt(b)+'</div>'+
      '<dl class="kv"><div><dt>Coupon</dt><dd>'+pct(b.coupon)+'</dd></div><div><dt>Price (per ₹100)</dt><dd class="num">'+n2(b.price)+'</dd></div><div><dt>Maturity</dt><dd>'+matTxt(b)+'</dd></div><div><dt>Interest paid</dt><dd>'+freqTxt(b)+'</dd></div><div><dt>Last trade</dt><dd>'+fd(b.tradeDate)+'</dd></div><div><dt>Face value</dt><dd>'+(b.face?inr(b.face):"–")+'</dd></div></dl>'+
      tagsHtml(b)+'<div class="acts row3" style="margin-top:.6rem"><button type="button" class="btn solid" data-open="'+esc(b.isin)+'">View details</button><button type="button" class="btn" data-calc="'+esc(b.isin)+'">Calculate</button>'+waBond(b,true)+'</div></div>';
  }
  var COLS=[["","",0],["issuer","Issuer",1],["rating","Rating",1],["coupon","Coupon",1,1],["price","Price (per ₹100)",1,1],["ytm","Yield",1,1],["maturity","Maturity",1],["freq","Interest paid",0],["tradeDate","Last trade",1],["","",0]];
  function renderCorp(){
    var el=$("c-list");
    if(!S.corp){ el.innerHTML='<p class="muted">Corporate bond data could not be loaded right now. Please refresh the page.</p>'; return; }
    var rows=filtered(), slice=rows.slice(0,S.shown);
    $("c-count").innerHTML=esc("Showing "+slice.length+" of "+rows.length+" bonds"+(rows.length!==S.corp.list.length?" (filtered from "+S.corp.list.length+")":""))+(rows.length!==S.corp.list.length?' · <button type="button" class="linkbtn" id="c-copy">Copy link to this list</button>':"")+(S.coll&&CAT_PAGE_BASE&&COLLS[S.coll].slug?' · <a href="'+esc(CAT_PAGE_BASE+COLLS[S.coll].slug+"/")+'" target="_blank" rel="noopener">Shareable page ↗</a>':"");
    if($("f-risk").checked){ var nr=rowsNoRisk(); if(nr>0) $("c-count").insertAdjacentHTML("beforeend",' · <button type="button" class="linkbtn" id="c-showrisk">Show '+nr+' more with risk flags</button>'); }
    if(S.coll==="shared"&&S.shared) $("c-count").insertAdjacentHTML("beforeend",' · <button type="button" class="linkbtn" id="c-saveshared">Save these to my favourites</button>');
    var sig=[mq.matches,S.sortKey,S.sortDir,S.picked.join(),S.corp.pricesAsOf,!!S.corp.full,rows.length].concat(slice.map(function(b){return b.isin;})).join("|");
    if(sig===S.sig){ /* यादी तीच आहे — table पुन्हा काढत नाही */ }
    else if(!rows.length){ el.innerHTML='<p class="muted" style="padding:1.5rem;text-align:center">No bonds match these filters. Clear a filter to see more.</p>'; }
    else if(mq.matches){ el.innerHTML='<div class="cards">'+slice.map(cardHtml).join("")+'</div>'; }
    else {
      el.innerHTML='<div class="tw"><table><thead><tr>'+COLS.map(function(c){
        if(!c[2]) return '<th'+(c[0]?"":' aria-label="'+(c[1]||"Select")+'"')+'>'+esc(c[1])+'</th>';
        var arrow=S.sortKey===c[0]?(S.sortDir>0?" ▲":" ▼"):"";
        return '<th class="'+(c[3]?"r":"")+'" aria-sort="'+(S.sortKey===c[0]?(S.sortDir>0?"ascending":"descending"):"none")+'"><button type="button" data-sort="'+c[0]+'">'+esc(c[1])+arrow+'</button></th>';
      }).join("")+'</tr></thead><tbody>'+slice.map(rowHtml).join("")+'</tbody></table></div>';
    }
    S.sig=sig; saveHash();
    var left=rows.length-slice.length, sm=$("c-more"); sm.hidden=left<=0; if(left>0) sm.textContent="Show "+Math.min(PAGE,left)+" more ("+left+" remaining)";
    $("bc-cc").textContent=S.picked.length?"("+S.picked.length+")":"";
  }
  function syncSort(){ var v=S.sortKey+"|"+S.sortDir, s=$("f-s"); s.value=v; if(s.value!==v){ var o=document.createElement("option"); o.value=v; o.textContent="Custom (table heading)"; s.appendChild(o); s.value=v; } }
  var ft=null;
  ["f-q","f-r","f-m","f-y","f-ym","f-o","f-sec","f-t","f-p","f-pr","f-d","f-risk","f-call"].forEach(function(i){
    var typed=(i==="f-q"||i==="f-y"||i==="f-ym"), dt=null;   // टाइप करायच्या boxes ना छोटा थांबा (debounce)
    function run(){ if(S.coll){ S.coll=null; renderColls(); } S.shown=PAGE; renderCorp(); }
    $(i).addEventListener("input",function(){ if(typed){ clearTimeout(dt); dt=setTimeout(run,200); } else run(); clearTimeout(ft); ft=setTimeout(function(){ track("bond_filter",{filter:i}); },900); });
  });
  $("f-s").addEventListener("change",function(){ var p=this.value.split("|"); S.sortKey=p[0]; S.sortDir=+p[1]; S.shown=PAGE; renderCorp(); });
  $("f-morebtn").addEventListener("click",function(){ var o=$("f-more").classList.toggle("open"); this.setAttribute("aria-expanded",o); this.textContent=o?"Fewer filters":"More filters"; });
  $("f-reset").addEventListener("click",function(){ FKEYS.forEach(function(i){ $(i).value=""; }); $("f-risk").checked=true; $("f-call").checked=false; S.coll=null; S.sortKey="turnover"; S.sortDir=-1; syncSort(); qBtns(); renderColls(); S.shown=PAGE; renderCorp(); track("bond_reset",{tab:"corp"}); });
  /* ---------- Search box: × (साफ करा) आणि Paste ---------- */
  function qBtns(){ $("f-qx").hidden=!$("f-q").value; }
  $("f-q").addEventListener("input",qBtns);
  $("f-qx").addEventListener("click",function(){ $("f-q").value=""; qBtns(); $("f-q").dispatchEvent(new Event("input",{bubbles:true})); $("f-q").focus(); });
  $("f-qp").addEventListener("click",function(){
    function put(t){ t=String(t||"").replace(/\s+/g," ").trim().slice(0,80); if(!t) return; $("f-q").value=t; qBtns(); $("f-q").dispatchEvent(new Event("input",{bubbles:true})); track("bond_search_paste"); }
    if(navigator.clipboard&&navigator.clipboard.readText) navigator.clipboard.readText().then(put,function(){ $("f-q").focus(); $("c-msg").textContent="Your browser blocked reading the clipboard. Tap the search box and paste (Ctrl+V, or long-press → Paste)."; });
    else { $("f-q").focus(); $("c-msg").textContent="Tap the search box and paste (Ctrl+V, or long-press → Paste)."; }
  });
  /* ---------- Favourites ---------- */
  function toggleFav(isin){
    var k=FAV.indexOf(isin); if(k>=0) FAV.splice(k,1); else FAV.push(isin);
    lsSet("a4u_bc_fav",FAV); track(k>=0?"bond_unfav":"bond_fav",{isin:isin});
    if(S.coll==="fav"&&!FAV.length) S.coll=null;
    S.sig=null; renderColls(); renderCorp(); renderMy(); if(MD.b) renderModal();
  }
  /* ---------- Price / yield alerts (या browser मध्ये; पान उघडल्यावर रोजच्या भावाशी तपासतो) ---------- */
  var AL_KIND={"ytm>=":"Yield rises to","ytm<=":"Yield falls to","price<=":"Price falls to","price>=":"Price rises to"};
  function alVal(a){ return a.m==="ytm"?pct(a.v):n2(a.v); }
  function alNow(a){ var b=S.corp&&S.corp.list.find(function(x){return x.isin===a.isin;}); return b?b[a.m]:null; }
  function alMet(a){ var v=alNow(a); if(v==null) return false; return a.op===">="?v>=a.v:v<=a.v; }
  function alTxt(a){ return AL_KIND[a.m+a.op]+" "+alVal(a); }
  function saveAlerts(){ lsSet("a4u_bc_alerts",ALERTS); }
  function addAlert(b,m,op,v){
    if(!(v>0)) return "Enter a value.";
    if(ALERTS.filter(function(a){return a.isin===b.isin;}).length>=5) return "Up to 5 alerts per bond.";
    if(ALERTS.length>=50) return "Up to 50 alerts in total. Delete some first.";
    ALERTS.push({id:Date.now().toString(36),isin:b.isin,name:b.issuer,m:m,op:op,v:+v,at:iso(today),base:b[m]}); saveAlerts();
    track("bond_alert_add",{isin:b.isin,m:m});
    if(window.Notification&&Notification.permission==="default"){ try{ Notification.requestPermission(); }catch(e){} }
    return "";
  }
  function delAlert(id){ ALERTS=ALERTS.filter(function(a){return a.id!==id;}); saveAlerts(); }
  function checkAlerts(){
    var hit=ALERTS.filter(alMet), el=$("bc-alnote");
    if(!hit.length){ el.hidden=true; return; }
    el.innerHTML='<b>🔔 '+hit.length+' alert'+(hit.length>1?"s":"")+' met today</b>'+hit.slice(0,3).map(function(a){ return ' · <button type="button" class="linkbtn" data-al-open="'+esc(a.isin)+'">'+esc(a.name)+'</button> — '+esc(alTxt(a))+' (now '+(a.m==="ytm"?pct(alNow(a)):n2(alNow(a)))+')'; }).join("")+(hit.length>3?' · and '+(hit.length-3)+' more':'')+' <button type="button" class="linkbtn" data-al-all="1">Manage alerts</button>';
    el.hidden=false;
    var key="a4u_bc_alnotified_"+(S.corp.pricesAsOf||"");
    try{ if(window.Notification&&Notification.permission==="granted"&&!sessionStorage.getItem(key)){ sessionStorage.setItem(key,"1"); new Notification("Bond alert: "+hit[0].name,{body:alTxt(hit[0])+(hit.length>1?" (+"+(hit.length-1)+" more)":"")}); } }catch(e){}
  }
  $("bc-alnote").addEventListener("click",function(e){
    var o=e.target.closest("[data-al-open]"); if(o){ MD.goAlert=true; openBond(o.getAttribute("data-al-open"),true); return; }
    if(e.target.closest("[data-al-all]")){ showTab("corp",true); $("c-my").open=true; $("c-my").scrollIntoView({behavior:"smooth",block:"center"}); }
  });
  function renderMy(){
    var box=$("c-my"); if(!S.corp||(!FAV.length&&!ALERTS.length)){ box.hidden=true; return; }
    var met=ALERTS.filter(alMet).length;
    $("c-my-s").innerHTML='★ Favourites ('+FAV.length+') · 🔔 Alerts ('+ALERTS.length+(met?', <b>'+met+' met</b>':'')+')';
    var h='';
    if(ALERTS.length) h+='<table class="altbl"><thead><tr><th>Bond</th><th>Alert</th><th class="r">Now</th><th>Status</th><th></th></tr></thead><tbody>'+ALERTS.map(function(a){ var v=alNow(a), ok=alMet(a);
      return '<tr class="plain"><td><button type="button" class="nm" data-al-open="'+esc(a.isin)+'">'+esc(a.name)+'</button><span class="isin">'+esc(a.isin)+cp(a.isin)+' · set '+fd(a.at)+'</span></td><td>'+esc(alTxt(a))+'</td><td class="r num">'+(v==null?"–":(a.m==="ytm"?pct(v):n2(v)))+'</td><td>'+(v==null?'<span class="muted">Not traded recently</span>':ok?'<span class="tag g">Met</span>':'<span class="muted">Waiting</span>')+'</td><td><button type="button" class="ic" data-al-del="'+esc(a.id)+'" aria-label="Delete alert" title="Delete">×</button></td></tr>'; }).join("")+'</tbody></table>';
    else h+='<p class="muted">No alerts yet. Tap 🔔 on any bond to set one.</p>';
    h+='<div class="acts" style="margin-top:.6rem;align-items:center">'+(FAV.length?'<button type="button" class="btn" data-my-fav="1">Show my favourites</button><button type="button" class="btn" data-my-share="1">Copy share link</button>'+waLink("My bond shortlist: "+location.href.split("#")[0]+"#bonds-corp?fav="+FAV.join(","),"Send list on WhatsApp","favlist"):'')+(ALERTS.length?waLink("Hello Sahare Wealth, please track these bonds for me:\n"+ALERTS.map(function(a){return "- "+a.name+" ("+a.isin+"): "+alTxt(a);}).join("\n"),"Ask us to track these on WhatsApp","alerts"):"")+
      '<span class="muted">Saved only in this browser. Checked against the latest BSE/NSE prices each time you open this page (prices update every trading evening).</span></div>';
    $("c-my-b").innerHTML=h; box.hidden=false;
  }
  $("c-my").addEventListener("click",function(e){
    var d=e.target.closest("[data-al-del]"); if(d){ e.preventDefault(); delAlert(d.getAttribute("data-al-del")); renderMy(); checkAlerts(); S.sig=null; renderCorp(); return; }
    var o=e.target.closest("[data-al-open]"); if(o){ MD.goAlert=true; openBond(o.getAttribute("data-al-open"),true); return; }
    if(e.target.closest("[data-my-fav]")){ if(S.coll!=="fav") applyColl("fav"); }
    var sh=e.target.closest("[data-my-share]"); if(sh){ var url=location.href.split("#")[0]+"#bonds-corp?fav="+FAV.join(",");
      function done(ok){ sh.textContent=ok?"Link copied ✓":"Copy failed"; setTimeout(function(){ sh.textContent="Copy share link"; },1800); }
      if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function(){done(true);},function(){done(false);}); else done(false); track("bond_fav_share"); }
  });
  $("c-more").addEventListener("click",function(){ S.shown+=PAGE; renderCorp(); });
  $("c-list").addEventListener("click",function(e){
    var h=e.target.closest("[data-sort]"); if(h){ var k=h.getAttribute("data-sort"); if(S.sortKey===k) S.sortDir*=-1; else { S.sortKey=k; S.sortDir=(k==="issuer"||k==="rating"||k==="maturity")?1:-1; } syncSort(); S.shown=PAGE; renderCorp(); return; }
    var fv=e.target.closest("[data-fav]"); if(fv){ toggleFav(fv.getAttribute("data-fav")); return; }
    var bl=e.target.closest("[data-bell]"); if(bl){ MD.goAlert=true; openBond(bl.getAttribute("data-bell"),true); return; }
    var o=e.target.closest("[data-open]"); if(o){ openBond(o.getAttribute("data-open"),true); return; }
    var c=e.target.closest("[data-calc]"); if(c){ fillCalc(c.getAttribute("data-calc")); showTab("calc",true); return; }
    var w=e.target.closest("[data-wa]"); if(w) track("bond_whatsapp_click",{isin:w.getAttribute("data-wa")});
  });
  $("c-list").addEventListener("change",function(e){
    var p=e.target.getAttribute&&e.target.getAttribute("data-pick"); if(!p) return;
    $("c-msg").textContent="";
    if(e.target.checked){ if(S.picked.length>=3){ e.target.checked=false; $("c-msg").textContent="You can compare up to 3 bonds at a time. Untick one to add another."; return; } S.picked.push(p); track("bond_compare_select",{isin:p}); }
    else S.picked=S.picked.filter(function(x){return x!==p;});
    renderCorp();
  });
  if(mq.addEventListener) mq.addEventListener("change",function(){ renderCorp(); renderGov(); });

  /* ================= COMPARE ================= */
  var CMPG="bal";
  root.querySelectorAll("[data-goal]").forEach(function(bt){ bt.addEventListener("click",function(){ CMPG=bt.getAttribute("data-goal"); root.querySelectorAll("[data-goal]").forEach(function(x){ x.setAttribute("aria-pressed",x===bt); }); renderCompare(); track("bond_compare_goal",{g:CMPG}); }); });
  function renderCompare(){
    var box=$("cmp-body");
    if(!S.corp){ box.innerHTML=""; return; }
    var list=S.picked.map(function(i){ return S.corp.list.find(function(b){return b.isin===i;}); }).filter(Boolean);
    if(list.length<2){ box.innerHTML='<p class="muted" style="padding:1.5rem;text-align:center">Tick at least 2 bonds in the <b>Corporate bonds</b> tab to compare them side by side.</p>'; return; }
    var rows=[
      ["Rating (lowest)",function(b){return b.rating?esc(b.rating):(b.nsdl?"Unrated":"–");}],
      ["All ratings",function(b){return (b.ratings||[]).map(function(r){return esc(r.a+": "+r.r+(r.o?" ("+r.o+")":""));}).join("<br>")||"–";}],
      ["Coupon",function(b){return pct(b.coupon);}],
      ["Price (per ₹100)",function(b){return n2(b.price);}],
      ["Yield",function(b){return ytmTxt(b);}],
      ["Maturity",function(b){return matTxt(b);}],
      ["Years left",function(b){return b.perp?"–":n2(b.years,1);}],
      ["Interest paid",function(b){return freqTxt(b);}],
      ["Next payment",function(b){return b.nextPay?fd(b.nextPay.d):"–";}],
      ["Face value",function(b){return b.face?inr(b.face):"–";}],
      ["Secured",function(b){return b.secured==null?"–":(b.secured?"Secured":"Unsecured");}],
      ["Issuer type",function(b){return b.psu?"PSU":(b.psu===false?"Non-PSU":"–");}],
      ["Tax status",function(b){return b.taxFree?"Tax-free":"Taxable";}],
      ["Call / put",function(b){return [b.callable?"Callable":"",b.putable?"Putable":""].filter(Boolean).join(", ")||"None reported";}],
      ["Risk flags",function(b){var t=tagsHtml(b).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(); return b.risk?esc(t):"None flagged";}],
      ["Last traded",function(b){return fd(b.tradeDate);}],
      ["Liquidity",function(b){var l=liqTxt(b); return esc(l[0])+'<br><span class="isin">'+esc(l[1])+'</span>';}],
      ["Trustee",function(b){return esc(b.trustee||"–");}]
    ];
    /* कोण कुठे पुढे: प्रत्येक मापावर सर्वोत्तम bond ला ⭐ + हिरवा रंग */
    var LQ={frequent:3,occasional:2,rare:1};
    // [नाव, value, वजन] — सुरक्षिततेच्या मापांना जास्त वजन (rating, risk flags, security)
    // वजन: [Rating, Risk flags, Security, Liquidity, Yield, No call, Tax, Lower minimum] — "What matters most" नुसार
    var GW={bal:[3,3,2,1.5,1.5,1,1,.5], safe:[5,4,3,1,.5,1,.5,.5], inc:[2,2,1,1,4,1,2,.5], liq:[2,2,1,5,1,1,.5,1]}[CMPG]||[3,3,2,1.5,1.5,1,1,.5];
    var MET={"Rating (lowest)":["Rating",function(b){return b.rating?-b.rankN:(b.nsdl?-99:null);},GW[0]],"Risk flags":["No risk flags",function(b){return b.risk?0:1;},GW[1]],
      "Secured":["Security",function(b){return b.secured==null?null:(b.secured?1:0);},GW[2]],"Liquidity":["Liquidity",function(b){return b.liq&&LQ[b.liq.label]||null;},GW[3]],
      "Yield":["Yield",function(b){return b.ytm;},GW[4]],"Call / put":["No early call",function(b){return (b.callable||b.perp)?0:1;},GW[5]],
      "Tax status":["Tax",function(b){return b.taxFree?1:0;},GW[6]],"Face value":["Lower minimum",function(b){return b.face?-b.face:null;},GW[7]]};
    rows.splice(5,0,["Extra yield vs G-Sec",function(b){return b.spread!=null?(b.spread>=0?"+":"−")+Math.abs(b.spread).toFixed(2)+"%":"–";}]);
    var WIN={}, wins=list.map(function(){return [];}), pts=list.map(function(){return 0;});
    Object.keys(MET).forEach(function(lab){
      var v=list.map(function(b){ var x=MET[lab][1](b); return (typeof x==="number"&&isFinite(x))?x:null; }), ok=v.filter(function(x){return x!=null;});
      if(ok.length<2) return; var mx=Math.max.apply(null,ok), mn=Math.min.apply(null,ok); if(Math.abs(mx-mn)<1e-9) return;
      WIN[lab]=v.map(function(x,k){ var w=x!=null&&Math.abs(x-mx)<1e-9; if(w){ wins[k].push(MET[lab][0]); pts[k]+=MET[lab][2]; } return w; });
    });
    var cnt=wins.map(function(w){return w.length;}), uniq=pts.slice().sort(function(a,b){return b-a;}).filter(function(x,k,a){return a.indexOf(x)===k;});
    function starsK(k){ var n=pts[k], r=uniq.indexOf(n); if(!n) return ""; var st=Math.max(1,3-r); if(list[k].risk) st=Math.min(st,1); return "⭐".repeat(st); }
    var nm=Object.keys(WIN).length;
    var h='<div class="cmp-sum">'+list.map(function(b,k){ return '<div class="'+(pts[k]===uniq[0]&&pts[k]&&!list[k].risk?"top":"")+'"><b>'+esc(b.issuer)+'</b><span class="st">'+(starsK(k)||"—")+'</span><span class="muted">Best on '+cnt[k]+' of '+nm+' measures'+(cnt[k]?': '+esc(wins[k].join(", ")):"")+'</span></div>'; }).join("")+'</div>'+
      '<p class="muted" style="margin:.4rem 0 .9rem">⭐ in a cell = best among these bonds on that measure. Stars on top rank the bonds by those wins, weighted by what you picked above ('+{bal:"balanced",safe:"safety first",inc:"higher income",liq:"easy to sell"}[CMPG]+'); a bond with risk flags gets at most one star. This is a quick comparison, not a rating or a recommendation.</p>';
    h+='<div class="cmp" style="grid-template-columns:170px repeat('+list.length+',minmax(170px,1fr))"><div class="hd"></div>'+list.map(function(b,k){return '<div class="hd">'+esc(b.issuer)+'<span class="isin">'+esc(b.isin)+cp(b.isin)+'</span>'+(starsK(k)?'<span class="st">'+starsK(k)+'</span>':'')+'</div>';}).join("");
    rows.forEach(function(r){ var w=WIN[r[0]]; h+='<div class="lab">'+r[0]+'</div>'+list.map(function(b,k){ var on=w&&w[k]; return '<div'+(on?' class="win"':'')+'>'+r[1](b)+(on?' <span class="wst" title="Best on this measure">⭐</span>':'')+'</div>';}).join(""); });
    var txt="Hello Sahare Wealth, I would like to compare these bonds:\n"+list.map(function(b){return "- "+b.issuer+" ("+b.isin+")";}).join("\n")+"\nPlease contact me.";
    box.innerHTML=h+'</div><div class="acts" style="margin-top:.9rem;align-items:center">'+waLink(txt,"Ask about these bonds","compare")+'<span class="muted">A higher yield often comes with higher risk, so read the rating and features too.</span></div>';
  }


  /* ---------- liquidity + bond-wise FAQ (SEO पानावरही हीच भाषा) ---------- */
  var LIQ={frequent:"Frequently traded",occasional:"Occasionally traded",rare:"Rarely traded"};
  function liqTxt(b){ var l=b.liq; if(!l) return ["–","Liquidity"]; return [LIQ[l.label]||"–","Traded "+l.days+" of "+l.of+" trading days"+(l.of<10?" (tracking since "+fd(l.since)+")":"")]; }
  function bondFaq(b){
    var nm=b.issuer+(b.coupon!=null?" "+b.coupon+"%":"")+" bond", q=[], mi=minInvest(b);
    q.push(["Is the "+nm+" secured?", b.secured==null?"Security details are not yet available from NSDL for this bond.":
      (b.secured?"Yes. NSDL lists it as secured":"No. NSDL lists it as unsecured")+(b.seniority?" and "+b.seniority.toLowerCase()+" in repayment":"")+"."+(b.assetCover?" The reported security cover is "+(b.assetCover/100).toFixed(1)+" times the amount owed.":"")+(b.guarantee?" It is backed by a guarantee from "+b.guarantee+".":"")]);
    q.push(["How often does it pay interest?", b.cumulative?"Interest is paid at maturity (cumulative).":"Interest is paid "+(b.freq!=null&&FREQ[b.freq]?FREQ[b.freq].toLowerCase():(b.freqText||"as per the issue terms").toLowerCase())+"."+(b.nextPay?" The next scheduled payment is on "+fd(b.nextPay.d)+".":"")]);
    q.push(["What is its credit rating?", (b.ratings||[]).length?b.ratings.map(function(r){return r.a+" rates it "+r.r+(r.o?" with "+r.o.toLowerCase()+" outlook":"")+(r.dt?" ("+fd(r.dt)+")":"");}).join("; ")+". Ratings can change; check the agency's latest rationale.":"No credit rating is reported on NSDL India Bond Info for this bond."]);
    q.push(["What is the minimum investment?", mi?"About "+inr(mi)+" for one bond (face value "+inr(b.face)+" at a price of "+n2(b.price)+" per ₹100), including accrued interest but before brokerage. Most listed bonds can be bought from one bond; confirm the lot size with your broker.":"The face value is not yet available for this bond."]);
    q.push(["Can it be redeemed early?", b.perp?"It is a perpetual bond with no fixed maturity; the issuer may call it and some perpetual bonds can be written down.":(b.callable?"Yes, the issuer has a call option"+(b.callDate&&/^\d{4}-/.test(b.callDate)?" on "+fd(b.callDate):"")+".":"No call option is reported.")+(b.putable?" Investors have a put option.":"")+(b.amortising?" Part of the principal is repaid before maturity.":"")]);
    if(b.liq) q.push(["How easy is it to sell?", LIQ[b.liq.label]+" on the exchange: it traded on "+b.liq.days+" of the last "+b.liq.of+" trading days we tracked. Rarely traded bonds can be hard to sell before maturity."]);
    return q;
  }

  /* ================= BOND DETAIL (modal) + PAYOUT SCHEDULE + PDF ================= */
  var SCHED=null, schedP=null, MD={b:null,units:1,tds:false,qy:null,view:"m"};
  function loadSched(){ if(!schedP) schedP=get("corp_schedules.json").then(function(j){ SCHED=(j&&j.schedules)||{}; return SCHED; },function(){ SCHED={}; return SCHED; }); return schedP; }
  function rows4(b){
    // NSDL schedule → तारखेनुसार एकत्र: [date, interest, principal]
    var raw=(SCHED&&SCHED[b.isin])||[], by={};
    raw.forEach(function(r){ var k=r[0]; by[k]=by[k]||[k,0,0]; if(r[2]==="R") by[k][2]+=r[1]; else by[k][1]+=r[1]; });
    return Object.keys(by).sort().map(function(k){ return by[k]; });
  }
  /* ---------- किंमत, accrued interest, खरी खरेदी रक्कम, quote ---------- */
  function addMonthsD(d,n){ var x=new Date(d.getTime()); var day=x.getDate(); x.setDate(1); x.setMonth(x.getMonth()+n); var last=new Date(x.getFullYear(),x.getMonth()+1,0).getDate(); x.setDate(Math.min(day,last)); return x; }
  function settleDate(){ var d=new Date(today); var n=SETTLE_DAYS; while(n>0){ d.setDate(d.getDate()+1); if(d.getDay()!==0&&d.getDay()!==6) n--; } return d; }
  function iso(d){ return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
  function accruedPerBond(b){
    // मागच्या व्याज-तारखेपासून settlement पर्यंतचं व्याज (Actual/365), 1 bond साठी
    if(!b.face||b.coupon==null||b.coupon===0||b.cumulative||!b.freq) return null;
    var st=settleDate(), step=12/b.freq, next=null;
    var rs=rows4(b).filter(function(r){return r[1]>0 && r[0]>=iso(st);});
    if(rs.length) next=new Date(rs[0][0]+"T00:00:00");
    else if(b.maturity){ next=new Date(b.maturity+"T00:00:00"); var k=0; while(addMonthsD(next,-step)>st && k<600){ next=addMonthsD(next,-step); k++; } }
    if(!next) return null;
    var last=addMonthsD(next,-step), days=Math.max(0,Math.round((st-last)/864e5));
    return {amt:b.face*b.coupon/100*days/365, days:days, from:iso(last), settle:iso(st)};
  }
  function fracAccrued(cpn,years,f){ var tNext=years-Math.floor(years*f-1e-9)/f; return cpn/f*(1-tNext*f); }
  function priceFromYield(yPct,cpn,years,f){
    if(!(years>0)||!(f>0)||cpn==null) return NaN;
    return priceAt(yPct/100,cpn,years,f)-fracAccrued(cpn,years,f);   // clean price प्रति ₹100
  }
  function canQuote(b){ return !b.perp && !b.cumulative && b.freq>0 && b.coupon!=null && b.years>0 && b.face; }
  function dealPrice(b){ // बाजारभाव किंवा distributor ने दिलेल्या yield वरचा भाव
    if(MD.qy!=null && canQuote(b)){ var p=priceFromYield(MD.qy,b.coupon,b.years,b.freq); if(isFinite(p)&&p>0) return p; }
    return b.price;
  }
  function dealYield(b){ return (MD.qy!=null&&canQuote(b)) ? MD.qy : b.ytm; }
  function costOf(b,units,price){
    if(!b.face||!price) return null;
    var clean=b.face*price/100*units, ac=accruedPerBond(b), acc=ac?ac.amt*units:0, stamp=(clean+acc)*STAMP_DUTY/100;
    return {clean:clean, acc:acc, ac:ac, stamp:stamp, total:clean+acc+stamp};
  }
  function minInvest(b){ var c=costOf(b,1,b.price); return c?c.total:null; }
  function tenureTxt(b){ if(b.perp||!(b.years>0)) return ""; var m=Math.round(b.years*12), y=Math.floor(m/12); m=m%12; return (y?y+" yr"+(y>1?"s":""):"")+(y&&m?" ":"")+(m?m+" month"+(m>1?"s":""):""); }
  function ytcOf(b,price){ if(!b.callable||!b.callDate||!/^\d{4}-/.test(b.callDate)||!(b.freq>0)) return null; var y=yrs(b.callDate); if(!(y>0)) return null; var v=ytmCalc(price,b.coupon,y,b.freq); return isFinite(v)?{y:v,d:b.callDate}:null; }
  function schedCalc(b){
    var rs=rows4(b), u=MD.units, t=MD.tds?TDS_RATE/100:0, out=[], ti=0, tp=0, yr={};
    rs.forEach(function(r,i){ var it=r[1]*(1-t)*u, pr=r[2]*u; ti+=it; tp+=pr; out.push({n:i+1,d:r[0],i:it,p:pr,t:it+pr}); var Y=r[0].slice(0,4); yr[Y]=yr[Y]||{y:Y,i:0,p:0,n:0}; yr[Y].i+=it; yr[Y].p+=pr; yr[Y].n++; });
    var years=Object.keys(yr).sort().map(function(k){ var x=yr[k]; x.t=x.i+x.p; return x; });
    return {rows:out, years:years, ti:ti, tp:tp, total:ti+tp};
  }
  function similar(b){
    var bk=bucket(b.rating);
    return S.corp.list.filter(function(x){ return x.isin!==b.isin && x.ytm!=null && !x.risk && (b.rating?bucket(x.rating)===bk:true) && Math.abs(x.years-b.years)<=2; })
      .sort(function(a,c){ return (c.turnover||0)-(a.turnover||0); }).slice(0,3);
  }
  function renderModal(){
    var b=MD.b; if(!b) return;
    var price=dealPrice(b), yld=dealYield(b), quoted=MD.qy!=null&&canQuote(b);
    var sc=schedCalc(b), hasS=sc.rows.length>0, c1=costOf(b,1,price), cU=costOf(b,MD.units,price), ytc=ytcOf(b,price);
    var hl=[[quoted?pct(yld):ytmTxt(b),quoted?"Quoted yield":"Yield"+(b.ytmEst?" (est.)":"")],[b.rating?esc(b.rating):"–","Rating"],[c1?inr(c1.total):"–","Cost of 1 bond (incl. accrued)"],[freqTxt(b),"Interest paid"],[matTxt(b),"Maturity"+(tenureTxt(b)?" · "+tenureTxt(b)+" left":"")],[b.secured==null?"–":(b.secured?"Secured":"Unsecured")+(b.seniority?" · "+esc(b.seniority):""),"Security"],[n2(price)+(price<99.5?" ↓":price>100.5?" ↑":""),"Price per ₹100"+(price<99.5?" · discount":price>100.5?" · premium":" · near par")]];
    if(ytc) hl.push([pct(ytc.y),"Yield to call ("+fd(ytc.d)+")"]);
    if(b.assetCover) hl.push([n2(b.assetCover/100,1)+"x","Security cover"]);
    if(b.liq){ var lq=liqTxt(b); hl.push([lq[0],lq[1]]); }
    var link=location.href.split("#")[0]+"#bond-"+b.isin;
    var h='<div class="md-hd"><div><h3 id="md-title">'+esc(b.issuer)+'</h3><div class="isin">ISIN '+esc(b.isin)+cp(b.isin)+' · coupon '+pct(b.coupon)+' · '+esc(b.exch||"")+' · last trade '+fd(b.tradeDate)+'</div>'+
      '<div class="share"><button type="button" class="btn" data-md="fav">'+(isFav(b)?"★ Saved":"☆ Save")+'</button><button type="button" class="btn" data-md="copy">Copy link</button>'+'<a class="btn" style="color:#fff" href="'+esc(waUrl("Have a look at this bond: "+b.issuer+" ("+b.isin+") — "+link))+'" target="_blank" rel="noopener" data-md-share="1">Share on WhatsApp</a></div></div>'+
      '<button type="button" class="md-x" data-md="close" aria-label="Close">×</button></div><div class="md-bd">'+
      '<div class="hl">'+hl.map(function(x){return '<div><b class="num">'+x[0]+'</b><span>'+x[1]+'</span></div>';}).join("")+'</div>'+
      (b.guarantee?'<div class="badge-g">🛡 Backed by: '+esc(b.guarantee)+'</div>':"")+tagsHtml(b);
    // निर्णयासाठी थोडक्यात
    var qt=quickTake(b);
    if(qt.length) h+='<div class="qtake"><h4>Quick take</h4><ul>'+qt.map(function(x){ return '<li class="'+(x[0]==="w"?"w":"")+'">'+x[1]+'</li>'; }).join("")+'</ul><p class="muted">Facts from today\'s prices, the G-Sec curve and bank FD rates — not a recommendation.</p></div>';
    // quote at yield (distributor)
    if(canQuote(b)) h+='<div class="quote"><label>Quote at yield (%)<input type="number" id="md-qy" step="0.01" min="0" value="'+(quoted?(+MD.qy).toFixed(2):(b.ytm!=null?b.ytm.toFixed(2):""))+'"></label>'+
      '<div class="qinfo">'+(quoted?'Quoted price <b>'+n2(price)+'</b> per ₹100 (market '+n2(b.price)+(b.ytm!=null?' at '+pct(b.ytm):'')+') · <button type="button" class="linkbtn" data-md="mkt">Use market price</button>':'Change the yield to quote a different price; the cost and PDF update.')+'</div></div>';
    // cost breakdown
    if(cU) h+='<div class="cost"><b style="color:var(--ink)">Estimated cost to buy '+MD.units+' bond'+(MD.units>1?"s":"")+'</b> <span class="muted">(settlement '+fd(cU.ac?cU.ac.settle:iso(settleDate()))+')</span><table>'+
      '<tr><td>Price '+n2(price)+' × face '+inr(b.face)+' × '+MD.units+'</td><td class="r num">'+inr2(cU.clean)+'</td></tr>'+
      '<tr><td>Accrued interest'+(cU.ac?' ('+cU.ac.days+' days since '+fd(cU.ac.from)+')':' (not available)')+'</td><td class="r num">'+inr2(cU.acc)+'</td></tr>'+
      '<tr><td>Stamp duty ('+STAMP_DUTY+'%)</td><td class="r num">'+inr2(cU.stamp)+'</td></tr>'+
      '<tr><td>Total payable (approx.)</td><td class="r num">'+inr2(cU.total)+'</td></tr></table>'+
      '<p class="muted" style="margin-top:.35rem">Excludes brokerage/platform charges. Actual accrued interest depends on the settlement date and issuer’s day-count; '+(b.amortising?'face value may already be partly repaid. ':'')+'confirm with your broker.</p></div>';
    // schedule
    h+='<div class="md-sec"><h4>Payout schedule</h4>';
    if(!SCHED){ h+='<p class="muted">Loading schedule…</p>'; }
    else if(!hasS){ h+='<p class="muted">'+(b.nsdl?"NSDL has not published a payout schedule for this bond.":"The payout schedule for this bond is being fetched from NSDL; please check again tomorrow.")+'</p>'; }
    else {
      var yv=MD.view==="y";
      h+='<div class="ps-bar"><label>Number of bonds<input type="number" id="md-units" min="1" step="1" value="'+MD.units+'"></label>'+
        '<div><div class="muted" style="margin-bottom:.25rem;font-weight:600;font-size:.8rem">Amounts</div><div class="tgl" role="group" aria-label="TDS"><button type="button" data-md="pre" aria-pressed="'+!MD.tds+'">Pre-TDS</button><button type="button" data-md="post" aria-pressed="'+MD.tds+'">Post-TDS ('+TDS_RATE+'%)</button></div></div>'+
        '<div><div class="muted" style="margin-bottom:.25rem;font-weight:600;font-size:.8rem">View</div><div class="tgl" role="group" aria-label="View"><button type="button" data-md="vm" aria-pressed="'+!yv+'">Each payout</button><button type="button" data-md="vy" aria-pressed="'+yv+'">By year</button></div></div>'+
        '<button type="button" class="btn solid" data-md="pdf">⬇ Download PDF</button><button type="button" class="btn" data-md="csv">CSV</button></div>'+
        '<div class="ps-sum"><div><b class="num">'+(cU?inr(cU.total):"–")+'</b><span>You pay (approx., incl. accrued)</span></div><div><b class="num">'+inr(sc.ti)+'</b><span>Total interest'+(MD.tds?" after TDS":"")+'</span></div><div><b class="num">'+inr(sc.tp)+'</b><span>Principal returned</span></div><div><b class="num">'+inr(sc.total)+'</b><span>Total you receive</span></div></div>'+
        '<div class="ps-wrap"><table>'+(yv?
          '<thead><tr><th>Year</th><th class="r">Payouts</th><th class="r">Interest</th><th class="r">Principal</th><th class="r">Total</th></tr></thead><tbody>'+sc.years.map(function(r){ return '<tr class="'+(r.p>0?"prin":"plain")+'"><td>'+r.y+'</td><td class="r">'+r.n+'</td><td class="r num">₹'+n2(r.i)+'</td><td class="r num">₹'+n2(r.p)+'</td><td class="r num"><b>₹'+n2(r.t)+'</b></td></tr>'; }).join(""):
          '<thead><tr><th>#</th><th>Date</th><th class="r">Interest</th><th class="r">Principal</th><th class="r">Total</th></tr></thead><tbody>'+sc.rows.map(function(r){ return '<tr class="'+(r.p>0?"prin":"plain")+'"><td>'+r.n+'</td><td>'+fd(r.d)+'</td><td class="r num">₹'+n2(r.i)+'</td><td class="r num">'+(r.p?"₹"+n2(r.p):"₹0")+'</td><td class="r num"><b>₹'+n2(r.t)+'</b></td></tr>'; }).join(""))+
        '</tbody></table></div><p class="muted" style="margin-top:.4rem">Per NSDL India Bond Info, for '+MD.units+' bond'+(MD.units>1?"s":"")+(MD.tds?"; interest shown after "+TDS_RATE+"% TDS (TDS may not apply in every case)":"")+'. Actual dates can shift for holidays; the issuer’s record date decides who is paid.</p>';
    }
    h+='</div>';
    h+='<div class="md-sec"><h4>Quick checklist</h4>'+checklistHtml(b)+'</div>';
    // alerts
    var mine=ALERTS.filter(function(a){return a.isin===b.isin;}), am=MD.alm||"ytm>=", cur=am.indexOf("ytm")===0?b.ytm:b.price;
    h+='<div class="md-sec" id="md-alert"><h4>🔔 Price / yield alert</h4><div class="alform"><label>Tell me when<select id="md-alm">'+Object.keys(AL_KIND).map(function(k){ return '<option value="'+k+'"'+(k===am?" selected":"")+'>'+AL_KIND[k]+'</option>'; }).join("")+'</select></label>'+
      '<label>Value ('+(am.indexOf("ytm")===0?"%":"per ₹100")+')<input type="number" id="md-alv" step="0.01" min="0" value="'+esc(MD.alv!=null?MD.alv:(cur!=null?(am.indexOf("ytm")===0?(cur+(am==="ytm>="?0.25:-0.25)):(cur+(am==="price>="?0.5:-0.5))).toFixed(2):""))+'"></label>'+
      '<button type="button" class="btn solid" data-md="al-add">Save alert</button><span class="muted">Now: '+(cur==null?"–":(am.indexOf("ytm")===0?pct(cur):n2(cur)))+'</span></div><div class="bc-msg" id="md-almsg">'+esc(MD.almsg||"")+'</div>'+
      (mine.length?'<ul class="allist">'+mine.map(function(a){ return '<li>'+esc(alTxt(a))+' <span class="muted">· set '+fd(a.at)+'</span> '+(alMet(a)?'<span class="tag g">Met</span>':'')+' <button type="button" class="ic" data-al-del="'+esc(a.id)+'" aria-label="Delete alert">×</button></li>'; }).join("")+'</ul>':'')+
      '<p class="muted">Saved in this browser only; we check it whenever you open this page. For a reminder from us, '+'<a href="'+esc(waUrl("Hello Sahare Wealth, please alert me about "+b.issuer+" ("+b.isin+") when the "+(am.indexOf("ytm")===0?"yield":"price")+" reaches "+(MD.alv||"___")+"."))+'" target="_blank" rel="noopener">message us on WhatsApp</a>.</p></div>';
    h+='<div class="md-sec"><h4>Price history</h4>'+priceChart(b)+'</div>';
    h+='<div class="md-sec"><h4>Ratings, features &amp; issuer</h4>'+detailHtml(b)+'</div>';
    h+='<div class="md-sec faq"><h4>About this bond</h4>'+bondFaq(b).map(function(x){return '<details><summary>'+esc(x[0])+'</summary><p>'+esc(x[1])+'</p></details>';}).join("")+'</div>';
    var sim=similar(b);
    if(sim.length) h+='<div class="md-sec"><h4>Similar bonds</h4><div class="sim">'+sim.map(function(x){ return '<button type="button" data-md-open="'+esc(x.isin)+'"><b>'+esc(x.issuer)+'</b><small>'+(x.rating?esc(x.rating)+" · ":"")+"Yield "+ytmTxt(x)+" · "+matTxt(x)+'</small></button>'; }).join("")+'</div></div>';
    h+='<div class="md-sec acts" style="align-items:center">'+waBond(b)+'<button type="button" class="btn" data-calc="'+esc(b.isin)+'">Open in calculator</button>'+(BOND_PAGE_BASE?'<a class="btn" href="'+esc(BOND_PAGE_BASE+b.isin+"/")+'" target="_blank" rel="noopener">Bond page ↗</a>':"")+'<span class="muted">Information only, not a recommendation.</span></div></div>';
    patchBox(h);
  }
  /* Popup पुन्हा काढताना: ज्या box मध्ये टाइप चालू आहे तो तसाच ठेवतो, फक्त बदललेले भाग बदलतो.
     (नाहीतर प्रत्येक अक्षरानंतर box नवा बनतो → mobile चा keyboard बंद होतो, आकडा टाकता येत नाही.) */
  function patchNode(oldP,newP,act){
    var o=oldP.children, n=newP.children;
    if(o.length!==n.length){ oldP.innerHTML=newP.innerHTML; return; }
    for(var i=o.length-1;i>=0;i--){
      var a=o[i], b=n[i];
      if(a===act) continue;                                   // टाइप होत असलेला box: हात लावत नाही
      if(act&&a.contains(act)){ if(a.tagName===b.tagName) patchNode(a,b,act); continue; }
      if(a.outerHTML!==b.outerHTML) oldP.replaceChild(b.cloneNode(true),a);
    }
  }
  function patchBox(h){
    var box=$("md-box"), act=document.activeElement;
    if(!act||!box.contains(act)||!/^(INPUT|SELECT|TEXTAREA)$/.test(act.tagName)||!act.id){ box.innerHTML=h; return; }
    var t=document.createElement("div"); t.innerHTML=h;
    if(!t.querySelector("#"+act.id)){ box.innerHTML=h; return; }
    patchNode(box,t,act);
  }
  function inr2(v){ return (typeof v==="number"&&isFinite(v)) ? "₹"+v.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}) : "–"; }
  function openBond(isin,push){
    var b=S.corp&&S.corp.list.find(function(x){return x.isin===isin;}); if(!b) return;
    MD.b=b; MD.units=1; MD.qy=null; MD.pdays=90; MD.alv=null; MD.almsg=""; MD.alm=MD.alm||"ytm>="; $("md").classList.add("on"); document.body.style.overflow="hidden";
    renderModal(); loadSched().then(renderModal); loadPrices().then(function(){ if(MD.b===b) renderModal(); });
    if(!S.corp.full) loadDetails().then(function(){ if(MD.b===b) renderModal(); });
    if(push&&history.replaceState) history.replaceState(null,"","#bond-"+isin);
    track("bond_details",{isin:isin});
    setTimeout(function(){ var x=root.querySelector(".md-x"); if(x) x.focus();
      if(MD.goAlert){ MD.goAlert=false; var al=$("md-alert"); if(al){ al.scrollIntoView({block:"start"}); var v=$("md-alv"); if(v) v.focus({preventScroll:true}); } } },60);
  }
  function closeBond(){ $("md").classList.remove("on"); document.body.style.overflow=""; MD.b=null; if(history.replaceState){ var fq=curTab==="corp"?filterQuery():""; history.replaceState(null,"",hashReady?"#bonds-"+curTab+(fq?"?"+fq:""):location.href.split("#")[0]); } }
  var mdDown=null;
  $("md").addEventListener("pointerdown",function(e){ mdDown=e.target; },true);
  $("md").addEventListener("click",function(e){
    if(e.target===$("md")){ if(mdDown===$("md")) closeBond(); return; }   // बाहेरच दाबून बाहेरच सोडलं तरच बंद (आतून ओढत बाहेर गेलं तर नाही)
    var a=e.target.closest("[data-md]"), o=e.target.closest("[data-md-open]"), c=e.target.closest("[data-calc]");
    if(o){ openBond(o.getAttribute("data-md-open"),true); $("md").scrollTop=0; return; }
    var pd=e.target.closest("[data-md-pd]"); if(pd){ var st=$("md").scrollTop; MD.pdays=+pd.getAttribute("data-md-pd"); renderModal(); $("md").scrollTop=st; return; }
    if(c){ var i=c.getAttribute("data-calc"); closeBond(); fillCalc(i); showTab("calc",true); return; }
    if(e.target.closest("[data-md-share]")) track("bond_share",{isin:MD.b&&MD.b.isin});
    var ad=e.target.closest("[data-al-del]"); if(ad){ delAlert(ad.getAttribute("data-al-del")); MD.almsg="Alert deleted."; renderModal(); renderMy(); checkAlerts(); S.sig=null; renderCorp(); return; }
    if(!a) return;
    var k=a.getAttribute("data-md");
    if(k==="close") closeBond();
    else if(k==="pre"||k==="post"){ MD.tds=k==="post"; renderModal(); }
    else if(k==="vm"||k==="vy"){ MD.view=k==="vy"?"y":"m"; renderModal(); }
    else if(k==="mkt"){ MD.qy=null; renderModal(); }
    else if(k==="fav"){ toggleFav(MD.b.isin); }
    else if(k==="al-add"){ var m=MD.alm||"ytm>=", v=parseFloat($("md-alv").value), er=addAlert(MD.b,m.replace(/[<>]=$/,""),m.slice(-2),v); MD.almsg=er||(alMet(ALERTS[ALERTS.length-1])?"Alert saved — already met at today's price.":"Alert saved."); if(!er) MD.alv=null; renderModal(); renderMy(); checkAlerts(); S.sig=null; renderCorp(); }
    else if(k==="pdf") pdfSchedule();
    else if(k==="csv") csvSchedule();
    else if(k==="copy"){ var l=location.href.split("#")[0]+"#bond-"+MD.b.isin; try{ navigator.clipboard.writeText(l).then(function(){ a.textContent="Link copied"; }); }catch(err){ prompt("Copy this link",l); } track("bond_share",{isin:MD.b.isin,via:"copy"}); }
  });
  $("md").addEventListener("input",function(e){
    var id=e.target.id; if(id==="md-alv"){ MD.alv=e.target.value; MD.almsg=""; return; }
    if(id==="md-alm"){ MD.alm=e.target.value; MD.alv=null; renderModal(); return; }
    if(id!=="md-units"&&id!=="md-qy") return;
    if(id==="md-units") MD.units=Math.max(1,Math.floor(+e.target.value||1));
    else { var q=parseFloat(e.target.value); if(!isFinite(q)||q<=0||q>40) return; MD.qy=(MD.b&&MD.b.ytm!=null&&Math.abs(q-MD.b.ytm)<0.005)?null:q; track("bond_quote_yield",{isin:MD.b.isin}); }
    renderModal();   // patchBox: टाइप होत असलेला box तसाच राहतो
  });
  // box सोडल्यावर (blur) रिकामा/चुकीचा आकडा नीट करून दाखवतो
  $("md").addEventListener("change",function(e){ var id=e.target.id; if(id==="md-units") e.target.value=MD.units; else if(id==="md-qy"&&MD.b){ var v=MD.qy!=null?MD.qy:MD.b.ytm; if(v!=null) e.target.value=(+v).toFixed(2); } });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&$("md").classList.contains("on")) closeBond(); });

  function fileName(b,ext){ return (MD.qy!=null?"Quote_":"")+"Payout-Schedule_"+b.isin+"_"+MD.units+"-bond"+(MD.units>1?"s":"")+"_"+(MD.tds?"post":"pre")+"-TDS."+ext; }
  function csvSchedule(){
    var b=MD.b, sc=schedCalc(b), lines=[["#","Date","Interest","Principal","Total"].join(",")];
    sc.rows.forEach(function(r){ lines.push([r.n,r.d,r.i.toFixed(2),r.p.toFixed(2),r.t.toFixed(2)].join(",")); });
    lines.push(["","Total",sc.ti.toFixed(2),sc.tp.toFixed(2),sc.total.toFixed(2)].join(","));
    var a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([lines.join("\n")],{type:"text/csv"})); a.download=fileName(b,"csv"); document.body.appendChild(a); a.click(); a.remove();
    track("bond_schedule_csv",{isin:b.isin});
  }
  var pdfLib=null;
  function loadScript(src){ return new Promise(function(ok,no){ var s=document.createElement("script"); s.src=src; s.async=true; s.onload=ok; s.onerror=no; document.head.appendChild(s); }); }
  var logoP=null;
  function loadLogo(){
    if(!logoP) logoP=fetch(ASSETS+"logo.png").then(function(r){ if(!r.ok) throw 0; return r.blob(); }).then(function(bl){
      return new Promise(function(ok){ var fr=new FileReader(); fr.onload=function(){ LOGO=fr.result; ok(); }; fr.onerror=function(){ ok(); }; fr.readAsDataURL(bl); });
    }).catch(function(){ logoP=null; });   // logo नाही मिळाला तरी PDF बनतो (logo शिवाय)
    return logoP;
  }
  function getPdfLib(){
    if(!pdfLib) pdfLib=loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
      .then(function(){ return loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"); })
      .then(function(){ return window.jspdf.jsPDF; });
    return pdfLib;
  }
  function rs(v){ return "Rs. "+(Math.round(v*100)/100).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function pdfSchedule(){
    var b=MD.b, btn=root.querySelector('[data-md="pdf"]'); if(btn){ btn.disabled=true; btn.textContent="Preparing PDF…"; }
    Promise.all([getPdfLib(),loadLogo(),loadDetails()]).then(function(all){
      var jsPDF=all[0];
      var sc=schedCalc(b), price=dealPrice(b), yld=dealYield(b), quoted=MD.qy!=null&&canQuote(b), cU=costOf(b,MD.units,price);
      var doc=new jsPDF({unit:"mm",format:"a4"}), W=210, CX=105, NAVY=[33,45,69], GOLD=[248,181,38], HB=38;
      function header(){
        doc.setFillColor(255,255,255); doc.rect(0,0,W,HB,"F");
        try{ if(LOGO) doc.addImage(LOGO,"PNG",CX-12,4,24,15.5); }catch(e){}
        doc.setTextColor(NAVY[0],NAVY[1],NAVY[2]); doc.setFont("helvetica","bold"); doc.setFontSize(15); doc.text(BRAND,CX,26,{align:"center"});
        doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(90,96,110); doc.text(BRAND_LINE,CX,32,{align:"center"});
        doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]); doc.rect(0,HB-2,W,1.6,"F");
      }
      header();
      doc.setTextColor(NAVY[0],NAVY[1],NAVY[2]); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(quoted?"Bond Quote & Payout Schedule":"Bond Payout Schedule",CX,46,{align:"center"});
      doc.setFontSize(10.5); var nm=doc.splitTextToSize(b.issuer,186); doc.text(nm,CX,53,{align:"center"});
      var y0=53+nm.length*5;
      var info=[["ISIN",b.isin],["Coupon",(b.coupon!=null?b.coupon+"%":"-")+" | "+(b.freq!=null&&FREQ[b.freq]?FREQ[b.freq]:(b.freqText||"-"))],["Maturity",(b.perp?"Perpetual":fd(b.maturity))+(tenureTxt(b)?"  ("+tenureTxt(b)+" left)":"")],["Rating",b.rating?b.rating+((b.ratings[0]&&b.ratings[0].a)?" ("+b.ratings.map(function(r){return r.a;}).join(", ")+")":""):"Not available"],
        [quoted?"Quoted yield / price":"Yield / price",(yld!=null?(+yld).toFixed(2)+"%":"-")+"  at  "+n2(price)+" per 100"+(quoted?"":" (last trade "+fd(b.tradeDate)+")")],
        ["Number of bonds",String(MD.units)+(b.face?"  (face value "+rs(b.face).replace(".00","")+" each)":"")]];
      if(cU){ info.push(["Principal amount",rs(cU.clean)]); info.push(["Accrued interest",rs(cU.acc)+(cU.ac?"  ("+cU.ac.days+" days, settlement "+fd(cU.ac.settle)+")":"")]); info.push(["Stamp duty ("+STAMP_DUTY+"%)",rs(cU.stamp)]); info.push(["Total payable (approx.)",rs(cU.total)]); }
      info.push(["Amounts shown",MD.tds?"Post-TDS: interest after "+TDS_RATE+"% TDS":"Pre-TDS (before any tax deduction)"]);
      doc.autoTable({startY:y0,body:info,theme:"plain",styles:{fontSize:9,cellPadding:1.1,textColor:[60,64,72]},columnStyles:{0:{fontStyle:"bold",cellWidth:46,textColor:NAVY}},
        didParseCell:function(d){ if(d.section==="body"&&/^Total payable/.test(info[d.row.index][0])){ d.cell.styles.fontStyle="bold"; d.cell.styles.textColor=NAVY; } },margin:{left:12,right:12,top:HB+4}});
      var sum=[["Total interest"+(MD.tds?" (after TDS)":""),rs(sc.ti)],["Principal returned",rs(sc.tp)],["Total you receive",rs(sc.total)]];
      doc.autoTable({startY:doc.lastAutoTable.finalY+3,body:[sum.map(function(x){return x[0]+"\n"+x[1];})],theme:"grid",styles:{fontSize:9.5,halign:"center",fontStyle:"bold",textColor:NAVY,fillColor:[255,244,214],lineColor:[240,217,168]},margin:{left:12,right:12,top:HB+4}});
      var right=function(d){ if(d.column.index>=1) d.cell.styles.halign="right"; };
      if(sc.years.length>1){
        doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(NAVY[0],NAVY[1],NAVY[2]); doc.text("Year-wise summary",12,doc.lastAutoTable.finalY+8);
        doc.autoTable({startY:doc.lastAutoTable.finalY+10,head:[["Year","Payouts","Interest","Principal","Total"]],body:sc.years.map(function(r){return [r.y,r.n,rs(r.i),rs(r.p),rs(r.t)];}),
          theme:"striped",headStyles:{fillColor:NAVY,textColor:255},styles:{fontSize:8.8,cellPadding:1.5},didParseCell:right,margin:{left:12,right:12,top:HB+4,bottom:30},didDrawPage:function(){ header(); }});
      }
      doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(NAVY[0],NAVY[1],NAVY[2]);
      var yT=doc.lastAutoTable.finalY+8; if(yT>255){ doc.addPage(); header(); yT=HB+8; } doc.text("Payout schedule",12,yT);
      doc.autoTable({startY:yT+2,head:[["#","Date","Interest","Principal","Total"]],
        body:sc.rows.map(function(r){ return [r.n,fd(r.d),rs(r.i),rs(r.p),rs(r.t)]; }),
        foot:[["","Total",rs(sc.ti),rs(sc.tp),rs(sc.total)]],
        theme:"striped",headStyles:{fillColor:NAVY,textColor:255},footStyles:{fillColor:[242,245,247],textColor:NAVY,fontStyle:"bold"},
        styles:{fontSize:9,cellPadding:1.8},columnStyles:{0:{cellWidth:10},4:{fontStyle:"bold"}},
        didParseCell:function(d){ if(d.column.index>=2) d.cell.styles.halign="right"; if(d.section==="body"&&sc.rows[d.row.index]&&sc.rows[d.row.index].p>0) d.cell.styles.fillColor=[255,250,240]; },
        margin:{left:12,right:12,top:HB+4,bottom:30},didDrawPage:function(){ header(); }});
      var disc=(quoted?"Price is quoted at the yield shown and is indicative; the final price is confirmed at the time of the deal. ":"")+"Information only, not investment advice or a recommendation. Schedule as published on NSDL India Bond Info (data as of "+fd(S.corp?S.corp.pricesAsOf:"")+"); actual payment dates and amounts depend on the issuer, record dates and holidays. Accrued interest and stamp duty are estimates; brokerage is extra. TDS treatment depends on your situation. Bonds carry credit, interest-rate and liquidity risk. Please read the offer document and consult a SEBI-registered investment adviser before investing. "+ARN_TEXT;
      var pages=doc.getNumberOfPages();
      for(var p=1;p<=pages;p++){
        doc.setPage(p); doc.setDrawColor(223,228,234); doc.line(12,274,198,274);
        doc.setFontSize(7); doc.setTextColor(110,115,125); doc.setFont("helvetica","normal");
        doc.text(doc.splitTextToSize(disc,186),12,278);
        doc.text("Generated "+new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})+"  |  Page "+p+" of "+pages,198,293,{align:"right"});
      }
      doc.save(fileName(b,"pdf"));
      track("bond_schedule_pdf",{isin:b.isin,units:MD.units,tds:MD.tds,quoted:quoted});
    }).catch(function(){ printFallback(); }).then(function(){ var bt=root.querySelector('[data-md="pdf"]'); if(bt){ bt.disabled=false; bt.textContent="⬇ Download PDF"; } });
  }
  function printFallback(){
    // PDF library लोड झाली नाही तर: branded पान उघडून browser चं "Save as PDF"
    var b=MD.b, sc=schedCalc(b), w=window.open("","_blank"); if(!w) return;
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+esc(fileName(b,"pdf"))+'</title><style>body{font-family:Arial,sans-serif;color:#212d45;margin:24px}table{border-collapse:collapse;width:100%;font-size:12px}th{background:#212d45;color:#fff}th,td{padding:5px 8px;border-bottom:1px solid #ddd;text-align:right}th:nth-child(-n+2),td:nth-child(-n+2){text-align:left}.hd{text-align:center;border-bottom:3px solid #f8b526;padding-bottom:8px}.s{font-size:10px;color:#666;margin-top:14px}</style></head><body>'+
      '<div class="hd"><img src="'+esc(ASSETS+"logo.png")+'" height="56" alt=""><div><b style="font-size:20px;display:block">'+esc(BRAND)+'</b><div style="font-size:11px;color:#555">'+esc(BRAND_LINE)+'</div></div></div><h2>Bond Payout Schedule</h2><p><b>'+esc(b.issuer)+'</b><br>ISIN '+esc(b.isin)+' · '+MD.units+' bond(s) · '+(MD.tds?"Post-TDS "+TDS_RATE+"%":"Pre-TDS")+'</p>'+
      '<table><thead><tr><th>#</th><th>Date</th><th>Interest</th><th>Principal</th><th>Total</th></tr></thead><tbody>'+sc.rows.map(function(r){return "<tr><td>"+r.n+"</td><td>"+fd(r.d)+"</td><td>"+rs(r.i)+"</td><td>"+rs(r.p)+"</td><td>"+rs(r.t)+"</td></tr>";}).join("")+'<tr><td></td><td><b>Total</b></td><td><b>'+rs(sc.ti)+'</b></td><td><b>'+rs(sc.tp)+'</b></td><td><b>'+rs(sc.total)+'</b></td></tr></tbody></table>'+
      '<p class="s">Information only, not investment advice. Schedule as published on NSDL India Bond Info. '+esc(ARN_TEXT)+'</p><script>setTimeout(function(){print()},300)<\/script></body></html>');
    w.document.close();
  }


  /* ================= S3 INCOME PLANNER ================= */
  var MON3=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function months12(){ var a=[], d=new Date(today.getFullYear(),today.getMonth(),1); for(var i=0;i<12;i++){ a.push(d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)); d.setMonth(d.getMonth()+1); } return a; }
  function profile(b,keys){ // पुढच्या 12 महिन्यांत 1 bond चं महिनानिहाय व्याज
    var m={}; keys.forEach(function(k){ m[k]=0; });
    rows4(b).forEach(function(r){ var k=r[0].slice(0,7); if(k in m) m[k]+=r[1]; });
    return keys.map(function(k){ return m[k]; });
  }
  function runPlanner(){
    var out=$("pl-out");
    if(!S.corp){ out.innerHTML='<p class="muted">Bond data is not loaded yet.</p>'; return; }
    if(!SCHED){ out.innerHTML='<p class="muted">Loading payout schedules…</p>'; loadSched().then(runPlanner); return; }
    var T=Math.max(1000,+$("pl-t").value||10000), maxRank=+$("pl-r").value, maxY=+$("pl-y").value, N=+$("pl-n").value, sec=$("pl-sec").checked, psu=$("pl-psu").checked, keys=months12();
    var cand=S.corp.list.filter(function(b){ return !b.risk && b.rankN<=maxRank && b.years>=1 && b.years<=maxY && b.face && b.price && b.freq>0 && !b.cumulative && !b.amortising && !b.callable && (!sec||b.secured===true) && (!psu||b.psu===true) && (SCHED[b.isin]||[]).length; })
      .map(function(b){ var pr=profile(b,keys), ann=pr.reduce(function(a,x){return a+x;},0), c=costOf(b,1,b.price); return {b:b,pr:pr,ann:ann,cost:c?c.total:b.face*b.price/100}; })
      .filter(function(x){ return x.ann>0; });
    // एकाच rating गटाच्या मध्यम yield पेक्षा 2% पेक्षा जास्त yield = बहुधा जुना/विचित्र व्यवहार किंवा जास्त धोका → वगळतो
    var byB={}; S.corp.list.forEach(function(b){ if(b.ytm!=null&&!b.ytmEst&&b.rating){ (byB[bucket(b.rating)]=byB[bucket(b.rating)]||[]).push(b.ytm); } });
    var medB={}; Object.keys(byB).forEach(function(k){ var a=byB[k].sort(function(x,y){return x-y;}); medB[k]=a[Math.floor(a.length/2)]; });
    cand=cand.filter(function(x){ var m=medB[bucket(x.b.rating)]; return x.b.ytm!=null && (m==null || x.b.ytm<=m+2); });
    if(cand.length<2){ out.innerHTML='<p class="muted" style="padding:1rem 0">Not enough bonds match these rules today. Try a lower minimum rating or a longer maturity.</p>'; return; }
    var cover=keys.map(function(){return 0;}), chosen=[], used={};
    for(var k=0;k<N;k++){
      var minC=Math.min.apply(null,cover), best=null, bestS=-1;
      cand.forEach(function(x){
        var iss=(x.b.issuer||"").toUpperCase(); if(used[iss]) return;
        var gain=x.pr.reduce(function(a,v,i){ return a+(v>0&&cover[i]===minC?1:0); },0);
        var sc=gain*10+(x.b.ytm||0)*0.5+Math.log10((x.b.turnover||0)+10)*0.6+(x.b.liq&&x.b.liq.label==="frequent"?1:0);
        if(sc>bestS){ bestS=sc; best=x; }
      });
      if(!best) break;
      chosen.push(best); used[(best.b.issuer||"").toUpperCase()]=1; best.pr.forEach(function(v,i){ if(v>0) cover[i]++; });
    }
    var share=12*T/chosen.length, tot=keys.map(function(){return 0;}), inv=0, annual=0;
    chosen.forEach(function(x){ x.u=Math.max(1,Math.ceil(share/x.ann)); x.inv=x.cost*x.u; inv+=x.inv; annual+=x.ann*x.u; x.pr.forEach(function(v,i){ tot[i]+=v*x.u; }); });
    var mx=Math.max.apply(null,tot.concat([T]))*1.1, low=Math.min.apply(null,tot);
    function payMonths(x){ if(x.b.freq===12) return "Every month"; var m=[]; x.pr.forEach(function(v,i){ if(v>0) m.push(MON3[+keys[i].slice(5)-1]); }); return m.join(", ")||"–"; }
    var h='<div class="ps-sum"><div><b class="num">'+inr(inv)+'</b><span>Approx. amount needed (incl. accrued)</span></div><div><b class="num">'+inr(annual/12)+'</b><span>Average per month, before tax</span></div><div><b class="num">'+inr(low)+'</b><span>Lowest month in the next 12</span></div><div><b class="num">'+(inv?pct(annual/inv*100):"–")+'</b><span>Interest ÷ amount (yearly)</span></div></div>';
    h+='<div class="bars12">'+tot.map(function(v){ return '<i class="'+(v<T*0.9?"lo":"")+'" style="height:'+(v/mx*100).toFixed(1)+'%" title="₹'+Math.round(v).toLocaleString("en-IN")+'"></i>'; }).join("")+'<span class="tgt" style="bottom:'+(T/mx*100).toFixed(1)+'%"></span></div><div class="m12">'+keys.map(function(k){return MON3[+k.slice(5)-1];}).join("</div><div>").replace(/^/,"<div>")+'</div></div>';
    h+='<p class="muted">Bars = interest received each month (before TDS). Dashed line = your target. Amber bars fall short of the target by more than 10%.</p>';
    h+='<div class="tw" style="margin-top:.8rem"><table><thead><tr><th>Bond</th><th>Rating</th><th class="r">Yield</th><th>Pays in</th><th class="r">Bonds</th><th class="r">Amount</th><th class="r">Interest / yr</th></tr></thead><tbody>'+
      chosen.map(function(x){ return '<tr class="plain"><td class="iss"><button type="button" class="linkbtn" data-pl-open="'+esc(x.b.isin)+'">'+esc(x.b.issuer)+'</button><span class="isin">'+esc(x.b.isin)+cp(x.b.isin)+' · matures '+fd(x.b.maturity)+'</span></td><td>'+ratingPill(x.b)+'</td><td class="r num">'+ytmTxt(x.b)+'</td><td style="white-space:normal">'+payMonths(x)+'</td><td class="r num">'+x.u+'</td><td class="r num">'+inr(x.inv)+'</td><td class="r num">'+inr(x.ann*x.u)+'</td></tr>'; }).join("")+
      '</tbody></table></div>';
    var txt="Hello Sahare Wealth, I tried the Income Planner for about ₹"+T.toLocaleString("en-IN")+" a month ("+$("pl-r").selectedOptions[0].text+", up to "+maxY+" years). It showed:\n"+chosen.map(function(x){return "- "+x.b.issuer+" ("+x.b.isin+") x "+x.u;}).join("\n")+"\nApprox. amount "+inr(inv)+". Please contact me to discuss.";
    h+='<div class="acts" style="margin-top:.9rem;align-items:center">'+waLink(txt,"Discuss this with us","planner")+'<span class="muted">Amounts use the last traded price; interest is before TDS and tax. Bonds that are callable, part-repaid, unrated or carry risk flags are left out.</span></div>';
    out.innerHTML=h; track("income_planner",{target:T,bonds:chosen.length});
  }
  /* ---------- Bond ladder: दर वर्षी एक bond maturity ला — पैसे टप्प्याटप्प्याने परत ---------- */
  var PLM="inc";
  function setPlMode(m){
    PLM=m; root.querySelectorAll("[data-plm]").forEach(function(b){ b.setAttribute("aria-pressed",b.getAttribute("data-plm")===m); });
    root.querySelectorAll("[data-pl]").forEach(function(l){ l.hidden=l.getAttribute("data-pl")!==m; });
    $("pl-help").textContent=m==="lad"?"Splits your money equally across bonds that mature one after another, about one a year. Each year one bond repays, which you can spend or reinvest at the then-current rate.":"Picks bonds that pay in different months so the interest adds up to a steady monthly amount.";
    $("pl-out").innerHTML="";
  }
  root.querySelectorAll("[data-plm]").forEach(function(b){ b.addEventListener("click",function(){ setPlMode(b.getAttribute("data-plm")); }); });
  var DEF_P=snap(["pl-t","pl-amt","pl-rungs","pl-r","pl-y","pl-n","pl-sec","pl-psu"]);
  $("pl-reset").addEventListener("click",function(){ restore(DEF_P); setPlMode("inc"); track("bond_reset",{tab:"plan"}); });
  function runLadder(){
    var out=$("pl-out");
    if(!S.corp){ out.innerHTML='<p class="muted">Bond data is not loaded yet.</p>'; return; }
    var A=Math.max(50000,+$("pl-amt").value||1000000), R=+$("pl-rungs").value, maxRank=+$("pl-r").value, sec=$("pl-sec").checked, psu=$("pl-psu").checked;
    var byB={}; S.corp.list.forEach(function(b){ if(b.ytm!=null&&!b.ytmEst&&b.rating){ (byB[bucket(b.rating)]=byB[bucket(b.rating)]||[]).push(b.ytm); } });
    var medB={}; Object.keys(byB).forEach(function(k){ var a=byB[k].sort(function(x,y){return x-y;}); medB[k]=a[Math.floor(a.length/2)]; });
    var pool=S.corp.list.filter(function(b){ var m=medB[bucket(b.rating)]; return !b.risk && b.rankN<=maxRank && b.face && b.price && b.ytm!=null && !b.ytmEst && !b.perp && !b.callable && !b.amortising && (!sec||b.secured===true) && (!psu||b.psu===true) && (m==null||b.ytm<=m+2); });
    var per=A/R, rungs=[], used={};
    for(var k=1;k<=R;k++){
      var lo=k===1?0.25:k-0.5, hi=k+0.5, best=null, bs=-1;
      pool.forEach(function(b){
        if(!(b.years>lo&&b.years<=hi)) return; var iss=(b.issuer||"").toUpperCase(); if(used[iss]) return;
        var sc=b.ytm*1+Math.log10((b.turnover||0)+10)*0.8+(b.liq&&b.liq.label==="frequent"?1.5:0)+(b.secured?0.3:0)-Math.abs(b.years-k)*0.6;
        if(sc>bs){ bs=sc; best=b; }
      });
      if(best){ used[(best.issuer||"").toUpperCase()]=1; var c=costOf(best,1,best.price), one=c?c.total:best.face*best.price/100, u=Math.max(1,Math.round(per/one)); rungs.push({k:k,b:best,u:u,inv:one*u,back:best.face*u,int:best.face*(best.coupon||0)/100*u}); }
      else rungs.push({k:k,b:null});
    }
    var got=rungs.filter(function(r){return r.b;});
    // round करून रक्कम 2% पेक्षा जास्त वाढली तर सर्वात मोठ्या टप्प्यातून एक-एक bond कमी करतो
    for(var g=0; g<50; g++){ var tot=got.reduce(function(a,r){return a+r.inv;},0); if(tot<=A*1.02) break; var big=got.filter(function(r){return r.u>1;}).sort(function(a,c){return c.inv-a.inv;})[0]; if(!big) break; var one1=big.inv/big.u; big.u--; big.inv=one1*big.u; big.back=big.b.face*big.u; big.int=big.b.face*(big.b.coupon||0)/100*big.u; }
    if(got.length<2){ out.innerHTML='<p class="muted" style="padding:1rem 0">Not enough bonds match these rules to build a ladder today. Try a lower minimum rating, untick "Secured" or "PSU", or a shorter ladder.</p>'; return; }
    var inv=0, back=0, intY=0, wy=0; got.forEach(function(r){ inv+=r.inv; back+=r.back; intY+=r.int; wy+=r.b.ytm*r.inv; });
    var mx=Math.max.apply(null,got.map(function(r){return r.back;}))*1.1;
    var h='<div class="ps-sum"><div><b class="num">'+inr(inv)+'</b><span>Approx. amount used (incl. accrued)</span></div><div><b class="num">'+pct(wy/inv)+'</b><span>Average yield (weighted)</span></div><div><b class="num">'+inr(intY)+'</b><span>Interest per year, before tax</span></div><div><b class="num">'+inr(back)+'</b><span>Face value returned over '+R+' years</span></div></div>';
    h+='<div class="bars12" style="grid-template-columns:repeat('+R+',1fr)">'+rungs.map(function(r){ return '<i style="height:'+(r.b?(r.back/mx*100).toFixed(1):0)+'%" title="'+(r.b?inr(r.back):"No bond")+'"></i>'; }).join("")+'</div><div class="m12" style="grid-template-columns:repeat('+R+',1fr)">'+rungs.map(function(r){ return '<span>Year '+r.k+'</span>'; }).join("")+'</div>';
    h+='<p class="muted">Bars = money returned when each bond matures. Rungs without a matching bond are left empty; keep that share in a deposit or a liquid fund.</p>';
    h+='<div class="tw" style="margin-top:.8rem"><table><thead><tr><th>Rung</th><th>Bond</th><th>Rating</th><th class="r">Yield</th><th>Matures</th><th class="r">Bonds</th><th class="r">Amount</th><th class="r">Returned</th></tr></thead><tbody>'+
      rungs.map(function(r){ if(!r.b) return '<tr class="plain"><td>Year '+r.k+'</td><td colspan="7" class="muted">No bond matches these rules for this year</td></tr>';
        return '<tr class="plain"><td>Year '+r.k+'</td><td class="iss"><button type="button" class="linkbtn" data-pl-open="'+esc(r.b.isin)+'">'+esc(r.b.issuer)+'</button><span class="isin">'+esc(r.b.isin)+cp(r.b.isin)+' · '+freqTxt(r.b)+' interest</span></td><td>'+ratingPill(r.b)+'</td><td class="r num">'+ytmTxt(r.b)+'</td><td>'+fd(r.b.maturity)+'</td><td class="r num">'+r.u+'</td><td class="r num">'+inr(r.inv)+'</td><td class="r num">'+inr(r.back)+'</td></tr>'; }).join("")+
      '</tbody></table></div>';
    var txt="Hello Sahare Wealth, I tried the Bond Ladder for about "+inr(A)+" over "+R+" years ("+$("pl-r").selectedOptions[0].text+"). It showed:\n"+got.map(function(r){return "- Year "+r.k+": "+r.b.issuer+" ("+r.b.isin+") x "+r.u;}).join("\n")+"\nPlease contact me to discuss.";
    h+='<div class="acts" style="margin-top:.9rem;align-items:center">'+waLink(txt,"Discuss this with us","ladder")+'<span class="muted">Why a ladder: money comes back in steps, so you are not forced to sell before maturity, and each repayment can be reinvested at the rates of that time. Amounts use the last traded price; one bond is the minimum per rung.</span></div>';
    out.innerHTML=h; track("bond_ladder",{amount:A,rungs:R,bonds:got.length});
  }
  $("pl-go").addEventListener("click",function(){ if(PLM==="lad") runLadder(); else runPlanner(); });
  $("pl-out").addEventListener("click",function(e){ var b=e.target.closest("[data-pl-open]"); if(b) openBond(b.getAttribute("data-pl-open"),true); });

  /* ================= S4 BONDS vs FD ================= */
  function renderFd(){
    var el=$("r-fd"); if(!FD_RATES||!FD_RATES.banks) { el.hidden=true; return; }
    function med(a){ a=a.slice().sort(function(x,y){return x-y;}); return a.length?a[Math.floor(a.length/2)]:null; }
    var aaa=S.corp?S.corp.list.filter(function(b){ return b.rating&&rbase(b.rating)==="AAA"&&!b.risk&&b.ytm!=null&&!b.ytmEst; }):[];
    function band(lo,hi){ var v=aaa.filter(function(b){return b.years>=lo&&b.years<hi;}).map(function(b){return b.ytm;}); return v.length>=2?med(v):null; }
    var curve=(S.mkt&&S.mkt.curve)||[]; function cv(t){ var p=curve.find(function(x){return x.t===t;}); return p?p.ytm:null; }
    var rows=FD_RATES.banks.map(function(r){ return [esc(r[0])+' FD',r[1],r[2],r[3]]; });
    if(FD_RATES.sfb&&FD_RATES.sfb.banks) FD_RATES.sfb.banks.forEach(function(r){ rows.push([esc(r[0])+' FD',r[1],r[2],r[3]]); });
    rows.push(['<b>AAA corporate bonds</b> (median traded yield)',band(0.5,2),band(2,4),band(4,6.5)]);
    rows.push(['<b>G-Sec</b> (exchange trades)',cv(1),cv(3),cv(5)]);
    el.innerHTML='<h3>Bonds vs bank FDs</h3><p class="muted">FD rates for the general public as of '+esc(FD_RATES.asOf)+' ('+esc(FD_RATES.source)+')'+(FD_RATES.sfb?'; small finance bank as of '+esc(FD_RATES.sfb.asOf)+' ('+esc(FD_RATES.sfb.source)+')':'')+'; bond yields from the latest trades on this page.</p>'+
      '<div class="tw" style="margin-top:.6rem"><table><thead><tr><th></th><th class="r">~1 year</th><th class="r">~3 years</th><th class="r">~5 years</th></tr></thead><tbody>'+
      rows.map(function(r){ return '<tr class="plain"><td style="white-space:normal">'+r[0]+'</td>'+[1,2,3].map(function(i){return '<td class="r num">'+(r[i]!=null?pct(r[i]):"–")+'</td>';}).join("")+'</tr>'; }).join("")+'</tbody></table></div>'+
      '<ul class="muted" style="margin:.6rem 0 0;padding-left:1.1rem"><li><b>Tax:</b> interest from both FDs and most bonds is taxed at your slab rate. Listed bonds sold after 12 months can attract capital-gains tax instead of slab tax on the price gain.</li><li><b>Safety:</b> bank deposits are covered by DICGC deposit insurance up to its limit per bank; corporate bonds have no such cover and carry the issuer’s credit risk.</li><li><b>Exit:</b> FDs can usually be broken with a penalty; bonds must be sold on the exchange and some trade rarely.</li><li><b>Price risk:</b> bond prices move with interest rates; FD values do not.</li></ul>';
  }

  /* ================= CALCULATOR ================= */
  function priceAt(y,cpn,years,f){ var c=cpn/f, pv=0, t=years; while(t>1e-9){ pv+=c/Math.pow(1+y/f,t*f); t-=1/f; } return pv+100/Math.pow(1+y/f,years*f); }
  function ytmCalc(price,cpn,years,f){
    if(!(years>0&&price>0&&f>0)) return NaN;
    var tNext=years-Math.floor(years*f-1e-9)/f, accrued=cpn/f*(1-tNext*f), target=price+accrued, lo=-0.5, hi=2, mid;
    for(var i=0;i<80;i++){ mid=(lo+hi)/2; if(priceAt(mid,cpn,years,f)>target) lo=mid; else hi=mid; }
    return mid*100;
  }
  var curBond=null, CM="p2y";
  function calc(){
    var face=+$("k-face").value, cpn=+$("k-cpn").value, f=+$("k-freq").value, qty=+$("k-qty").value||0, tax=(+$("k-tax").value||0)/100, mat=$("k-mat").value;
    var y=mat?yrs(mat):NaN, notes=[], price, ym;
    ["k-ytm","k-alt","k-cy","k-inv","k-int","k-tot","k-ret","k-gain"].forEach(function(i){ $(i).textContent="–"; }); $("k-flows").innerHTML="";
    $("k-cap").textContent=CM==="y2p"?"Price per ₹100 at this yield (estimate)":"Yield to maturity (estimate)";
    $("k-alt-l").textContent=CM==="y2p"?"Yield used":"Price per ₹100";
    if(curBond){
      if(curBond.amortising) notes.push("Part of this bond's principal is repaid before maturity, so this estimate may not be accurate.");
      if(curBond.callable) notes.push("The issuer can call this bond early; your actual return could differ.");
      if(curBond.perp) notes.push("Perpetual bond: enter the date you expect it to be called.");
      if(curBond.nextPay) notes.push("Next payment per NSDL: "+fd(curBond.nextPay.d)+(curBond.nextPay.a!=null?" (₹"+n2(curBond.nextPay.a)+" per bond)":"")+".");
      if(CM==="y2p"&&curBond.ytm!=null) notes.push("Market: price "+n2(curBond.price)+" at "+pct(curBond.ytm)+". Raising the yield lowers the price, and the other way round.");
    }
    var note=$("k-note"); note.hidden=!notes.length; note.textContent=notes.join(" ");
    if(!(face>0&&y>0&&cpn>=0)) return;
    if(f===0){ $("k-ytm").textContent="n/a"; note.hidden=false; note.textContent="Interest on this bond is paid at maturity; use the yield shown in the bond list. "+notes.join(" "); return; }
    if(CM==="y2p"){
      var yq=+$("k-yld").value; if(!(yq>0&&yq<40)) return;
      price=priceFromYield(yq,cpn,y,f); ym=yq;
      if(!(price>0)) return;
      $("k-ytm").textContent=n2(price); $("k-alt").textContent=pct(yq);
    } else {
      price=+$("k-price").value; if(!(price>0)) return;
      ym=ytmCalc(price,cpn,y,f);
      $("k-ytm").textContent=(isFinite(ym)&&ym>-5&&ym<60)?pct(ym):"n/a"; $("k-alt").textContent=n2(price);
    }
    var yearly=face*cpn/100*qty, totInt=yearly*y, invest=face*price/100*qty, ret=face*qty;
    // तुमचा quote विरुद्ध बाजार भाव — client शी बोलताना लगेच फरक
    if(curBond&&curBond.price>0&&curBond.ytm!=null&&!curBond.ytmHide){
      var mp=curBond.price, dpx=(price-mp)*face/100*qty;
      if(Math.abs(price-mp)>=0.01) notes.unshift((CM==="y2p"?"At "+pct(ym)+" the price is "+n2(price):"At price "+n2(price)+" the yield is "+pct(ym))+" vs market "+n2(mp)+" ("+pct(curBond.ytm)+"): "+inr(Math.abs(dpx))+(dpx<0?" cheaper":" costlier")+" for "+qty+" bond"+(qty>1?"s":"")+".");
      note.hidden=!notes.length; note.textContent=notes.join(" ");
    }
    $("k-cy").textContent=pct(cpn/price*100); $("k-inv").textContent=inr(invest); $("k-int").textContent=inr(yearly);
    $("k-tot").textContent=inr(totInt); $("k-ret").textContent=inr(ret); $("k-gain").textContent=inr(totInt*(1-tax)+ret-invest);
    var n=Math.min(60,Math.max(1,Math.round(y*f))), bars="", h=Math.max(8,Math.min(60,cpn/f*4));
    for(var i=0;i<n;i++) bars+='<i class="'+(i===n-1?"last":"")+'" style="height:'+(i===n-1?100:h)+'%"></i>';
    $("k-flows").innerHTML=bars;
  }
  root.querySelectorAll("[data-cm]").forEach(function(bt){ bt.addEventListener("click",function(){
    CM=bt.getAttribute("data-cm"); root.querySelectorAll("[data-cm]").forEach(function(x){ x.setAttribute("aria-pressed",x===bt); });
    $("k-price-l").hidden=CM==="y2p"; $("k-yld-l").hidden=CM!=="y2p"; lockCalc();
    if(CM==="y2p"&&curBond&&curBond.ytm!=null) $("k-yld").value=curBond.ytm.toFixed(2);
    calc(); track("calc_mode",{mode:CM});
  }); });
  var DEF_K=snap(["k-pick","k-face","k-price","k-yld","k-cpn","k-freq","k-mat","k-qty","k-tax"]);
  /* Bond निवडला असेल तर: फक्त price (किंवा yield), number of bonds आणि tax बदलता येतात; बाकी bond चे तपशील lock */
  function lockCalc(){
    var on=!!curBond;
    ["k-face","k-cpn","k-freq","k-mat"].forEach(function(i){ var e=$(i); e.disabled=on; e.closest("label").classList.toggle("lk",on); });
    $("k-lock").hidden=!on;
  }
  // Reset = bond निवडला असेल तर त्या bond च्याच मूळ values; नसेल तर सुरुवातीच्या values. Mode (price→yield / yield→price) तसाच राहतो.
  $("k-reset").addEventListener("click",function(){
    if(curBond) fillCalc(curBond.isin); else { restore(DEF_K); var d=new Date(today); d.setFullYear(d.getFullYear()+3); $("k-mat").value=d.toISOString().slice(0,10); }
    $("k-qty").value=1; $("k-tax").value=0; lockCalc(); calc(); track("bond_reset",{tab:"calc"});
  });
  function fillCalc(isin){
    var b=S.corp&&S.corp.list.find(function(x){return x.isin===isin;}); if(!b) return;
    curBond=b; $("k-pick").value=isin; if($("k-find").value.toUpperCase().indexOf(isin)<0) $("k-find").value=isin; kqBtns(); $("k-msg").textContent="";
    if(b.face) $("k-face").value=b.face;
    $("k-price").value=b.price; $("k-cpn").value=b.coupon!=null?b.coupon:0; if(b.ytm!=null) $("k-yld").value=b.ytm.toFixed(2);
    $("k-freq").value=(b.freq!=null&&FREQ[b.freq]!=null)?b.freq:1;
    if(!b.perp&&b.maturity) $("k-mat").value=b.maturity;
    lockCalc(); calc(); track("bond_calculate",{isin:isin});
  }
  ["k-face","k-price","k-yld","k-cpn","k-freq","k-mat","k-qty","k-tax"].forEach(function(i){ $(i).addEventListener("input",function(){ if(i!=="k-qty"&&i!=="k-tax"&&i!=="k-yld"&&i!=="k-price"){ curBond=null; $("k-pick").value=""; } calc(); }); });
  /* Calculator मध्ये थेट ISIN / नाव शोधणे (Paste सकट) */
  function kqBtns(){ $("k-qx").hidden=!$("k-find").value; }
  function kFind(v){
    kqBtns(); v=String(v||"").trim(); var msg=$("k-msg"); if(!v){ msg.textContent=""; return; }
    var m=v.toUpperCase().match(/\bIN[A-Z0-9]{10}\b/);
    if(m){ var b=S.corp&&S.corp.list.find(function(x){return x.isin===m[0];});
      if(b){ fillCalc(b.isin); msg.textContent="Loaded "+b.issuer+" ("+b.isin+")."; }
      else msg.textContent="ISIN "+m[0]+" has not traded on BSE/NSE in the last 30 days, so we have no price for it. Enter its details manually or ask us on WhatsApp.";
      return; }
    var hits=S.corp?S.corp.list.filter(function(b){return b.search.indexOf(v.toLowerCase())>=0;}):[];
    if(hits.length===1){ fillCalc(hits[0].isin); msg.textContent="Loaded "+hits[0].issuer+" ("+hits[0].isin+")."; }
    else msg.textContent=hits.length?hits.length+" bonds match — pick one from the suggestions or paste the ISIN.":(v.length>2?"No traded bond matches “"+v+"”.":"");
  }
  var kft=null;
  $("k-find").addEventListener("input",function(){ var v=this.value; kqBtns(); clearTimeout(kft); kft=setTimeout(function(){ kFind(v); }, /\bIN[A-Z0-9]{10}\b/i.test(v)?0:400); });
  $("k-qx").addEventListener("click",function(){ $("k-find").value=""; kqBtns(); $("k-msg").textContent=""; $("k-find").focus(); });
  $("k-qp").addEventListener("click",function(){
    if(navigator.clipboard&&navigator.clipboard.readText) navigator.clipboard.readText().then(function(t){ $("k-find").value=String(t||"").trim().slice(0,80); kFind($("k-find").value); track("calc_isin_paste"); },function(){ $("k-find").focus(); $("k-msg").textContent="Your browser blocked reading the clipboard. Tap the box and paste (Ctrl+V, or long-press → Paste)."; });
    else { $("k-find").focus(); $("k-msg").textContent="Tap the box and paste (Ctrl+V, or long-press → Paste)."; }
  });
  $("k-pick").addEventListener("change",function(){ if(this.value) fillCalc(this.value); else { curBond=null; $("k-find").value=""; kqBtns(); $("k-msg").textContent=""; lockCalc(); calc(); } });
  (function(){ var d=new Date(today); d.setFullYear(d.getFullYear()+3); $("k-mat").value=d.toISOString().slice(0,10); calc(); })();

  /* ================= RATES & CURVE ================= */
  var SHIFTS=[-50,-25,0,25,50,100], shift=50;
  function parPrice(y,T,c){ var n=Math.max(1,Math.round(T*2)), i=y/200, p=0; for(var k=1;k<=n;k++) p+=(c/2)/Math.pow(1+i,k); return p+100/Math.pow(1+i,n); }
  function modDur(y,T){ var i=y/200, n=Math.max(1,Math.round(T*2)); return (1-1/Math.pow(1+i,n))/(y/100); }
  function renderRates(){
    var m=S.mkt; if(!m){ $("r-kpis").innerHTML='<p class="muted">Market data could not be loaded right now.</p>'; return; }
    var curve=(m.curve||[]).slice().sort(function(a,b){return a.t-b.t;}), pol=m.policy||{}, inf=m.inflation||{};
    var ten=curve.find(function(p){return p.t===10;});
    var k=[];
    if(pol.repo!=null) k.push(["RBI repo rate",pct(pol.repo),(pol.stance?esc(pol.stance)+" · ":"")+"since "+fd(pol.effective)]);
    if(pol.sdf!=null) k.push(["Policy corridor",pct(pol.sdf)+" – "+pct(pol.msf),"SDF floor – MSF ceiling"]);
    if(ten) k.push(["10Y G-Sec (exchange trades)",pct(ten.ytm),"as of "+fd(m.pricesAsOf)]);
    if(inf.cpi!=null) k.push(["CPI inflation, "+esc(inf.month),pct(inf.cpi),inf.food!=null?"Food "+pct(inf.food):""]);
    if(pol.nextMeeting) k.push(["Next RBI policy",esc(String(pol.nextMeeting).replace(/(\d{4})-(\d{2})-(\d{2})/g,function(_,y,mo,d){return fd(y+"-"+mo+"-"+d);})).split(" to ")[0],"MPC meeting"]);
    $("r-kpis").innerHTML=k.map(function(x){return '<div class="kpi" title="'+esc(String(x[2]).replace(/<[^>]+>/g,""))+'"><span class="l">'+x[0]+'</span> <b class="v num">'+x[1]+'</b></div>';}).join("");
    $("r-curve-sub").textContent=curve.length?"Indicative yields worked out from G-Sec trades on BSE and NSE ("+fd(m.pricesAsOf)+"). Retail exchange trades are thin, so treat the curve as a guide.":"Not enough trades to draw the curve today.";
    drawCurve(curve);
    $("r-curve-tbl").innerHTML='<thead><tr><th>Tenor</th><th class="r">Yield</th><th>Based on</th></tr></thead><tbody>'+curve.map(function(p){return '<tr class="plain"><td>'+esc(p.label)+'</td><td class="r num">'+pct(p.ytm)+'</td><td class="isin" style="white-space:normal">'+esc((p.bonds||[]).join(", "))+'</td></tr>';}).join("")+'</tbody>';
    drawSeg(); drawScen(curve);
    var nl=(m.nsdl||{});
    function lst(rows){ return '<thead><tr><th>Issuer</th><th class="r">Size (₹ cr)</th><th>Maturity</th></tr></thead><tbody>'+(rows||[]).slice(0,10).map(function(r){return '<tr class="plain"><td class="iss" style="min-width:160px">'+esc(r.issuer)+'<span class="isin">'+esc(r.isin)+cp(r.isin)+'</span></td><td class="r num">'+n2(r.sizeCr,0)+'</td><td>'+fd(r.maturity)+'</td></tr>';}).join("")+'</tbody>'; }
    $("r-new").innerHTML=lst(nl.newIssues); $("r-due").innerHTML=lst(nl.maturingSoon);
    $("r-mkt").innerHTML=nl.outstandingBonds?'<h3>Corporate bond market at a glance</h3><p class="muted">From NSDL India Bond Info'+(nl.quarter?", quarter "+esc(nl.quarter):"")+'.</p><div class="tiles">'+
      [["Bonds outstanding",n2(nl.outstandingBonds,0)],["Amount outstanding","₹"+n2(nl.outstandingCr/1e5,2)+" lakh cr"],["New issues in quarter",n2(nl.issuesInQuarter,0)],["Raised in quarter","₹"+n2(nl.issuedCr/1e3,1)+"k cr"],["Redemptions in quarter",n2(nl.redemptionsInQuarter,0)]]
      .map(function(t){return '<div class="tile"><div class="v num">'+t[1]+'</div><div class="l">'+t[0]+'</div></div>';}).join("")+'</div>':"";
  }
  function drawCurve(curve){
    var el=$("r-curve"); if(curve.length<2){ el.innerHTML=""; return; }
    var w=Math.max(300,el.clientWidth||600), h=250, m={l:42,r:20,t:26,b:30}, iw=w-m.l-m.r, ih=h-m.t-m.b;
    var ys=curve.map(function(p){return p.ytm;}), lo=Math.floor((Math.min.apply(null,ys)-0.3)*5)/5, hi=Math.ceil((Math.max.apply(null,ys)+0.3)*5)/5, tmax=Math.max(10,curve[curve.length-1].t);
    var x=function(t){return m.l+Math.sqrt(t/tmax)*iw;}, y=function(v){return m.t+(1-(v-lo)/(hi-lo))*ih;};
    var s='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="G-Sec yield curve">';
    for(var v=lo; v<=hi+1e-9; v+=(hi-lo)/4) s+='<line x1="'+m.l+'" x2="'+(w-m.r)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#e4e7ec"/><text x="'+(m.l-6)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="11" fill="#667085">'+v.toFixed(1)+'</text>';
    curve.forEach(function(p){ s+='<text x="'+x(p.t)+'" y="'+(h-8)+'" text-anchor="middle" font-size="11" fill="#667085">'+esc(p.label)+'</text>'; });
    s+='<polyline fill="none" stroke="#212d45" stroke-width="3" stroke-linejoin="round" points="'+curve.map(function(p){return x(p.t)+","+y(p.ytm);}).join(" ")+'"/>';
    curve.forEach(function(p){ s+='<circle cx="'+x(p.t)+'" cy="'+y(p.ytm)+'" r="5" fill="#f8b526" stroke="#212d45" stroke-width="2"/><text x="'+x(p.t)+'" y="'+(y(p.ytm)-11)+'" text-anchor="middle" font-size="11.5" font-weight="700" fill="#212d45">'+p.ytm.toFixed(2)+'</text>'; });
    el.innerHTML=s+'</svg>';
  }
  function drawSeg(){
    $("r-seg").innerHTML=SHIFTS.map(function(v){return '<button type="button" data-s="'+v+'" aria-pressed="'+(v===shift)+'">'+(v===0?"No change":(v>0?"+":"−")+Math.abs(v)+" bp")+'</button>';}).join("");
  }
  function drawScen(curve){
    var pts=curve.filter(function(p){return [1,3,5,10,15,30].indexOf(p.t)>=0;});
    if(!pts.length){ $("r-scen").innerHTML=""; return; }
    $("r-scen").innerHTML='<thead><tr><th>Par G-Sec</th><th class="r">Yield</th><th class="r">Mod. duration</th><th class="r">Breakeven</th><th class="r">12-month return</th></tr></thead><tbody>'+
      pts.map(function(p){ var D=modDur(p.ytm,p.t), be=p.ytm*100/D, r=p.ytm+(parPrice(p.ytm+shift/100,Math.max(p.t-1,0.01),p.ytm)-100);
        return '<tr class="plain"><td>'+esc(p.label)+'</td><td class="r num">'+pct(p.ytm)+'</td><td class="r num">'+n2(D,1)+'</td><td class="r num">'+Math.round(be)+' bp</td><td class="r num '+(r<0?"cr":"cg")+'">'+(r>0?"+":"")+r.toFixed(1)+'%</td></tr>'; }).join("")+'</tbody>';
  }
  $("r-seg").addEventListener("click",function(e){ var b=e.target.closest("[data-s]"); if(!b) return; shift=+b.getAttribute("data-s"); drawSeg(); drawScen((S.mkt&&S.mkt.curve)||[]); });

  /* ================= PORTFOLIO (CSV) ================= */
  var MS=864e5;
  function utc(y,m,d){ return new Date(Date.UTC(y,m,d)); }
  function addM(d,n){ var t=utc(d.getUTCFullYear(),d.getUTCMonth()+n,1), last=utc(t.getUTCFullYear(),t.getUTCMonth()+1,0).getUTCDate(); return utc(t.getUTCFullYear(),t.getUTCMonth(),Math.min(d.getUTCDate(),last)); }
  function flows(b,settle){ var step=12/b.freq, out=[], k=0, d=b.mat; while(d>settle&&k<600){ out.push(d); k++; d=addM(b.mat,-k*step); } out.reverse(); return out.map(function(x,i){ return {t:(x-settle)/(365*MS),cf:b.coupon/b.freq+(i===out.length-1?100:0)}; }); }
  function pAt(fl,y,f){ var p=0; for(var i=0;i<fl.length;i++) p+=fl[i].cf/Math.pow(1+y/f,f*fl[i].t); return p; }
  function solveY(fl,price,f){ var lo=-0.5,hi=1.5; if(pAt(fl,lo,f)<price||pAt(fl,hi,f)>price) return NaN; for(var i=0;i<120;i++){ var mid=(lo+hi)/2; if(pAt(fl,mid,f)>price) lo=mid; else hi=mid; } return (lo+hi)/2; }
  var MAP={name:["name","security","bond","instrument","isin","description"],coupon:["coupon","couponrate","rate","interest"],mat:["maturity","maturitydate","redemption","redemptiondate"],face:["face","facevalue","quantity","qty","holding","nominal","amount"],price:["price","marketprice","dirtyprice","buyprice","ltp"],freq:["frequency","freq","paymentsperyear"],type:["type","rating","category","class"]};
  function pick(row,key){ var norm={}; Object.keys(row).forEach(function(k){ norm[k.toLowerCase().replace(/[^a-z0-9]/g,"")]=row[k]; }); for(var i=0;i<MAP[key].length;i++){ var v=norm[MAP[key][i]]; if(v!==undefined&&v!=="") return v; } return ""; }
  function toNum(v){ var n=parseFloat(String(v).replace(/[₹,%\s]/g,"")); return isNaN(n)?NaN:n; }
  var MON={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  function toDate(v){ var s=String(v).trim(), m;
    if((m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/))) return utc(+m[1],+m[2]-1,+m[3]);
    if((m=s.match(/^(\d{1,2})[-\/\. ](\d{1,2})[-\/\. ](\d{4})/))) return utc(+m[3],+m[2]-1,+m[1]);
    if((m=s.match(/^(\d{1,2})[-\/ ]([A-Za-z]{3})[a-z]*[-\/ ,]+(\d{2,4})/))){ var yy=+m[3]; if(yy<100) yy+=2000; var mo=MON[m[2].toLowerCase()]; if(mo!==undefined) return utc(yy,mo,+m[1]); }
    return null; }
  function classify(t,name){ var s=(String(t)+" "+name).toLowerCase(); if(/g-?sec|gsec|govt|government|sdl|t-?bill|\bgs\s?20|sgb|gold bond/.test(s)) return "Govt / SGB"; if(/aaa/.test(s)) return "AAA"; if(/\baa[+-]?\b|^aa/.test(s)) return "AA"; return "Other"; }
  function parseCSV(text){ var rows=[],cur=[],f="",q=false; for(var i=0;i<text.length;i++){ var c=text[i]; if(q){ if(c==='"'){ if(text[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; } else if(c==='"') q=true; else if(c===","){cur.push(f);f="";} else if(c==="\n"||c==="\r"){ if(c==="\r"&&text[i+1]==="\n") i++; cur.push(f); rows.push(cur); cur=[]; f=""; } else f+=c; } if(f!==""||cur.length){cur.push(f);rows.push(cur);} var head=rows.shift()||[]; return rows.filter(function(r){return r.some(function(x){return x.trim()!=="";});}).map(function(r){ var o={}; head.forEach(function(h,i){ o[h.trim()]=r[i]===undefined?"":r[i]; }); return o; }); }
  function normalise(raw){ return raw.map(function(r){ var c=toNum(pick(r,"coupon")); if(c>0&&c<1) c*=100; var f=toNum(pick(r,"freq")); if([1,2,4,12].indexOf(f)<0) f=1; var nm=String(pick(r,"name")||""); return {name:nm,coupon:c,mat:toDate(pick(r,"mat")),face:toNum(pick(r,"face")),price:toNum(pick(r,"price")),freq:f,type:classify(pick(r,"type"),nm)}; }); }
  var SAMPLE_CSV="name,coupon,maturity,face,price,frequency,type\nSample G-Sec 2033,7.18,2033-08-14,500000,102.40,2,G-Sec\nSample AAA PSU 2029,7.60,2029-06-30,800000,101.80,1,AAA\nSample AA NBFC 2028,9.10,2028-09-30,400000,100.20,1,AA\nSample SGB 2030,2.50,2030-12-31,300000,100,2,SGB";
  var pfRows=null;
  function renderPf(){
    var a=$("p-asof").value.split("-"), settle=utc(+a[0],+a[1]-1,+a[2]), errs=[], B=[];
    pfRows.forEach(function(r,i){
      var tag=r.name||("Row "+(i+1));
      if(!(r.coupon>=0)||!r.mat||!(r.face>0)||!(r.price>0)){ errs.push(tag+": missing or invalid coupon, maturity, face or price."); return; }
      var fl=flows(r,settle); if(!fl.length){ errs.push(tag+": already matured, skipped."); return; }
      var y=solveY(fl,r.price,r.freq); if(isNaN(y)){ errs.push(tag+": yield could not be worked out from that price."); return; }
      var pv=0,w=0; fl.forEach(function(c){ var v=c.cf/Math.pow(1+y/r.freq,r.freq*c.t); pv+=v; w+=c.t*v; });
      var mod=(w/pv)/(1+y/r.freq), mv=r.face*r.price/100;
      B.push({name:tag,type:r.type,coupon:r.coupon,mat:r.mat,yrs:(r.mat-settle)/(365*MS),price:r.price,ytm:y*100,mod:mod,mv:mv,dv01:mod*mv*1e-4,fl:fl,face:r.face,freq:r.freq,y:y});
    });
    $("p-err").innerHTML=errs.map(function(e){return "• "+esc(e);}).join("<br>");
    var ids=["p-tiles","p-shock","p-buckets","p-types","p-hold"]; if(!B.length){ ids.forEach(function(i){ $(i).innerHTML=""; }); return; }
    var tot=B.reduce(function(s,b){return s+b.mv;},0), wy=B.reduce(function(s,b){return s+b.ytm*b.mv;},0)/tot, wd=B.reduce(function(s,b){return s+b.mod*b.mv;},0)/tot, wm=B.reduce(function(s,b){return s+b.yrs*b.mv;},0)/tot, dv=B.reduce(function(s,b){return s+b.dv01;},0);
    var big=B.reduce(function(m,b){return b.mv>m.mv?b:m;},B[0]);
    $("p-tiles").innerHTML=[["Market value",inr(tot)],["Weighted yield",pct(wy)],["Modified duration",n2(wd)+" yrs"],["Average maturity",n2(wm,1)+" yrs"],["Value change per 0.01% (DV01)",inr(dv)],["Breakeven rise in yields",Math.round(wy*100/wd)+" bp"],["Largest holding",n2(big.mv/tot*100,0)+"%"]]
      .map(function(t){return '<div class="tile"><div class="v num">'+t[1]+'</div><div class="l">'+t[0]+'</div></div>';}).join("");
    var carry=wy/100*tot;
    $("p-shock").innerHTML='<thead><tr><th>Yields move</th><th class="r">Price change</th><th class="r">%</th><th class="r">12-month outcome</th></tr></thead><tbody>'+[-50,-25,25,50,100].map(function(s){
      var d=B.reduce(function(a2,b){return a2+b.face*pAt(b.fl,b.y+s/1e4,b.freq)/100;},0)-tot, t=d+carry;
      return '<tr class="plain"><td>'+(s>0?"+":"−")+Math.abs(s)+' bp</td><td class="r num '+(d<0?"cr":"cg")+'">'+(d<0?"−":"+")+inr(Math.abs(d))+'</td><td class="r num">'+(d>0?"+":"")+(d/tot*100).toFixed(2)+'%</td><td class="r num '+(t<0?"cr":"cg")+'"><b>'+(t<0?"−":"+")+inr(Math.abs(t))+'</b></td></tr>'; }).join("")+'</tbody>';
    function bars(keys,fn,el){ var agg={}; keys.forEach(function(k){agg[k]=0;}); B.forEach(function(b){ agg[fn(b)]=(agg[fn(b)]||0)+b.mv; });
      $(el).innerHTML=keys.map(function(k){ var p=agg[k]/tot*100; return '<div class="hb"><span>'+esc(k)+'</span><div class="t"><i style="width:'+p.toFixed(1)+'%"></i></div><span class="num" style="text-align:right">'+p.toFixed(1)+'%</span></div>'; }).join(""); }
    var BK=["Under 1 year","1–3 years","3–5 years","5–10 years","10 years +"];
    bars(BK,function(b){return b.yrs<1?BK[0]:b.yrs<3?BK[1]:b.yrs<5?BK[2]:b.yrs<10?BK[3]:BK[4];},"p-buckets");
    bars(["Govt / SGB","AAA","AA","Other"],function(b){return b.type;},"p-types");
    function ds(d){ return d.getUTCDate()+" "+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()]+" "+d.getUTCFullYear(); }
    $("p-hold").innerHTML='<thead><tr><th>Bond</th><th>Type</th><th class="r">Coupon</th><th>Maturity</th><th class="r">Price</th><th class="r">Yield</th><th class="r">Mod. dur.</th><th class="r">Value</th><th class="r">Weight</th></tr></thead><tbody>'+
      B.map(function(b){return '<tr class="plain"><td class="iss" style="min-width:160px">'+esc(b.name)+'</td><td>'+esc(b.type)+'</td><td class="r num">'+pct(b.coupon)+'</td><td>'+ds(b.mat)+'</td><td class="r num">'+n2(b.price)+'</td><td class="r num">'+pct(b.ytm)+'</td><td class="r num">'+n2(b.mod)+'</td><td class="r num">'+inr(b.mv)+'</td><td class="r num">'+(b.mv/tot*100).toFixed(1)+'%</td></tr>';}).join("")+'</tbody>';
  }
  function loadSample(){ pfRows=normalise(parseCSV(SAMPLE_CSV)); $("p-banner").hidden=false; $("p-err").textContent=""; renderPf(); }
  function handleFile(file){
    if(!file) return;
    if(!/\.csv$/i.test(file.name)){ $("p-err").textContent="Please choose a .csv file (in Excel: File → Save As → CSV)."; return; }
    var rd=new FileReader();
    rd.onload=function(){ try{ var raw=parseCSV(String(rd.result)); if(!raw.length) throw new Error("no rows found; check the first row has column names"); pfRows=normalise(raw); $("p-banner").hidden=true; $("p-err").textContent=""; renderPf(); track("portfolio_upload",{rows:raw.length}); } catch(e){ $("p-err").textContent="Could not read the file: "+e.message; } };
    rd.onerror=function(){ $("p-err").textContent="That file could not be read."; };
    rd.readAsText(file);
  }
  $("p-file").addEventListener("change",function(e){ handleFile(e.target.files[0]); });
  var drop=$("p-drop");
  ["dragenter","dragover"].forEach(function(ev){ drop.addEventListener(ev,function(e){ e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave","drop"].forEach(function(ev){ drop.addEventListener(ev,function(e){ e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop",function(e){ handleFile(e.dataTransfer.files[0]); });

  $("p-dl").addEventListener("click",function(){
    var a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\ufeff"+SAMPLE_CSV+"\n"],{type:"text/csv;charset=utf-8"})); a.download="bond-portfolio-sample.csv";
    document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },500); track("bond_pf_sample_download");
  });
  $("p-asof").value=today.getFullYear()+"-"+("0"+(today.getMonth()+1)).slice(-2)+"-"+("0"+today.getDate()).slice(-2);
  $("p-asof").addEventListener("change",function(){ if(pfRows) renderPf(); });
  loadSample();

  /* ================= FAQ + footer ================= */
  var FAQ=[
    ["What is the difference between G-Secs, SGBs and corporate bonds?","G-Secs are loans to the Government of India and carry almost no credit risk. Sovereign Gold Bonds are government securities whose value follows the price of gold and also pay 2.5% a year on the issue price. Corporate bonds and NCDs are loans to companies; they usually pay more interest than G-Secs because the company might not repay in full or on time."],
    ["What is yield to maturity (YTM) and why is it different from the coupon?","The coupon is the interest rate printed on the bond. YTM is the yearly return you would earn if you bought at today's price, received every payment on time and held the bond to maturity. Buying below ₹100 gives a YTM above the coupon; buying above ₹100 gives a YTM below it. It is an estimate, not a promise."],
    ["Where do the ratings and bond details come from?","From NSDL India Bond Info, which collects information reported by issuers and credit rating agencies such as CRISIL, ICRA, CARE, India Ratings and Acuité. Ratings can change and NSDL may lag the agency, so open the rating rationale link and confirm the latest rating before investing."],
    ["Are corporate bonds safe?","No investment is completely risk-free. Safety depends mainly on the issuer's financial strength. A high rating (AAA is highest), security over assets and a guarantee lower the risk but do not remove it. A yield far above similar bonds usually signals higher risk. Spreading money across issuers helps."],
    ["What does “callable” or “perpetual” mean?","A callable bond can be repaid early by the issuer on set dates, which can change your return. A perpetual bond has no fixed maturity; the issuer may call it, and some can be written down. Read the offer document for these terms."],
    ["Why are prices quoted per ₹100?","Exchanges quote bond prices per ₹100 of face value so bonds of different sizes can be compared. You pay price ÷ 100 × face value, plus accrued interest and charges. Face value per bond can range from ₹1,000 to ₹1 lakh or more, which sets the minimum investment."],
    ["Can I sell a bond before maturity?","Yes, if there is a buyer. Many corporate bonds trade rarely, so you may have to wait or accept a lower price. The “Last trade” date shows how recently a bond changed hands."],
    ["Is the interest taxable?","Interest on most bonds is taxed at your income-tax slab rate, and tax may be deducted at source. Tax-free bonds are exempt as per their issue terms. Gains on sale follow capital-gains rules that depend on how long you hold the bond. Please check with your tax adviser."],
    ["What does it mean when a bond trades at a discount or premium?","Bond prices are quoted per ₹100 of face value. Below 100 is a discount: you pay less than you get back at maturity, so the yield is higher than the coupon. Above 100 is a premium: the yield is lower than the coupon. A deep discount can also mean the market is worried about the issuer, so check the rating and risk flags. Use the “Price vs ₹100” filter under More filters to find them."],
    ["What is accrued interest?","Interest builds up every day between payment dates. When you buy a bond between two payment dates, you pay the seller the interest earned since the last payment; you then receive the full interest on the next payment date. The bond page shows this as part of the cost."],
    ["What is an ISIN?","ISIN (International Securities Identification Number) is the 12-character code that uniquely identifies a security. Every bond series has its own ISIN, so always quote the ISIN when you buy, sell or ask about a bond."],
    ["What do face value, seniority and security cover mean?","Face value is the amount on which interest is calculated and which is repaid at maturity. Seniority shows where the bond ranks for repayment if the issuer runs into trouble: senior bonds are paid before subordinated ones. Security cover (asset cover) compares the assets pledged to the amount owed; 1.5x means ₹1.50 of assets for every ₹1 owed."],
    ["What is a debenture trustee?","A SEBI-registered trustee who protects bondholders' interests — monitoring the security, the issuer's obligations and acting if payments are missed."],
    ["What does Pre-TDS and Post-TDS mean in the payout schedule?","Pre-TDS shows the full interest the bond pays. Post-TDS shows interest after tax deducted at source (10% assumed here), which is what reaches your bank if TDS applies. TDS is not a final tax; it is adjusted when you file your return."],
    ["How often is this page updated?","Prices and yields refresh every trading evening from the BSE and NSE reports. Bond details are fetched from NSDL once, and ratings are re-checked every week. The dates at the top of the page show when each part was last refreshed. It is not a live price feed."]
  ];
  var FAQ_GROUPS=[["Basics",[0,1,5,10,8]],["Risk & safety",[3,2,4,6,11,12]],["Tax, payouts & updates",[7,9,13,14]]];
  $("bc-faq").innerHTML=FAQ_GROUPS.map(function(g){ return '<div class="faq-g"><h3>'+esc(g[0])+'</h3>'+g[1].filter(function(k){return FAQ[k];}).map(function(k){ var f=FAQ[k]; return '<details><summary>'+esc(f[0])+'</summary><p>'+esc(f[1])+'</p></details>'; }).join("")+'</div>'; }).join("");
  $("bc-ld").textContent=JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":FAQ.map(function(f){return {"@type":"Question","name":f[0],"acceptedAnswer":{"@type":"Answer","text":f[1]}};})});
  root.querySelectorAll(".faq details").forEach(function(d){ d.addEventListener("toggle",function(){ if(d.open) track("faq_open",{q:d.querySelector("summary").textContent.slice(0,60)}); }); });
  $("bc-wa").innerHTML=WA_ICON+"Chat on WhatsApp"; $("bc-wa").href=waUrl("Hello Sahare Wealth, I would like to know more about bonds. Please contact me.");
  $("bc-wa").addEventListener("click",function(){ track("whatsapp_general_click"); });
  /* Mobile: खाली चिकटलेली WhatsApp पट्टी — hero च्या खाली scroll केल्यावर दिसते; popup उघडा असताना / पानाच्या शेवटी लपते */
  (function(){
    var bar=$("bc-mbar"); bar.innerHTML=WA_ICON+"<span>Ask about a bond on WhatsApp</span>"; bar.href=$("bc-wa").href;
    bar.addEventListener("click",function(){ track("whatsapp_sticky_click"); });
    var hero=root.querySelector(".bc-hero"), band=$("bc-band");
    function upd(){
      if(!mq.matches||siteWa()){ bar.hidden=true; return; }   // साईटच्या खालच्या पट्टीत आधीच WhatsApp असेल तर दुसरं बटण नको
      var hb=hero.getBoundingClientRect().bottom, bt=band.getBoundingClientRect().top, rb=root.getBoundingClientRect().bottom;
      bar.hidden = hb>0 || (bt<innerHeight && band.getBoundingClientRect().bottom>0) || rb<innerHeight*0.6 || $("md").classList.contains("on");
      bar.style.bottom=(12+bottomInset())+"px";
    }
    var tk=false; window.addEventListener("scroll",function(){ if(!tk){ tk=true; requestAnimationFrame(function(){ tk=false; upd(); }); } },{passive:true});
    window.addEventListener("resize",upd); root.addEventListener("click",function(){ setTimeout(upd,50); }); upd();
  })();
  $("bc-cta").addEventListener("click",function(){ track("bondbazaar_cta_click"); });
  $("bc-arn").textContent=ARN_TEXT;

  /* ---------- Campaign banner ---------- */
  (function(){
    var el=$("bc-banner"), off=false; try{ off=sessionStorage.getItem("a4u_bc_banner")===BANNER.text; }catch(e){}
    if(!BANNER.text||off||(BANNER.until&&today>new Date(BANNER.until+"T23:59:59"))) return;
    el.innerHTML='<span>'+esc(BANNER.text)+(BANNER.link?' <a href="'+esc(BANNER.link)+'" target="_blank" rel="noopener" data-bn="1">'+esc(BANNER.linkText||"Know more")+' →</a>':'')+'</span><button type="button" aria-label="Close">×</button>';
    el.hidden=false;
    el.addEventListener("click",function(e){ if(e.target.closest("[data-bn]")) track("bond_banner_click"); if(e.target.closest("button")){ el.hidden=true; try{ sessionStorage.setItem("a4u_bc_banner",BANNER.text); }catch(x){} } });
  })();

  /* ---------- Learn + Videos ---------- */
  var LEARN=[
    ["What is yield to maturity (YTM)?","YTM is the yearly return you earn if you buy at today's price, receive every payment on time and hold the bond until it matures. It already counts the coupon and any gain or loss from buying below or above ₹100."],
    ["Coupon vs yield: which matters?","The coupon is fixed on face value. The yield depends on the price you pay. A 9% coupon bond bought at 104 yields less than 9%; bought at 96 it yields more. Compare bonds on yield."],
    ["What do AAA, AA and A ratings mean?","Ratings are an agency's opinion of how likely the issuer is to pay on time. AAA is the highest safety, AA high safety, A adequate safety. Lower ratings pay more because the risk is higher."],
    ["Secured or unsecured?","A secured bond has a charge on the issuer's assets, which can help recovery if it defaults. Unsecured and subordinated bonds rank lower and usually pay more."],
    ["Why does liquidity matter?","Listed bonds can be sold on the exchange, but many trade rarely. If you may need the money early, prefer bonds marked 'Trades often', or plan to hold till maturity."],
  ];
  $("bc-learn-cards").innerHTML=LEARN.map(function(x){ return '<details><summary>'+esc(x[0])+'</summary><p>'+esc(x[1])+'</p></details>'; }).join("");
  if(CAT_PAGE_BASE){ var cl=$("bc-cat-link"); cl.href=CAT_PAGE_BASE; cl.hidden=false; }
  (function(){
    var v=$("bc-vids"), L=(VIDEOS&&VIDEOS.list)||[];
    var ch=VIDEOS&&VIDEOS.channel?'<p style="margin-top:.8rem"><a class="btn" href="'+esc(VIDEOS.channel)+'" target="_blank" rel="noopener" data-vid-ch="1">▶ Watch our videos on YouTube</a></p>':"";
    v.innerHTML=(L.length?'<div class="vids">'+L.map(function(x){ var id=String(x[0]).replace(/[^\w-]/g,""); return '<button type="button" class="vid" data-vid="'+id+'" aria-label="Play: '+esc(x[1]||"video")+'"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg"><b>▶</b><span>'+esc(x[1]||"")+'</span></button>'; }).join("")+'</div>':"")+ch;
    v.addEventListener("click",function(e){
      var b=e.target.closest("[data-vid]"); if(e.target.closest("[data-vid-ch]")) track("youtube_channel_click");
      if(!b) return; var id=b.getAttribute("data-vid");
      b.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'; b.removeAttribute("data-vid");
      track("video_play",{id:id});
    });
  })();

  /* ================= LOAD ================= */
  /* Data browser च्या session मध्ये 30 मिनिटं साठवतो — tab/पान बदलून परत आल्यावर लगेच दिसतं */
  var SS_TTL=30*60*1000, SS_MAX=2500000;
  function ssGet(name){ try{ var raw=sessionStorage.getItem("a4u_bc:"+name); if(!raw) return null; var i=raw.indexOf("|"); if(Date.now()-(+raw.slice(0,i))>SS_TTL) return null; return JSON.parse(raw.slice(i+1)); }catch(e){ return null; } }
  function ssPut(name,text){ try{ if(text.length<=SS_MAX) sessionStorage.setItem("a4u_bc:"+name,Date.now()+"|"+text); }catch(e){ try{ sessionStorage.removeItem("a4u_bc:"+name); }catch(x){} } }
  function get(name){
    var hit=ssGet(name); if(hit) return Promise.resolve(hit);
    return fetch(DATA+name+"?v="+Math.floor(Date.now()/36e5),{cache:"no-cache"}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.text(); }).then(function(t){ var j=JSON.parse(t); ssPut(name,t); return j; });
  }
  // हलकी यादी (corp_list.json); ती नसेल तर जुनी पूर्ण file (corp_bonds.json)
  function getCorp(){ return get("corp_list.json").then(function(j){ if(!j||!j.bonds) throw 0; return j; }).catch(function(){ return get("corp_bonds.json").then(function(j){ if(j) j.full=true; return j; }); }); }
  Promise.allSettled([get("bonds.json"),getCorp(),get("bond_market.json")]).then(function(res){
    S.gov=res[0].status==="fulfilled"?res[0].value:null;
    if(res[1].status==="fulfilled"&&res[1].value&&res[1].value.bonds){ S.corp=res[1].value; S.corp.list=prepCorp(S.corp.bonds); }
    S.mkt=res[2].status==="fulfilled"?res[2].value:null;
    var st=[];
    if(S.gov&&S.gov.generated_at) st.push("Govt &amp; gold prices: <b>"+fd(S.gov.generated_at.slice(0,10))+"</b>");
    if(S.corp) st.push("Corporate prices: <b>"+fd(S.corp.pricesAsOf)+"</b>"+(S.corp.ratingsAsOf?" · ratings checked <b>"+fd(S.corp.ratingsAsOf)+"</b>":""));
    if(S.mkt) st.push("Curve: <b>"+fd(S.mkt.pricesAsOf)+"</b>");
    $("bc-status").innerHTML=st.length?st.map(function(s){return "<span>"+s+"</span>";}).join(""):"<span>Data could not be loaded right now. Please refresh the page.</span>";
    $("bc-src").textContent="Sources: "+((S.corp&&S.corp.sources)||"BSE & NSE bhavcopy; NSDL India Bond Info")+" RBI policy rates and CPI as published by RBI and MoSPI.";
    if(S.corp) $("k-pick").innerHTML='<option value="">Enter manually</option>'+S.corp.list.slice().sort(function(a,b){return a.issuer.localeCompare(b.issuer);}).map(function(b){ return '<option value="'+esc(b.isin)+'">'+esc(b.issuer)+" ("+(b.coupon!=null?b.coupon+"%, ":"")+(b.perp?"perpetual":(b.maturity||"").slice(0,4))+")</option>"; }).join("");
    if(S.corp) $("k-list").innerHTML=S.corp.list.map(function(b){ return '<option value="'+esc(b.isin+" — "+b.issuer+(b.coupon!=null?" "+b.coupon+"%":"")+(b.maturity&&!b.perp?" "+fd(b.maturity):""))+'"></option>'; }).join("");
    var hs=(location.hash||""), hq=hs.indexOf("?")>=0?hs.slice(hs.indexOf("?")+1):"", h=hs.split("?")[0].replace("#bonds-","");
    if(h==="corp"&&hq&&S.corp) applyQuery(hq);
    addSpreads(); renderStats(); syncSort(); renderColls(); renderMy(); checkAlerts(); qBtns(); renderGov(); renderCorp(); renderRates(); renderFd();
    if(h==="rates") h="gov";   // जुना "Rates & curve" tab आता Govt & Gold मध्ये
    if(["gov","corp","cmp","calc","plan","pf"].indexOf(h)>=0) showTab(h,false);
    hashReady=true;
    var m=(location.hash||"").match(/^#bond-([A-Z0-9]{12})$/); if(m&&S.corp){ showTab("corp",false); openBond(m[1],false); }
  });
  syncTop(); setTimeout(syncTop,800); window.addEventListener("resize",syncTop);
  // header खाली scroll केल्यावर लपतो / लहान होतो — त्याच्या हालचालीबरोबर tabs पण हलतात
  var stk=false; function tick(n){ syncTop(); if(n>0) requestAnimationFrame(function(){ tick(n-1); }); }
  window.addEventListener("scroll",function(){ if(!stk){ stk=true; requestAnimationFrame(function(){ stk=false; tick(20); }); } },{passive:true});
  var rt; window.addEventListener("resize",function(){ clearTimeout(rt); rt=setTimeout(function(){ if(S.mkt) drawCurve((S.mkt.curve||[]).slice().sort(function(a,b){return a.t-b.t;})); },150); });
})();
