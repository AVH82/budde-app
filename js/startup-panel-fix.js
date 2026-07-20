(function(){
  const STYLE_ID='startup-panel-real-crop-fix';
  const ALPHA_THRESHOLD=24;
  let cropped=false;
  let cropping=false;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .frameStartupControls,
      .startupAccessScene,
      .startupAccessRotor,
      .startupAccessFace{box-sizing:border-box!important;}
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
      .startupAccessFace--front{
        overflow:hidden!important;
        background:transparent!important;
      }
      .startupAccessFace--front::before{
        content:none!important;
        display:none!important;
        background:none!important;
        box-shadow:none!important;
      }
      .startupAccessPanel{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        min-width:100%!important;
        min-height:100%!important;
        max-width:none!important;
        max-height:none!important;
        object-fit:fill!important;
        object-position:center!important;
        transform:none!important;
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
        box-shadow:0 8px 18px rgba(0,0,0,.88),0 0 14px rgba(0,0,0,.72)!important;
      }
      .startupAccessGlow{opacity:0!important;}
      .frameStartupControls--selected-network .startupAccessGlow--network,
      .frameStartupControls--selected-local .startupAccessGlow--local{opacity:1!important;}
    `;
    document.head.appendChild(style);
  }

  function waitForImage(image){
    if(image.complete&&image.naturalWidth>0)return Promise.resolve(image);
    return new Promise((resolve,reject)=>{
      image.addEventListener('load',()=>resolve(image),{once:true});
      image.addEventListener('error',reject,{once:true});
    });
  }

  async function cropPanelImage(){
    if(cropped||cropping)return;
    const panel=document.querySelector('.startupAccessPanel');
    if(!panel)return;
    cropping=true;
    try{
      await waitForImage(panel);
      const width=panel.naturalWidth;
      const height=panel.naturalHeight;
      const source=document.createElement('canvas');
      source.width=width;
      source.height=height;
      const context=source.getContext('2d',{willReadFrequently:true});
      if(!context)throw new Error('Canvas unavailable');
      context.drawImage(panel,0,0,width,height);
      const pixels=context.getImageData(0,0,width,height).data;
      let left=width,top=height,right=-1,bottom=-1;
      for(let y=0;y<height;y+=1){
        for(let x=0;x<width;x+=1){
          if(pixels[((y*width+x)*4)+3]>=ALPHA_THRESHOLD){
            if(x<left)left=x;
            if(x>right)right=x;
            if(y<top)top=y;
            if(y>bottom)bottom=y;
          }
        }
      }
      if(right<left||bottom<top)throw new Error('No opaque pixels');
      const cropWidth=right-left+1;
      const cropHeight=bottom-top+1;
      const croppedCanvas=document.createElement('canvas');
      croppedCanvas.width=cropWidth;
      croppedCanvas.height=cropHeight;
      const croppedContext=croppedCanvas.getContext('2d');
      if(!croppedContext)throw new Error('Crop canvas unavailable');
      croppedContext.drawImage(source,left,top,cropWidth,cropHeight,0,0,cropWidth,cropHeight);
      panel.src=croppedCanvas.toDataURL('image/png');
      panel.dataset.alphaCropped='1';
      cropped=true;
    }catch(error){
      console.warn('Startup panel crop failed',error);
    }finally{
      cropping=false;
      syncToDock();
    }
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

  function refresh(){
    ensureStyle();
    syncToDock();
    cropPanelImage();
    requestAnimationFrame(syncToDock);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();
  window.addEventListener('resize',refresh);
  window.addEventListener('orientationchange',refresh);
  new MutationObserver(()=>requestAnimationFrame(syncToDock)).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['style','class']});
  [0,100,350,800,1500,3000].forEach(delay=>setTimeout(refresh,delay));
})();
