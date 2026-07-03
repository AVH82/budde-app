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
