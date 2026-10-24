import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
import {createBloodMoonPreview} from './preview-evolution-blood-moon.ts';
import {assertAcceptedWeather} from './assert-accepted-weather.ts';

type Preview={setSky:(kind:string)=>void;owner:{snapshot:()=>{surfaces:Array<{state:{wet:number;specialAmount:number;dropBounds:unknown[];showerGeometry:unknown[];protectedOverlap:number}}>};dispose:()=>void};theme:{destroy:()=>void}};
const hash=(f:string)=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');assertAcceptedWeather();
const files=['src/ui/weather/blood-moon.ts','src/ui/weather/special-atmosphere.ts','src/ui/weather/settings.ts','src/ui/weather/wet-glass.ts','src/ui/weather/surface.ts','scripts/assert-accepted-weather.ts'];
assert.ok(!/bloodRainPalette|tintRain|blood-rain\.css/.test(fs.readFileSync('scripts/preview-evolution-blood-moon.ts','utf8')));
const server=await createBloodMoonPreview(0,true),browser=await chromium.launch(createRequire(import.meta.url)('../tests/browser-options.cjs')),media='docs/media/evolution-special-integration-rain';fs.mkdirSync(media,{recursive:true});
try{
 const p=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'no-preference'}),errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+String((server.httpServer!.address() as {port:number}).port));await p.evaluate(()=>((window as unknown as Preview).setSky('normalRain')));await p.getByRole('button',{name:'打开设置',exact:true}).click();await p.waitForFunction(()=>((window as unknown as Preview).owner.snapshot().surfaces[0].state.wet>.98)&&!!document.querySelector('.evo-glass-drop[data-moving=true][data-drop-id]'));await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);
 const drops=()=>p.locator('.evo-glass-drop[data-drop-id]').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n);return{background:s.backgroundImage,filter:s.backdropFilter,radius:s.borderRadius}}));
 const state=()=>p.evaluate(()=>((window as unknown as Preview).owner.snapshot().surfaces[0].state));
 const normal=await drops(),before=await state(),reading=await p.locator('.dmt-reading-sample p').screenshot();
 await p.evaluate(()=>((window as unknown as Preview).setSky('rain')));await p.waitForFunction(()=>((window as unknown as Preview).owner.snapshot().surfaces[0].state.specialAmount===1));
 assert.deepEqual(await drops(),normal);assert.ok(normal.every(s=>s.filter.includes('url(')));assert.equal(await p.locator('[data-blood-rain],style[data-vite-dev-id*="blood-rain.css"]').count(),0);assert.ok((await p.locator('.dmt-reading-sample p').screenshot()).equals(reading));const after=await state();assert.deepEqual(after.dropBounds,before.dropBounds);assert.deepEqual(after.showerGeometry,before.showerGeometry);assert.equal(after.protectedOverlap,0);await p.screenshot({path:media+'/ordinary-rain-blood-moon.png'});
 await p.evaluate(()=>{const w=window as unknown as Preview;w.owner.dispose();w.theme.destroy()});assert.equal(await p.locator('.sf-weather-canvas,.evo-glass-layer').count(),0);assert.deepEqual(errors,[]);
 const sources=Object.fromEntries([...files,'scripts/preview-evolution-blood-moon.ts','scripts/check-evolution-rain-rollback.ts'].map(f=>[f,hash(f)]));fs.writeFileSync(media+'/rollback.json',JSON.stringify({status:'PASS',scope:'Integrated owner-approved special weather with ordinary rain; no release',browser:browser.version(),sources,checks:['Accepted blood-moon and three atmosphere drawings unchanged','Blood-rain imports absent','Ordinary and blood-moon rain body/refraction exactly identical','Frozen rain geometry unchanged and protected','Reading pixels unchanged','Surfaces released'],screenshotSHA256:hash(media+'/ordinary-rain-blood-moon.png'),errors},null,2)+'\n');console.log('PASS: ordinary rain restored; 6 rollback checks');
}finally{await browser.close();await server.close()}
