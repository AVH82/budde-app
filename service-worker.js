const CACHE_NAME='budde-frame-v2-1';

const ASSETS=[
  './',
  './index.html',
  './manifest.webmanifest',
  './css/pipboy.css?v=366',
  './css/frame-core.css?v=ast0106',
  './css/frame-system-v2.css?v=ast011',
  './js/app.js?v=3610',
  './js/buddy.js?v=366',
  './js/startup-gate.js?v=ast0106',
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

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
  );
  self.clients.claim();
});

const NETWORK_FIRST=new Set([
  '/',
  '/index.html',
  '/css/frame-system-v2.css',
  '/js/startup-gate.js'
]);

function normalizePath(requestUrl){
  const url=new URL(requestUrl);
  const scopePath=new URL(self.registration.scope).pathname.replace(/\/$/,'');
  const pathname=url.pathname.startsWith(scopePath)?url.pathname.slice(scopePath.length)||'/':url.pathname;
  return pathname.endsWith('/')?'/':pathname;
}

async function networkFirst(request){
  try{
    const response=await fetch(request);
    const cache=await caches.open(CACHE_NAME);
    await cache.put(request,response.clone());
    return response;
  }catch(error){
    return caches.match(request,{ignoreSearch:true}).then(cached=>cached||caches.match('./index.html'));
  }
}

async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached)return cached;
  try{
    const response=await fetch(request);
    const cache=await caches.open(CACHE_NAME);
    await cache.put(request,response.clone());
    return response;
  }catch(error){
    return caches.match('./index.html');
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const path=normalizePath(event.request.url);
  event.respondWith(NETWORK_FIRST.has(path)?networkFirst(event.request):cacheFirst(event.request));
});
