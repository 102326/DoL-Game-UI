// @ci-contract {"profiles":["standard","research"],"classification":"contract","granularity":"checkpoint","caseSource":"caseCheckpoint","rendererContexts":["sphere:2d"]}
import cases = require('../scripts/ci-cases.cjs');
const {caseCheckpoint}=cases;
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import playwright = require('playwright');
import type {rigidSpin} from '../src/ui/golden-spin/rigid-spin';
import type {sphereHub} from '../src/ui/golden-spin/hub-motion';
import type {hubPreview as preview} from '../prototypes/evolution-integration/hub-preview';

declare const hubPreview:typeof preview,testPlacementVisual:ReturnType<typeof rigidSpin>,testHubVisual:ReturnType<typeof sphereHub>,testPlacementRelease:()=>void;
const key='SoftWet.MotionHub.freePosition.v1',legacyKey='StoneFreeMotionHub.position.v1';
function must<T>(v:T|null|undefined):T{assert.ok(v);return v}
const ball=(p:playwright.Page)=>p.locator('.sf-motion-ball');
const root=(p:playwright.Page)=>p.locator('.sf-motion-hub');
const stored=(p:playwright.Page)=>p.evaluate(k=>localStorage.getItem(k),key);
async function idle(p:playwright.Page){await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')==='idle')}
async function down(p:playwright.Page){await ball(p).hover();const b=must(await ball(p).boundingBox());await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down()}
async function charge(p:playwright.Page){await down(p);await p.mouse.move(2,500,{steps:5});await p.waitForFunction(()=>Number(document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-charge'))>=.999)}
async function verifyHubPlacement(browser:playwright.Browser){
 await import('./hub-placement.test.mts');
 const {createHubPreviewServer}=await import('../scripts/preview-evolution-hub.mjs');
 const server=await createHubPreviewServer(0,[{name:'observe-production-placement',enforce:'pre',transform(code:string,id:string){
  const file=id.replaceAll('\\','/');
  if(file.endsWith('/src/ui/golden-spin/rigid-spin.ts'))return code.replace('export function rigidSpin(', 'function actualRigidSpin(')+'\nexport function rigidSpin(...args){return window.testPlacementVisual=actualRigidSpin(...args)}';
  if(file.endsWith('/src/ui/golden-spin/hub-motion.ts'))return code.replace('export function sphereHub(', 'function actualSphereHub(')+'\nexport function sphereHub(root){return window.testHubVisual=actualSphereHub(root)}';
  if(file.endsWith('/framework/official-ui/hub.ts')){assert.equal(code.split('return visuals.dispose').length,2,'actual owner disposer must be unique');return code.replace('return visuals.dispose','return (window.testPlacementRelease=visuals.dispose)')}
 }}]);
 const out=path.resolve('tests/artifacts/evolution/hub-placement-'+Date.now()),rows:unknown[]=[],errors:string[]=[],failedRequests:{url:string;failure:string|null}[]=[],navigation:{width:number;gotoMs?:number;readyMs?:number}[]=[];fs.mkdirSync(out,{recursive:true});
 let page:playwright.Page|undefined,stage='startup',status='FAIL',failure:string|undefined;
 try{
  const address=must(server.httpServer?.address());if(typeof address==='string')throw Error('Missing preview address');
  for(const width of [1280,390]){
   stage=`${width} setup`;const p=page=await browser.newPage({viewport:{width,height:900}});p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>failedRequests.push({url:r.url(),failure:r.failure()?.errorText??null}));
   const old=JSON.stringify({side:'left',y:.58,docked:false});await p.addInitScript(({key,old})=>localStorage.setItem(key,old),{key:legacyKey,old});
   const timing:{width:number;gotoMs?:number;readyMs?:number}={width};navigation.push(timing);const started=Date.now();await p.goto(`http://127.0.0.1:${address.port}/`);timing.gotoMs=Date.now()-started;await ball(p).waitFor();timing.readyMs=Date.now()-started;
   const accepted=p.locator('.spin-hub-canvas:not(.rigid-spin-body)');assert.equal(await accepted.count(),1);assert.equal(await accepted.evaluate(n=>getComputedStyle(n).visibility),'visible');
   await ball(p).click();await p.waitForFunction(()=>testHubVisual.inspect().phase==='open');assert.equal(await ball(p).getAttribute('aria-expanded'),'true');await p.screenshot({path:path.join(out,`${width}-menu.png`)});await ball(p).press('Escape');await p.waitForFunction(()=>testHubVisual.inspect().phase==='closed');
   stage=`${width} direct placement`;await down(p);await p.mouse.move(width/2,600,{steps:5});await p.mouse.up();await idle(p);const placement=await stored(p);assert.ok(placement);assert.equal(await p.evaluate(k=>localStorage.getItem(k),legacyKey),old);const placed=must(await ball(p).boundingBox());assert.ok(Math.abs(placed.x+placed.width/2-width/2)<3&&Math.abs(placed.y+placed.height/2-600)<3);
   stage=`${width} charge and flight`;await charge(p);const charging=await p.evaluate(()=>testPlacementVisual.inspect());await p.screenshot({path:path.join(out,`${width}-charge.png`)});await p.waitForTimeout(150);assert.ok((await p.evaluate(()=>testPlacementVisual.inspect())).draws>charging.draws,'charging sphere spins');await p.mouse.move(2,550);await p.mouse.up();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')==='flying');assert.equal(await ball(p).getAttribute('aria-expanded'),'false');await p.waitForFunction(()=>testPlacementVisual.inspect().trail>2);await p.screenshot({path:path.join(out,`${width}-flight.png`)});
   const samples=await p.evaluate(async()=>{const rows:{phase:string|null;trail:number;bounces:number;x:number;y:number;right:number;bottom:number}[]=[];const deadline=performance.now()+12000;while(performance.now()<deadline){await new Promise(requestAnimationFrame);const r=document.querySelector('.sf-motion-ball')!.getBoundingClientRect(),v=testPlacementVisual.inspect();rows.push({phase:document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')??null,trail:v.trail,bounces:v.bounces,x:r.x,y:r.y,right:r.right,bottom:r.bottom});if(rows.at(-1)!.phase==='idle')break}return rows});
   assert.equal(samples.at(-1)?.phase,'idle');assert.ok(samples.some(s=>s.bounces>=2),'multiple collisions');assert.ok(samples.some(s=>s.trail>2),'flight produces trail');assert.ok(samples.every(s=>[s.x,s.y,s.right,s.bottom].every(Number.isFinite)&&s.x>=-.1&&s.y>=-.1&&s.right<=width+.1&&s.bottom<=900.1));
   await p.waitForFunction(()=>{const v=testPlacementVisual.inspect();return !v.pending&&v.trail===0&&v.hits===0});const resting=await p.evaluate(()=>testPlacementVisual.inspect());await p.waitForTimeout(150);assert.equal((await p.evaluate(()=>testPlacementVisual.inspect())).draws,resting.draws,'resting visual sleeps');
   stage=`${width} catch`;await charge(p);await p.mouse.up();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')==='flying');
   await p.evaluate(async()=>{let last:DOMRect|undefined,lastTime=0;while(true){await new Promise(requestAnimationFrame);const h=document.querySelector('.sf-motion-hub');if(h?.getAttribute('data-edge-phase')!=='flying')throw Error('Flight settled before catch');const rect=document.querySelector('.sf-motion-ball')!.getBoundingClientRect(),now=performance.now();if(last&&now>lastTime&&Math.hypot(rect.x-last.x,rect.y-last.y)/(now-lastTime)*1000<500)return;last=rect;lastTime=now}});
   const moving=must(await ball(p).boundingBox());await p.mouse.move(moving.x+moving.width/2,moving.y+moving.height/2);await p.mouse.down();assert.equal(await root(p).getAttribute('data-edge-phase'),'dragging','real pointer caught ongoing flight');await p.mouse.up();await idle(p);assert.equal(await ball(p).getAttribute('aria-expanded'),'false','catch does not open');
   for(const reason of ['escape','blur','resize','scene','reduced']){
    stage=`${width} interrupt ${reason}`;await charge(p);const before=await stored(p);
    if(reason==='escape')await p.keyboard.press('Escape');
    if(reason==='blur')await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
    if(reason==='resize')await p.setViewportSize({width,height:880});
    if(reason==='scene')await p.evaluate(()=>{hubPreview.host.invalidateScene();hubPreview.host.sceneReady()});
    if(reason==='reduced')await p.emulateMedia({reducedMotion:'reduce'});
    await p.mouse.up();await idle(p);assert.equal(await stored(p),before,`${reason} cannot commit partial gesture`);
    if(reason==='resize')await p.setViewportSize({width,height:900});if(reason==='reduced')await p.emulateMedia({reducedMotion:'no-preference'});
   }
   stage=`${width} native action`;await ball(p).click();await p.waitForFunction(()=>testHubVisual.inspect().phase==='open');await p.locator('[data-motion-view$="native-social"]').click();assert.equal(await p.evaluate(()=>hubPreview.counts().native),1);await p.waitForFunction(()=>testHubVisual.inspect().phase==='closed');
   stage=`${width} dispose`;await charge(p);await p.mouse.up();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')==='flying');await p.evaluate(()=>hubPreview.stop());assert.equal(await p.locator('.sf-motion-hub,.rigid-spin-field,.spin-hub-canvas').count(),0);const dead=await p.evaluate(()=>testPlacementVisual.inspect());await p.evaluate(()=>{window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('blur'));document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(150);assert.equal((await p.evaluate(()=>testPlacementVisual.inspect())).draws,dead.draws);assert.equal(await p.locator('.sf-motion-hub,.rigid-spin-field,.spin-hub-canvas').count(),0);
   if(width===1280){
    stage='1280 combined cleanup failure';await p.evaluate(()=>hubPreview.remount());await p.waitForSelector('.rigid-spin-field');assert.equal(await p.locator('.spin-hub-canvas').count(),2);
    const cleanup=await p.evaluate(()=>{const disconnect=ResizeObserver.prototype.disconnect;let threw=false,calls=0;ResizeObserver.prototype.disconnect=function(){disconnect.call(this);calls++;throw Error('controlled disconnect failure')};try{testPlacementRelease()}catch{threw=true}finally{ResizeObserver.prototype.disconnect=disconnect}return{threw,calls,baseDead:testHubVisual.inspect().dead,flightPending:testPlacementVisual.inspect().pending}});
    assert.ok(cleanup.threw&&cleanup.calls>0,'cleanup failure must remain visible');assert.equal(cleanup.baseDead,true,'base visual retires despite flight cleanup failure');assert.equal(cleanup.flightPending,false,'flight frame is cancelled');assert.equal(await p.locator('.spin-hub-canvas,.rigid-spin-field').count(),0,'both visual canvases and field are removed');await p.evaluate(()=>hubPreview.stop());rows.push({cleanupFailure:cleanup});
   }
   rows.push({width,status:'PASS',frames:samples.length,bounces:Math.max(...samples.map(s=>s.bounces))});await p.close();page=undefined;
  }
  assert.deepEqual(errors,[]);caseCheckpoint('entry');status='PASS';return rows;
 }catch(error){failure=error instanceof Error?error.stack:String(error);await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw error}
 finally{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status,stage,failure,rows,errors,failedRequests,navigation,node:process.version,browser:browser.version(),limits:'Controlled Chromium owner preview; no game or Android device'},null,2));console.log(out);await page?.close();await server.close()}
}
export = {verifyHubPlacement};
if(require.main===module)(async()=>{const browser=await playwright.chromium.launch(require('./browser-options.cjs'));try{await verifyHubPlacement(browser)}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
