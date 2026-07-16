const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = () => fs.readFileSync('js/designer-mode.js', 'utf8');
const css = () => fs.readFileSync('css/designer-mode.css', 'utf8');
const index = () => fs.readFileSync('index.html', 'utf8');
const app = () => fs.readFileSync('js/app.js', 'utf8');

function runDesigner(search = '') {
  const listeners = [];
  const classSet = new Set();
  const moduleStyle = { values: {}, setProperty(k, v) { this.values[k] = v; }, removeProperty(k) { delete this.values[k]; } };
  const module = { style: moduleStyle, classList: { toggle() {} }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) };
  const body = { appendChild() {}, classList: { add(c) { classSet.add(c); }, remove(c) { classSet.delete(c); }, toggle(c, on) { on ? classSet.add(c) : classSet.delete(c); } } };
  const html = { classList: { add(c) { classSet.add(c); }, remove(c) { classSet.delete(c); } } };
  const document = {
    readyState: 'loading', body, documentElement: html, activeElement: null,
    addEventListener(type, fn) { listeners.push(type); if (type === 'DOMContentLoaded') fn(); },
    removeEventListener() {}, execCommand: () => true,
    createElement: () => ({ className: '', style: {}, innerHTML: '', remove() {}, appendChild() {}, setAttribute() {}, querySelector: () => ({ value: '', checked: false, setAttribute() {}, textContent: '' }), addEventListener() {} }),
    querySelector(sel) {
      if (sel === '.settingsTrustModule') return module;
      return { style: {}, contains: () => true, getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }), classList: { toggle() {} }, querySelector: () => null };
    }
  };
  const context = { window: null, document, navigator: {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, console: { info() {} }, URLSearchParams, innerWidth: 390, innerHeight: 800, devicePixelRatio: 2, requestAnimationFrame: fn => (fn(), 1), getComputedStyle: () => ({ getPropertyValue: v => ({ '--dial-offset-x': '3.3%', '--dial-offset-y': '0.2%', '--needle-offset-x': '3.3%', '--needle-offset-y': '0%', '--dial-scale': '128.52%', '--needle-scale': '49.248%' }[v] || '0%'), transformOrigin: '24px 67px' }), addEventListener(type) { listeners.push(type); }, removeEventListener() {} };
  context.window = { location: { search }, addEventListener: context.addEventListener, removeEventListener() {}, BuddeDesignerMode: null };
  vm.runInNewContext(source(), context);
  return { context, listeners, classSet, moduleStyle };
}

test('AST-049 is isolated without URL parameter', () => {
  const { context, listeners, classSet } = runDesigner('');
  assert.equal(context.window.BuddeDesignerMode.active, false);
  assert.equal(listeners.includes('pointermove'), false);
  assert.equal(classSet.has('designerMode'), false);
});

test('AST-049 creates the panel and debug class with ?designer=1', () => {
  const { context, listeners, classSet } = runDesigner('?designer=1');
  assert.equal(context.window.BuddeDesignerMode.active, true);
  assert.equal(classSet.has('designerMode'), true);
  assert.ok(listeners.includes('pointerdown'));
});

test('AST-049 trustmeter group moves dial and needle with the same x/y variations', () => {
  const src = source();
  assert.match(src, /values\.dialOffsetX\+=dx;values\.needleOffsetX\+=dx;values\.dialOffsetY\+=dy;values\.needleOffsetY\+=dy/);
  assert.match(src, /const reference=.*settingsTrustViewport/);
});

test('AST-049 trustmeter scale stays proportional and avoids CSS calc multiplication', () => {
  const src = source();
  assert.match(src, /values\.dialScale=state\.initial\.dialScale\*factor;values\.needleScale=state\.initial\.needleScale\*factor/);
  assert.doesNotMatch(src, /calc\([^)]*\*/);
});

test('AST-049 live CSS matches applied variables', () => {
  const { context } = runDesigner('?designer=1');
  const cssText = context.window.BuddeDesignerMode.makeCss({ dialOffsetX: 3.7, dialOffsetY: 0.2, needleOffsetX: 3.7, needleOffsetY: 0, dialScale: 128.52, needleScale: 49.248 });
  assert.match(cssText, /--dial-offset-x: 3\.7%;/);
  assert.match(cssText, /--needle-scale: 49\.248%;/);
});

test('AST-049 export/import JSON validation accepts numbers and rejects invalid data', () => {
  const { context } = runDesigner('?designer=1');
  const valid = { version: 1, target: 'trustmeter', values: { dialOffsetX: 1, dialOffsetY: 2, needleOffsetX: 1, needleOffsetY: 2, dialScale: 128, needleScale: 49 } };
  assert.equal(context.window.BuddeDesignerMode.validatePayload(valid).values.dialScale, 128);
  assert.equal(context.window.BuddeDesignerMode.validatePayload({ ...valid, values: { ...valid.values, dialScale: 'evil' } }), null);
});

test('AST-049 reset, debug rotation and isolation do not touch business scan/data flows', () => {
  const src = source();
  assert.match(src, /reset\(\)\{apply\(state\.initial\)\}/);
  assert.match(src, /forceFace\('trust'\)/);
  assert.doesNotMatch(src, /getUserMedia|receiptScannerState|StorageService|normalizeTrustScore|openReceiptScanner/);
});

test('AST-049 files are loaded and styled with prefixed debug classes', () => {
  assert.match(index(), /css\/designer-mode\.css\?v=ast049/);
  assert.match(index(), /js\/designer-mode\.js\?v=ast049/);
  assert.match(css(), /\.designer-panel/);
  assert.match(source(), /designerTargets/);
  assert.match(source(), /budde-designer-v1/);
});

test('AST-049 version and cache are bumped to 3.6.46 ast049', () => {
  assert.match(app(), /const APP_VERSION='3\.6\.46'/);
  assert.match(index(), /Budd€ v3\.6\.46/);
  assert.match(fs.readFileSync('service-worker.js', 'utf8'), /const CACHE_NAME='budde-3-6-46'/);
  assert.match(fs.readFileSync('service-worker.js', 'utf8'), /js\/designer-mode\.js\?v=ast049/);
});
