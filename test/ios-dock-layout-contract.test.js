const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const frame=fs.readFileSync('css/frame-system-v2.css','utf8');
const pwa=fs.readFileSync('css/pwa-fullscreen-fix.css','utf8');
const legacy=[
  fs.readFileSync('css/ast-012-4.css','utf8'),
  fs.readFileSync('css/designer-mode.css','utf8'),
  pwa
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

test('installed WebApp keeps an extended painted shell',()=>{
  assert.match(pwa,/--pwa-safe-top:\s*env\(safe-area-inset-top,\s*0px\)/);
  assert.match(pwa,/--pwa-physical-height:\s*calc\(100dvh \+ var\(--pwa-safe-top\)\)/);
  assert.match(pwa,/height:\s*var\(--pwa-physical-height\)\s*!important/);
  assert.match(pwa,/max-height:\s*var\(--pwa-physical-height\)\s*!important/);
});

test('installed WebApp header begins below the iOS top safe area',()=>{
  assert.match(pwa,/\.frameShellTop,[\s\S]*?body\.scannerFullscreen \.frameShellTop\s*\{[\s\S]*?top:\s*var\(--pwa-safe-top\)\s*!important/);
});

test('startup controls rest above the visible dock and remain clickable',()=>{
  assert.match(pwa,/\.frameShellBottom\.pipDock\s*\{[\s\S]*?bottom:\s*var\(--pwa-safe-top\)\s*!important/);
  assert.match(pwa,/\.frameStartupControls\s*\{[\s\S]*?bottom:\s*calc\(var\(--dock-total-height\) \+ var\(--pwa-safe-top\) - 2px\)\s*!important/);
  assert.match(pwa,/\.entryGate\.frameStartup\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
  assert.match(pwa,/\.frameStartupControls\s*\{[\s\S]*?pointer-events:\s*auto\s*!important[\s\S]*?z-index:\s*var\(--frame-z-startup\)\s*!important/);
});

test('lower shutter keeps its central junction and extends behind the lifted dock',()=>{
  assert.match(pwa,/\.frameShutter--bottom\s*\{[\s\S]*?bottom:\s*calc\(var\(--dock-total-height\) - 2px\)\s*!important/);
  assert.doesNotMatch(pwa,/\.frameStartupControls,\s*\.frameShutter--bottom/);
  assert.doesNotMatch(pwa,/\.frameShutter--bottom\s*\{[\s\S]*?var\(--pwa-safe-top\)/);
});

test('startup controls become non-interactive and pass under the dock only while opening',()=>{
  assert.match(pwa,/\.frameStartupControls--opening\s*\{[\s\S]*?pointer-events:\s*none\s*!important[\s\S]*?z-index:\s*calc\(var\(--frame-z-chrome\) - 1\)\s*!important/);
});

test('obsolete decorative bottom extension is fully removed',()=>{
  assert.doesNotMatch(pwa,/pwa-physical-bottom-extension|dockPhysicalExtension/);
  assert.doesNotMatch(startup,/syncPhysicalBottomExtension|dockPhysicalExtension|screen\?\.height|--pwa-physical-bottom-extension/);
});