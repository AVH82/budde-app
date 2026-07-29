const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const bootstrap=fs.readFileSync('js/startup-gate.js','utf8');
const sequence=fs.readFileSync('js/startup-sequence-layering-fix.js','utf8');
const frame=fs.readFileSync('css/frame-system-v2.css','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');

test('startup sequence uses the shared CSS dock contract',()=>{
  assert.match(frame,/\.frameStartupControls\{[\s\S]*bottom:calc\(var\(--dock-total-height\) - 2px\)/);
  assert.match(frame,/\.frameStartupControls--opening\{[\s\S]*var\(--dock-total-height\)/);
  assert.doesNotMatch(sequence,/--startup-dock-offset|getBoundingClientRect\(\)\.top/);
});

test('the sequence script is the only owner of the opening transition',()=>{
  assert.match(sequence,/stopImmediatePropagation\(\)/);
  assert.match(sequence,/controls\.classList\.add\('frameStartupControls--opening'\)/);
  assert.match(sequence,/gate\.classList\.add\('frameStartup--opening','entryGate--opening','startupSequenceOpen'\)/);

  assert.doesNotMatch(bootstrap,/function markOpening|startupAccessRotor\.is-open|rotor\.classList\.add\('is-open'\)/);
  assert.doesNotMatch(bootstrap,/entryOfflineButton[\s\S]*addEventListener\('click'/);
  assert.doesNotMatch(bootstrap,/GoogleAuthService\?\.onChange/);
});

test('bootstrap builds extra shutter coverage for tall standalone screens',()=>{
  assert.match(bootstrap,/const SHUTTER_COVERAGE_MARGIN=5/);
  assert.match(bootstrap,/Math\.ceil\(\(usableHeight\/2\)\/slatHeight\)\+SHUTTER_COVERAGE_MARGIN/);
});

test('startup controls share the shell stacking context and descend behind the dock',()=>{
  assert.match(bootstrap,/const shell=document\.querySelector\('\.app\.frameShell'\)/);
  assert.match(bootstrap,/\(shell\|\|document\.body\)\.appendChild\(controls\)/);
  assert.match(bootstrap,/\.app\.frameShell>\.frameStartupControls\{position:absolute!important;\}/);
  assert.match(bootstrap,/frameStartupControls--opening\{[\s\S]*z-index:calc\(var\(--frame-z-chrome\) - 1\)!important/);
  assert.match(sequence,/controls\.classList\.add\('frameStartupControls--opening'\)/);
  assert.match(sequence,/setTimeout\(\(\)=>\{\s*controls\.hidden=true;\s*activateDock\(\)/s);
});

test('operational navigation has no prolonged startup ignition override',()=>{
  assert.match(sequence,/function setActiveNav\(view='home'\)/);
  assert.match(sequence,/button\.classList\.toggle\('active',active\)/);
  assert.match(sequence,/requestAnimationFrame\(\(\)=>setActiveNav\(view\)\)/);
  assert.doesNotMatch(sequence,/function igniteDock|classList\.add\('startupModeActivating'\)/);
  assert.doesNotMatch(bootstrap,/startupDockIgnition|startupModeActivating \.frameShellBottom/);
});

test('bootstrap only builds and resets the startup scene',()=>{
  assert.match(bootstrap,/function buildFrameStartup\(\)/);
  assert.match(bootstrap,/function showGate\(gate\)/);
  assert.match(bootstrap,/setDockStartupState\(true\)/);
  assert.doesNotMatch(bootstrap,/SHUTTER_OPEN_MS|ACCESS_COLLAPSE_MS|ACCESS_PRESS_DELAY_MS/);
});

test('service worker no longer mutates HTML to inject startup assets',()=>{
  assert.doesNotMatch(sw,/injectPwaStyles|html\.replace\('\<\/body\>'|data-startup-layering/);
  assert.match(sw,/startup-sequence-layering-fix\.js\?v=startup-cleanup-1/);
  assert.match(sw,/budde-3-6-55-startup-cleanup-1/);
});

test('deployment has one explicit startup script injection path',()=>{
  const injections=workflow.match(/startup-sequence-layering-fix\.js/g)||[];
  assert.ok(injections.length>=1);
  assert.match(workflow,/data-startup-layering="direct"/);
});