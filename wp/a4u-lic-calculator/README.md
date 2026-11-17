# A4U LIC Calculator (WordPress plugin)

advisor4u.in/lic-calculator/ वरचं LIC premium calculator.

- **नवीन version प्रसिद्ध करायचं:** नवीन zip इथे `a4u-lic-calculator-X.Y.Z.zip` नावाने टाका आणि `update.json` मध्ये `version` + `download_url` बदला.
  WordPress 6 तासांच्या आत "Update available" दाखवतो (Dashboard → Updates → Check again ने लगेच).
- **LIC data:** `data/lic/lic-plans.json` — `.github/workflows/lic_plans.yml` दर सोमवारी भरतो. Plugin रोज वाचतो, admin Approve नंतरच लागू.

## v3.0 पासून रचना
- `plugin/a4u-lic-calculator/` — plugin चा source (PHP `includes/` मध्ये विभागलेला).
- `tests/golden.js` — LIC brochure मधले सगळे नमुने तपासणारे golden tests. Pipeline प्रत्येक run नंतर हे चालवतो; चुकले तर नवीन data commit होत नाही.
- **Release channels:** `update-beta.json` (staging site, Settings → Update channel = Beta) आधी; staging वर ठीक वाटलं की तेच version `update.json` (live) मध्ये.
