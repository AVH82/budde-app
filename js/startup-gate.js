(function(){
  const FRAME_STYLESHEET='css/frame-system-v2.css?v=ast050';
  const RELEASE_STYLESHEET='css/ast-012-4.css?v=ast050';
  const HEADER_STYLESHEET='css/ast-013-2.css?v=ast050';
  const FRAME_MOTION_MS=2600;
  let awaitingGoogleAuth=false;

  function ensureStylesheet(){
    if(!document.querySelector('link[data-frame-system="v2"]')){
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href=FRAME_STYLESHEET;
      link.dataset.frameSystem='v2';
      document.head.appendChild(link);
    }
    if(!document.querySelector('link[data-release-fix="ast0124"]')){
      const releaseLink=document.createElement('link');
      releaseLink.rel='stylesheet';
      releaseLink.href=RELEASE_STYLESHEET;
      releaseLink.dataset.releaseFix='ast0124';
      document.head.appendChild(releaseLink);
    }
    if(!document.querySelector('link[data-header-fix="ast019-buddy-panel"]')){
      const headerLink=document.createElement('link');
      headerLink.rel='stylesheet';
      headerLink.href=HEADER_STYLESHEET;
      headerLink.dataset.headerFix='ast019-buddy-panel';
      document.head.appendChild(headerLink);
    }
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

  function showBuddyStatus(message,state='neutral'){
    const legacyStatus=document.getElementById('entryGateStatus');
    if(legacyStatus){
      legacyStatus.textContent='';
      delete legacyStatus.dataset.entryStatus;
    }
    if(window.Buddy?.show){
      window.Buddy.show(state,{target:'#buddyHeader',message});
      return;
    }
    const target=document.getElementById('buddyHeader');
    const text=target?.querySelector('.buddyBubble p');
    if(text)text.textContent=message;
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
    if(!gate||gate.classList.contains('frameStartup--opening'))return;
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

    if(offline)offline.addEventListener('click',()=>{
      awaitingGoogleAuth=false;
      showBuddyStatus('MODE HORS LIGNE ACTIVÉ.');
      markOpening('offline');
    },{capture:true});

    if(google)google.addEventListener('click',()=>{
      awaitingGoogleAuth=true;
      showBuddyStatus('CONNEXION SÉCURISÉE...','thinking');
    },{capture:true});

    if(window.GoogleAuthService?.onChange){
      window.GoogleAuthService.onChange(status=>{
        if(!awaitingGoogleAuth||!status?.signedIn)return;
        awaitingGoogleAuth=false;
        showBuddyStatus('ESPACE SÉCURISÉ OUVERT.','success');
        markOpening('google');
      });
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare,{once:true});
  else prepare();
})();