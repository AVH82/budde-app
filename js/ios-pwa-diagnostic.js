(()=>{
  'use strict';

  const PARAMETER='ios-diagnostic';
  const STORAGE_KEY='budde-ios-diagnostic';
  const parameterValue=new URLSearchParams(location.search).get(PARAMETER);

  if(parameterValue==='1')localStorage.setItem(STORAGE_KEY,'1');
  if(parameterValue==='0')localStorage.removeItem(STORAGE_KEY);

  const isEnabled=()=>localStorage.getItem(STORAGE_KEY)==='1';
  const setEnabled=enabled=>{
    if(enabled)localStorage.setItem(STORAGE_KEY,'1');
    else localStorage.removeItem(STORAGE_KEY);
    location.reload();
  };

  function installSettingsToggle(){
    if(document.getElementById('iosPwaDiagnosticToggle'))return;
    const anchor=document.getElementById('diagnosticExpectedCache');
    if(!anchor)return;

    const button=document.createElement('button');
    button.id='iosPwaDiagnosticToggle';
    button.type='button';
    button.textContent=isEnabled()?'DÉSACTIVER DIAGNOSTIC IOS':'ACTIVER DIAGNOSTIC IOS';
    button.setAttribute('aria-pressed',String(isEnabled()));
    Object.assign(button.style,{display:'block',width:'100%',margin:'14px 0 0',padding:'12px',border:'1px solid #9dff45',borderRadius:'10px',background:'rgba(0,0,0,.72)',color:'#b9ff55',font:'inherit',letterSpacing:'.08em'});
    button.addEventListener('click',()=>setEnabled(!isEnabled()));

    const row=anchor.closest('.systemRow,.diagnosticRow,.settingsRow')||anchor.parentElement||anchor;
    row.insertAdjacentElement('afterend',button);
  }

  const installToggleWhenReady=()=>{
    installSettingsToggle();
    if(!document.getElementById('iosPwaDiagnosticToggle')){
      const observer=new MutationObserver(()=>{
        installSettingsToggle();
        if(document.getElementById('iosPwaDiagnosticToggle'))observer.disconnect();
      });
      observer.observe(document.documentElement,{childList:true,subtree:true});
    }
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installToggleWhenReady,{once:true});
  else installToggleWhenReady();

  if(!isEnabled())return;

  const computedProperties=['position','overflow','overflow-y','transform','height','min-height','max-height','top','bottom','left','right','display'];
  const targets={
    frameShell:'.app.frameShell',
    dock:'.frameShellBottom.pipDock',
    startupPanel:'.startupAccessPanel',
    networkPanel:'.frameStartupChoice--network',
    localPanel:'.frameStartupChoice--local'
  };

  const round=value=>typeof value==='number'?Math.round(value*100)/100:value;
  const rectangle=element=>{
    if(!element)return null;
    const rect=element.getBoundingClientRect();
    return {top:round(rect.top),bottom:round(rect.bottom),height:round(rect.height),width:round(rect.width)};
  };
  const computed=element=>{
    if(!element)return null;
    const style=getComputedStyle(element);
    return Object.fromEntries(computedProperties.map(property=>[property,style.getPropertyValue(property)]));
  };
  const media=query=>matchMedia(query).matches;
  const stylesheetInventory=()=>[...document.querySelectorAll('link[rel~="stylesheet"]')].map((link,index)=>{
    const url=new URL(link.href,location.href);
    const sheet=[...document.styleSheets].find(candidate=>candidate.href===link.href);
    return {order:index+1,url:url.href,version:url.searchParams.get('v')||'',loaded:Boolean(sheet),disabled:Boolean(sheet?.disabled)};
  });
  const resourceInventory=()=>performance.getEntriesByType('resource').map(entry=>({
    url:entry.name,
    initiatorType:entry.initiatorType,
    deliveryType:entry.deliveryType||'unreported',
    transferSize:entry.transferSize,
    encodedBodySize:entry.encodedBodySize
  }));
  async function serviceWorkerInventory(){
    const result={supported:'serviceWorker' in navigator,controller:null,registration:null,caches:[],resources:resourceInventory()};
    if(!result.supported)return result;
    const controller=navigator.serviceWorker.controller;
    result.controller=controller?{scriptURL:controller.scriptURL,state:controller.state}:null;
    const registration=await navigator.serviceWorker.getRegistration();
    result.registration=registration?{
      scope:registration.scope,
      active:registration.active&&{scriptURL:registration.active.scriptURL,state:registration.active.state},
      waiting:registration.waiting&&{scriptURL:registration.waiting.scriptURL,state:registration.waiting.state},
      installing:registration.installing&&{scriptURL:registration.installing.scriptURL,state:registration.installing.state}
    }:null;
    if('caches' in window){
      for(const name of await caches.keys()){
        const cache=await caches.open(name);
        const requests=await cache.keys();
        result.caches.push({name,resources:requests.map(request=>request.url)});
      }
    }
    return result;
  }
  async function snapshot(){
    const elements=Object.fromEntries(Object.entries(targets).map(([name,selector])=>[name,document.querySelector(selector)]));
    return {
      capturedAt:new Date().toISOString(),
      location:location.href,
      userAgent:navigator.userAgent,
      diagnosticActivation:{parameter:parameterValue,persistent:isEnabled(),storageKey:STORAGE_KEY},
      viewport:{
        innerHeight:window.innerHeight,
        outerHeight:window.outerHeight,
        visualViewportHeight:window.visualViewport?.height??null,
        visualViewportOffsetTop:window.visualViewport?.offsetTop??null,
        visualViewportOffsetLeft:window.visualViewport?.offsetLeft??null,
        documentElementClientHeight:document.documentElement.clientHeight,
        bodyClientHeight:document.body.clientHeight,
        screenHeight:screen.height,
        screenAvailHeight:screen.availHeight
      },
      frameSystem:Object.fromEntries(Object.entries(elements).map(([name,element])=>[name,{selector:targets[name],found:Boolean(element),rect:rectangle(element)}])),
      computedStyles:Object.fromEntries(['frameShell','dock','startupPanel'].map(name=>[name,computed(elements[name])])),
      stylesheets:stylesheetInventory(),
      serviceWorker:await serviceWorkerInventory(),
      displayMode:{
        browser:media('(display-mode: browser)'),
        safari:media('(display-mode: browser)')&&/Safari/.test(navigator.userAgent)&&!/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent),
        standalone:media('(display-mode: standalone)')||navigator.standalone===true,
        fullscreen:media('(display-mode: fullscreen)'),
        minimalUi:media('(display-mode: minimal-ui)'),
        navigatorStandalone:navigator.standalone??null
      }
    };
  }
  function render(data){
    let output=document.getElementById('iosPwaDiagnosticOutput');
    if(!output){
      output=document.createElement('pre');
      output.id='iosPwaDiagnosticOutput';
      output.setAttribute('role','status');
      output.setAttribute('aria-live','polite');
      Object.assign(output.style,{position:'fixed',inset:'8px',zIndex:'2147483647',margin:'0',padding:'48px 12px 12px',overflow:'auto',whiteSpace:'pre-wrap',wordBreak:'break-word',background:'rgba(0,0,0,.94)',color:'#b9ff55',font:'11px/1.4 ui-monospace,monospace'});

      const disableButton=document.createElement('button');
      disableButton.type='button';
      disableButton.textContent='DÉSACTIVER';
      Object.assign(disableButton.style,{position:'fixed',top:'16px',right:'16px',zIndex:'2147483647',padding:'8px 10px',border:'1px solid #9dff45',borderRadius:'8px',background:'#101510',color:'#b9ff55',font:'12px ui-monospace,monospace'});
      disableButton.addEventListener('click',()=>setEnabled(false));

      document.body.append(output,disableButton);
    }
    output.textContent=JSON.stringify(data,null,2);
    console.info('[Budd€ iOS PWA diagnostic]',data);
    window.__BUDDE_IOS_PWA_DIAGNOSTIC__=data;
  }

  let refreshInFlight=false;
  let refreshQueued=false;
  async function refresh(){
    if(refreshInFlight){
      refreshQueued=true;
      return;
    }
    refreshInFlight=true;
    try{
      render(await snapshot());
    }finally{
      refreshInFlight=false;
      if(refreshQueued){
        refreshQueued=false;
        void refresh();
      }
    }
  }

  addEventListener('load',refresh,{once:true});
  addEventListener('resize',refresh);
  window.visualViewport?.addEventListener('resize',refresh);
  window.visualViewport?.addEventListener('scroll',refresh);
})();