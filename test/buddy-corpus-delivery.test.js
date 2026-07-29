const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('index charge explicitement les services Buddy synchronisés',()=>{
  assert.match(html,/storage\.google-drive\.js\?v=buddy-learning-sync-2/);
  assert.match(html,/ocr-diagnostic\.service\.js\?v=buddy-learning-sync-2/);
  assert.doesNotMatch(html,/storage\.google-drive\.js\?v=pr252/);
  assert.doesNotMatch(html,/ocr-diagnostic\.service\.js\?v=366/);
});

test('interface décrit la synchronisation réelle du corpus Buddy',()=>{
  assert.match(html,/diagnostics et justificatifs sont fusionnés dans le corpus privé Buddy sur Drive/);
  assert.doesNotMatch(html,/Aucun envoi automatique/);
});

test('service worker renouvelle le cache de livraison Buddy',()=>{
  assert.match(sw,/buddy-learning-sync-2/);
  assert.match(sw,/storage\.google-drive\.js\?v=buddy-learning-sync-2/);
  assert.match(sw,/ocr-diagnostic\.service\.js\?v=buddy-learning-sync-2/);
});
