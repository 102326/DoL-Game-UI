import playwright = require('playwright');
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import type {GameUiControls} from '../src/runtime/game-controls';
const {chromium}=playwright;
declare const SugarCube:{State:{variables:{options:unknown}};Engine:{play(passage:string):unknown};Wikifier:new(output:Element|null,source:string)=>unknown},V:Record<string,unknown>;
declare const DoLGameUI:GameUiControls,DoLPanelsUI:ReturnType<typeof import('../src/panels/main')['startPanels']>;
declare const nativeBody:HTMLElement,nativeNodes:Element[],nativeRelations:Array<readonly [ParentNode|null,ChildNode|null,ChildNode|null]>,nativeState:string,shopState:string,nativeShop:HTMLElement,shopNodes:Element[],shopParents:(ParentNode|null)[],wardrobeState:string,nativeWardrobe:HTMLElement,wardrobeParent:Node|null,wardrobeNext:ChildNode|null;
declare const must:<T>(value:T|null|undefined)=>T;
declare function closeOverlay():void;

const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url||'/','http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1363,height:876}}),errors:Array<{phase:string;message:string;stack:string|undefined}>=[];let phase='native boot';page.on('pageerror',e=>errors.push({phase,message:e.message,stack:e.stack}));
 await page.addInitScript(()=>{localStorage.setItem('verifiedAge','true');localStorage.setItem('DoLMidnightTheme.preferences.v1',JSON.stringify({enabled:false}));localStorage.setItem('DoLGameUI.shop.defaultGender','female')});
 await page.goto(`http://127.0.0.1:${(()=>{const a=server.address();assert.ok(a&&typeof a!=='string');return a.port})()}/game`,{timeout:90000});await page.waitForFunction(()=>SugarCube?.State?.variables?.options,{timeout:60000});await page.waitForLoadState('networkidle');await page.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value==null)throw Error('Missing native restoration fixture');return value}}));
 await page.evaluate(()=>SugarCube.Engine.play('Start2'));await page.waitForLoadState('networkidle');
 const nativeBootErrors=errors.splice(0);if(nativeBootErrors.length)console.log('NATIVE BOOT ERRORS',nativeBootErrors);phase='UI injected';
 await page.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await page.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 const settle=()=>page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
 const absent=async()=>{await settle();assert.equal(await page.locator('.dgp-host,.dgp-recovery,.dgs-host,.dgc-host,.dgs-detail,.dgu-save-header,.dgs-transfer,.dgs-cloud,.dgs-back,.dgshop-host,.dgw-root,.dcu-root,.dcu-toggle').count(),0)};
 await absent();
 // Capture native nodes before enabling. Turning off must restore the same parents and order.
 for(const key of ['characteristics','social','traits','statistics','gameFeats','journal','options','saves']){
  phase=key;await page.evaluate(key=>{if(!must(document.querySelector('#customOverlay')).classList.contains('hidden'))closeOverlay();new SugarCube.Wikifier(null,`<<overlayReplace "${key}">>`)},key);
  await page.waitForTimeout(150);
  await page.evaluate(()=>{Object.assign(window,{nativeBody:must(document.querySelector<HTMLElement>('#customOverlayContent'))});Object.assign(window,{nativeNodes:[...nativeBody.querySelectorAll('*')]});Object.assign(window,{nativeRelations:nativeNodes.map(n=>[n.parentNode,n.previousSibling,n.nextSibling] as const),nativeState:JSON.stringify(V)})});
  await page.evaluate(()=>DoLGameUI.setPreference('enabled',true));await settle();
  if(key==='saves')await page.waitForSelector('.dgs-host');
  else assert.ok(await page.locator('.dgp-host,.dgc-host,.dgs-host').count()>0,'captured '+key);
  await page.evaluate(()=>DoLGameUI.setPreference('enabled',false));await absent();
  const result=await page.evaluate(()=>({state:JSON.stringify(V)===nativeState,nodes:nativeNodes.every((n,i)=>n.isConnected&&n.parentNode===must(nativeRelations[i])[0]&&n.previousSibling===must(nativeRelations[i])[1]&&n.nextSibling===must(nativeRelations[i])[2]),failures:DoLPanelsUI.getLifecycleCounts().failures}));
  assert.deepEqual(result,{state:true,nodes:true,failures:0},key);
 }
 phase='shop';await page.evaluate(()=>{closeOverlay();SugarCube.Engine.play('Clothing Shop')});await page.waitForLoadState('networkidle');await absent();
 await page.locator('#clothingShop-div a').filter({hasText:/View All|查看全部|查看所有|全部服/}).first().click();await page.waitForSelector('.clothing-item');
 // The original shop generates other pages with timed/repeat macros.
 // Their clothingicon scratch writes must finish before the unchanged-state snapshot.
 await page.waitForFunction(()=>{const expected=document.querySelectorAll('#shop-pagination .shop-pages > .page').length;return expected>0&&document.querySelectorAll('#shop-list-pages > .clothing-shop-page').length===expected});
 await page.evaluate(()=>{Object.assign(window,{shopState:JSON.stringify(V),nativeShop:must(document.querySelector<HTMLElement>('#clothingShop-div'))});Object.assign(window,{shopNodes:[...nativeShop.querySelectorAll('*')]});Object.assign(window,{shopParents:shopNodes.map(n=>n.parentNode)})});
 await page.evaluate(()=>DoLGameUI.setPreference('enabled',true));await page.waitForSelector('.dgshop-host');await settle();const shopCheck=await page.evaluate(()=>{const after=JSON.stringify(V);let i=0;while(i<Math.min(shopState.length,after.length)&&shopState[i]===after[i])i++;return{equal:after===shopState,offset:i,before:shopState.slice(Math.max(0,i-50),i+200),after:after.slice(Math.max(0,i-50),i+200)}});assert.equal(shopCheck.equal,true,'reenabling does not apply default gender: '+JSON.stringify(shopCheck));
 await page.evaluate(()=>DoLGameUI.setPreference('enabled',false));await absent();assert.ok(await page.evaluate(()=>shopNodes.every((n,i)=>n.isConnected&&n.parentNode===shopParents[i])));
 phase='wardrobe';await page.evaluate(()=>SugarCube.Engine.play('Wardrobe'));await page.waitForSelector('#wardrobeList');await absent();
 await page.evaluate(()=>{Object.assign(window,{wardrobeState:JSON.stringify(V),nativeWardrobe:must(document.querySelector<HTMLElement>('#wardrobeList'))});Object.assign(window,{wardrobeParent:nativeWardrobe.parentNode,wardrobeNext:nativeWardrobe.nextSibling})});
 await page.evaluate(()=>DoLGameUI.setPreference('enabled',true));await page.waitForSelector('.dgw-root');
 await page.evaluate(()=>DoLGameUI.setPreference('enabled',false));await absent();assert.ok(await page.evaluate(()=>nativeWardrobe.isConnected&&nativeWardrobe.parentNode===wardrobeParent&&nativeWardrobe.nextSibling===wardrobeNext));
 assert.equal(await page.evaluate(()=>JSON.stringify(V)===wardrobeState),true,'wardrobe gate does not change clothing state');
 const nativeBannerErrors=errors.filter(e=>process.env.DOL_WARDROBE_INTEGRATED&&e.stack?.includes('bannerFallbackImage.onload')&&e.message==="Cannot read properties of undefined (reading 'skybox')");
 if(nativeBannerErrors.length){
  const control:unknown=JSON.parse(fs.readFileSync(path.join(__dirname,'artifacts/wardrobe-control.json'),'utf8'));if(!control||typeof control!=='object'||!('errors' in control)||!Array.isArray(control.errors)||!control.errors.every((value:unknown):value is string=>typeof value==='string'))throw Error('Invalid native banner control');const controlErrors:string[]=control.errors;
  assert.ok(controlErrors.some(e=>e.includes('bannerFallbackImage.onload')&&e.includes("reading 'skybox'")),'requires no-UI control reproduction');
  console.log('NATIVE CONTROL REPRODUCED',nativeBannerErrors.map(e=>({phase:e.phase,message:e.message})));
 }
 assert.deepEqual(errors.filter(e=>!nativeBannerErrors.includes(e)),[]);
 console.log('PASS native master restoration: 8 menus, shop default-filter guard and wardrobe; '+(process.env.DOL_WARDROBE_INTEGRATED?'Lyra':'vanilla'));
}finally{await browser.close();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))}})().catch(e=>{console.error(e);process.exitCode=1});
