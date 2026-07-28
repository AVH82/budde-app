const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('js/startup-gate.js','utf8');

test('the startup mode selector no longer mounts the metal plate',()=>{
  assert.doesNotMatch(source,/createElement\(['"]img['"]\)[\s\S]{0,200}startupAccessPanel/);
  assert.doesNotMatch(source,/startup-access-panel\.png/);
  assert.match(source,/front\.append\(choices\)/);
});

test('mode buttons collapse downward above the navigation dock',()=>{
  assert.match(source,/bottom:calc\(var\(--nav-h\) \+ env\(safe-area-inset-bottom\) \+ 4px\)/);
  assert.match(source,/translateY\(calc\(100% \+ 18px\)\) scale\(\.96\)/);
  assert.match(source,/ACCESS_COLLAPSE_MS=240/);
});

test('navigation is dark before activation and Home ignites during opening',()=>{
  assert.match(source,/startupModePending \.frameShellBottom \.nav button/);
  assert.match(source,/startupModeActivating \.frameShellBottom \.nav button\[data-view="home"\]/);
  assert.match(source,/function activateHomeDock\(\)/);
  assert.match(source,/activateHomeDock\(\);/);
});

test('the mode glows flicker and reduced motion stays supported',()=>{
  assert.match(source,/@keyframes startupModeFlicker/);
  assert.match(source,/prefers-reduced-motion:reduce/);
  assert.match(source,/animation:none!important/);
});