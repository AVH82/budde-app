const assert = require('node:assert/strict');

const RECEIPT_FIELD_FALLBACK = 'À vérifier';
const receiptScannerFields = [
  { key: 'merchant' },
  { key: 'amount' },
  { key: 'date' },
  { key: 'category' }
];

function upper(value) {
  return String(value || 'INCONNU').trim().toUpperCase();
}

function formatReceiptAmount(amount) {
  return Number.isFinite(Number(amount)) ? `${Number(amount).toFixed(2)} €` : null;
}

function applyOcrFields(state, fields = {}, options = {}) {
  const merchant = fields.merchant ? upper(fields.merchant) : null;
  const nextFields = {
    merchant: merchant || RECEIPT_FIELD_FALLBACK,
    amount: formatReceiptAmount(fields.total) || RECEIPT_FIELD_FALLBACK,
    date: fields.date || RECEIPT_FIELD_FALLBACK,
    category: 'NON CLASSÉ'
  };

  receiptScannerFields.forEach(field => {
    const key = field.key;
    if (options.preserveLocked && state.lockedFields[key]) {
      state.fields[key] = state.rephotoPreservedFields?.[key] || state.fields[key];
      return;
    }
    state.fields[key] = nextFields[key];
  });
  state.rephotoPreservedFields = null;
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('new OCR photo does not reuse previous detected merchant when next image has no reliable merchant', () => {
  const state = {
    fields: { merchant: null, amount: null, date: null, category: null },
    lockedFields: {},
    rephotoPreservedFields: null
  };

  applyOcrFields(state, { merchant: 'WELDOM', total: 42.5, date: '2026-07-03' }, { preserveLocked: true });
  assert.equal(state.fields.merchant, 'WELDOM');

  state.fields = { merchant: null, amount: null, date: null, category: null };
  state.rephotoPreservedFields = null;
  applyOcrFields(state, { total: 12.3 }, { preserveLocked: true });

  assert.notEqual(state.fields.merchant, 'WELDOM');
  assert.ok(state.fields.merchant === '' || state.fields.merchant === 'NON IDENTIFIÉ' || state.fields.merchant === RECEIPT_FIELD_FALLBACK);
});
