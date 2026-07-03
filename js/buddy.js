const Buddy=(()=>{
  const states=['neutral','happy','thinking','success','warning'];
  const avatars={
    neutral:null,
    happy:null,
    thinking:null,
    success:null,
    warning:null
  };
  const messages={
    home:{
      neutral:[
        'Résident, le coffre est opérationnel.',
        'Prêt pour une nouvelle journée de gestion.',
        'Le terminal Budd€ est en ligne.',
        'Les capsules sont en sécurité.',
        'Bienvenue dans votre abri budgétaire.'
      ],
      happy:[
        'Tout roule dans le coffre, résident.',
        'Les compteurs brillent vert aujourd’hui.'
      ],
      thinking:[
        'Analyse des signaux du terminal en cours…',
        'Calcul des trajectoires budgétaires…'
      ],
      success:[
        'Mission accomplie, coffre stabilisé.',
        'Synchronisation du moral : optimale.'
      ],
      warning:[
        'Attention, résident : surveillez les jauges.',
        'Signal faible détecté, restez vigilant.'
      ]
    }
  };

  function randomItem(items){
    return items[Math.floor(Math.random()*items.length)];
  }

  function normalizeState(state){
    return states.includes(state)?state:'neutral';
  }

  function messageFor(context,state){
    const library=messages[context]||messages.home;
    return randomItem(library[state]||library.neutral);
  }

  function avatarMarkup(state){
    const avatar=avatars[state];
    if(avatar)return `<img src="${avatar}" alt="Buddy ${state}">`;
    return '<span aria-hidden="true">B</span>';
  }

  function show(state='neutral',options={}){
    const target=document.getElementById(options.targetId||'buddyMount');
    if(!target)return;
    const safeState=normalizeState(state);
    const context=options.context||'home';
    target.innerHTML=`<div class="buddy buddy--${safeState}" data-state="${safeState}"><div class="buddyAvatar" aria-label="Buddy">${avatarMarkup(safeState)}</div><div class="buddyBubble" role="status">${messageFor(context,safeState)}</div></div>`;
  }

  return {show};
})();
window.Buddy=Buddy;
