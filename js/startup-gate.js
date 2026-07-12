(function(){
  const FRAME_STYLESHEET='css/frame-system-v2.css?v=ast0111';
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

    return gate;
  }

  function showGate(gate){
    if(!gate||gate.classList.contains('frameStartup--opening'))return;
    gate.hidden=false;
    gate.style.display='block';
    gate.style.visibility='visible';
  }

  function markOpening(mode){
    const gate=document.getElementById('entryGate');
    if(!gate)return;
    gate.dataset.entryMode=mode||'offline';
    gate.dataset.userChoice='1';
    gate.classList.add('frameStartup--opening','entryGate--opening');
    document.body.classList.add('entryGateOpening');
    setTimeout(()=>document.body.classList.remove('entryGateOpening'),FRAME_MOTION_MS);
  }

  function prepare(){
    ensureStylesheet();
    const gate=buildFrameStartup();
    showGate(gate);

    /* app.js may auto-open the application when Google is already signed in.
       The startup gate remains mandatory until the user explicitly chooses
       Google or offline mode. Reassert visibility after app initialization. */
    [0,100,350,800].forEach(delay=>{
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
