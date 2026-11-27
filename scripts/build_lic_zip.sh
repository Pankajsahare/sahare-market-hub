#!/usr/bin/env bash
# A4U LIC Calculator release zip: source तसाच ठेवून, zip मधल्या JS/CSS minify (esbuild)
# वापर: scripts/build_lic_zip.sh <version>     (उदा. 4.5.0)
set -euo pipefail
VER="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/wp/a4u-lic-calculator/plugin/a4u-lic-calculator"
OUT="$ROOT/wp/a4u-lic-calculator/a4u-lic-calculator-$VER.zip"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -r "$SRC" "$TMP/a4u-lic-calculator"
rm -f "$TMP/a4u-lic-calculator/assets/data/lic-tariff.json"   # फक्त tests साठी; zip मध्ये नको
ESB="${ESBUILD:-npx --yes esbuild}"
for f in "$TMP"/a4u-lic-calculator/assets/*.js "$TMP"/a4u-lic-calculator/assets/*.css; do
	ext="${f##*.}"
	$ESB "$f" --minify --charset=utf8 --legal-comments=none --log-level=warning --outfile="$f.min.$ext" --allow-overwrite
	mv "$f.min.$ext" "$f"
done
for f in "$TMP"/a4u-lic-calculator/assets/*.js; do node --check "$f"; done   # minify नंतर JS तपासणी
rm -f "$OUT"
(cd "$TMP" && zip -qr "$OUT" a4u-lic-calculator)
echo "built $OUT ($(du -h "$OUT" | cut -f1))"
