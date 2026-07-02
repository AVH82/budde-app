(function (global) {
  'use strict';

  const CDN_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  const GENERIC_MERCHANT_WORDS = new Set([
    'ticket', 'recu', 'reçu', 'facture', 'duplicata', 'client', 'caisse', 'cb',
    'carte', 'bancaire', 'total', 'ttc', 'ht', 'tva', 'eur', 'euro', 'euros',
    'merci', 'a payer', 'à payer', 'siret', 'ape', 'naf', 'tel', 'telephone',
    'téléphone', 'date', 'heure'
  ]);

  const state = {
    initialized: false,
    available: false,
    loading: false,
    error: null,
    language: null,
    source: null
  };

  function emitProgress(onProgress, step, percent, message) {
    if (typeof onProgress !== 'function') return;
    onProgress({ step, percent: Math.max(0, Math.min(100, Math.round(percent))), message });
  }

  function hasDocument() {
    return typeof document !== 'undefined' && !!document.createElement;
  }

  function loadTesseractFromCdn() {
    if (!hasDocument()) return Promise.resolve(false);
    if (global.Tesseract) return Promise.resolve(true);
    if (state.loading) return state.loading;

    state.loading = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = CDN_URL;
      script.async = true;
      script.onload = () => resolve(!!global.Tesseract);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    }).finally(() => {
      state.loading = false;
    });

    return state.loading;
  }

  async function init() {
    state.error = null;
    if (global.Tesseract || await loadTesseractFromCdn()) {
      state.initialized = true;
      state.available = true;
      state.source = global.Tesseract ? 'browser-cdn' : 'browser';
      return getStatus();
    }

    state.initialized = true;
    state.available = false;
    state.source = 'fallback';
    state.error = 'Tesseract.js indisponible : OCR désactivé, extraction texte uniquement possible.';
    return getStatus();
  }

  async function recognizeImage(fileOrBlob, onProgress) {
    emitProgress(onProgress, 'init', 0, 'Initialisation OCR…');
    if (!state.initialized) await init();

    if (!state.available || !global.Tesseract) {
      emitProgress(onProgress, 'unavailable', 100, 'OCR indisponible dans ce navigateur.');
      return { text: '', fields: extractReceiptFields(''), status: getStatus(), unavailable: true };
    }

    if (!fileOrBlob) throw new Error('Aucune image fournie pour la reconnaissance OCR.');

    const languages = ['fra', 'eng'];
    let lastError = null;

    for (const language of languages) {
      try {
        state.language = language;
        emitProgress(onProgress, 'recognize', language === 'fra' ? 5 : 10, `Lecture du reçu (${language})…`);
        const result = await global.Tesseract.recognize(fileOrBlob, language, {
          logger(info) {
            if (!info) return;
            const rawProgress = typeof info.progress === 'number' ? info.progress * 90 : 0;
            const percent = 5 + rawProgress;
            emitProgress(onProgress, info.status || 'recognize', percent, readableStatus(info.status, language));
          }
        });
        const text = result?.data?.text || '';
        emitProgress(onProgress, 'done', 100, 'Analyse OCR terminée.');
        return { text, fields: extractReceiptFields(text), status: getStatus(), unavailable: false };
      } catch (error) {
        lastError = error;
        emitProgress(onProgress, 'retry', 10, 'Nouvelle tentative OCR avec une autre langue…');
      }
    }

    state.error = lastError?.message || 'Reconnaissance OCR impossible.';
    emitProgress(onProgress, 'error', 100, 'OCR impossible pour cette image.');
    return { text: '', fields: extractReceiptFields(''), status: getStatus(), unavailable: true, error: state.error };
  }

  function readableStatus(status, language) {
    const suffix = language === 'fra' ? 'français' : 'anglais';
    if (!status) return `Reconnaissance en ${suffix}…`;
    if (status.includes('loading')) return `Chargement du moteur OCR (${suffix})…`;
    if (status.includes('recognizing')) return `Reconnaissance du texte (${suffix})…`;
    return `${status} (${suffix})`;
  }

  function extractReceiptFields(text) {
    const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    return {
      merchant: extractMerchant(lines),
      date: extractDate(lines),
      total: extractTotal(lines),
      rawText: String(text || '')
    };
  }

  function extractDate(lines) {
    const datePattern = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/;
    for (const line of lines) {
      const match = line.match(datePattern);
      if (!match) continue;
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3].length === 2 ? `20${match[3]}` : match[3];
      return `${year}-${month}-${day}`;
    }
    return null;
  }

  function extractTotal(lines) {
    const amountPattern = /(?:^|\s)(\d{1,4}(?:[\s.]\d{3})*(?:[,.]\d{2})|\d+[,.]\d{2})(?:\s?€|\s?eur)?\b/gi;
    const keywordPattern = /\b(total|ttc|à payer|a payer|cb|carte|eur|euro)\b/i;
    const candidates = [];

    lines.forEach((line, index) => {
      let match;
      while ((match = amountPattern.exec(line)) !== null) {
        const amount = parseAmount(match[1]);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        const hasKeyword = keywordPattern.test(line);
        candidates.push({ amount, score: (hasKeyword ? 100 : 0) + amount / 100 + index / 1000 });
      }
    });

    if (!candidates.length) return null;
    candidates.sort((a, b) => b.score - a.score || b.amount - a.amount);
    return Math.round(candidates[0].amount * 100) / 100;
  }

  function parseAmount(value) {
    const normalized = String(value).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    return Number.parseFloat(normalized);
  }

  function extractMerchant(lines) {
    for (const line of lines.slice(0, 8)) {
      const cleaned = line.replace(/[^\p{L}\p{N}&' -]/gu, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned.length < 3) continue;
      const normalized = cleaned.toLocaleLowerCase('fr-FR');
      if (/\d{2}[./-]\d{2}[./-]\d{2,4}/.test(cleaned)) continue;
      if (/\d+[,.]\d{2}/.test(cleaned)) continue;
      if (GENERIC_MERCHANT_WORDS.has(normalized)) continue;
      if ([...GENERIC_MERCHANT_WORDS].some(word => normalized === word || normalized.startsWith(`${word} `))) continue;
      return cleaned.toUpperCase();
    }
    return null;
  }

  function getStatus() {
    return { ...state, tesseractAvailable: !!global.Tesseract };
  }

  const service = { init, recognizeImage, extractReceiptFields, getStatus };
  global.ReceiptOcrService = service;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = service;
  }
})(typeof window !== 'undefined' ? window : globalThis);
