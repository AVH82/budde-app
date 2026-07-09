(function(){
  function markOpening(mode){
    const gate=document.getElementById('entryGate');
    if(!gate)return;
    gate.dataset.entryMode=mode||'offline';
    gate.classList.add('entryGate--opening');
    document.body.classList.add('entryGateOpening');
    setTimeout(()=>document.body.classList.remove('entryGateOpening'),2450);
  }
  function prepare(){
    const gate=document.getElementById('entryGate');
    if(gate&&!document.body.dataset.entryOpened)gate.hidden=false;
    const google=document.getElementById('entryGoogleButton');
    const offline=document.getElementById('entryOfflineButton');
    if(offline)offline.addEventListener('click',()=>markOpening('offline'),{capture:true});
    if(google)google.addEventListener('click',()=>{
      const status=document.getElementById('entryGateStatus');
      if(status){status.textContent='ACCÈS ESPACE SÉCURISÉ.';status.dataset.entryStatus='ACCÈS ESPACE SÉCURISÉ.';}
      markOpening('google');
    },{capture:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare,{once:true});else prepare();
})();
