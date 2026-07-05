const assert = require('node:assert/strict');
const ReceiptOcrService = require('../js/receipt-ocr.service.js');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('extracts WELDOM merchant and final TOTAL EUR amount from noisy OCR', () => {
  const text = `
    Des projets plein la maison
    WE1DOM
    Zone Commerciale
    12/06/2026 14:08
    Dont DEEE 1,20
    TVA 20,00% 165,67
    Remise fidélité 10,00
    TOTAL EUR 994,00
    CB 994,00
  `;

  const fields = ReceiptOcrService.extractReceiptFields(text);

  assert.equal(fields.merchant, 'WELDOM');
  assert.equal(fields.date, '2026-06-12');
  assert.equal(fields.total, 994);
});

test('prefers a final payment total over ignored card and VAT amounts', () => {
  const text = `
    Carrefour Market
    TVA 5,50 2,34
    Carte Bleue 48,90
    NET A PAYER 52,10 EUR
  `;

  const fields = ReceiptOcrService.extractReceiptFields(text);

  assert.equal(fields.merchant, 'CARREFOUR');
  assert.equal(fields.total, 52.10);
});


test('keeps WELDOM final total when item amount and discount are present', () => {
  const text = `
    WELDOM
    article 999,00
    remise -5,00
    TOTAL EUR 994,00
  `;

  const fields = ReceiptOcrService.extractReceiptFields(text);

  assert.equal(fields.merchant, 'WELDOM');
  assert.equal(fields.total, 994);
});

test('keeps merchant selection near the top when no known brand is found', () => {
  const text = `
    Boulangerie Dupont
    Merci de votre visite
    TOTAL TTC 7,40
  `;

  const fields = ReceiptOcrService.extractReceiptFields(text);

  assert.equal(fields.merchant, 'BOULANGERIE DUPONT');
  assert.equal(fields.total, 7.40);
});


test('prefers WELDOM over a short noisy OCR line', () => {
  const text = `
    JYFF
    WELDOM
    Zone Commerciale
    CA ES
    03/07/2026 09:12
    TOTAL EUR 42,50
  `;

  const fields = ReceiptOcrService.extractReceiptFields(text);

  assert.equal(fields.merchant, 'WELDOM');
  assert.equal(fields.total, 42.50);
});

test('uses receipt structure to prefer WELDOM TOTAL EUR over item column amounts', () => {
  const text = `
    WELDOM
    Article Qté Prix Total
    CLIMATISEUR 1 999,00 999,00
    TOTAL EUR 994,00
  `;

  const fields = ReceiptOcrService.extractReceiptFields(text);

  assert.equal(fields.merchant, 'WELDOM');
  assert.equal(fields.total, 994);
  assert.notEqual(fields.total, 1999);
});

test('keeps TOTAL EUR 994,00 over article and noisy lower amount candidates', () => {
  const text = `
    Magasin Maison
    Article / Qté / Prix / Total
    CLIMATISEUR 1 999,00 999,00
    Passeport Fidélité -5,00
    Lecture bruitée 934,00
    TOTAL EUR 994,00
    Carte Bleue 994,00
  `;

  const fields = ReceiptOcrService.extractReceiptFields(text);

  assert.equal(fields.total, 994);
  assert.notEqual(fields.total, 1999);
  assert.notEqual(fields.total, 934);
});

test('uses Carte Bleue payment line when it is in the totals zone', () => {
  const text = `
    Magasin Test
    Article Qté Prix Total
    Accessoire 1 12,00 12,00
    Carte Bleue 994,00
  `;

  const fields = ReceiptOcrService.extractReceiptFields(text);

  assert.equal(fields.total, 994);
});


test('never returns zero when TOTAL EUR 994,00 is present', () => {
  const text = `
    WELDOM
    Article Qté Prix Total
    CLIMATISEUR 1 999,00 999,00
    TOTAL EUR 0,00
    TOTAL EUR 994,00
  `;

  const fields = ReceiptOcrService.extractReceiptFields(text);

  assert.equal(fields.total, 994);
  assert.notEqual(fields.total, 0);
});

test('prioritizes rightmost amount visually aligned with TOTAL EUR split into OCR blocks', () => {
  const ocrData = {
    lines: [
      { text: 'Magasin Test', bbox: { x0: 20, y0: 20, x1: 180, y1: 40 } },
      { text: 'Article Qté Prix Total', bbox: { x0: 20, y0: 70, x1: 260, y1: 90 } },
      { text: 'CLIMATISEUR 1 999,00 999,00', bbox: { x0: 20, y0: 95, x1: 390, y1: 115 } },
      { text: 'TOTAL EUR', bbox: { x0: 20, y0: 150, x1: 130, y1: 170 } },
      { text: '994,00', bbox: { x0: 330, y0: 151, x1: 390, y1: 171 } },
      { text: 'NET A PAYER 934,00', bbox: { x0: 20, y0: 180, x1: 390, y1: 200 } },
      { text: 'CB 934,00', bbox: { x0: 20, y0: 210, x1: 390, y1: 230 } }
    ]
  };

  const fields = ReceiptOcrService.extractReceiptFields('', ocrData);

  assert.equal(fields.total, 994);
  assert.notEqual(fields.total, 999);
  assert.notEqual(fields.total, 934);
});

test('does not use NET A PAYER or CB when an exploitable TOTAL line exists', () => {
  const text = `
    Magasin Test
    Article Qté Prix Total
    Produit 1 999,00 999,00
    TOTAL TTC 994,00
    NET A PAYER 934,00
    Carte Bleue 934,00
  `;

  const fields = ReceiptOcrService.extractReceiptFields(text);

  assert.equal(fields.total, 994);
  assert.notEqual(fields.total, 934);
});

test('recalculates amount from TOTAL before CB and fallback totals block', () => {
  const totalResult = ReceiptOcrService.recalculateTotal([
    'Magasin Test',
    'Article Qté Prix Total',
    'Produit 1 12,00 12,00',
    'TOTAL EUR 42,50',
    'CB 40,00'
  ]);
  assert.equal(totalResult.amount, 42.5);

  const cardResult = ReceiptOcrService.recalculateTotal([
    'Magasin Test',
    'Article Qté Prix Total',
    'Produit 1 12,00 12,00',
    'Carte Bleue 40,00'
  ]);
  assert.equal(cardResult.amount, 40);
});

test('recalculates amount through ordered plausible candidates without repeating rejected totals', () => {
  const lines = [
    'WELDOM',
    'Article Qté Prix Total',
    'Produit 2 12,00 24,00',
    'TVA 20,00 4,00',
    'Dont DEEE 1,20',
    'Remise fidélité 5,00',
    'TOTAL EUR 94,00',
    'Carte Bleue 94,00',
    'NET A PAYER 90,00',
    'Autre paiement 4,00'
  ];

  const first = ReceiptOcrService.recalculateTotal(lines, []);
  assert.equal(first.amount, 90);
  assert.ok(first.diagnostic.candidates.length >= 3);
  assert.ok(first.diagnostic.candidates.every(candidate => ![1.2, 5].includes(candidate.amount)));

  const second = ReceiptOcrService.recalculateTotal(lines, ['90']);
  assert.equal(second.amount, 94);
  assert.notEqual(second.amount, first.amount);
  assert.deepEqual(second.diagnostic.rejected, ['90']);
});

test('returns manual-entry state only after amount candidates are exhausted', () => {
  const lines = [
    'Magasin Test',
    'TOTAL TTC 12,50',
    'CB 12,50',
    'A PAYER 10,00'
  ];

  assert.equal(ReceiptOcrService.recalculateTotal(lines, ['12.50']).amount, 10);
  const exhausted = ReceiptOcrService.recalculateTotal(lines, ['12.50', '10.00']);
  assert.equal(exhausted.amount, null);
  assert.equal(exhausted.diagnostic.chosen, null);
});

test('recalculates merchant with an alternative candidate', () => {
  const merchant = ReceiptOcrService.recalculateMerchant([
    'CARREFOUR',
    'BOULANGERIE DUPONT',
    'TOTAL EUR 12,00'
  ], 'CARREFOUR');
  assert.equal(merchant, 'BOULANGERIE DUPONT');
});
