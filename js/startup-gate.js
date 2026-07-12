(function(){
  const FRAME_STYLESHEET='css/frame-system-v2.css?v=astdiag002';
  const FRAME_MOTION_MS=2450;
  const LOG_PREFIX='[AST-DIAG-002]';

  function log(event,data){
    const payload={time:new Date().toISOString(),event,...(data||{})};
    console.log(LOG_PREFIX,payload);
    window.__BUDDE_STARTUP_DIAG__=window.__BUDDE_STARTUP_DIAG__||[];
    window.__BUDDE_STARTUP_DIAG__.push(payload);
    renderDiagnostic();
  }

  function describeElement(el){
    if(!el)return null;
    const s=getComputedStyle(el);
    const r=el.getBoundingClientRect();
    return {
      tag:el.tagName?.toLowerCase()||'',
      id:el.id||'',
      className:typeof el.className==='string'?el.className:'',
      position:s.position,
      zIndex:s.zIndex,
      display:s.display,
      visibility:s.visibility,
      opacity:s.opacity,
      overflow:`${s.overflow}/${s.overflowX}/${s.overflowY}`,
      transform:s.transform,
      isolation:s.isolation,
      contain:s.contain,
      rect:`${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`
    };
  }

  function ancestorChain(el){
    const rows=[];
    let current=el;
    while(current&&rows.length<8){
      rows.push(describeElement(current));
      current=current.parentElement;
    }
    return rows;
  }

  function pointStack(x,y){
    const elements=document.elementsFromPoint?document.elementsFromPoint(x,y):[document.elementFromPoint(x,y)].filter(Boolean);
    return elements.slice(0,8).map(el=>({tag:el.tagName?.toLowerCase()||'',id:el.id||'',className:typeof el.className==='string'?el.className:''}));
  }

  function snapshot(){
    const gate=document.getElementById('entryGate');
    const top=document.querySelector('.frameShutter--top');
    const bottom=document.querySelector('.frameShutter--bottom');
    const controls=document.querySelector('.frameStartupControls');
    const vw=window.innerWidth;
    const vh=window.innerHeight;
    return {
      gate:describeElement(gate),
      topShutter:describeElement(top),
      bottomShutter:describeElement(bottom),
      controls:describeElement(controls),
      ancestry:ancestorChain(gate),
      stackCenter:pointStack(Math.round(vw/2),Math.round(vh/2)),
      stackBottom:pointStack(Math.round(vw/2),Math.max(0,vh-150)),
      stylesheet:!!document.querySelector('link[data-frame-system="v2"]'),
      readyState:document.readyState,
      swController:!!navigator.serviceWorker?.controller
    };
  }

  function ensureDiagnosticPanel(){
    let panel=document.getElementById('frameStartupDiagnostic');
    if(panel)return panel;
    panel=document.createElement('pre');
    panel.id='frameStartupDiagnostic';
    panel.setAttribute('aria-label','Diagnostic empilement écran de démarrage');
    Object.assign(panel.style,{position:'fixed',left:'6px',top:'6px',zIndex:'2147483647',width:'min(94vw,520px)',maxHeight:'58vh',overflow:'auto',margin:'0',padding:'8px',font:'9px/1.3 monospace',color:'#bfff6a',background:'rgba(0,0,0,.94)',border:'1px solid #8dbb52',borderRadius:'6px',pointerEvents:'none',whiteSpace:'pre-wrap'});
    document.body.appendChild(panel);
    return panel;
  }

  function compactElement(label,value){
    if(!value)return `${label}: —`;
    return `${label}: ${value.tag}#${value.id}.${value.className}\n  pos=${value.position} z=${value.zIndex} display=${value.display} vis=${value.visibility} op=${value.opacity}\n  overflow=${value.overflow} transform=${value.transform} isolation=${value.isolation} contain=${value.contain}\n  rect=${value.rect}`;
  }

  function renderDiagnostic(){
    if(!document.body)return;
    const panel=ensureDiagnosticPanel();
    const state=snapshot();
    const chain=(state.ancestry||[]).map((v,i)=>`${i}: ${v.tag}#${v.id}.${v.className} z=${v.zIndex} pos=${v.position} ov=${v.overflow} tr=${v.transform} iso=${v.isolation} rect=${v.rect}`).join('\n');
    const center=state.stackCenter.map((v,i)=>`${i}: ${v.tag}#${v.id}.${v.className}`).join('\n');
    const bottom=state.stackBottom.map((v,i)=>`${i}: ${v.tag}#${v.id}.${v.className}`).join('\n');
    const events=(window.__BUDDE_STARTUP_DIAG__||[]).slice(-5).map(item=>`${item.time.slice(11,19)} ${item.event}`).join('\n');
    panel.textContent=`AST-DIAG-002\n\n${compactElement('GATE',state.gate)}\n\n${compactElement('TOP',state.topShutter)}\n\n${compactElement('BOTTOM',state.bottomShutter)}\n\n${compactElement('CONTROLS',state.controls)}\n\nANCESTORS\n${chain}\n\nSTACK CENTER\n${center}\n\nSTACK BOTTOM\n${bottom}\n\nstylesheet=${state.stylesheet} ready=${state.readyState} sw=${state.swController}\n\nEVENTS\n${events}`;
  }

  function ensureStylesheet(){
    const existing=document.querySelector('link[data-frame-system="v2"]');
    if(existing){log('stylesheet-already-present',{href:existing.href});return;}
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=FRAME_STYLESHEET;link.dataset.frameSystem='v2';
    link.addEventListener('load',()=>log('stylesheet-loaded',{href:link.href}));
    link.addEventListener('error',()=>log('stylesheet-error',{href:link.href}));
    document.head.appendChild(link);
    log('stylesheet-injected',{href:link.href});
  }

  function buildFrameStartup(){
    const gate=document.getElementById('entryGate');
    if(!gate||gate.dataset.frameSystem==='v2')return gate;
    gate.dataset.frameSystem='v2';gate.classList.add('frameStartup');
    const panel=gate.querySelector('.entryPanel');if(panel)panel.classList.add('frameStartupMeta');
    const legacyActions=panel?.querySelector('.entryActions');
    const google=document.getElementById('entryGoogleButton');const offline=document.getElementById('entryOfflineButton');
    const top=document.createElement('div');top.className='frameShutter frameShutter--top';top.setAttribute('aria-hidden','true');
    const bottom=document.createElement('div');bottom.className='frameShutter frameShutter--bottom';bottom.setAttribute('aria-hidden','true');
    const controls=document.createElement('div');controls.className='frameStartupControls';controls.setAttribute('aria-label','Choix de connexion');
    const left=document.createElement('div');left.className='frameStartupChoice frameStartupChoice--left';
    const right=document.createElement('div');right.className='frameStartupChoice frameStartupChoice--right';
    if(google)left.appendChild(google);if(offline)right.appendChild(offline);controls.append(left,right);
    gate.prepend(top,bottom);gate.appendChild(controls);if(legacyActions)legacyActions.hidden=true;
    log('build-complete');return gate;
  }

  function showGate(gate,source){
    if(!gate||gate.classList.contains('frameStartup--opening'))return;
    gate.hidden=false;gate.style.display='block';gate.style.visibility='visible';log('show-gate',{source});
  }

  function markOpening(mode){
    const gate=document.getElementById('entryGate');if(!gate)return;
    gate.dataset.entryMode=mode||'offline';gate.dataset.userChoice='1';gate.classList.add('frameStartup--opening','entryGate--opening');
    document.body.classList.add('entryGateOpening');log('user-choice',{mode});
    setTimeout(()=>document.body.classList.remove('entryGateOpening'),FRAME_MOTION_MS);
  }

  function prepare(){
    ensureStylesheet();
    const gate=buildFrameStartup();showGate(gate,'prepare');
    [0,100,350,800,1500,3000].forEach(delay=>setTimeout(()=>{if(gate?.dataset.userChoice!=='1')showGate(gate,`reassert-${delay}`);else renderDiagnostic();},delay));
    const google=document.getElementById('entryGoogleButton');const offline=document.getElementById('entryOfflineButton');
    if(offline)offline.addEventListener('click',()=>markOpening('offline'),{capture:true});
    if(google)google.addEventListener('click',()=>{const status=document.getElementById('entryGateStatus');if(status){status.textContent='ACCÈS ESPACE SÉCURISÉ.';status.dataset.entryStatus='ACCÈS ESPACE SÉCURISÉ.';}markOpening('google');},{capture:true});
    window.addEventListener('resize',()=>{log('window-resize');renderDiagnostic();});
    window.addEventListener('load',()=>log('window-load'),{once:true});
    setInterval(renderDiagnostic,1000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare,{once:true});else prepare();
})();