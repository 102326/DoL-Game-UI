import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,type Page} from 'playwright';
import {createEvo42Server} from '../../scripts/preview-evo42.mts';
import {readPosition,locate,positionKey,canPersist} from './position.ts';
import {positionKey as legacyKey} from '../../framework/motion-hub/geometry.ts';
const out=`tests/artifacts/evo42-hub-direct/${Date.now()}`;fs.mkdirSync(out,{recursive:true});
const inputs=['FreeHub.vue','position.ts','owner.ts','main.ts','storage.ts','index.html','check.mts'].map(p=>'prototypes/evolution-hub-free/'+p).concat(['dist/framework/official-ui/style.css']);
const hash=(f:string)=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),hashes=Object.fromEntries(inputs.map(f=>[f,hash(f)]));
const errors:string[]=[],results:string[]=[];let status='FAIL',failure:string|undefined;
const legacy=JSON.stringify({side:'left',y:.42,docked:false});
assert.deepEqual(readPosition('{bad',legacy),{version:1,x:0,y:.42,docked:false,side:'left'});assert.equal(canPersist('{"version":9,"x":0}'),false);
assert.equal(readPosition('{"version":1,"x":1e999,"y":0}',legacy).x,0);assert.ok(Number.isFinite(locate(readPosition(null,legacy),{left:0,top:0,width:100,height:80}).x));
const server=await createEvo42Server(0),address=server.httpServer!.address();assert(address&&typeof address!=='string');const browser=await chromium.launch();
async function frame(p:Page){await p.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))))}
async function drag(p:Page,x:number,y:number,release=true){const b=await p.locator('.sf-motion-ball').boundingBox();assert(b);await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.mouse.move(x,y,{steps:8});if(release)await p.mouse.up();await frame(p)}
try{
 for(const width of [1280,390])for(const variant of ['baseline','free']){
  const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out,size:{width,height:900}}});const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({key,legacy})=>localStorage.setItem(key,legacy),{key:legacyKey,legacy});
  await p.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-hub-free/index.html?variant=${variant}`);await p.locator('.sf-motion-ball').waitFor();
  await drag(p,width/2,600);const ball=p.locator('.sf-motion-ball');
  await p.waitForFunction(({free,width})=>{const r=document.querySelector('.sf-motion-ball')!.getBoundingClientRect();return free?Math.abs(r.x+r.width/2-width/2)<2:r.x<30||r.right>width-30},{free:variant==='free',width});
  if(variant==='free'){
   assert.equal(await p.evaluate(key=>localStorage.getItem(key),legacyKey),legacy,'legacy position is read-only');
   const saved=await p.evaluate(key=>localStorage.getItem(key),positionKey);assert(saved);const center=await ball.boundingBox();assert(center);
   await drag(p,width*.7,450,false);await ball.press('Escape');await p.mouse.up();await frame(p);assert.equal(await p.evaluate(key=>localStorage.getItem(key),positionKey),saved,'cancel cannot save half a gesture');await p.waitForFunction(x=>Math.abs(document.querySelector('.sf-motion-ball')!.getBoundingClientRect().x-x)<.1,center.x);
   await ball.press('ArrowLeft');await p.waitForFunction(x=>Math.abs(document.querySelector('.sf-motion-ball')!.getBoundingClientRect().x-x)<.1,center.x-24);const nudged=await ball.boundingBox();assert(nudged);assert.ok(Math.abs(center.x-nudged.x-24)<1);
   await p.reload();await ball.waitFor();await p.waitForFunction(x=>Math.abs(document.querySelector('.sf-motion-ball')!.getBoundingClientRect().x-x)<1,nudged.x);
  }
  for(const layout of ['fan','grid']){
   await p.locator('#layout').selectOption(layout);await ball.waitFor();await ball.click();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-spin-phase')==='open');
   for(const button of await p.locator('.sf-motion-orbit button').all()){const r=await button.boundingBox();assert(r);assert.ok(r.width>=43.99&&r.height>=43.99,JSON.stringify({text:await button.innerText(),r}));await button.scrollIntoViewIfNeeded();const hit=await button.evaluate(n=>{const r=n.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{ok:n.contains(top),text:n.textContent,top:top?.outerHTML.slice(0,400),rect:r.toJSON()}});assert.equal(hit.ok,true,JSON.stringify({width,variant,layout,hit}));}
   await p.screenshot({path:`${out}/${width}-${variant}-${layout}.png`});await p.locator('[data-motion-view$="native-social"]').click();await p.waitForFunction(()=>document.querySelector('.sf-motion-orbit')?.getAttribute('aria-hidden')==='true');
  }
  assert.equal(await p.evaluate(()=>Reflect.get(window,'hubFreePreview').calls()),2,'native action once per choice');
  if(variant==='free'){
   await ball.click();await p.getByRole('button',{name:'停靠侧边',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.sf-motion-ball')?.classList.contains('is-docked'));await ball.click();await p.waitForFunction(()=>!document.querySelector('.sf-motion-ball')?.classList.contains('is-docked'));
   await drag(p,width/2,600);await p.emulateMedia({reducedMotion:'reduce'});await p.setViewportSize({width:width===390?844:390,height:700});await frame(p);const r=await ball.boundingBox();assert(r);assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=p.viewportSize()!.width&&r.y+r.height<=700,'rotation stays reachable');
   await ball.click();await p.getByRole('button',{name:'隐藏工具',exact:true}).click();await ball.waitFor({state:'detached'});await p.locator('#restore').click();await ball.waitFor();await frame(p);const future='{"version":9,"x":0}';await p.evaluate(({key,future})=>localStorage.setItem(key,future),{key:positionKey,future});await p.reload();await ball.waitFor();await ball.press('ArrowLeft');await p.waitForFunction(()=>document.querySelector('.sf-motion-feedback')?.textContent?.includes('位置仅本次生效'));assert.equal(await p.evaluate(key=>localStorage.getItem(key),positionKey),future,'unknown version remains untouched');assert.equal(await p.evaluate(()=>Reflect.get(window,'hubFreePreview').storage.unchanged()),true,'formal storage remains unchanged');await p.evaluate(()=>Reflect.get(window,'hubFreePreview').dispose());assert.equal(await ball.count(),0);await p.locator('#restore').click();await p.locator('#layout').selectOption('fan');assert.equal(await ball.count(),0,'disposed controls cannot remount');
  }
  assert.equal(await p.evaluate(()=>Reflect.get(window,'hubFreePreview').storage.unchanged()),true,'formal storage remains unchanged');assert.deepEqual(errors,[]);results.push(`${width} ${variant}: placement, original action, fan/grid hits${variant==='free'?', read-only legacy, reload, cancel, nudge, explicit dock, rotation, reduced motion, hide/restore, unknown-version notice, storage isolation and disposal':''}`);
  const video=p.video();await context.close();assert(video);await video.saveAs(`${out}/${width}-${variant}.webm`);
 }
 for(const f of inputs)assert.equal(hash(f),hashes[f],'source changed during check');
 status='PASS';console.log('PASS',JSON.stringify(results));
}catch(e){failure=e instanceof Error?e.stack:String(e);throw e}finally{fs.writeFileSync(out+'/result.json',JSON.stringify({status,failure,scope:'controlled prototype only; not product/device acceptance',environment:{node:process.version,chromium:browser.version()},inputs:hashes,results,errors},null,2));console.log(out);await browser.close();await server.close()}
