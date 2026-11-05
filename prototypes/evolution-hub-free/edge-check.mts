import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,type Page} from 'playwright';
import {createEvo42Server} from '../../scripts/preview-evo42.mts';
const out=`tests/artifacts/evo42-hub-edge/${Date.now()}`;fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('prototypes/evolution-hub-free').filter(f=>/\.(ts|mts|vue|css|html)$/.test(f)).map(f=>'prototypes/evolution-hub-free/'+f).concat('dist/framework/official-ui/style.css','package-lock.json');
const hash=(f:string)=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),inputs=Object.fromEntries(files.map(f=>[f,hash(f)]));
const server=await createEvo42Server(0),address=server.httpServer!.address();assert(address&&typeof address!=='string');
const browser=await chromium.launch(),rows:unknown[]=[],errors:string[]=[];let page:Page|undefined,status='FAIL',failure:unknown,stage='startup';
const ball=(p:Page)=>p.locator('.sf-motion-ball'),root=(p:Page)=>p.locator('.sf-motion-hub');
async function frame(p:Page){await p.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))))}
async function down(p:Page){const b=await ball(p).boundingBox();assert(b);await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down()}
async function pressEdge(p:Page,wall='left'){
 await down(p);const v=p.viewportSize()!;await p.mouse.move(wall==='left'?2:wall==='right'?v.width-2:v.width/2,wall==='top'?2:wall==='bottom'?v.height-2:500,{steps:4});
 await p.waitForFunction(()=>Number(document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-charge'))>.45);
}
async function stored(p:Page){return p.evaluate(()=>localStorage.getItem('Evo42.hub.direct-placement.v1'))}
async function idle(p:Page){await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')==='idle')}
try{
 for(const width of [1280,390]){
  const p=page=await browser.newPage({viewport:{width,height:900}});p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-hub-free/index.html?variant=free`);await ball(p).waitFor();
  await down(p);await p.mouse.move(width/2,600,{steps:5});await p.mouse.up();await frame(p);const saved=await stored(p);assert(saved);
  await down(p);await p.mouse.move(2,500);assert.equal(await root(p).getAttribute('data-edge-phase'),'dragging');await p.mouse.up();await idle(p);assert.equal(await ball(p).getAttribute('aria-expanded'),'false');
  stage='charge and quiescence';await pressEdge(p);await p.waitForFunction(()=>Number(document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-charge'))>=.999);await frame(p);const quiet=await p.evaluate(()=>Reflect.get(document.querySelector('.sf-motion-hub')!,'edgeResearchState'));assert.equal(quiet.pending,false);await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>Reflect.get(document.querySelector('.sf-motion-hub')!,'edgeResearchState').frames),quiet.frames,'stable charge stops RAF');await p.mouse.move(2,550);await frame(p);const target=await p.locator('.edge-aim line').getAttribute('y2');assert(Number(target)>88,'along-wall movement aims inward');
  await p.screenshot({path:`${out}/${width}-charge.png`});await p.mouse.up();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')==='flying');
  assert.equal(await ball(p).getAttribute('aria-expanded'),'false','release click cannot open menu or stop flight');
  const samples=await p.evaluate(async()=>{const rows=[];for(let i=0;i<240;i++){await new Promise(requestAnimationFrame);const hub=document.querySelector('.sf-motion-hub')!,b=hub.querySelector('.sf-motion-ball')!.getBoundingClientRect();rows.push({x:b.x,y:b.y,w:b.width,h:b.height,phase:hub.getAttribute('data-edge-phase')});if(rows.at(-1)!.phase==='idle')break}return rows});
  assert.equal(samples.at(-1)!.phase,'idle','finite flight settles');assert(samples.every(r=>[r.x,r.y,r.w,r.h].every(Number.isFinite)&&r.x>=0&&r.y>=0&&r.x+r.w<=width+.1&&r.y+r.h<=900.1),'all flight frames in bounds');assert(new Set(samples.map(s=>s.x.toFixed(1))).size>5);
  await frame(p);const settled=await ball(p).getAttribute('style');await frame(p);assert.equal(await ball(p).getAttribute('style'),settled,'no continuing position writes after settle');assert(await stored(p));
  // Regrab uses a real pointer at the currently rendered sphere, not a forced DOM event.
  await pressEdge(p);await p.mouse.up();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')==='flying');await down(p);assert.equal(await root(p).getAttribute('data-edge-phase'),'dragging');await p.mouse.move(width/2,600,{steps:3});await p.mouse.up();await idle(p);
  stage='catch click';await pressEdge(p);await p.mouse.up();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')==='flying');await down(p);await p.mouse.up();await idle(p);assert.equal(await ball(p).getAttribute('aria-expanded'),'false','catch click only stops the ball');
  const anchor=await stored(p);await pressEdge(p);await p.mouse.up();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')==='flying');await p.keyboard.press('Escape');await idle(p);assert.equal(await stored(p),anchor,'cancel flight cannot commit partial position');
  for(const reason of ['escape','blur','scene','hidden','resize','reduced']){
   stage=`${width} interrupt ${reason}`;await pressEdge(p);const before=await stored(p);
   if(reason==='escape')await p.keyboard.press('Escape');
   if(reason==='blur')await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
   if(reason==='scene')await p.evaluate(()=>{const h=Reflect.get(window,'hubFreePreview').host;h.invalidateScene();h.sceneReady()});
   if(reason==='hidden')await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
   if(reason==='resize')await p.setViewportSize({width,height:880});
   if(reason==='reduced')await p.emulateMedia({reducedMotion:'reduce'});
   await p.mouse.up();await idle(p);assert.equal(await stored(p),before,reason+' cannot save interrupted gesture');assert.equal(await p.locator('.edge-aim,.edge-trail').count(),0);
   if(reason==='hidden')await p.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'))});
   if(reason==='resize')await p.setViewportSize({width,height:900});
   if(reason==='reduced')await p.emulateMedia({reducedMotion:'no-preference'});
   await frame(p);
  }
  await p.emulateMedia({reducedMotion:'reduce'});await down(p);await p.mouse.move(2,500);await p.waitForTimeout(350);await p.mouse.up();await idle(p);assert.equal(await p.locator('.edge-aim,.edge-trail').count(),0);await p.emulateMedia({reducedMotion:'no-preference'});
  await pressEdge(p,'right');await p.mouse.up();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')==='flying');await p.evaluate(()=>Reflect.get(window,'hubFreePreview').dispose());await frame(p);assert.equal(await root(p).count(),0);assert.equal(await p.evaluate(()=>Reflect.get(window,'hubFreePreview').storage.unchanged()),true);
  rows.push({width,status:'PASS',flightFrames:samples.length,scope:'placement, short-contact rejection, charge/aim, finite flight, real regrab, cancel, lifecycle, reduced motion, storage and teardown'});await p.close();page=undefined;
 }
 const p=page=await browser.newPage({viewport:{width:390,height:900},hasTouch:true});await p.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-hub-free/index.html?variant=free`);await ball(p).waitFor();
 p.on('pageerror',e=>errors.push(e.message));const cdp=await p.context().newCDPSession(p),b=await ball(p).boundingBox();assert(b);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:2,y:500}]});await p.waitForFunction(()=>Number(document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-charge'))>.45);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-phase')==='flying');await idle(p);rows.push({width:390,input:'Chromium CDP touch emulation',status:'PASS'});await p.close();page=undefined;
 const direct=page=await browser.newPage({viewport:{width:390,height:900}});direct.on('pageerror',e=>errors.push(e.message));await direct.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-hub-free/index.html?variant=direct`);await ball(direct).waitFor();await down(direct);await direct.mouse.move(2,500);await direct.waitForTimeout(350);await direct.mouse.up();await idle(direct);assert.equal(await direct.locator('.edge-aim,.edge-trail').count(),0);rows.push({variant:'direct',status:'PASS',scope:'previous placement comparison has no edge launch'});
 assert.deepEqual(errors,[]);for(const f of files)assert.equal(hash(f),inputs[f],f+' changed during check');status='PASS';console.log(JSON.stringify(rows));
}catch(e){failure=e instanceof Error?e.stack:String(e);await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}
finally{fs.writeFileSync(out+'/result.json',JSON.stringify({status,failure,stage,node:process.version,browser:browser.version(),inputs,rows,errors,limits:'Isolated Chromium; not real touch/WebView, game, adoption or performance acceptance'},null,2));console.log(out);await browser.close();await server.close()}
