// Isolated attribution only: execute an instrumented copy of the existing scan path.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
import {transformSync} from 'esbuild';

const root=process.cwd(),out='tests/artifacts/evo42-next-ci-cost/device-layout-hub-probe.json';
const source='tests/device-layouts.cts',targets=[320,600,900,1280];
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const git=(...args:string[])=>execFileSync('git',args,{cwd:root});
function snapshot(){
 const files=git('ls-files','--cached','--others','--exclude-standard','-z','--','src','framework','tests','scripts','package.json','package-lock.json','.node-version').toString().split('\0').filter(Boolean);
 for(const file of ['dist/framework/official-ui/style.css','tests/device-profiles.cjs','tests/device-layout-oracles.cjs','tests/device-case-plan.cjs','tests/moody-fixture-evidence.cjs','tests/browser-options.cjs'])if(!files.includes(file))files.push(file);
 const values=files.sort().map(file=>[file,fs.existsSync(file)?sha(fs.readFileSync(file)):'missing']);return {manifestSha256:sha(JSON.stringify(values)),count:values.length,keyFiles:Object.fromEntries(values.filter(([file])=>[source,'tests/device-profiles.cts','tests/device-profiles.cjs','tests/device-layout-oracles.cts','tests/device-layout-oracles.cjs','tests/device-case-plan.cjs','tests/browser-options.cjs','dist/framework/official-ui/style.css','package-lock.json','scripts/research/device-layout-cost-probe.mts'].includes(file!)))};
}
function replaceOnce(text:string,from:string,to:string){assert.equal(text.split(from).length,2,'instrumentation target must match once');return text.replace(from,to)}
const input=fs.readFileSync(source,'utf8');let instrumented=input;
instrumented=replaceOnce(instrumented,"{await page.evaluate(([kind,args])=>fixture.scene(kind,args),[kind,args] as const);}","{const start=__clock.now();try{await page.evaluate(([kind,args])=>fixture.scene(kind,args),[kind,args] as const)}finally{__add('scene',__clock.now()-start)}}");
instrumented=replaceOnce(instrumented,"{for(const s of specs.filter(s=>s.hittable))await page.locator(s.selector).first().evaluate(n=>n.scrollIntoView({block:'nearest',inline:'nearest'}));const snapshot={...await layoutSnapshot(page,specs),scenario,profile:{id:profile.id,viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor}};try{assertLayout(snapshot,profile)}catch(error){if(error&&typeof error==='object')Object.assign(error,{layoutSnapshot:snapshot});throw error}return snapshot.environment;}","{let start=__clock.now();for(const s of specs.filter(s=>s.hittable))await page.locator(s.selector).first().evaluate(n=>n.scrollIntoView({block:'nearest',inline:'nearest'}));__add('scroll',__clock.now()-start);start=__clock.now();const snapshot={...await layoutSnapshot(page,specs),scenario,profile:{id:profile.id,viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor}};__add('snapshot',__clock.now()-start);start=__clock.now();try{assertLayout(snapshot,profile)}catch(error){if(error&&typeof error==='object')Object.assign(error,{layoutSnapshot:snapshot});throw error}finally{__add('assert',__clock.now()-start)}return snapshot.environment;}");
instrumented=replaceOnce(instrumented,"const env=await checkHub(page,profile,full?docks:[must(docks[profile.viewport.width%4])]);await checkSettings(page,profile,full);if(full)await checkSaves(page,profile,{v2:false});await checkSaves(page,profile,{dynamic:full});","const env=await __measure('hub',()=>checkHub(page,profile,full?docks:[must(docks[profile.viewport.width%4])]));await __measure('settings',()=>checkSettings(page,profile,full));if(full)await __measure('saves',()=>checkSaves(page,profile,{v2:false}));await __measure('saves',()=>checkSaves(page,profile,{dynamic:full}));");
const hubStart=instrumented.indexOf('async function checkHub('),hubEnd=instrumented.indexOf('async function checkSettings(');assert(hubStart>=0&&hubEnd>hubStart);
let hub=instrumented.slice(hubStart,hubEnd);
for(const [from,to] of [
 ["await scene(page,'hub',{x,y});","await __measure('hub.scene',()=>scene(page,'hub',{x,y}));"],
 ["await page.waitForSelector('.sf-motion-ball');","await __measure('hub.ready',()=>page.waitForSelector('.sf-motion-ball'));"],
 ["await inspect(page,profile,'hub-'+position,[ball]);","await __measure('hub.inspect',()=>inspect(page,profile,'hub-'+position,[ball]));"],
 ["await activate(page,'.sf-motion-ball',profile);else", "await __measure('hub.open',()=>activate(page,'.sf-motion-ball',profile));else"],
 ["environment=await inspect(page,profile,'hub-menu-'+position,[ball,menu,hubClose]);","environment=await __measure('hub.inspect',()=>inspect(page,profile,'hub-menu-'+position,[ball,menu,hubClose]));"],
 ["await view.evaluate(n=>n.scrollIntoView({block:'nearest'}));","await __measure('hub.detail-scroll',()=>view.evaluate(n=>n.scrollIntoView({block:'nearest'})));"],
 ["await view.evaluate(n=>{if(!(n instanceof HTMLElement))throw Error('Missing device fixture control');n.click()});","await __measure('hub.detail-open',()=>view.evaluate(n=>{if(!(n instanceof HTMLElement))throw Error('Missing device fixture control');n.click()}));"],
 ["await inspect(page,profile,'hub-detail',[spec('.sf-motion-sheet.is-open',{safe:true,noOverflow:true}),spec('.sf-motion-sheet [aria-label=\"关闭详情\"]',{safe:true,hittable:true})]);","await __measure('hub.inspect',()=>inspect(page,profile,'hub-detail',[spec('.sf-motion-sheet.is-open',{safe:true,noOverflow:true}),spec('.sf-motion-sheet [aria-label=\"关闭详情\"]',{safe:true,hittable:true})]));"],
 ["await activate(page,'.sf-motion-sheet [aria-label=\"关闭详情\"]',profile);","await __measure('hub.detail-close',()=>activate(page,'.sf-motion-sheet [aria-label=\"关闭详情\"]',profile));"]
] as const)hub=replaceOnce(hub,from,to);
assert(hub.includes('await frame(page);'));hub=hub.replaceAll('await frame(page);',"await __measure('hub.frame',()=>frame(page));");
instrumented=instrumented.slice(0,hubStart)+hub+instrumented.slice(hubEnd);
instrumented+='\n;(globalThis as any).__deviceProbeRun=async function(widths:number[]){const server=await serverFor();let browser:playwright.Browser|undefined;const samples:unknown[]=[];try{browser=await chromium.launch(require(\'./browser-options.cjs\'));const base={id:\'continuous-width-scan\',viewport:{width:1280,height:900},deviceScaleFactor:1,hasTouch:false,safeArea:{top:0,right:0,bottom:0,left:0},contextOptions:{viewport:{width:1280,height:900},deviceScaleFactor:1}};const scan=await openPage(browser,server,base);try{for(const width of widths){assert(scanWidths(\'standard\').includes(width));for(const height of [390,900]){const profile={...base,id:\'scan:\'+width,viewport:{width,height}};await scan.page.setViewportSize(profile.viewport);await frame(scan.page);__reset();const start=__clock.now();const detail=await runScenes(scan.page,profile,false);const total=__clock.now()-start;assert.deepEqual(scan.errors,[]);samples.push({width,height,total,parts:__parts(),completedScenes:detail.completedScenes})}}}finally{await scan.context.close()}return {samples,browserVersion:browser.version()}}finally{await browser?.close();await server.close()}}\n';
const prefix=`const __clock=globalThis.__deviceProbeClock;function __add(name:string,ms:number){__clock.add(name,ms)}function __reset(){__clock.reset()}function __parts(){return __clock.parts()}async function __measure<T>(name:string,run:()=>Promise<T>){const start=__clock.now();try{return await run()}finally{__add(name,__clock.now()-start)}}\n`;
const compiled=transformSync(prefix+instrumented,{loader:'ts',format:'cjs',platform:'node',target:'node26'}).code;
const before=snapshot(),buckets:Record<string,{milliseconds:number;calls:number}>={};
const state={now:()=>performance.now(),add:(name:string,ms:number)=>{const v=buckets[name]??={milliseconds:0,calls:0};v.milliseconds+=ms;v.calls++},reset:()=>{for(const key of Object.keys(buckets))delete buckets[key]},parts:()=>structuredClone(buckets)};
Reflect.set(globalThis,'__deviceProbeClock',state);
const filename=path.join(root,'tests/device-layouts.probe.cjs'),req=createRequire(filename),module={exports:{} as Record<string,unknown>};
const started=new Date().toISOString();let report:Record<string,unknown>;
try{
 new Function('require','module','exports','__filename','__dirname',compiled)(req,module,module.exports,filename,path.dirname(filename));
 const probe=Reflect.get(globalThis,'__deviceProbeRun');assert.equal(typeof probe,'function');const observed=await (probe as (widths:number[])=>Promise<{samples:unknown[];browserVersion:string}>)(targets),{samples,browserVersion}=observed;assert.equal(samples.length,targets.length*2);
 const after=snapshot();assert.deepEqual(after,before,'inputs changed during measurement');
 report={status:'PASS',scope:'isolated instrumented subset, not full device-layout PASS or comparative speed result',started,sourceCommit:git('rev-parse','HEAD').toString().trim(),node:process.version,browserVersion,playwright:JSON.parse(fs.readFileSync('node_modules/playwright/package.json','utf8')).version,input:before,widths:targets,heights:[390,900],samples,measurement:'hub/settings/saves are inclusive; hub.* are nested; scene includes its original two frames; inspect includes scroll, snapshot and assertion; do not add inclusive and nested times',limitations:'single Mac Chromium pass; all selected widths use left Hub position; viewport setup is outside sample total; instrumentation adds overhead; no game or real device'};
}catch(error){report={status:'FAIL',scope:'isolated instrumented subset',started,input:before,error:error instanceof Error?error.stack:String(error)};process.exitCode=1}
finally{Reflect.deleteProperty(globalThis,'__deviceProbeClock');Reflect.deleteProperty(globalThis,'__deviceProbeRun')}
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
