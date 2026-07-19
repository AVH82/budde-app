const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = () => fs.readFileSync('js/app.js', 'utf8');
const css = () => fs.readFileSync('css/ast-013-2.css', 'utf8');
const index = () => fs.readFileSync('index.html', 'utf8');
const sw = () => fs.readFileSync('service-worker.js', 'utf8');
const startup = () => fs.readFileSync('js/startup-gate.js', 'utf8');

test('AST-046 scan opening keeps receiptCamera stable during camera initialization', () => {
  const source = app();
  assert.match(source, /cameraRequested:false,cameraInitializing:false,cameraActive:false,cameraError:null,cameraCloseReason:null/);
  assert.match(source, /setView\('receiptCamera','openReceiptScanner'\)/);
  assert.match(source, /receiptScannerState\.cameraInitializing=true/);
  assert.match(source, /receiptScannerState\.cameraActive=!!receiptCameraStream/);
  const fallbackBody = source.slice(source.indexOf('function fallbackReceiptPhoto'), source.indexOf('function stopReceiptCamera'));
  assert.doesNotMatch(fallbackBody, /setView\(/);
});

test('AST-046 scanner closes only through explicit cancel/back handlers', () => {
  const source = app();
  assert.match(source, /function cancelReceiptCamera\(event\)\{event\?\.preventDefault\?\.\(\);event\?\.stopPropagation\?\.\(\)/);
  assert.match(source, /function cancelReceiptScanner\(event\)\{event\?\.preventDefault\?\.\(\);event\?\.stopPropagation\?\.\(\)/);
  assert.match(source, /setView\(receiptReturnView\|\|'home','cancelReceiptCamera'\)/);
  assert.match(source, /setView\(receiptReturnView\|\|'home','cancelReceiptScanner'\)/);
});

test('AST-046 camera errors stay on scanner UI with manual return available', () => {
  const source = app();
  assert.match(source, /function fallbackReceiptPhoto\(message='Caméra intégrée indisponible\.'\)\{receiptScannerState\.step='camera-error'/);
  assert.match(source, /setCameraMessage\(`\$\{message\} Tu peux revenir avec ANNULER\.`, 'error'\)/);
  assert.match(source, /debugScanner\('camera-error'/);
});

test('AST-046 debugScanner is URL-gated and traces view, camera, video and rotor state', () => {
  const source = app();
  assert.match(source, /new URLSearchParams\(window\.location\.search\)\.has\('debugScanner'\)/);
  assert.match(source, /console\.info\('\[debugScanner\]'/);
  assert.match(source, /debugScanner\('setView',\{caller:source,from:previousView,to:v\}\)/);
  assert.match(source, /rotorPhase:document\.querySelector\('\.settingsTrustModule'\)\?\.className/);
  assert.match(source, /\['loadedmetadata','playing','pause','ended','error'\]/);
});

test('AST-048 rotor is view-driven and trustmeter internals keep validated scale with final horizontal centering', () => {
  const source = app();
  const style = css();
  assert.match(source, /const scanHeaderActive=activeView==='receiptScanner'\|\|activeView==='receiptCamera'/);
  assert.doesNotMatch(source, /settingsTrustModule--trust[\s\S]{0,160}setView\(/);
  assert.match(style, /--trustmeter-scale:1\.08;/);
  assert.match(style, /--dial-scale:168\.49%;/);
  assert.match(style, /--needle-scale:64\.022%;/);
  assert.doesNotMatch(style, /--(?:dial|needle)-scale:calc\([^;]*\*[^;]*\);/);
  assert.match(style, /--dial-offset-x:8\.3%;/);
  assert.match(style, /--needle-offset-x:5\.3%;/);
});

test('AST-048 version, cache and cache-busting are coherent', () => {
  assert.match(app(), /const APP_VERSION='3\.6\.51'/);
  assert.match(app(), /const EXPECTED_CACHE_NAME=APP_BUILD_ID/);
  assert.match(index(), /Budd€ v3\.6\.51/);
  assert.match(index(), /build budde-3-6-51/);
  assert.match(index(), /v=ast054/);
  assert.match(sw(), /const CACHE_NAME='budde-3-6-51'/);
  assert.match(sw(), /js\/app\.js\?v=ast054/);
  assert.match(startup(), /v=ast054/);
});
