import playwright = require('playwright');
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import crypto = require('node:crypto');
import type {Clothing,WardrobeVariables} from '../src/wardrobe/host';
import type {GameUiControls} from '../src/runtime/game-controls';
const {chromium}=playwright;
type FixtureClothing=Clothing&{colour_options?:(string|number)[];accessory_colour_options?:(string|number)[]};
declare const V:WardrobeVariables&{wardrobe:{upper:FixtureClothing[];lower:FixtureClothing[]};worn:{upper:FixtureClothing;lower:FixtureClothing}},setup:{clothes:{upper:FixtureClothing[];lower:FixtureClothing[]}};
type Handler=(this:unknown,...args:unknown[])=>unknown;
declare const SugarCube:{State:{variables:{options:unknown}};Engine:{play(name:string):unknown};Save:{serialize():string;deserialize(value:string):unknown};Macro:{get(name:string):{handler:Handler}}};
declare const DoLGameUI:GameUiControls,DoLWardrobeUI:ReturnType<typeof import('../src/wardrobe/main')['startWardrobe']>;
declare const wardrobeBench:{listCalls:number;listMs:number};
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing current wardrobe fixture');return value;}

type MeasurementRow={name:string;syncMs:number;readyMs:number;listCalls:number;listMs:number;dom:number;visibleItems:number;nativeNodes:number;longTasks:{start:number;duration:number}[];phases:ReturnType<typeof DoLWardrobeUI.performance.report>['phases']};
type Round={hidden:boolean;round:number;warmup:boolean;rows:MeasurementRow[];stateHash:string;errors:(string|null)[]};
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});

// Current-build warm-cache baseline. Synthetic inventory; never connects to a user's game.
(async()=>{
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const p=await browser.newPage({viewport:{width:1363,height:876}}),errors:Array<string|undefined>=[];
  p.on('pageerror',e=>errors.push(e.stack));
  await p.addInitScript(()=>{localStorage.setItem('verifiedAge','true');Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value==null)throw Error('Missing current wardrobe fixture');return value}})});
  await p.goto(`http://127.0.0.1:${(()=>{const a=server.address();assert.ok(a&&typeof a!=='string');return a.port})()}/game`,{waitUntil:'load',timeout:90000});
  await p.waitForFunction(()=>(typeof SugarCube==='undefined'?undefined:SugarCube)?.State?.variables?.options);
  await p.waitForLoadState('networkidle');
  await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');
  await p.evaluate(()=>{
   V.location='home';V.lastWardrobeSlot='upper';V.wardrobe_location='wardrobe';
   for(const [slot,count] of [['upper',80],['lower',40]] as const){
    const defs=setup.clothes[slot].filter(c=>c.name!=='naked'&&!c.outfitPrimary&&!c.outfitSecondary);
    for(let n=0;n<count;n++){const item=structuredClone(must(defs[n%defs.length]));item.colour=item.colour_options?.[0]??0;item.accessory_colour=item.accessory_colour_options?.[0]??0;V.wardrobe[slot].push(item)}
   }
   SugarCube.Engine.play('Bedroom');
  });
  const baseline=await p.evaluate(()=>SugarCube.Save.serialize());
  await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
  await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
  const environment=await p.evaluate(()=>({ui:DoLGameUI.version,userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],inventory:{upper:V.wardrobe.upper.length,lower:V.wardrobe.lower.length}}));
  await p.evaluate(()=>{
   Object.assign(window,{wardrobeBench:{listCalls:0,listMs:0}});const macro=SugarCube.Macro.get('wardrobeList'),original=macro.handler;
   macro.handler=function(...args){wardrobeBench.listCalls++;const start=performance.now();try{return original.apply(this,args)}finally{wardrobeBench.listMs+=performance.now()-start}};
  });
  const rounds:Round[]=[];
  // One warmup pair, followed by three alternating pairs. Reload identical native save before each.
  for(let round=0;round<4;round++)for(const hidden of round%2?[true,false]:[false,true]){
   await p.evaluate(data=>SugarCube.Save.deserialize(data),baseline);
   await p.waitForLoadState('networkidle');
   const measured=await p.evaluate(async({hidden,round})=>{
    DoLWardrobeUI.setNativeHiddenList(hidden);DoLWardrobeUI.performance.setEnabled(true);
    const rows:MeasurementRow[]=[],longTasks:{start:number;duration:number}[]=[],observer=PerformanceObserver.supportedEntryTypes.includes('longtask')?new PerformanceObserver(l=>longTasks.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration})))):null;
    observer?.observe({type:'longtask',buffered:false});
    const frame=()=>new Promise<void>(r=>requestAnimationFrame(()=>r()));
    async function measure(name:string,action:()=>unknown){
     DoLWardrobeUI.performance.reset();const calls=wardrobeBench.listCalls,listMs=wardrobeBench.listMs;let start=0,syncMs=0;
     // Run as a page task so Long Tasks can observe it, not inside a CDP evaluation task.
     await new Promise<void>((resolve,reject)=>setTimeout(()=>{start=performance.now();try{action();syncMs=performance.now()-start;resolve()}catch(e){reject(e)}},0));
     await frame();await frame();
     while(document.querySelector('.dgw-preview')?.getAttribute('aria-busy')!=='false'){
      if(performance.now()-start>15000)throw Error('preview timeout '+name);await frame();
     }
     await frame();await frame();const end=performance.now();await new Promise(r=>setTimeout(r,0));
     longTasks.push(...(observer?.takeRecords()??[]).map(e=>({start:e.startTime,duration:e.duration})));
     if(!document.querySelector('.dgw-preview canvas'))throw Error('missing preview '+name);
     rows.push({name,syncMs,readyMs:end-start,listCalls:wardrobeBench.listCalls-calls,listMs:wardrobeBench.listMs-listMs,dom:document.querySelectorAll('.dgw-root *').length,visibleItems:document.querySelectorAll<HTMLButtonElement>('.dgw-item').length,nativeNodes:document.querySelectorAll('#wardrobeList *').length,longTasks:longTasks.filter(e=>e.start+e.duration>start&&e.start<end),phases:DoLWardrobeUI.performance.report().phases});
    }
    try{
     await measure('enter',()=>SugarCube.Engine.play('Wardrobe'));
     for(const label of ['下装','上装'])await measure('category-'+label,()=>must([...document.querySelectorAll<HTMLButtonElement>('.dgw-slots button')].find(b=>b.textContent?.includes(label))).click());
     for(const query of ['NoSuchClothing_Baseline',''])await measure(query?'search-empty':'search-reset',()=>{const e=must(document.querySelector<HTMLInputElement>('.dgw-tools input'));e.value=query;e.dispatchEvent(new Event('input',{bubbles:true}))});
     const node=[...document.querySelectorAll<HTMLButtonElement>('.dgw-item')].find(e=>must(V.wardrobe.upper[Number(must(e.dataset.key).split(':')[1])]).variable!==V.worn.upper.variable);
     if(!node)throw Error('no different garment');
     const item=must(V.wardrobe.upper[Number(must(node.dataset.key).split(':')[1])]),expected={variable:item.variable,colour:item.colour};
     await measure('wear',()=>node.click());
     if(V.worn.upper.variable!==expected.variable||V.worn.upper.colour!==expected.colour)throw Error('native wear mismatch');
     return {hidden,round,warmup:round===0,rows,state:JSON.stringify({money:V.money,worn:V.worn,wardrobe:V.wardrobe,time:V.timeStamp}),errors:[...document.querySelectorAll('.error')].map(e=>e.textContent)};
    }finally{observer?.disconnect()}
   },{hidden,round});
   assert.deepEqual(measured.errors,[]);const {state,...rest}=measured;const result={...rest,stateHash:crypto.createHash('sha256').update(state).digest('hex')};
   rounds.push(result);console.log('ROUND',round,hidden,result.rows.map(r=>[r.name,Math.round(r.readyMs),r.listCalls]));
  }
  for(let round=0;round<4;round++){const pair=rounds.filter(r=>r.round===round);assert.equal(must(pair[0]).stateHash,must(pair[1]).stateHash,'same business state on/off')}
  assert.deepEqual(errors,[]);
  const median=(a:number[])=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
  const summary=[false,true].map(hidden=>({hidden,operations:must(rounds[0]).rows.map(({name})=>{const samples=rounds.filter(r=>!r.warmup&&r.hidden===hidden).flatMap(r=>r.rows.filter(x=>x.name===name));return {name,n:samples.length,syncMedian:median(samples.map(x=>x.syncMs)),readyMedian:median(samples.map(x=>x.readyMs)),readyRange:[Math.min(...samples.map(x=>x.readyMs)),Math.max(...samples.map(x=>x.readyMs))],listCalls:samples.map(x=>x.listCalls),listMsMedian:median(samples.map(x=>x.listMs)),longTasks:samples.flatMap(x=>x.longTasks).length}})}));
  const output=path.join(__dirname,'artifacts',`wardrobe-current-baseline-${Date.now()}.json`);
  fs.writeFileSync(output,JSON.stringify({environment,scope:'Desktop Edge warm cache, synthetic inventory, native save restored per sample, no CPU throttle. readyMs includes animation frame scheduling; not physical display latency. Nested phase times cannot be added. No Android proof.',rounds,summary,errors},null,2));
  console.log(JSON.stringify({output,summary},null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
