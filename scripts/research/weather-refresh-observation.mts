import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright';
import {createServer} from 'vite';

const files=['framework/official-ui/weather.ts','src/ui/weather/surface.ts'];
const baseline='994fcab';
const old=Object.fromEntries(files.map(file=>[file,execFileSync('git',['show',`${baseline}:${file}`],{encoding:'utf8'})]));
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const current=Object.fromEntries(files.map(file=>[file,fs.readFileSync(file,'utf8')]));
const sources=Object.fromEntries(files.map(file=>[file,{baseline:hash(old[file]!),current:hash(current[file]!)}]));
const common=['src/ui/weather/settings.ts','src/ui/weather/wet-glass.ts','src/ui/weather/edge-frost.ts','src/ui/weather/settings.css','src/theme/settings-workspace.css','dist/framework/official-ui/style.css','package-lock.json'];
const inputs=Object.fromEntries([...files,...common].map(file=>[file,hash(fs.readFileSync(file))]));
const out=path.resolve('tests/artifacts/weather-refresh-observation-'+Date.now());
fs.mkdirSync(out,{recursive:true});
const result:Record<string,unknown>={baseline,inputs,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources,node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,scope:'Controlled same-size refresh and synthetic resize, 60 repetitions; amplified local JS/layout observation, not daily frequency, FPS, GPU or physical-device performance.',samples:[],errors:[]};
const html=`<!doctype html><html data-stone-free data-dol-midnight data-dgu-acrylic-adjustment><head><link rel="stylesheet" href="/dist/framework/official-ui/style.css"><link rel="stylesheet" href="/src/theme/settings-workspace.css"><style>body{margin:0;background:#20242a;color:white}.dmt-settings-shell{position:relative;width:800px;height:600px;margin:50px;overflow:hidden}.dmt-settings-header{position:relative;height:80px;z-index:2}.dmt-workspace{position:relative;z-index:2;padding:20px}button{min-height:44px}</style></head><body><section class="dmt-settings-shell"><header class="dmt-settings-header"><h2>设置</h2></header><div class="dmt-workspace"><p>Protected reading content.</p><button id="native">Original action</button><span id="count">0</span></div></section><script type="module">import {headerWeather} from '/framework/official-ui/weather.ts';window.Weather={name:'rain',precipitation:'rain',precipitationIntensity:1.6,dayState:'day'};window.owner=headerWeather();const shell=document.querySelector('.dmt-settings-shell');window.owner.set('settings',shell.querySelector('header'),shell);window.owner.refresh();document.querySelector('#native').onclick=()=>{document.querySelector('#count').textContent=String(Number(document.querySelector('#count').textContent)+1)};window.ready=true;</script></body></html>`;
const server=await createServer({configFile:false,logLevel:'error',plugins:[{name:'observation',enforce:'pre',load(id){const file=files.find(f=>id.replaceAll('\\','/').endsWith('/'+f));if(file){const code=process.env.WEATHER_OBSERVATION_BASELINE==='1'?old[file]!:current[file]!;return code+'\n;(window as any).__weatherSourceHashes ??= {}; (window as any).__weatherSourceHashes['+JSON.stringify(file)+'] = '+JSON.stringify(hash(code))+';\n'}},configureServer(s){s.middlewares.use('/__observation__',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end(html)})}}],server:{host:'127.0.0.1',port:0}});
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 await server.listen();const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');
 browser=await chromium.launch({headless:true});result.browser=browser.version();
 const samples:Array<Record<string,unknown>>=[];result.samples=samples;
 const pixels:Record<string,string>={},postPixels:Record<string,string>={};
 for(let run=-2;run<8;run++)for(const version of (run%2===0?['baseline','current']:['current','baseline'])){
  process.env.WEATHER_OBSERVATION_BASELINE=version==='baseline'?'1':'0';
  // Invalidate transformed modules when switching sources; other dependencies remain identical.
  for(const file of files){const module=server.moduleGraph.getModuleById(path.resolve(file));if(module)server.moduleGraph.invalidateModule(module)}
  const context=await browser.newContext({viewport:{width:1000,height:750},deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(m.text())});
  await page.addInitScript(()=>{let seed=42;Math.random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646}});
  await page.goto(`http://127.0.0.1:${address.port}/__observation__?run=${run}&version=${version}`);await page.waitForFunction(()=>Reflect.get(window,'ready')===true);
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  const loaded=await page.evaluate(()=>Reflect.get(window,'__weatherSourceHashes'));
  assert.deepEqual(loaded,Object.fromEntries(files.map(file=>[file,sources[file]![version as 'baseline'|'current']])),'executed source identity');
  assert.equal(await page.locator('.sf-weather-canvas').count(),1);
  const pixel=hash(await page.locator('.dmt-settings-shell').screenshot({animations:'disabled'}));
  if(!pixels[version])pixels[version]=pixel;else assert.equal(pixel,pixels[version],`${version} stable pixels`);
  await page.locator('#native').click();assert.equal(await page.locator('#count').textContent(),'1');
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  const before=await cdp.send('Performance.getMetrics');
  const elapsed=await page.evaluate(()=>{const owner=Reflect.get(window,'owner') as {refresh():void};const start=performance.now();for(let i=0;i<60;i++){owner.refresh();window.dispatchEvent(new Event('resize'))}return performance.now()-start});
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  const after=await cdp.send('Performance.getMetrics');
  const b=new Map(before.metrics.map(m=>[m.name,m.value]));const metrics=Object.fromEntries(after.metrics.filter(m=>['ScriptDuration','TaskDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'].includes(m.name)).map(m=>[m.name,m.value-(b.get(m.name)??0)]));
  assert.equal(await page.locator('#count').textContent(),'1');
  const state=await page.evaluate(()=>{const owner=Reflect.get(window,'owner') as {snapshot():{surfaces:Array<{material:string;state:{target:unknown}}>} };const snapshot=owner.snapshot();return {material:snapshot.surfaces[0]?.material,target:snapshot.surfaces[0]?.state?.target,weather:document.querySelector<HTMLElement>('.sf-weather-canvas')?.dataset.weather,rain:document.querySelector<HTMLElement>('.sf-weather-canvas')?.dataset.rain}});
  assert.equal(state.material,'glass-scatter');assert.equal(state.weather,'rain');assert.equal(state.rain,'heavy');
  const postPixel=hash(await page.locator('.dmt-settings-shell').screenshot({animations:'disabled'}));
  if(!postPixels[version])postPixels[version]=postPixel;else assert.equal(postPixel,postPixels[version],`${version} stable post pixels`);
  if(run>=0)samples.push({pair:run,version,elapsedMs:elapsed,metrics,loaded,state});
  await page.evaluate(()=>{const owner=Reflect.get(window,'owner') as {dispose():void};owner.dispose()});
  assert.equal(await page.locator('.sf-weather-canvas,.evo-material-layer').count(),0);assert.deepEqual(errors,[]);
  await context.close();
 }
 for(const sample of samples)assert.deepEqual(sample.state,samples[0]?.state,'post-workload weather state equality');
 result.pixels=pixels;result.postPixels=postPixels;assert.equal(pixels.baseline,pixels.current,'baseline/current initial screenshot equality');assert.equal(postPixels.baseline,postPixels.current,'baseline/current post screenshot equality');
 const endInputs=Object.fromEntries([...files,...common].map(file=>[file,hash(fs.readFileSync(file))]));result.endInputs=endInputs;assert.deepEqual(endInputs,inputs,'source and common inputs did not drift');result.status='PASS';
}catch(error){result.status='FAIL';result.failure=error instanceof Error?error.stack:String(error);throw error}
finally{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));await browser?.close();await server.close();console.log(out)}
