(function(){
  const STYLE_ID='startup-panel-direct-stretch';
  const params=new URLSearchParams(window.location.search||'');
  const DESIGNER=params.get('designer')==='1'||params.get('debugDesigner')==='1';
  const STARTUP_PRODUCTION_VALUES={
    startupPanelX:-1.6,
    startupPanelY:-69,
    startupPanelWidth:103.7,
    startupPanelHeight:228,
    startupPanelScaleX:1,
    startupPanelScaleY:1
  };
  const STARTUP_CSS_VARS={
    startupPanelX:'--startup-panel-x',
    startupPanelY:'--startup-panel-y',
    startupPanelWidth:'--startup-panel-width',
    startupPanelHeight:'--startup-panel-height',
    startupPanelScaleX:'--startup-panel-scale-x',
    startupPanelScaleY:'--startup-panel-scale-y'
  };
  let resizeObserver=null;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .frameStartupControls{
        --startup-panel-x:-1.6%;
        --startup-panel-y:-69%;
        --startup-panel-width:103.7%;
        --startup-panel-height:228%;
        --startup-panel-scale-x:1;
        --startup-panel-scale-y:1;
      }
      .frameStartupControls,
      .startupAccessScene,
      .startupAccessRotor,
      .startupAccessFace{
        box-sizing:border-box!important;
        background:transparent!important;
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

      .startupAccessPanel{
        display:block!important;
        visibility:visible!important;
        position:absolute!important;
        left:var(--startup-panel-x,-1.6%)!important;
        top:var(--startup-panel-y,-69%)!important;
        width:var(--startup-panel-width,103.7%)!important;
        height:var(--startup-panel-height,228%)!important;
        min-width:0!important;
        min-height:0!important;
        max-width:none!important;
        max-height:none!important;
        object-fit:fill!important;
        object-position:center center!important;
        transform:scaleX(var(--startup-panel-scale-x,1)) scaleY(var(--startup-panel-scale-y,1))!important;
        transform-origin:center center!important;
        margin:0!important;
        padding:0!important;
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
        display:block!important;
      }
      .frameStartupChoice{
        position:absolute!important;
        top:50%!important;
        margin:0!important;
        align-self:auto!important;
        justify-self:auto!important;
        transform:translate(-50%,-50%)!important;
      }
      .frameStartupChoice:nth-child(1){left:25%!important;}
      .frameStartupChoice:nth-child(2){left:75%!important;}
      .frameStartupChoice::before{
        background:transparent!important;
        box-shadow:0 8px 18px rgba(0,0,0,.88),0 0 14px rgba(0,0,0,.72)!important;
      }
      .startupAccessGlow{opacity:0!important;}
      .frameStartupControls--selected-network .startupAccessGlow--network,
      .frameStartupControls--selected-local .startupAccessGlow--local{opacity:1!important;}
      html.designerMode .frameStartupControls{display:block!important;visibility:visible!important;pointer-events:auto!important;}
      html.designerMode .startupAccessRotor{transform:rotateY(0deg)!important;transition:none!important;}
      html.designerMode .startupAccessPanel{pointer-events:auto!important;z-index:3!important;cursor:move!important;}
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

  function applyProductionVarsToPanel(){
    const panel=document.querySelector('.startupAccessPanel');
    if(!panel)return false;
    Object.entries(STARTUP_PRODUCTION_VALUES).forEach(([key,value])=>{
      const cssVar=STARTUP_CSS_VARS[key];
      const renderedValue=key.includes('Scale')?String(value):`${value}%`;
      panel.style.setProperty(cssVar,renderedValue);
    });
    return true;
  }

  function syncDesignerProductionValues(){
    if(!DESIGNER)return;
    const designer=window.BuddeDesignerMode;
    if(!designer?.active||typeof designer.getValues!=='function'||typeof designer.setValues!=='function')return;

    const state=designer._state;
    const startupTarget=state?.targets?.startupPanel;
    if(startupTarget&&!startupTarget.__productionResetPatched){
      startupTarget.reset=values=>Object.assign(values,STARTUP_PRODUCTION_VALUES);
      startupTarget.__productionResetPatched=true;
    }

    if(state?.initial)Object.assign(state.initial,STARTUP_PRODUCTION_VALUES);

    const current=designer.getValues();
    const stillLegacyDefaults=current.startupPanelX===0&&current.startupPanelY===0&&current.startupPanelWidth===100&&current.startupPanelHeight===100&&current.startupPanelScaleX===1&&current.startupPanelScaleY===1;
    if(stillLegacyDefaults)designer.setValues({...current,...STARTUP_PRODUCTION_VALUES});
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
    applyProductionVarsToPanel();
    requestAnimationFrame(()=>{
      syncToDock();
      applyProductionVarsToPanel();
      syncDesignerProductionValues();
    });
    if(DESIGNER){
      const controls=document.querySelector('.frameStartupControls');
      if(controls){controls.hidden=false;controls.classList.remove('frameStartupControls--opening');controls.querySelector('.startupAccessRotor')?.classList.remove('is-open');}
      const gate=document.getElementById('entryGate');
      if(gate){gate.hidden=false;gate.classList.remove('frameStartup--opening','entryGate--opening');}
      syncDesignerProductionValues();
    }
  }

  function keepGateOpen(event){
    if(!DESIGNER||!event.target.closest?.('.frameStartupChoiceButton'))return;
    event.preventDefault();event.stopImmediatePropagation();refresh();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();
  window.addEventListener('resize',refresh);
  window.addEventListener('orientationchange',refresh);
  document.addEventListener('click',keepGateOpen,true);
  [0,50,100,250,500,800,1500,3000].forEach(delay=>setTimeout(refresh,delay));
})();