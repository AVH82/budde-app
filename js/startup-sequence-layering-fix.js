(function(){
  const CONFIRM_MS=500;
  const COLLAPSE_MS=420;
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
        bottom:calc(var(--startup-dock-offset, var(--nav-h)) - 2px)!important;
        z-index:390!important;
      }
      .frameShutter--bottom{
        bottom:0!important;
        height:calc((100dvh - var(--frame-top-h) - var(--nav-h) - env(safe-area-inset-top) - env(safe-area-inset-bottom)) / 2 + 12px + var(--startup-dock-offset, var(--nav-h)))!important;
        z-index:310!important;
      }
      .frameShellBottom.pipDock{z-index:400!important;}
      .startupAccessChoices{overflow:hidden!important;}
      .startupAccessGlow{
        margin:5px!important;
        width:calc(100% - 10px)!important;
        height:calc(100% - 10px)!important;
        border-radius:12px!important;
        filter:none!important;
        background:linear-gradient(180deg,rgba(185,255,103,.36),rgba(115,211,46,.18))!important;
        box-shadow:inset 0 0 16px rgba(215,255,164,.78)!important;
        overflow:hidden!important;
      }
      .startupModePending .startupAccessGlow{
        box-shadow:inset 0 0 20px rgba(215,255,164,.95)!important;
      }
      .startupSequenceOwned .frameShutterTrack{animation:none!important;}
      .startupSequenceOwned.startupSequenceOpen .frameShutter--top .frameShutterTrack{animation:frameSlatsRollUp 2600ms var(--frame-motion-ease) forwards!important;}
      .startupSequenceOwned.startupSequenceOpen .frameShutter--bottom .frameShutterTrack{animation:frameSlatsRollDown 2600ms var(--frame-motion-ease) forwards!important;}
      @media(prefers-reduced-motion:reduce){
        .startupSequenceOwned.startupSequenceOpen .frameShutterTrack{animation-duration:120ms!important;}
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
    const rotor=controls?.querySelector('.startupAccessRotor');
    if(!gate||!controls||!rotor)return;
    sequenceRunning=true;
    gate.dataset.userChoice='1';
    gate.dataset.openingSequence='1';
    gate.classList.add('startupSequenceOwned');
    controls.classList.add('frameStartupControls--opening');
    controls.querySelectorAll('button').forEach(button=>{button.disabled=true;});
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const confirm=reduced?0:CONFIRM_MS;
    const collapse=reduced?100:COLLAPSE_MS;
    const pause=reduced?0:PAUSE_MS;
    const shutters=reduced?120:SHUTTER_MS;
    setTimeout(()=>{
      rotor.classList.add('is-open');
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
