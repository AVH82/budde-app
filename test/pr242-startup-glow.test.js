const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('css/designer-mode.css', 'utf8');
const sw = fs.readFileSync('service-worker.js', 'utf8');

test('startup glow removes the legacy box shadow', () => {
  assert.match(css, /\.startupAccessGlow\{[\s\S]*box-shadow:none!important/);
});

test('startup glow includes voltage drift and click pulse animations', () => {
  assert.match(css, /@keyframes startupVoltageDrift/);
  assert.match(css, /@keyframes startupGlowPulse/);
  assert.match(css, /frameStartupControls--selected-network[\s\S]*startupGlowPulse/);
});

test('service worker publishes PR242 glow CSS', () => {
  assert.match(sw, /budde-3-6-55-pr242/);
  assert.match(sw, /designer-mode\.css\?v=pr242/);
  assert.match(sw, /'\/css\/designer-mode\.css'/);
});
