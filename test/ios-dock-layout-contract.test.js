const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const frame=fs.readFileSync('css/frame-system-v2.css','utf8');
const legacy=[
  fs.readFileSync('css/ast-012-4.css','utf8'),
  fs.readFileSync('css/designer-mode.css','utf8'),
  fs.readFileSync('css/pwa-fullscreen-fix.css','utf8')
].join('\n');
const startup=fs.readFileSync('js/startup-sequence-layering-fix.js','utf8');

test('dock contract counts the safe area exactly once',()=>{
  assert.match(frame,/--dock-safe-bottom:env\(safe-area-inset-bottom,0px\)/);
  assert.match(frame,/--dock-functional-height:var\(--nav-h,148px\)/);
  assert.match(frame,/--dock-total-height:calc\(var\(--dock-functional-height\) \+ var\(--dock-safe-bottom\)\)/);
  assert.match(frame,/height:var\(--dock-total-height\)!important/);
  assert.doesNotMatch(legacy,/--pwa-dock-visible-h|bottom:calc\(0px - var\(--pwa-safe-bottom\)/);
});

test('painted dock surface covers the total border box',()=>{
  assert.match(frame,/\.frameShellBottom\.pipDock::after\{[\s\S]*?inset:0!important/);
  assert.doesNotMatch(frame,/bottom:calc\(7px \+ env\(safe-area-inset-bottom\)\)/);
});

test('dock rows have no compensating vertical transform',()=>{
  assert.match(frame,/\.frameShellBottom \.dockActions,[\s\S]*?\.frameShellBottom \.nav\{[\s\S]*?transform:none!important/);
  assert.doesNotMatch(startup,/translateY\((?:7|13)px\)/);
  assert.doesNotMatch(startup,/--startup-dock-offset|getBoundingClientRect\(\)\.top/);
});
