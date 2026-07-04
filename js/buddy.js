(function(){
  const states={
    neutral:{label:'Neutre'},
    happy:{label:'Content'},
    thinking:{label:'Analyse',avatar:'assets/buddy-thinking.png'},
    success:{label:'Succès',avatar:'assets/buddy-success.png'},
    warning:{label:'Alerte',avatar:'assets/buddy-warning.png'}
  };
  const messages={
    home:['Coffre opérationnel.','Budget sous surveillance.','Terminal Budd€ en ligne.'],
    scan:['Reçu en analyse.','Photo reçue, je vérifie.'],
    manual:['Saisie prête.','Ajout manuel ouvert.'],
    budget:['Coffre budget ouvert.','Capsules sous contrôle.'],
    stats:['Analyse des signaux.','Je lis les tendances.'],
    merchants:['Registre marchands ouvert.','Commerçants en vue.'],
    success:['Dépense enregistrée.','Coffre mis à jour.'],
    warning:['Reçu à vérifier.','OCR incertain.']
  };
  let lastMessage='';
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
  function randomMessage(context){
    const pool=messages[context]||messages.home;
    if(pool.length===1)return pool[0];
    let next=pool[Math.floor(Math.random()*pool.length)];
    if(next===lastMessage)next=pool[(pool.indexOf(next)+1)%pool.length];
    lastMessage=next;
    return next;
  }
  function render(stateName='neutral',options={}){
    const state=states[stateName]?stateName:'neutral';
    const target=document.querySelector(options.target||'#buddyHeader');
    if(!target)return;
    const message=escapeHtml(options.message||randomMessage(options.context||'home'));
    const avatar=states[state].avatar
      ? `<img src="${states[state].avatar}" alt="" onerror="this.replaceWith(document.createTextNode('B'))">`
      : 'B';
    target.innerHTML=`<section class="buddy buddy--${state}" aria-label="Buddy"><div class="buddyAvatar" data-state="${state}" aria-hidden="true">${avatar}</div><div class="buddyBubble"><p>${message}</p></div></section>`;
  }
  window.Buddy={show:render,states,messages};
})();
