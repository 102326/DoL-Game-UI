const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1363,height:876}}),errors=[];let phase='native boot';page.on('pageerror',e=>errors.push({phase,message:e.message,stack:e.stack}));
 await page.addInitScript(()=>{localStorage.setItem('verifiedAge','true');localStorage.setItem('DoLMidnightTheme.preferences.v1',JSON.stringify({enabled:false}));localStorage.setItem('DoLGameUI.shop.defaultGender','female')});
 await page.goto(`http://127.0.0.1:${server.address().port}/game`,{timeout:90000});await page.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});await page.waitForLoadState('networkidle');
 await page.evaluate(()=>SugarCube.Engine.play('Start2'));await page.waitForLoadState('networkidle');
 const nativeBootErrors=errors.splice(0);if(nativeBootErrors.length)console.log('NATIVE BOOT ERRORS',nativeBootErrors);phase='UI injected';
 await page.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await page.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const absent=async()=>{await settle();assert.equal(await page.locator('.dgp-host,.dgp-recovery,.dgs-host,.dgc-host,.dgs-detail,.dgu-save-header,.dgs-transfer,.dgs-cloud,.dgs-back,.dgshop-host,.dgw-root,.dcu-root,.dcu-toggle').count(),0)};
 await absent();
 // Capture native nodes before enabling. Turning off must restore the same parents and order.
 for(const key of ['characteristics','social','traits','statistics','gameFeats','journal','options','saves']){
  phase=key;await page.evaluate(key=>{if(!document.querySelector('#customOverlay').classList.contains('hidden'))closeOverlay();new SugarCube.Wikifier(null,`<<overlayReplace "${key}">>`)},key);
  await page.waitForTimeout(150);
  await page.evaluate(()=>{window.nativeBody=document.querySelector('#customOverlayContent');window.nativeNodes=[...nativeBody.querySelectorAll('*')];window.nativeRelations=nativeNodes.map(n=>[n.parentNode,n.previousSibling,n.nextSibling]);window.nativeState=JSON.stringify(V)});
  await page.evaluate(()=>DoLGameUI.setPreference('enabled',true));await settle();
  if(key==='saves')await page.waitForSelector('.dgs-host');
  else assert.ok(await page.locator('.dgp-host,.dgc-host,.dgs-host').count()>0,'captured '+key);
  await page.evaluate(()=>DoLGameUI.setPreference('enabled',false));await absent();
  const result=await page.evaluate(()=>({state:JSON.stringify(V)===nativeState,nodes:nativeNodes.every((n,i)=>n.isConnected&&n.parentNode===nativeRelations[i][0]&&n.previousSibling===nativeRelations[i][1]&&n.nextSibling===nativeRelations[i][2]),failures:DoLPanelsUI.getLifecycleCounts().failures}));
  assert.deepEqual(result,{state:true,nodes:true,failures:0},key);
 }
 phase='shop';await page.evaluate(()=>{closeOverlay();SugarCube.Engine.play('Clothing Shop')});await page.waitForLoadState('networkidle');await absent();
 await page.locator('#clothingShop-div a').filter({hasText:/View All|查看全部|查看所有|全部服/}).first().click();await page.waitForSelector('.clothing-item');
 await page.evaluate(()=>{window.shopState=JSON.stringify(V);window.nativeShop=document.querySelector('#clothingShop-div');window.shopNodes=[...nativeShop.querySelectorAll('*')];window.shopParents=shopNodes.map(n=>n.parentNode)});
 await page.evaluate(()=>DoLGameUI.setPreference('enabled',true));await page.waitForSelector('.dgshop-host');await settle();assert.equal(await page.evaluate(()=>JSON.stringify(V)===shopState),true,'reenabling does not apply default gender');
 await page.evaluate(()=>DoLGameUI.setPreference('enabled',false));await absent();assert.ok(await page.evaluate(()=>shopNodes.every((n,i)=>n.isConnected&&n.parentNode===shopParents[i])));
 phase='wardrobe';await page.evaluate(()=>SugarCube.Engine.play('Wardrobe'));await page.waitForSelector('#wardrobeList');await absent();
 await page.evaluate(()=>{window.wardrobeState=JSON.stringify(V);window.nativeWardrobe=document.querySelector('#wardrobeList');window.wardrobeParent=nativeWardrobe.parentNode;window.wardrobeNext=nativeWardrobe.nextSibling});
 await page.evaluate(()=>DoLGameUI.setPreference('enabled',true));await page.waitForSelector('.dgw-root');
 await page.evaluate(()=>DoLGameUI.setPreference('enabled',false));await absent();assert.ok(await page.evaluate(()=>nativeWardrobe.isConnected&&nativeWardrobe.parentNode===wardrobeParent&&nativeWardrobe.nextSibling===wardrobeNext));
 assert.equal(await page.evaluate(()=>JSON.stringify(V)===wardrobeState),true,'wardrobe gate does not change clothing state');
 const nativeBannerErrors=errors.filter(e=>process.env.DOL_WARDROBE_INTEGRATED&&e.stack.includes('bannerFallbackImage.onload')&&e.message==="Cannot read properties of undefined (reading 'skybox')");
 if(nativeBannerErrors.length){
  const control=JSON.parse(fs.readFileSync(path.join(__dirname,'artifacts/wardrobe-control.json'),'utf8'));
  assert.ok(control.errors.some(e=>e.includes('bannerFallbackImage.onload')&&e.includes("reading 'skybox'")),'requires no-UI control reproduction');
  console.log('NATIVE CONTROL REPRODUCED',nativeBannerErrors.map(e=>({phase:e.phase,message:e.message})));
 }
 assert.deepEqual(errors.filter(e=>!nativeBannerErrors.includes(e)),[]);
 console.log('PASS native master restoration: 8 menus, shop default-filter guard and wardrobe; '+(process.env.DOL_WARDROBE_INTEGRATED?'Lyra':'vanilla'));
}finally{await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
