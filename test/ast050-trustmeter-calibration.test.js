const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = () => fs.readFileSync('css/ast-013-2.css', 'utf8');
const designer = () => fs.readFileSync('js/designer-mode.js', 'utf8');
const app = () => fs.readFileSync('js/app.js', 'utf8');
const index = () => fs.readFileSync('index.html', 'utf8');
const sw = () => fs.readFileSync('service-worker.js', 'utf8');
const startup = () => fs.readFileSync('js/startup-gate.js', 'utf8');

test('AST-050 production Trustmeter calibration values are final and intentionally independent', () => {
  const style = css();
  assert.match(style, /--dial-offset-x:8\.3%;/);
  assert.match(style, /--dial-offset-y:0\.2%;/);
  assert.match(style, /--needle-offset-x:5\.3%;/);
  assert.match(style, /--needle-offset-y:0%;/);
  assert.match(style, /--dial-scale:168\.49%;/);
  assert.match(style, /--needle-scale:64\.022%;/);
  assert.match(style, /--radiation-visible-center-x:50\.946%;/);
  assert.match(style, /--radiation-visible-center-y:47\.662%;/);
  assert.doesNotMatch(style, /--needle-offset-x:var\(--dial-offset-x\)/);
  assert.doesNotMatch(designer(), /next\.needleOffsetX=next\.dialOffsetX/);
});

test('AST-050 removes the asymmetric Trustmeter face clipping and keeps a single viewport aperture', () => {
  const style = css();
  assert.match(style, /\.frameShellTop \.headerTrustGauge\{[\s\S]*?overflow:visible!important;[\s\S]*?\}/);
  assert.match(style, /\.frameShellTop \.settingsTrustViewport\{[\s\S]*?border-radius:50%!important;[\s\S]*?overflow:hidden!important;[\s\S]*?\}/);
  assert.match(style, /\.frameShellTop \.settingsTrustAsset--dial\{[\s\S]*?z-index:1!important;[\s\S]*?\}/);
  assert.match(style, /\.frameShellTop \.settingsTrustNeedle\{[\s\S]*?z-index:2!important;[\s\S]*?\}/);
  assert.match(style, /\.frameShellTop \.settingsTrustModule>\.headerFrameImage--trust\{[\s\S]*?z-index:3!important;[\s\S]*?\}/);
  assert.match(style, /\.frameShellTop \.settingsHotspot\{[\s\S]*?z-index:4!important;[\s\S]*?\}/);
  assert.match(style, /\.frameShellTop \.settingsHotspot::before,[\s\S]*?\.frameShellTop \.headerTrustGauge::after\{content:none!important;display:none!important;\}/);
});

test('AST-050 version build cache and cache-busting are coherent', () => {
  assert.match(app(), /const APP_VERSION='3\.6\.47'/);
  assert.match(app(), /const APP_BUILD_ID=`budde-\$\{APP_VERSION\.replaceAll\('\.','-'\)\}`/);
  assert.match(index(), /Budd€ v3\.6\.47/);
  assert.match(index(), /build budde-3-6-47/);
  assert.match(index(), /v=ast050/);
  assert.match(sw(), /const CACHE_NAME='budde-3-6-47'/);
  assert.match(sw(), /js\/app\.js\?v=ast050/);
  assert.match(startup(), /v=ast050/);
});
