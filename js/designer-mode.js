(function(){
  'use strict';

  const PARAMS=new URLSearchParams(window.location.search||'');
  const ACTIVE=PARAMS.get('designer')==='1'||PARAMS.get('debugDesigner')==='1';
  const LOG='[DesignerMode]';
  const STORAGE_KEY='budde-designer-v1';
  const TRUSTMETER_VARS=['dialOffsetX','dialOffsetY','needleOffsetX','needleOffsetY','dialScale','needleScale'];
  const DESIGNER_VALUE_KEYS=[...TRUSTMETER_VARS,'radiationCenterX','radiationCenterY'];
  const CSS_MAP={
    dialOffsetX:'--dial-offset-x',
    dialOffsetY:'--dial-offset-y',
    needleOffsetX:'--needle-offset-x',
    needleOffsetY:'--needle-offset-y',
    dialScale:'--dial-scale',
    needleScale:'--needle-scale',
    radiationCenterX:'--radiation-visible-center-x',
    radiationCenterY:'--radiation-visible-center-y'
  };

  const toNum=value=>{
    if(value===null||value===undefined||typeof value==='object')return NaN;
    const n=Number.parseFloat(String(value).replace(',','.'));
    return Number.isFinite(n)?n:NaN;
  };
  const safeNum=(value,fallback=0)=>Number.isFinite(toNum(value))?toNum(value):fallback;
  const pct=value=>`${Math.round(safeNum(value)*1000)/1000}%`;

  function cloneValues(values){
    return DESIGNER_VALUE_KEYS.reduce((out,key)=>{
      out[key]=safeNum(values?.[key]);
      return out;
    },{});
  }

  function makeCss(values){
    const v=cloneValues(values);
    return DESIGNER_VALUE_KEYS.map(key=>`${CSS_MAP[key]}: ${pct(v[key])};`).join('\n');
  }

  function validatePayload(payload){
    if(!payload||payload.version!==1||typeof payload.values!=='object'||Array.isArray(payload.values))return null;
    const values={};
    for(const key of DESIGNER_VALUE_KEYS){
      if(!Object.prototype.hasOwnProperty.call(payload.values,key))return null;
      const n=toNum(payload.values[key]);
      if(!Number.isFinite(n)||Math.abs(n)>1000)return null;
      values[key]=n;
    }
    return {
      version:1,
      target:String(payload.target||'trustmeterGroup'),
      viewport:payload.viewport&&typeof payload.viewport==='object'&&!Array.isArray(payload.viewport)?payload.viewport:{},
      values
    };
  }

  function createDesignerMode(){
    if(!ACTIVE)return {active:false,open(){},close(){},selectTarget(){},getValues(){return {}},reset(){},exportJson(){return null}};

    const state={active:true,target:'trustmeterGroup',step:0.5,guides:true,instant:false,collapsed:false,drag:null,raf:0,pending:null,initial:null,values:null,panel:null,overlay:null,targets:{}};
    const module=()=>document.querySelector('.settingsTrustModule');
    const rotor=()=>document.querySelector('.settingsTrustRotor');
    const dial=()=>document.querySelector('.settingsTrustAsset--dial');
    const needle=()=>document.querySelector('.settingsTrustNeedle');
    const radiation=()=>document.querySelector('.settingsTrustAsset--radiation');
    const reference=()=>document.querySelector('.settingsTrustViewport')||module();

    function readRendered(){
      const el=module();
      if(!el)return cloneValues(state.values||state.initial||{});
      const cs=getComputedStyle(el);
      return cloneValues({
        dialOffsetX:cs.getPropertyValue(CSS_MAP.dialOffsetX),
        dialOffsetY:cs.getPropertyValue(CSS_MAP.dialOffsetY),
        needleOffsetX:cs.getPropertyValue(CSS_MAP.needleOffsetX),
        needleOffsetY:cs.getPropertyValue(CSS_MAP.needleOffsetY),
        dialScale:cs.getPropertyValue(CSS_MAP.dialScale),
        needleScale:cs.getPropertyValue(CSS_MAP.needleScale),
        radiationCenterX:cs.getPropertyValue(CSS_MAP.radiationCenterX)||'50%',
        radiationCenterY:cs.getPropertyValue(CSS_MAP.radiationCenterY)||'50%'
      });
    }

    function clearDesignerOverrides(){
      const el=module();
      if(!el)return;
      Object.values(CSS_MAP).forEach(cssVar=>el.style.removeProperty(cssVar));
    }

    function apply(values){
      const el=module();
      if(!el)return;
      state.values=cloneValues(values);
      DESIGNER_VALUE_KEYS.forEach(key=>el.style.setProperty(CSS_MAP[key],pct(state.values[key])));
      updatePanel();
      scheduleMeasure();
    }

    const designerTargets={
      trustmeterGroup:{
        label:'Trustmeter — groupe',
        element:()=>document.querySelector('.settingsTrustViewport'),
        reference,
        move(values,dx,dy){values.dialOffsetX+=dx;values.needleOffsetX+=dx;values.dialOffsetY+=dy;values.needleOffsetY+=dy},
        scale(values,factor){values.dialScale=state.initial.dialScale*factor;values.needleScale=state.initial.needleScale*factor},
        reset(values,initial){TRUSTMETER_VARS.forEach(key=>{values[key]=initial[key]})}
      },
      trustmeterDial:{
        label:'Trustmeter — cadran',
        element:dial,
        reference,
        move(values,dx,dy){values.dialOffsetX+=dx;values.dialOffsetY+=dy},
        scale(values,factor){values.dialScale=state.initial.dialScale*factor},
        reset(values,initial){['dialOffsetX','dialOffsetY','dialScale'].forEach(key=>{values[key]=initial[key]})}
      },
      trustmeterNeedle:{
        label:'Trustmeter — aiguille',
        element:needle,
        reference,
        move(values,dx,dy){values.needleOffsetX+=dx;values.needleOffsetY+=dy},
        scale(values,factor){values.needleScale=state.initial.needleScale*factor},
        reset(values,initial){['needleOffsetX','needleOffsetY','needleScale'].forEach(key=>{values[key]=initial[key]})}
      },
      radiation:{
        label:'Radioactivité',
        element:radiation,
        reference,
        move(values,dx,dy){values.radiationCenterX-=dx;values.radiationCenterY-=dy},
        scale(){},
        reset(values,initial){values.radiationCenterX=initial.radiationCenterX;values.radiationCenterY=initial.radiationCenterY}
      }
    };
    state.targets=designerTargets;

    function pxToPct(dx,dy){
      const rect=reference()?.getBoundingClientRect();
      return {x:rect?.width?dx/rect.width*100:0,y:rect?.height?dy/rect.height*100:0};
    }
    function targetDef(){return state.targets[state.target]||state.targets.trustmeterGroup}
    function resetCurrentTarget(){const next=cloneValues(state.values);targetDef().reset(next,state.initial);apply(next)}
    function restoreProductionValues(){clearDesignerOverrides();state.initial=readRendered();apply(state.initial)}

    function setGroupInputs(){
      const v=state.values;
      if(!state.panel||!v)return;
      state.panel.querySelector('[data-field=x]').value=state.target==='radiation'?v.radiationCenterX:state.target==='trustmeterNeedle'?v.needleOffsetX:v.dialOffsetX;
      state.panel.querySelector('[data-field=y]').value=state.target==='radiation'?v.radiationCenterY:state.target==='trustmeterNeedle'?v.needleOffsetY:v.dialOffsetY;
      state.panel.querySelector('[data-field=scale]').value=Math.round((v.dialScale/state.initial.dialScale)*1000)/1000;
      state.panel.querySelector('[data-field=step]').value=state.step;
    }
    function updatePanel(){if(!state.panel)return;setGroupInputs();state.panel.querySelector('.designer-live-css').value=makeCss(state.values)}
    function scheduleMeasure(){if(state.raf)return;state.raf=requestAnimationFrame(()=>{state.raf=0;measure()})}
    function center(rect){return {x:rect.left+rect.width/2,y:rect.top+rect.height/2}}
    function measure(){
      if(!state.panel)return;
      const mask=module()?.getBoundingClientRect(), d=dial()?.getBoundingClientRect(), n=needle()?.getBoundingClientRect(), t=targetDef().element()?.getBoundingClientRect();
      if(!mask||!d||!n||!t)return;
      const origin=getComputedStyle(needle()).transformOrigin.split(' ');
      const mc=center(mask),dc=center(d),pc={x:n.left+safeNum(origin[0],n.width*.245),y:n.top+n.height*.674};
      state.panel.querySelector('.designer-measures').textContent=`Référence offsets: viewport Trustmeter (${Math.round((reference()?.getBoundingClientRect()?.width)||0)}×${Math.round((reference()?.getBoundingClientRect()?.height)||0)} px)\nMasque: ${mc.x.toFixed(1)}, ${mc.y.toFixed(1)} px\nCadran: ${dc.x.toFixed(1)}, ${dc.y.toFixed(1)} px\nPivot: ${pc.x.toFixed(1)}, ${pc.y.toFixed(1)} px\nΔ cadran/pivot: ${(dc.x-pc.x).toFixed(1)}, ${(dc.y-pc.y).toFixed(1)} px\nCible: ${t.width.toFixed(1)}×${t.height.toFixed(1)} px\nÉchelle: ${state.values.dialScale.toFixed(3)}% / ${state.values.needleScale.toFixed(3)}%\nRadioactivité: ${state.values.radiationCenterX.toFixed(3)}%, ${state.values.radiationCenterY.toFixed(3)}%`;
      drawGuides(mask,d,n,t);
    }
    function guide(kind,rect,color){const el=document.createElement('div');el.className=`designer-guide designer-guide--${kind}`;el.style.cssText=`left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;border-color:${color};`;state.overlay.appendChild(el)}
    function drawGuides(mask,d,n,t){
      if(!state.overlay)return;
      state.overlay.innerHTML='';
      if(!state.guides)return;
      guide('mask',mask,'#ff3b30');guide('dial',d,'#40ff76');guide('target',t,'#d6ff55');
      const r=rotor()?.getBoundingClientRect();if(r)guide('rotor',r,'#ff9f0a');
      const p=document.createElement('div');p.className='designer-pivot';p.style.cssText=`left:${n.left+n.width*.245}px;top:${n.top+n.height*.674}px`;state.overlay.appendChild(p);
    }

    function onPointerDown(e){if(e.target.closest('.designer-panel'))return;const el=targetDef().element();if(!el||(!el.contains(e.target)&&e.target!==el))return;e.preventDefault();document.body.classList.add('designer-dragging');state.drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:cloneValues(state.values)};try{el.setPointerCapture(e.pointerId)}catch(error){console.info(LOG,'setPointerCapture unavailable',error?.message||error)}}
    function onPointerMove(e){if(!state.drag||e.pointerId!==state.drag.id)return;e.preventDefault();const d=pxToPct(e.clientX-state.drag.x,e.clientY-state.drag.y);state.pending={d,start:state.drag.start};if(!state.raf)state.raf=requestAnimationFrame(()=>{state.raf=0;const next=cloneValues(state.pending.start);targetDef().move(next,state.pending.d.x,state.pending.d.y);apply(next)})}
    function endDrag(){state.drag=null;document.body.classList.remove('designer-dragging');scheduleMeasure()}
    function nudge(axis,dir,mult=1){const next=cloneValues(state.values);targetDef().move(next,axis==='x'?dir*state.step*mult:0,axis==='y'?dir*state.step*mult:0);apply(next)}
    function handleKey(e){if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.key==='Escape'){state.collapsed=!state.collapsed;syncCollapse();return}const map={ArrowLeft:['x',-1],ArrowRight:['x',1],ArrowUp:['y',-1],ArrowDown:['y',1]};if(map[e.key]){e.preventDefault();nudge(map[e.key][0],map[e.key][1],e.shiftKey?5:1)}}
    function copy(text){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return Promise.resolve()}
    function exportJson(){return {version:1,target:state.target,viewport:{width:innerWidth,height:innerHeight,devicePixelRatio:devicePixelRatio||1},values:cloneValues(state.values)}}
    function forceFace(face){const el=module();if(!el)return;el.classList.toggle('settingsTrustModule--trust',face==='trust');el.classList.toggle('designer-instant-rotation',state.instant);scheduleMeasure();console.info(LOG,'face',face)}
    function syncCollapse(){state.panel.classList.toggle('designer-panel--collapsed',state.collapsed);state.panel.querySelector('.designer-toggle').setAttribute('aria-expanded',String(!state.collapsed))}

    function buildPanel(){
      const panel=document.createElement('section');
      panel.className='designer-panel';
      panel.innerHTML=`<header><strong>Designer Mode</strong><button class="designer-toggle" type="button" aria-expanded="true" aria-label="Replier Designer Mode">▾</button></header><div class="designer-body"><label>Cible<select data-field="target">${Object.entries(state.targets).map(([k,t])=>`<option value="${k}">${t.label}</option>`).join('')}</select></label><div class="designer-grid"><label>X %<input data-field="x" type="number" step="0.1"></label><label>Y %<input data-field="y" type="number" step="0.1"></label><label>Échelle globale<input data-field="scale" type="number" step="0.001"></label><label>Pas<select data-field="step"><option>0.1</option><option selected>0.5</option><option>1.0</option></select></label></div><div class="designer-actions"><button data-act="minus">−</button><button data-act="plus">+</button><button data-act="settings">Afficher Paramètres</button><button data-act="trust">Afficher Trustmeter</button></div><label><input data-field="guides" type="checkbox" checked> Guides</label><label><input data-field="instant" type="checkbox"> Rotation 3D instantanée</label><textarea class="designer-live-css" readonly></textarea><div class="designer-actions"><button data-act="copy">Copier les variables CSS</button><button data-act="reset">Réinitialiser la cible</button><button data-act="prod">Valeurs CSS de production</button><button data-act="export">Exporter JSON</button><button data-act="import">Importer JSON</button><button data-act="save">Sauvegarder localement</button><button data-act="restore">Restaurer</button><button data-act="clear">Effacer</button></div><textarea class="designer-import" placeholder="Coller un JSON Designer Mode"></textarea><pre class="designer-measures"></pre><p class="designer-status" role="status"></p></div>`;
      document.body.appendChild(panel);
      state.panel=panel;
      return panel;
    }
    function status(msg){state.panel.querySelector('.designer-status').textContent=msg;setTimeout(()=>{if(state.panel)state.panel.querySelector('.designer-status').textContent=''},1800)}

    function open(){
      const el=module();
      if(!el){console.info(LOG,'module unavailable');return}
      document.documentElement.classList.add('designerMode');
      state.initial=readRendered();
      state.values=cloneValues(state.initial);
      state.overlay=document.createElement('div');
      state.overlay.className='designer-overlay';
      document.body.appendChild(state.overlay);
      const panel=buildPanel();
      panel.addEventListener('input',e=>{const f=e.target.dataset.field;if(f==='target')selectTarget(e.target.value);if(f==='step')state.step=safeNum(e.target.value,state.step);if(f==='guides'){state.guides=e.target.checked;scheduleMeasure()}if(f==='instant')state.instant=e.target.checked});
      panel.addEventListener('change',e=>{const f=e.target.dataset.field;const next=cloneValues(state.values);if(f==='x'){if(state.target==='radiation')next.radiationCenterX=safeNum(e.target.value,next.radiationCenterX);else if(state.target==='trustmeterNeedle')next.needleOffsetX=safeNum(e.target.value,next.needleOffsetX);else{next.dialOffsetX=safeNum(e.target.value,next.dialOffsetX);if(state.target==='trustmeterGroup')next.needleOffsetX=next.dialOffsetX}}if(f==='y'){if(state.target==='radiation')next.radiationCenterY=safeNum(e.target.value,next.radiationCenterY);else if(state.target==='trustmeterNeedle')next.needleOffsetY=safeNum(e.target.value,next.needleOffsetY);else{next.dialOffsetY=safeNum(e.target.value,next.dialOffsetY);if(state.target==='trustmeterGroup')next.needleOffsetY=next.dialOffsetY}}if(f==='scale')targetDef().scale(next,safeNum(e.target.value,1));apply(next)});
      panel.addEventListener('click',async e=>{const a=e.target.dataset.act;if(!a)return;if(a==='minus')nudge('x',-1);if(a==='plus')nudge('x',1);if(a==='settings')forceFace('settings');if(a==='trust')forceFace('trust');if(a==='copy'){await copy(makeCss(state.values));status('CSS copié')}if(a==='reset')resetCurrentTarget();if(a==='prod')restoreProductionValues();if(a==='export'){await copy(JSON.stringify(exportJson(),null,2));status('JSON copié')}if(a==='import'){let payload=null;try{payload=validatePayload(JSON.parse(panel.querySelector('.designer-import').value||'null'))}catch(error){console.warn(LOG,'import rejected',error)}if(!payload){status('JSON rejeté');return}selectTarget(payload.target);apply(payload.values);status('JSON importé')}if(a==='save'){localStorage.setItem(STORAGE_KEY,JSON.stringify(exportJson()));status('Sauvegardé')}if(a==='restore'){let payload=null;try{payload=validatePayload(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'))}catch(error){console.warn(LOG,'restore rejected',error)}if(payload){selectTarget(payload.target);apply(payload.values);status('Restauré')}}if(a==='clear'){localStorage.removeItem(STORAGE_KEY);status('Effacé')}});
      panel.querySelector('.designer-toggle').onclick=()=>{state.collapsed=!state.collapsed;syncCollapse()};
      document.addEventListener('pointerdown',onPointerDown,{passive:false});document.addEventListener('pointermove',onPointerMove,{passive:false});document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',endDrag);document.addEventListener('keydown',handleKey);window.addEventListener('resize',scheduleMeasure);window.addEventListener('orientationchange',scheduleMeasure);
      updatePanel();scheduleMeasure();console.info(LOG,'enabled');
    }
    function close(){
      if(state.raf&&window.cancelAnimationFrame)window.cancelAnimationFrame(state.raf);
      state.raf=0;state.drag=null;
      document.documentElement.classList.remove('designerMode');
      document.body.classList.remove('designer-dragging');
      module()?.classList.remove('designer-instant-rotation','settingsTrustModule--trust');
      clearDesignerOverrides();
      state.panel?.remove();state.overlay?.remove();state.panel=null;state.overlay=null;
      document.removeEventListener('pointerdown',onPointerDown);document.removeEventListener('pointermove',onPointerMove);document.removeEventListener('pointerup',endDrag);document.removeEventListener('pointercancel',endDrag);document.removeEventListener('keydown',handleKey);window.removeEventListener('resize',scheduleMeasure);window.removeEventListener('orientationchange',scheduleMeasure);
    }
    function selectTarget(name){state.target=state.targets[name]?name:'trustmeterGroup';if(state.panel)state.panel.querySelector('[data-field=target]').value=state.target;updatePanel();scheduleMeasure()}

    return {active:true,open,close,selectTarget,getValues(){return cloneValues(state.values||{})},setValues(values){apply(values)},moveSelected(dx,dy){const next=cloneValues(state.values);targetDef().move(next,dx,dy);apply(next)},reset:resetCurrentTarget,resetCurrentTarget,restoreProductionValues,clearDesignerOverrides,exportJson,makeCss,validatePayload,pxToPct,_state:state};
  }

  window.BuddeDesignerMode=createDesignerMode();
  window.BuddeDesignerModeUtils={makeCss,validatePayload,cloneValues,TRUSTMETER_VARS,DESIGNER_VALUE_KEYS,CSS_MAP};
  if(ACTIVE){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>window.BuddeDesignerMode.open(),{once:true});else window.BuddeDesignerMode.open()}
})();
