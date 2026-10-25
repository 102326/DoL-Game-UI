// Manual actual-owner diagnostic; no game/save data.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import crypto = require('node:crypto');
import cp = require('node:child_process');
import playwright = require('playwright');
import browserOptions = require('../tests/browser-options.cjs');
import type {sphereHub} from '../src/ui/golden-spin/hub-motion';
import type {headerWeather} from '../framework/official-ui/weather';
import type {FloatingApi} from '../src/floating/preferences';
import type {Plugin} from 'vite';
declare const evoScopes:(()=>{active:boolean;frames:number;cleanups:number;origin:string[]})[];
declare const evoHub:ReturnType<typeof sphereHub>,evoWeather:ReturnType<typeof headerWeather>;
declare const evoClassic:Pick<FloatingApi,'setPreference'|'destroy'>;
declare const DoLMidnightTheme:{getLifecycleCounts():{mounts:number}};
declare const hubPreview:{stop():void;floating:FloatingApi;dispose():void};
const {chromium}=playwright;
function settingState(snapshot:ReturnType<typeof evoWeather.snapshot>){const state=snapshot.surfaces.find(s=>s.id==='settings')?.state;if(!state)throw Error('Missing settings surface');return state}
(async()=>{
 const teardownOnly=process.argv.includes('--teardown-only'),oldPlaceholder=process.argv.includes('--old-floating-placeholder');
 const out=path.resolve('tests/artifacts/evolution/coexistence-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','framework/official-ui','framework/motion-hub','src/ui','src/theme','src/floating','scripts/preview-evolution-hub.mjs','scripts/check-evolution-coexistence.cts','scripts/check-evolution-coexistence.cjs','package-lock.json'],{encoding:'utf8'}).trim().split('\n');files.push('dist/framework/official-ui/style.css');
 const hashes=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),before=hashes(),results:unknown[]=[],errors:(string|undefined)[]=[];
 const {createHubPreviewServer}=await import('./preview-evolution-hub.mjs');
 const observationPlugin:Plugin={name:'coexistence-observation',enforce:'pre',transform(code,id){
  const f=id.replaceAll('\\','/');
  if(oldPlaceholder&&f.endsWith('/src/floating/main.ts')){const old=code.replace('let liveScope=scope,','let liveScope=visualScope(),');assert.notEqual(old,code,'precise old empty placeholder injection');return old}
  if(f.endsWith('/src/ui/visual-scope.ts')){const anchor='let disposed=false;';assert.ok(code.includes(anchor));return code.replace(anchor,anchor+'const origin=new Error().stack.split("\\n").slice(2,5);(window.evoScopes??=[]).push(()=>({active:!disposed,frames:frames.size,cleanups:cleanups.size,origin}));')}
  if(f.endsWith('/src/ui/golden-spin/hub-motion.ts'))return code.replace('export function sphereHub(', 'function actualSphereHub(')+'\nexport function sphereHub(root){return window.evoHub=actualSphereHub(root)}';
  if(f.endsWith('/framework/official-ui/weather.ts'))return code.replace('export function headerWeather(', 'function actualHeaderWeather(')+'\nexport function headerWeather(){return window.evoWeather=actualHeaderWeather()}';
 }};const server=await createHubPreviewServer(0,[observationPlugin]);
 const browser=await chromium.launch(browserOptions);let p:playwright.Page|null=null;const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');
 try{
  for(const [width,height]of [[1280,900],[390,844]] as const){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});p=page;page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(5000);await page.goto('http://127.0.0.1:'+address.port+'/');await page.addScriptTag({content:settingState.toString()});await page.waitForSelector('.spin-hub-canvas');await page.waitForFunction(()=>DoLMidnightTheme.getLifecycleCounts().mounts>=4);
   const ball=page.locator('.sf-motion-ball'),snapshot=()=>page.evaluate(()=>{
    const scopes=evoScopes.map(s=>s());return{origins:scopes.filter(s=>s.active).map(s=>s.origin),scopes:{active:scopes.filter(s=>s.active).length,frames:scopes.reduce((n,s)=>n+s.frames,0),cleanups:scopes.reduce((n,s)=>n+s.cleanups,0)},hub:evoHub.inspect(),weather:evoWeather.snapshot(),dom:{sphere:document.querySelectorAll('.spin-hub-canvas').length,weather:document.querySelectorAll('.sf-weather-canvas').length,materials:document.querySelectorAll('.evo-material-layer').length,nodes:document.querySelectorAll('*').length}};
   });
   const open=async()=>{await ball.click();await page.waitForFunction(()=>evoHub.inspect().phase==='open');await page.locator('[data-motion-view$="interface-settings"]').click();await page.waitForSelector('.sf-weather-canvas');await page.waitForFunction(()=>!document.querySelector('dialog')?.hasAttribute('data-workspace-transition'));};
   const close=async()=>{await page.getByRole('button',{name:'阅读',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('dialog')?.hasAttribute('data-workspace-transition'));await page.locator('.dmt-close').click();await page.waitForFunction(()=>document.querySelector<HTMLDialogElement>('dialog')?.open===false&&!document.querySelector('.sf-weather-canvas')&&evoHub.inspect().phase==='closed'&&evoHub.inspect().sphere.phase==='idle'&&!evoHub.inspect().sphere.running&&evoScopes.every(s=>s().frames===0));await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));};
   await open();await close();const warm=await snapshot(),cycles:{cycle:number;activeScopes:typeof warm.scopes;closed:typeof warm}[]=[],record={viewport:{width,height,dpr:1},warm,cycles};results.push(record);
   for(let cycle=0;cycle<(teardownOnly?0:12);cycle++){
    await open();await page.getByRole('button',{name:cycle%2?'页面':'材质',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('dialog')?.hasAttribute('data-workspace-transition'));
    const active=await snapshot();assert.equal(active.dom.sphere,1);assert.equal(active.dom.weather,1);assert.equal(active.weather.activePolls,1);assert.equal(active.hub.sphere.running,false,'settings must suspend the hidden Hub sphere');
    await close();const closed=await snapshot();cycles.push({cycle:cycle+1,activeScopes:active.scopes,closed});assert.deepEqual(closed.scopes,warm.scopes,'closed active owner/frame/cleanup counts must return to warm baseline');assert.deepEqual(closed.dom,warm.dom,'closed DOM counts must remain bounded');
   }
   await open();await page.waitForFunction(()=>{const state=evoWeather.snapshot().surfaces.find(s=>s.id==='settings')?.state;return !!state&&state.wet>.98});
   const observed=await page.evaluate(async duration=>{
    const intervals:number[]=[],draw:number[]=[],started=performance.now();let last=started,observer:PerformanceObserver|undefined;
    const entries:number[]=[];if(PerformanceObserver.supportedEntryTypes.includes('longtask')){observer=new PerformanceObserver(list=>entries.push(...list.getEntries().map(e=>e.duration)));observer.observe({entryTypes:['longtask']})}
    await new Promise<void>(resolve=>{function sample(t:number){intervals.push(t-last);last=t;draw.push(settingState(evoWeather.snapshot()).paintMs);if(t-started<duration)requestAnimationFrame(sample);else resolve()}requestAnimationFrame(sample)});observer?.disconnect();
    const quant=(a:readonly number[],q:number)=>{const xs=a.filter(Number.isFinite).sort((a,b)=>a-b);return xs.length?xs[Math.floor((xs.length-1)*q)]:null};return{elapsedMs:performance.now()-started,samples:intervals.length,rafMs:{median:quant(intervals,.5),p95:quant(intervals,.95),max:Math.max(...intervals)},weatherDrawMs:{median:quant(draw,.5),p95:quant(draw,.95)},longTasks:observer?{count:entries.length,maxMs:entries.length?Math.max(...entries):0}:null};
   },teardownOnly?0:15000);Object.assign(record,{observed});const steady=await snapshot();Object.assign(record,{steady});assert.equal(steady.weather.activePolls,1);assert.equal(settingState(steady.weather).activeFrames,1);assert.equal(steady.dom.weather,1);
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});const hidden=await snapshot();Object.assign(record,{hidden});await page.waitForTimeout(250);const after=await snapshot();Object.assign(record,{after});assert.equal(after.weather.activePolls,0);assert.equal(settingState(after.weather).activeFrames,0);assert.equal(after.hub.sphere.draws,hidden.hub.sphere.draws);assert.equal(settingState(after.weather).frames,settingState(hidden.weather).frames);
   await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>settingState(evoWeather.snapshot()).activeFrames===1);await close();await ball.click();await page.waitForFunction(()=>evoHub.inspect().phase==='open');const resumed=await snapshot();Object.assign(record,{resumed});assert.equal(resumed.hub.sphere.running,true);
   // The archived game-based Floating tests require Edge and a game fixture.
   // Exercise the real classic surface here using the same controlled first-party page.
   await page.evaluate(async()=>{hubPreview.stop();hubPreview.floating.destroy();const modulePath='/src/floating/main.ts',module:unknown=await import(modulePath);if(!module||typeof module!=='object'||!('startFloatingTools' in module)||typeof module.startFloatingTools!=='function')throw Error('Missing classic factory');const classic:unknown=module.startFloatingTools(window,true);if(!classic||typeof classic!=='object'||!('setPreference' in classic)||typeof classic.setPreference!=='function'||!('destroy' in classic)||typeof classic.destroy!=='function')throw Error('Missing classic API');Object.assign(window,{evoClassic:classic});evoClassic.setPreference('enabled',true)});
   const classic=page.getByRole('button',{name:'自由悬浮球',exact:true});await classic.click();await page.getByRole('menuitem',{name:'界面设置',exact:true}).click();await page.waitForSelector('.sf-weather-canvas');await page.locator('.dmt-close').click();await classic.waitFor();await page.evaluate(()=>evoClassic.setPreference('enabled',false));await page.waitForFunction(()=>!document.getElementById('dol-stone-free-floating'));await page.evaluate(()=>evoClassic.setPreference('enabled',true));await classic.waitFor();await page.evaluate(()=>evoClassic.destroy());assert.equal(await page.locator('#dol-stone-free-floating').count(),0);Object.assign(record,{classicSurface:'PASS actual settings action, modal release/restore, disable/re-enable and destroy'});
   await page.evaluate(()=>hubPreview.dispose());const disposed=await snapshot();Object.assign(record,{observed,steady,hidden,after,resumed,disposed});assert.deepEqual(disposed.scopes,{active:0,frames:0,cleanups:0},'all tracked visual scopes must be disposed');assert.equal(disposed.weather.activePolls,0);assert.equal(disposed.weather.surfaces.length,0);assert.equal(disposed.dom.sphere+disposed.dom.weather+disposed.dom.materials,0);await page.waitForTimeout(250);assert.deepEqual((await snapshot()).scopes,disposed.scopes);
   console.log('PASS controlled coexistence',width,height,JSON.stringify(observed));await page.close();p=null;
  }
  assert.deepEqual(errors,[]);assert.deepEqual(hashes(),before,'diagnostic inputs changed');
 }catch(error){if(p)await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});errors.push(error instanceof Error?error.stack:String(error));throw error}
 finally{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({teardownOnly,faultInjection:oldPlaceholder?'old-empty-floating-placeholder':null,scope:teardownOnly?'Focused terminal ownership only; no endurance or performance claim.':'Manual actual owners, 12 reopen cycles plus 15 seconds rain per viewport. Hub is suspended while modal settings is visible. rAF and JS weather draw are observations, not GPU/FPS/heap or long-term/device acceptance. Probe retains scope closures; no memory inference.',source:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:!!cp.execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),runtime:{platform:process.platform,node:process.version,chromium:browser.version()},results,errors,hashes:before},null,2));console.log('Evidence',out);await browser.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
