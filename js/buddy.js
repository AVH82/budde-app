(function(){
  const states={
    neutral:{label:'Neutre'},
    happy:{label:'Content'},
    thinking:{label:'Analyse',avatar:'assets/buddy-thinking.png'},
    success:{label:'Succès',avatar:'assets/buddy-success.png'},
    warning:{label:'Alerte',avatar:'assets/buddy-warning.png'}
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
    const avatar=states[state].avatar
      ? `<img src="${states[state].avatar}" alt="" onerror="this.replaceWith(document.createTextNode('B'))">`
      : 'B';
    target.innerHTML=`<section class="buddy buddy--${state}" aria-label="Buddy"><div class="buddyAvatar" data-state="${state}" aria-hidden="true">${avatar}</div><div class="buddyBubble"><p>${message}</p><span>${states[state].label}</span></div></section>`;
  }

  window.Buddy={show:render,states,messages};
})();
