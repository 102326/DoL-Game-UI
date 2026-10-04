const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage();await page.goto(pathToFileURL(path.join(__dirname,'../docs/EYES_BUTTON_DEPTH.html')).href);
  const button=page.locator('.depth:not(:disabled)'),edge=()=>button.evaluate(e=>{const s=getComputedStyle(e,'::before');return{opacity:Number(s.opacity),content:s.content,pointer:s.pointerEvents,transition:s.transitionDuration,filter:s.filter}});
  const original=await page.locator('main').innerText();
  for(const width of [390,1363])for(const scale of ['50','100','200'])for(const background of ['neutral','light','dark']){
   await page.setViewportSize({width,height:1000});await page.locator('#scale').selectOption(scale);await page.locator('#background').selectOption(background);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}/${scale}/${background}`);
   assert.ok(await page.locator('main button').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>=44)));
   assert.equal(await page.locator('main').innerText(),original);
   const contrast=await page.locator('main button:not(:disabled),.note').evaluateAll(es=>{
    const rgb=s=>s.match(/[\d.]+/g).map(Number),lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
    return es.map(e=>{let parent=e;while(rgb(getComputedStyle(parent).backgroundColor)[3]===0)parent=parent.parentElement;const a=lum(rgb(getComputedStyle(e).color)),b=lum(rgb(getComputedStyle(parent).backgroundColor));return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
   });assert.ok(contrast.every(v=>v>=4.5),`contrast ${contrast}`);
  }
  await page.setViewportSize({width:1363,height:900});await page.locator('#scale').selectOption('100');await page.locator('#background').selectOption('neutral');
  assert.equal((await edge()).opacity,0);assert.equal((await edge()).pointer,'none');assert.equal((await edge()).filter,'none');
  const before=await button.boundingBox();await button.focus();await page.waitForTimeout(200);assert.equal((await edge()).opacity,.65);
  await page.keyboard.press('Enter');assert.match(await page.locator('output').textContent(),/B .*已响应/);
  const rect=await button.boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.waitForTimeout(150);assert.equal((await edge()).opacity,1);
  assert.deepEqual(await button.boundingBox(),before);
  fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});await page.screenshot({path:path.join(__dirname,'artifacts/eyes-button-depth-pressed.png'),fullPage:true});
  await page.mouse.up();await page.locator('#scale').focus();await page.waitForTimeout(220);assert.equal((await edge()).opacity,0);assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  assert.equal(await page.locator('.depth:disabled').evaluate(e=>getComputedStyle(e,'::before').content),'none');
  await page.locator('#effects').uncheck();assert.equal((await edge()).content,'none');await page.locator('#effects').check();
  await page.locator('#motion').uncheck();assert.equal((await edge()).transition,'0s');await page.locator('#motion').check();
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal((await edge()).transition,'0s');await button.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');assert.equal((await edge()).opacity,.65);await page.locator('#scale').focus();assert.equal((await edge()).opacity,0);
  await page.screenshot({path:path.join(__dirname,'artifacts/eyes-button-depth-desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:900});await page.screenshot({path:path.join(__dirname,'artifacts/eyes-button-depth-phone.png'),fullPage:true});
  console.log('PASS button depth: 18 layout/scale/background combinations, stable hit box, keyboard/click, disabled/off/reduced-motion fallback and idle stop; standalone only');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
