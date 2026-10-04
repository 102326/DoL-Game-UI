const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1363,height:876}});
  await page.addInitScript(()=>{window.resizeErrors=[];addEventListener('error',e=>{if(e.message.includes('ResizeObserver'))resizeErrors.push(e.message)})});
  await page.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);
  await page.waitForSelector('#listContainer');
  await page.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
  await page.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
  await page.waitForSelector('.dcu-footer');
  const settle=()=>page.evaluate(()=>new Promise(resolve=>{let n=6;function frame(){if(--n)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)}));
  await page.evaluate(()=>{
   window.combatToolCheck={nodes:[...document.querySelectorAll('.dcu-native input,#cbtToggleMenu,#cbtToggleMenu *')],state:JSON.stringify(SugarCube.State.variables)};
   combatToolCheck.parents=combatToolCheck.nodes.map(n=>n.parentNode);
   window.nativeMenuChanges=0;document.querySelector('#fixture-control').addEventListener('change',()=>nativeMenuChanges++);
   window.nativeMenuClicks=0;document.querySelector('#cbtToggleMenu .cbtToggle').addEventListener('click',()=>nativeMenuClicks++);
   DoLGameUI.setPreference('visualMotion',false);DoLGameUI.setPreference('visualPattern',false);
  });
  await page.locator('.dcu-nav button').first().click();
  await page.locator('.dcu-summary-toggle').click();await page.waitForSelector('.dcu-summary');
  await page.mouse.move(0,0);await page.waitForTimeout(180); // Native 150ms border/hover transition.
  for(const tier of [0,1,2]){
   await page.evaluate(tier=>DoLGameUI.setPreference('visualTier',tier),tier);await settle();
   const summary=await page.locator('.dcu-summary').evaluate(e=>({blur:getComputedStyle(e).backdropFilter,bg:getComputedStyle(e).backgroundColor}));
   assert.equal(summary.blur,tier===0?'none':'blur(24px)');
   assert.equal(summary.bg,tier===0?'rgb(28, 29, 32)':`rgba(36, 38, 42, ${tier===1?'0.68':'0.64'})`);
   const tools=await page.locator('.dcu-summary-toggle,.dcu-header>button').evaluateAll(nodes=>nodes.map(e=>({border:getComputedStyle(e).borderTopColor,radius:getComputedStyle(e).borderTopLeftRadius,blur:getComputedStyle(e).backdropFilter})));
   assert.ok(tools.every(s=>s.border==='rgba(255, 255, 255, 0.07)'&&s.radius==='8px'&&s.blur==='none'),JSON.stringify(tools));
   assert.equal(await page.locator('.dcu-summary-list button[aria-current=location]').count(),1);
   assert.equal(await page.locator('.dcu-summary-list button[aria-current=location]').evaluate(e=>getComputedStyle(e).boxShadow),'rgb(141, 199, 255) 2px 0px 0px 0px inset');
   assert.equal(await page.locator('.dcu-nav button[aria-current=location]').evaluate(e=>getComputedStyle(e,'::after').content),'none');
   if(tier>0){
    const contrast=await page.evaluate(()=>{
     const rgb=s=>s.match(/[\d.]+/g).map(Number),over=(color,bg)=>{const c=rgb(color),a=c[3]??1;return c.slice(0,3).map((v,i)=>v*a+bg[i]*(1-a))};
     const shell=getComputedStyle(document.querySelector('.dcu-summary'));
     // Worst white environment, including the top gradient's .035 white light.
     const glass=over('rgba(255,255,255,.035)',over(shell.backgroundColor,[255,255,255]));
     const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
     return ['.dcu-hint','.dcu-summary-heading>span','.dcu-summary-list span','.dcu-summary-list strong'].map(selector=>{
      const e=document.querySelector(selector),s=getComputedStyle(e),bg=over(getComputedStyle(e.closest('.dcu-summary-header,.dcu-summary-list')).backgroundColor,glass),a=lum(rgb(s.color).slice(0,3)),b=lum(bg);return{selector,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
     });
    });
    assert.ok(contrast.every(s=>s.ratio>=4.5),JSON.stringify(contrast));
   }
  }
  await page.evaluate(()=>DoLGameUI.setPreference('visualGlass',false));await settle();
  assert.equal(await page.locator('.dcu-summary').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
  await page.evaluate(()=>{DoLGameUI.setPreference('visualGlass',true);DoLGameUI.setPreference('visualTier',1)});
  fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});
  await page.screenshot({path:path.join(__dirname,'artifacts/beta50-isolated-summary.png')});
  await page.locator('.dcu-summary-toggle').click();
  await page.locator('#cbtToggleMenu .cbtToggle').click();assert.equal(await page.locator('#cbtToggleMenu.visible').count(),1);
  assert.equal(await page.locator('#cbtToggleMenu').evaluate(e=>getComputedStyle(e).backdropFilter),'blur(24px)');
  assert.ok(await page.locator('#cbtToggleMenu').evaluate(menu=>[...menu.querySelectorAll('.cbtToggle,.cbtOption')].every(row=>Math.abs(row.getBoundingClientRect().width-menu.clientWidth)<2)),'Native rows must fill the reading surface without patchy inline backgrounds');
  await page.locator('#fixture-control').selectOption({index:1});assert.equal(await page.evaluate(()=>nativeMenuChanges),1);
  await page.screenshot({path:path.join(__dirname,'artifacts/beta50-isolated-menu.png')});
  await page.locator('#cbtToggleMenu .cbtToggle').click();
  assert.equal(await page.locator('#cbtToggleMenu').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
  // Alternate both tools through real clicks; neither popup may trap the other.
  await page.locator('.dcu-summary-toggle').click();
  await page.locator('#cbtToggleMenu .cbtToggle').click();
  assert.equal(await page.locator('.dcu-summary').count(),0,'Native menu must dismiss summary');
  await page.locator('.dcu-summary-toggle').click();
  assert.equal(await page.locator('#cbtToggleMenu.visible').count(),0,'Summary must close native menu through its original toggle');
  assert.equal(await page.locator('.dcu-summary').count(),1);
  await page.locator('.dcu-summary-toggle').click();
  await page.evaluate(()=>{DoLGameUI.setPreference('visualTier',2);DoLGameUI.setPreference('visualMotion',true)});
  assert.equal(await page.locator('.dcu-nav button[aria-current=location]').evaluate(e=>getComputedStyle(e,'::after').content),'none');
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [390,1363]){
   await page.setViewportSize({width,height:876});await settle();
   for(let repeat=0;repeat<3;repeat++){
    await page.locator('.dcu-summary-toggle').click();
    const clicks=await page.evaluate(()=>nativeMenuClicks);
    await page.locator('#cbtToggleMenu .cbtToggle').click();
    assert.equal(await page.locator('.dcu-summary').count(),0);
    assert.equal(await page.locator('#cbtToggleMenu.visible').count(),1);
    await page.locator('.dcu-summary-toggle').click();
    assert.equal(await page.locator('#cbtToggleMenu.visible').count(),0);
    assert.equal(await page.locator('.dcu-summary').count(),1);
    assert.equal(await page.evaluate(()=>nativeMenuClicks),clicks+2,'Exactly one original click per native open/close');
    await page.locator('.dcu-summary-toggle').click();
   }
   for(const selector of ['.dcu-summary','#cbtToggleMenu.visible']){
    const toggle=selector==='.dcu-summary'?'.dcu-summary-toggle':'#cbtToggleMenu .cbtToggle';
    await page.locator(toggle).click();await settle();
    const bounds=await page.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,animation:getComputedStyle(e).animationName}});
    assert.ok(bounds.left>=-1&&bounds.right<=width+1&&bounds.top>=0&&bounds.bottom<=877,JSON.stringify(bounds));
    assert.equal(bounds.animation,'none');await page.locator(toggle).click();
   }
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  assert.ok(await page.evaluate(()=>combatToolCheck.nodes.every((n,i)=>n.isConnected&&n.parentNode===combatToolCheck.parents[i])&&JSON.stringify(SugarCube.State.variables)===combatToolCheck.state));
  for(const width of [1363,700,690,390,844,1704,1363]){
   await page.setViewportSize({width,height:876});await settle();
   const layout=await page.evaluate(()=>{const footer=document.querySelector('.dcu-footer'),r=footer.getBoundingClientRect();return{height:footer.offsetHeight,reserve:document.querySelector('.dcu-bottom-reserve').offsetHeight,left:r.left,right:r.right,bottom:r.bottom}});
   assert.equal(layout.reserve,layout.height+16);assert.ok(layout.left>=-1&&layout.right<=width+1);assert.ok(Math.abs(layout.bottom-876)<2);
  }
  await page.evaluate(()=>{const menu=document.getElementById('cbtToggleMenu');if(!menu)throw Error('Native menu fixture missing');menu.querySelector('.cbtToggle').textContent='战斗菜单';document.documentElement.style.setProperty('--dgu-font-scale','2');document.documentElement.style.setProperty('--dgu-button-scale','2')});await settle();
  const dock=await page.evaluate(()=>{const menu=document.getElementById('cbtToggleMenu').getBoundingClientRect(),summary=document.querySelector('.dcu-summary-toggle').getBoundingClientRect();return{menuLeft:menu.left,summaryRight:summary.right}});assert.ok(dock.menuLeft>=dock.summaryRight-1,'200% native menu must not overlap summary');
  await page.evaluate(()=>{document.documentElement.style.removeProperty('--dgu-font-scale');document.documentElement.style.removeProperty('--dgu-button-scale')});await settle();
  // Pending layout work must not recreate a dock or spacer after fallback/destroy.
  await page.evaluate(()=>{document.querySelector('.dcu-root').style.width='80%';DoLCombatUI.setEnabled(false)});await settle();
  assert.equal(await page.locator('.dcu-bottom-reserve,.dcu-footer').count(),0);
  await page.evaluate(()=>DoLCombatUI.setEnabled(true));await page.waitForSelector('.dcu-footer');await settle();
  await page.evaluate(()=>{document.querySelector('.dcu-root').style.width='75%';DoLCombatUI.destroy()});await settle();
  assert.equal(await page.locator('.dcu-bottom-reserve,.dcu-footer').count(),0);
  assert.deepEqual(await page.evaluate(()=>resizeErrors),[]);
  console.log('PASS combat tools tier/glass states, native menu events and node/parent identity, unchanged state, responsive dock/reserve, fallback and destroy cleanup.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
