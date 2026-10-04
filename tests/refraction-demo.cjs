const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage();await page.goto(pathToFileURL(path.join(__dirname,'../docs/EYES_REFRACTION.html')).href);
  const original=await page.locator('.content').allTextContents();
  for(const width of [390,1363])for(const scale of ['50','100','200'])for(const background of ['neutral','light','dark']){
   await page.setViewportSize({width,height:1000});await page.locator('#scale').selectOption(scale);await page.locator('#background').selectOption(background);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}/${scale}/${background}`);
   assert.ok(await page.locator('main button').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>=44)));
   assert.deepEqual(await page.locator('.content').allTextContents(),original);
   assert.ok(await page.locator('.content').evaluateAll(es=>es.every(e=>getComputedStyle(e).filter==='none')));
   const contrast=await page.locator('.preview>strong,.content small,main button:not(:disabled)').evaluateAll(es=>{
    const rgb=s=>s.match(/[\d.]+/g).map(Number),lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
    return es.map(e=>{let parent=e;while(rgb(getComputedStyle(parent).backgroundColor)[3]===0)parent=parent.parentElement;const a=lum(rgb(getComputedStyle(e).color)),b=lum(rgb(getComputedStyle(parent).backgroundColor));return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
   });assert.ok(contrast.every(v=>v>=4.5),`${width}/${scale}/${background} contrast ${contrast}`);
  }
  await page.setViewportSize({width:1363,height:900});await page.locator('#scale').selectOption('100');await page.locator('#background').selectOption('neutral');
  assert.equal(await page.locator('.edge').first().evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  const corner=()=>page.locator('.glass-edge .edge').evaluate(e=>({display:getComputedStyle(e,'::before').display,border:getComputedStyle(e,'::before').borderTopWidth,filter:getComputedStyle(e).filter}));
  assert.equal((await corner()).border,'2px');assert.equal((await corner()).filter,'none');
  await page.locator('#depth').uncheck();assert.equal((await corner()).display,'none');await page.locator('#depth').check();assert.notEqual((await corner()).display,'none');
  await page.locator('#effects').uncheck();assert.ok(await page.locator('.edge').evaluateAll(es=>es.every(e=>getComputedStyle(e).display==='none')));await page.locator('#effects').check();
  await page.locator('.glass-edge button').first().click();assert.match(await page.locator('output').textContent(),/已响应/);
  assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
  fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});await page.screenshot({path:path.join(__dirname,'artifacts/eyes-glass-edge-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:900});await page.screenshot({path:path.join(__dirname,'artifacts/eyes-glass-edge-phone.png'),fullPage:true});
  console.log('PASS standalone glass edge: 18 layout/background/scale combinations, controls, fixed touch height, decoration rollback and no animations; no game or GPU proof');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
