const CACHE_NAME = 'budde-3-6-13';
const ENTRY_PANEL_FIX_CSS = `
/* AST-007.3 — correction masque inférieur + suppression version basse */
.entryPanel{
  left:50%!important;
  right:auto!important;
  width:var(--frame-shell-w)!important;
  max-width:100vw!important;
  transform:translateX(-50%)!important;
  box-sizing:border-box!important;
  z-index:132!important;
  overflow:hidden!important;
  padding-left:clamp(14px,4vw,22px)!important;
  padding-right:clamp(14px,4vw,22px)!important;
}
.entryPanel::before{
  left:0!important;
  right:50%!important;
  width:auto!important;
  transform:none!important;
}
.entryPanel::after{
  left:50%!important;
  right:0!important;
  width:auto!important;
  transform:none!important;
}
.entryActions{
  width:100%!important;
  box-sizing:border-box!important;
}
#entryAppVersion,
.entryPanel #entryAppVersion,
.entryPanel .entryAppVersion{
  display:none!important;
  visibility:hidden!important;
}
#entryAppVersion::before,
#entryAppVersion::after,
.entryPanel .entryAppVersion::before,
.entryPanel .entryAppVersion::after{
  content:none!important;
  display:none!important;
}
@media(max-width:380px){
  .entryPanel{padding-left:10px!important;padding-right:10px!important;}
}
`;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/pipboy.css?v=366',
  './css/frame-core.css?v=ast005',
  './js/app.js?v=366',
  './js/buddy.js?v=366',
  './js/storage.local.js',
  './js/storage.service.js',
  './js/storage.google-drive.js',
  './js/google-auth.service.js',
  './js/buddy-vision.service.js?v=366',
  './js/receipt-ocr.service.js?v=366',
  './js/ocr-diagnostic.service.js?v=366',
  './assets/logo/budde_logo.png',
  './assets/nav/home.png',
  './assets/nav/expenses.png',
  './assets/nav/budget.png',
  './assets/nav/stats.png',
  './assets/nav/merchants.png',
  './assets/frame/FRM-001_frame-top.png',
  './assets/frame/FRM-002_frame-bottom.png',
  './assets/frame/FRM-003_frame-left.png',
  './assets/frame/FRM-004_frame-right.png',
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
  '/css/frame-core.css',
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

function appendEntryPanelFix(pathname, response) {
  if (pathname !== '/css/frame-core.css') return response;
  return response.text().then(css => new Response(`${css}\n${ENTRY_PANEL_FIX_CSS}`, {
    status: response.status,
    statusText: response.statusText,
    headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-cache' }
  }));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    const pathname = normalizeAssetPath(request.url);
    const finalResponse = await appendEntryPanelFix(pathname, response.clone());
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, finalResponse.clone());
    return finalResponse;
  } catch (error) {
    return caches.match('./index.html');
  }
}

async function networkFirst(request) {
  const pathname = normalizeAssetPath(request.url);
  try {
    const response = await fetch(request);
    const finalResponse = await appendEntryPanelFix(pathname, response.clone());
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, finalResponse.clone());

    return finalResponse;
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
