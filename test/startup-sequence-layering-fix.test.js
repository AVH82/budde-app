const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const fix=fs.readFileSync('js/startup-sequence-layering-fix.js','utf8');
const frame=fs.readFileSync('css/frame-system-v2.css','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('startup sequence uses the shared CSS dock contract',()=>{
  assert.match(frame,/\.frameStartupControls\{[\s\S]*bottom:calc\(var\(--dock-total-height\) - 2px\)/);
  assert.match(frame,/\.frameStartupControls--opening\{[\s\S]*var\(--dock-total-height\)/);
  assert.doesNotMatch(fix,/--startup-dock-offset|getBoundingClientRect\(\)\.top/);
});

test('local mode is intercepted before legacy handlers and shutters open after collapse',()=>{
  assert.match(fix,/stopImmediatePropagation\(\)/);
  assert.match(fix,/setTimeout\(\(\)=>\{\s*controls\.classList\.add\('frameStartupControls--opening'\)/s);
  assert.match(fix,/setTimeout\(\(\)=>\{\s*controls\.hidden=true;[\s\S]*startupSequenceOpen/s);
});

test('bottom shutter and controls share the dock top boundary',()=>{
  assert.match(frame,/\.frameShutter--bottom\{[\s\S]*bottom:calc\(var\(--dock-total-height\) - 2px\)/s);
  assert.match(frame,/\.startupAccessGlow\{display:none!important/);
});

test('service worker injects and versions the layering fix',()=>{
  assert.match(sw,/startup-sequence-layering-fix\.js\?v=startup-layering-1/);
  assert.match(sw,/budde-3-6-55-startup-layering-1/);
});
