(function (global) {
  'use strict';

  const CDN_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  const GENERIC_MERCHANT_WORDS = new Set([
    'ticket', 'recu', 'reçu', 'facture', 'duplicata', 'client', 'caisse', 'cb',
    'carte', 'bancaire', 'total', 'ttc', 'ht', 'tva', 'eur', 'euro', 'euros',
    'merci', 'a payer', 'à payer', 'siret', 'ape', 'naf', 'tel', 'telephone',
    'téléphone', 'date', 'heure', 'slogan', 'magasin', 'bienvenue'
  ]);

  const KNOWN_MERCHANTS = [
    { name: 'WELDOM', aliases: ['weldom', 'weidom', 'weldorn', 'wel dom', 'welclom'] },
    { name: 'CARREFOUR', aliases: ['carrefour', 'carref0ur', 'carefour', 'carrefours'] },
    { name: 'FRANCE LITERIE', aliases: ['france literie', 'france 1iterie', 'france literle', 'france literi'] },
    { name: 'LIDL', aliases: ['lidl', 'lid1'] },
    { name: 'AUCHAN', aliases: ['auchan', 'aucham'] },
    { name: 'LECLERC', aliases: ['leclerc', 'e leclerc', 'eleclerc', 'l eclerc'] },
    { name: 'INTERMARCHÉ', aliases: ['intermarche', 'intermarché', 'inter marche'] },
    { name: 'CASTORAMA', aliases: ['castorama', 'cast0rama'] },
    { name: 'LEROY MERLIN', aliases: ['leroy merlin', 'ler0y merlin', 'leroy mer1in'] }
  ];

  const TOTAL_KEYWORD_PATTERN = /\b(total(?:\s+(?:eur|ttc))?|net\s+[àa]\s+payer|[àa]\s+payer)\b/i;
  const FINAL_TOTAL_PATTERN = /\b(total\s+(?:eur|ttc)|net\s+[àa]\s+payer|[àa]\s+payer)\b/i;
  const AMOUNT_EXCLUSION_PATTERN = /\b(tva|cb|carte\s+bleue|carte\s+bancaire|dont\s+deee|deee|remise|fid[eé]lit[eé]|avoir|rendu|monnaie|acompte|sous[-\s]?total)\b/i;

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
    const candidates = [];

    lines.forEach((line, index) => {
      if (AMOUNT_EXCLUSION_PATTERN.test(line)) return;

      let match;
      while ((match = amountPattern.exec(line)) !== null) {
        const amount = parseAmount(match[1]);
        if (!Number.isFinite(amount) || amount <= 0) continue;

        const hasTotalKeyword = TOTAL_KEYWORD_PATTERN.test(line);
        if (!hasTotalKeyword && candidates.length) continue;

        candidates.push({
          amount,
          score: totalLineScore(line, index, lines.length, amount)
        });
      }
    });

    if (!candidates.length) return null;
    candidates.sort((a, b) => b.score - a.score || b.amount - a.amount);
    return Math.round(candidates[0].amount * 100) / 100;
  }

  function totalLineScore(line, index, lineCount, amount) {
    const normalized = normalizeForMatching(line);
    let score = amount / 1000 + index / Math.max(1, lineCount);
    if (TOTAL_KEYWORD_PATTERN.test(line)) score += 100;
    if (FINAL_TOTAL_PATTERN.test(line)) score += 60;
    if (/total\s+eur/i.test(normalized)) score += 50;
    if (/total\s+ttc/i.test(normalized)) score += 45;
    if (/net\s+a\s+payer/i.test(normalized)) score += 55;
    if (/\ba\s+payer\b/i.test(normalized)) score += 45;
    if (/\btotal\b/i.test(normalized)) score += 25;
    return score;
  }

  function parseAmount(value) {
    const normalized = String(value).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    return Number.parseFloat(normalized);
  }

  function extractMerchant(lines) {
    const known = findKnownMerchant(lines);
    if (known) return known;

    const candidates = lines.slice(0, 10).map((line, index) => {
      const cleaned = cleanMerchantLine(line);
      if (!isPossibleMerchantLine(cleaned)) return null;
      return { value: cleaned.toUpperCase(), score: merchantLineScore(cleaned, index) };
    }).filter(Boolean);

    if (!candidates.length) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].value;
  }

  function findKnownMerchant(lines) {
    let best = null;
    lines.slice(0, 14).forEach((line, index) => {
      const normalized = normalizeForMatching(line);
      if (!normalized) return;
      KNOWN_MERCHANTS.forEach(merchant => {
        merchant.aliases.forEach(alias => {
          const aliasKey = normalizeForMatching(alias);
          const distance = levenshtein(normalized.replace(/\s/g, ''), aliasKey.replace(/\s/g, ''));
          const containsAlias = normalized.includes(aliasKey);
          const maxDistance = aliasKey.length <= 5 ? 1 : 2;
          if (!containsAlias && distance > maxDistance) return;
          const score = (containsAlias ? 120 : 90) - (index * 4) - (distance * 10);
          if (!best || score > best.score) best = { name: merchant.name, score };
        });
      });
    });
    return best?.name || null;
  }

  function cleanMerchantLine(line) {
    return String(line || '').replace(/[^\p{L}\p{N}&' -]/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  function isPossibleMerchantLine(cleaned) {
    if (cleaned.length < 3) return false;
    const normalized = cleaned.toLocaleLowerCase('fr-FR');
    if (/\d{2}[./-]\d{2}[./-]\d{2,4}/.test(cleaned)) return false;
    if (/\d+[,.]\d{2}/.test(cleaned)) return false;
    if (GENERIC_MERCHANT_WORDS.has(normalized)) return false;
    if ([...GENERIC_MERCHANT_WORDS].some(word => normalized === word || normalized.startsWith(`${word} `))) return false;
    return true;
  }

  function merchantLineScore(cleaned, index) {
    const normalized = normalizeForMatching(cleaned);
    let score = 100 - (index * 12);
    if (/\b(sas|sarl|sa|eurl|magasin)\b/i.test(normalized)) score -= 15;
    if (/\d/.test(cleaned)) score -= 20;
    if (cleaned.length > 28) score -= 10;
    return score;
  }

  function normalizeForMatching(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr-FR')
      .replace(/[0]/g, 'o')
      .replace(/[1|!]/g, 'i')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    const current = Array(b.length + 1);
    for (let i = 1; i <= a.length; i += 1) {
      current[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
      }
      previous.splice(0, previous.length, ...current);
    }
    return previous[b.length];
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
