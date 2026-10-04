const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1363,height:876}});
 await p.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
 await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 const info=()=>p.locator('#dol-midnight-controls').evaluate(d=>{const h=d.querySelector('header'),s=getComputedStyle(h);return{blur:s.backdropFilter,rootBlur:getComputedStyle(d).backdropFilter,rootBackground:getComputedStyle(d).backgroundColor,contentBackground:getComputedStyle(d.querySelector('.dmt-controls-content')).backgroundColor,cards:[...d.querySelectorAll('.dmt-setting-card')].every(e=>getComputedStyle(e).backgroundColor==='rgb(41, 43, 48)'),position:s.position,overflow:d.scrollWidth>d.clientWidth+1,glint:getComputedStyle(h,'::after').animationName,pointer:getComputedStyle(h,'::after').pointerEvents,openAnimation:getComputedStyle(d).animationName}});
 for(const width of [390,1363])for(const scale of [50,100,200])for(const tier of [0,1,2]){
  await p.setViewportSize({width,height:876});
  await p.evaluate(({scale,tier})=>{document.querySelector('#dol-midnight-controls')?.close();DoLGameUI.setPreference('fontScale',scale);DoLGameUI.setPreference('buttonScale',scale);DoLGameUI.setPreference('visualTier',tier);DoLGameUI.setPreference('visualGlass',true);DoLGameUI.setPreference('visualMotion',true);DoLGameUI.openSettings()}, {scale,tier});
  const s=await info();assert.equal(s.blur,'none');assert.equal(s.rootBlur,['none','blur(24px)','blur(24px)'][tier]);assert.equal(s.rootBackground,['rgb(28, 29, 32)','rgba(36, 38, 42, 0.78)','rgba(36, 38, 42, 0.74)'][tier]);assert.equal(s.contentBackground,tier===0?s.rootBackground:'rgba(31, 33, 37, 0.78)');assert.ok(s.cards);assert.equal(s.position,'sticky');assert.equal(s.overflow,false);
  assert.equal(s.glint,tier===2?'dgu-drawer-glint':'none');if(tier===2)assert.equal(s.pointer,'none');if(tier===0)assert.equal(s.openAnimation,'none');
  await p.locator('#dol-midnight-controls').evaluate(e=>e.scrollTop=200);
  const bounds=await p.locator('#dol-midnight-controls').evaluate(e=>({top:e.getBoundingClientRect().top,header:e.querySelector('header').getBoundingClientRect().top}));assert.ok(Math.abs(bounds.top-bounds.header)<2,'header remains pinned');
 }
 await p.waitForTimeout(500);assert.equal(await p.locator('#dol-midnight-controls header').evaluate(e=>getComputedStyle(e,'::after').opacity),'0');
 await p.evaluate(()=>DoLGameUI.setPreference('visualGlass',false));assert.equal((await info()).blur,'none');assert.equal((await info()).glint,'none');
 await p.evaluate(()=>{DoLGameUI.setPreference('visualGlass',true);DoLGameUI.setPreference('visualMotion',false)});assert.equal((await info()).openAnimation,'none');assert.equal((await info()).glint,'none');
 await p.evaluate(()=>DoLGameUI.setPreference('visualMotion',true));await p.emulateMedia({reducedMotion:'reduce'});assert.equal((await info()).openAnimation,'none');assert.equal((await info()).glint,'none');
 // Conservative text contrast with the Acrylic tint composited over white.
 for(const alpha of [.78,.74]) {const bg=[36,38,42].map(v=>(v*alpha+255*(1-alpha))*.965+255*.035),lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);assert.ok((lum([230,231,235])+.05)/(lum(bg)+.05)>=4.5)}
 await p.keyboard.press('Escape');assert.equal(await p.locator('#dol-midnight-controls').evaluate(e=>e.open),false);
 const secondary=await b.newPage();
 await secondary.setContent('<html data-dol-midnight data-dgu-visual="1" data-dgu-visualGlass><body><div id="customOverlay" class="dgp-overlay" data-dgp-panel="traits"><h2 id="customOverlayTitle"><div id="overlayTabs" style=""><button class="tab-selected">Traits</button></div></h2><nav class="dgp-host">Native navigation</nav><div id="customOverlayContent">Native content</div></div></body></html>');
 await secondary.addStyleTag({content:'#overlayTabs{background:rgb(31,31,31)}'});
 await secondary.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
 assert.equal(await secondary.locator('#overlayTabs').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 // Owned navigation only: weak edge survives pointer/focus, native inputs stay native.
 await secondary.locator('nav').evaluate(e=>{e.innerHTML='<div class="dgp-navigation"><button id="nav-test">Navigate</button><select id="nav-select"><option>A</option><option>B</option></select></div>';window.navNodes=[...e.querySelectorAll('*')];window.navParents=navNodes.map(n=>n.parentNode)});
 const quietControl=()=>secondary.locator('#nav-test').evaluate(e=>{const s=getComputedStyle(e);return{radius:s.borderTopLeftRadius,border:s.borderTopColor,blur:s.backdropFilter,height:e.getBoundingClientRect().height}});
 for(const [kind,prefix] of [['traits','dgp'],['social','dgs'],['characteristics','dgc']]){
  await secondary.locator('#customOverlay').evaluate((e,{kind,prefix})=>{e.className=prefix+'-overlay';delete e.dataset.dgpPanel;delete e.dataset.overlay;if(prefix==='dgp')e.dataset.dgpPanel=kind;else e.dataset.overlay=kind;e.querySelector('nav').className=prefix+'-host';e.querySelector('nav>div').className=prefix+'-navigation'},{kind,prefix});
  for(const tier of [0,1,2]){
   await secondary.locator('html').evaluate((e,tier)=>{e.dataset.dguVisual=String(tier);e.toggleAttribute('data-dgu-visualGlass',tier>0)},tier);
   await secondary.mouse.move(0,0);await secondary.waitForTimeout(180);
   const c=await quietControl();assert.equal(c.radius,'8px');assert.ok(['rgba(255, 255, 255, 0.07)','rgba(0, 0, 0, 0)'].includes(c.border),'Solid has a weak edge; existing glass navigation keeps its transparent edge');assert.equal(c.blur,'none');assert.ok(c.height>=44);
   await secondary.locator('#nav-test').hover();await secondary.waitForTimeout(180);assert.equal((await quietControl()).border,c.border,'Hover must not light the entire border');
   await secondary.keyboard.press('Tab');await secondary.locator('#nav-test').focus();
   assert.equal(await secondary.locator('#nav-test').evaluate(e=>getComputedStyle(e).outlineStyle),'solid','Keyboard focus remains visible');
  }
 }
 assert.ok(await secondary.evaluate(()=>navNodes.every((n,i)=>n.isConnected&&n.parentNode===navParents[i])));
 await secondary.mouse.move(0,0); // Do not carry the navigation Hover into later save fixtures.
 await secondary.locator('#customOverlay').evaluate(e=>{e.dataset.overlay='modloader';e.querySelector('nav').remove()});
 assert.notEqual(await secondary.locator('#overlayTabs button').evaluate(e=>getComputedStyle(e).borderTopLeftRadius),'8px','Owned control rules release with the host');
 await secondary.locator('#customOverlay').evaluate(e=>{e.className='dgp-overlay';delete e.dataset.overlay;e.dataset.dgpPanel='traits';const nav=document.createElement('nav');nav.className='dgp-host';nav.textContent='Native navigation';e.querySelector('#customOverlayContent').before(nav)});
 await secondary.locator('html').evaluate(e=>{e.dataset.dguVisual='1';e.setAttribute('data-dgu-visualGlass','')});
 for(const kind of ['traits','statistics','feats','journal','settings','cheats','attitudes']) {await secondary.locator('#customOverlay').evaluate((e,k)=>e.dataset.dgpPanel=k,kind);assert.equal(await secondary.locator('#customOverlay').evaluate(e=>getComputedStyle(e).backdropFilter),'blur(24px)');assert.equal(await secondary.locator('#customOverlayContent').evaluate(e=>getComputedStyle(e).backdropFilter),'none');assert.equal(await secondary.locator('#customOverlayContent').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(31, 33, 37, 0.78)')}
 await secondary.locator('#customOverlay').evaluate(e=>{e.className='dgs-overlay';e.dataset.overlay='social';delete e.dataset.dgpPanel;e.querySelector('nav').className='dgs-host'});assert.equal(await secondary.locator('#customOverlay').evaluate(e=>getComputedStyle(e).backdropFilter),'blur(24px)');
 const body=await secondary.locator('#customOverlayContent').evaluate(e=>({image:getComputedStyle(e).backgroundImage,filter:getComputedStyle(e).filter}));assert.ok(body.image.includes('linear-gradient'));assert.equal(body.filter,'none');
 // Attribute overlays share the same shell; ownership and switches must release it.
 await secondary.locator('#customOverlay').evaluate(e=>{e.className='dgc-overlay';e.dataset.overlay='characteristics';e.querySelector('nav').className='dgc-host';e.querySelector('#customOverlayContent').innerHTML='<div class="characteristic-box">Readable native card</div>'});
 const material=()=>secondary.evaluate(()=>{const css=s=>getComputedStyle(document.querySelector(s));return{shell:css('#customOverlay').backgroundColor,blur:css('#customOverlay').backdropFilter,body:css('#customOverlayContent').backgroundColor,bodyBlur:css('#customOverlayContent').backdropFilter,card:css('.characteristic-box').backgroundColor,cardBlur:css('.characteristic-box').backdropFilter,cardBorder:css('.characteristic-box').borderColor}});
 for(const tier of [1,2]) {
  await secondary.locator('html').evaluate((e,tier)=>e.dataset.dguVisual=String(tier),tier);
  const m=await material();assert.equal(m.shell,tier===1?'rgba(36, 38, 42, 0.78)':'rgba(36, 38, 42, 0.74)');assert.equal(m.blur,'blur(24px)');assert.equal(m.body,'rgba(31, 33, 37, 0.78)');assert.equal(m.bodyBlur,'none');assert.equal(m.card,'rgb(41, 43, 48)');assert.equal(m.cardBlur,'none');assert.equal(m.cardBorder,'rgba(0, 0, 0, 0)');
 }
 await secondary.locator('html').evaluate(e=>e.removeAttribute('data-dgu-visualGlass'));assert.equal((await material()).blur,'none');
 await secondary.locator('html').evaluate(e=>{e.dataset.dguVisual='0';e.removeAttribute('data-dgu-visualGlass')});assert.equal((await material()).blur,'none');
 await secondary.locator('html').evaluate(e=>{e.dataset.dguVisual='1';e.setAttribute('data-dgu-visualGlass','')});
 await secondary.locator('#customOverlay').evaluate(e=>{e.className='dgs-overlay';e.dataset.overlay='social';e.querySelector('nav').className='dgs-host'});
 await secondary.locator('#customOverlay').evaluate(e=>e.dataset.overlay='modloader');assert.equal(await secondary.locator('#overlayTabs').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(31, 31, 31)');assert.equal(await secondary.locator('#customOverlay').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
 await secondary.locator('#customOverlay').evaluate(e=>{e.dataset.overlay='social';e.querySelector('nav').remove()});assert.equal(await secondary.locator('#customOverlay').evaluate(e=>getComputedStyle(e).backdropFilter),'none');await secondary.setContent('<html data-dol-midnight data-dgu-visual="2" data-dgu-visualGlass><body><div id="customOverlay" data-overlay="saves"><div id="customOverlayTitle"><div id="overlayTabs"><button class="tab-selected">Saves</button></div></div><div id="customOverlayContent"><div id="saveList"><section class="dgs-host"><button class="dgs-item" aria-pressed="true">Existing save</button><dialog open class="dgs-detail dgs-inline-detail">Inline detail</dialog></section></div></div></div></body></html>');
 await secondary.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
 assert.equal(await secondary.locator('#customOverlay').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(36, 38, 42, 0.64)');
 assert.equal(await secondary.locator('#customOverlay').evaluate(e=>getComputedStyle(e).backdropFilter),'blur(24px)');
 assert.equal(await secondary.locator('#customOverlayContent').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
 assert.equal(await secondary.locator('.dgs-item').evaluate(e=>getComputedStyle(e).borderColor),'rgba(0, 0, 0, 0)');
 assert.equal(await secondary.locator('.dgs-inline-detail').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
 // Same floating save surface, stable text and quiet selection across tiers/switches.
 await secondary.locator('.dgs-detail').evaluate(e=>{e.classList.remove('dgs-inline-detail');e.innerHTML='<h2>Detail</h2><dl><dt>Date</dt><dd>Example</dd></dl><p class="dgs-description">A long readable summary.</p><div class="dgs-actions"><button>Read</button><button class="dgs-delete">Delete</button></div>'});
 for(const tier of [0,1,2])for(const glass of [false,true]) {
  await secondary.locator('html').evaluate((e,{tier,glass})=>{e.dataset.dguVisual=String(tier);e.toggleAttribute('data-dgu-visualGlass',glass&&tier>0);e.toggleAttribute('data-dgu-visualGlow',tier>0)},{tier,glass});
  const s=await secondary.evaluate(()=>{const css=s=>getComputedStyle(document.querySelector(s));return{shellBlur:css('#customOverlay').backdropFilter,drawerBlur:css('.dgs-detail').backdropFilter,drawerBase:css('.dgs-detail').backgroundColor,bodyBlur:css('#customOverlayContent').backdropFilter,summaryBlur:css('.dgs-description').backdropFilter,selection:css('.dgs-item').backgroundColor,edge:css('.dgs-item').borderColor,itemBlur:css('.dgs-item').backdropFilter,dockBlur:css('.dgs-actions').backdropFilter}});
  assert.equal(s.shellBlur,glass&&tier>0?['none','blur(24px)','blur(24px)'][tier]:'none');
  assert.equal(s.drawerBlur,glass&&tier>0?['none','blur(24px)','blur(24px)'][tier]:'none');
  if(glass&&tier>0){assert.equal(s.drawerBase,['','rgba(40, 42, 46, 0.58)','rgba(40, 42, 46, 0.54)'][tier]);assert.ok(await secondary.locator('.dgs-detail').evaluate(e=>getComputedStyle(e).backgroundImage.startsWith('linear-gradient(')&&!getComputedStyle(e).backgroundImage.includes('128deg')),'save edge lighting is vertical; no diagonal reference-background bands');}
  for(const key of ['bodyBlur','summaryBlur','itemBlur','dockBlur'])assert.equal(s[key],'none',key);
  assert.equal(s.selection,'rgb(43, 48, 54)');assert.equal(s.edge,'rgba(0, 0, 0, 0)');
 }
 await secondary.locator('.dgs-detail').evaluate(e=>e.classList.add('dgs-inline-detail'));
 await secondary.locator('html').evaluate(e=>{e.dataset.dguVisual='2';e.setAttribute('data-dgu-visualGlass','')});
 assert.equal(await secondary.locator('.dgs-detail h2').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
 await secondary.locator('.dgs-host').evaluate(e=>{const search=document.createElement('div');search.className='dgs-search';search.innerHTML='<button>＋ Create a new save</button><input aria-label="Search" placeholder="Search current saves">';e.prepend(search)});
 await secondary.addStyleTag({content:'.dgs-host{width:400px;font-size:32px}'});
 assert.ok(await secondary.locator('.dgs-search').evaluate(e=>{const input=e.querySelector('input'),r=input.getBoundingClientRect(),button=e.querySelector('button').getBoundingClientRect();return r.width>=350&&r.top>=button.bottom&&e.scrollWidth<=e.clientWidth+1}),'large text search wraps onto a readable full row');
 await secondary.locator('html').evaluate(e=>e.setAttribute('data-dgu-visualMotion',''));
 assert.equal(await secondary.locator('#customOverlay').evaluate(e=>getComputedStyle(e).animationName),'dgu-save-shell-in');
 assert.equal(await secondary.locator('.dgs-inline-detail').evaluate(e=>getComputedStyle(e).animationName),'none');
 await secondary.emulateMedia({reducedMotion:'reduce'});assert.equal(await secondary.locator('#customOverlay').evaluate(e=>getComputedStyle(e).animationName),'none');
 await secondary.emulateMedia({reducedMotion:'no-preference'});await secondary.locator('html').evaluate(e=>e.removeAttribute('data-dgu-visualMotion'));assert.equal(await secondary.locator('#customOverlay').evaluate(e=>getComputedStyle(e).animationName),'none');
 await secondary.locator('#customOverlay').evaluate(e=>e.dataset.overlay='modloader');assert.equal(await secondary.locator('#customOverlay').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
 // Internal content keeps the social-card surface without glass; nested rows
 // lose their boxes without changing native controls, colours or dimensions.
 await secondary.setContent('<html data-dol-midnight data-dgu-visual="0"><body><div id="customOverlay" class="dgp-overlay" data-dgp-panel="traits"><nav class="dgp-host"></nav><div id="customOverlayContent"><div id="traitLists"><section class="traitList"><header class="traitHeading">Traits</header><div class="traits"><div class="trait"><span style="color:rgb(180,50,50)">Native semantic text</span><input type="checkbox"></div></div></section></div><div class="foldout"><div class="foldout"><button>Native control</button></div></div></div></div></body></html>');
 await secondary.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
 const nativeControl=await secondary.locator('.trait input').elementHandle();
 const before=await secondary.locator('.trait').boundingBox();
 for(const tier of [0,1,2]) {
  await secondary.locator('html').evaluate((e,tier)=>{e.dataset.dguVisual=String(tier);e.toggleAttribute('data-dgu-visualGlass',tier>0)},tier);
  const m=await secondary.evaluate(()=>{const css=s=>getComputedStyle(document.querySelector(s));return{card:css('.traitList').backgroundColor,blur:css('.traitList').backdropFilter,row:css('.trait').backgroundColor,edge:css('.trait').borderColor,nested:css('.foldout .foldout').backgroundColor,semantic:css('.trait span').color}});
  assert.equal(m.card,'rgba(0, 0, 0, 0)');assert.equal(m.blur,'none');assert.equal(m.row,'rgb(41, 43, 48)');assert.equal(m.edge,'rgba(0, 0, 0, 0)');assert.equal(m.nested,'rgba(0, 0, 0, 0)');assert.equal(m.semantic,'rgb(180, 50, 50)');assert.deepEqual(await secondary.locator('.trait').boundingBox(),before);assert.ok(await nativeControl.evaluate(e=>e.isConnected));
 }
 await secondary.locator('#customOverlay').evaluate(e=>{e.className='';e.querySelector('nav').remove()});
 assert.equal(await secondary.locator('.traitList').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 // Other native form panels reuse the approved light rows; no node replacement.
 await secondary.setContent('<html data-dol-midnight><body><div id="customOverlay" class="dgp-overlay" data-dgp-panel="attitudes"><div id="customOverlayContent"><div class="settingsToggleItem"><label><input type="checkbox" id="original-option">Native option</label></div></div></div></body></html>');
 await secondary.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
 const nativeOption=await secondary.locator('#original-option').elementHandle();
 for(const kind of ['settings','cheats','attitudes']){
  await secondary.locator('#customOverlay').evaluate((e,kind)=>e.dataset.dgpPanel=kind,kind);
  assert.equal(await secondary.locator('.settingsToggleItem').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
  assert.notEqual(await nativeOption.evaluate(e=>getComputedStyle(e).appearance),'none');
  assert.ok(await nativeOption.evaluate(e=>e.isConnected&&e.parentElement.tagName==='LABEL'));
 }
 // Real SugarCube dialog API retains its original controls and close lifecycle.
 await p.evaluate(()=>{document.querySelector('#dol-midnight-controls')?.close();SugarCube.Dialog.setup('Native dialog');SugarCube.Dialog.append('<label><input type="checkbox" id="dialog-original">Native option</label>');SugarCube.Dialog.open()});
 const dialogOption=await p.locator('#dialog-original').elementHandle();
 for(const tier of [0,1,2]){
  await p.evaluate(t=>{DoLGameUI.setPreference('visualGlass',true);DoLGameUI.setPreference('visualTier',t)},tier);
  assert.equal(await p.locator('#ui-dialog').evaluate(e=>getComputedStyle(e).backdropFilter),tier?'blur(24px)':'none');
  assert.equal(await p.locator('#ui-dialog-body').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
  assert.ok(await dialogOption.evaluate(e=>e.isConnected));
 }
 await p.evaluate(()=>DoLGameUI.setPreference('visualGlass',false));
 assert.equal(await p.locator('#ui-dialog').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
 await p.locator('#dialog-original').check();assert.ok(await dialogOption.evaluate(e=>e.checked));
 await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>SugarCube.Dialog.isOpen()),false);
 await secondary.close();
 console.log('PASS settings Acrylic: 18 responsive combinations, solid form cards, single shell blur, sticky header, finite motion, switches, reduced-motion and Escape');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
