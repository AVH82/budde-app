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
  assert.match(app, /currentEffectiveReceiptTrust\(\)/);
  assert.doesNotMatch(app, /setHeaderTrustNeedleAngle\(receiptScannerState\?\.trust\)/);
  assert.doesNotMatch(app, /settingsTrustNeedle--animate/);
});


test('effective trust caps fake receipt with fallback merchant and zero amount', () => {
  const state = {
    trust: 80,
    step: 'done',
    fields: { merchant: 'À vérifier', amount: '0,00', date: '2026-07-15', category: 'NON CLASSÉ' },
    rawFields: { merchant: '', total: 0, date: '' },
    lastOcrFields: { merchant: '', total: 0 },
    validationStatus: 'warning',
    requiresFullReview: true
  };
  assert.ok(TrustmeterService.computeEffectiveReceiptTrust(state) <= 15);
});

test('effective trust is LOW when no merchant, amount or reliable date exists', () => {
  const state = { trust: 70, step: 'done', fields: { merchant: null, amount: null, date: null }, rawFields: {} };
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 0);
});

test('effective trust preserves high score for coherent reliable receipt', () => {
  const state = {
    trust: 85,
    step: 'done',
    fields: { merchant: 'CARREFOUR', amount: '12,34 €', date: '2026-07-14' },
    rawFields: { merchant: 'CARREFOUR', total: 12.34, date: '2026-07-14' },
    lastOcrFields: { merchant: 'CARREFOUR', total: 12.34, date: '2026-07-14' },
    ocrDiagnostic: { amount: { chosen: { confirmations: 2 } } }
  };
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 85);
});

test('effective trust caps recognized merchant and amount with doubtful date to middle zone', () => {
  const state = {
    trust: 65,
    step: 'done',
    fields: { merchant: 'MONOPRIX', amount: '8,90 €', date: '2026-07-15' },
    rawFields: { merchant: 'MONOPRIX', total: 8.90, date: '2026-07-15' },
    lastOcrFields: { merchant: 'MONOPRIX', total: 8.90, date: '2026-07-15' },
    ocrDiagnostic: { date: { status: 'warning' } }
  };
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 40);
});

test('effective trust handles absent score and scan reset as LOW', () => {
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust({}), 0);
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust({ trust: 0, fields: { merchant: 'CARREFOUR', amount: '12,34 €', date: '2026-07-14' } }), 0);
});

test('effective trust makes fake receipt angle red and reliable receipt angle green', () => {
  const fake = { trust: 90, validationStatus: 'invalid', fields: { merchant: 'À vérifier', amount: '0,00' }, lastOcrFields: { text: 'poster' } };
  const reliable = { trust: 88, fields: { merchant: 'LECLERC', amount: '42,10 €', date: '2026-07-13' }, rawFields: { merchant: 'LECLERC', total: 42.10, date: '2026-07-13' }, lastOcrFields: { merchant: 'LECLERC' } };
  assert.ok(TrustmeterService.trustScoreToAngle(TrustmeterService.computeEffectiveReceiptTrust(fake)) < -30);
  assert.ok(TrustmeterService.trustScoreToAngle(TrustmeterService.computeEffectiveReceiptTrust(reliable)) > 30);
});

test('app final angle uses effective trust instead of raw trust', () => {
  const app = fs.readFileSync('js/app.js', 'utf8');
  assert.match(app, /function currentReceiptTrustAngle\(\)\{return trustScoreToAngle\(currentEffectiveReceiptTrust\(\)\)\}/);
  assert.match(app, /function updateHeaderTrustNeedle\(\)\{setHeaderTrustNeedleAngle\(currentEffectiveReceiptTrust\(\)\)\}/);
});

test('fillReceiptScannerFields installs complete scan state before effective needle update', () => {
  const app = fs.readFileSync('js/app.js', 'utf8');
  const start = app.indexOf('function fillReceiptScannerFields');
  const end = app.indexOf('const DEBUG_CAPTURE', start);
  const body = app.slice(start, end);
  const fieldsLoop = body.indexOf('receiptScannerFields.forEach');
  const lastOcr = body.indexOf('receiptScannerState.lastOcrFields={...fields}');
  const origins = body.indexOf('receiptScannerState.ocrFieldOrigins[key]');
  const preserved = body.indexOf('receiptScannerState.rephotoPreservedFields=null');
  const effective = body.indexOf('const effectiveTrust=currentEffectiveReceiptTrust()');
  const trustComponents = body.indexOf('trustComponents={capture:receiptScannerState.visionReport,ocr:ocrTrust,combined:receiptScannerState.trust,effective:effectiveTrust}');
  const needle = body.indexOf('updateHeaderTrustNeedle()');
  assert.ok(lastOcr > -1 && lastOcr < fieldsLoop);
  assert.ok(origins > fieldsLoop && origins < effective);
  assert.ok(preserved > origins && preserved < effective);
  assert.ok(effective > preserved);
  assert.ok(trustComponents > effective);
  assert.ok(needle > trustComponents);
});

test('effective trust on fillReceiptScannerFields-like fake receipt state stays red despite high raw trust and fallback date', () => {
  const state = {
    trust: 82,
    step: 'done',
    rawFields: { diagnostic: { trust: 82 }, merchant: '', total: 0, date: '' },
    lastOcrFields: { diagnostic: { trust: 82 }, merchant: '', total: 0, date: '' },
    fields: { merchant: 'À vérifier', amount: '0,00', date: '2026-07-15', category: 'NON CLASSÉ' },
    ocrFieldOrigins: { merchant: false, amount: false, date: false, category: false },
    ocrDiagnostic: { trust: 82 }
  };
  const signals = TrustmeterService.receiptTrustSignals(state);
  const effective = TrustmeterService.computeEffectiveReceiptTrust(state);
  assert.equal(signals.hasReliableDate, false);
  assert.ok(effective <= 15);
  assert.ok(TrustmeterService.trustScoreToAngle(effective) < -30);
});
