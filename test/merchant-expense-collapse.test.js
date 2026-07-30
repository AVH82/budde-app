const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('js/app.js', 'utf8');
const css = fs.readFileSync('css/pipboy.css', 'utf8');

assert.match(app, /let openMerchantKey=null/, 'collapse state remains UI-only');
assert.match(app, /\(db\.expenses\|\|\[\]\)\.forEach/, 'all expenses feed merchant groups');
assert.match(app, /openMerchantKey===key\?null:key/, 'opening the active merchant closes it');
assert.match(app, /if\(openMerchantKey&&!groups\.has\(openMerchantKey\)\)openMerchantKey=null/, 'a removed merchant closes cleanly');
assert.match(app, /group\.expenses\.sort\(\(a,b\)=>String\(b\.dateISO/, 'history is newest first');
assert.match(app, /isOpen\?expenses\.map\(row\)\.join\(''\):''/, 'the existing expense row renderer is reused and closed histories are not rendered');
assert.match(app, /aria-expanded/, 'merchant summary exposes its expanded state');
assert.match(app, /event\.target\.closest\('\[data-expense-action\],\[data-ticket-id\]'\)/, 'expense actions do not toggle the merchant');
assert.match(app, /Aucun commerçant enregistré/, 'empty state is explicit');
assert.match(css, /\.merchantSummary:focus-visible/, 'keyboard focus is visible');

console.log('✓ merchant expense collapse contract');
