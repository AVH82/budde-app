(function(){
  'use strict';

  const FRAME_STYLESHEET='css/frame-system-v2.css?v=ast058';
  const RELEASE_STYLESHEET='css/ast-012-4.css?v=ast058';
  const HEADER_STYLESHEET='css/ast-013-2.css?v=ast058';
  const SHUTTER_SLAT_ASPECT=122/797;
  const SHUTTER_COVERAGE_MARGIN=5;

  function configureSystemChrome(){
    let theme=document.querySelector('meta[name="theme-color"]');
    if(!theme){
      theme=document.createElement('meta');
      theme.name='theme-color';
      document.head.appendChild(theme);
    }
    theme.content='#000000';

    let status=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if(!status){
      status=document.createElement('meta');
      status.name='apple-mobile-web-app-status-bar-style';
      document.head.appendChild(status);
    }
    status.content='black-translucent';
    document.documentElement.style.backgroundColor='#000';
  }

  function injectStartupStateStyles(){
    if(document.getElementById('startupModeStateStyles'))return;
    const style=document.createElement('style');
    style.id='startupModeStateStyles';
    style.textContent=`
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
        .startupModePending .startupAccessGlow,
        .startupModeActivating .frameShellBottom .nav button[data-view="home"],
        .startupModeActivating .frameShellBottom .dockActions button{animation:none!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function setDockStartupState(active){
    document.body.classList.toggle('startupModePending',active);
    if(!active)return;
    document.querySelectorAll('.frameShellBottom .nav button[data-view]').forEach(button=>{
      button.classList.remove('active');
      button.removeAttribute('aria-current');
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
    const rootStyle=getComputedStyle(document.documentElement);
    const usableHeight=Math.max(0,window.innerHeight-
      (parseFloat(rootStyle.getPropertyValue('--frame-top-h'))||118)-
      (parseFloat(rootStyle.getPropertyValue('--dock-total-height'))||148));
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

  function ensureStylesheet(selector,href,datasetName,datasetValue){
    if(document.querySelector(selector))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    link.dataset[datasetName]=datasetValue;
    document.head.appendChild(link);
  }

  function ensureFrameStyles(){
    ensureStylesheet('link[data-frame-system="v2"]',FRAME_STYLESHEET,'frameSystem','v2');
    ensureStylesheet('link[data-release-fix="ast0124"]',RELEASE_STYLESHEET,'releaseFix','ast0124');
    ensureStylesheet('link[data-header-fix="ast019-buddy-panel"]',HEADER_STYLESHEET,'headerFix','ast019-buddy-panel');
    injectStartupStateStyles();
  }

  function buildFrameStartup(){
    const gate=document.getElementById('entryGate');
    if(!gate||gate.dataset.frameSystem==='v2')return gate;

    gate.dataset.frameSystem='v2';
    gate.classList.add('frameStartup');
    gate.querySelector('.entryPanel')?.classList.add('frameStartupMeta');

    const legacyActions=gate.querySelector('.entryActions');
    const google=document.getElementById('entryGoogleButton');
    const offline=document.getElementById('entryOfflineButton');
    const controls=document.createElement('div');
    controls.className='frameStartupControls';
    controls.setAttribute('aria-label','Choix de connexion');

    const scene=document.createElement('div');
    scene.className='startupAccessScene';
    const rotor=document.createElement('div');
    rotor.className='startupAccessRotor';
    const front=document.createElement('section');
    front.className='startupAccessFace startupAccessFace--front';
    const back=document.createElement('section');
    back.className='startupAccessFace startupAccessFace--back';
    back.setAttribute('aria-hidden','true');
    const choices=document.createElement('div');
    choices.className='startupAccessChoices';

    const glowNetwork=document.createElement('span');
    glowNetwork.className='startupAccessGlow startupAccessGlow--network';
    glowNetwork.setAttribute('aria-hidden','true');
    const glowLocal=document.createElement('span');
    glowLocal.className='startupAccessGlow startupAccessGlow--local';
    glowLocal.setAttribute('aria-hidden','true');
    const networkChoice=document.createElement('div');
    networkChoice.className='frameStartupChoice frameStartupChoice--network';
    const localChoice=document.createElement('div');
    localChoice.className='frameStartupChoice frameStartupChoice--local';

    if(google){
      google.className='frameStartupChoiceButton';
      google.setAttribute('aria-label','NETWORK MODE — cloud synchronization');
      google.replaceChildren();
      networkChoice.appendChild(google);
    }
    if(offline){
      offline.className='frameStartupChoiceButton';
      offline.setAttribute('aria-label','LOCAL MODE — device storage');
      offline.replaceChildren();
      localChoice.appendChild(offline);
    }

    choices.append(glowNetwork,glowLocal,networkChoice,localChoice);
    front.appendChild(choices);
    rotor.append(front,back);
    scene.appendChild(rotor);
    controls.appendChild(scene);
    gate.prepend(makeShutter('top'),makeShutter('bottom'));
    document.body.appendChild(controls);
    if(legacyActions)legacyActions.hidden=true;
    setDockStartupState(true);
    return gate;
  }

  function showGate(gate){
    if(!gate||gate.classList.contains('frameStartup--opening'))return;
    gate.hidden=false;
    gate.style.display='block';
    gate.style.visibility='visible';
    setDockStartupState(true);
    document.body.classList.remove('startupModeActivating','entryGateOpening');
    const controls=document.querySelector('.frameStartupControls');
    if(!controls)return;
    controls.hidden=false;
    controls.classList.remove('frameStartupControls--opening','frameStartupControls--selected-network','frameStartupControls--selected-local');
    controls.querySelectorAll('button').forEach(button=>{button.disabled=false;});
  }

  function prepare(){
    configureSystemChrome();
    ensureFrameStyles();
    const gate=buildFrameStartup();
    showGate(gate);
    [0,100,350,800,1500,3000].forEach(delay=>{
      setTimeout(()=>{
        if(gate?.dataset.userChoice!=='1')showGate(gate);
      },delay);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare,{once:true});
  else prepare();
})();
