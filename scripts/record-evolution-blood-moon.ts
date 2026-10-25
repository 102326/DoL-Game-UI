import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import cp from 'node:child_process';
import {createRequire} from 'node:module';
import {chromium,type Page} from 'playwright';
import {createBloodMoonPreview} from './preview-evolution-blood-moon.ts';
import {assertAcceptedWeather} from './assert-accepted-weather.ts';

type SettingsState={target:{kind:string;special:string};specialSkiesEnabled:boolean;time:number;activeFrames:number;protectedOverlap:number};
type Preview={theme:{setPreference:(key:string,value:boolean)=>void;getPreferences:()=>{comfortable:boolean};destroy:()=>void};owner:{snapshot:()=>{surfaces:Array<{id:string;state:SettingsState}>};dispose:()=>void};openReview:()=>void;setSky:(kind:string)=>void};
const require=createRequire(import.meta.url),hash=(b:Buffer)=>crypto.createHash('sha256').update(b).digest('hex');
const out=path.resolve('tests/artifacts/evolution/blood-moon-integration-'+Date.now()),media=path.resolve('docs/media/evolution-blood-moon-integrated');assertAcceptedWeather();
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(media,{recursive:true});
const inputs=['src/ui/weather/blood-moon.ts','src/ui/weather/special-atmosphere.ts','src/ui/weather/settings.ts','scripts/assert-accepted-weather.ts','scripts/preview-evolution-blood-moon.ts','scripts/record-evolution-blood-moon.ts','src/ui/weather/wet-glass.ts','src/ui/weather/surface.ts','src/theme/controller.ts','dist/framework/official-ui/style.css'];
const sources=()=>Object.fromEntries(inputs.map(f=>[f,hash(fs.readFileSync(f))])),before=sources();
const server=await createBloodMoonPreview(0),browser=await chromium.launch(require('../tests/browser-options.cjs'));
const url='http://127.0.0.1:'+String((server.httpServer!.address() as {port:number}).port),errors:string[]=[],checks:string[]=[],records:unknown[]=[];
const snapshot=(page:Page)=>page.evaluate(()=>{const w=window as unknown as Preview;return w.owner.snapshot().surfaces.find(s=>s.id==='settings')!.state});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
 page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.getByRole('button',{name:'打开设置',exact:true}).click();
 assert.equal((await snapshot(page)).specialSkiesEnabled,true);assert.equal(await page.locator('.sf-weather-canvas').count(),1);
 await page.emulateMedia({reducedMotion:'reduce'});
 const reading=await page.locator('.dmt-reading-sample p').screenshot(),close=await page.locator('.dmt-close').screenshot();
 await page.keyboard.press('Alt+2');await page.waitForFunction(()=>{const w=window as unknown as Preview;return w.owner.snapshot().surfaces[0].state.target.special==='blood-moon'});
 assert.ok((await page.locator('.dmt-reading-sample p').screenshot()).equals(reading),'Reading pixels must remain unchanged');
 assert.ok((await page.locator('.dmt-close').screenshot()).equals(close),'Close pixels must remain unchanged');checks.push('Real paragraph and close control pixel protection');
 const frozen=(await snapshot(page)).time;await page.waitForTimeout(180);assert.equal((await snapshot(page)).time,frozen);checks.push('Reduced motion is static');
 await page.emulateMedia({reducedMotion:'no-preference'});const first=await page.locator('.sf-weather-canvas').screenshot();await page.waitForTimeout(1800);const second=await page.locator('.sf-weather-canvas').screenshot();assert.ok(!first.equals(second));assert.ok((await snapshot(page)).time>frozen);checks.push('Actual cloud pixels animate on the existing clock');
 await page.screenshot({path:path.join(media,'desktop.png')});
 for(const name of ['材质','入口','页面','高级','阅读']){
  await page.getByRole('button',{name,exact:true}).click();
  const coverage=await page.evaluate(()=>new Promise<number[]>(resolve=>{
   const samples:number[]=[],start=performance.now();
   const sample=()=>{const c=document.querySelector<HTMLCanvasElement>('.sf-weather-canvas')!,ctx=c.getContext('2d')!,x=Math.round(c.width*.1),y=Math.round(c.height*.38),w=Math.round(c.width*.8),h=Math.round(c.height*.32),pixels=ctx.getImageData(x,y,w,h).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>4)visible++;samples.push(visible);if(performance.now()-start<700)requestAnimationFrame(sample);else resolve(samples)};
   requestAnimationFrame(sample);
  }));
  assert.ok(coverage.every(n=>n>100),'Lower blood-moon layer disappears while switching '+name+': '+JSON.stringify(coverage));
 }
 checks.push('Lower atmosphere remains painted throughout all category transitions');
 const pref=await page.evaluate(()=>((window as unknown as Preview).theme.getPreferences().comfortable));await page.getByLabel('舒适阅读间距',{exact:true}).click();assert.notEqual(await page.evaluate(()=>((window as unknown as Preview).theme.getPreferences().comfortable)),pref);checks.push('Real setting control remains operable');
 await page.locator('.dmt-layout-choice button').filter({hasText:'左右'}).click();await page.waitForTimeout(500);assert.equal(await page.locator('.dmt-workspace').getAttribute('data-settings-layout'),'vertical');
 await page.locator('.dmt-layout-choice button').filter({hasText:'上下'}).click();await page.waitForTimeout(500);checks.push('Both layout controls operate on the actual settings component');
 await page.keyboard.press('Alt+3');await page.waitForTimeout(2500);assert.equal((await snapshot(page)).target.kind,'rain');assert.equal((await snapshot(page)).protectedOverlap,0);checks.push('Rain coexistence retains protection');
 await page.screenshot({path:path.join(media,'rain.png')});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);assert.equal(await page.locator('.dmt-settings-shell').evaluate(n=>n.getBoundingClientRect().right<=innerWidth+1),true);await page.screenshot({path:path.join(media,'narrow.png')});checks.push('390px shell stays in viewport');
 await page.evaluate(()=>((window as unknown as Preview).theme.setPreference('visualMotion',false)));await page.waitForTimeout(100);assert.equal((await snapshot(page)).activeFrames,0);checks.push('Animation preference stops the shared clock');
 await page.locator('.dmt-close').click();await page.waitForFunction(()=>!document.querySelector<HTMLDialogElement>('dialog')!.open);await page.evaluate(()=>{const w=window as unknown as Preview;w.owner.dispose();w.theme.destroy()});assert.equal(await page.locator('.sf-weather-canvas,.evo-material-layer').count(),0);checks.push('Close and disposal remove owned surfaces');await page.close();
 if(process.argv.includes('--record'))for(const [name,viewport]of[['desktop',{width:1440,height:1000}],['narrow',{width:390,height:844}]] as const){
  const context=await browser.newContext({viewport,reducedMotion:'no-preference',recordVideo:{dir:path.join(out,name),size:viewport}}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.getByRole('button',{name:'打开设置',exact:true}).click();await p.waitForTimeout(200);const events:Array<{label:string;ms:number}>=[],start=Date.now();
  const event=async(label:string,action:()=>Promise<unknown>)=>{await action();events.push({label,ms:Date.now()-start})};
  await p.waitForTimeout(1600);await event('夜间 → 血月',()=>p.keyboard.press('Alt+2'));await p.waitForTimeout(name==='desktop'?17000:8500);
  if(name==='desktop'){await event('切换左右布局',()=>p.locator('.dmt-layout-choice button').filter({hasText:'左右'}).click());await p.waitForTimeout(5500);await event('真实设置切换',()=>p.getByLabel('舒适阅读间距',{exact:true}).click());await p.waitForTimeout(1200)}
  await event('血月 → 雨中血月',()=>p.keyboard.press('Alt+3'));await p.waitForTimeout(name==='desktop'?14000:8500);
  await event('关闭',()=>p.locator('.dmt-close').click());await p.waitForTimeout(700);await event('再次打开',()=>p.getByRole('button',{name:'打开设置',exact:true}).click());await p.waitForTimeout(name==='desktop'?5000:2000);
  await event('退回普通夜间',()=>p.keyboard.press('Alt+1'));await p.waitForTimeout(3200);await event('Escape关闭',()=>p.keyboard.press('Escape'));await p.waitForTimeout(500);
  const video=p.video()!;await context.close();const raw=await video.path();
  // Retain original timing; only re-encode for local MP4 playback.
  cp.execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',raw,'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',path.join(media,name+'-1x.mp4')]);
  records.push({name,viewport,events});console.log('Recorded',name);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(sources(),before,'Review inputs changed while recording');
 const report={scope:'Integrated blood moon in actual settings; controlled input; original speed when recorded; no game/save changes or release',sourceHead:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:true,sources:before,browser:browser.version(),checks,errors,records};
 fs.writeFileSync(path.join(media,'result.json'),JSON.stringify(report,null,2)+'\n');
 const files=Object.fromEntries(fs.readdirSync(media).filter(n=>n!=='manifest.json').map(n=>{const b=fs.readFileSync(path.join(media,n));return[n,{bytes:b.length,sha256:hash(b)}]}));assert.ok(Object.values(files).reduce((n,f)=>n+f.bytes,0)<12*1024*1024,'Review media exceeds12MiB');fs.writeFileSync(path.join(media,'manifest.json'),JSON.stringify({scope:report.scope,files},null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',checks:checks.length,media,errors}));
}catch(error){fs.writeFileSync(path.join(out,'failure.txt'),String(error));throw error}
finally{await browser.close();await server.close()}
