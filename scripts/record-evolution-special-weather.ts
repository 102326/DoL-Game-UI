import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import cp from 'node:child_process';
import {createRequire} from 'node:module';
import {chromium,type Page} from 'playwright';
import {createBloodMoonPreview} from './preview-evolution-blood-moon.ts';
import {assertAcceptedWeather} from './assert-accepted-weather.ts';

type State={target:{special:string;kind:string};specialAmount:number;specialSkiesEnabled:boolean;time:number;snow:number;snowflakes:number;protectedOverlap:number;activeFrames:number};
type Preview={setSky:(kind:string)=>void;theme:{getPreferences:()=>{comfortable:boolean};setPreference:(key:string,value:boolean)=>void;destroy:()=>void};owner:{snapshot:()=>{surfaces:Array<{id:string;state:State}>};dispose:()=>void}};
const require=createRequire(import.meta.url),hash=(p:string)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const out=path.resolve('tests/artifacts/evolution/special-integration-'+Date.now()),media=path.resolve('docs/media/evolution-special-integrated');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(media,{recursive:true});
const inputs=['prototypes/evolution-weather/blood-moon.ts','prototypes/evolution-weather/special-atmosphere.ts','scripts/preview-evolution-blood-moon.ts','scripts/record-evolution-special-weather.ts','src/ui/weather/wet-glass.ts','src/ui/weather/surface.ts','src/ui/weather/edge-frost.ts','src/theme/controller.ts','dist/framework/official-ui/style.css'];
inputs.push('src/ui/weather/blood-moon.ts','src/ui/weather/special-atmosphere.ts','src/ui/weather/settings.ts');
const sources=()=>Object.fromEntries(inputs.map(f=>[f,hash(f)])),before=sources();assertAcceptedWeather();
const server=await createBloodMoonPreview(0,true),browser=await chromium.launch(require('../tests/browser-options.cjs'));
const url='http://127.0.0.1:'+String((server.httpServer!.address() as {port:number}).port),checks:string[]=[],errors:string[]=[],records:unknown[]=[],appearances:unknown[]=[];
const snapshot=(p:Page)=>p.evaluate(()=>((window as unknown as Preview).owner.snapshot().surfaces[0].state));
const setSky=(p:Page,kind:string)=>p.evaluate(k=>((window as unknown as Preview).setSky(k)),kind);
const pixels=(p:Page)=>p.locator('.sf-weather-canvas').evaluate(n=>(n as HTMLCanvasElement).toDataURL());
async function coverage(p:Page,duration=1400){return p.evaluate(ms=>new Promise<number[]>(resolve=>{
 const samples:number[]=[],start=performance.now();
 const sample=()=>{const c=document.querySelector<HTMLCanvasElement>('.sf-weather-canvas')!,ctx=c.getContext('2d')!,pixels=ctx.getImageData(Math.round(c.width*.1),Math.round(c.height*.38),Math.round(c.width*.8),Math.round(c.height*.32)).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>4)visible++;samples.push(visible);if(performance.now()-start<ms)requestAnimationFrame(sample);else resolve(samples)};requestAnimationFrame(sample);
}),duration)}
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.getByRole('button',{name:'打开设置',exact:true}).click();
 assert.equal((await snapshot(p)).specialSkiesEnabled,true);assert.equal(await p.locator('.sf-weather-canvas').count(),1);
 for(const [kind,special]of [['alien','tentacle'],['heat','heat'],['cold','cold']]as const){
  // Compare weather at the same layout/focus; category reflow can move the centered shell fractionally.
  await setSky(p,'clear');await p.waitForFunction(()=>{const s=(window as unknown as Preview).owner.snapshot().surfaces[0].state;return s.specialAmount===0&&s.activeFrames===0});await p.locator('.dmt-close').focus();
  const reading=await p.locator('.dmt-reading-sample p').screenshot(),close=await p.locator('.dmt-close').screenshot();
  fs.writeFileSync(path.join(out,kind+'-close-baseline.png'),close);
  await setSky(p,kind);await p.waitForFunction(v=>{const s=(window as unknown as Preview).owner.snapshot().surfaces[0].state;return s.target.special===v&&s.specialAmount===1&&s.activeFrames===0},special);
  await p.locator('.dmt-close').focus();
  const actualReading=await p.locator('.dmt-reading-sample p').screenshot(),actualClose=await p.locator('.dmt-close').screenshot();
  fs.writeFileSync(path.join(out,kind+'-close.png'),actualClose);
  if(!actualClose.equals(close))fs.writeFileSync(path.join(out,kind+'-geometry.json'),JSON.stringify(await p.evaluate(()=>({bounds:document.querySelector('.dmt-close')!.getBoundingClientRect().toJSON(),style:getComputedStyle(document.querySelector('.dmt-close')!).cssText,state:(window as unknown as Preview).owner.snapshot().surfaces[0].state})),null,2));
  assert.ok(actualReading.equals(reading),kind+' altered actual reading pixels');assert.ok(actualClose.equals(close),kind+' altered close pixels');
  const frozen=(await snapshot(p)).time,still=await pixels(p);await p.waitForTimeout(160);assert.equal((await snapshot(p)).time,frozen);assert.equal(await pixels(p),still,kind+' weather pixels move under reduced motion');
  assert.equal((await snapshot(p)).snowflakes,0,'Dry special weather must not invent snowfall');
  await p.emulateMedia({reducedMotion:'no-preference'});const first=await pixels(p);await p.waitForTimeout(1800);assert.notEqual(await pixels(p),first,kind+' has no actual pixel motion');
  await p.screenshot({path:path.join(media,kind+'.png')});appearances.push({kind,state:await snapshot(p)});
  for(const name of ['材质','阅读']){await p.getByRole('button',{name,exact:true}).click();const samples=await coverage(p);assert.ok(samples.every(n=>n>100),kind+' lower atmosphere disappeared during '+name+': '+JSON.stringify(samples))}
  await p.emulateMedia({reducedMotion:'reduce'});checks.push(kind+': protected text/close, no invented snow, static reduced motion, animated pixels, full category continuity');
 }
 await p.emulateMedia({reducedMotion:'no-preference'});
 const pref=await p.evaluate(()=>((window as unknown as Preview).theme.getPreferences().comfortable));await p.getByLabel('舒适阅读间距',{exact:true}).click();assert.notEqual(await p.evaluate(()=>((window as unknown as Preview).theme.getPreferences().comfortable)),pref);await p.getByLabel('舒适阅读间距',{exact:true}).click();checks.push('Real preference input operates and restores');
 await p.locator('.dmt-layout-choice button').filter({hasText:'左右'}).click();assert.equal(await p.locator('.dmt-workspace').getAttribute('data-settings-layout'),'vertical');await coverage(p);await p.locator('.dmt-layout-choice button').filter({hasText:'上下'}).click();await coverage(p);checks.push('Actual dual layouts remain available');
 await setSky(p,'alienRain');await p.waitForTimeout(3000);assert.equal((await snapshot(p)).target.special,'tentacle');assert.equal((await snapshot(p)).target.kind,'rain');assert.equal((await snapshot(p)).protectedOverlap,0);await p.screenshot({path:path.join(media,'alien-rain.png')});checks.push('Alien sky coexists with protected original rain');
 await setSky(p,'coldSnow');await p.waitForFunction(()=>((window as unknown as Preview).owner.snapshot().surfaces[0].state.snow>.9),undefined,{timeout:10000});assert.equal((await snapshot(p)).target.special,'cold');assert.ok((await snapshot(p)).snowflakes>0);assert.equal((await snapshot(p)).protectedOverlap,0);await p.screenshot({path:path.join(media,'cold-snow.png')});checks.push('Cold sky retains original snow and edge frost');
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(400);assert.equal(await p.locator('.dmt-settings-shell').evaluate(n=>n.getBoundingClientRect().right<=innerWidth+1),true);await p.screenshot({path:path.join(media,'narrow.png')});checks.push('390px shell stays in viewport');
 await p.evaluate(()=>((window as unknown as Preview).theme.setPreference('visualMotion',false)));await p.waitForTimeout(100);assert.equal((await snapshot(p)).activeFrames,0);checks.push('Animation preference stops the existing clock');
 await p.locator('.dmt-close').click();await p.waitForFunction(()=>!document.querySelector<HTMLDialogElement>('dialog')!.open);await p.evaluate(()=>{const w=window as unknown as Preview;w.owner.dispose();w.theme.destroy()});assert.equal(await p.locator('.sf-weather-canvas,.evo-material-layer').count(),0);await p.close();checks.push('Close and dispose release owned surfaces');
 if(process.argv.includes('--record'))for(const[name,viewport]of[['desktop',{width:1440,height:1000}],['narrow',{width:390,height:844}]]as const){
  const context=await browser.newContext({viewport,reducedMotion:'no-preference',recordVideo:{dir:path.join(out,name),size:viewport}}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.getByRole('button',{name:'打开设置',exact:true}).click();const start=Date.now(),events:Array<{label:string;ms:number}>=[];
  const event=async(label:string,action:()=>Promise<unknown>)=>{await action();events.push({label,ms:Date.now()-start})};
  await p.waitForTimeout(1500);await event('已认可血月',()=>setSky(p,'blood'));await p.waitForTimeout(4000);
  for(const[kind,label]of[['alien','异世界'],['heat','极热'],['cold','严寒']]as const){
   await event(label,()=>setSky(p,kind));await p.waitForTimeout(name==='desktop'?10000:6500);
   if(name==='desktop'){await event(label+' 分类切换',()=>p.getByRole('button',{name:'材质',exact:true}).click());await p.waitForTimeout(1500);await event('返回阅读',()=>p.getByRole('button',{name:'阅读',exact:true}).click());await p.waitForTimeout(1500)}
  }
  await event('异世界＋雨',()=>setSky(p,'alienRain'));await p.waitForTimeout(name==='desktop'?8000:6000);
  await event('严寒＋雪',()=>setSky(p,'coldSnow'));await p.waitForTimeout(name==='desktop'?9000:6500);
  await event('切换左右布局',()=>p.locator('.dmt-layout-choice button').filter({hasText:'左右'}).click());await p.waitForTimeout(1800);
  await event('真实设置操作',()=>p.getByLabel('舒适阅读间距',{exact:true}).click());await p.waitForTimeout(1000);
  await event('关闭',()=>p.locator('.dmt-close').click());await p.waitForTimeout(650);await event('重新打开',()=>p.getByRole('button',{name:'打开设置',exact:true}).click());await p.waitForTimeout(2000);
  await event('普通夜间',()=>setSky(p,'clear'));await p.waitForTimeout(4000);await p.keyboard.press('Escape');await p.waitForTimeout(400);
  const video=p.video()!;await context.close();cp.execFileSync('ffmpeg',['-y','-v','error','-i',await video.path(),'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',path.join(media,name+'-1x.mp4')]);records.push({name,viewport,events});console.log('Recorded',name);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(sources(),before,'Source changed during review');
 const report={scope:'Integrated actual-settings special weather; controlled inputs; original speed when recorded; no game/save changes or release',sourceHead:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:true,sources:before,acceptedBloodMoonUnchanged:true,browser:browser.version(),checks,appearances,records,errors};fs.writeFileSync(path.join(media,'result.json'),JSON.stringify(report,null,2)+'\n');
 const files=Object.fromEntries(fs.readdirSync(media).filter(n=>n!=='manifest.json').map(n=>[n,{bytes:fs.statSync(path.join(media,n)).size,sha256:hash(path.join(media,n))}]));assert.ok(Object.values(files).reduce((n,f)=>n+f.bytes,0)<16*1024*1024);fs.writeFileSync(path.join(media,'manifest.json'),JSON.stringify({scope:report.scope,files},null,2)+'\n');console.log(JSON.stringify({status:'PASS',checks:checks.length,media,errors}));
}catch(error){fs.writeFileSync(path.join(out,'failure.txt'),String(error));throw error}
finally{await browser.close();await server.close()}
