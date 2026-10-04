const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1363,height:876}});
  await page.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);
  const boundary=await browser.newPage();
  await boundary.setContent('<html data-dol-midnight data-dgu-visual="2" data-dgu-visualGlow><body><aside id="sidebar"><button>Sidebar</button></aside><section id="modhub"><button>Unknown mod</button></section><section class="dgs-host">Owned</section></body></html>');
  const outside=()=>boundary.evaluate(()=>['sidebar','modhub'].flatMap(id=>[document.getElementById(id),document.querySelector('#'+id+' button')]).map(e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor,font:getComputedStyle(e).fontSize})));
  const before=await outside();await boundary.addStyleTag({path:path.join(__dirname,'../src/theme/eyes.css')});assert.deepEqual(await outside(),before);await boundary.close();
  const overlay=await browser.newPage();
  await overlay.setContent('<html data-dol-midnight data-dgu-visualGlass><head><style>#customOverlay{background-color:rgb(60,60,60)}</style></head><body><div id="customOverlay" data-overlay="saves"><div id="customOverlayContent"><div id="saveList"><section class="dgs-host"></section></div></div></div></body></html>');
  await overlay.addStyleTag({path:path.join(__dirname,'../src/theme/eyes.css')});
  assert.equal(await overlay.locator('#customOverlayContent').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(31, 33, 37, 0.78)');
  await overlay.locator('#customOverlay').evaluate(e=>e.dataset.overlay='modloader');
  assert.equal(await overlay.locator('#customOverlay').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(60, 60, 60)');
  await overlay.locator('#customOverlay').evaluate(e=>e.dataset.overlay='saves');await overlay.locator('.dgs-host').evaluate(e=>e.remove());
  assert.equal(await overlay.locator('#customOverlayContent').evaluate(e=>getComputedStyle(e).getPropertyValue('--dgu-accent')),'');await overlay.close();
  await page.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
  await page.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
  await page.waitForSelector('.dcu-footer');
  await page.evaluate(()=>{
   const samples=document.createElement('section');samples.id='eyes-samples';samples.style='padding:12px';
   samples.innerHTML='<section class="dgs-host"><button class="dgs-item" aria-pressed="true">存档 · 当前选中 <small>游戏内时间：第182天</small></button><button class="dgs-item dgs-recent" aria-pressed="false">最近保存 <span class="dgs-recent-badge">最近</span></button></section><section class="dgw-root"><div class="dgw-shell"><header class="dgw-header"><h2>衣柜</h2></header><div class="dgw-slots"><button aria-pressed="true">上装</button><button>下装</button></div><button class="dgw-item" aria-pressed="false">示例衣物 <small>耐久100%</small></button></div></section>';
   document.querySelector('#passages').prepend(samples);
   window.eyesNodes=[...document.querySelectorAll('.dcu-root input,.dcu-footer a')];
  });
  const report=await page.evaluate(()=>{
   const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);
   const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
   return ['.dgs-item[aria-pressed=true]','.dgs-item small','.dgw-item','.dgw-item small','.dcu-nav button','.dcu-control-slot #next a'].map(selector=>{
    const e=document.querySelector(selector);if(!e)throw Error('Missing '+selector);const s=getComputedStyle(e);let b=e;
    while(getComputedStyle(b).backgroundColor==='rgba(0, 0, 0, 0)')b=b.parentElement;
    const fg=lum(rgb(s.color)),bg=lum(rgb(getComputedStyle(b).backgroundColor));
    return{selector,color:s.color,background:getComputedStyle(b).backgroundColor,contrast:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)};
   });
  });
  assert.ok(report.every(r=>r.contrast>=4.5),JSON.stringify(report));
  await page.waitForTimeout(160); // Native action background transitions settle after mounting.
  const commands=await page.locator('.dcu-group label').evaluateAll(nodes=>nodes.map(e=>{const s=getComputedStyle(e);return{checked:!!e.querySelector('input:checked'),background:s.backgroundColor,shadow:s.boxShadow,height:e.getBoundingClientRect().height,radio:getComputedStyle(e.querySelector('input')).accentColor}}));
  assert.ok(commands.length>0);assert.ok(commands.every(s=>s.shadow==='none'&&s.height>=44&&s.radio==='rgb(141, 199, 255)'),JSON.stringify(commands));
  assert.ok(commands.filter(s=>!s.checked).every(s=>s.background==='rgba(0, 0, 0, 0)'));
  assert.ok(commands.filter(s=>s.checked).every(s=>s.background==='rgba(141, 199, 255, 0.035)'),JSON.stringify(commands.filter(s=>s.checked)));
  await page.waitForTimeout(160); // Existing native link color transition.
  const mode=await page.locator('#replaceAction>a').first().evaluate(e=>{const s=getComputedStyle(e);return{color:s.color,bg:s.backgroundColor,height:e.getBoundingClientRect().height}});
  const modeRGB=mode.color.match(/\d+/g).map(Number);assert.ok(Math.min(...modeRGB)>=220&&Math.max(...modeRGB)-Math.min(...modeRGB)<10,'native mode text remains neutral');assert.equal(mode.bg,'rgba(255, 255, 255, 0.035)');assert.ok(mode.height>=44);
  const decoration=()=>page.evaluate(()=>({pattern:getComputedStyle(document.querySelector('.dgw-header')).backgroundImage,edge:getComputedStyle(document.querySelector('.dgs-item[aria-pressed=true]'),'::after').content,animation:getComputedStyle(document.querySelector('.dgs-item[aria-pressed=true]'),'::after').animationName}));
  const geometry=()=>page.locator('.dgw-header').evaluate(e=>({width:e.offsetWidth,height:e.offsetHeight}));
  const plain=await geometry();
  await page.evaluate(()=>DoLGameUI.setPreference('visualPattern',true));
  assert.notEqual((await decoration()).pattern,'none');assert.deepEqual(await geometry(),plain);
  assert.equal((await decoration()).edge,'none'); // Static pattern is available even at tier 0.
  await page.evaluate(()=>DoLGameUI.setPreference('visualTier',2));
  assert.equal((await decoration()).animation,'dgu-eyes-edge');
  await page.locator('.dcu-nav button').first().evaluate(e=>e.setAttribute('aria-current','location'));
  const navSurface=await page.locator('.dcu-nav button').first().evaluate(e=>{const s=getComputedStyle(e);return{image:s.backgroundImage,shadow:s.boxShadow}});
  assert.equal(navSurface.image,'none');assert.equal(navSurface.shadow,'rgb(141, 199, 255) 0px -2px 0px 0px inset');
  await page.waitForTimeout(500);
  assert.equal(await page.locator('.dgs-item[aria-pressed=true]').evaluate(e=>getComputedStyle(e,'::after').opacity),'0');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal((await decoration()).edge,'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const key of ['visualMotion','visualGlow']){
   await page.evaluate(key=>DoLGameUI.setPreference(key,false),key);assert.equal((await decoration()).edge,'none');
   await page.evaluate(key=>DoLGameUI.setPreference(key,true),key);
  }
  await page.evaluate(()=>DoLGameUI.setPreference('visualPattern',false));assert.equal((await decoration()).pattern,'none');
  await page.evaluate(()=>DoLGameUI.setPreference('visualPattern',true));
  // Local light follows hover/focus/press without changing control identity or geometry.
  const light=page.locator('.dgw-slots button').nth(1);
  const lightImage=()=>light.evaluate(e=>getComputedStyle(e).backgroundImage);
  const lightSize=()=>light.evaluate(e=>[e.offsetWidth,e.offsetHeight]);
  const lightBefore=await lightSize();
  await light.hover();assert.notEqual(await lightImage(),'none');assert.deepEqual(await lightSize(),lightBefore);
  await page.evaluate(()=>DoLGameUI.setPreference('visualGlow',false));assert.equal(await lightImage(),'none');
  await page.evaluate(()=>DoLGameUI.setPreference('visualGlow',true));
  await page.evaluate(()=>DoLGameUI.setPreference('visualTier',0));assert.equal(await lightImage(),'none');
  await page.evaluate(()=>DoLGameUI.setPreference('visualTier',2));
  await light.evaluate(e=>e.disabled=true);assert.equal(await lightImage(),'none');await light.evaluate(e=>e.disabled=false);
  await page.mouse.move(0,0);
  const lightBox=await light.boundingBox();await page.mouse.move(lightBox.x+lightBox.width/2,lightBox.y+lightBox.height/2);await page.mouse.down();assert.notEqual(await lightImage(),'none');await page.mouse.up();await page.mouse.move(0,0);
  await page.keyboard.press('Tab');await light.focus();assert.equal(await light.evaluate(e=>e.matches(':focus-visible')),true);assert.notEqual(await lightImage(),'none');
  // Bound the gradient at its brightest endpoint over actual opaque button colors.
  const litContrast=[];
  for(const selector of ['.dgw-slots button[aria-pressed=true]','.dgw-slots button[aria-pressed=false]','.dcu-nav button']){
   const button=selector.includes('aria-pressed=false')?light:page.locator(selector).first();await button.focus();
   litContrast.push(await button.evaluate(e=>{
    const s=getComputedStyle(e),rgb=v=>v.match(/[\d.]+/g).slice(0,3).map(Number),lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
    const bg=rgb(s.backgroundColor).map((v,i)=>v*.88+[141,199,255][i]*.12),a=lum(rgb(s.color)),b=lum(bg);
    return{background:s.backgroundColor,image:s.backgroundImage,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
   }));
  }
  assert.ok(litContrast.every(s=>s.background.startsWith('rgb(')&&s.image.includes('0.12')&&s.contrast>=4.5),JSON.stringify(litContrast));
  console.log('PASS selected/unselected local light maximum-alpha contrast',litContrast);
  await light.focus();
  await page.emulateMedia({reducedMotion:'reduce'});assert.notEqual(await lightImage(),'none');assert.equal(await light.evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});await light.evaluate(e=>e.blur());
  for(const width of [390,1363]){
   await page.setViewportSize({width,height:876});
   for(const scale of [50,100,200]){
    await page.evaluate(scale=>{DoLGameUI.setPreference('fontScale',scale);DoLGameUI.setPreference('buttonScale',scale)},scale);
    assert.ok(await page.locator('#eyes-samples').evaluate(e=>e.scrollWidth<=e.clientWidth+1),`sample overflow ${width}/${scale}`);
    assert.ok(await page.locator('.dcu-footer').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1}),`dock overflow ${width}/${scale}`);
   }
   await page.evaluate(()=>{DoLGameUI.setPreference('fontScale',100);DoLGameUI.setPreference('buttonScale',100)});
   assert.equal(await page.evaluate(()=>eyesNodes.every(n=>n.isConnected)),true);
   assert.ok(await page.locator('#eyes-samples').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});await page.screenshot({path:path.join(__dirname,`artifacts/eyes-three-pages-${width}.png`),fullPage:true});
  }
  await page.evaluate(()=>DoLGameUI.setPreference('enabled',false));
  assert.equal((await decoration()).pattern,'none');assert.equal((await decoration()).edge,'none');
  assert.notEqual(await page.locator('.dgs-host').evaluate(e=>getComputedStyle(e).getPropertyValue('--dgu-accent').trim()),'#8dc7ff');
  await page.evaluate(()=>DoLGameUI.destroy());assert.equal(await page.evaluate(()=>document.documentElement.hasAttribute('data-dgu-visualpattern')),false);
  await page.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().visualPattern),true);
  console.log('PASS computed text contrast, owned-region palette, node identity and synthetic narrow/wide layout',report);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
