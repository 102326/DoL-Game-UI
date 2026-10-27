// Manual weather comparison. Fixed frame clock + per-frame layout flush, not FPS/GPU/game evidence.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import cp = require('node:child_process');
import crypto = require('node:crypto');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import esbuild = require('esbuild');
import vm = require('node:vm');
import type {wetGlass} from '../src/ui/weather/wet-glass';
import type {WeatherFrame} from '../src/ui/weather/surface';
declare const paintProbe:{draw(time:number,patch?:Partial<WeatherFrame>):void;snapshot:ReturnType<typeof wetGlass>['snapshot'];dispose():void};
async function setup(){
 const {wetGlass}=await import('../src/ui/weather/wet-glass.ts');
 const {frostedFeatherSnow}=await import('../src/ui/weather/edge-frost.ts');
 const canvas=document.querySelector('canvas');if(!canvas)throw Error('Missing weather canvas');
 const material=wetGlass(canvas,()=>{},true,true,true,true,'scatter',frostedFeatherSnow,true);
 const state:WeatherFrame={wet:1,snow:0,light:.25,night:0,time:2,width:960,height:700,dpr:1,intensity:1.5,kind:'storm',special:'none',specialAmount:0};
 Object.assign(window,{paintProbe:{draw(time:number,patch?:Partial<WeatherFrame>){Object.assign(state,patch,{time});material.draw(state)},snapshot:material.snapshot,dispose:material.dispose}});
 for(let i=0;i<10;i++)paintProbe.draw(2);
}
const reference='311f5fbac56d24eeb065018441757d3932c6dc12',file=process.argv.includes('--paint-only')?'src/ui/weather/wet-glass.ts':'src/ui/weather/rain-model.ts';
const hash=(v:string|Buffer)=>crypto.createHash('sha256').update(v).digest('hex');
(async()=>{
 const {createServer}=await import('vite');
 const out='tests/artifacts/ui41/weather-paint-'+Date.now();fs.mkdirSync(out,{recursive:true});
 const sources={baseline:cp.execFileSync('git',['show',reference+':'+file],{encoding:'utf8'}),candidate:fs.readFileSync(file,'utf8')};
 const modelProof:Array<{seed:number;natural:boolean;runoff:boolean;frames:number;calls:{baseline:number;candidate:number}}>=[];
 if(!process.argv.includes('--paint-only'))for(const seed of [19,0x27fa29])for(const natural of [false,true])for(const runoff of [false,true]){
  const load=(source:string)=>{let calls=0;const box={exports:{}};vm.runInNewContext(esbuild.transformSync(source,{loader:'ts',format:'cjs'}).code,{module:box,exports:box.exports,Math:Object.assign(Object.create(Math),{hypot(...n:number[]){calls++;return Math.hypot(...n)}})});const api:unknown=box.exports;assert.ok(api&&typeof api==='object'&&'rainModel'in api&&typeof api.rainModel==='function');return{model:(api.rainModel as typeof import('../src/ui/weather/rain-model')['rainModel'])(seed,natural,runoff),calls:()=>calls}};
  const a=load(sources.baseline),b=load(sources.candidate);
  for(let i=0;i<1000;i++){
   if(i===0||i===300||i===800){const [w,h]=i===0?[960,700]:i===300?[390,844]:[2560,1440];a.model.resize(w!,h!);b.model.resize(w!,h!)}
   const wet=i>=600&&i<780?0:1,amount=[.32,.65,1,1.5][Math.floor(i/250)]!;
   a.model.step(.025,wet,amount,1.9);b.model.step(.025,wet,amount,1.9);
   assert.equal(JSON.stringify(b.model.snapshot()),JSON.stringify(a.model.snapshot()),`model seed=${seed} natural=${natural} runoff=${runoff} frame=${i}`);
  }
  assert.ok(b.calls()<a.calls(),'conservative axis rejection must remove hypot work');modelProof.push({seed,natural,runoff,frames:1000,calls:{baseline:a.calls(),candidate:b.calls()}});
 }
 const servers=[];const browser=await playwright.chromium.launch(browserOptions),errors:string[]=[];
 const rows:Array<{pair:number;variant:string;elapsed:number;metrics:Record<string,number>}>=[];
 const proof:Array<{name:string;canvas:string;screenshot:string;visible:number}>=[];
 const urls:Record<string,string>={};let status='FAIL';
 try{
  for(const variant of ['baseline','candidate'] as const){
   const server=await createServer({configFile:false,cacheDir:out+'/'+variant,logLevel:'error',plugins:[{name:'c1-compare',enforce:'pre',load(id){if(id.replaceAll('\\','/').endsWith('/'+file))return sources[variant]},configureServer(s){s.middlewares.use('/__paint__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end(`<!doctype html><html data-dgu-visualmotion><style>body{margin:0;background:#56656c;color:#eee;font:16px system-ui}.dmt-settings-shell{position:relative;width:960px;height:700px;overflow:hidden;background:linear-gradient(125deg,#31434c,#202226)}canvas{position:absolute;inset:0;width:960px;height:700px}.dmt-workspace{position:absolute;left:220px;top:180px;width:300px;height:200px}.dmt-settings-header{height:80px}.dmt-layout-choice{height:40px}</style><div class="dmt-settings-shell"><canvas width="960" height="700"></canvas><header class="dmt-settings-header">Material title</header><div class="dmt-layout-choice">Layout controls</div><div class="dmt-workspace"><button>Original action</button><p>Protected reading content.</p></div></div><script type="module">(${setup.toString()})()</script></html>`)})}}],server:{host:'127.0.0.1',port:0}});
   servers.push(server);await server.listen();const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');urls[variant]=`http://127.0.0.1:${address.port}/__paint__`;
  }
  const pageFor=async(variant:string)=>{const page=await browser.newPage({viewport:{width:1000,height:740}});page.on('pageerror',e=>errors.push(e.message));await page.goto(urls[variant]!);await page.waitForFunction(()=>typeof paintProbe!=='undefined');return page};
  // Same deterministic model clock, frame sequence and layout on both sources.
  const pages=await Promise.all(['baseline','candidate'].map(pageFor));
  for(const [index,scenario]of ([{name:'full-heavy',wet:1,snow:0,intensity:1.5},{name:'header-light',wet:1,snow:0,intensity:.32,header:true},{name:'header-heavy',wet:1,snow:0,intensity:1.5,header:true},{name:'rain-to-snow',wet:.5,snow:.5,intensity:.65,header:true},{name:'snow',wet:0,snow:1,intensity:.65,header:true},{name:'rain-return',wet:1,snow:0,intensity:1,header:true},{name:'dry',wet:0,snow:0,intensity:1,header:true}] as const).entries()){
   const samples=[];
   for(const page of pages){
    await page.evaluate(async({scenario,index})=>{const shell=document.querySelector('.dmt-settings-shell');if(!shell)throw Error('Missing shell');shell.toggleAttribute('data-sf-weather-material','header'in scenario&&scenario.header);shell.setAttribute('data-workspace-transition',String(index));await Promise.resolve();for(let i=1;i<=90;i++)paintProbe.draw(2+index*1.5+i/60,scenario)}, {scenario,index});
    const data=await page.evaluate(async()=>{const canvas=document.querySelector('canvas');if(!canvas)throw Error('Missing canvas');const ctx=canvas.getContext('2d');if(!ctx)throw Error('Missing context');const digest=await crypto.subtle.digest('SHA-256',ctx.getImageData(0,0,canvas.width,canvas.height).data);return{state:paintProbe.snapshot(),styles:[...document.querySelectorAll<HTMLElement>('.evo-glass-drop,.evo-wet-path')].filter(n=>n.style.display!=='none').map(n=>({data:{...n.dataset},style:[...n.style].sort().map(k=>[k,getComputedStyle(n).getPropertyValue(k),n.style.getPropertyPriority(k)])})),canvas:[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')}});
    const screenshot=await page.screenshot();samples.push({...data,screenshot:hash(screenshot)});fs.writeFileSync(`${out}/${scenario.name}-${samples.length}.png`,screenshot);
   }
   assert.deepEqual(samples[1],samples[0],scenario.name+': model, effective styles, canvas and displayed pixels must match');
   proof.push({name:scenario.name,canvas:samples[0]!.canvas,screenshot:samples[0]!.screenshot,visible:samples[0]!.styles.length});
  }
  await Promise.all(pages.map(p=>p.close()));
  // No MutationObserver inside timed region. Alternate order; two warm-up pairs discarded.
  for(let pair=-2;pair<6;pair++)for(const variant of pair%2?['candidate','baseline']:['baseline','candidate']){
   const page=await pageFor(variant),cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
   await page.evaluate(()=>{document.querySelector('.dmt-settings-shell')!.setAttribute('data-sf-weather-material','');for(let i=1;i<=120;i++){paintProbe.draw(2+i/60);document.body.offsetHeight}});
   const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m:{name:string;value:number})=>[m.name,m.value]));const before=await metrics();
   const elapsed=await page.evaluate(()=>{const start=performance.now();for(let i=1;i<=240;i++){paintProbe.draw(4+i/60);document.body.offsetHeight}return performance.now()-start});
   const after=await metrics();if(pair>=0)rows.push({pair,variant,elapsed,metrics:Object.fromEntries(['TaskDuration','ScriptDuration','RecalcStyleDuration','LayoutDuration','RecalcStyleCount','LayoutCount'].map(k=>[k,(after[k]??0)-(before[k]??0)]))});await page.close();
  }
  assert.deepEqual(errors,[]);status='PASS';console.log('PASS weather: seven exact model/effective-style/canvas/displayed-pixel comparisons; six alternating timing pairs');
 }finally{
  fs.writeFileSync(out+'/result.json',JSON.stringify({status,reference,comparedFile:file,sourceHashes:Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,hash(v)])),node:process.version,platform:process.platform,browser:browser.version(),scope:'Controlled Chromium fixed-clock header rain with per-frame forced layout flush. No game/device/GPU/FPS claim.',modelProof,proof,rows,errors},null,2));console.log('Evidence',out);await browser.close();for(const server of servers)await server.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
