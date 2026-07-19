const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');

const startup = () => read('js/startup-gate.js');
const css = () => read('css/frame-system-v2.css');

test('rolling shutters use distinct slat and central junction PNG assets', () => {
  assert.match(startup(), /frame-shutter-slat\.png/);
  assert.match(startup(), /frame-shutter-junction\.png/);
  assert.match(startup(), /Math\.max\(3,Math\.ceil/);
  assert.doesNotMatch(startup(), /frame-shutter-slat\.png[^\n]+junction/i);
});

test('junction ordering and lower vertical mirror are explicit', () => {
  assert.match(startup(), /position==='top'\?\[\.\.\.slats,junction\]:\[junction,\.\.\.slats\]/);
  assert.match(css(), /frameShutter--bottom \.frameShutterJunction\{transform:scaleY\(-1\)/);
});

test('clipped tracks roll in opposite directions without legacy panel animations', () => {
  assert.match(css(), /\.frameShutter\{[\s\S]*?overflow:hidden/);
  assert.match(css(), /@keyframes frameSlatsRollUp[\s\S]*?translateY\(calc\(-100%/);
  assert.match(css(), /@keyframes frameSlatsRollDown[\s\S]*?translateY\(calc\(100%/);
  assert.doesNotMatch(css(), /frameShutter(?:Top|Bottom)Open/);
});

test('reduced motion shortens shutter and dock-control opening', () => {
  assert.match(css(), /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css(), /animation-duration:120ms!important/);
});

test('service worker precaches both shutter images at the new build', () => {
  const sw=read('service-worker.js');
  assert.match(sw, /CACHE_NAME='budde-3-6-51'/);
  assert.match(sw, /assets\/frame\/frame-shutter-slat\.png/);
  assert.match(sw, /assets\/frame\/frame-shutter-junction\.png/);
});
