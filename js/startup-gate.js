(function(){
  const FRAME_STYLESHEET='css/frame-system-v2.css?v=ast058';
  const RELEASE_STYLESHEET='css/ast-012-4.css?v=ast058';
  const HEADER_STYLESHEET='css/ast-013-2.css?v=ast058';
  const ACCESS_COLLAPSE_MS=420;
  const ACCESS_REDUCED_COLLAPSE_MS=100;
  const ACCESS_PRESS_DELAY_MS=500;
  const ACCESS_POST_COLLAPSE_MS=160;
  const SHUTTER_OPEN_MS=2600;
  const SHUTTER_REDUCED_OPEN_MS=120;
  const SHUTTER_FALLBACK_MARGIN_MS=220;
  const SHUTTER_SLAT_ASPECT=122/797;
  const SHUTTER_COVERAGE_MARGIN=2;
  let awaitingGoogleAuth=false;

  function configureSystemChrome(){
    let theme=document.querySelector('meta[name="theme-color"]');
    if(!theme){theme=document.createElement('meta');theme.name='theme-color';document.head.appendChild(theme);}
    theme.content='#000000';
    let status=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if(!status){status=document.createElement('meta');status.name='apple-mobile-web-app-status-bar-style';document.head.appendChild(status);}
    status.content='black';
    document.documentElement.style.backgroundColor='#000';
  }

  function injectStartupModeStyles(){
    if(document.getElementById('startupModeCollapseStyles'))return;
    const style=document.createElement('style');
    style.id='startupModeCollapseStyles';
    style.textContent=`
      .frameStartupControls{
        position:fixed!important;
        left:50%!important;
        bottom:calc(var(--nav-h) + 4px)!important;
        width:var(--frame-shell-w)!important;
        height:clamp(62px,17vw,78px)!important;
        transform:translateX(-50%)!important;
        overflow:visible!important;
        background:transparent!important;
      }
      .startupAccessScene,.startupAccessRotor,.startupAccessFace{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;}
      .startupAccessScene{perspective:none!important;}
      .startupAccessRotor{
        transform:none!important;
        transform-origin:center bottom!important;
        transition:transform ${ACCESS_COLLAPSE_MS}ms cubic-bezier(.4,0,1,1),opacity ${ACCESS_COLLAPSE_MS}ms linear!important;
      }
      .startupAccessRotor.is-open{transform:translateY(calc(100% + 24px)) scale(.96)!important;opacity:0!important;}
      .startupAccessFace--front{overflow:visible!important;background:transparent!important;}
      .startupAccessFace--back,.startupAccessPanel{display:none!important;}
      .startupAccessChoices{
        position:absolute!important;
        inset:0 clamp(12px,4vw,24px)!important;
        width:auto!important;
        max-width:none!important;
        transform:none!important;
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:clamp(8px,2.5vw,16px)!important;
      }
      .frameStartupChoice{height:100%!important;}
      .frameStartupChoice::before{display:none!important;}
      .frameStartupChoice>button{filter:brightness(1.08) drop-shadow(0 0 5px rgba(157,255,69,.48))!important;}
      .startupModePending .startupAccessGlow{
        opacity:.82!important;
        animation:startupModeFlicker 1350ms steps(2,end) infinite!important;
        filter:blur(7px)!important;
        box-shadow:0 0 16px rgba(157,255,69,.92),0 0 34px rgba(157,255,69,.62),inset 0 0 20px rgba(215,255,164,.9)!important;
      }
      .frameStartupControls--selected-network .startupAccessGlow--network,
      .frameStartupControls--selected-local .startupAccessGlow--local{opacity:1!important;animation-duration:620ms!important;}
      @keyframes startupModeFlicker{0%,13%,18%,46%,52%,78%,100%{opacity:.9}15%,49%,80%{opacity:.55}16%,50%{opacity:1}}

      .startupModePending .frameShellBottom .nav button,
      .startupModePending .frameShellBottom .dockActions button{
        filter:grayscale(1) brightness(.22)!important;
        opacity:.5!important;
        box-shadow:none!important;
        text-shadow:none!important;
      }
      .startupModePending .frameShellBottom .nav button::before,
      .startupModePending .frameShellBottom .nav button::after,
      .startupModePending .frameShellBottom .dockActions button::before,
      .startupModePending .frameShellBottom .dockActions button::after{opacity:0!important;box-shadow:none!important;}

      .startupModeActivating .frameShellBottom .nav button[data-view="home"],
      .startupModeActivating .frameShellBottom .dockActions button{
        opacity:1!important;
        filter:brightness(1.18) drop-shadow(0 0 7px rgba(157,255,69,.78))!important;
        animation:startupDockIgnition 720ms steps(2,end) 2!important;
      }
      .startupModeActivating .frameShellBottom .nav button:not([data-view="home"]){filter:grayscale(1) brightness(.28)!important;opacity:.58!important;}
      @keyframes startupDockIgnition{0%,22%,47%,72%,100%{opacity:1}12%,35%,61%,84%{opacity:.38}}

      @media(prefers-reduced-motion:reduce){
        .startupAccessRotor{transition-duration:${ACCESS_REDUCED_COLLAPSE_MS}ms!important;}
        .startupModePending .startupAccessGlow,
        .startupModeActivating .frameShellBottom .nav button[data-view="home"],
        .startupModeActivating .frameShellBottom .dockActions button{animation:none!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function setDockStartupState(active){
    document.body.classList.toggle('startupModePending',active);
    if(active){
      document.querySelectorAll('.frameShellBottom .nav button[data-view]').forEach(button=>{
        button.classList.remove('active');
        button.removeAttribute('aria-current');
      });
    }
  }

  function activateOperationalDock(){
    document.querySelectorAll('.frameShellBottom .nav button[data-view]').forEach(button=>{
      const isHome=button.dataset.view==='home';
      button.classList.toggle('active',isHome);
      if(isHome)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
  }

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
      const link=document.createElement('link');link.rel='stylesheet';link.href=FRAME_STYLESHEET;link.dataset.frameSystem='v2';document.head.appendChild(link);
    }
    if(!document.querySelector('link[data-release-fix="ast0124"]')){
      const link=document.createElement('link');link.rel='stylesheet';link.href=RELEASE_STYLESHEET;link.dataset.releaseFix='ast0124';document.head.appendChild(link);
    }
    if(!document.querySelector('link[data-header-fix="ast019-buddy-panel"]')){
      const link=document.createElement('link');link.rel='stylesheet';link.href=HEADER_STYLESHEET;link.dataset.headerFix='ast019-buddy-panel';document.head.appendChild(link);
    }
    injectStartupModeStyles();
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
    const scene=document.createElement('div');scene.className='startupAccessScene';
    const rotor=document.createElement('div');rotor.className='startupAccessRotor';
    const front=document.createElement('section');front.className='startupAccessFace startupAccessFace--front';
    const back=document.createElement('section');back.className='startupAccessFace startupAccessFace--back';back.setAttribute('aria-hidden','true');
    const choices=document.createElement('div');choices.className='startupAccessChoices';
    const glowNetwork=document.createElement('span');glowNetwork.className='startupAccessGlow startupAccessGlow--network';glowNetwork.setAttribute('aria-hidden','true');
    const glowLocal=document.createElement('span');glowLocal.className='startupAccessGlow startupAccessGlow--local';glowLocal.setAttribute('aria-hidden','true');
    const left=document.createElement('div');left.className='frameStartupChoice frameStartupChoice--network';
    const right=document.createElement('div');right.className='frameStartupChoice frameStartupChoice--local';
    if(google){google.className='frameStartupChoiceButton';google.setAttribute('aria-label','NETWORK MODE — cloud synchronization');google.replaceChildren();left.appendChild(google);}
    if(offline){offline.className='frameStartupChoiceButton';offline.setAttribute('aria-label','LOCAL MODE — device storage');offline.replaceChildren();right.appendChild(offline);}
    choices.append(glowNetwork,glowLocal,left,right);
    front.append(choices);rotor.append(front,back);scene.appendChild(rotor);controls.appendChild(scene);
    gate.prepend(top,bottom);document.body.appendChild(controls);
    if(legacyActions)legacyActions.hidden=true;
    setDockStartupState(true);
    return gate;
  }

  function getControls(){return document.querySelector('.frameStartupControls');}

  function showBuddyStatus(message,state='neutral'){
    const legacyStatus=document.getElementById('entryGateStatus');
    if(legacyStatus){legacyStatus.textContent='';delete legacyStatus.dataset.entryStatus;}
    if(window.Buddy?.show){window.Buddy.show(state,{target:'#buddyHeader',message});return;}
    const text=document.getElementById('buddyHeader')?.querySelector('.buddyBubble p');
    if(text)text.textContent=message;
  }

  function showGate(gate){
    if(!gate||gate.classList.contains('frameStartup--opening'))return;
    gate.hidden=false;gate.style.display='block';gate.style.visibility='visible';
    setDockStartupState(true);
    document.body.classList.remove('startupModeActivating','entryGateOpening');
    const controls=getControls();
    if(controls){
      controls.hidden=false;
      controls.classList.remove('frameStartupControls--opening','frameStartupControls--selected-network','frameStartupControls--selected-local');
      controls.querySelector('.startupAccessRotor')?.classList.remove('is-open');
      controls.querySelectorAll('button').forEach(button=>{button.disabled=false;});
    }
  }

  function markOpening(mode){
    const gate=document.getElementById('entryGate');
    if(!gate||gate.dataset.openingSequence==='1')return;
    const controls=getControls();
    const rotor=controls?.querySelector('.startupAccessRotor');
    if(!rotor)return;
    gate.dataset.entryMode=mode||'offline';
    gate.dataset.userChoice='1';
    gate.dataset.openingSequence='1';
    controls.classList.add('frameStartupControls--opening');
    controls.querySelectorAll('button').forEach(button=>{button.disabled=true;});
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const collapseDuration=reducedMotion?ACCESS_REDUCED_COLLAPSE_MS:ACCESS_COLLAPSE_MS;
    const shutterDuration=reducedMotion?SHUTTER_REDUCED_OPEN_MS:SHUTTER_OPEN_MS;

    const finishOpening=()=>{
      document.body.classList.remove('entryGateOpening','startupModePending','startupModeActivating');
      gate.hidden=true;
      gate.classList.remove('frameStartup--opening','entryGate--opening');
      delete gate.dataset.openingSequence;
      activateOperationalDock();
    };

    const openShutters=()=>{
      controls.hidden=true;
      setDockStartupState(false);
      activateOperationalDock();
      document.body.classList.add('entryGateOpening','startupModeActivating');
      gate.classList.add('frameStartup--opening','entryGate--opening');
      setTimeout(finishOpening,shutterDuration+SHUTTER_FALLBACK_MARGIN_MS);
    };

    setTimeout(()=>{
      rotor.classList.add('is-open');
      setTimeout(openShutters,collapseDuration+ACCESS_POST_COLLAPSE_MS);
    },reducedMotion?0:ACCESS_PRESS_DELAY_MS);
  }

  function prepare(){
    configureSystemChrome();
    ensureStylesheet();
    const gate=buildFrameStartup();
    showGate(gate);
    [0,100,350,800,1500,3000].forEach(delay=>{setTimeout(()=>{if(gate?.dataset.userChoice!=='1')showGate(gate);},delay);});
    const google=document.getElementById('entryGoogleButton');
    const offline=document.getElementById('entryOfflineButton');
    if(offline)offline.addEventListener('click',()=>{
      awaitingGoogleAuth=false;
      getControls()?.classList.add('frameStartupControls--selected-local');
      showBuddyStatus('MODE HORS LIGNE ACTIVÉ.');
      markOpening('offline');
    },{capture:true});
    if(google)google.addEventListener('click',()=>{
      awaitingGoogleAuth=true;
      const controls=getControls();
      controls?.classList.remove('frameStartupControls--selected-local');
      controls?.classList.add('frameStartupControls--selected-network');
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