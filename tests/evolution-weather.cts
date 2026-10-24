// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"checkpoint","caseSource":"caseCheckpoint","rendererContexts":["weather:2d"]}
import cases = require('../scripts/ci-cases.cjs');
const {caseCheckpoint}=cases;
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import crypto = require('node:crypto');
import cp = require('node:child_process');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {weatherSurface as v1WeatherSurface} from '../prototypes/evolution-weather/v1-renderer';
const {chromium}=playwright;
type Snapshot=ReturnType<ReturnType<typeof v1WeatherSurface>['snapshot']>;
declare const weatherStudy:{snapshot():Snapshot|undefined;set(kind:string):void;close():void;reopen():void};
declare const must:<T>(value:T|null|undefined)=>T;
const dist=path.resolve('tests/artifacts/evolution/weather-dist'),out=path.resolve('tests/artifacts/evolution/weather-review-'+Date.now());fs.mkdirSync(out,{recursive:true});
const server=http.createServer((q,r)=>{const url=new URL(q.url??'/','http://local'),file=path.resolve(dist,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)){r.writeHead(404);r.end();return}r.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html');fs.createReadStream(file).pipe(r)});
(async()=>{let browser,context;const errors:string[]=[],checks:string[]=[],snapshots:{W1?:Snapshot;W2?:Snapshot;W3?:Snapshot;W4?:{width:number;scroll:number;canvas:{x:number;y:number;width:number;height:number;top:number;right:number;bottom:number;left:number};state:Snapshot};retarget?:{before:Snapshot;after:Snapshot}}={};try{
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));browser=await chromium.launch(browserOptions);
 context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:process.argv.includes('--record')?{dir:path.join(out,'raw'),size:{width:1280,height:900}}:undefined});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const address=server.address();assert.ok(address&&typeof address!=='string');await page.goto('http://127.0.0.1:'+address.port+'/?candidate=v1');await page.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value===null||value===undefined)throw Error('Missing weather study fixture');return value}}));await page.waitForFunction(()=>typeof weatherStudy!=='undefined'&&(weatherStudy.snapshot()?.width??0)>0);
 await page.waitForTimeout(200);snapshots.W1=await page.evaluate(()=>must(weatherStudy.snapshot()));await page.screenshot({path:path.join(out,'W1-clear.png')});assert.equal(snapshots.W1.target.kind,'clear');checks.push(caseCheckpoint('W1 actual approved settings component and clear Acrylic surface'));
 await page.getByRole('button',{name:'W2 晴转雨',exact:true}).click();await page.waitForFunction(()=>(weatherStudy.snapshot()?.wet??0)>.55);snapshots.W2=await page.evaluate(()=>must(weatherStudy.snapshot()));await page.screenshot({path:path.join(out,'W2-rain.png')});assert.equal(snapshots.W2.target.kind,'rain');checks.push(caseCheckpoint('W2 same-surface wetting, beads and tracks consume real weather classification'));
 snapshots.retarget=await page.evaluate(()=>{const before=must(weatherStudy.snapshot());weatherStudy.set('snow');return{before,after:must(weatherStudy.snapshot())}});assert.equal(snapshots.retarget.before.wet,snapshots.retarget.after.wet);assert.equal(snapshots.retarget.before.snow,snapshots.retarget.after.snow);
 await page.waitForFunction(()=>(weatherStudy.snapshot()?.snow??0)>.45);snapshots.W3=await page.evaluate(()=>must(weatherStudy.snapshot()));assert.ok(snapshots.W3.wet>0&&snapshots.W3.snow>0);await page.screenshot({path:path.join(out,'W3-snow-interrupt.png')});checks.push(caseCheckpoint('W3 mid-rain snow redirects continuous parameters with no state reset'));
 await page.getByRole('button',{name:'材质',exact:true}).click();await page.waitForFunction(()=>!must(document.querySelector('dialog')).hasAttribute('data-workspace-transition'));
 await page.getByRole('button',{name:'阅读',exact:true}).click();await page.waitForFunction(()=>!must(document.querySelector('dialog')).hasAttribute('data-workspace-transition'));
 const a=await page.evaluate(()=>must(weatherStudy.snapshot()));await page.waitForTimeout(Number(process.env.EVO_WEATHER_ENDURANCE_MS||1200));const b=await page.evaluate(()=>must(weatherStudy.snapshot()));assert.equal(b.particles,a.particles);assert.ok(b.frames>a.frames&&b.activeFrames<=1&&b.activePolls<=1);
 const hidden=await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));return must(weatherStudy.snapshot())});await page.waitForTimeout(200);assert.deepEqual(await page.evaluate(()=>must(weatherStudy.snapshot())),hidden);assert.equal(hidden.activeFrames,0);assert.equal(hidden.activePolls,0);
 await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>(weatherStudy.snapshot()?.frames??0)>0&&weatherStudy.snapshot()?.activePolls===1);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:(()=>{const r=must(document.querySelector('canvas')).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,right:r.right,bottom:r.bottom,left:r.left}})(),state:must(weatherStudy.snapshot())}));assert.ok(geometry.scroll<=geometry.width+1);assert.ok(Object.values(geometry.canvas).every(Number.isFinite));snapshots.W4=geometry;
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>weatherStudy.snapshot()?.activeFrames===0);assert.equal((await page.evaluate(()=>must(weatherStudy.snapshot()))).snow,1);
 await page.evaluate(()=>weatherStudy.close());await page.waitForFunction(()=>weatherStudy.snapshot()?.disposed);const closed=await page.evaluate(()=>must(weatherStudy.snapshot()));assert.equal(closed.activeFrames,0);assert.equal(closed.activePolls,0);assert.equal(await page.locator('canvas.evo-weather-canvas').count(),0);
 await page.evaluate(()=>weatherStudy.reopen());await page.waitForFunction(()=>weatherStudy.snapshot()&&!weatherStudy.snapshot()?.disposed);assert.equal(await page.locator('canvas.evo-weather-canvas').count(),1);checks.push(caseCheckpoint('W4 short controlled use: real category controls, hidden/resume, resize, reduced preference, close/reopen and release'));
 assert.deepEqual(errors,[]);const video=page.video();await context.close();context=undefined;
 if(video){const raw=await video.path();cp.execFileSync('ffmpeg',['-y','-i',raw,'-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'weather-original-speed.mp4')],{stdio:'pipe'})}
 const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','src/ui/weather','prototypes/evolution-weather','tests/evolution-weather.cjs','vite.evolution-weather.config.ts','tsconfig.evolution.json'],{encoding:'utf8'}).trim().split('\n');
 const hashes=Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({scope:'Controlled actual settings component; first visual candidate, short W4 observation only, not long-term/device/game acceptance',checks,snapshots,errors,hashes,enduranceMs:Number(process.env.EVO_WEATHER_ENDURANCE_MS||1200),runtime:{platform:process.platform,node:process.version,chromium:browser.version()}},null,2));console.log('PASS EVO-V1',checks.length,'groups; evidence',out);
 }finally{await context?.close();await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{receipt.terminalFailure(e);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e instanceof Error?e.stack:String(e)},null,2));process.exitCode=1});
