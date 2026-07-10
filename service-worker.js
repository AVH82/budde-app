const CACHE_NAME = 'budde-3-6-31';

const ENTRY_GATE_OLD = `<div class="entryPanel"><img class="entryLogo" src="assets/logo/budde_logo.png" alt="Budd€"><h1>Connexion Google</h1><p id="entryAppVersion" class="entryAppVersion">Budd€ v3.6.6</p><p id="entryBuildId" class="entryBuildId">build budde-3-6-6</p><p>Connectez Google pour synchroniser vos données, ou continuez hors ligne.</p><div class="entryActions"><button id="entryGoogleButton" class="primaryBtn">Connexion Google</button><button id="entryOfflineButton">Accéder hors ligne</button></div><p id="entryGateStatus" class="entryStatus"></p></div>`;

const ENTRY_GATE_NEW = `<div class="entryPanel entryPanel--doors"><img class="entryLogo" src="assets/logo/budde_logo.png" alt="Budd€"><h1>Connexion Google</h1><p id="entryAppVersion" class="entryAppVersion">Budd€ v3.6.31</p><p id="entryBuildId" class="entryBuildId">build budde-3-6-31</p><p>Connectez Google pour synchroniser vos données, ou continuez hors ligne.</p><div class="entryActions entryActions--doors"><div class="entryDoor entryDoor--left"><button id="entryGoogleButton" class="primaryBtn">Connexion Google</button></div><div class="entryDoor entryDoor--right"><button id="entryOfflineButton">Accéder hors ligne</button></div></div><p id="entryGateStatus" class="entryStatus"></p></div>`;

const ENTRY_PANEL_FIX_CSS = `
/* AST-010.8 — authoritative startup layering */
.app.frameShell{isolation:auto!important;}
.app.frameShell main{position:relative!important;z-index:25!important;}
.frameShellTop{z-index:360!important;display:grid!important;visibility:visible!important;}
.frameShellBottom.pipDock{z-index:360!important;display:grid!important;visibility:visible!important;}

.frameShellTop .settingsTrustModule::before{content:'v3.6.31'!important;}
#systemAppVersion::after,#diagnosticAppVersion::after,#entryAppVersion::after{content:'3.6.31'!important;}
#systemBuildId::after,#diagnosticBuildId::after,#diagnosticExpectedCache::after,#entryBuildId::after{content:'budde-3-6-31'!important;}

.entryGate,
.entryGate:not([hidden]),
.entryGate.entryGate--opening{
  z-index:auto!important;
  display:block!important;
  visibility:visible!important;
  pointer-events:auto!important;
  overflow:hidden!important;
}
.entryGate.entryGate--opening{pointer-events:none!important;}

.entryGate::before,.entryGate::after,
.entryGate:not([hidden])::before,.entryGate:not([hidden])::after,
.entryGate.entryGate--opening::before,.entryGate.entryGate--opening::after{
  z-index:300!important;
  display:block!important;
  visibility:visible!important;
  opacity:1!important;
}
.entryGate.entryGate--opening::before{
  animation:entryShutterTopMechanical var(--gate-speed,2.45s) steps(7,end) forwards!important;
}
.entryGate.entryGate--opening::after{
  animation:entryShutterBottomMechanical var(--gate-speed,2.45s) steps(7,end) forwards!important;
}

.entryPanel.entryPanel--doors,
.entryGate:not([hidden]) .entryPanel.entryPanel--doors,
.entryGate.entryGate--opening .entryPanel.entryPanel--doors{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  top:auto!important;
  bottom:calc(var(--nav-h,104px) + env(safe-area-inset-bottom) + 8px)!important;
  width:var(--frame-shell-w)!important;
  max-width:100vw!important;
  height:calc(var(--nav-h,104px) + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  z-index:370!important;
  display:grid!important;
  visibility:visible!important;
  opacity:1!important;
  overflow:visible!important;
  pointer-events:auto!important;
  padding:0!important;
  margin:0!important;
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
}
.entryGate.entryGate--opening .entryPanel.entryPanel--doors{pointer-events:none!important;}
.entryPanel.entryPanel--doors::before,.entryPanel.entryPanel--doors::after{content:none!important;display:none!important;}

.entryPanel--doors .entryActions.entryActions--doors,
.entryGate:not([hidden]) .entryActions.entryActions--doors,
.entryGate.entryGate--opening .entryActions.entryActions--doors{
  position:absolute!important;
  inset:0!important;
  width:100%!important;
  height:100%!important;
  display:grid!important;
  grid-template-columns:1fr 1fr!important;
  gap:0!important;
  overflow:visible!important;
  visibility:visible!important;
  opacity:1!important;
}

.entryPanel--doors .entryDoor{
  position:relative!important;
  display:grid!important;
  place-items:stretch!important;
  min-width:0!important;
  height:100%!important;
  padding:10px clamp(10px,3vw,18px) calc(9px + env(safe-area-inset-bottom))!important;
  box-sizing:border-box!important;
  visibility:visible!important;
  opacity:1!important;
  will-change:transform!important;
  background:radial-gradient(circle at 22px 22px,#c8b06e 0 4px,#2a2418 5px 9px,transparent 10px),repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,transparent 1px 9px),linear-gradient(180deg,#6c6144 0%,#27251c 22%,#11150e 58%,#5a5138 100%)!important;
  border:1px solid rgba(154,131,82,.74)!important;
  box-shadow:inset 0 0 0 2px rgba(0,0,0,.62),inset 0 12px 22px rgba(0,0,0,.55),0 -10px 30px rgba(0,0,0,.72)!important;
}
.entryPanel--doors .entryDoor--left{border-right:0!important;border-radius:var(--frame-radius) 0 0 0!important;}
.entryPanel--doors .entryDoor--right{border-left:0!important;border-radius:0 var(--frame-radius) 0 0!important;}
.entryPanel--doors .entryDoor>button{
  width:100%!important;
  height:100%!important;
  min-height:64px!important;
  display:grid!important;
  place-items:center!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  transform:none!important;
  animation:none!important;
}

.entryGate.entryGate--opening .entryDoor--left{
  animation:entryLeftDoorSlide var(--gate-speed,2.45s) steps(7,end) forwards!important;
}
.entryGate.entryGate--opening .entryDoor--right{
  animation:entryRightDoorSlide var(--gate-speed,2.45s) steps(7,end) forwards!important;
}
@keyframes entryLeftDoorSlide{
  0%{transform:translateX(0)}14%{transform:translateX(-4%)}18%{transform:translateX(-2%)}40%{transform:translateX(-42%)}47%{transform:translateX(-35%)}72%{transform:translateX(-82%)}100%{transform:translateX(-115%)}
}
@keyframes entryRightDoorSlide{
  0%{transform:translateX(0)}14%{transform:translateX(4%)}18%{transform:translateX(2%)}40%{transform:translateX(42%)}47%{transform:translateX(35%)}72%{transform:translateX(82%)}100%{transform:translateX(115%)}
}

body.scannerFullscreen .frameShellTop,
body.scannerFullscreen .frameShellBottom.pipDock{display:grid!important;visibility:visible!important;}
body.scannerFullscreen .app.frameShell{padding-top:calc(var(--frame-top-h) + 20px + env(safe-area-inset-top))!important;}
body.scannerFullscreen .frameRail{top:calc(var(--frame-top-h) + env(safe-area-inset-top) - 6px)!important;}

#entryAppVersion,.entryPanel #entryAppVersion,.entryPanel .entryAppVersion{display:none!important;visibility:hidden!important;}
@media(max-width:380px){
  .entryPanel.entryPanel--doors{bottom:calc(var(--nav-h,104px) + env(safe-area-inset-bottom) + 6px)!important;}
  .entryPanel--doors .entryDoor{padding-left:10px!important;padding-right:10px!important;}
  .entryPanel--doors .entryDoor>button{min-height:58px!important;font-size:12px!important;}
}
`;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/pipboy.css?v=366',
  './css/frame-core.css?v=ast0106',
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

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

const NETWORK_FIRST_ASSETS = new Set(['/','/index.html','/css/pipboy.css','/css/frame-core.css','/js/app.js']);

function normalizeAssetPath(requestUrl){
  const url=new URL(requestUrl);
  const scopePath=new URL(self.registration.scope).pathname.replace(/\/$/,'');
  const pathname=url.pathname.startsWith(scopePath)?url.pathname.slice(scopePath.length)||'/':url.pathname;
  return pathname.endsWith('/')?'/':pathname;
}
function isNetworkFirstRequest(request){return NETWORK_FIRST_ASSETS.has(normalizeAssetPath(request.url));}
function transformResponse(pathname,response){
  if(pathname==='/css/frame-core.css'){
    return response.text().then(css=>new Response(`${css}\n${ENTRY_PANEL_FIX_CSS}`,{
      status:response.status,
      statusText:response.statusText,
      headers:{'Content-Type':'text/css; charset=utf-8','Cache-Control':'no-cache'}
    }));
  }
  if(pathname==='/'||pathname==='/index.html'){
    return response.text().then(html=>new Response(html.replace(ENTRY_GATE_OLD,ENTRY_GATE_NEW),{
      status:response.status,
      statusText:response.statusText,
      headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}
    }));
  }
  return response;
}
async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached)return cached;
  try{
    const response=await fetch(request);
    const pathname=normalizeAssetPath(request.url);
    const finalResponse=await transformResponse(pathname,response.clone());
    const cache=await caches.open(CACHE_NAME);
    await cache.put(request,finalResponse.clone());
    return finalResponse;
  }catch(error){return caches.match('./index.html');}
}
async function networkFirst(request){
  const pathname=normalizeAssetPath(request.url);
  try{
    const response=await fetch(request);
    const finalResponse=await transformResponse(pathname,response.clone());
    const cache=await caches.open(CACHE_NAME);
    await cache.put(request,finalResponse.clone());
    return finalResponse;
  }catch(error){return caches.match(request,{ignoreSearch:true}).then(cached=>cached||caches.match('./index.html'));}
}
self.addEventListener('fetch', event => {
  if(event.request.method!=='GET')return;
  event.respondWith(isNetworkFirstRequest(event.request)?networkFirst(event.request):cacheFirst(event.request));
});
