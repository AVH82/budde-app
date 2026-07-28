const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const fix=fs.readFileSync('js/startup-sequence-layering-fix.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('mode controls are anchored from the measured dock top',()=>{
  assert.match(fix,/--startup-dock-offset/);
  assert.match(fix,/getBoundingClientRect\(\)\.top/);
  assert.match(fix,/bottom:calc\(var\(--startup-dock-offset/);
});

test('local mode is intercepted before legacy handlers and shutters open after collapse',()=>{
  assert.match(fix,/stopImmediatePropagation\(\)/);
  assert.match(fix,/setTimeout\(\(\)=>\{\s*rotor\.classList\.add\('is-open'\)/s);
  assert.match(fix,/setTimeout\(\(\)=>\{\s*controls\.hidden=true;[\s\S]*startupSequenceOpen/s);
});

test('bottom shutter extends behind the dock and glow remains contained',()=>{
  assert.match(fix,/\.frameShutter--bottom\{[\s\S]*bottom:0!important/s);
  assert.match(fix,/\.startupAccessGlow\{[\s\S]*filter:none!important;[\s\S]*box-shadow:inset/s);
});

test('service worker injects and versions the layering fix',()=>{
  assert.match(sw,/startup-sequence-layering-fix\.js\?v=startup-layering-1/);
  assert.match(sw,/budde-3-6-55-startup-layering-1/);
});
