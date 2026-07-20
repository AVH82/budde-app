(function(){
  const STYLE_ID='startup-panel-background-owns-height';
  let resizeObserver=null;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
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
      .startupAccessScene{perspective:1000px!important;}
      .startupAccessRotor{transform-origin:center center!important;}

      /* The face owns the full dock height. The PNG is used as an extensible
         surface, not as an image whose height is derived from the buttons. */
      .startupAccessFace--front{
        overflow:hidden!important;
        background:transparent!important;
      }
      .startupAccessFace--front::before{
        content:""!important;
        display:block!important;
        position:absolute!important;
        inset:0!important;
        z-index:0!important;
        pointer-events:none!important;
        background-image:url("../assets/frame/startup-access-panel.png?v=ast058")!important;
        background-repeat:no-repeat!important;
        background-position:center center!important;
        background-size:100% 245%!important;
        box-shadow:none!important;
      }

      /* Disable the legacy IMG: the extensible face background is authoritative. */
      .startupAccessPanel{
        display:none!important;
        visibility:hidden!important;
      }

      /* Buttons are an overlay and never participate in panel sizing. */
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
      .frameStartupChoice::before{
        background:transparent!important;
        box-shadow:0 8px 18px rgba(0,0,0,.88),0 0 14px rgba(0,0,0,.72)!important;
      }

      .startupAccessGlow{opacity:0!important;}
      .frameStartupControls--selected-network .startupAccessGlow--network,
      .frameStartupControls--selected-local .startupAccessGlow--local{opacity:1!important;}
    `;
    document.head.appendChild(style);
  }

  function syncToDock(){
    const dock=document.querySelector('.frameShellBottom');
    const controls=document.querySelector('.frameStartupControls');
    if(!dock||!controls)return;

    const rect=dock.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)return;

    const left=Math.max(0,rect.left);
    const top=Math.max(0,rect.top);
    const right=Math.min(window.innerWidth,rect.right);
    const bottom=Math.min(window.innerHeight,rect.bottom);
    const width=Math.max(0,right-left);
    const height=Math.max(0,bottom-top);

    controls.style.setProperty('left',`${left}px`,'important');
    controls.style.setProperty('top',`${top}px`,'important');
    controls.style.setProperty('right','auto','important');
    controls.style.setProperty('bottom','auto','important');
    controls.style.setProperty('width',`${width}px`,'important');
    controls.style.setProperty('height',`${height}px`,'important');
    controls.style.setProperty('min-height',`${height}px`,'important');
    controls.style.setProperty('max-height',`${height}px`,'important');
  }

  function observeDock(){
    if(resizeObserver)return;
    const dock=document.querySelector('.frameShellBottom');
    if(!dock||typeof ResizeObserver==='undefined')return;
    resizeObserver=new ResizeObserver(()=>requestAnimationFrame(syncToDock));
    resizeObserver.observe(dock);
  }

  function refresh(){
    ensureStyle();
    syncToDock();
    observeDock();
    requestAnimationFrame(syncToDock);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();

  window.addEventListener('resize',refresh);
  window.addEventListener('orientationchange',refresh);
  [0,100,350,800,1500,3000].forEach(delay=>setTimeout(refresh,delay));
})();
