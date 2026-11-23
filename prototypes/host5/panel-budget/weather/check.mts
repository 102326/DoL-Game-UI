import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createLabServer} from '../server.mts';
import type {} from './lab.ts';
const entryStudy=process.argv.includes('--entry');
const conditions=entryStudy?['instant','fade','visible']:['A','B','C'];
const server=await createLabServer();await server.listen();
const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const browser=await chromium.launch(), blocks=[];
try {
 for(let rotation=0;rotation<3;rotation++){
  const order=conditions.slice(rotation).concat(conditions.slice(0,rotation));
  for(const condition of order){
   const mode=entryStudy?'C':condition;
   const page=await browser.newPage({viewport:{width:390,height:820},reducedMotion:'no-preference'});
   const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+address.port+'/prototypes/host5/panel-budget/weather/?mode='+mode+(entryStudy?'&entry='+condition:''));
   await page.waitForFunction(()=>!!window.weatherLab);
   const start=page.locator('#start'),close=page.getByRole('button',{name:'Close',exact:true}),toggle=page.getByRole('button',{name:'Inspector',exact:true});
   if(mode==='C'){
    await toggle.evaluate(el=>(el as HTMLButtonElement).click());
    assert.equal(await page.evaluate(()=>window.weatherLab.counts().direct),0,'script activation gets no reserve');
    await toggle.evaluate(el=>(el as HTMLButtonElement).click());
   }
   const initial=await page.evaluate(()=>({...window.weatherLab.sky(),now:performance.now()}));
   let sequence=0;
   for(let repeat=0;repeat<2;repeat++)for(const method of ['mouse','keyboard']){
    for(const control of [start,close,toggle,toggle]){
     // Equal opportunity for weather frames even when B skips its fade.
     await page.waitForFunction(deadline=>performance.now()>=deadline,initial.now+sequence*300);
     if(method==='mouse')await control.click();else {await control.focus();await page.keyboard.press('Enter')}
     sequence++;
     try {await page.waitForFunction(n=>window.weatherLab.samples.length===n,sequence,{timeout:3000})}
     catch(error){console.error(mode,sequence,method,errors,await page.evaluate(()=>({lab:!!window.weatherLab,last:window.weatherLab.samples.at(-1),focus:document.activeElement?.tagName})));throw error}
     await page.waitForFunction(expected=>{const c=window.weatherLab.counts();return !c.direct && c.shared===expected},Number(mode!=='A'));
    }
   }
   await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
   const data=await page.evaluate(()=>{
    const l=window.weatherLab;l.flush();
    const lo=l.samples[0]!.inputStart,hi=l.samples.at(-1)!.inputStart+l.samples.at(-1)!.followingRafMs;
    const gaps=l.frames.slice(1).flatMap((t,i)=>t>=lo&&t<=hi?[t-l.frames[i]!]:[]);
    return {samples:l.samples,entries:l.entries,frameGaps:gaps,supported:l.supported,sky:{...l.sky(),now:performance.now()},counts:l.counts()};
   });
   assert.equal(data.samples.length,16);
   assert.ok(data.samples.every(s=>s.grant===(mode!=='B' && condition!=='instant') && s.inputToClickEndMs>=0 && s.followingRafMs>=s.nextRafMs));
   assert.equal(data.samples.filter(s=>s.kind==='keydown').length,8);
   if(entryStudy){
    const openings=data.samples.filter(s=>s.action.endsWith('-open'));
    for(const sample of openings){
     const values=sample.opacityFrames!;
     assert.ok(values.at(-1)!>=.999,'opening reaches full opacity');
     assert.ok(values.every((v,i)=>!i || v>=values[i-1]!-.001),'no backward jumps');
     if(condition==='visible')assert.ok(values[0]!>=.59,'already visible in first rAF');
     if(condition==='instant')assert.ok(values.every(v=>v===1),'immediate presentation');
    }
   }
   if(mode!=='A'){
    assert.equal(data.sky.legs,initial.legs,'no weather restart during inputs');
    assert.equal(data.sky.rate,1);
    assert.ok(Math.abs((data.sky.time-initial.time)-(data.sky.now-initial.now))<100,'no weather suspension during inputs');
   }
   const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,sky:document.querySelector('#sky')!.getBoundingClientRect().width,
    peer:document.querySelector('#inspector')!.getBoundingClientRect().width}));
   assert.ok(!geometry.overflow&&geometry.sky>320&&geometry.peer===geometry.sky);
   // Release an in-flight peer during the same trusted click, before the browser can finish it.
   await toggle.evaluate(el=>el.addEventListener('click',()=>window.weatherLab.removeInspector(),{once:true}));
   await toggle.click();
   assert.deepEqual(await page.evaluate(()=>window.weatherLab.counts()),{shared:Number(mode!=='A'),direct:0});
   await page.evaluate(()=>window.weatherLab.stopWeather());
   assert.deepEqual(await page.evaluate(()=>window.weatherLab.counts()),{shared:0,direct:0});
   await start.click();assert.equal(await close.isVisible(),true);await close.click();await close.waitFor({state:'hidden'});
   await page.evaluate(()=>window.weatherLab.startWeather());
   if(mode!=='A'){
    await page.waitForFunction(()=>window.weatherLab.sky().time>0);
    // Exercise the same endpoint continuation without adding eight seconds to every block.
    await page.locator('#cloud').evaluate(n=>{n.getAnimations()[0]!.currentTime=7990});
    await page.waitForFunction(()=>window.weatherLab.sky().rate<0);
   }
   await page.evaluate(()=>window.weatherLab.dispose());
   assert.deepEqual(await page.evaluate(()=>window.weatherLab.counts()),{shared:0,direct:0});
   assert.deepEqual(errors,[]);blocks.push({mode,condition,order,geometry,initial,...data});await page.close();
  }
 }
 const receipt={browser:browser.version(),node:process.version,platform:process.platform,viewport:[390,820],blocks};
 const output=process.argv.slice(2).find(arg=>!arg.startsWith('--'));
 if(output)await writeFile(output,JSON.stringify(receipt)+'\n');
 for(const mode of conditions){
  const sets=blocks.filter(b=>b.condition===mode), samples=sets.flatMap(b=>b.samples);
  const p=(ns:number[],q:number)=>Number([...ns].sort((a,b)=>a-b)[Math.ceil(ns.length*q)-1]?.toFixed(2));
  const dist=(ns:number[])=>[p(ns,.5),p(ns,.95)];
  const matched=sets.flatMap(b=>b.samples.flatMap(s=>b.entries.filter(e=>e.name===s.kind&&Math.abs(e.start-s.inputStart)<.51)));
  const gaps=sets.flatMap(b=>b.frameGaps);
  console.log(JSON.stringify({mode,n:samples.length,grants:samples.filter(s=>s.grant).length,matched:matched.length,
   eventTiming:matched.length?dist(matched.map(e=>e.duration)):null,handler:dist(samples.map(s=>s.dispatchMs)),
   inputToRaf:dist(samples.map(s=>s.nextRafMs)),following:dist(samples.map(s=>s.followingRafMs)),
   gaps:gaps.length,frame:dist(gaps),over50:gaps.filter(n=>n>50).length}));
 }
} finally {await browser.close();await server.close()}
