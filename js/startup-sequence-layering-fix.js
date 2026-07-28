(function(){
  const CONFIRM_MS=500;
  const COLLAPSE_MS=520;
  const PAUSE_MS=160;
  const SHUTTER_MS=2600;
  let networkPending=false;
  let sequenceRunning=false;

  function setSystemChrome(){
    const theme=document.querySelector('meta[name="theme-color"]');
    if(theme)theme.content='#000000';
    const status=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if(status)status.content='black-translucent';
    document.documentElement.style.backgroundColor='#000';
    document.body.style.backgroundColor='#000';
  }

  function dockOffset(){
    const dock=document.querySelector('.frameShellBottom');
    if(!dock)return;
    const offset=Math.max(0,Math.round(window.innerHeight-dock.getBoundingClientRect().top));
    document.documentElement.style.setProperty('--startup-dock-offset',`${offset}px`);
  }

  function injectStyles(){
    if(document.getElementById('startupSequenceLayeringFixStyles'))return;
    const style=document.createElement('style');
    style.id='startupSequenceLayeringFixStyles';
    style.textContent=`
      html,body{background:#000!important;}
      .frameStartupControls{
        bottom:calc(var(--startup-dock-offset, calc(var(--nav-h) + env(safe-area-inset-bottom))) - 2px)!important;
        height:clamp(72px,19vw,92px)!important;
        min-height:0!important;
        z-index:390!important;
        opacity:1!important;
        visibility:visible!important;
        transition:transform ${COLLAPSE_MS}ms cubic-bezier(.32,.02,.18,1)!important;
        will-change:transform;
      }
      .frameStartupControls.frameStartupControls--opening{
        z-index:350!important;
        transform:translate(-50%,calc(var(--startup-dock-offset, calc(var(--nav-h) + env(safe-area-inset-bottom))) + 16px))!important;
        opacity:1!important;
        visibility:visible!important;
      }
      .frameShutter--bottom{
        bottom:calc(var(--startup-dock-offset, calc(var(--nav-h) + env(safe-area-inset-bottom))) - 2px)!important;
        height:calc((100dvh - var(--frame-top-h) - var(--startup-dock-offset, calc(var(--nav-h) + env(safe-area-inset-bottom))) - env(safe-area-inset-top)) / 2 + 12px)!important;
        z-index:310!important;
      }
      .frameShellBottom.pipDock{z-index:400!important;}
      .frameShellBottom .dockActions,
      .frameShellBottom .nav{
        transform:translateY(7px)!important;
      }
      .startupAccessScene,.startupAccessRotor,.startupAccessFace{height:100%!important;}
      .startupAccessRotor,.startupAccessRotor.is-open{
        transform:none!important;
        transition:none!important;
      }
      .startupAccessChoices{
        inset:0 8px!important;
        width:auto!important;
        height:100%!important;
        top:0!important;
        left:0!important;
        transform:none!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:clamp(10px,2.5vw,14px)!important;
        overflow:visible!important;
      }
      .frameStartupChoice{
        position:relative!important;
        isolation:isolate!important;
        width:100%!important;
        height:100%!important;
        min-width:0!important;
        overflow:hidden!important;
        border-radius:12px!important;
        opacity:1!important;
      }
      .frameStartupChoice--network{transform:translateX(8px)!important;}
      .frameStartupChoice--local{transform:translateX(2px)!important;}
      .frameStartupChoice>button{
        position:relative!important;
        z-index:2!important;
        width:100%!important;
        height:100%!important;
        background-size:100% 100%!important;
        background-position:center!important;
        filter:none!important;
        opacity:1!important;
        visibility:visible!important;
      }
      .frameStartupChoice--local>button{
        background-size:106% 106%!important;
      }
      .startupAccessGlow{display:none!important;}
      .frameStartupChoice::before{
        content:"";
        position:absolute;
        z-index:1;
        inset:7px;
        border-radius:9px;
        opacity:.60;
        pointer-events:none;
        background:radial-gradient(ellipse at center,rgba(205,255,126,.62) 0,rgba(157,255,69,.34) 48%,rgba(115,211,46,.10) 78%,transparent 100%);
        box-shadow:inset 0 0 18px rgba(225,255,184,.92),inset 0 0 34px rgba(157,255,69,.42);
        animation:startupContainedFlicker 1250ms steps(2,end) infinite;
      }
      .frameStartupChoice::after{content:none!important;display:none!important;}
      .frameStartupControls--selected-network .frameStartupChoice--network::before,
      .frameStartupControls--selected-local .frameStartupChoice--local::before{
        opacity:.92;
        box-shadow:inset 0 0 22px rgba(235,255,205,1),inset 0 0 38px rgba(157,255,69,.58);
        animation-duration:560ms;
      }
      @keyframes startupContainedFlicker{0%,13%,18%,46%,52%,78%,100%{opacity:.66}15%,49%,80%{opacity:.42}16%,50%{opacity:.82}}
      .startupSequenceOwned .frameShutterTrack{animation:none!important;}
      .startupSequenceOwned.startupSequenceOpen .frameShutter--top .frameShutterTrack{animation:frameSlatsRollUp 2600ms var(--frame-motion-ease) forwards!important;}
      .startupSequenceOwned.startupSequenceOpen .frameShutter--bottom .frameShutterTrack{animation:frameSlatsRollDown 2600ms var(--frame-motion-ease) forwards!important;}
      @media(prefers-reduced-motion:reduce){
        .frameStartupControls{transition-duration:100ms!important;}
        .startupSequenceOwned.startupSequenceOpen .frameShutterTrack{animation-duration:120ms!important;}
        .frameStartupChoice::before{animation:none!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function activateDock(){
    document.body.classList.remove('startupModePending');
    document.body.classList.add('startupModeActivating');
    document.querySelectorAll('.frameShellBottom .nav button[data-view]').forEach(button=>{
      const home=button.dataset.view==='home';
      button.classList.toggle('active',home);
      if(home)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
  }

  function finalize(gate,controls,modeButton){
    gate.hidden=true;
    gate.classList.remove('frameStartup--opening','entryGate--opening','startupSequenceOwned','startupSequenceOpen');
    delete gate.dataset.openingSequence;
    controls.hidden=true;
    controls.classList.remove('frameStartupControls--opening');
    document.body.classList.remove('entryGateOpening','startupModeActivating');
    activateDock();
    if(modeButton){
      modeButton.dataset.startupSequenceBypass='1';
      modeButton.click();
      delete modeButton.dataset.startupSequenceBypass;
    }
    sequenceRunning=false;
  }

  function runSequence(modeButton){
    if(sequenceRunning)return;
    const gate=document.getElementById('entryGate');
    const controls=document.querySelector('.frameStartupControls');
    if(!gate||!controls)return;
    sequenceRunning=true;
    gate.dataset.userChoice='1';
    gate.dataset.openingSequence='1';
    gate.classList.add('startupSequenceOwned');
    controls.querySelectorAll('button').forEach(button=>{button.disabled=true;});
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const confirm=reduced?0:CONFIRM_MS;
    const collapse=reduced?100:COLLAPSE_MS;
    const pause=reduced?0:PAUSE_MS;
    const shutters=reduced?120:SHUTTER_MS;
    setTimeout(()=>{
      controls.classList.add('frameStartupControls--opening');
      setTimeout(()=>{
        controls.hidden=true;
        activateDock();
        document.body.classList.add('entryGateOpening');
        gate.classList.add('frameStartup--opening','entryGate--opening','startupSequenceOpen');
        setTimeout(()=>finalize(gate,controls,modeButton),shutters+220);
      },collapse+pause);
    },confirm);
  }

  function intercept(event){
    const button=event.target.closest?.('#entryOfflineButton,#entryGoogleButton');
    if(!button||button.dataset.startupSequenceBypass==='1')return;
    const gate=document.getElementById('entryGate');
    if(!gate)return;
    if(button.id==='entryOfflineButton'){
      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelector('.frameStartupControls')?.classList.add('frameStartupControls--selected-local');
      runSequence(button);
      return;
    }
    document.querySelector('.frameStartupControls')?.classList.add('frameStartupControls--selected-network');
    networkPending=true;
    gate.dataset.openingSequence='1';
  }

  function prepare(){
    setSystemChrome();
    injectStyles();
    dockOffset();
    window.addEventListener('resize',dockOffset,{passive:true});
    window.visualViewport?.addEventListener('resize',dockOffset,{passive:true});
    document.addEventListener('click',intercept,true);
    if(window.GoogleAuthService?.onChange){
      window.GoogleAuthService.onChange(status=>{
        if(!networkPending||!status?.signedIn)return;
        networkPending=false;
        runSequence(null);
      });
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare,{once:true});
  else prepare();
})();