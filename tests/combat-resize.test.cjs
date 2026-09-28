const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path');
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
  for(const width of [1363,700,690,390,844,1704,1363]){
   await page.setViewportSize({width,height:876});await settle();
   const layout=await page.evaluate(()=>{const footer=document.querySelector('.dcu-footer'),r=footer.getBoundingClientRect();return{height:footer.offsetHeight,reserve:document.querySelector('.dcu-bottom-reserve').offsetHeight,left:r.left,right:r.right,bottom:r.bottom}});
   assert.equal(layout.reserve,layout.height+16);assert.ok(layout.left>=-1&&layout.right<=width+1);assert.ok(Math.abs(layout.bottom-876)<2);
  }
  // Pending layout work must not recreate a dock or spacer after fallback/destroy.
  await page.evaluate(()=>{document.querySelector('.dcu-root').style.width='80%';DoLCombatUI.setEnabled(false)});await settle();
  assert.equal(await page.locator('.dcu-bottom-reserve,.dcu-footer').count(),0);
  await page.evaluate(()=>DoLCombatUI.setEnabled(true));await page.waitForSelector('.dcu-footer');await settle();
  await page.evaluate(()=>{document.querySelector('.dcu-root').style.width='75%';DoLCombatUI.destroy()});await settle();
  assert.equal(await page.locator('.dcu-bottom-reserve,.dcu-footer').count(),0);
  assert.deepEqual(await page.evaluate(()=>resizeErrors),[]);
  console.log('PASS ResizeObserver errors absent, responsive dock/reserve bounds, fallback and destroy cleanup.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
