const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');
const startup = () => read('js/startup-gate.js');
const css = () => read('css/frame-system-v2.css');

test('startup gate uses the versioned PNG as a real image', () => {
  assert.equal(fs.existsSync('assets/frame/startup-access-panel.png'), true);
  assert.match(startup(), /createElement\('img'\)/);
  assert.match(startup(), /accessPanel\.className='startupAccessPanel'/);
  assert.match(startup(), /assets\/frame\/startup-access-panel\.png\?v=ast056/);
  assert.doesNotMatch(css(), /border-image-source|border-image-slice/);
  assert.doesNotMatch(startup(), /--startup-access-panel/);
});

test('startup access is one two-faced 3D rotor', () => {
  for (const name of ['startupAccessScene','startupAccessRotor','startupAccessFace--front','startupAccessFace--back']) assert.match(startup(), new RegExp(name));
  assert.match(css(), /\.startupAccessScene\{[^}]*perspective:1000px/s);
  assert.match(css(), /\.startupAccessRotor\{[^}]*position:absolute;[^}]*inset:0;[^}]*transform-style:preserve-3d/s);
  assert.match(css(), /\.startupAccessRotor\.is-open\{transform:rotateX\(180deg\)/);
  assert.match(css(), /\.startupAccessFace\{[^}]*backface-visibility:hidden/s);
  assert.doesNotMatch(css(), /startupAccessAssembly|startupAccessAssemblyOpen|rotateX\(104deg\)/);
  assert.match(css(), /frameStartupChoice>button[^{]*\{[^}]*animation:none!important/s);
});

test('front face owns its image, glows, and aligned buttons in layer order', () => {
  assert.match(startup(), /front\.append\(accessPanel,glowNetwork,glowLocal,left,right\)/);
  assert.match(css(), /\.startupAccessFace--front\{[^}]*isolation:isolate;[^}]*display:grid;[^}]*grid-template-columns:1fr 1fr/s);
  assert.match(css(), /\.startupAccessPanel\{[^}]*object-fit:fill;[^}]*z-index:0/s);
  assert.match(css(), /\.startupAccessGlow\{[^}]*z-index:1/s);
  assert.match(css(), /\.frameStartupChoice\{[^}]*z-index:2;[^}]*height:clamp\(58px,42%,88px\);[^}]*align-self:end/s);
  assert.doesNotMatch(css(), /z-index:-/);
});

test('startup controls track the real footer box and viewport changes', () => {
  assert.match(startup(), /querySelector\('\.frameShellBottom'\)/);
  assert.match(startup(), /footer\.getBoundingClientRect\(\)/);
  for (const property of ['left','bottom','width','height']) assert.match(startup(), new RegExp(`controls\\.style\\.${property}=`));
  assert.match(startup(), /requestAnimationFrame\(syncStartupControlsToFooter\)/);
  assert.match(startup(), /addEventListener\('resize',refreshStartupControlsBox\)/);
  assert.match(startup(), /addEventListener\('orientationchange',refreshStartupControlsBox\)/);
});

test('AST-056 versions and precaches the corrected panel', () => {
  const sw=read('service-worker.js'); const index=read('index.html'); const app=read('js/app.js');
  assert.match(app, /APP_VERSION='3\.6\.53'/);
  assert.match(sw, /CACHE_NAME='budde-3-6-53'/);
  assert.match(sw, /assets\/frame\/startup-access-panel\.png\?v=ast056/);
  assert.match(index, /frame-system-v2\.css\?v=ast056/);
  assert.match(index, /startup-gate\.js\?v=ast056/);
});
