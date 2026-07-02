const CACHE_NAME = 'budde-1-0-13';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/pipboy.css',
  './js/app.js',
  './js/storage.local.js',
  './js/storage.service.js',
  './js/storage.google-drive.js',
  './js/google-auth.service.js',
  './assets/logo/budde_logo.png',
  './assets/nav/home.png',
  './assets/nav/expenses.png',
  './assets/nav/budget.png',
  './assets/nav/stats.png',
  './assets/nav/merchants.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
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

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
