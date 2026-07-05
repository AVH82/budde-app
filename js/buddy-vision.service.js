(function (global) {
  'use strict';

  const FUTURE_FEATURES = Object.freeze(['qr-code', 'barcode', 'ai-ocr', 'merchant-logo', 'receipt-type']);
  const MAX_WORK_SIZE = 1600;
  const OUTPUT_MIME = 'image/jpeg';
  const OUTPUT_QUALITY = 0.94;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function hasCanvas() {
    return typeof document !== 'undefined' && !!document.createElement;
  }

  function canvas(width, height) {
    const element = document.createElement('canvas');
    element.width = Math.max(1, Math.round(width));
    element.height = Math.max(1, Math.round(height));
    return element;
  }

  function loadImage(fileOrBlob) {
    return new Promise((resolve, reject) => {
      if (!fileOrBlob) {
        reject(new Error('Buddy Vision a besoin d’une image.'));
        return;
      }
      const url = URL.createObjectURL(fileOrBlob);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image illisible pour Buddy Vision.'));
      };
      image.src = url;
    });
  }

  function drawSource(image) {
    const scale = Math.min(1, MAX_WORK_SIZE / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
    const work = canvas((image.naturalWidth || image.width) * scale, (image.naturalHeight || image.height) * scale);
    work.getContext('2d', { willReadFrequently: true }).drawImage(image, 0, 0, work.width, work.height);
    return work;
  }

  function luminanceMap(data, width, height) {
    const map = new Float32Array(width * height);
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      map[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return map;
  }

  function imageStats(map) {
    let min = 255, max = 0, sum = 0, edgeSum = 0;
    for (let i = 0; i < map.length; i += 1) {
      const value = map[i];
      min = Math.min(min, value);
      max = Math.max(max, value);
      sum += value;
      if (i > 0) edgeSum += Math.abs(value - map[i - 1]);
    }
    const mean = sum / Math.max(1, map.length);
    return { min, max, mean, contrast: max - min, sharpness: edgeSum / Math.max(1, map.length - 1) };
  }

  function pointDistance(a, b) {
    return Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));
  }

  function orderQuad(points) {
    const sorted = [...points].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    const tl = sorted[0];
    const br = sorted[sorted.length - 1];
    const middle = sorted.slice(1, -1).sort((a, b) => (a.y - a.x) - (b.y - b.x));
    return [tl, middle[0], br, middle[1]];
  }

  function boundsFromQuad(quad) {
    const xs = quad.map(point => point.x);
    const ys = quad.map(point => point.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  function findEdgePoint(map, width, height, startX, startY, dirX, dirY, limit, threshold) {
    let best = { x: startX, y: startY, energy: -1 };
    for (let step = 0; step < limit; step += 1) {
      const x = Math.round(startX + dirX * step);
      const y = Math.round(startY + dirY * step);
      if (x < 2 || y < 2 || x >= width - 2 || y >= height - 2) break;
      const i = y * width + x;
      const gx = Math.abs(map[i + 1] - map[i - 1]);
      const gy = Math.abs(map[i + width] - map[i - width]);
      const energy = gx + gy + (map[i] >= threshold ? 16 : 0);
      if (energy > best.energy) best = { x, y, energy };
    }
    return best;
  }

  function refineQuadFromEdges(map, width, height, roughBounds, threshold) {
    const cx = roughBounds.x + roughBounds.width / 2;
    const cy = roughBounds.y + roughBounds.height / 2;
    const limit = Math.round(Math.max(roughBounds.width, roughBounds.height) * 0.65);
    const tl = findEdgePoint(map, width, height, cx, cy, -1, -1, limit, threshold);
    const tr = findEdgePoint(map, width, height, cx, cy, 1, -1, limit, threshold);
    const br = findEdgePoint(map, width, height, cx, cy, 1, 1, limit, threshold);
    const bl = findEdgePoint(map, width, height, cx, cy, -1, 1, limit, threshold);
    return orderQuad([tl, tr, br, bl].map(point => ({ x: point.x, y: point.y })));
  }

  function detectReceipt(canvasElement, map, stats) {
    const width = canvasElement.width;
    const height = canvasElement.height;
    const threshold = clamp(stats.mean + Math.max(10, stats.contrast * 0.08), 80, 245);
    let minX = width, minY = height, maxX = 0, maxY = 0, hits = 0;
    const marginX = Math.round(width * 0.03);
    const marginY = Math.round(height * 0.03);
    for (let y = marginY; y < height - marginY; y += 2) {
      for (let x = marginX; x < width - marginX; x += 2) {
        const value = map[y * width + x];
        if (value >= threshold) {
          hits += 1;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    const area = Math.max(0, (maxX - minX) * (maxY - minY));
    const imageArea = width * height;
    if (!hits || area < imageArea * 0.18) {
      minX = Math.round(width * 0.06); minY = Math.round(height * 0.04);
      maxX = Math.round(width * 0.94); maxY = Math.round(height * 0.96);
    }
    const padX = Math.round((maxX - minX) * 0.025);
    const padY = Math.round((maxY - minY) * 0.025);
    const roughBounds = { x: clamp(minX - padX, 0, width), y: clamp(minY - padY, 0, height), width: clamp(maxX + padX, 0, width) - clamp(minX - padX, 0, width), height: clamp(maxY + padY, 0, height) - clamp(minY - padY, 0, height) };
    const quad = refineQuadFromEdges(map, width, height, roughBounds, threshold);
    const refinedBounds = boundsFromQuad(quad);
    const rectArea = refinedBounds.width * refinedBounds.height;
    const topWidth = pointDistance(quad[0], quad[1]);
    const bottomWidth = pointDistance(quad[3], quad[2]);
    const leftHeight = pointDistance(quad[0], quad[3]);
    const rightHeight = pointDistance(quad[1], quad[2]);
    const aspect = ((leftHeight + rightHeight) / 2) / Math.max(1, (topWidth + bottomWidth) / 2);
    const perspectiveDelta = Math.abs(topWidth - bottomWidth) / Math.max(topWidth, bottomWidth, 1) + Math.abs(leftHeight - rightHeight) / Math.max(leftHeight, rightHeight, 1);
    const score = Math.round(clamp((rectArea / imageArea) * 42 + (aspect > 1.15 && aspect < 4.8 ? 28 : 14) + clamp(stats.contrast / 3, 0, 30), 0, 100));
    return { quad, bounds: refinedBounds, score, aspect, areaRatio: rectArea / imageArea, perspectiveDelta };
  }

  function perspectiveCoefficients(src, width, height) {
    const dst = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
    const matrix = [];
    const values = [];
    for (let i = 0; i < 4; i += 1) {
      const x = dst[i].x, y = dst[i].y, u = src[i].x, v = src[i].y;
      matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); values.push(u);
      matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]); values.push(v);
    }
    for (let col = 0; col < 8; col += 1) {
      let pivot = col;
      for (let row = col + 1; row < 8; row += 1) if (Math.abs(matrix[row][col]) > Math.abs(matrix[pivot][col])) pivot = row;
      [matrix[col], matrix[pivot]] = [matrix[pivot], matrix[col]]; [values[col], values[pivot]] = [values[pivot], values[col]];
      const div = matrix[col][col] || 1;
      for (let c = col; c < 8; c += 1) matrix[col][c] /= div;
      values[col] /= div;
      for (let row = 0; row < 8; row += 1) {
        if (row === col) continue;
        const factor = matrix[row][col];
        for (let c = col; c < 8; c += 1) matrix[row][c] -= factor * matrix[col][c];
        values[row] -= factor * values[col];
      }
    }
    return values;
  }

  function cropAndFlatten(source, receipt) {
    const width = Math.max(pointDistance(receipt.quad[0], receipt.quad[1]), pointDistance(receipt.quad[3], receipt.quad[2]));
    const height = Math.max(pointDistance(receipt.quad[0], receipt.quad[3]), pointDistance(receipt.quad[1], receipt.quad[2]));
    const targetWidth = Math.round(clamp(width, 720, 1500));
    const targetHeight = Math.round(clamp(height, 1000, 2600));
    const out = canvas(targetWidth, targetHeight);
    const ctx = out.getContext('2d', { willReadFrequently: true });
    const srcCtx = source.getContext('2d', { willReadFrequently: true });
    const srcData = srcCtx.getImageData(0, 0, source.width, source.height);
    const outData = ctx.createImageData(targetWidth, targetHeight);
    const coeff = perspectiveCoefficients(receipt.quad, targetWidth - 1, targetHeight - 1);
    for (let y = 0; y < targetHeight; y += 1) {
      for (let x = 0; x < targetWidth; x += 1) {
        const den = coeff[6] * x + coeff[7] * y + 1;
        const sx = clamp((coeff[0] * x + coeff[1] * y + coeff[2]) / den, 0, source.width - 1);
        const sy = clamp((coeff[3] * x + coeff[4] * y + coeff[5]) / den, 0, source.height - 1);
        const si = (Math.round(sy) * source.width + Math.round(sx)) * 4;
        const di = (y * targetWidth + x) * 4;
        outData.data[di] = srcData.data[si]; outData.data[di + 1] = srcData.data[si + 1]; outData.data[di + 2] = srcData.data[si + 2]; outData.data[di + 3] = 255;
      }
    }
    ctx.putImageData(outData, 0, 0);
    return out;
  }

  function enhance(input) {
    const out = canvas(input.width, input.height);
    const ctx = out.getContext('2d', { willReadFrequently: true });
    ctx.filter = 'contrast(1.12) saturate(1.03) brightness(1.03)';
    ctx.drawImage(input, 0, 0);
    ctx.filter = 'none';
    const img = ctx.getImageData(0, 0, out.width, out.height);
    const src = new Uint8ClampedArray(img.data);
    for (let y = 1; y < out.height - 1; y += 1) {
      for (let x = 1; x < out.width - 1; x += 1) {
        const i = (y * out.width + x) * 4;
        for (let c = 0; c < 3; c += 1) {
          const center = src[i + c] * 1.55;
          const blur = (src[i - 4 + c] + src[i + 4 + c] + src[i - out.width * 4 + c] + src[i + out.width * 4 + c]) * 0.1375;
          img.data[i + c] = clamp(center - blur, 0, 255);
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    return out;
  }

  function toBlob(canvasElement) {
    return new Promise(resolve => canvasElement.toBlob(resolve, OUTPUT_MIME, OUTPUT_QUALITY));
  }

  function qualityReport(source, receipt, enhancedCanvas) {
    const data = enhancedCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, enhancedCanvas.width, enhancedCanvas.height).data;
    const stats = imageStats(luminanceMap(data, enhancedCanvas.width, enhancedCanvas.height));
    const luminosity = 100 - Math.abs(stats.mean - 178) / 1.78;
    const sharpness = clamp(stats.sharpness * 8, 0, 100);
    const framing = clamp(receipt.areaRatio * 120, 0, 100);
    const perspective = receipt.aspect > 1.1 && receipt.aspect < 5 ? receipt.score : receipt.score * 0.75;
    const glare = clamp(100 - Math.max(0, stats.max - 246) * 2.6, 0, 100);
    const cornerBonus = receipt.quad?.length === 4 ? 8 : 0;
    const perspectiveBonus = Math.max(0, 10 - (receipt.perspectiveDelta || 0) * 18);
    const score = Math.round(clamp(sharpness * 0.2 + framing * 0.22 + perspective * 0.22 + luminosity * 0.18 + glare * 0.1 + cornerBonus + perspectiveBonus, 0, 100));
    return { score, components: { sharpness: Math.round(sharpness), framing: Math.round(framing), perspective: Math.round(perspective), luminosity: Math.round(luminosity), glare: Math.round(glare) }, receipt, source: { width: source.width, height: source.height }, output: { width: enhancedCanvas.width, height: enhancedCanvas.height }, futureFeatures: FUTURE_FEATURES };
  }


  function analyzeFrame(video) {
    if (!hasCanvas() || !video?.videoWidth || !video?.videoHeight) return null;
    const scale = Math.min(1, 240 / Math.max(video.videoWidth, video.videoHeight));
    const source = canvas(video.videoWidth * scale, video.videoHeight * scale);
    const ctx = source.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, source.width, source.height);
    const data = ctx.getImageData(0, 0, source.width, source.height).data;
    const map = luminanceMap(data, source.width, source.height);
    const stats = imageStats(map);
    const width = source.width;
    const height = source.height;
    const threshold = clamp(stats.mean + Math.max(8, stats.contrast * 0.06), 70, 235);
    let minX = width, minY = height, maxX = 0, maxY = 0, hits = 0;
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const value = map[y * width + x];
        if (value >= threshold) {
          hits += 1;
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    }
    const area = Math.max(0, (maxX - minX) * (maxY - minY));
    const imageArea = width * height;
    const areaRatio = area / Math.max(1, imageArea);
    const contrastEnough = stats.contrast >= 28;
    const largeEnough = areaRatio >= 0.18;
    const hasReceipt = hits > 24 && largeEnough && contrastEnough;
    const luminosity = 100 - Math.abs(stats.mean - 178) / 1.78;
    const score = Math.round(clamp(areaRatio * 58 + clamp(stats.contrast / 2.2, 0, 30) + clamp(luminosity / 6, 0, 12), 0, 100));
    const upscaleX = video.videoWidth / Math.max(1, width);
    const upscaleY = video.videoHeight / Math.max(1, height);
    const bounds = hasReceipt
      ? { x: minX * upscaleX, y: minY * upscaleY, width: (maxX - minX) * upscaleX, height: (maxY - minY) * upscaleY }
      : { x: video.videoWidth * 0.12, y: video.videoHeight * 0.1, width: video.videoWidth * 0.76, height: video.videoHeight * 0.8 };
    return {
      score,
      components: { contrast: Math.round(stats.contrast), luminosity: Math.round(luminosity), framing: Math.round(clamp(areaRatio * 120, 0, 100)) },
      receipt: { bounds, quad: [] },
      source: { width: video.videoWidth, height: video.videoHeight },
      hasReceipt,
      largeEnough,
      contrastEnough
    };
  }

  async function prepareImage(fileOrBlob, options = {}) {
    if (!hasCanvas()) return { file: fileOrBlob, blob: fileOrBlob, report: { score: 0, unavailable: true, reason: 'Canvas indisponible' } };
    const image = await loadImage(fileOrBlob);
    options.onProgress?.({ step: 'prepare', percent: 8, message: 'Je redresse le reçu.' });
    const source = drawSource(image);
    const sourceData = source.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, source.width, source.height).data;
    const map = luminanceMap(sourceData, source.width, source.height);
    const receipt = detectReceipt(source, map, imageStats(map));
    options.onProgress?.({ step: 'deskew', percent: 16, message: 'Je redresse le reçu.' });
    const flattened = cropAndFlatten(source, receipt);
    options.onProgress?.({ step: 'enhance', percent: 24, message: 'J’optimise la lecture.' });
    const enhanced = enhance(flattened);
    const blob = await toBlob(enhanced);
    if (!blob) throw new Error('Buddy Vision n’a pas pu exporter l’image optimisée.');
    const name = String(fileOrBlob.name || 'receipt.jpg').replace(/(\.[a-z0-9]+)?$/i, '-buddy-vision.jpg');
    const file = typeof File !== 'undefined' ? new File([blob], name, { type: OUTPUT_MIME, lastModified: Date.now() }) : blob;
    return { file, blob, report: qualityReport(source, receipt, enhanced), previewCanvas: enhanced };
  }

  global.BuddyVisionService = { prepareImage, analyzeFrame, capabilities: { futureFeatures: FUTURE_FEATURES } };
})(typeof window !== 'undefined' ? window : globalThis);
