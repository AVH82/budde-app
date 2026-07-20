(function(){
  const STYLE_ID='startup-panel-full-surface-fix';

  function ensureSurfaceStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .startupAccessFace--front::before{
        content:"";
        position:absolute;
        inset:0;
        z-index:0;
        pointer-events:none;
        background:
          linear-gradient(180deg,rgba(8,8,6,.96),rgba(13,11,7,.98)),
          radial-gradient(ellipse at center,rgba(66,54,31,.24),transparent 68%);
        box-shadow:
          inset 0 0 0 1px rgba(188,151,84,.28),
          inset 0 10px 24px rgba(0,0,0,.72),
          inset 0 -12px 28px rgba(0,0,0,.82);
      }
      .startupAccessPanel{z-index:1!important;}
      .startupAccessChoices{z-index:3!important;}
      .frameStartupChoice::before{
        background:linear-gradient(180deg,rgba(10,10,8,.98),rgba(4,5,3,.99))!important;
        box-shadow:
          inset 0 4px 10px rgba(0,0,0,.9),
          inset 0 -1px 2px rgba(218,179,105,.18),
          0 1px 1px rgba(224,184,110,.12)!important;
      }
    `;
    document.head.appendChild(style);
  }

  function syncPanelToBlackFrame(){
    const frame=document.querySelector('.frameShellBottom');
    const controls=document.querySelector('.frameStartupControls');
    if(!frame||!controls)return;

    const rect=frame.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)return;

    controls.style.left=`${Math.max(0,rect.left)}px`;
    controls.style.top=`${Math.max(0,rect.top)}px`;
    controls.style.bottom='auto';
    controls.style.width=`${Math.min(window.innerWidth,rect.right)-Math.max(0,rect.left)}px`;
    controls.style.height=`${Math.min(window.innerHeight,rect.bottom)-Math.max(0,rect.top)}px`;
  }

  function refresh(){
    ensureSurfaceStyle();
    syncPanelToBlackFrame();
    requestAnimationFrame(syncPanelToBlackFrame);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();

  window.addEventListener('resize',refresh);
  window.addEventListener('orientationchange',refresh);
  [0,100,350,800,1500].forEach(delay=>setTimeout(refresh,delay));
})();
