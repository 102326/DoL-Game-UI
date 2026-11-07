import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {createEvo42Server} from '../../scripts/preview-evo42.mts';

const out='tests/artifacts/evo42',server=await createEvo42Server(0),address=server.httpServer!.address();assert.ok(address&&typeof address!=='string');
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors:string[]=[],results:unknown[]=[];
const url='http://127.0.0.1:'+address.port+'/?material=force&motion=recall';
page.on('pageerror',e=>errors.push(e.message));let failure:string|undefined;
const ball=page.locator('.sf-motion-ball');
async function point(){const r=await ball.boundingBox();assert.ok(r);return{x:r.x+r.width/2,y:r.y+r.height/2}}
async function drop(x:number,y:number){const p=await point();await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(x,y,{steps:14});await page.mouse.move(x,y);await page.mouse.up();await page.waitForFunction(()=>Reflect.get(window,'evo42').snapshot().hub?.settled===true)}
try{
 await page.goto(url);await ball.waitFor();
 const legacy='{"side":"left","y":0.38,"docked":false}',legacyKey='StoneFreeMotionHub.position.v1';
 await page.evaluate(({legacy,legacyKey})=>{localStorage.setItem(legacyKey,legacy);localStorage.removeItem('Evo42.hub.position.v1')},{legacy,legacyKey});await page.reload();await ball.waitFor();assert.ok(Math.abs((await point()).x-40)<2,'legacy side position is an initial free coordinate');
 await drop(640,440);assert.equal(await page.evaluate(k=>localStorage.getItem(k),legacyKey),legacy,'free movement never overwrites the production legacy key');results.push({name:'legacy-read-without-write',status:'PASS'});
 const free=await point();assert.ok(Math.abs(free.x-640)<90,'released Hub must remain near the central drop, not snap to a side: '+JSON.stringify(free));results.push({name:'free-release',point:free});
 const key='Evo42.hub.position.v1',saved=await page.evaluate(k=>localStorage.getItem(k),key);assert.ok(saved,'research position is saved independently');
 await page.evaluate(k=>localStorage.setItem(k,'{"version":999,"x":1e999,"y":0.5}'),key);await page.reload();await ball.waitFor();assert.ok(Math.abs((await point()).x-40)<2,'unsupported/nonfinite research data safely falls back to legacy');
 await page.evaluate(({key,saved})=>localStorage.setItem(key,saved!),{key,saved});
 await page.reload();await ball.waitFor();const restored=await point();assert.ok(Math.hypot(restored.x-free.x,restored.y-free.y)<2,'reload restores the free position');
 await page.evaluate(()=>{Reflect.set(window,'e42OriginalStorageSet',Storage.prototype.setItem);Storage.prototype.setItem=function(key,value){if(key==='Evo42.hub.position.v1')throw Error('controlled research storage rejection');Reflect.get(window,'e42OriginalStorageSet').call(this,key,value)}});
 await drop(800,500);assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),saved,'failed storage keeps the previous persisted coordinate');
 await page.evaluate(()=>{Storage.prototype.setItem=Reflect.get(window,'e42OriginalStorageSet')});await page.reload();await ball.waitFor();assert.ok(Math.hypot((await point()).x-free.x,(await point()).y-free.y)<2,'reload after storage failure returns to last persisted coordinate');results.push({name:'invalid-data-and-controlled-storage-failure',status:'PASS'});
 const stable=await point();await page.mouse.move(stable.x,stable.y);await page.mouse.down();await page.mouse.move(320,260,{steps:8});await page.keyboard.press('Escape');await page.mouse.up();
 await page.waitForFunction(()=>Reflect.get(window,'evo42').snapshot().hub?.settled===true);const cancelled=await point();assert.ok(Math.hypot(cancelled.x-stable.x,cancelled.y-stable.y)<2,'cancel restores committed position');results.push({name:'cancel-and-reload',point:cancelled});
 await page.getByRole('button',{name:'召回到默认位置',exact:true}).click();
 await page.waitForFunction(()=>Reflect.get(window,'evo42').snapshot().hub?.phase==='recall');
 const mid=await point();await page.mouse.move(mid.x,mid.y);await page.mouse.down();await page.mouse.move(560,500,{steps:8});await page.mouse.up();await page.waitForFunction(()=>Reflect.get(window,'evo42').snapshot().hub?.settled===true);
 const grabbed=await point();assert.ok(Math.abs(grabbed.x-560)<120,'new grab owns the real moving Hub');assert.equal(await page.locator('.e42-thread').getAttribute('data-active'),'false');results.push({name:'real-recall-interrupt',point:grabbed});
 await page.evaluate(()=>Reflect.set(window,'e42RecallStart',Reflect.get(window,'evo42').snapshot().hub.x));await page.getByRole('button',{name:'召回到默认位置',exact:true}).click();await page.waitForFunction(()=>Reflect.get(window,'evo42').snapshot().hub?.phase==='recall');
 await page.waitForFunction(()=>{const h=Reflect.get(window,'evo42').snapshot().hub;return h?.phase==='recall'&&h.x>Reflect.get(window,'e42RecallStart')+20});
 const intercepted=await point();await page.mouse.click(intercepted.x,intercepted.y);const tapped=await point();await page.reload();await ball.waitFor();const afterTapReload=await point();assert.ok(Math.hypot(tapped.x-afterTapReload.x,tapped.y-afterTapReload.y)<2,'tap interrupt commits the actual caught position');results.push({name:'tap-interrupt-persistence',point:afterTapReload});
 await page.evaluate(()=>Reflect.get(window,'evo42').setMotion('soft'));await ball.waitFor();await drop(1,460);const edge=await point();await page.reload();await ball.waitFor();const edgeReload=await point();assert.ok(Math.hypot(edge.x-edgeReload.x,edge.y-edgeReload.y)<2,'edge drop and stored coordinate bounds agree');
 const stableHidden=await point();await page.mouse.move(stableHidden.x,stableHidden.y);await page.mouse.down();await page.mouse.move(400,300,{steps:6});
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
 assert.equal(await page.evaluate(()=>Reflect.get(window,'evo42').snapshot().hub?.held),false,'hidden document relinquishes held input');await page.mouse.up();
 await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'))});results.push({name:'edge-persistence-and-controlled-visibility',status:'PASS'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>Reflect.get(window,'evo42').snapshot().hub?.reduced===true);
 for(const [x,y]of [[60,80],[1220,80],[60,820],[1220,820],[640,440]]){
  await drop(x!,y!);await ball.click();await page.locator('.sf-motion-orbit.is-expanded').waitFor();
  const buttons=page.locator('.sf-motion-orbit button');for(let i=0;i<await buttons.count();i++){const r=await buttons.nth(i).boundingBox();assert.ok(r);assert.ok(r.x>=-1&&r.y>=-1&&r.x+r.width<=1281&&r.y+r.height<=901,'all menu actions remain in the viewport');}
  await page.keyboard.press('Escape');
 }
 await ball.focus();const beforeKey=await point();await page.keyboard.press('ArrowLeft');const afterKey=await point();assert.equal(Math.round(afterKey.x-beforeKey.x),-24,'keyboard nudges in 2D, not across the screen');
 await ball.click();await page.locator('.sf-motion-petal').getByText('界面设置',{exact:true}).click();await page.locator('#dol-midnight-controls[open]').waitFor();assert.equal(await page.evaluate(()=>Reflect.get(window,'evo42').snapshot().native.settings),1);
 await page.locator('.dmt-close').click();await page.locator('#dol-midnight-controls').waitFor({state:'hidden'});
 await page.setViewportSize({width:390,height:700});await page.waitForFunction(()=>{const r=document.querySelector('.sf-motion-ball')!.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight});results.push({name:'corners-keyboard-action-rotation',status:'PASS'});
 const retiring=await point();await page.mouse.move(retiring.x,retiring.y);await page.mouse.down();await page.mouse.move(retiring.x+12,retiring.y+8);
 await page.evaluate(()=>Reflect.get(window,'evo42').dispose());await page.mouse.up();assert.equal(await page.locator('.sf-motion-hub,.e42-thread,.e42-soft-core').count(),0);assert.deepEqual(errors,[]);
}catch(e){failure=String(e);throw e}
finally{
 const files=['prototypes/evolution42/FreeHub.vue','prototypes/evolution42/hub-position.ts','prototypes/evolution42/hub-motion.ts','prototypes/evolution42/hub.ts','prototypes/evolution42/shop-fixture.ts','prototypes/evolution42/material.ts','prototypes/evolution42/style.css','prototypes/evolution42/main.ts','prototypes/evolution42/free-check.mts'];
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/free-result.json',JSON.stringify({status:failure?'FAIL':'PASS',sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,browser:browser.version(),results,errors,failure,inputs:files.filter(f=>fs.existsSync(f)).map(file=>({file,sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex')}))},null,2));
 await context.close();await browser.close();await server.close();
}
console.log('PASS EVO42 free Hub: free release/persistence, cancel, moving recall regrab, five menu positions, keyboard/action, rotation and cleanup.');
