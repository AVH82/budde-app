(function(){
  const STYLE_ID='startup-panel-auto-alpha-crop-fix';
  const ALPHA_THRESHOLD=24;
  let opaqueBoundsPromise=null;
  let opaqueBounds=null;

  function ensureSurfaceStyle(){
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
      .startupAccessFace--front{overflow:hidden!important;}
      .startupAccessFace--front::before{
        content:none!important;
        display:none!important;
        background:none!important;
        box-shadow:none!important;
      }

      /* The image size is calculated from its real opaque pixel bounds. */
      .startupAccessPanel{
        position:absolute!important;
        right:auto!important;
        bottom:auto!important;
        min-width:0!important;
        min-height:0!important;
        max-width:none!important;
        max-height:none!important;
        object-fit:fill!important;
        object-position:center!important;
        transform:none!important;
        transform-origin:center center!important;
        z-index:0!important;
        pointer-events:none!important;
      }

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
        box-shadow:
          0 8px 18px rgba(0,0,0,.88),
          0 0 14px rgba(0,0,0,.72)!important;
      }

      .startupAccessGlow{opacity:0!important;}
      .frameStartupControls--selected-network .startupAccessGlow--network,
      .frameStartupControls--selected-local .startupAccessGlow--local{opacity:1!important;}
    `;
    document.head.appendChild(style);
  }

  function waitForImage(image){
    if(image.complete&&image.naturalWidth>0&&image.naturalHeight>0){
      return Promise.resolve(image);
    }
    return new Promise((resolve,reject)=>{
      image.addEventListener('load',()=>resolve(image),{once:true});
      image.addEventListener('error',reject,{once:true});
    });
  }

  function detectOpaqueBounds(image){
    if(opaqueBoundsPromise)return opaqueBoundsPromise;
    opaqueBoundsPromise=waitForImage(image).then(loadedImage=>{
      const width=loadedImage.naturalWidth;
      const height=loadedImage.naturalHeight;
      const canvas=document.createElement('canvas');
      canvas.width=width;
      canvas.height=height;
      const context=canvas.getContext('2d',{willReadFrequently:true});
      if(!context)throw new Error('Canvas context unavailable');
      context.clearRect(0,0,width,height);
      context.drawImage(loadedImage,0,0,width,height);
      const pixels=context.getImageData(0,0,width,height).data;
      const minimumRowPixels=Math.max(2,Math.floor(width*.02));
      const minimumColumnPixels=Math.max(2,Math.floor(height*.02));
      const rowCounts=new Uint32Array(height);
      const columnCounts=new Uint32Array(width);

      for(let y=0;y<height;y+=1){
        for(let x=0;x<width;x+=1){
          const alpha=pixels[((y*width+x)*4)+3];
          if(alpha>=ALPHA_THRESHOLD){
            rowCounts[y]+=1;
            columnCounts[x]+=1;
          }
        }
      }

      let top=0;
      while(top<height&&rowCounts[top]<minimumRowPixels)top+=1;
      let bottom=height-1;
      while(bottom>=top&&rowCounts[bottom]<minimumRowPixels)bottom-=1;
      let left=0;
      while(left<width&&columnCounts[left]<minimumColumnPixels)left+=1;
      let right=width-1;
      while(right>=left&&columnCounts[right]<minimumColumnPixels)right-=1;

      if(top>=height||left>=width||bottom<top||right<left){
        return {left:0,top:0,right:width-1,bottom:height-1,width,height};
      }
      return {
        left,
        top,
        right,
        bottom,
        width:right-left+1,
        height:bottom-top+1,
        sourceWidth:width,
        sourceHeight:height
      };
    }).then(bounds=>{
      opaqueBounds=bounds;
      return bounds;
    }).catch(()=>{
      const fallback={left:0,top:0,width:1,height:1,sourceWidth:1,sourceHeight:1};
      opaqueBounds=fallback;
      return fallback;
    });
    return opaqueBoundsPromise;
  }

  function fitOpaquePanel(panel,containerWidth,containerHeight){
    if(!panel||containerWidth<=0||containerHeight<=0)return;
    const apply=bounds=>{
      const sourceWidth=bounds.sourceWidth||bounds.width;
      const sourceHeight=bounds.sourceHeight||bounds.height;
      const visibleWidth=Math.max(1,bounds.width);
      const visibleHeight=Math.max(1,bounds.height);
      const renderedWidth=containerWidth*(sourceWidth/visibleWidth);
      const renderedHeight=containerHeight*(sourceHeight/visibleHeight);
      const left=-(bounds.left/visibleWidth)*containerWidth;
      const top=-(bounds.top/visibleHeight)*containerHeight;

      panel.style.left=`${left}px`;
      panel.style.top=`${top}px`;
      panel.style.width=`${renderedWidth}px`;
      panel.style.height=`${renderedHeight}px`;
    };

    if(opaqueBounds)apply(opaqueBounds);
    else detectOpaqueBounds(panel).then(()=>refresh());
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

    fitOpaquePanel(controls.querySelector('.startupAccessPanel'),width,height);
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