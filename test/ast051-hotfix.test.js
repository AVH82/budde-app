const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');
const app = () => read('js/app.js');
const css = () => read('css/ast-012-4.css') + '\n' + read('css/ast-013-2.css');
const index = () => read('index.html');
const sw = () => read('service-worker.js');
const startup = () => read('js/startup-gate.js');

test('AST-051 version, cache and cache-busting are coherent', () => {
  const forbidden = ['3.6.' + '45', 'budde-3-6-' + '45', 'ast0' + '48', '3.6.' + '46', 'budde-3-6-' + '46', 'ast0' + '49', '3.6.' + '47', 'budde-3-6-' + '47', 'ast0' + '50'];
  for (const source of [app(), index(), sw(), startup(), read('css/ast-012-4.css'), read('css/frame-core.css')]) {
    for (const token of forbidden) assert.equal(source.includes(token), false, `unexpected legacy token ${token}`);
  }
  assert.match(app(), /const APP_VERSION='3\.6\.55'/);
  assert.match(sw(), /const CACHE_NAME='budde-3-6-55'/);
  assert.match(index(), /v=ast058/);
});

test('AST-051 debug build and layer diagnostics are URL gated', () => {
  assert.match(app(), /const DEBUG_BUILD=new URLSearchParams\(window\.location\.search\)\.get\('debugBuild'\)==='1'/);
  assert.match(app(), /console\.info\('\[debugBuild\]'/);
  assert.match(app(), /const DEBUG_LAYERS=new URLSearchParams\(window\.location\.search\)\.get\('debugLayers'\)==='1'/);
  assert.match(app(), /window\.BuddeDebugLayers=api/);
  assert.match(app(), /console\.table\(rows\)/);
});

test('AST-051 only one rotor face paints and receives input in each state', () => {
  const style = css();
  assert.match(style, /backface-visibility:hidden!important/);
  assert.match(style, /-webkit-backface-visibility:hidden!important/);
  assert.match(style, /settingsTrustModule:not\(\.settingsTrustModule--trust\) \.settingsTrustFace--trust[\s\S]*?opacity:0!important;[\s\S]*?visibility:hidden!important;[\s\S]*?pointer-events:none!important/);
  assert.match(style, /settingsTrustModule--trust \.settingsTrustFace--settings[\s\S]*?opacity:0!important;[\s\S]*?visibility:hidden!important;[\s\S]*?pointer-events:none!important/);
});

test('AST-051 Trustmeter dial is not clipped by the viewport mask in scan mode and layer order is explicit', () => {
  const style = css();
  assert.match(style, /settingsTrustModule--trust \.headerTrustGauge,[\s\S]*?settingsTrustModule--trust \.headerTrustGauge \.settingsTrustViewport\{[\s\S]*?overflow:visible!important;[\s\S]*?clip-path:none!important/);
  assert.match(style, /settingsTrustModule--trust \.settingsTrustAsset--dial\{z-index:1!important;\}/);
  assert.match(style, /settingsTrustModule--trust \.settingsTrustNeedle\{z-index:2!important;\}/);
  assert.match(style, /settingsTrustModule>\.headerFrameImage--trust\{z-index:3!important;\}/);
});

test('AST-051 camera debug and iOS startup/capture flow remain available', () => {
  const source = app();
  assert.match(source, /\[debugScanner\]/);
  assert.match(source, /video\.playsInline=true/);
  assert.match(source, /video\.setAttribute\('playsinline',''\)/);
  assert.match(source, /debugScanner\('video\.srcObject:set'/);
  assert.match(source, /debugScanner\('video\.play:success'\)/);
  assert.match(source, /debugScanner\('capture:not-ready'/);
  assert.doesNotMatch(source, /Flux caméra pas encore prêt\. J’utilise le module photo classique/);
});

test('AST-051 Designer Mode remains gated and calibration is unchanged', () => {
  assert.match(read('js/designer-mode.js'), /const ACTIVE=PARAMS\.get\('designer'\)==='1'\|\|PARAMS\.get\('debugDesigner'\)==='1'/);
  for (const token of [
    '--dial-offset-x:8.3%;', '--dial-offset-y:0.2%;', '--needle-offset-x:5.3%;', '--needle-offset-y:0%;',
    '--dial-scale:168.49%;', '--needle-scale:64.022%;', '--radiation-visible-center-x:50.946%;', '--radiation-visible-center-y:47.662%;'
  ]) assert.match(read('css/ast-013-2.css'), new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
