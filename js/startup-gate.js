(function(){
  function markOpening(mode){
    const gate=document.getElementById('entryGate');
    if(!gate)return;
    gate.dataset.entryMode=mode||'offline';
    gate.classList.add('entryGate--opening');
    document.body.classList.add('entryGateOpening');
    setTimeout(()=>document.body.classList.remove('entryGateOpening'),1200);
  }
  function prepare(){
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
