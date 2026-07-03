(function(){
  const states={
    neutral:{label:'Neutre',avatar:'B'},
    happy:{label:'Content',avatar:'B'},
    thinking:{label:'Analyse',avatar:'B'},
    success:{label:'Succès',avatar:'B'},
    warning:{label:'Alerte',avatar:'B'}
  };
  const messages={
    home:[
      'Résident, le coffre est opérationnel.',
      'Prêt pour une nouvelle journée de gestion.',
      'Le terminal Budd€ est en ligne.',
      'Les capsules sont en sécurité.',
      'Inventaire financier stabilisé.',
      'Surveillance du budget active.'
    ]
  };
  let lastMessage='';

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
    const target=document.querySelector(options.target||'#buddyHome');
    if(!target)return;
    const message=options.message||randomMessage(options.context||'home');
    target.innerHTML=`<section class="buddy buddy--${state}" aria-label="Buddy"><div class="buddyAvatar" data-state="${state}" aria-hidden="true">${states[state].avatar}</div><div class="buddyBubble"><p>${message}</p><span>${states[state].label}</span></div></section>`;
  }

  window.Buddy={show:render,states,messages};
})();
