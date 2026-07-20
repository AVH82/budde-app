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

  function syncFullDockSurface(){
    const footer=document.querySelector('.frameShellBottom');
    const controls=document.querySelector('.frameStartupControls');
    if(!footer||!controls)return;

    const actions=footer.querySelector('.dockActions');
    const nav=footer.querySelector('.nav');
    const rects=[footer,actions,nav]
      .filter(Boolean)
      .map(element=>element.getBoundingClientRect())
      .filter(rect=>rect.width>0&&rect.height>0);
    if(!rects.length)return;

    const left=Math.max(0,Math.min(...rects.map(rect=>rect.left)));
    const right=Math.min(window.innerWidth,Math.max(...rects.map(rect=>rect.right)));
    const topCandidate=actions?.getBoundingClientRect().top;
    const top=Math.max(0,Number.isFinite(topCandidate)?topCandidate:Math.min(...rects.map(rect=>rect.top)));
    const bottom=window.innerHeight;

    controls.style.left=`${left}px`;
    controls.style.top=`${top}px`;
    controls.style.bottom='0px';
    controls.style.width=`${Math.max(0,right-left)}px`;
    controls.style.height=`${Math.max(0,bottom-top)}px`;
  }

  function refresh(){
    ensureSurfaceStyle();
    syncFullDockSurface();
    requestAnimationFrame(syncFullDockSurface);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();

  window.addEventListener('resize',refresh);
  window.addEventListener('orientationchange',refresh);
  [0,100,350,800,1500].forEach(delay=>setTimeout(refresh,delay));
})();
