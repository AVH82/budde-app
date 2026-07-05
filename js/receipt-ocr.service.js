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

  const TOTAL_KEYWORD_PATTERN = /\b(total(?:\s+(?:eur|ttc))?|net\s+[àa]\s+payer|[àa]\s+payer|carte\s+bleue|cb)\b/i;
  const STRICT_TOTAL_PATTERN = /\btotal(?:\s+(?:eur|ttc))?\b/i;
  const PAYABLE_TOTAL_PATTERN = /\b(net\s+[àa]\s+payer|[àa]\s+payer)\b/i;
  const CARD_TOTAL_PATTERN = /\b(carte\s+bleue|cb)\b/i;
  const FINAL_TOTAL_PATTERN = /\b(total\s+(?:eur|ttc)|net\s+[àa]\s+payer|[àa]\s+payer|carte\s+bleue|cb|total)\b/i;
  const ARTICLE_ZONE_MARKER_PATTERN = /\b(article|qt[eé]|prix|désignation|designation|libell[eé])\b/i;
  const TOTAL_ZONE_MARKER_PATTERN = /\b(total(?:\s+(?:eur|ttc))?|net\s+[àa]\s+payer|[àa]\s+payer|carte\s+bleue|cb|mode\s+de\s+paiement|paiement)\b/i;
  const AMOUNT_EXCLUSION_PATTERN = /\b(tva|dont\s+deee|deee|remise|r[eé]duction|promo|fid[eé]lit[eé]|avoir|rendu|monnaie|acompte|sous[-\s]?total)\b/i;

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
      const extracted = extractReceiptFields('');
      return { text: '', fields: extracted, diagnostic: extracted.diagnostic, status: getStatus(), unavailable: true };
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
        const extracted = extractReceiptFields(text, result?.data);
        return { text, fields: extracted, diagnostic: extracted.diagnostic, status: getStatus(), unavailable: false };
      } catch (error) {
        lastError = error;
        emitProgress(onProgress, 'retry', 10, 'Nouvelle tentative OCR avec une autre langue…');
      }
    }

    state.error = lastError?.message || 'Reconnaissance OCR impossible.';
    emitProgress(onProgress, 'error', 100, 'OCR impossible pour cette image.');
    const extracted = extractReceiptFields('');
    return { text: '', fields: extracted, diagnostic: extracted.diagnostic, status: getStatus(), unavailable: true, error: state.error };
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
    const totalResult = extractTotal(structuredLines, { includeDiagnostic: true });
    return {
      merchant: extractMerchant(lines),
      date: extractDate(lines),
      total: totalResult.amount,
      rawText: String(text || ''),
      structuredLines,
      diagnostic: {
        rawText: String(text || ''),
        structuredLines,
        amount: totalResult.diagnostic
      }
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
        y0: numberOrNull(line.bbox?.y0 ?? line.y0),
        y1: numberOrNull(line.bbox?.y1 ?? line.y1),
        x: numberOrNull(line.bbox?.x0 ?? line.x0),
        x1: numberOrNull(line.bbox?.x1 ?? line.x1),
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
      y0: index,
      y1: index,
      x: null,
      x1: null,
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

  function normalizeStructuredLines(lines) {
    return (lines || []).map((line, index) => {
      if (typeof line === 'string') return { text: line, index, y: index, y0: index, y1: index, x: null, x1: null, words: [] };
      const y0 = numberOrNull(line?.y0 ?? line?.bbox?.y0 ?? line?.y);
      const y1 = numberOrNull(line?.y1 ?? line?.bbox?.y1);
      return {
        text: String(line?.text || '').trim(),
        index: Number.isFinite(line?.index) ? line.index : index,
        y: numberOrNull(line?.y ?? y0),
        y0,
        y1,
        x: numberOrNull(line?.x ?? line?.bbox?.x0),
        x1: numberOrNull(line?.x1 ?? line?.bbox?.x1),
        words: Array.isArray(line?.words) ? line.words : []
      };
    }).filter(line => line.text);
  }

  function extractTotal(lines, options = {}) {
    const structuredLines = normalizeStructuredLines(lines);
    const zonedLines = assignReceiptZones(structuredLines);
    const diagnostic = { candidates: [], chosen: null };

    collectOrderedAmountCandidates(zonedLines, diagnostic);

    const totalZoneLines = zonedLines.filter(line => line.zone === 'totals');

    if (!diagnostic.candidates.length) {
      if (options.includeDiagnostic) return { amount: null, diagnostic: buildAmountDiagnosticPayload(diagnostic, zonedLines) };
      return null;
    }
    diagnostic.candidates.sort((a, b) => b.score - a.score || b.amount - a.amount);
    diagnostic.chosen = diagnostic.candidates[0];
    if ((!Number.isFinite(diagnostic.chosen.amount) || diagnostic.chosen.amount <= 0) && hasPositiveAmount(zonedLines)) {
      collectKeywordFallbackCandidates(zonedLines, diagnostic, 'sécurité montant positif');
      collectFallbackAmountCandidates(zonedLines.filter(line => line.zone !== 'items'), diagnostic, 'sécurité montant positif hors articles');
      diagnostic.candidates.sort((a, b) => b.score - a.score || b.amount - a.amount);
      diagnostic.chosen = diagnostic.candidates.find(candidate => candidate.amount > 0) || diagnostic.chosen;
    }
    logAmountDiagnostic(buildAmountDiagnosticPayload(diagnostic, zonedLines));
    if (options.includeDiagnostic) return { amount: roundAmount(diagnostic.chosen.amount), diagnostic: buildAmountDiagnosticPayload(diagnostic, zonedLines) };
    return roundAmount(diagnostic.chosen.amount);
  }


  function recalculateTotal(lines, rejectedAmounts = []) {
    const structuredLines = normalizeStructuredLines(lines);
    const zonedLines = assignReceiptZones(structuredLines);
    const rejected = normalizeRejectedAmounts(rejectedAmounts);
    const diagnostic = { candidates: [], chosen: null, rejected: Array.from(rejected) };

    collectOrderedAmountCandidates(zonedLines, diagnostic);

    if (!diagnostic.candidates.length) return { amount: null, diagnostic: buildAmountDiagnosticPayload(diagnostic, zonedLines) };
    diagnostic.candidates.sort((a, b) => b.score - a.score || b.amount - a.amount);
    diagnostic.chosen = diagnostic.candidates.find(candidate => !rejected.has(amountKey(candidate.amount))) || null;
    return { amount: diagnostic.chosen ? roundAmount(diagnostic.chosen.amount) : null, diagnostic: buildAmountDiagnosticPayload(diagnostic, zonedLines) };
  }

  function collectOrderedAmountCandidates(lines, diagnostic) {
    findPriorityAmountCandidates(lines, STRICT_TOTAL_PATTERN, diagnostic, 'candidat TOTAL / TOTAL EUR / TOTAL TTC');
    findPriorityAmountCandidates(lines, CARD_TOTAL_PATTERN, diagnostic, 'candidat Carte Bleue / CB');
    findPriorityAmountCandidates(lines, PAYABLE_TOTAL_PATTERN, diagnostic, 'candidat NET A PAYER / A PAYER');
    const totalZoneLines = lines.filter(line => line.zone === 'totals');
    if (totalZoneLines.length) collectFallbackAmountCandidates(totalZoneLines, diagnostic, 'candidat zone totaux');
    collectKeywordFallbackCandidates(lines, diagnostic, 'candidat libellé total/paiement');
    collectLastPositiveAmountCandidates(totalZoneLines.length ? totalZoneLines : lines, diagnostic, 'candidat derniers montants positifs plausibles');
  }

  function collectLastPositiveAmountCandidate(lines, diagnostic, reason) {
    collectLastPositiveAmountCandidates(lines, diagnostic, reason, 1);
  }

  function collectLastPositiveAmountCandidates(lines, diagnostic, reason, limit = 5) {
    const candidates = [];
    lines.forEach((line, index) => {
      if (AMOUNT_EXCLUSION_PATTERN.test(line.text)) return;
      extractLineAmounts(line).forEach(amountInfo => {
        if (looksLikeMergedQuantityAndPrice(line, amountInfo)) return;
        candidates.push({ line, index, amountInfo });
      });
    });
    candidates.filter(candidate => candidate.amountInfo.amount > 0).slice(-limit).reverse().forEach((candidate, offset) => {
      addAmountCandidate(diagnostic, {
        amount: roundAmount(candidate.amountInfo.amount),
        score: 700 + candidate.index - offset + rightnessScore(candidate.amountInfo, candidate.line),
        reason: `${reason}: ${candidate.line.text}`
      });
    });
  }

  function recalculateMerchant(lines, currentMerchant, rejectedMerchants = []) {
    const normalizedLines = normalizeStructuredLines(lines).map(line => line.text);
    const candidates = extractMerchantCandidates(normalizedLines);
    const rejected = new Set([currentMerchant, ...(rejectedMerchants || [])].map(value => normalizeForMatching(value || '')).filter(Boolean));
    const alternative = candidates.find(candidate => !rejected.has(normalizeForMatching(candidate.name)));
    return alternative ? alternative.name : null;
  }

  function assignReceiptZones(lines) {
    if (!lines.length) return [];
    const positions = lines.map((line, index) => Number.isFinite(line.y) ? line.y : index);
    const minY = Math.min(...positions);
    const maxY = Math.max(...positions);
    const range = Math.max(1, maxY - minY);
    const firstTotalIndex = lines.findIndex(line => isTotalsZoneMarkerLine(line.text));
    const firstArticleIndex = lines.findIndex(line => ARTICLE_ZONE_MARKER_PATTERN.test(line.text));

    return lines.map((line, index) => {
      const y = Number.isFinite(line.y) ? line.y : index;
      const ratio = (y - minY) / range;
      const receiptArea = ratio < 0.25 ? 'top' : ratio < 0.7 ? 'middle' : 'bottom';
      let zone = receiptArea === 'top' ? 'header' : receiptArea === 'bottom' ? 'totals' : 'items';

      if (firstTotalIndex >= 0 && index >= firstTotalIndex) zone = 'totals';
      else if (firstArticleIndex >= 0 && index >= firstArticleIndex) zone = 'items';
      else if (isTotalsZoneMarkerLine(line.text)) zone = 'totals';

      return { ...line, receiptArea, zone };
    });
  }

  function isTotalsZoneMarkerLine(text) {
    return TOTAL_ZONE_MARKER_PATTERN.test(text) && !ARTICLE_ZONE_MARKER_PATTERN.test(text);
  }

  function collectKeywordFallbackCandidates(lines, diagnostic, reason) {
    lines.forEach((line, index) => {
      if (!TOTAL_KEYWORD_PATTERN.test(line.text) || AMOUNT_EXCLUSION_PATTERN.test(line.text)) return;
      extractLineAmounts(line).forEach(amountInfo => {
        addAmountCandidate(diagnostic, {
          amount: roundAmount(amountInfo.amount),
          score: totalLabelScore(line.text, index, lines.length) + 85 + rightnessScore(amountInfo, line),
          reason: `${reason}: ${line.text}`
        });
      });
    });
  }

  function hasPositiveAmount(lines) {
    return lines.some(line => extractLineAmounts(line).some(amountInfo => amountInfo.amount > 0));
  }

  function collectFallbackAmountCandidates(lines, diagnostic, reason) {
    lines.forEach((line, index) => {
      if (AMOUNT_EXCLUSION_PATTERN.test(line.text)) return;
      extractLineAmounts(line).forEach(amountInfo => {
        addAmountCandidate(diagnostic, {
          amount: roundAmount(amountInfo.amount),
          score: fallbackTotalScore(line, index, lines.length, amountInfo),
          reason: `${reason} (${line.zone || 'zone inconnue'}): ${line.text}`
        });
      });
    });
  }

  function addAmountCandidate(diagnostic, candidate) {
    if (!Number.isFinite(candidate?.amount) || candidate.amount <= 0) return;
    if (AMOUNT_EXCLUSION_PATTERN.test(candidate.reason || '')) return;
    const key = amountKey(candidate.amount);
    if ((diagnostic.candidates || []).some(existing => amountKey(existing.amount) === key)) return;
    diagnostic.candidates.push(candidate);
    diagnostic.candidates.sort((a, b) => b.score - a.score || b.amount - a.amount);
    diagnostic.candidates = diagnostic.candidates.slice(0, 8);
  }

  function amountKey(amount) {
    return String(roundAmount(Number(amount)));
  }

  function normalizeRejectedAmounts(rejectedAmounts) {
    return new Set((rejectedAmounts || []).map(value => amountKey(parseAmount(String(value).replace(/[^0-9,.-]/g, '').replace(',', '.')))).filter(value => value !== 'NaN'));
  }

  function buildAmountDiagnosticPayload(diagnostic, lines) {
    const candidates = (diagnostic.candidates || []).map(candidate => ({
      amount: candidate.amount,
      score: Math.round((Number(candidate.score) || 0) * 100) / 100,
      reason: candidate.reason || 'raison indisponible'
    }));
    return {
      structuredLines: (lines || []).map(line => ({ index: line.index, zone: line.zone, text: line.text })),
      candidates,
      rejected: diagnostic.rejected || [],
      chosen: diagnostic.chosen ? {
        amount: diagnostic.chosen.amount,
        score: Math.round((Number(diagnostic.chosen.score) || 0) * 100) / 100,
        reason: diagnostic.chosen.reason || 'raison indisponible'
      } : null
    };
  }

  function logAmountDiagnostic(diagnostic) {
    if (!isDevelopmentMode() || typeof console === 'undefined' || typeof console.debug !== 'function') return;
    console.debug('[ReceiptOcrService] Diagnostic montant OCR', diagnostic);
  }

  function isDevelopmentMode() {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return false;
    if (typeof location === 'undefined') return true;
    return ['localhost', '127.0.0.1', ''].includes(location.hostname);
  }

  function findPriorityAmountCandidates(lines, labelPattern, diagnostic, source) {
    const candidates = findTotalLabelCandidates(lines, null, source, labelPattern);
    if (diagnostic) candidates.forEach(candidate => addAmountCandidate(diagnostic, candidate));
    return candidates;
  }

  function findTotalLabelCandidates(lines, diagnostic, source, labelPattern = FINAL_TOTAL_PATTERN) {
    const candidates = [];

    lines.forEach((line, index) => {
      if (!labelPattern.test(line.text) || AMOUNT_EXCLUSION_PATTERN.test(line.text) || ARTICLE_ZONE_MARKER_PATTERN.test(line.text)) return;

      const sameLineAmounts = extractVisualLineAmounts(line, lines).filter(amountInfo => !looksLikeMergedQuantityAndPrice(amountInfo.line || line, amountInfo));
      if (sameLineAmounts.length) {
        const amountInfo = sameLineAmounts.sort((a, b) => b.right - a.right || b.start - a.start)[0];
        candidates.push({
          amount: roundAmount(amountInfo.amount),
          score: totalLabelScore(line.text, index, lines.length) + 1000 + rightnessScore(amountInfo, amountInfo.line || line),
          reason: `${source}: libellé et montant sur la même ligne visuelle (${line.text})`
        });
        return;
      }

      const nextLine = lines[index + 1];
      const nextLineAmounts = nextLine ? extractLineAmounts(nextLine).filter(amountInfo => !looksLikeMergedQuantityAndPrice(nextLine, amountInfo)) : [];
      if (nextLineAmounts.length) {
        const amountInfo = nextLineAmounts.sort((a, b) => b.right - a.right || b.start - a.start)[0];
        candidates.push({
          amount: roundAmount(amountInfo.amount),
          score: totalLabelScore(line.text, index, lines.length) + 40 + rightnessScore(amountInfo, nextLine),
          reason: `${source}: libellé seul puis montant ligne suivante (${line.text} -> ${nextLine.text})`
        });
      }
    });

    const sorted = candidates.sort((a, b) => b.score - a.score || b.amount - a.amount);
    if (diagnostic) sorted.forEach(candidate => addAmountCandidate(diagnostic, candidate));
    return sorted;
  }

  function extractVisualLineAmounts(labelLine, lines) {
    const amounts = extractLineAmounts(labelLine).map(amountInfo => ({ ...amountInfo, line: labelLine }));
    const labelY = visualLineCenter(labelLine);
    if (!Number.isFinite(labelY)) return amounts;
    const tolerance = visualLineTolerance(lines);
    if (!Number.isFinite(tolerance)) return amounts;
    lines.forEach(line => {
      if (line === labelLine || line.index === labelLine.index) return;
      const lineY = visualLineCenter(line);
      if (!Number.isFinite(lineY) || Math.abs(lineY - labelY) > tolerance) return;
      extractLineAmounts(line).forEach(amountInfo => amounts.push({ ...amountInfo, line }));
    });
    return amounts;
  }

  function visualLineCenter(line) {
    if (Number.isFinite(line.y0) && Number.isFinite(line.y1)) return (line.y0 + line.y1) / 2;
    if (Number.isFinite(line.y)) return line.y;
    return null;
  }

  function visualLineTolerance(lines) {
    const heights = lines.map(line => Number.isFinite(line.y0) && Number.isFinite(line.y1) ? Math.abs(line.y1 - line.y0) : null).filter(height => Number.isFinite(height) && height > 0).sort((a, b) => a - b);
    if (!heights.length) return null;
    const medianHeight = heights[Math.floor(heights.length / 2)];
    return Math.max(3, medianHeight * 0.8);
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

  function looksLikeMergedQuantityAndPrice(line, amountInfo) {
    const prefix = line.text.slice(0, amountInfo.start).trim();
    if (!prefix) return false;
    return /\b\d+\s*$/.test(prefix) && amountInfo.start - prefix.length <= 1;
  }

  function rightnessScore(amountInfo, line) {
    const textRight = line.text.length || 1;
    return Math.min(10, (amountInfo.right / textRight) * 10);
  }

  function fallbackTotalScore(line, index, lineCount, amountInfo) {
    let score = (index / Math.max(1, lineCount)) * 20 + rightnessScore(amountInfo, line);
    if (TOTAL_KEYWORD_PATTERN.test(line.text)) score += 50;
    if (line.zone === 'totals') score += 25;
    if (line.zone === 'items') score -= 100;
    return score;
  }

  function rightEdgeForAmount(line, amountStart, rawAmount) {
    const amountEnd = amountStart + rawAmount.length;
    const matchingWords = (line.words || []).filter(word => {
      if (!Number.isFinite(word.x1)) return false;
      const wordText = normalizeAmountToken(word.text);
      return wordText && normalizeAmountToken(rawAmount).includes(wordText);
    });
    if (matchingWords.length) return Math.max(...matchingWords.map(word => word.x1));
    if (Number.isFinite(line.x1)) return line.x1;
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
    const candidates = extractMerchantCandidates(lines);
    return candidates[0]?.name || null;
  }

  function extractMerchantCandidates(lines) {
    return lines.slice(0, 20).map((line, index) => {
      const cleaned = cleanMerchantLine(line);
      const known = knownMerchantMatch(line, index);
      if (known) return { name: known.name, score: known.score };
      if (!isPossibleMerchantLine(cleaned)) return null;
      return { name: cleaned.toUpperCase(), score: merchantLineScore(cleaned, index) };
    }).filter(Boolean).sort((a, b) => b.score - a.score);
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

  const service = { init, recognizeImage, extractReceiptFields, recalculateTotal, recalculateMerchant, getStatus, isDevelopmentMode };
  global.ReceiptOcrService = service;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = service;
  }
})(typeof window !== 'undefined' ? window : globalThis);
