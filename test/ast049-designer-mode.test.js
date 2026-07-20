const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = () => fs.readFileSync('js/designer-mode.js', 'utf8');
const css = () => fs.readFileSync('css/designer-mode.css', 'utf8');
const index = () => fs.readFileSync('index.html', 'utf8');
const app = () => fs.readFileSync('js/app.js', 'utf8');

function makeClassList(classSet) {
  return {
    add(...classes) { classes.forEach(c => classSet.add(c)); },
    remove(...classes) { classes.forEach(c => classSet.delete(c)); },
    toggle(c, on) { on === undefined ? (classSet.has(c) ? classSet.delete(c) : classSet.add(c)) : (on ? classSet.add(c) : classSet.delete(c)); },
    contains(c) { return classSet.has(c); }
  };
}

function makeStyle(initial = {}) {
  const values = { ...initial };
  return {
    values,
    setProperty(k, v) { values[k] = v; },
    removeProperty(k) { delete values[k]; },
    getPropertyValue(k) { return values[k] || ''; }
  };
}

function makeElement(classSet = new Set(), rect = { left: 0, top: 0, width: 100, height: 100 }) {
  const listeners = {};
  const element = {
    style: makeStyle(), className: '', innerHTML: '', value: '', checked: false, textContent: '', hidden: false,
    classList: makeClassList(classSet), children: [], listeners,
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
    remove() { this.removed = true; },
    setAttribute(name, value) { this[name] = value; },
    getAttribute(name) { return this[name]; },
    addEventListener(type, fn) { listeners[type] = listeners[type] || []; listeners[type].push(fn); },
    removeEventListener() {},
    dispatch(type, event) { (listeners[type] || []).forEach(fn => fn(event)); },
    contains() { return true; },
    closest(selector) { return selector === '.designer-panel' && this.className === 'designer-panel' ? this : null; },
    setPointerCapture() {},
    getBoundingClientRect: () => rect,
    querySelector(selector) {
      this._queries = this._queries || {};
      if (!this._queries[selector]) this._queries[selector] = makeElement(new Set(), rect);
      return this._queries[selector];
    }
  };
  return element;
}

function runDesigner(search = '') {
  const listeners = [];
  const classSet = new Set();
  const moduleClasses = new Set();
  const storage = new Map();
  const moduleStyle = makeStyle({ opacity: '0.8' });
  const module = makeElement(moduleClasses, { left: 0, top: 0, width: 100, height: 100 });
  module.style = moduleStyle;
  const elements = {
    '.settingsTrustModule': module,
    '.settingsTrustRotor': makeElement(new Set(), { left: 5, top: 5, width: 90, height: 90 }),
    '.settingsTrustAsset--dial': makeElement(new Set(), { left: 10, top: 10, width: 60, height: 60 }),
    '.settingsTrustNeedle': makeElement(new Set(), { left: 20, top: 20, width: 40, height: 40 }),
    '.settingsTrustAsset--radiation': makeElement(new Set(), { left: 15, top: 15, width: 70, height: 70 }),
    '.settingsTrustViewport': makeElement(new Set(), { left: 0, top: 0, width: 100, height: 100 }),
    '.startupAccessPanel': makeElement(new Set(), { left: 0, top: 700, width: 100, height: 100 }),
    '.frameShellBottom': makeElement(new Set(), { left: 0, top: 700, width: 200, height: 100 })
  };
  const body = makeElement(classSet);
  const html = { classList: makeClassList(classSet) };
  const document = {
    readyState: 'loading', body, documentElement: html, activeElement: null,
    addEventListener(type, fn) { listeners.push(type); if (type === 'DOMContentLoaded') fn(); },
    removeEventListener(type) { listeners.push(`remove:${type}`); },
    execCommand: () => true,
    createElement: () => makeElement(new Set()),
    querySelector: selector => elements[selector] || null
  };
  const computed = {
    '--dial-offset-x': '8.3%', '--dial-offset-y': '0.2%', '--needle-offset-x': '5.3%', '--needle-offset-y': '0%',
    '--dial-scale': '168.49%', '--needle-scale': '64.022%', '--radiation-visible-center-x': '50.946%', '--radiation-visible-center-y': '47.662%'
  };
  const context = {
    window: null, document, navigator: {}, URLSearchParams, innerWidth: 390, innerHeight: 800, devicePixelRatio: 2,
    localStorage: { getItem: k => storage.has(k) ? storage.get(k) : null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    console: { info() {}, warn() {} },
    requestAnimationFrame: fn => { fn(); return 1; }, cancelAnimationFrame() {},
    getComputedStyle: el => ({ getPropertyValue: v => el?.style?.getPropertyValue(v) || computed[v] || '0%', transformOrigin: '24px 67px' }),
    addEventListener(type) { listeners.push(type); }, removeEventListener(type) { listeners.push(`remove:${type}`); }
  };
  context.window = { location: { search }, addEventListener: context.addEventListener, removeEventListener: context.removeEventListener, cancelAnimationFrame() {}, BuddeDesignerMode: null };
  vm.runInNewContext(source(), context);
  return { context, listeners, classSet, moduleClasses, moduleStyle, storage };
}

const fullValues = (overrides = {}) => ({
  dialOffsetX: 8.3, dialOffsetY: 0.2, needleOffsetX: 5.3, needleOffsetY: 0,
  dialScale: 168.49, needleScale: 64.022, radiationCenterX: 50.946, radiationCenterY: 47.662,
  startupPanelX: 0, startupPanelY: 0, startupPanelWidth: 100, startupPanelHeight: 100,
  startupPanelScaleX: 1, startupPanelScaleY: 1,
  ...overrides
});

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

test('AST-049 cloneValues keeps trustmeter and radiation values', () => {
  const { context } = runDesigner('?designer=1');
  assert.equal(JSON.stringify(context.window.BuddeDesignerModeUtils.cloneValues(fullValues())), JSON.stringify(fullValues()));
});

test('AST-049 radiation movement changes only radiation center values', () => {
  const { context } = runDesigner('?designer=1');
  const api = context.window.BuddeDesignerMode;
  api.setValues(fullValues());
  api.selectTarget('radiation');
  api.moveSelected(2, -3);
  assert.equal(JSON.stringify(api.getValues()), JSON.stringify(fullValues({ radiationCenterX: 48.946, radiationCenterY: 50.662 })));
});

test('AST-049 export JSON includes current radiation coordinates', () => {
  const { context } = runDesigner('?designer=1');
  const api = context.window.BuddeDesignerMode;
  api.selectTarget('radiation');
  api.setValues(fullValues({ radiationCenterX: 44.4, radiationCenterY: 55.5 }));
  const exported = api.exportJson();
  assert.equal(exported.target, 'radiation');
  assert.equal(exported.values.radiationCenterX, 44.4);
  assert.equal(exported.values.radiationCenterY, 55.5);
});

test('AST-049 import validation accepts and applies radiation coordinates', () => {
  const { context } = runDesigner('?designer=1');
  const api = context.window.BuddeDesignerMode;
  const payload = { version: 1, target: 'radiation', viewport: { width: 1, height: 2, devicePixelRatio: 3 }, values: fullValues({ radiationCenterX: 12.5, radiationCenterY: 98.75 }) };
  const parsed = api.validatePayload(payload);
  assert.equal(parsed.values.radiationCenterX, 12.5);
  api.setValues(parsed.values);
  assert.equal(api.getValues().radiationCenterY, 98.75);
});

test('AST-049 local save/restore preserves radiation values', () => {
  const { context, storage } = runDesigner('?designer=1');
  const api = context.window.BuddeDesignerMode;
  api.selectTarget('radiation');
  api.setValues(fullValues({ radiationCenterX: 41.25, radiationCenterY: 62.5 }));
  storage.set('budde-designer-v1', JSON.stringify(api.exportJson()));
  api.setValues(fullValues({ radiationCenterX: 9, radiationCenterY: 10 }));
  const restored = api.validatePayload(JSON.parse(storage.get('budde-designer-v1')));
  api.setValues(restored.values);
  assert.equal(api.getValues().radiationCenterX, 41.25);
  assert.equal(api.getValues().radiationCenterY, 62.5);
});

test('AST-049 invalid import payloads are rejected', () => {
  const { context } = runDesigner('?designer=1');
  const validate = context.window.BuddeDesignerMode.validatePayload;
  const valid = { version: 1, target: 'radiation', values: fullValues() };
  assert.equal(validate({ ...valid, values: { ...valid.values, radiationCenterX: NaN } }), null);
  assert.equal(validate({ ...valid, values: { ...valid.values, radiationCenterX: Infinity } }), null);
  assert.equal(validate({ ...valid, values: { ...valid.values, radiationCenterX: 1001 } }), null);
  const missing = { ...valid, values: { ...valid.values } };
  delete missing.values.radiationCenterY;
  assert.equal(validate(missing), null);
  assert.equal(validate({ ...valid, version: 2 }), null);
  assert.equal(validate({ ...valid, values: { ...valid.values, radiationCenterX: { nested: true } } }), null);
});

test('AST-049 production CSS reset removes only designer variables', () => {
  const { context, moduleStyle } = runDesigner('?designer=1');
  const api = context.window.BuddeDesignerMode;
  api.setValues(fullValues({ radiationCenterX: 40, radiationCenterY: 60 }));
  assert.equal(moduleStyle.getPropertyValue('opacity'), '0.8');
  api.restoreProductionValues();
  assert.equal(moduleStyle.getPropertyValue('opacity'), '0.8');
  assert.equal(moduleStyle.getPropertyValue('--dial-offset-x'), '8.3%');
  assert.equal(moduleStyle.getPropertyValue('--radiation-visible-center-x'), '50.946%');
  assert.doesNotMatch(source(), /removeAttribute\('style'\)/);
});

test('AST-049 reset trustmeter group does not modify radiation', () => {
  const { context } = runDesigner('?designer=1');
  const api = context.window.BuddeDesignerMode;
  api.setValues(fullValues({ dialOffsetX: 99, needleOffsetX: 88, radiationCenterX: 12, radiationCenterY: 13 }));
  api.selectTarget('trustmeterGroup');
  api.reset();
  assert.equal(api.getValues().dialOffsetX, 8.3);
  assert.equal(api.getValues().needleOffsetX, 5.3);
  assert.equal(api.getValues().radiationCenterX, 12);
});

test('AST-049 reset dial does not modify needle or radiation', () => {
  const { context } = runDesigner('?designer=1');
  const api = context.window.BuddeDesignerMode;
  api.setValues(fullValues({ dialOffsetX: 99, dialScale: 77, needleOffsetX: 88, radiationCenterX: 12 }));
  api.selectTarget('trustmeterDial');
  api.reset();
  assert.equal(api.getValues().dialOffsetX, 8.3);
  assert.equal(api.getValues().dialScale, 168.49);
  assert.equal(api.getValues().needleOffsetX, 88);
  assert.equal(api.getValues().radiationCenterX, 12);
});

test('AST-049 reset needle does not modify dial or radiation', () => {
  const { context } = runDesigner('?designer=1');
  const api = context.window.BuddeDesignerMode;
  api.setValues(fullValues({ dialOffsetX: 99, needleOffsetX: 88, needleScale: 11, radiationCenterX: 12 }));
  api.selectTarget('trustmeterNeedle');
  api.reset();
  assert.equal(api.getValues().needleOffsetX, 5.3);
  assert.equal(api.getValues().needleScale, 64.022);
  assert.equal(api.getValues().dialOffsetX, 99);
  assert.equal(api.getValues().radiationCenterX, 12);
});

test('AST-049 reset radiation does not modify trustmeter', () => {
  const { context } = runDesigner('?designer=1');
  const api = context.window.BuddeDesignerMode;
  api.setValues(fullValues({ dialOffsetX: 99, needleOffsetX: 88, radiationCenterX: 12, radiationCenterY: 13 }));
  api.selectTarget('radiation');
  api.reset();
  assert.equal(api.getValues().radiationCenterX, 50.946);
  assert.equal(api.getValues().radiationCenterY, 47.662);
  assert.equal(api.getValues().dialOffsetX, 99);
  assert.equal(api.getValues().needleOffsetX, 88);
});

test('AST-049 live CSS includes trustmeter and radiation without calc multiplication', () => {
  const { context } = runDesigner('?designer=1');
  const cssText = context.window.BuddeDesignerMode.makeCss(fullValues({ radiationCenterX: 50.946, radiationCenterY: 47.662 }));
  assert.match(cssText, /--dial-offset-x: 8\.3%;/);
  assert.match(cssText, /--needle-scale: 64\.022%;/);
  assert.match(cssText, /--radiation-visible-center-x: 50\.946%;/);
  assert.match(cssText, /--radiation-visible-center-y: 47\.662%;/);
  assert.doesNotMatch(cssText, /calc\([^)]*\*/);
});

test('Startup panel is independently movable, resettable and exported with unitless scales', () => {
  const { context } = runDesigner('?designer=1');
  const api = context.window.BuddeDesignerMode;
  api.setValues(fullValues({ startupPanelWidth: 140, startupPanelHeight: 220, startupPanelScaleX: 1.2, startupPanelScaleY: 1.8 }));
  api.selectTarget('startupPanel');
  api.moveSelected(5, -7);
  assert.equal(api.getValues().startupPanelX, 5);
  assert.equal(api.getValues().startupPanelY, -7);
  const output = api.makeCss(api.getValues());
  assert.match(output, /--startup-panel-width: 140%;/);
  assert.match(output, /--startup-panel-scale-x: 1\.2;/);
  assert.doesNotMatch(output, /--startup-panel-scale-[xy]: [^;]*%/);
  api.reset();
  assert.equal(api.getValues().startupPanelHeight, 100);
  assert.equal(api.getValues().startupPanelScaleY, 1);
});

test('Designer v1 JSON without startup values receives backward-compatible defaults', () => {
  const { context } = runDesigner('?designer=1');
  const legacy = fullValues();
  Object.keys(legacy).filter(key => key.startsWith('startupPanel')).forEach(key => delete legacy[key]);
  const parsed = context.window.BuddeDesignerMode.validatePayload({ version: 1, target: 'trustmeterDial', values: legacy });
  assert.equal(parsed.values.startupPanelWidth, 100);
  assert.equal(parsed.values.startupPanelScaleX, 1);
});

test('AST-049 close cleans debug state and only designer overrides', () => {
  const { context, classSet, moduleClasses, moduleStyle, listeners } = runDesigner('?designer=1');
  const api = context.window.BuddeDesignerMode;
  api.setValues(fullValues());
  moduleClasses.add('settingsTrustModule--trust');
  moduleClasses.add('designer-instant-rotation');
  classSet.add('designer-dragging');
  api.close();
  assert.equal(classSet.has('designerMode'), false);
  assert.equal(classSet.has('designer-dragging'), false);
  assert.equal(moduleClasses.has('settingsTrustModule--trust'), false);
  assert.equal(moduleClasses.has('designer-instant-rotation'), false);
  assert.equal(moduleStyle.getPropertyValue('opacity'), '0.8');
  assert.ok(listeners.includes('remove:pointermove'));
});

test('AST-049 files are loaded and version/cache stay on PR #216 values', () => {
  assert.match(index(), /css\/designer-mode\.css\?v=ast062/);
  assert.match(index(), /js\/designer-mode\.js\?v=ast062/);
  assert.match(css(), /\.designer-panel/);
  assert.match(app(), /const APP_VERSION='3\.6\.55'/);
  assert.match(fs.readFileSync('service-worker.js', 'utf8'), /const CACHE_NAME='budde-3-6-55-ast062'/);
});
