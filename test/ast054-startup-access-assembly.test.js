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
  assert.match(startup(), /startup-access-panel\.png\?v=ast055/);
  assert.match(css(), /startup-access-panel\.png\?v=ast055/);
  assert.match(css(), /border-image-slice:190 175 fill/);
  assert.match(css(), /border-image-repeat:stretch/);
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

test('startup controls follow the footer real box and viewport changes', () => {
  assert.match(startup(), /querySelector\('\.frameShellBottom'\)/);
  assert.match(startup(), /footer\.getBoundingClientRect\(\)/);
  assert.match(startup(), /footer\.querySelector\('\.dockActions'\)/);
  assert.match(startup(), /dockActions\?\.getBoundingClientRect\(\)/);
  assert.match(startup(), /--startup-dock-actions-height/);
  for (const property of ['left','bottom','width','height']) {
    assert.match(startup(), new RegExp(`controls\\.style\\.${property}=`));
  }
  assert.match(startup(), /addEventListener\('resize',refreshStartupControlsBox\)/);
  assert.match(startup(), /addEventListener\('orientationchange',refreshStartupControlsBox\)/);
  assert.match(startup(), /requestAnimationFrame\(syncStartupControlsToFooter\)/);
});

test('assembly fills and isolates the measured box with ordered layers', () => {
  assert.match(css(), /\.startupAccessAssembly\{[^}]*position:absolute;[^}]*inset:0;[^}]*isolation:isolate;/s);
  assert.match(css(), /\.startupAccessPanel\{[^}]*z-index:0;/s);
  assert.match(css(), /\.startupAccessGlow\{[^}]*z-index:1;/s);
  assert.match(css(), /\.frameStartupChoice\{[^}]*z-index:2;/s);
  assert.match(css(), /\.sr-only\{[^}]*clip:rect\(0,0,0,0\)!important;[^}]*clip-path:inset\(50%\)!important;/s);
  assert.doesNotMatch(css(), /\.frameStartupControls\{[^}]*height:[^}]*--nav-h/s);
  assert.match(css(), /grid-template-rows:var\(--startup-dock-actions-height,65px\) minmax\(0,1fr\)/);
});

test('AST-055 versions and precaches the complete access assembly', () => {
  const sw=read('service-worker.js');
  const index=read('index.html');
  const app=read('js/app.js');
  assert.match(app, /APP_VERSION='3\.6\.52'/);
  assert.match(sw, /CACHE_NAME='budde-3-6-52'/);
  assert.match(sw, /assets\/frame\/startup-access-panel\.png\?v=ast055/);
  assert.match(sw, /assets\/frame\/network-mode-button\.png/);
  assert.match(sw, /assets\/frame\/local-mode-button\.png/);
  assert.match(index, /frame-system-v2\.css\?v=ast055/);
  assert.match(index, /startup-gate\.js\?v=ast055/);
});
