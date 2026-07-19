const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');

const startup = () => read('js/startup-gate.js');
const css = () => read('css/frame-system-v2.css');

test('startup gate builds one panel assembly from all three PNG assets', () => {
  for (const asset of ['startup-access-panel.png','network-mode-button.png','local-mode-button.png']) {
    assert.equal(fs.existsSync(`assets/frame/${asset}`), true, `${asset} is available`);
    assert.match(startup(), new RegExp(`assets/frame/${asset.replace('.', '\\.')}`));
  }
  assert.match(startup(), /startupAccessAssembly/);
  assert.match(startup(), /startupAccessPanel/);
});

test('assembly owns rotation and buttons have no independent opening animation', () => {
  assert.match(css(), /\.frameStartupControls--opening \.startupAccessAssembly\{animation:startupAccessAssemblyOpen/);
  assert.match(css(), /@keyframes startupAccessAssemblyOpen/);
  assert.match(css(), /transform-origin:center center/);
  assert.match(css(), /transform-style:preserve-3d/);
  assert.match(css(), /startupAccessAssembly::after/);
  assert.match(css(), /height:8px/);
  assert.doesNotMatch(css(), /frameStartupNetworkOpen|frameStartupLocalOpen/);
  assert.match(css(), /frameStartupChoice>button[^{]*\{[^}]*animation:none!important/s);
});

test('network and local CSS glow layers sit in the assembly selection model', () => {
  assert.match(startup(), /startupAccessGlow--network/);
  assert.match(startup(), /startupAccessGlow--local/);
  assert.match(css(), /startupAccessGlow--network/);
  assert.match(css(), /startupAccessGlow--local/);
  assert.match(css(), /selected-network \.startupAccessGlow--network/);
  assert.match(css(), /selected-local \.startupAccessGlow--local/);
});

test('AST-054 versions and precaches the complete access assembly', () => {
  const sw=read('service-worker.js');
  const index=read('index.html');
  const app=read('js/app.js');
  assert.match(app, /APP_VERSION='3\.6\.51'/);
  assert.match(sw, /CACHE_NAME='budde-3-6-51'/);
  assert.match(sw, /assets\/frame\/startup-access-panel\.png/);
  assert.match(sw, /assets\/frame\/network-mode-button\.png/);
  assert.match(sw, /assets\/frame\/local-mode-button\.png/);
  assert.match(index, /frame-system-v2\.css\?v=ast054/);
  assert.match(index, /startup-gate\.js\?v=ast054/);
});
