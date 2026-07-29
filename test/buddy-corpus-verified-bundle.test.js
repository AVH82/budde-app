const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const storage=fs.readFileSync('js/storage.google-drive.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('uses a separate verified Buddy transport bundle',()=>{
  assert.match(storage,/BUNDLE_NAME:'budde-buddy-corpus\.json'/);
  assert.match(storage,/saveVerifiedBundle/);
  assert.match(storage,/await this\.downloadJson\(token,saved\.id\)/);
  assert.match(storage,/Vérification du corpus Buddy échouée/);
});

test('bundle preserves receipt imageData for cross-context preview',()=>{
  assert.match(storage,/tickets:this\.mergeById\([^\n]+local\.tickets\)/);
  assert.match(storage,/loadFromBundle/);
  assert.match(storage,/OcrDiagnosticService\.mergeSnapshot/);
});

test('verified bundle is restored before optimized index',()=>{
  assert.match(storage,/const bundle=await this\.loadFromBundle\(token\)/);
  assert.match(storage,/if\(!bundle\.missing\)return bundle/);
  assert.match(storage,/return this\.loadFromIndex\(token\)/);
});

test('PWA cache is renewed for bundle implementation',()=>{
  assert.match(sw,/buddy-corpus-bundle-1/);
  assert.match(sw,/storage\.google-drive\.js\?v=buddy-corpus-bundle-1/);
});
