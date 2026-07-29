const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const bootstrap=fs.readFileSync('js/startup-gate.js','utf8');
const sequence=fs.readFileSync('js/startup-sequence-layering-fix.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('legacy startup animation owner is absent',()=>{
  assert.doesNotMatch(bootstrap,/function markOpening|rotor\.classList\.add\('is-open'\)/);
  assert.doesNotMatch(bootstrap,/SHUTTER_OPEN_MS|ACCESS_COLLAPSE_MS|ACCESS_PRESS_DELAY_MS/);
});

test('current sequence owns opening classes',()=>{
  assert.match(sequence,/frameStartupControls--opening/);
  assert.match(sequence,/frameStartup--opening/);
  assert.match(sequence,/stopImmediatePropagation\(\)/);
});

test('service worker serves HTML without rewriting it',()=>{
  assert.doesNotMatch(sw,/injectPwaStyles|new Response\(output/);
});
