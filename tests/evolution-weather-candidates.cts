// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"entry"}
// Deterministic evidence, not a visual quality judge. Same operation/viewport/time plan for V1/A/B.
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import cp = require('node:child_process');
import crypto = require('node:crypto');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {weatherSurface as candidateSurface} from '../prototypes/evolution-weather/renderer';
import type {weatherSurface as v1Surface} from '../prototypes/evolution-weather/v1-renderer';
const {chromium}=playwright;
type MaterialSnapshot=ReturnType<ReturnType<typeof candidateSurface>['snapshot']>;
type StudySnapshot=MaterialSnapshot|ReturnType<ReturnType<typeof v1Surface>['snapshot']>;
function must<T>(value:T|null|undefined):T{if(value===null||value===undefined)throw Error('Missing weather candidate value');return value}
function materialSnapshot(value:StudySnapshot){if(!('protectedOverlap' in value))throw Error('Expected owned weather material');return value}
declare const weatherStudy:{snapshot():StudySnapshot|undefined;set(kind:string):void;close():void;reopen():void};
declare const optics:ReturnType<typeof candidateSurface>;
declare let reviewFrames:number[];declare let reviewPaint:number[];declare let reviewRaf:number;
const dist=path.resolve('tests/artifacts/evolution/weather-dist'),out=path.resolve('tests/artifacts/evolution/weather-r2-'+Date.now());fs.mkdirSync(out,{recursive:true});
const server=http.createServer((q,r)=>{const url=new URL(q.url??'/','http://local'),file=path.resolve(dist,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)){r.writeHead(404);return r.end()}r.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(r)});
(async()=>{let browser,context,page:playwright.Page|undefined;const results:Array<Record<string,unknown>>=[];try{
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address&&typeof address!=='string');const port=address.port;browser=await chromium.launch(browserOptions);
 const record=process.argv.includes('--record'),scale=record?1:.25;
 for(const candidate of (process.argv.includes('--optics-only')?[]:['v1','beads','film'])){
  context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,recordVideo:record?{dir:path.join(out,'raw'),size:{width:1280,height:900}}:undefined});page=await context.newPage();const p:playwright.Page=page,errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/?candidate=${candidate}`);await p.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value===null||value===undefined)throw Error('Missing weather candidate fixture');return value},materialSnapshot:(value:StudySnapshot)=>{if(!('protectedOverlap' in value))throw Error('Expected owned weather material');return value}}));await p.waitForFunction(()=>typeof weatherStudy!=='undefined'&&(weatherStudy.snapshot()?.width??0)>0);const start=Date.now(),events:Array<{plannedMs:number;actualMs:number;name:string}>=[];
  const at=async(ms:number,name:string,action:()=>Promise<unknown>)=>{await p.waitForTimeout(Math.max(0,start+ms*scale-Date.now()));await action();events.push({plannedMs:ms*scale,actualMs:Date.now()-start,name})};
  await p.evaluate(()=>{Object.assign(window,{reviewFrames:[] as number[],reviewPaint:[] as number[]});let last=performance.now();function tick(t:number){reviewFrames.push(t-last);last=t;const s=weatherStudy.snapshot();if(s&&'paintMs' in s&&typeof s.paintMs==='number')reviewPaint.push(s.paintMs);reviewRaf=requestAnimationFrame(tick)}reviewRaf=requestAnimationFrame(tick)});
  await at(1500,'clear / still',()=>p.screenshot({path:path.join(out,candidate+'-clear.png')}));
  const protectedBefore=await p.locator('.dmt-reading-sample').screenshot();
  await at(2000,'rain',()=>p.getByRole('button',{name:'W2 晴转雨',exact:true}).click());
  await p.waitForFunction(()=>(weatherStudy.snapshot()?.wet??0)>.55);
  await at(14000,'steady rain and attachment',()=>p.screenshot({path:path.join(out,candidate+'-rain.png')}));
  const protectedAfter=await p.locator('.dmt-reading-sample').screenshot();if(candidate!=='v1')assert.deepEqual(protectedAfter,protectedBefore,'native rendered reading sample unchanged by weather material');
  const rain=await p.evaluate(()=>must(weatherStudy.snapshot()));assert.equal(rain.target.kind,'rain');if(candidate!=='v1'){const material=materialSnapshot(rain);assert.equal(material.protectedOverlap,0);assert.ok(material.activeDrops>0);if(record)assert.ok(material.moving>0,'visible attached-to-flowing bead required in original-speed review');assert.equal(material.backdropSupported,true)}
  await at(17000,'real category material',()=>p.getByRole('button',{name:'材质',exact:true}).click());
  await p.waitForFunction(()=>!must(document.querySelector('dialog')).hasAttribute('data-workspace-transition'));
  await at(19000,'real category reading',()=>p.getByRole('button',{name:'阅读',exact:true}).click());
  await p.waitForFunction(()=>!must(document.querySelector('dialog')).hasAttribute('data-workspace-transition'));
  await at(24000,'still observation / no input',async()=>{});
  const continuity=await p.evaluate(()=>{const before=must(weatherStudy.snapshot());weatherStudy.set('snow');return{before,after:must(weatherStudy.snapshot())}});assert.equal(continuity.before.wet,continuity.after.wet);assert.equal(continuity.before.snow,continuity.after.snow);
  await p.waitForFunction(()=>(weatherStudy.snapshot()?.snow??0)>.45);await p.screenshot({path:path.join(out,candidate+'-snow.png')});
  const perf=await p.evaluate(()=>{cancelAnimationFrame(reviewRaf);const quant=(a:number[],q:number)=>{const b=a.slice(2).sort((x,y)=>x-y);return b[Math.floor((b.length-1)*q)]};return{frames:reviewFrames.length,intervalMs:{median:quant(reviewFrames,.5),p95:quant(reviewFrames,.95),max:Math.max(...reviewFrames)},cpuDrawMs:{median:quant(reviewPaint,.5),p95:quant(reviewPaint,.95)},note:'rAF scheduling and JS/Canvas draw timing in this actual browser; not GPU compositor time or an acceptance threshold'}});
  if(candidate!=='v1'){
   await p.getByRole('button',{name:'静止观察',exact:true}).click();const stopped=await p.evaluate(()=>must(weatherStudy.snapshot()));await p.waitForTimeout(100);assert.equal((await p.evaluate(()=>must(weatherStudy.snapshot()))).frames,stopped.frames);await p.getByRole('button',{name:'继续动态',exact:true}).click();
   const hidden=await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));return must(weatherStudy.snapshot())});await p.waitForTimeout(100);assert.equal((await p.evaluate(()=>must(weatherStudy.snapshot()))).frames,hidden.frames);assert.equal(hidden.activeFrames,0);assert.equal(hidden.activePolls,0);await p.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'))});
   await p.setViewportSize({width:390,height:844});await p.waitForTimeout(120);const narrow=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,state:materialSnapshot(must(weatherStudy.snapshot()))}));assert.ok(narrow.scroll<=narrow.width+1);assert.equal(narrow.state.protectedOverlap,0);
   await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>weatherStudy.snapshot()?.activeFrames===0);
   await p.getByRole('button',{name:'静止观察',exact:true}).click();await p.evaluate(()=>weatherStudy.close());await p.waitForFunction(()=>weatherStudy.snapshot()?.disposed);assert.equal(await p.locator('.evo-material-layer').count(),0);assert.equal((await p.evaluate(()=>must(weatherStudy.snapshot()))).activePolls,0);await p.evaluate(()=>weatherStudy.reopen());await p.waitForFunction(()=>{const state=weatherStudy.snapshot();return !!state&&!state.disposed});assert.equal(await p.locator('.evo-material-layer').count(),1);assert.equal(materialSnapshot(await p.evaluate(()=>must(weatherStudy.snapshot()))).paused,false);assert.equal(await p.getByRole('button',{name:'静止观察',exact:true}).getAttribute('aria-pressed'),'false');
  }
  assert.deepEqual(errors,[]);const video=p.video();await context.close();context=undefined;
  if(video)cp.execFileSync('ffmpeg',['-y','-i',await video.path(),'-c:v','libx264','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,candidate+'-1x.mp4')],{stdio:'pipe'});
  results.push({candidate,viewport:{width:1280,height:900,dpr:1},events,rain,continuity,perf,errors});console.log('PASS candidate',candidate,JSON.stringify(perf));
 }
 context=await browser.newContext({viewport:{width:1000,height:650}});page=await context.newPage();const opticsPage=page;await opticsPage.goto(`http://127.0.0.1:${port}/optics.html`);await opticsPage.waitForFunction(()=>optics.snapshot().activeDrops>0);await opticsPage.evaluate(()=>optics.pause(true));const nativeBefore=await opticsPage.locator('#glass').screenshot();const outside=must(await opticsPage.locator('#glass').boundingBox());const untouched={x:outside.x+330,y:outside.y+30,width:80,height:20};const outsideBefore=await opticsPage.screenshot({clip:untouched});await opticsPage.getByRole('button',{name:'切换背景滤镜'}).click();const nativeAfter=await opticsPage.locator('#glass').screenshot();assert.deepEqual(await opticsPage.screenshot({clip:untouched}),outsideBefore,'uncovered DOM pixels must not change with droplet filtering');assert.notDeepEqual(nativeAfter,nativeBefore,'actual native backdrop filter must change composed DOM pixels');fs.writeFileSync(path.join(out,'native-filter-on.png'),nativeBefore);fs.writeFileSync(path.join(out,'native-filter-off.png'),nativeAfter);await context.close();context=undefined;
 const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','src/ui/weather','prototypes/evolution-weather','tests/evolution-weather-candidates.cjs','vite.evolution-weather.config.ts'],{encoding:'utf8'}).trim().split('\n');
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({scope:'Controlled actual settings with identical candidate operation plan; visual quality explicitly awaits owner. Record runs use original timing; CI smoke uses quarter timeline (not original-speed media).',record,nativeBackdropPixelCheck:'PASS: same paused surface and ordinary CSS DOM background, only backdrop-filter toggled; pixels changed. This proves filtering, not physical refraction.',timelineScale:scale,runtime:{node:process.version,platform:process.platform,chromium:browser.version()},results,hashes:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))},null,2));console.log('Evidence',out);
 }catch(e){try{await page?.screenshot({path:path.join(out,'failure.png')})}catch{}fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e instanceof Error?e.stack:String(e),results},null,2));throw e}finally{await context?.close();await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
