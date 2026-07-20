const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');
const startup = () => read('js/startup-gate.js');
const css = () => read('css/frame-system-v2.css');

test('startup gate uses the versioned alpha PNG as a real image', () => {
  const path='assets/frame/startup-access-panel.png';
  assert.equal(fs.existsSync(path), true);
  const png=fs.readFileSync(path);
  assert.ok(png.length > 25, 'panel PNG must not be empty');
  assert.deepEqual([...png.subarray(0,8)], [137,80,78,71,13,10,26,10]);
  assert.ok([4,6].includes(png[25]), `PNG color type ${png[25]} must contain alpha`);
  assert.match(startup(), /createElement\('img'\)/);
  assert.match(startup(), /accessPanel\.className='startupAccessPanel'/);
  assert.match(startup(), /assets\/frame\/startup-access-panel\.png\?v=ast058/);
  assert.match(css(), /\.startupAccessPanel\{[^}]*display:block/s);
  assert.doesNotMatch(css(), /border-image/);
});

test('startup access is one full-size two-faced horizontal 3D rotor', () => {
  for (const name of ['startupAccessScene','startupAccessRotor','startupAccessFace--front','startupAccessFace--back']) assert.match(startup(), new RegExp(name));
  assert.match(startup(), /rotor\.append\(front,back\)/);
  assert.match(css(), /\.startupAccessScene\{[^}]*width:100%;[^}]*height:100%;[^}]*perspective:1000px;[^}]*perspective-origin:center center/s);
  assert.match(css(), /\.startupAccessRotor\{[^}]*position:absolute;[^}]*inset:0;[^}]*transform-style:preserve-3d;[^}]*transform-origin:center center/s);
  assert.match(css(), /\.startupAccessRotor\.is-open\{transform:rotateX\(180deg\)/);
  assert.match(css(), /\.startupAccessFace\{[^}]*backface-visibility:hidden/s);
  assert.match(css(), /\.startupAccessFace--back\{[^}]*rotateX\(180deg\);[^}]*background:transparent/s);
  assert.doesNotMatch(css(), /rotateY|rotateX\((?:90|104)deg\)/);
});

test('centered choices align glows and buttons in equal cells and layer order', () => {
  assert.match(startup(), /choices\.className='startupAccessChoices'/);
  assert.match(startup(), /choices\.append\(glowNetwork,glowLocal,left,right\)/);
  assert.match(startup(), /front\.append\(accessPanel,choices\)/);
  assert.match(css(), /\.startupAccessChoices\{[^}]*left:50%;[^}]*top:50%;[^}]*translate\(-50%,-50%\)[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/s);
  assert.match(css(), /\.startupAccessPanel\{[^}]*object-fit:fill;[^}]*z-index:0/s);
  assert.match(css(), /\.startupAccessGlow\{[^}]*z-index:1;[^}]*width:100%;[^}]*height:100%/s);
  assert.match(css(), /startupAccessGlow--network,.frameStartupChoice--network\{grid-column:1;grid-row:1/);
  assert.match(css(), /startupAccessGlow--local,.frameStartupChoice--local\{grid-column:2;grid-row:1/);
  assert.match(css(), /\.frameStartupChoice\{[^}]*z-index:2;[^}]*width:100%;[^}]*height:clamp\(54px,14vw,78px\)/s);
});


test('button labels cannot leak into the visual assembly', () => {
  assert.equal((startup().match(/replaceChildren\(\)/g)||[]).length, 2);
  assert.doesNotMatch(startup(), /frameStartupChoiceAsset|sr-only/);
  assert.match(css(), /\.frameStartupChoice>button\{[^}]*color:transparent!important;[^}]*font-size:0!important;[^}]*text-indent:-9999px!important/s);
  assert.match(css(), /frameStartupChoice--network>button\{background-image:url\('\.\.\/assets\/frame\/network-mode-button\.png'\)!important/);
  assert.match(css(), /frameStartupChoice--local>button\{background-image:url\('\.\.\/assets\/frame\/local-mode-button\.png'\)!important/);
});

test('each button is seated in a recessed plate mounting', () => {
  assert.match(css(), /\.frameStartupChoice::before\{[^}]*background:rgba\(24,18,11,\.42\);[^}]*box-shadow:inset/s);
});

test('startup controls track the real footer box and viewport changes', () => {
  assert.match(startup(), /querySelector\('\.frameShellBottom'\)/);
  assert.match(startup(), /footer\.getBoundingClientRect\(\)/);
  for (const property of ['left','bottom','width','height']) assert.match(startup(), new RegExp(`controls\\.style\\.${property}=`));
  assert.match(startup(), /requestAnimationFrame\(syncStartupControlsToFooter\)/);
  assert.match(startup(), /addEventListener\('resize',refreshStartupControlsBox\)/);
  assert.match(startup(), /addEventListener\('orientationchange',refreshStartupControlsBox\)/);
});

test('selection cleanup combines transitionend with an idempotent safety fallback', () => {
  const source=startup();
  assert.match(source, /let cleaned=false/);
  assert.match(source, /if\(cleaned\)return;[\s\S]*cleaned=true/);
  assert.match(source, /let fallbackTimer=null/);
  assert.match(source, /if\(fallbackTimer!==null\)clearTimeout\(fallbackTimer\)/);
  assert.match(source, /addEventListener\('transitionend'/);
  assert.match(source, /propertyName==='transform'/);
  assert.match(source, /fallbackTimer=setTimeout\(cleanup,fallbackDelay\)/);
  assert.ok(source.indexOf("addEventListener('transitionend'") < source.indexOf("rotor.classList.add('is-open')"));
  assert.match(source, /gate\.hidden=true/);
  assert.match(source, /controls\.classList\.remove\('frameStartupControls--opening'\)/);
  assert.match(css(), /startupAccessRotor\{transition-duration:120ms!important/);
  assert.doesNotMatch(read('js/app.js'), /setTimeout\(finishGate/);
});

test('the flip preserves its mechanical press pause and reduced-motion-aware timing', () => {
  const source=startup();
  assert.match(source, /const ACCESS_FLIP_MS=850/);
  assert.match(source, /const ACCESS_REDUCED_FLIP_MS=120/);
  assert.match(source, /const ACCESS_PRESS_DELAY_MS=19[0-9]/);
  assert.match(source, /const ACCESS_FALLBACK_MARGIN_MS=250/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /flipDuration=reducedMotion\?ACCESS_REDUCED_FLIP_MS:ACCESS_FLIP_MS/);
  assert.match(source, /fallbackDelay=ACCESS_PRESS_DELAY_MS\+flipDuration\+ACCESS_FALLBACK_MARGIN_MS/);
  assert.match(source, /setTimeout\(\(\)=>\{[\s\S]*?rotor\.classList\.add\('is-open'\);\s*\},ACCESS_PRESS_DELAY_MS\)/);
});

test('AST-058 versions and uniquely precaches the corrected panel', () => {
  const sw=read('service-worker.js'); const index=read('index.html'); const app=read('js/app.js');
  assert.match(app, /APP_VERSION='3\.6\.55'/);
  assert.match(sw, /CACHE_NAME='budde-3-6-55'/);
  assert.equal((sw.match(/assets\/frame\/startup-access-panel\.png\?v=ast058/g)||[]).length,1);
  assert.doesNotMatch(`${startup()}\n${sw}`, /startup-access-panel\.png\?v=ast05[5-7]/);
  assert.match(index, /frame-system-v2\.css\?v=ast058/);
  assert.match(index, /startup-gate\.js\?v=ast058/);
});
