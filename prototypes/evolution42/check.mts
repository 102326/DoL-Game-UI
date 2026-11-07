import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,type Page} from 'playwright';
import {createEvo42Server} from '../../scripts/preview-evo42.mts';
declare const evo42:{openSettings():void;openShop():void;close():void;setMaterial(mode:string):void;setMotion(mode:string):void;sequence():Promise<void>;dispose():void;snapshot():{scene:string;disposed:boolean;material?:{mode:string;x:number;y:number;fx:number;fy:number;cx:number;cy:number;dragging:boolean;frames:number};hub?:{phase:string;reduced:boolean;held:boolean;frames:number;settled:boolean;x:number;y:number};weatherCanvases:number;native:{settings:number}}};
const out=path.resolve('tests/artifacts/evo42');fs.mkdirSync(out,{recursive:true});
const server=await createEvo42Server(0),address=server.httpServer!.address();assert.ok(address&&typeof address!=='string');
const browser=await chromium.launch({headless:true}),results:unknown[]=[],errors:string[]=[];
const base='http://127.0.0.1:'+address.port;
async function ready(page:Page){page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>!!Reflect.get(window,'evo42'))}
async function drag(page:Page,selector:string,dx:number,dy:number){const r=await page.locator(selector).boundingBox();assert.ok(r);await page.mouse.move(r.x+Math.min(140,r.width/3),r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+Math.min(140,r.width/3)+dx,r.y+r.height/2+dy,{steps:10});await page.mouse.up()}
let failure:string|undefined;
try{
 const lifecycle=await Promise.allSettled(['native-cancel','after-dispose','sequence-interrupt'].map(async name=>{
  const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();
  try{await page.goto(base+'/?material=force&motion=recall');await ready(page);await page.locator('.sf-motion-ball').waitFor();
   if(name==='native-cancel'){const ball=page.locator('.sf-motion-ball'),r=await ball.boundingBox();assert.ok(r);await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x-35,r.y-20,{steps:5});await page.keyboard.press('Escape');await page.mouse.move(r.x-36,r.y-20);assert.equal((await page.evaluate(()=>evo42.snapshot())).hub?.held,false,'native cancel must release decorative input');await page.mouse.up();}
   else if(name==='after-dispose'){await page.evaluate(()=>{evo42.dispose();evo42.setMotion('recall');evo42.openSettings();evo42.openShop()});assert.equal(await page.locator('.e42-soft-core,.e42-thread,.e42-recall-echo,.sf-motion-hub,.sf-weather-canvas').count(),0,'no resources may resurrect after dispose');}
   else{await page.evaluate(()=>Reflect.set(window,'sequencePromise',evo42.sequence()));await page.locator('#dol-midnight-controls[open]').waitFor();await page.locator('.dmt-close').click();await page.evaluate(()=>{Reflect.set(window,'lateShopSeen',false);const observer=new MutationObserver(()=>{if(document.querySelector('[data-sf-workspace=shop]'))Reflect.set(window,'lateShopSeen',true)});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-sf-workspace']});Reflect.set(window,'lateShopObserver',observer)});await page.evaluate(async()=>await Reflect.get(window,'sequencePromise'));await page.locator('#dol-midnight-controls').waitFor({state:'hidden'});await page.waitForFunction(()=>evo42.snapshot().scene==='home');
    // An absence check over the known 4.1s demonstration horizon, not a sleep used to make motion assertions pass.
    await page.waitForTimeout(4300);assert.equal(await page.evaluate(()=>{Reflect.get(window,'lateShopObserver').disconnect();return Reflect.get(window,'lateShopSeen')}),false,'no late scene within the original demonstration horizon');}
   return{name,status:'PASS'};
  }finally{await context.close()}
 }));
 results.push(...lifecycle.map((r,i)=>r.status==='fulfilled'?r.value:{name:['native-cancel','after-dispose','sequence-interrupt'][i],status:'FAIL',reason:String(r.reason)}));assert.ok(lifecycle.every(r=>r.status==='fulfilled'),JSON.stringify(results));
 if(!process.argv.includes('--lifecycle-only')){
 for(const width of [1280,390])for(const material of ['baseline','edge','force']){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1}),page=await context.newPage();
  try{
   await page.goto(base+'/?material='+material+'&motion=recall&scene=settings');await ready(page);
   const dialog=page.locator('#dol-midnight-controls');await dialog.waitFor({state:'visible'});await page.waitForFunction(()=>evo42.snapshot().weatherCanvases===1&&!!evo42.snapshot().material);
   assert.equal(await dialog.locator('.e42-material-light').count(),material==='baseline'?0:1);
   assert.equal(await dialog.locator('.dmt-settings-header').count(),1);assert.equal(await dialog.locator('.sf-weather-canvas').count(),1);
   const close=dialog.locator('.dmt-close'),before=await close.boundingBox();assert.ok(before);
   await dialog.getByRole('button',{name:'材质',exact:true}).click();await dialog.getByRole('heading',{name:'看见层次如何变化'}).waitFor();
   const toggle=dialog.getByRole('checkbox',{name:'玻璃模糊',exact:true});await toggle.uncheck();const opaque=await dialog.locator('.dmt-settings-shell').evaluate(node=>{const css=getComputedStyle(node);return{background:css.backgroundColor,filter:css.backdropFilter}});assert.ok(/^rgb\([^/]+\)$/.test(opaque.background)||opaque.background.endsWith(', 1)'),JSON.stringify(opaque));assert.equal(opaque.filter,'none');assert.equal(await dialog.locator('.e42-material-light').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).display==='none')),true,'glass-off retains the production opaque fallback');await toggle.check();
   await dialog.getByRole('button',{name:'阅读',exact:true}).click();
   const picker=dialog.getByLabel('选项文字对齐',{exact:true});await picker.click();const option=picker.locator('option[value=center]');assert.ok((await option.boundingBox())?.height,'real expanded picker is visible through the decoration');await option.click();assert.equal(await picker.inputValue(),'center');await picker.selectOption('left');
   await page.evaluate(()=>{const root=document.querySelector('.dmt-settings-shell')!.getBoundingClientRect(),canvas=document.querySelector('.sf-weather-canvas')!.getBoundingClientRect();Reflect.set(window,'e42ProbeBefore',{button:document.querySelector('.dmt-close'),canvas:document.querySelector('.sf-weather-canvas'),offsetX:canvas.x-root.x,offsetY:canvas.y-root.y})});
   if(material==='force'&&width===1280)await dialog.getByRole('checkbox',{name:'手机紧凑按钮间距',exact:true}).evaluate(node=>{Reflect.set(window,'e42LiveControl',node);Reflect.set(window,'e42LiveBefore',(node as HTMLInputElement).checked);Reflect.set(window,'e42LiveHit',undefined);node.addEventListener('click',()=>Reflect.set(window,'e42LiveCoreClick',evo42.snapshot().material),{once:true})});
   await page.evaluate(()=>{const samples:unknown[]=[];Reflect.set(window,'e42ForceSamples',samples);const sample=()=>{const m=evo42.snapshot().material;if(m&&!m.dragging&&Math.hypot(m.cx,m.cy)>.3&&Reflect.get(window,'e42LiveControl')&&!Reflect.get(window,'e42LiveHit')){const control=Reflect.get(window,'e42LiveControl') as HTMLInputElement,r=control.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);Reflect.set(window,'e42LiveHit',{inside:hit===control||!!hit&&control.contains(hit)});if(hit===control||!!hit&&control.contains(hit))control.click()}if(m)samples.push({...m,shellScale:document.querySelector<HTMLElement>('.dmt-settings-shell')?.style.scale,coreTranslate:document.querySelector<HTMLElement>('.dmt-controls-content')?.style.translate});Reflect.set(window,'e42ForceFrame',requestAnimationFrame(sample))};sample()});
   const original=await dialog.boundingBox();assert.ok(original);await drag(page,'.dmt-settings-header',width===390?2:48,8);
   if(material==='force'&&width===1280){
    await page.waitForFunction(()=>!!Reflect.get(window,'e42LiveHit'));
    const live=await page.evaluate(()=>({hit:Reflect.get(window,'e42LiveHit'),m:Reflect.get(window,'e42LiveCoreClick'),before:Reflect.get(window,'e42LiveBefore'),after:(Reflect.get(window,'e42LiveControl') as HTMLInputElement).checked}));
    assert.equal(live.hit.inside,true,'live core checkbox center resolves to the actual control');assert.equal(live.after,!live.before,'native HTMLElement click activates the same live control');assert.ok(live.m&&Math.hypot(live.m.cx,live.m.cy)>.3,'activation occurred in an observed moving frame');
   }
   await page.waitForFunction(()=>{const m=evo42.snapshot().material;return !!m&&m.fx===0&&m.fy===0&&m.cx===0&&m.cy===0});
   const forceSample=await page.evaluate(()=>{cancelAnimationFrame(Reflect.get(window,'e42ForceFrame'));return Reflect.get(window,'e42ForceSamples') as {cx:number;cy:number;shellScale?:string;coreTranslate?:string}[]});
   if(material==='force'){assert.ok(forceSample.some(m=>Math.hypot(m.cx,m.cy)>.1),'real inner core must move during force drag');assert.ok(forceSample.some(m=>m.shellScale&&m.shellScale!=='1 1'&&m.shellScale!=='1'),'real shell changes strain');}
   const probe=await page.evaluate(()=>{const root=document.querySelector('.dmt-settings-shell')!,canvas=root.querySelector('.sf-weather-canvas')!,r=root.getBoundingClientRect(),c=canvas.getBoundingClientRect(),heading=root.querySelector('h2')!,h=heading.getBoundingClientRect(),old=Reflect.get(window,'e42ProbeBefore');return{sameButton:old.button===root.querySelector('.dmt-close'),sameCanvas:old.canvas===canvas,offsetX:c.left-r.left,offsetY:c.top-r.top,deltaX:c.left-r.left-old.offsetX,deltaY:c.top-r.top-old.offsetY,insideHeading:h.left>=r.left&&h.right<=r.right,finite:[r.x,r.y,c.x,c.y].every(Number.isFinite),rect:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},state:evo42.snapshot()}});
   assert.ok(probe.sameButton&&probe.sameCanvas&&probe.insideHeading&&probe.finite);assert.ok(probe.rect.x>=-1&&probe.rect.right<=width+1,JSON.stringify(probe));
   assert.ok(Math.abs(probe.deltaX)<=.6&&Math.abs(probe.deltaY)<=.6,'rain and glass maintain their relative geometry across the drag');
   await page.emulateMedia({reducedMotion:'reduce'});await drag(page,'.dmt-settings-header',width===390?1:-15,0);await page.waitForFunction(()=>evo42.snapshot().material?.fx===0&&evo42.snapshot().material?.fy===0);
   await page.screenshot({path:path.join(out,material+'-'+width+'.png')});
   await close.click();await dialog.waitFor({state:'hidden'});await page.getByRole('button',{name:'正文操作',exact:true}).click();assert.match(await page.locator('#notice').textContent()??'',/正文操作成功/);
   await page.evaluate(()=>{evo42.openSettings();evo42.close();evo42.openSettings()});await dialog.waitFor({state:'visible'});await close.click();await dialog.waitFor({state:'hidden'});
   const ball=page.locator('.sf-motion-ball');await ball.waitFor();await ball.click();await page.locator('.sf-motion-petal').getByText('界面设置',{exact:true}).click();await dialog.waitFor({state:'visible'});assert.equal((await page.evaluate(()=>evo42.snapshot())).native.settings,1);await close.click();await dialog.waitFor({state:'hidden'});
   // MediaQueryList change listeners reset owners asynchronously; wait for the actual change delivery before starting a normal gesture.
   await page.evaluate(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');Reflect.set(window,'e42MotionReady',false);Reflect.set(window,'e42MotionQuery',media);media.addEventListener('change',()=>Reflect.set(window,'e42MotionReady',!media.matches),{once:true})});
   await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>Reflect.get(window,'e42MotionReady')===true);
   await drag(page,'.sf-motion-ball',-55,-35);
   assert.equal((await page.evaluate(()=>evo42.snapshot())).hub?.held,false,'pointerup releases the real free Hub input');
   const hit=await ball.boundingBox();assert.ok(hit);await page.mouse.move(hit.x+hit.width/2,hit.y+hit.height/2);await page.mouse.down();
   const grabbed=await page.evaluate(()=>evo42.snapshot().hub);assert.equal(grabbed?.held,true);assert.equal(grabbed?.phase,'rest','new input takes over actual position motion');await page.mouse.up();
   await page.waitForFunction(()=>evo42.snapshot().hub?.settled===true);
   const idle=await page.evaluate(async()=>{const before=evo42.snapshot().hub?.frames;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));return{before,after:evo42.snapshot().hub?.frames}});assert.equal(idle.before,idle.after,'settled study has no idle clock');
   await page.setViewportSize({width:900,height:width});await page.waitForFunction(()=>{const r=document.querySelector('.sf-motion-ball')!.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight});
   await page.evaluate(()=>evo42.dispose());await page.waitForFunction(()=>!document.querySelector('.e42-material-light,.e42-soft-core,.e42-thread,.e42-recall-echo,.sf-motion-hub,.sf-weather-canvas'));
   results.push({width,material,status:'PASS',probe});
  }finally{await context.close()}
 }
 // Same operation / viewport / wall-clock playback. Holds below are presentation pauses, not pass criteria.
 for(const mode of ['baseline','edge','force']){
  const context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:path.join(out,'video'),size:{width:1280,height:900}}}),page=await context.newPage();
  await page.goto(base+'/?material='+mode+'&motion=soft');await ready(page);await page.getByRole('button',{name:'打开界面设置',exact:true}).click();await page.locator('#dol-midnight-controls[open]').waitFor();await page.waitForTimeout(650);
  await page.locator('#dol-midnight-controls').getByRole('button',{name:'材质',exact:true}).click();await page.waitForTimeout(650);await drag(page,'.dmt-settings-header',50,8);await page.waitForTimeout(650);await page.locator('.dmt-close').click();await page.locator('#dol-midnight-controls').waitFor({state:'hidden'});
  const video=page.video()!;await context.close();await video.saveAs(path.join(out,mode+'.webm'));
 }
 }
 if(!process.argv.includes('--lifecycle-only')){
  const context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:path.join(out,'video'),size:{width:1280,height:900}}}),page=await context.newPage();
  await page.goto(base+'/?material=force&motion=recall');await ready(page);await page.locator('.sf-motion-ball').waitFor();
  const b=await page.locator('.sf-motion-ball').boundingBox();assert.ok(b);await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(640,450,{steps:18});await page.mouse.up();await page.waitForFunction(()=>evo42.snapshot().hub?.settled===true);await page.waitForTimeout(650);
  await page.getByRole('button',{name:'召回到默认位置',exact:true}).click();await page.waitForFunction(()=>evo42.snapshot().hub?.settled===true);await page.waitForTimeout(650);
  const video=page.video()!;await context.close();await video.saveAs(path.join(out,'hub.webm'));
 }
 assert.deepEqual(errors,[]);
}catch(error){failure=String(error);throw error}
finally{
 const sources=['prototypes/evolution42/index.html','prototypes/evolution42/main.ts','prototypes/evolution42/material.ts','prototypes/evolution42/hub.ts','prototypes/evolution42/shop-fixture.ts','prototypes/evolution42/FreeHub.vue','prototypes/evolution42/hub-position.ts','prototypes/evolution42/hub-motion.ts','prototypes/evolution42/style.css','prototypes/evolution42/check.mts','prototypes/evolution42/compare.html','prototypes/evolution42/compare.ts','scripts/preview-evo42.mts'];
 const mode=process.argv.includes('--lifecycle-only')?'lifecycle-only':'full-prototype';
 fs.writeFileSync(path.join(out,mode==='lifecycle-only'?'lifecycle-result.json':'result.json'),JSON.stringify({schema:1,mode,expected:{lifecycle:3,materialLoops:mode==='lifecycle-only'?0:6,videos:mode==='lifecycle-only'?0:4},status:failure?'FAIL':'PASS',sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()),node:process.version,browser:browser.version(),results,errors,failure,inputs:sources.map(file=>({file,sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex')})),limits:['Controlled desktop Chromium, no game or physical device','Isolated actual free position/recall; production MotionHub is unchanged','No measured GPU/power or touch latency conclusion']},null,2));await browser.close();await server.close();
}
console.log(process.argv.includes('--lifecycle-only')?'PASS EVO42: three actual lifecycle interruption/retirement regressions.':'PASS EVO42: six material/viewport loops, three lifecycle regressions, real controls, joint relative geometry, Hub release/cancel/idle, rotation/reduced/cleanup and original-speed videos.');
