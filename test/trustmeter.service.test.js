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
  assert.equal(TRUST_MIN_ANGLE, -60);
  assert.equal(TRUST_MAX_ANGLE, 60);
  assert.equal(trustScoreToAngle(25), -30);
  assert.equal(trustScoreToAngle(50), 0);
  assert.equal(trustScoreToAngle(75), 30);
  assert.equal(trustScoreToAngle(100), TRUST_MAX_ANGLE);
  assert.equal(trustScoreToAngle(150), TRUST_MAX_ANGLE);
  assert.equal(trustScoreToAngle(0.5), 0);
});

test('trustmeter startup scan is replay-only on scan entry and score updates stay dynamic', () => {
  const app = fs.readFileSync('js/app.js', 'utf8');
  assert.match(app, /if\(enteringScan\)resetHeaderTrustNeedle\(\)/);
  assert.match(app, /else if\(v!=='receiptScanner'&&v!=='receiptCamera'\)resetHeaderTrustNeedle\(\)/);
  assert.match(app, /needle\.animate\(/);
  assert.match(app, /fill:'forwards'/);
  assert.match(app, /function startTrustmeterAnalyzingAnimation/);
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
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 0);
});

test('effective trust is red when no merchant, amount or reliable date exists', () => {
  const state = { trust: 70, step: 'done', fields: { merchant: null, amount: null, date: null }, rawFields: {} };
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 0);
  assert.equal(TrustmeterService.trustScoreToAngle(TrustmeterService.computeEffectiveReceiptTrust(state)), TrustmeterService.TRUST_MIN_ANGLE);
  assert.equal(TrustmeterService.hasBlockingReceiptWarning(state), true);
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

test('effective trust forces recognized merchant and amount with doubtful date to red zone', () => {
  const state = {
    trust: 65,
    step: 'done',
    fields: { merchant: 'MONOPRIX', amount: '8,90 €', date: '2026-07-15' },
    rawFields: { merchant: 'MONOPRIX', total: 8.90, date: '2026-07-15' },
    lastOcrFields: { merchant: 'MONOPRIX', total: 8.90, date: '2026-07-15' },
    ocrDiagnostic: { date: { status: 'warning' } }
  };
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 0);
  assert.equal(TrustmeterService.hasBlockingReceiptWarning(state), true);
});

test('blocking receipt warning covers explicit review values and invalid amounts before progressive caps', () => {
  const invalidStates = [
    { trust: 95, fields: { merchant: 'Inconnu', amount: '12,00', date: '2026-07-14', category: 'NON CLASSÉ' } },
    { trust: 95, fields: { merchant: 'LECLERC', amount: '-1,00', date: '2026-07-14', category: 'NON CLASSÉ' } },
    { trust: 95, fields: { merchant: 'LECLERC', amount: 'abc', date: '2026-07-14', category: 'NON CLASSÉ' } },
    { trust: 95, fields: { merchant: 'LECLERC', amount: '12,00', date: 'À vérifier', category: 'NON CLASSÉ' } },
    { trust: 95, fields: { merchant: 'LECLERC', amount: '12,00', date: '2026-07-14', category: 'À vérifier' } },
    { trust: 95, fields: { merchant: 'LECLERC', amount: '12,00', date: '2026-07-14', note: 'À vérifier' } },
    { trust: 95, fields: { merchant: 'LECLERC', amount: '12,00', date: '2026-07-14' }, validationStatus: 'warning' },
    { trust: 95, fields: { merchant: 'LECLERC', amount: '12,00', date: '2026-07-14' }, merchantReliable: false },
    { trust: 95, fields: { merchant: 'LECLERC', amount: '12,00', date: '2026-07-14' }, ocrDiagnostic: { merchant: { reliable: false } } },
    { trust: 95, fields: { merchant: 'LECLERC', amount: '12,00', date: '2026-07-14' }, ocrDiagnostic: { buddy: { requiresVerification: true } } },
    { trust: 95, fields: { merchant: 'LECLERC', amount: '12,00', date: '2026-07-14' }, ocrDiagnostic: { amount: { status: 'warning' } } },
    { trust: 95, fields: { merchant: 'LECLERC', amount: '12,00', date: '2026-07-14' }, visionReport: { isReceipt: false } }
  ];
  invalidStates.forEach(state => {
    assert.equal(TrustmeterService.hasBlockingReceiptWarning(state), true);
    assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 0);
  });
});



test('category without OCR origin does not block reliable receipt trust', () => {
  const state = {
    trust: 90,
    fields: { merchant: 'LECLERC', amount: '42,10 €', date: '2026-07-13', category: 'NON CLASSÉ' },
    rawFields: { merchant: 'LECLERC', total: 42.10, date: '2026-07-13' },
    lastOcrFields: { merchant: 'LECLERC', total: 42.10, date: '2026-07-13' },
    ocrFieldOrigins: { merchant: true, amount: true, date: true, category: false }
  };
  assert.equal(TrustmeterService.hasBlockingReceiptWarning(state), false);
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 90);
  assert.ok(TrustmeterService.trustScoreToAngle(TrustmeterService.computeEffectiveReceiptTrust(state)) > 30);
});

test('suggested category without OCR origin is not a blocking warning', () => {
  const state = {
    trust: 88,
    fields: { merchant: 'CARREFOUR', amount: '18,20 €', date: '2026-07-13', category: 'ALIMENTATION' },
    rawFields: { merchant: 'CARREFOUR', total: 18.20, date: '2026-07-13' },
    lastOcrFields: { merchant: 'CARREFOUR', total: 18.20, date: '2026-07-13' },
    ocrFieldOrigins: { merchant: true, amount: true, date: true, category: false }
  };
  assert.equal(TrustmeterService.hasBlockingReceiptWarning(state), false);
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 88);
});

test('unreliable main OCR origins remain blocking until manually locked', () => {
  const base = {
    trust: 90,
    fields: { merchant: 'LECLERC', amount: '42,10 €', date: '2026-07-13', category: 'NON CLASSÉ' },
    rawFields: { merchant: 'LECLERC', total: 42.10, date: '2026-07-13' },
    lastOcrFields: { merchant: 'LECLERC', total: 42.10, date: '2026-07-13' }
  };
  ['merchant', 'amount', 'date'].forEach(key => {
    const state = { ...base, ocrFieldOrigins: { merchant: true, amount: true, date: true, category: false, [key]: false } };
    assert.equal(TrustmeterService.hasBlockingReceiptWarning(state), true, `${key} false origin should block`);
    assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 0, `${key} false origin should force LOW`);
  });
  const locked = {
    ...base,
    lockedFields: { merchant: true, amount: true, date: true },
    ocrFieldOrigins: { merchant: false, amount: false, date: false, category: false }
  };
  assert.equal(TrustmeterService.hasBlockingReceiptWarning(locked), false);
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(locked), 90);
});

test('explicit review category remains blocking regardless of OCR origin', () => {
  const state = {
    trust: 90,
    fields: { merchant: 'LECLERC', amount: '42,10 €', date: '2026-07-13', category: 'À vérifier' },
    rawFields: { merchant: 'LECLERC', total: 42.10, date: '2026-07-13' },
    lastOcrFields: { merchant: 'LECLERC', total: 42.10, date: '2026-07-13' },
    ocrFieldOrigins: { merchant: true, amount: true, date: true, category: false }
  };
  assert.equal(TrustmeterService.hasBlockingReceiptWarning(state), true);
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 0);
});

test('manual locked corrections do not count as unreliable OCR origins', () => {
  const state = {
    trust: 90,
    fields: { merchant: 'LECLERC', amount: '42,10 €', date: '2026-07-13' },
    rawFields: { merchant: 'LECLERC', total: 42.10, date: '2026-07-13' },
    lastOcrFields: { merchant: 'LECLERC' },
    lockedFields: { merchant: true, amount: true, date: true },
    ocrFieldOrigins: { merchant: false, amount: false, date: false }
  };
  assert.equal(TrustmeterService.hasBlockingReceiptWarning(state), false);
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 90);
});

test('effective trust handles absent score and scan reset as LOW', () => {
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust({}), 0);
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust({ trust: 0, fields: { merchant: 'CARREFOUR', amount: '12,34 €', date: '2026-07-14' } }), 0);
});

test('effective trust makes fake receipt angle red and reliable receipt angle green', () => {
  const fake = { trust: 90, validationStatus: 'invalid', fields: { merchant: 'À vérifier', amount: '0,00' }, lastOcrFields: { text: 'poster' } };
  const reliable = { trust: 88, fields: { merchant: 'LECLERC', amount: '42,10 €', date: '2026-07-13' }, rawFields: { merchant: 'LECLERC', total: 42.10, date: '2026-07-13' }, lastOcrFields: { merchant: 'LECLERC' } };
  assert.equal(TrustmeterService.trustScoreToAngle(TrustmeterService.computeEffectiveReceiptTrust(fake)), TrustmeterService.TRUST_MIN_ANGLE);
  assert.ok(TrustmeterService.trustScoreToAngle(TrustmeterService.computeEffectiveReceiptTrust(reliable)) > 30);
});



test('radiation settings button uses iOS-safe static canvas sizing', () => {
  const css = fs.readFileSync('css/ast-013-2.css', 'utf8');
  assert.match(css, /--radiation-visible-size:142.8%/);
  assert.match(css, /--radiation-canvas-width:153\.038%/);
  assert.doesNotMatch(css, /--radiation-canvas-width:calc\([^;]*\*[^;]*\/[^;]*\)/);
  assert.match(css, /--needle-angle:-60deg/);
});

test('app final angle uses effective trust instead of raw trust', () => {
  const app = fs.readFileSync('js/app.js', 'utf8');
  assert.match(app, /function currentReceiptTrustAngle\(\)\{return trustScoreToAngle\(currentEffectiveReceiptTrust\(\)\)\}/);
  assert.match(app, /function applyCurrentReceiptTrustToNeedle\(source='update'\)\{const phase=receiptScannerState\.trustmeterPhase/);
  assert.match(app, /phase==='analyzing'.*return receiptScannerState\.trustNeedleDiagnostic/s);
  assert.match(app, /needle\.style\.setProperty\('--needle-angle',`\$\{angle\}deg`\)/);
  assert.match(app, /needle\.animate\(\[\{'--needle-angle'/);
  assert.match(app, /-60\+\(normalizeTrustScore\(value\)\/100\)\*120/);
  assert.doesNotMatch(app, /-48\+\(normalizeTrustScore\(value\)\/100\)\*96/);
  assert.match(app, /TrustmeterService\?\.TRUST_MIN_ANGLE\?\?-60/);
  assert.match(app, /TrustmeterService\?\.TRUST_MAX_ANGLE\?\?60/);
  assert.match(app, /function startTrustmeterAnalyzingAnimation/);
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
  const needle = body.indexOf("applyCurrentReceiptTrustToNeedle('fill-receipt-fields')");
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
  assert.equal(effective, 0);
  assert.equal(TrustmeterService.trustScoreToAngle(effective), TrustmeterService.TRUST_MIN_ANGLE);
});


test('observed doubtful merchant with zero amount forces final LOW', () => {
  const state = { trust: 82, step: 'done', trustmeterPhase: 'result', fields: { merchant: 'TE PI CA 0', amount: '0,00', date: '2026-07-15', category: 'NON CLASSÉ' }, rawFields: { merchant: 'TE PI CA 0', total: 0, date: '' }, lastOcrFields: { merchant: 'TE PI CA 0', total: 0 }, ocrFieldOrigins: { merchant: false, amount: false, date: false, category: false }, ocrDiagnostic: { reliable: false } };
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 0);
  assert.equal(TrustmeterService.trustScoreToAngle(0), TrustmeterService.TRUST_MIN_ANGLE);
});

test('explicit review merchant and zero amount forces final LOW', () => {
  const state = { trust: 90, step: 'done', trustmeterPhase: 'result', fields: { merchant: 'À vérifier', amount: '0,00', date: '2026-07-15', category: 'NON CLASSÉ' }, lastOcrFields: { merchant: '', total: 0 } };
  assert.equal(TrustmeterService.computeEffectiveReceiptTrust(state), 0);
  assert.equal(TrustmeterService.trustScoreToAngle(TrustmeterService.computeEffectiveReceiptTrust(state)), -60);
});

test('trustmeter phase machine and halo hooks are statically present', () => {
  const app = fs.readFileSync('js/app.js', 'utf8');
  const css = fs.readFileSync('css/ast-013-2.css', 'utf8');
  assert.match(app, /trustmeterPhase:'idle'/);
  assert.match(app, /receiptScannerState\.trustmeterPhase='analyzing'/);
  assert.match(app, /receiptScannerState\.trustmeterPhase='result'/);
  assert.match(app, /stopTrustmeterAnalyzingAnimation\('manual-change'\)/);
  assert.match(css, /settingsTrustRadiationFace::before/);
  assert.match(css, /rgba\(126,255,72/);
  assert.match(css, /transition:opacity 320ms ease/);
  assert.match(css, /apertureCenterX 196 \/ 373/);
  assert.match(css, /radiationHubX 587\.411 \/ 1153/);
});
