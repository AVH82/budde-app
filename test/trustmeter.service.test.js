const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const TrustmeterService = require('../js/trustmeter.service.js');

test('normalizes absent, bounded, percent and ratio trust scores', () => {
  assert.equal(TrustmeterService.normalizeTrustScore(undefined), 0);
  assert.equal(TrustmeterService.normalizeTrustScore(-12), 0);
  assert.equal(TrustmeterService.normalizeTrustScore(0), 0);
  assert.equal(TrustmeterService.normalizeTrustScore(0.75), 75);
  assert.equal(TrustmeterService.normalizeTrustScore(25), 25);
  assert.equal(TrustmeterService.normalizeTrustScore(125), 100);
});

test('maps trust scores linearly to the LOW/HIGH needle angles', () => {
  const { TRUST_MIN_ANGLE, TRUST_MAX_ANGLE, trustScoreToAngle } = TrustmeterService;
  assert.equal(trustScoreToAngle(undefined), TRUST_MIN_ANGLE);
  assert.equal(trustScoreToAngle(-1), TRUST_MIN_ANGLE);
  assert.equal(trustScoreToAngle(0), TRUST_MIN_ANGLE);
  assert.equal(trustScoreToAngle(25), -24);
  assert.equal(trustScoreToAngle(50), 0);
  assert.equal(trustScoreToAngle(75), 24);
  assert.equal(trustScoreToAngle(100), TRUST_MAX_ANGLE);
  assert.equal(trustScoreToAngle(150), TRUST_MAX_ANGLE);
  assert.equal(trustScoreToAngle(0.5), 0);
});

test('trustmeter startup scan is replay-only on scan entry and score updates stay dynamic', () => {
  const app = fs.readFileSync('js/app.js', 'utf8');
  assert.match(app, /if\(enteringScan\)replayHeaderTrustNeedle\(\)/);
  assert.match(app, /else if\(v!=='receiptScanner'&&v!=='receiptCamera'\)resetHeaderTrustNeedle\(\)/);
  assert.match(app, /needle\.animate\(/);
  assert.match(app, /fill:'none'/);
  assert.match(app, /setHeaderTrustNeedleAngle\(receiptScannerState\?\.trust\)/);
  assert.doesNotMatch(app, /settingsTrustNeedle--animate/);
});
