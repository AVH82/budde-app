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

  function setActiveNav(view='home'){
    document.querySelectorAll('.frameShellBottom .nav button[data-view]').forEach(button=>{
      const active=button.dataset.view===view;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
  }

  function activateDock(){
    document.body.classList.remove('startupModePending','startupModeActivating');
    setActiveNav('home');
  }

  function igniteDock(){
    document.body.classList.remove('startupModePending');
    document.body.classList.add('startupModeActivating');
    setActiveNav('home');
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
        igniteDock();
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

  function syncOperationalNavigation(event){
    const button=event.target.closest?.('.frameShellBottom .nav button[data-view]');
    if(!button)return;
    const view=button.dataset.view;
    requestAnimationFrame(()=>setActiveNav(view));
  }

  function prepare(){
    setSystemChrome();
    document.addEventListener('click',intercept,true);
    document.addEventListener('click',syncOperationalNavigation,false);
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
