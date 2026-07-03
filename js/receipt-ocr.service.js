(function (global) {
  'use strict';

  const CDN_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  const GENERIC_MERCHANT_WORDS = new Set([
    'ticket', 'recu', 'reçu', 'facture', 'duplicata', 'client', 'caisse', 'cb',
    'carte', 'bancaire', 'total', 'ttc', 'ht', 'tva', 'eur', 'euro', 'euros',
    'merci', 'a payer', 'à payer', 'siret', 'ape', 'naf', 'tel', 'telephone',
    'téléphone', 'date', 'heure', 'slogan', 'magasin', 'bienvenue',
    'adresse', 'rue', 'avenue', 'boulevard', 'route', 'zone', 'commerciale',
    'siren', 'rcs', 'naf', 'ape', 'ticket', 'caisse', 'vendeur'
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
  const AMOUNT_EXCLUSION_PATTERN = /\b(article|tva|cb|carte\s+bleue|carte\s+bancaire|dont\s+deee|deee|remise|fid[eé]lit[eé]|avoir|rendu|monnaie|acompte|sous[-\s]?total)\b/i;

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
        return { text, fields: extractReceiptFields(text, result?.data), status: getStatus(), unavailable: false };
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

  function extractReceiptFields(text, ocrData) {
    const structuredLines = buildStructuredOcrLines(text, ocrData);
    const lines = structuredLines.map(line => line.text);
    return {
      merchant: extractMerchant(lines),
      date: extractDate(lines),
      total: extractTotal(structuredLines),
      rawText: String(text || '')
    };
  }

  function buildStructuredOcrLines(text, ocrData) {
    const ocrLines = Array.isArray(ocrData?.lines) ? ocrData.lines : [];
    const structured = ocrLines.map((line, index) => {
      const words = Array.isArray(line.words) ? line.words.map((word, wordIndex) => ({
        text: String(word.text || '').trim(),
        index: wordIndex,
        x0: numberOrNull(word.bbox?.x0 ?? word.x0),
        y0: numberOrNull(word.bbox?.y0 ?? word.y0),
        x1: numberOrNull(word.bbox?.x1 ?? word.x1),
        y1: numberOrNull(word.bbox?.y1 ?? word.y1)
      })).filter(word => word.text) : [];

      return {
        text: String(line.text || '').trim(),
        index,
        y: numberOrNull(line.bbox?.y0 ?? line.y0),
        x: numberOrNull(line.bbox?.x0 ?? line.x0),
        words
      };
    }).filter(line => line.text);

    if (structured.length) {
      return structured.sort((a, b) => (a.y ?? a.index) - (b.y ?? b.index)).map((line, index) => ({ ...line, index }));
    }

    return String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, index) => ({
      text: line,
      index,
      y: index,
      x: null,
      words: []
    }));
  }

  function numberOrNull(value) {
    return Number.isFinite(Number(value)) ? Number(value) : null;
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
    const structuredLines = normalizeStructuredLines(lines);
    const labelCandidates = findTotalLabelCandidates(structuredLines);
    if (labelCandidates.length) return labelCandidates[0].amount;

    const amountPattern = /(?:^|\s)(\d{1,4}(?:[\s.]\d{3})*(?:[,.]\d{2})|\d+[,.]\d{2})(?:\s?€|\s?eur)?\b/gi;
    const candidates = [];

    structuredLines.forEach((line, index) => {
      if (AMOUNT_EXCLUSION_PATTERN.test(line.text)) return;

      let match;
      while ((match = amountPattern.exec(line.text)) !== null) {
        const amount = parseAmount(match[1]);
        if (!Number.isFinite(amount) || amount <= 0) continue;

        candidates.push({
          amount,
          hasTotalKeyword: TOTAL_KEYWORD_PATTERN.test(line.text),
          score: totalLineScore(line.text, index, structuredLines.length, amount)
        });
      }
    });

    const totalCandidates = candidates.filter(candidate => candidate.hasTotalKeyword);
    const eligibleCandidates = totalCandidates.length ? totalCandidates : candidates;
    if (!eligibleCandidates.length) return null;
    eligibleCandidates.sort((a, b) => b.score - a.score || b.amount - a.amount);
    return roundAmount(eligibleCandidates[0].amount);
  }

  function normalizeStructuredLines(lines) {
    return (lines || []).map((line, index) => {
      if (typeof line === 'string') return { text: line, index, y: index, x: null, words: [] };
      return {
        text: String(line?.text || '').trim(),
        index: Number.isFinite(line?.index) ? line.index : index,
        y: numberOrNull(line?.y),
        x: numberOrNull(line?.x),
        words: Array.isArray(line?.words) ? line.words : []
      };
    }).filter(line => line.text);
  }

  function findTotalLabelCandidates(lines) {
    const candidates = [];

    lines.forEach((line, index) => {
      if (!TOTAL_KEYWORD_PATTERN.test(line.text)) return;

      const sameLineAmounts = extractLineAmounts(line);
      if (sameLineAmounts.length) {
        const amount = sameLineAmounts.sort((a, b) => b.right - a.right || b.start - a.start)[0].amount;
        candidates.push({ amount: roundAmount(amount), score: totalLabelScore(line.text, index, lines.length) + 100 });
        return;
      }

      const nextLine = lines[index + 1];
      const nextLineAmounts = nextLine ? extractLineAmounts(nextLine) : [];
      if (nextLineAmounts.length) {
        const amount = nextLineAmounts.sort((a, b) => b.right - a.right || b.start - a.start)[0].amount;
        candidates.push({ amount: roundAmount(amount), score: totalLabelScore(line.text, index, lines.length) + 40 });
      }
    });

    return candidates.sort((a, b) => b.score - a.score || b.amount - a.amount);
  }

  function extractLineAmounts(line) {
    const text = line.text;
    const amountPattern = /(\d{1,4}(?:[\s.]\d{3})*(?:[,.]\d{2})|\d+[,.]\d{2})(?:\s?€|\s?eur)?\b/gi;
    const amounts = [];
    let match;
    while ((match = amountPattern.exec(text)) !== null) {
      const amount = parseAmount(match[1]);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      amounts.push({ amount, start: match.index, right: rightEdgeForAmount(line, match.index, match[0]) });
    }
    return amounts;
  }

  function rightEdgeForAmount(line, amountStart, rawAmount) {
    const amountEnd = amountStart + rawAmount.length;
    const matchingWords = (line.words || []).filter(word => {
      if (!Number.isFinite(word.x1)) return false;
      const wordText = normalizeAmountToken(word.text);
      return wordText && normalizeAmountToken(rawAmount).includes(wordText);
    });
    if (matchingWords.length) return Math.max(...matchingWords.map(word => word.x1));
    return amountEnd;
  }

  function normalizeAmountToken(value) {
    return String(value || '').toLocaleLowerCase('fr-FR').replace(/[^0-9,\.]/g, '');
  }

  function totalLabelScore(line, index, lineCount) {
    const normalized = normalizeForMatching(line);
    let score = index / Math.max(1, lineCount);
    if (/net\s+a\s+payer/i.test(normalized)) score += 80;
    if (/total\s+eur/i.test(normalized)) score += 75;
    if (/total\s+ttc/i.test(normalized)) score += 70;
    if (/\ba\s+payer\b/i.test(normalized)) score += 65;
    if (/\btotal\b/i.test(normalized)) score += 50;
    return score;
  }

  function roundAmount(amount) {
    return Math.round(amount * 100) / 100;
  }

  function parseAmount(value) {
    const normalized = String(value).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    return Number.parseFloat(normalized);
  }

  function extractMerchant(lines) {
    const candidates = lines.slice(0, 20).map((line, index) => {
      const cleaned = cleanMerchantLine(line);
      const known = knownMerchantMatch(line, index);
      if (known) return { value: known.name, score: known.score };
      if (!isPossibleMerchantLine(cleaned)) return null;
      return { value: cleaned.toUpperCase(), score: merchantLineScore(cleaned, index) };
    }).filter(Boolean);

    if (!candidates.length) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].value;
  }

  function knownMerchantMatch(line, index) {
    const normalized = normalizeForMatching(line);
    if (!normalized) return null;
    let best = null;
    KNOWN_MERCHANTS.forEach(merchant => {
      merchant.aliases.forEach(alias => {
        const aliasKey = normalizeForMatching(alias);
        const distance = merchantAliasDistance(normalized, aliasKey);
        const containsAlias = normalized.includes(aliasKey);
        const maxDistance = aliasKey.length <= 5 ? 1 : 2;
        if (!containsAlias && distance > maxDistance) return;
        const score = 260 + (containsAlias ? 80 : 45) - (index * 6) - (distance * 18);
        if (!best || score > best.score) best = { name: merchant.name, score };
      });
    });
    return best;
  }

  function merchantAliasDistance(normalized, aliasKey) {
    const compactLine = normalized.replace(/\s/g, '');
    const compactAlias = aliasKey.replace(/\s/g, '');
    if (compactLine.includes(compactAlias)) return 0;
    const lengths = new Set([compactAlias.length, compactAlias.length + 1, compactAlias.length + 2]);
    let best = levenshtein(compactLine, compactAlias);
    lengths.forEach(length => {
      for (let start = 0; start <= compactLine.length - length; start += 1) {
        best = Math.min(best, levenshtein(compactLine.slice(start, start + length), compactAlias));
      }
    });
    return best;
  }

  function cleanMerchantLine(line) {
    return String(line || '').replace(/[^\p{L}\p{N}&' -]/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  function isPossibleMerchantLine(cleaned) {
    if (cleaned.length < 3) return false;
    const normalized = cleaned.toLocaleLowerCase('fr-FR');
    if (usefulLetterCount(cleaned) < 5) return false;
    if (isNoisyShortMerchantLine(cleaned)) return false;
    if (/\d{2}[./-]\d{2}[./-]\d{2,4}/.test(cleaned)) return false;
    if (/\d+[,.]\d{2}/.test(cleaned)) return false;
    if (/\b(?:tva|ticket|caisse|carte|total|tel|telephone|siret|siren|rcs)\b/i.test(normalized)) return false;
    if (/\b(?:rue|avenue|av|boulevard|bd|route|chemin|zone|zac|zi|code\s+postal)\b/i.test(normalized)) return false;
    if (GENERIC_MERCHANT_WORDS.has(normalized)) return false;
    if ([...GENERIC_MERCHANT_WORDS].some(word => normalized === word || normalized.startsWith(`${word} `))) return false;
    return true;
  }

  function usefulLetterCount(value) {
    return (String(value || '').match(/\p{L}/gu) || []).length;
  }

  function isNoisyShortMerchantLine(cleaned) {
    const letters = usefulLetterCount(cleaned);
    if (letters > 6) return false;
    const tokens = normalizeForMatching(cleaned).split(' ').filter(Boolean);
    if (!tokens.length) return true;
    if (tokens.length > 1 && tokens.every(token => token.length <= 3)) return true;
    const compact = tokens.join('');
    const vowels = (compact.match(/[aeiouy]/g) || []).length;
    return compact.length <= 6 && vowels <= 1;
  }

  function merchantLineScore(cleaned, index) {
    const normalized = normalizeForMatching(cleaned);
    let score = 160 - (index * 10);
    if (index < 3) score += 30 - (index * 5);
    if (/\b(sas|sarl|sa|eurl|magasin)\b/i.test(normalized)) score -= 15;
    if (/\d/.test(cleaned)) score -= 25;
    if (cleaned.length > 28) score -= 10;
    if (/\b(?:rue|avenue|av|boulevard|bd|route|chemin|zone|zac|zi|code postal)\b/i.test(normalized)) score -= 90;
    if (/\b(?:date|heure|tel|telephone|tva|ticket|caisse|carte|total|cb|siret|siren|rcs)\b/i.test(normalized)) score -= 110;
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
