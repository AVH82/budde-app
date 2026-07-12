(function(){
  const FRAME_STYLESHEET='css/frame-system-v2.css?v=astdiag001';
  const FRAME_MOTION_MS=2450;
  const LOG_PREFIX='[AST-DIAG-001]';

  function log(event,data){
    const payload={time:new Date().toISOString(),event,...(data||{})};
    console.log(LOG_PREFIX,payload);
    window.__BUDDE_STARTUP_DIAG__=window.__BUDDE_STARTUP_DIAG__||[];
    window.__BUDDE_STARTUP_DIAG__.push(payload);
    renderDiagnostic();
  }

  function snapshot(){
    const gate=document.getElementById('entryGate');
    const style=gate?getComputedStyle(gate):null;
    return {
      gateExists:!!gate,
      hiddenAttr:gate?.hidden??null,
      className:gate?.className||'',
      inlineDisplay:gate?.style.display||'',
      computedDisplay:style?.display||'',
      computedVisibility:style?.visibility||'',
      computedOpacity:style?.opacity||'',
      rect:gate?`${Math.round(gate.getBoundingClientRect().width)}x${Math.round(gate.getBoundingClientRect().height)}`:'—',
      topShutter:!!document.querySelector('.frameShutter--top'),
      bottomShutter:!!document.querySelector('.frameShutter--bottom'),
      controls:!!document.querySelector('.frameStartupControls'),
      googleButton:!!document.getElementById('entryGoogleButton'),
      offlineButton:!!document.getElementById('entryOfflineButton'),
      stylesheet:!!document.querySelector('link[data-frame-system="v2"]'),
      bodyEntryOpened:document.body?.dataset.entryOpened||'',
      readyState:document.readyState,
      swController:!!navigator.serviceWorker?.controller
    };
  }

  function ensureDiagnosticPanel(){
    let panel=document.getElementById('frameStartupDiagnostic');
    if(panel)return panel;
    panel=document.createElement('pre');
    panel.id='frameStartupDiagnostic';
    panel.setAttribute('aria-label','Diagnostic écran de démarrage');
    Object.assign(panel.style,{
      position:'fixed',left:'6px',top:'6px',zIndex:'2147483647',maxWidth:'calc(100vw - 12px)',
      maxHeight:'45vh',overflow:'auto',margin:'0',padding:'8px',font:'10px/1.35 monospace',
      color:'#bfff6a',background:'rgba(0,0,0,.92)',border:'1px solid #8dbb52',borderRadius:'6px',
      pointerEvents:'none',whiteSpace:'pre-wrap'
    });
    document.body.appendChild(panel);
    return panel;
  }

  function renderDiagnostic(){
    if(!document.body)return;
    const panel=ensureDiagnosticPanel();
    const state=snapshot();
    const events=(window.__BUDDE_STARTUP_DIAG__||[]).slice(-6).map(item=>`${item.time.slice(11,19)} ${item.event}`).join('\n');
    panel.textContent=`AST-DIAG-001\n${JSON.stringify(state,null,2)}\n\nDerniers événements:\n${events}`;
  }

  function ensureStylesheet(){
    if(document.querySelector('link[data-frame-system="v2"]')){log('stylesheet-already-present');return;}
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=FRAME_STYLESHEET;
    link.dataset.frameSystem='v2';
    link.addEventListener('load',()=>log('stylesheet-loaded',{href:link.href}));
    link.addEventListener('error',()=>log('stylesheet-error',{href:link.href}));
    document.head.appendChild(link);
    log('stylesheet-injected',{href:link.href});
  }

  function buildFrameStartup(){
    const gate=document.getElementById('entryGate');
    log('build-start',snapshot());
    if(!gate||gate.dataset.frameSystem==='v2')return gate;

    gate.dataset.frameSystem='v2';
    gate.classList.add('frameStartup');

    const panel=gate.querySelector('.entryPanel');
    if(panel)panel.classList.add('frameStartupMeta');

    const legacyActions=panel?.querySelector('.entryActions');
    const google=document.getElementById('entryGoogleButton');
    const offline=document.getElementById('entryOfflineButton');

    const topShutter=document.createElement('div');
    topShutter.className='frameShutter frameShutter--top';
    topShutter.setAttribute('aria-hidden','true');

    const bottomShutter=document.createElement('div');
    bottomShutter.className='frameShutter frameShutter--bottom';
    bottomShutter.setAttribute('aria-hidden','true');

    const controls=document.createElement('div');
    controls.className='frameStartupControls';
    controls.setAttribute('aria-label','Choix de connexion');

    const left=document.createElement('div');
    left.className='frameStartupChoice frameStartupChoice--left';
    const right=document.createElement('div');
    right.className='frameStartupChoice frameStartupChoice--right';

    if(google)left.appendChild(google);
    if(offline)right.appendChild(offline);
    controls.append(left,right);

    gate.prepend(topShutter,bottomShutter);
    gate.appendChild(controls);
    if(legacyActions)legacyActions.hidden=true;
    log('build-complete',snapshot());
    return gate;
  }

  function showGate(gate,source){
    if(!gate||gate.classList.contains('frameStartup--opening'))return;
    gate.hidden=false;
    gate.style.display='block';
    gate.style.visibility='visible';
    log('show-gate',{source,...snapshot()});
  }

  function markOpening(mode){
    const gate=document.getElementById('entryGate');
    if(!gate)return;
    gate.dataset.entryMode=mode||'offline';
    gate.dataset.userChoice='1';
    gate.classList.add('frameStartup--opening','entryGate--opening');
    document.body.classList.add('entryGateOpening');
    log('user-choice',{mode,...snapshot()});
    setTimeout(()=>document.body.classList.remove('entryGateOpening'),FRAME_MOTION_MS);
  }

  function observeGate(gate){
    if(!gate)return;
    const observer=new MutationObserver(mutations=>{
      mutations.forEach(m=>{
        if(m.type==='attributes')log('gate-attribute-changed',{attribute:m.attributeName,...snapshot()});
      });
    });
    observer.observe(gate,{attributes:true,attributeFilter:['hidden','class','style']});
    log('observer-active');
  }

  function prepare(){
    log('script-prepare-start');
    ensureStylesheet();
    const gate=buildFrameStartup();
    observeGate(gate);
    showGate(gate,'prepare');

    [0,100,350,800,1500,3000].forEach(delay=>{
      setTimeout(()=>{
        if(gate?.dataset.userChoice!=='1')showGate(gate,`reassert-${delay}`);
        else renderDiagnostic();
      },delay);
    });

    const google=document.getElementById('entryGoogleButton');
    const offline=document.getElementById('entryOfflineButton');
    if(offline)offline.addEventListener('click',()=>markOpening('offline'),{capture:true});
    if(google)google.addEventListener('click',()=>{
      const status=document.getElementById('entryGateStatus');
      if(status){status.textContent='ACCÈS ESPACE SÉCURISÉ.';status.dataset.entryStatus='ACCÈS ESPACE SÉCURISÉ.';}
      markOpening('google');
    },{capture:true});

    window.addEventListener('load',()=>log('window-load',snapshot()),{once:true});
    setTimeout(()=>log('final-snapshot-5s',snapshot()),5000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare,{once:true});
  else prepare();
})();
