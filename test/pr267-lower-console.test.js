const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('css/frame-system-v2.css','utf8');

test('startup plate fills the complete lower console and its safe area',()=>{
  for(const declaration of ['--startup-panel-x:0%','--startup-panel-y:0%','--startup-panel-width:100%','--startup-panel-height:100%']) assert.ok(css.includes(declaration));
  assert.match(css,/\.frameStartupControls\{[\s\S]*bottom:0;[\s\S]*height:calc\(var\(--nav-h\) \+ env\(safe-area-inset-bottom\)\)/);
});

test('mode controls are enlarged and seated in the upper control row',()=>{
  assert.match(css,/\.startupAccessChoices\{[^}]*top:34%;[^}]*width:calc\(100% - clamp\(24px,6vw,38px\)\)/s);
  assert.match(css,/\.frameStartupChoice\{[^}]*height:clamp\(68px,18vw,88px\)/s);
});

test('actions and navigation share the continuous industrial console skin',()=>{
  assert.match(css,/One continuous industrial console skin/);
  assert.match(css,/\.frameShellBottom \.dockActions,\s*\.frameShellBottom \.nav\{[^}]*background:rgba\(5,7,5,\.34\)/s);
});
