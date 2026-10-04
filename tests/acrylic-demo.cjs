const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage();await p.goto(pathToFileURL(path.join(__dirname,'../docs/EYES_ACRYLIC.html')).href);
  const idle=()=>p.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'),null,{timeout:2000});
  const info=()=>p.locator('dialog').evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{bg:s.backgroundColor,blur:s.backdropFilter,filter:s.filter,overflow:e.scrollWidth>e.clientWidth+1,bounds:[r.left,r.right,r.top,r.bottom],viewport:[innerWidth,innerHeight]}});
  let count=0;
  await p.locator('#motion').uncheck();
  for(const width of [390,1363])for(const scale of ['50','100','200'])for(const tier of ['0','1','2'])for(const background of ['neutral','light','dark','pattern']){
   await p.setViewportSize({width,height:876});await p.locator('#scale').selectOption(scale);await p.locator('#tier').selectOption(tier);await p.locator('#background').selectOption(background);await p.locator('#open').click();
   const s=await info();assert.equal(s.filter,'none');assert.equal(s.blur,{'0':'none','1':'blur(4px)','2':'blur(12px)'}[tier]);assert.equal(s.overflow,false);assert.ok(s.bounds[0]>=0&&s.bounds[1]<=width&&s.bounds[2]>=0&&s.bounds[3]<=876);
   assert.ok(await p.locator('dialog button').evaluateAll(es=>es.every(e=>e.offsetHeight>=44)));
   assert.equal(await p.locator('article').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(37, 38, 42)');
   // Worst white backing composited through the base; local decoration avoids text.
   const contrast=await p.locator('dialog h2,dialog p,dialog button').evaluateAll(es=>{
    const rgb=s=>s.match(/[\d.]+/g).map(Number),lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
    return es.map(e=>{const b=rgb(getComputedStyle(e.closest('dialog')).backgroundColor),bg=b.slice(0,3).map(v=>v*(b[3]??1)+255*(1-(b[3]??1))),a=lum(rgb(getComputedStyle(e).color)),c=lum(bg);return(Math.max(a,c)+.05)/(Math.min(a,c)+.05)});
   });assert.ok(contrast.every(c=>c>=4.5),JSON.stringify({width,scale,tier,contrast}));
   await p.locator('#close').click();assert.equal(await p.locator('#open').evaluate(e=>e===document.activeElement),true);count++;
  }
  await p.setViewportSize({width:1363,height:876});await p.locator('#scale').selectOption('100');await p.locator('#background').selectOption('pattern');await p.locator('#motion').check();
  fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});
  for(const tier of ['0','1','2']){
   await p.locator('#tier').selectOption(tier);await p.locator('#open').click();await idle();
   await p.screenshot({path:path.join(__dirname,`artifacts/acrylic-tier-${tier}.png`)});
   if(tier==='2'){
    assert.equal(await p.locator('dialog').evaluate(e=>getComputedStyle(e,'::after').opacity),'0');
    await p.locator('#sample-action').focus();const before=await p.locator('#sample-action').boundingBox();await p.waitForTimeout(180);
    assert.equal(await p.locator('#sample-action').evaluate(e=>getComputedStyle(e,'::before').pointerEvents),'none');
    await p.keyboard.press('Enter');assert.match(await p.locator('output').textContent(),/已响应/);
    await p.locator('#sample-action').hover();await p.mouse.down();await p.waitForTimeout(130);assert.notEqual(await p.locator('#sample-action').evaluate(e=>getComputedStyle(e,'::before').transform),'none');assert.deepEqual(await p.locator('#sample-action').boundingBox(),before);await p.mouse.up();
   }
   await p.keyboard.press('Escape');assert.equal(await p.locator('dialog').evaluate(e=>e.open),false);assert.equal(await p.locator('#open').evaluate(e=>e===document.activeElement),true);
  }
  await p.locator('#glass').uncheck();await p.locator('#open').click();assert.equal((await info()).blur,'none');assert.equal((await info()).bg,'rgb(37, 38, 42)');await p.locator('#close').click();await p.locator('#glass').check();
  await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#open').click();assert.equal(await p.locator('dialog').evaluate(e=>getComputedStyle(e,'::after').content),'none');assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  await p.mouse.click(4,4);assert.equal(await p.locator('dialog').evaluate(e=>e.open),false);
  console.log(`PASS Acrylic standalone: ${count} layout/tier/scale/background cases, solid content, contrast base, stable hitboxes, focus/click/Escape/outside close, switches and reduced-motion; no game integration or GPU proof`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
