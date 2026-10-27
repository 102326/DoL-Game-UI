// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry","rendererContexts":["weather:2d"]}
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {headerWeather,readGameWeather} from '../framework/official-ui/weather';
import type {Preferences} from '../src/theme/preferences';
const {chromium}=playwright;
type WeatherInput={name:string;precipitation:string;dayState?:string;bloodMoon?:boolean;temperature?:number;Temperature:{isExtreme:()=>boolean};enableLightning?:boolean;precipitationIntensity?:number};
type ThemeApi={openSettings():void;getPreferences():Preferences;setPreference(key:'visualMotion',value:boolean):void;destroy():void};
declare const readWeather:typeof readGameWeather;
declare const theme:ThemeApi;
declare const owner:ReturnType<typeof headerWeather>;
declare const sample:WeatherInput;
declare const SugarCube:{State:{variables:{location:string}}};
declare let skyCanvases:HTMLCanvasElement[];
declare let originalCreateElement:typeof document.createElement;
declare const bind:()=>void;
declare const must:<T>(value:T|null|undefined)=>T;

(async()=>{
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 // The CSS-only peer stays offscreen so its own changing sky cannot alter the settings backdrop.
 const server=await createServer({configFile:false,plugins:[vue(),{name:'special-weather',configureServer(s){s.middlewares.use('/__special_weather__',(_q,r)=>{r.setHeader('Content-Type','text/html; charset=utf-8');r.end('<!doctype html><html data-stone-free><body><button id="native">Original action</button><div id="peer" style="position:fixed;left:-2000px;top:30px;width:700px;height:500px"><header>Native window</header></div><script type="module">import {startTheme} from "/src/theme/controller.ts";import {headerWeather,readGameWeather} from "/framework/official-ui/weather.ts";window.readWeather=readGameWeather;window.sample={name:"clear",precipitation:"none",dayState:"night",bloodMoon:false,temperature:20,Temperature:{isExtreme:()=>false}};window.Weather=sample;window.SugarCube={State:{variables:{location:"home"}}};startTheme();window.theme=DoLMidnightTheme;window.owner=headerWeather();window.bind=()=>{const header=document.querySelector(".dmt-settings-header");owner.set("settings",header,header?.closest(".dmt-settings-shell"));owner.set("peer",document.querySelector("#peer header"),document.querySelector("#peer"));owner.refresh()};</script></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
  const out=path.resolve('tests/artifacts/evolution/special-weather-'+Date.now());fs.mkdirSync(out,{recursive:true});let browser,context;const states=[],errors:string[]=[];
 try{
  await server.listen();browser=await chromium.launch(browserOptions);
  context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:process.argv.includes('--record')?{dir:path.join(out,'video'),size:{width:1280,height:900}}:undefined});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');await page.goto('http://127.0.0.1:'+address.port+'/__special_weather__');await page.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value===null||value===undefined)throw Error('Missing special weather fixture');return value}}));await page.waitForFunction(()=>typeof theme!=='undefined');await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
  const mapping=await page.evaluate(()=>{
    const base={name:'clear',precipitation:'none'},temp=(temperature:unknown,extreme=true)=>({...base,temperature,Temperature:{isExtreme:()=>extreme}});
    const cases:Array<[string,NonNullable<Parameters<typeof readWeather>[0]>['Weather']]>=[
    ['blood-moon',{...base,bloodMoon:true}],['none',{...base,bloodMoon:'true'}],
    ['heat',temp(31)],['none',temp(30)],['none',temp(31,false)],['cold',temp(-18)],['none',temp(-17.9)],['none',temp(NaN)],['none',temp('31')],
    ['none',{...base,get bloodMoon(){throw Error('Unknown special provider')}}]
   ];const results=cases.map(([want,Weather])=>({want,state:readWeather({Weather})}));
   const frozen=Object.freeze({...base,bloodMoon:true});readWeather({Weather:frozen});
    return{cases:results,frozenUnchanged:frozen.bloodMoon===true,tentacle:readWeather({Weather:{...base,bloodMoon:true},SugarCube:{State:{variables:{location:'tentworld'}}}})};
  });for(const c of mapping.cases){assert.equal(c.state.special,c.want);assert.equal(c.state.kind,'clear')}assert.ok(mapping.frozenUnchanged);assert.equal(mapping.tentacle.special,'tentacle');
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{theme.openSettings();bind()});await page.waitForTimeout(200);
   const snap=()=>page.evaluate(()=>must(must(owner.snapshot().surfaces.find(s=>s.id==='settings')).state));
  assert.equal((await snap()).specialSkiesEnabled,true,'Actual settings enable the accepted sky renderer');assert.deepEqual((await snap()).specialSkyModels,[],'Ordinary settings do not eagerly create special textures');
   await page.evaluate(()=>{skyCanvases=[];originalCreateElement=document.createElement;document.createElement=new Proxy(originalCreateElement,{apply(target,thisArg,args){const node:unknown=Reflect.apply(target,thisArg,args);if(!(node instanceof HTMLElement))throw Error('Unexpected created element');if(args[0]==='canvas'){if(!(node instanceof HTMLCanvasElement))throw Error('Expected canvas');skyCanvases.push(node)}return node}})});
  // Compare the actual paragraph; the card's fractional rounded corner changes one RGB level when composited.
  const reading=await page.locator('.dmt-reading-sample p').screenshot(),close=await page.locator('.dmt-close').screenshot(),plain=await page.locator('.sf-weather-canvas').screenshot();
  for(const special of ['blood-moon','tentacle','heat','cold']){
   await page.evaluate(special=>{sample.bloodMoon=special==='blood-moon';SugarCube.State.variables.location=special==='tentacle'?'tentworld':'home';sample.temperature=special==='heat'?35:special==='cold'?-20:20;sample.Temperature.isExtreme=()=>special==='heat'||special==='cold';owner.refresh()},special);
    await page.waitForFunction(special=>must(must(owner.snapshot().surfaces.find(s=>s.id==='settings')).state).target.special===special&&must(must(owner.snapshot().surfaces.find(s=>s.id==='settings')).state).specialAmount===1,special);
    await page.waitForFunction(special=>document.querySelector<HTMLElement>('#peer>.kw-heading-weather')?.dataset.special===special,special);
   const readingNow=await page.locator('.dmt-reading-sample p').screenshot();if(!readingNow.equals(reading)){fs.writeFileSync(path.join(out,'reading-before.png'),reading);fs.writeFileSync(path.join(out,'reading-after.png'),readingNow);fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await snap(),null,2));await page.screenshot({path:path.join(out,'failure.png')})}assert.ok(readingNow.equals(reading),special+' preserves reading pixels');assert.ok((await page.locator('.dmt-close').screenshot()).equals(close),special+' preserves close pixels');
   const canvas=await page.locator('.sf-weather-canvas').screenshot();assert.ok(!canvas.equals(plain),special+' paints a real atmosphere');fs.writeFileSync(path.join(out,special+'.png'),await page.locator('.dmt-settings-shell').screenshot());
   assert.equal(await page.locator('#peer .kw-weather-atmosphere').evaluate(n=>getComputedStyle(n).display),'block');assert.equal(await page.locator('#peer .kw-weather-atmosphere').evaluate(n=>getComputedStyle(n).pointerEvents),'none');
   const s=await snap();assert.equal(s.activeFrames,0);assert.equal(s.protectedOverlap,0);assert.equal(s.specialSkyModels.length,special==='blood-moon'?1:2,'Accepted models are created once and reused');states.push({special,target:s.target,specialAmount:s.specialAmount,activeFrames:s.activeFrames,models:s.specialSkyModels});
  }
  assert.equal(await page.evaluate(()=>skyCanvases.length),11,'Seven moon and four atmosphere textures are bounded');
  await page.evaluate(()=>{sample.bloodMoon=true;sample.Temperature.isExtreme=()=>false;sample.precipitation='rain';sample.name='storm';sample.enableLightning=true;sample.precipitationIntensity=2.2;owner.refresh()});
   await page.waitForFunction(()=>{const s=must(must(owner.snapshot().surfaces.find(s=>s.id==='settings')).state);return s.target.special==='blood-moon'&&s.wet===1});assert.equal((await snap()).target.kind,'storm');assert.ok((await snap()).activeDrops>0,'Blood moon retains glass rain');
   await page.evaluate(()=>{sample.precipitation='snow';owner.refresh()});await page.waitForFunction(()=>must(must(owner.snapshot().surfaces.find(s=>s.id==='settings')).state).snow===1);assert.equal((await snap()).target.special,'blood-moon');assert.ok(((await snap()).icePlates??0)>0,'Blood moon retains accepted frost');
   await page.evaluate(()=>{sample.precipitation='none';sample.name='clear';sample.enableLightning=false;owner.refresh()});await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>must(must(owner.snapshot().surfaces.find(s=>s.id==='settings')).state).activeFrames===1);
  const t=(await snap()).time;await page.waitForTimeout(180);assert.ok((await snap()).time>t,'Special sky uses the existing animation clock');
  for(const name of ['材质','阅读']){
   await page.getByRole('button',{name,exact:true}).click();
    const coverage=await page.evaluate(()=>new Promise<number[]>(resolve=>{const samples:number[]=[],start=performance.now();const sample=()=>{const c=must(document.querySelector<HTMLCanvasElement>('.sf-weather-canvas')),ctx=must(c.getContext('2d')),pixels=ctx.getImageData(Math.round(c.width*.1),Math.round(c.height*.38),Math.round(c.width*.8),Math.round(c.height*.32)).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if((pixels[i]??0)>4)visible++;samples.push(visible);if(performance.now()-start<1400)requestAnimationFrame(sample);else resolve(samples)};requestAnimationFrame(sample)}));
   assert.ok(coverage.every(n=>n>100),'Production sky must not lose its lower half during '+name);
  }
  const before=await page.evaluate(()=>theme.getPreferences().mobileCompactControls);await page.getByLabel('手机紧凑按钮间距',{exact:true}).click();assert.equal(await page.evaluate(()=>theme.getPreferences().mobileCompactControls),!before,'Weather cannot take control input');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);assert.equal((await snap()).protectedOverlap,0);fs.writeFileSync(path.join(out,'blood-moon-narrow.png'),await page.locator('.dmt-settings-shell').screenshot());
   await page.evaluate(()=>theme.setPreference('visualMotion',false));await page.waitForFunction(()=>must(must(owner.snapshot().surfaces.find(s=>s.id==='settings')).state).activeFrames===0);const frozen=(await snap()).time;await page.waitForTimeout(100);assert.equal((await snap()).time,frozen);
   await page.evaluate(()=>{sample.bloodMoon=false;owner.refresh()});await page.waitForFunction(()=>must(must(owner.snapshot().surfaces.find(s=>s.id==='settings')).state).specialAmount===0);
   await page.locator('.dmt-close').click();await page.waitForFunction(()=>!document.querySelector<HTMLDialogElement>('dialog')?.open);await page.evaluate(()=>{owner.dispose();theme.destroy()});assert.equal(await page.locator('.sf-weather-canvas,.evo-material-layer,.kw-heading-weather').count(),0);assert.equal(await page.evaluate(()=>owner.snapshot().activePolls),0);assert.deepEqual(errors,[]);
  assert.equal(await page.evaluate(()=>skyCanvases.every(c=>c.width===0&&c.height===0)),true,'Dispose releases all special texture storage');await page.evaluate(()=>document.createElement=originalCreateElement);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({states,mapping,errors,platform:process.platform,browser:browser.version(),scope:'Controlled native getters, real settings and weather owner; not naturally reached in-game special events'},null,2));
  console.log('PASS special weather: native blood moon, tentworld, extreme temperature, rain/snow coexistence, protected pixels, input, narrow screen, motion off and teardown');console.log(out);
 }finally{await context?.close();await browser?.close();await server.close()}
})().catch(error=>{receipt.terminalFailure(error);process.exitCode=1});
