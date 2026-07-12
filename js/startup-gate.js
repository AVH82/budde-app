(function(){
  const FRAME_STYLESHEET='css/frame-system-v2.css?v=ast0114';
  const FRAME_MOTION_MS=2450;

  function ensureStylesheet(){
    if(document.querySelector('link[data-frame-system="v2"]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=FRAME_STYLESHEET;
    link.dataset.frameSystem='v2';
    document.head.appendChild(link);
  }

  function buildFrameStartup(){
    const gate=document.getElementById('entryGate');
    if(!gate)return gate;
    if(gate.dataset.frameSystem==='v2')return gate;

    gate.dataset.frameSystem='v2';
    gate.classList.add('frameStartup');

    const panel=gate.querySelector('.entryPanel');
    if(panel)panel.classList.add('frameStartupMeta');

    const legacyActions=panel?.querySelector('.entryActions');
    const google=document.getElementById('entryGoogleButton');
    const offline=document.getElementById('entryOfflineButton');

    const top=document.createElement('div');
    top.className='frameShutter frameShutter--top';
    top.setAttribute('aria-hidden','true');

    const bottom=document.createElement('div');
    bottom.className='frameShutter frameShutter--bottom';
    bottom.setAttribute('aria-hidden','true');

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

    gate.prepend(top,bottom);
    document.body.appendChild(controls);
    if(legacyActions)legacyActions.hidden=true;

    return gate;
  }

  function getControls(){
    return document.querySelector('.frameStartupControls');
  }

  function showGate(gate){
    if(!gate||gate.classList.contains('frameStartup--opening'))return;
    gate.hidden=false;
    gate.style.display='block';
    gate.style.visibility='visible';
    const controls=getControls();
    if(controls){
      controls.hidden=false;
      controls.classList.remove('frameStartupControls--opening');
    }
  }

  function markOpening(mode){
    const gate=document.getElementById('entryGate');
    if(!gate)return;
    const controls=getControls();
    gate.dataset.entryMode=mode||'offline';
    gate.dataset.userChoice='1';
    gate.classList.add('frameStartup--opening','entryGate--opening');
    controls?.classList.add('frameStartupControls--opening');
    document.body.classList.add('entryGateOpening');
    setTimeout(()=>{
      document.body.classList.remove('entryGateOpening');
      if(controls)controls.hidden=true;
    },FRAME_MOTION_MS);
  }

  function prepare(){
    ensureStylesheet();
    const gate=buildFrameStartup();
    showGate(gate);

    [0,100,350,800,1500,3000].forEach(delay=>{
      setTimeout(()=>{
        if(gate?.dataset.userChoice!=='1')showGate(gate);
      },delay);
    });

    const google=document.getElementById('entryGoogleButton');
    const offline=document.getElementById('entryOfflineButton');

    if(offline)offline.addEventListener('click',()=>markOpening('offline'),{capture:true});
    if(google)google.addEventListener('click',()=>{
      const status=document.getElementById('entryGateStatus');
      if(status){
        status.textContent='ACCÈS ESPACE SÉCURISÉ.';
        status.dataset.entryStatus='ACCÈS ESPACE SÉCURISÉ.';
      }
      markOpening('google');
    },{capture:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare,{once:true});
  else prepare();
})();
