// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"entry"}
// Controlled rain-level / snow research. Visual acceptance remains with the owner.
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import cp = require('node:child_process');
import crypto = require('node:crypto');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {weatherSurface} from '../prototypes/evolution-weather/renderer';
const {chromium}=playwright;
type Snapshot=ReturnType<ReturnType<typeof weatherSurface>['snapshot']>;
function glass(value:Snapshot|undefined){if(!value||!('microVisible' in value))throw Error('Expected glass climate snapshot');return value}
function must<T>(value:T|null|undefined):T{if(value===null||value===undefined)throw Error('Missing rain level value');return value}
declare const weatherStudy:{snapshot():Snapshot|undefined;set(kind:string):void;close():void;reopen():void};
declare const rainOptics:{snapshot():{snow:number}};
declare let paint:number[];declare let intervals:number[];declare let perfRaf:number;
const baseline=process.argv.includes('--baseline'),record=process.argv.includes('--record'),dist=path.resolve('tests/artifacts/evolution/weather-dist'),out=path.resolve('tests/artifacts/evolution/weather-r6-'+(baseline?'baseline-':'')+Date.now());fs.mkdirSync(out,{recursive:true});
const query='candidate=glass&background=day&trail=natural&runoff=1&'+(baseline?'climate-controls=1':'climate=1');
const server=http.createServer((q,r)=>{const name=new URL(q.url??'/','http://local').pathname,f=path.resolve(dist,'.'+(name==='/'?'/index.html':name));if(!f.startsWith(dist+path.sep)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');fs.createReadStream(f).pipe(r)});
(async()=>{let browser,context,page:playwright.Page|undefined;const results:Array<{level:string;state:ReturnType<typeof glass>}>=[],events:Array<{label:string;plannedMs:number|null;actualMs:number}>=[];try{
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}`;browser=await chromium.launch(browserOptions);
 context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,recordVideo:record?{dir:path.join(out,'raw'),size:{width:1280,height:900}}:undefined});page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/?'+query);await page.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value===null||value===undefined)throw Error('Missing rain level fixture');return value},glass:(value:Snapshot|undefined)=>{if(!value||!('microVisible' in value))throw Error('Expected glass climate snapshot');return value}}));await page.waitForFunction(()=>typeof weatherStudy!=='undefined'&&(weatherStudy.snapshot()?.width??0)>0);const p=page;
 const reading=await p.locator('.dmt-reading-sample').screenshot(),start=Date.now();
  await p.evaluate(()=>{Object.assign(window,{paint:[] as number[],intervals:[] as number[]});let last=performance.now();const loop=(t:number)=>{intervals.push(t-last);last=t;paint.push(glass(weatherStudy.snapshot()).paintMs);perfRaf=requestAnimationFrame(loop)};perfRaf=requestAnimationFrame(loop)});
  const at=async(ms:number,label:string,action:()=>Promise<unknown>)=>{if(record)await p.waitForTimeout(Math.max(0,start+ms-Date.now()));await action();events.push({label,plannedMs:record?ms:null,actualMs:Date.now()-start})};
 await at(1000,'clear',()=>p.screenshot({path:path.join(out,'climate-clear.png')}));
  const levels:Array<[number,string,string,number]>=[[0,'light','小雨',.32],[1,'normal','常规雨',.65],[2,'heavy','大雨',1],[3,'severe','强雨',1.5]];
  for(const [i,level,button,target]of levels){
  await at(2000+i*7000,level+' input',()=>p.getByRole('button',{name:button,exact:true}).click());
   if(!baseline)await p.waitForFunction(t=>Math.abs((weatherStudy.snapshot()?.intensity??0)-t)<.035&&(weatherStudy.snapshot()?.wet??0)>.84,target);
  await at(8000+i*7000,level+' steady',()=>p.screenshot({path:path.join(out,'climate-'+level+'.png')}));
  const s=await p.evaluate(()=>glass(weatherStudy.snapshot()));results.push({level,state:s});assert.equal(s.target.rain,level);assert.equal(s.protectedOverlap,0);assert.deepEqual(await p.locator('.dmt-reading-sample').screenshot(),reading);
 }
  if(!baseline)assert.ok(results.every((r,i)=>i===0||r.state.microVisible>must(results[i-1]).state.microVisible),'actual drawn microdrop counts must distinguish all four rain levels');
  await at(30000,'rain to snow',()=>p.evaluate(()=>{const before=glass(weatherStudy.snapshot());weatherStudy.set('snow');const after=glass(weatherStudy.snapshot());if(before.wet!==after.wet||before.snow!==after.snow)throw Error('weather set must not jump continuous material state')}));
  await p.waitForFunction(()=>(weatherStudy.snapshot()?.snow??0)>.78);
 await at(37000,'snow growing',()=>p.screenshot({path:path.join(out,'climate-snow-transition.png')}));
  await p.waitForFunction(()=>(weatherStudy.snapshot()?.snow??0)>.94&&(weatherStudy.snapshot()?.wet??1)<.03);
 await at(45000,'snow steady',()=>p.screenshot({path:path.join(out,'climate-snow.png')}));
 const snow=await p.evaluate(()=>glass(weatherStudy.snapshot()));results.push({level:'snow',state:snow});
  if(!baseline){assert.ok((snow.icePlates??0)>8&&(snow.snowflakes??0)>0);assert.equal(snow.protectedOverlap,0);assert.deepEqual(await p.locator('.dmt-reading-sample').screenshot(),reading)}
 if(!record){
  await p.getByRole('button',{name:'静止观察',exact:true}).click();const frozen=await p.evaluate(()=>glass(weatherStudy.snapshot()));await p.waitForFunction(()=>!must(document.querySelector('.dmt-close')).getAnimations().some(a=>a.playState==='running'));const snowOn=await p.locator('.dmt-settings-shell').screenshot(),close=await p.locator('.dmt-close').screenshot();
   await p.locator('.evo-weather-canvas').evaluate(n=>{if(!(n instanceof HTMLCanvasElement))throw Error('Missing weather canvas');must(n.getContext('2d')).clearRect(0,0,n.width,n.height)});const snowOff=await p.locator('.dmt-settings-shell').screenshot();assert.notDeepEqual(snowOn,snowOff,'snow material must alter actual composed settings pixels');assert.deepEqual(await p.locator('.dmt-reading-sample').screenshot(),reading);assert.ok((await p.locator('.dmt-close').screenshot()).equals(close),'snow must not change settled close-button pixels');fs.writeFileSync(path.join(out,'snow-pixels-on.png'),snowOn);fs.writeFileSync(path.join(out,'snow-pixels-off.png'),snowOff);
  await p.waitForTimeout(100);assert.equal((await p.evaluate(()=>glass(weatherStudy.snapshot()))).time,frozen.time);await p.getByRole('button',{name:'继续动态',exact:true}).click();
 }
  await at(46000,'snow to rain',()=>p.getByRole('button',{name:'大雨',exact:true}).click());await p.waitForFunction(()=>(weatherStudy.snapshot()?.snow??1)<.24&&(weatherStudy.snapshot()?.wet??0)>.8);
 await at(52000,'rain return',()=>p.screenshot({path:path.join(out,'climate-return.png')}));
  const perf=await p.evaluate(()=>{cancelAnimationFrame(perfRaf);const q=(a:number[],percentile:number)=>{a=a.slice(2).sort((x,y)=>x-y);return must(a[Math.floor((a.length-1)*percentile)])};return{intervalMs:{median:q(intervals,.5),p95:q(intervals,.95)},cpuDrawMs:{median:q(paint,.5),p95:q(paint,.95)}}});
  const video=p.video();if(record){if(!video)throw Error('Expected rain level video');await context.close();context=undefined;cp.execFileSync('ffmpeg',['-y','-i',await video.path(),'-c:v','libx264','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'climate-1x.mp4')],{stdio:'pipe'})}
 else{
   await p.getByRole('button',{name:'直接观雪',exact:true}).click();await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>weatherStudy.snapshot()?.activeFrames===0);const reduced=await p.evaluate(()=>glass(weatherStudy.snapshot()));assert.equal(reduced.snow,1);assert.ok((reduced.icePlates??0)>0);await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal((await p.evaluate(()=>glass(weatherStudy.snapshot()))).protectedOverlap,0);
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal((await p.evaluate(()=>glass(weatherStudy.snapshot()))).activeFrames,0);assert.equal((await p.evaluate(()=>glass(weatherStudy.snapshot()))).activePolls,0);await p.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'));weatherStudy.close()});await p.waitForFunction(()=>weatherStudy.snapshot()?.disposed);assert.equal(await p.locator('.evo-material-layer').count(),0);await p.evaluate(()=>weatherStudy.reopen());await p.waitForFunction(()=>!weatherStudy.snapshot()?.disposed);assert.equal(await p.locator('.evo-material-layer').count(),1);await context.close();context=undefined;
 }
 assert.deepEqual(errors,[]);
 if(record){
 // Material close-up is a separate, unrecorded view; it cannot stand in for real settings readability.
 context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});page=await context.newPage();await page.goto(base+'/glass-optics.html?trail=natural&runoff=1&'+(baseline?'climate-controls=1':'climate=1'));await page.getByRole('button',{name:'雪天',exact:true}).click();await page.waitForFunction(()=>rainOptics.snapshot().snow>.95);await page.getByRole('button',{name:'静止观察',exact:true}).click();for(const [name,label]of[['day','日光'],['night','夜灯']]){await page.getByRole('button',{name:label,exact:true}).click();await page.screenshot({path:path.join(out,'climate-material-'+name+'.png')})}
 }
 const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','src/ui/weather','prototypes/evolution-weather','tests/evolution-weather-levels.cjs','tests/evolution-rain-model.test.cjs','vite.evolution-weather.config.ts'],{encoding:'utf8'}).trim().split('\n');
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({scope:'R6 controlled rain intensity and snow. Record retains 1x waiting and operations; smoke uses state predicates. Not owner visual acceptance or physical-device evidence.',baseline,record,runtime:{node:process.version,platform:process.platform,chromium:browser.version()},viewport:{width:1280,height:900,dpr:1},events,results,perf,errors,hashes:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))},null,2));console.log('PASS',baseline?'C3 baseline':'C4 rain/snow',JSON.stringify(perf),'Evidence',out);
 }catch(e){try{await page?.screenshot({path:path.join(out,'failure.png')})}catch{}fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e instanceof Error?e.stack:String(e),events,results},null,2));throw e}finally{await context?.close();await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
