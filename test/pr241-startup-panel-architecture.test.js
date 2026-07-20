const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');

test('PR241 keeps the six production geometry values in static CSS',()=>{
  const css=read('css/frame-system-v2.css');
  for(const declaration of [
    '--startup-panel-x:-1.6%', '--startup-panel-y:-69%',
    '--startup-panel-width:103.7%', '--startup-panel-height:228%',
    '--startup-panel-scale-x:1', '--startup-panel-scale-y:1'
  ]) assert.match(css,new RegExp(declaration.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(css,/\.startupAccessPanel\{[^}]*left:var\(--startup-panel-x\);[^}]*top:var\(--startup-panel-y\);[^}]*width:var\(--startup-panel-width\);[^}]*height:var\(--startup-panel-height\);[^}]*transform:scaleX\(var\(--startup-panel-scale-x\)\) scaleY\(var\(--startup-panel-scale-y\)\)/s);
});

test('PR241 removes every JavaScript geometry and synchronization layer',()=>{
  const startup=read('js/startup-gate.js');
  const designer=read('js/designer-mode.js');
  const index=read('index.html');
  assert.equal(fs.existsSync('js/startup-panel-fix.js'),false);
  assert.doesNotMatch(index,/startup-panel-fix/);
  assert.doesNotMatch(`${startup}\n${designer}`,/STARTUP_PRODUCTION_VALUES|syncDesignerProductionValues|ResizeObserver|syncStartupControlsToFooter/);
  assert.doesNotMatch(startup,/getBoundingClientRect\(\)[\s\S]*controls\.style/);
  assert.doesNotMatch(designer,/startupPanel(?:X|Y|Width|Height):(?:0|100)|startupPanelScale[XY]:1/);
});

test('PR241 Designer reads, writes, and resets only the panel CSS custom properties',()=>{
  const source=read('js/designer-mode.js');
  assert.match(source,/const panelStyle=startupPanel\(\)\?getComputedStyle\(startupPanel\(\)\):null/);
  assert.match(source,/target\?\.style\.setProperty\(CSS_MAP\[key\]/);
  assert.match(source,/STARTUP_PANEL_VARS\.forEach\(key=>startupPanel\(\)\?\.style\.removeProperty\(CSS_MAP\[key\]\)\)/);
});
