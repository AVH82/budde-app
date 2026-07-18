const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');

const startup = () => read('js/startup-gate.js');
const css = () => read('css/frame-system-v2.css');

test('mechanical access controls use both PNG plates and explicit accessible labels', () => {
  assert.match(startup(), /assets\/frame\/network-mode-button\.png/);
  assert.match(startup(), /assets\/frame\/local-mode-button\.png/);
  assert.match(startup(), /NETWORK MODE — cloud synchronization/);
  assert.match(startup(), /LOCAL MODE — device storage/);
  assert.match(startup(), /id=['"]entryGoogleButton|entryGoogleButton/);
  assert.match(startup(), /id=['"]entryOfflineButton|entryOfflineButton/);
});

test('plates hinge in opposite vertical directions without the old lateral opening', () => {
  assert.match(css(), /frameStartupChoice--network\{transform-origin:center top/);
  assert.match(css(), /frameStartupChoice--local\{transform-origin:center bottom/);
  assert.match(css(), /rotateX\(96deg\)/);
  assert.match(css(), /rotateX\(-96deg\)/);
  assert.match(css(), /backface-visibility:hidden/);
  assert.doesNotMatch(css(), /frameStartup(?:Left|Right)Open/);
  assert.doesNotMatch(css(), /frameStartupChoice--(?:left|right)/);
});

test('selection, double-click protection and reduced motion are present', () => {
  assert.match(startup(), /frameStartupControls--selected-network/);
  assert.match(startup(), /frameStartupControls--selected-local/);
  assert.match(startup(), /button\.disabled=true/);
  assert.match(css(), /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css(), /animation-duration:120ms!important/);
});

test('mechanical plates are precached at the coherent AST-053 build', () => {
  const sw=read('service-worker.js');
  const index=read('index.html');
  const app=read('js/app.js');
  assert.match(sw, /CACHE_NAME='budde-3-6-50'/);
  assert.match(sw, /assets\/frame\/network-mode-button\.png/);
  assert.match(sw, /assets\/frame\/local-mode-button\.png/);
  assert.match(index, /startup-gate\.js\?v=ast053/);
  assert.match(app, /APP_VERSION='3\.6\.50'/);
});
