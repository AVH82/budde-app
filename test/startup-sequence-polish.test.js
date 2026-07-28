const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const startup=fs.readFileSync('js/startup-gate.js','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
const worker=fs.readFileSync('service-worker.js','utf8');

test('mode controls are anchored directly above the dock on every viewport',()=>{
  assert.match(startup,/bottom:calc\(var\(--nav-h\) \+ 4px\)!important/);
  assert.doesNotMatch(startup,/bottom:calc\(var\(--nav-h\) \+ env\(safe-area-inset-bottom\)/);
});

test('all dock controls are dark before mode selection',()=>{
  assert.match(startup,/\.startupModePending \.frameShellBottom \.nav button,/);
  assert.match(startup,/\.startupModePending \.frameShellBottom \.dockActions button/);
});

test('mode collapse finishes before shutter opening begins',()=>{
  assert.match(startup,/ACCESS_PRESS_DELAY_MS=500/);
  assert.match(startup,/ACCESS_COLLAPSE_MS=420/);
  assert.match(startup,/setTimeout\(openShutters,collapseDuration\+ACCESS_POST_COLLAPSE_MS\)/);
  assert.match(startup,/gate\.classList\.add\('frameStartup--opening','entryGate--opening'\)/);
});

test('home scanner and add ignite during opening',()=>{
  assert.match(startup,/\.startupModeActivating \.frameShellBottom \.nav button\[data-view="home"\],/);
  assert.match(startup,/\.startupModeActivating \.frameShellBottom \.dockActions button/);
});

test('installed app requests black system chrome and a new cache',()=>{
  assert.equal(manifest.background_color,'#000000');
  assert.equal(manifest.theme_color,'#000000');
  assert.match(startup,/status\.content='black'/);
  assert.match(worker,/startup-sequence-2/);
});