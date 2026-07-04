const CACHE_NAME = 'budde-3-1-3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/pipboy.css?v=313',
  './js/app.js?v=313',
  './js/buddy.js?v=313',
  './js/storage.local.js',
  './js/storage.service.js',
  './js/storage.google-drive.js',
  './js/google-auth.service.js',
  './js/receipt-ocr.service.js',
  './assets/logo/budde_logo.png',
  './assets/nav/home.png',
  './assets/nav/expenses.png',
  './assets/nav/budget.png',
  './assets/nav/stats.png',
  './assets/nav/merchants.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/buddy-thinking.png',
  './assets/buddy-success.png',
  './assets/buddy-warning.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

const NETWORK_FIRST_ASSETS = new Set([
  '/',
  '/index.html',
  '/css/pipboy.css',
  '/js/app.js'
]);

function normalizeAssetPath(requestUrl) {
  const url = new URL(requestUrl);
  const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/, '');
  const pathname = url.pathname.startsWith(scopePath)
    ? url.pathname.slice(scopePath.length) || '/'
    : url.pathname;

  return pathname.endsWith('/') ? '/' : pathname;
}

function isNetworkFirstRequest(request) {
  return NETWORK_FIRST_ASSETS.has(normalizeAssetPath(request.url));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    const copy = response.clone();
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, copy);
    return response;
  } catch (error) {
    return caches.match('./index.html');
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const copy = response.clone();
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, copy);
    return response;
  } catch (error) {
    return caches.match(request, { ignoreSearch: true }).then(cached => cached || caches.match('./index.html'));
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    isNetworkFirstRequest(event.request)
      ? networkFirst(event.request)
      : cacheFirst(event.request)
  );
});
