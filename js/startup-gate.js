(function(){
  const FRAME_STYLESHEET='css/frame-system-v2.css?v=ast052';
  const RELEASE_STYLESHEET='css/ast-012-4.css?v=ast052';
  const HEADER_STYLESHEET='css/ast-013-2.css?v=ast052';
  const FRAME_MOTION_MS=2600;
  const SHUTTER_SLAT_ASPECT=122/797;
  const SHUTTER_COVERAGE_MARGIN=2;
  let awaitingGoogleAuth=false;

  function makeShutter(position){
    const shutter=document.createElement('div');
    shutter.className=`frameShutter frameShutter--${position}`;
    shutter.setAttribute('aria-hidden','true');
    const track=document.createElement('div');
    track.className='frameShutterTrack';
    const junction=document.createElement('img');
    junction.className='frameShutterJunction';
    junction.src='assets/frame/frame-shutter-junction.png';
    junction.alt='';

    const shellWidth=Math.min(window.innerWidth,430);
    const usableHeight=Math.max(0,window.innerHeight-
      (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--frame-top-h'))||118)-
      (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))||104));
    const slatHeight=Math.max(1,shellWidth*SHUTTER_SLAT_ASPECT);
    const slatCount=Math.max(3,Math.ceil((usableHeight/2)/slatHeight)+SHUTTER_COVERAGE_MARGIN);
    const slats=Array.from({length:slatCount},()=>{
      const slat=document.createElement('img');
      slat.className='frameShutterSlat';
      slat.src='assets/frame/frame-shutter-slat.png';
      slat.alt='';
      return slat;
    });
    track.append(...(position==='top'?[...slats,junction]:[junction,...slats]));
    shutter.appendChild(track);
    return shutter;
  }

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

    const top=makeShutter('top');
    const bottom=makeShutter('bottom');

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
