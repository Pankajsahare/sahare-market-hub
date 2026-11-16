# Bond Centre assets

- `src/bond-centre.js` — मूळ (वाचता येणारा) code. बदल इथेच करायचे.
- `bond-centre.js` — वरच्याच file ची छोटी (minified) आवृत्ती; साईट हीच load करते.
  बनवायची पद्धत: `npx terser src/bond-centre.js -c -m --comments '/^!/' -o bond-centre.js`
- `bond-centre.css`, `logo.png` — styles आणि PDF साठी logo.

`main` वर या folder मध्ये बदल झाला की "Purge jsDelivr cache" workflow CDN ताजा करतो.
