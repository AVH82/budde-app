(function(){
  const STYLE_ID='startup-panel-full-surface-fix';

  function ensureSurfaceStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      /* The bronze PNG is the only full-surface layer. */
      .startupAccessFace--front{
        overflow:hidden!important;
      }
      .startupAccessFace--front::before{
        content:none!important;
        display:none!important;
        background:none!important;
        box-shadow:none!important;
      }
      .startupAccessPanel{
        position:absolute!important;
        left:0!important;
        top:50%!important;
        right:auto!important;
        bottom:auto!important;
        width:100%!important;
        height:100%!important;
        object-fit:fill!important;
        object-position:center!important;
        transform:translateY(-50%) scaleY(2.15)!important;
        transform-origin:center center!important;
        z-index:0!important;
      }
      .startupAccessChoices{z-index:2!important;}

      /* Keep only a soft dark shadow behind each button for legibility. */
      .frameStartupChoice::before{
        background:transparent!important;
        box-shadow:
          0 8px 18px rgba(0,0,0,.88),
          0 0 14px rgba(0,0,0,.72)!important;
      }

      /* The green glow remains off until a mode is selected. */
      .startupAccessGlow{opacity:0!important;}
      .frameStartupControls--selected-network .startupAccessGlow--network,
      .frameStartupControls--selected-local .startupAccessGlow--local{opacity:1!important;}
    `;
    document.head.appendChild(style);
  }

  function syncPanelToNavigationBand(){
    const navigationBand=document.querySelector('.frameShellBottom');
    const controls=document.querySelector('.frameStartupControls');
    if(!navigationBand||!controls)return;

    const rect=navigationBand.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)return;

    const left=Math.max(0,rect.left);
    const top=Math.max(0,rect.top);
    const right=Math.min(window.innerWidth,rect.right);
    const bottom=Math.min(window.innerHeight,rect.bottom);

    controls.style.left=`${left}px`;
    controls.style.top=`${top}px`;
    controls.style.bottom='auto';
    controls.style.width=`${Math.max(0,right-left)}px`;
    controls.style.height=`${Math.max(0,bottom-top)}px`;
  }

  function refresh(){
    ensureSurfaceStyle();
    syncPanelToNavigationBand();
    requestAnimationFrame(syncPanelToNavigationBand);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();

  window.addEventListener('resize',refresh);
  window.addEventListener('orientationchange',refresh);
  [0,100,350,800,1500].forEach(delay=>setTimeout(refresh,delay));
})();
