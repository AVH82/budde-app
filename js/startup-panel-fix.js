(function(){
  const STYLE_ID='startup-panel-flexible-layout-fix';

  function ensureSurfaceStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      /* The complete rotor owns the navigation-band dimensions. */
      .frameStartupControls,
      .startupAccessScene,
      .startupAccessRotor,
      .startupAccessFace{
        box-sizing:border-box!important;
      }
      .startupAccessScene,
      .startupAccessRotor,
      .startupAccessFace{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        min-width:0!important;
        min-height:0!important;
        max-width:none!important;
        max-height:none!important;
      }
      .startupAccessScene{
        perspective:1000px!important;
      }
      .startupAccessRotor{
        transform-origin:center center!important;
      }
      .startupAccessFace--front{
        overflow:hidden!important;
      }
      .startupAccessFace--front::before{
        content:none!important;
        display:none!important;
        background:none!important;
        box-shadow:none!important;
      }

      /* The PNG is a flexible full-band background, never sized by the buttons. */
      .startupAccessPanel{
        position:absolute!important;
        left:0!important;
        top:50%!important;
        right:auto!important;
        bottom:auto!important;
        width:100%!important;
        height:100%!important;
        min-width:100%!important;
        min-height:100%!important;
        max-width:none!important;
        max-height:none!important;
        object-fit:fill!important;
        object-position:center!important;
        transform:translateY(-50%) scaleY(2.35)!important;
        transform-origin:center center!important;
        z-index:0!important;
        pointer-events:none!important;
      }

      /* Buttons are an independent overlay and cannot define panel height. */
      .startupAccessChoices{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        min-height:0!important;
        z-index:2!important;
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        grid-template-rows:1fr!important;
        align-items:center!important;
        justify-items:center!important;
      }
      .frameStartupChoice{
        align-self:center!important;
        justify-self:center!important;
      }

      /* Keep only a soft dark shadow behind each button for legibility. */
      .frameStartupChoice::before{
        background:transparent!important;
        box-shadow:
          0 8px 18px rgba(0,0,0,.88),
          0 0 14px rgba(0,0,0,.72)!important;
      }

      /* Green glow appears only after a mode is selected. */
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
    const width=Math.max(0,right-left);
    const height=Math.max(0,bottom-top);

    controls.style.left=`${left}px`;
    controls.style.top=`${top}px`;
    controls.style.right='auto';
    controls.style.bottom='auto';
    controls.style.width=`${width}px`;
    controls.style.height=`${height}px`;
    controls.style.minHeight=`${height}px`;
    controls.style.maxHeight=`${height}px`;

    controls.querySelectorAll(
      '.startupAccessScene,.startupAccessRotor,.startupAccessFace'
    ).forEach(element=>{
      element.style.width='100%';
      element.style.height='100%';
      element.style.minHeight='100%';
      element.style.maxHeight='none';
    });
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
