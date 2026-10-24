// @ci-contract {"profiles":["standard","research"],"classification":"contract","granularity":"composed","includes":[{"prefix":"hub","source":"tests/evolution-hub-integration.cjs"}],"rendererContexts":["sphere:2d"]}
// Real owners and components; controlled resources, no game variables or player saves.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import playwright = require('playwright');
import cp = require('node:child_process');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import cases = require('../scripts/ci-cases.cjs');
import type {Host,Participant} from '../framework/contracts';
import type {headerWeather} from '../framework/official-ui/weather';
import type {createHost} from '../framework/host';
const {chromium}=playwright,{withCaseScope}=cases;
type ResourceOwner={refresh?():void;destroy():void};
type Probe={owner:ResourceOwner;stats():{frames:number;timers:number;observers:number;listeners:number};late():void;timerDetails():Array<{delay:number|undefined;stack:string|undefined}>};
declare const ownerModules:Record<string,unknown>;
declare const ownerProbe:Probe;
declare const DoLMidnightTheme:ResourceOwner&{openSettings():void};
declare const DMTLayout:ResourceOwner&{sync(input:{enabled:boolean;layout:boolean}):void};
declare const DoLCombatUI:ResourceOwner;
declare const DoLFloatingTools:{getPreferences():{enabled:boolean;hidden:boolean;mode:string}};
declare let Weather:{name:string;precipitation:string};
declare const must:<T>(value:T|null|undefined)=>T;
type Stats=ReturnType<Probe['stats']>;
type Counterexample={kind:string;status:'REJECTED';assertion:string;checks?:unknown;executedOverrides?:unknown};

(async()=>{
 const baseline=process.argv.includes('--baseline'),revision='fbf026997c73ac35b22e3a697a13d74e0686a065',results: Array<{kind:string;mounted:Stats;queued:Stats;disposed:Stats;late:Stats;timerDetails:ReturnType<Probe['timerDetails']>}>=[],hubIntegration:{checks:unknown;counterexamples:Counterexample[]}={checks:[],counterexamples:[]};
 const old=baseline?cp.execFileSync('git',['show',revision+':src/wardrobe/main.ts'],{encoding:'utf8'}):null;
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[...(baseline?[{name:'frozen-wardrobe-owner',enforce:'pre' as const,load(id:string){if(id.replaceAll('\\','/').endsWith('/src/wardrobe/main.ts'))return old}}]:[]),vue(),{name:'owner-fixture',resolveId(id){if(id==='/__owner_vue__.js')return '\0owner-vue'},load(id){if(id==='\0owner-vue')return "export {createApp} from 'vue'"},configureServer(s){s.middlewares.use('/__owners__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html data-stone-free data-dgu-visualmotion><body><div id="ui-bar"><button id="original">Original</button><div id="overlayButtons"></div></div><div id="passages"></div><header id="weather-heading">Weather</header></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 let browser:playwright.Browser|undefined;
 try{
  await server.listen();browser=await chromium.launch(browserOptions);const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');const port=address.port;
  for(const kind of ['settings','layout','attributes','social','panels','shop','wardrobe','saves','combat','floating','official-motion','weather','hub']){
   const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port+'/__owners__');await page.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value===null||value===undefined)throw Error('Missing owner fixture');return value}}));
   await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
   await page.evaluate(async()=>{
    const paths=['/src/theme/controller.ts','/src/theme/layout.ts','/src/characteristics/main.ts','/src/social/main.ts','/src/panels/main.ts','/src/shop/main.ts','/src/wardrobe/main.ts','/src/saves/main.ts','/src/combat/main.ts','/src/floating/main.ts','/framework/official-ui/motion.ts','/framework/official-ui/weather.ts','/framework/official-ui/hub.ts','/framework/host.ts'];
    Object.assign(window,{ownerModules:Object.fromEntries(await Promise.all(paths.map(async path=>[path,await import(path)])))});
    const vuePath='/__owner_vue__.js',module:unknown=await import(vuePath);if(!module||typeof module!=='object'||!('createApp' in module)||typeof module.createApp!=='function')throw Error('Missing Vue createApp');const createApp=module.createApp as typeof import('vue')['createApp'];const mount=document.createElement('div');document.body.append(mount);const warmup=createApp({render:()=>null});warmup.mount(mount);warmup.unmount();mount.remove();
   });
   await page.evaluate(kind=>{
    const frames=new Map<number,FrameRequestCallback>(),timers=new Map<number,{delay:number|undefined;stack:string|undefined}>(),observers=new Set<{disconnect():void}>(),listeners:Array<{target:EventTarget;type:string;callback:EventListenerOrEventListenerObject|null;capture:boolean}>=[],late:Array<()=>void>=[];
    const raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window),later=window.setTimeout.bind(window) as (callback:()=>void,delay?:number)=>number,clear=window.clearTimeout.bind(window),add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;
    window.requestAnimationFrame=callback=>{const id=raf(time=>{frames.delete(id);callback(time)});frames.set(id,callback);return id};window.cancelAnimationFrame=id=>{frames.delete(id);caf(id)};
    Object.assign(window,{setTimeout:(callback:TimerHandler,delay?:number,...args:unknown[])=>{const id=later(()=>{timers.delete(id);if(typeof callback==='function')callback(...args);else window.eval(callback)},delay);timers.set(id,{delay,stack:new Error().stack});return id}});window.clearTimeout=id=>{if(typeof id==='number')timers.delete(id);clear(id)};
    const NativeMutation=window.MutationObserver;window.MutationObserver=class extends NativeMutation{constructor(callback:MutationCallback){super(callback);late.push(()=>callback([],this))}observe(target:Node,options?:MutationObserverInit){observers.add(this);return super.observe(target,options)}disconnect(){observers.delete(this);super.disconnect()}};
    const NativeResize=window.ResizeObserver;window.ResizeObserver=class extends NativeResize{constructor(callback:ResizeObserverCallback){super(callback);late.push(()=>callback([],this))}observe(target:Element,options?:ResizeObserverOptions){observers.add(this);return super.observe(target,options)}disconnect(){observers.delete(this);super.disconnect()}};
    const NativeIntersection=window.IntersectionObserver;window.IntersectionObserver=class extends NativeIntersection{constructor(callback:IntersectionObserverCallback,options?:IntersectionObserverInit){super(callback,options);late.push(()=>callback([],this))}observe(target:Element){observers.add(this);return super.observe(target)}disconnect(){observers.delete(this);super.disconnect()}};
    const globalTarget=(target:EventTarget)=>target===window||target===document||target===visualViewport||target instanceof MediaQueryList,capture=(options:boolean|AddEventListenerOptions|EventListenerOptions|undefined)=>typeof options==='boolean'?options:!!options?.capture;
    EventTarget.prototype.addEventListener=function(type,callback,options){if(globalTarget(this)&&!listeners.some(x=>x.target===this&&x.type===type&&x.callback===callback&&x.capture===capture(options)))listeners.push({target:this,type,callback,capture:capture(options)});return add.call(this,type,callback,options)};
    EventTarget.prototype.removeEventListener=function(type,callback,options){const i=listeners.findIndex(x=>x.target===this&&x.type===type&&x.callback===callback&&x.capture===capture(options));if(i>=0)listeners.splice(i,1);return remove.call(this,type,callback,options)};
    function exportFunction<T extends Function>(path:string,name:string):T{const module=ownerModules[path];if(!module||typeof module!=='object')throw Error('Missing owner module '+path);const exports=module as Record<string,unknown>,value=exports[name];if(typeof value!=='function')throw Error('Missing owner export '+path+'#'+name);return value as T}
    const startOwner=(path:string,name:string)=>exportFunction<(root:Window)=>unknown>(path,name);
    const checkedOwner=(value:unknown):ResourceOwner=>{if(!value||typeof value!=='object'||!('destroy' in value)||typeof value.destroy!=='function')throw Error('Missing owner destroy');return value as ResourceOwner};
    let owner:ResourceOwner|undefined;
    if(kind==='settings'){exportFunction<()=>void>('/src/theme/controller.ts','startTheme')();owner=DoLMidnightTheme;DoLMidnightTheme.openSettings()}
    if(kind==='layout'){exportFunction<()=>void>('/src/theme/layout.ts','startLayout')();owner=DMTLayout;DMTLayout.sync({enabled:true,layout:true})}
    if(kind==='attributes')owner=checkedOwner(startOwner('/src/characteristics/main.ts','startCharacteristics')(window));
    if(kind==='social')owner=checkedOwner(startOwner('/src/social/main.ts','startSocial')(window));
    if(kind==='panels')owner=checkedOwner(startOwner('/src/panels/main.ts','startPanels')(window));
    if(kind==='shop')owner=checkedOwner(startOwner('/src/shop/main.ts','startShop')(window));
    if(kind==='wardrobe')owner=checkedOwner(startOwner('/src/wardrobe/main.ts','startWardrobe')(window));
    if(kind==='saves')owner=checkedOwner(startOwner('/src/saves/main.ts','startSaves')(window));
    if(kind==='combat'){exportFunction<()=>void>('/src/combat/main.ts','startCombat')();owner=DoLCombatUI}
    if(kind==='floating')owner=checkedOwner(startOwner('/src/floating/main.ts','startFloatingTools')(window));
    if(kind==='official-motion')owner={destroy:exportFunction<()=>()=>void>('/framework/official-ui/motion.ts','startOfficialMotion')()};
    if(kind==='weather'){const weather=exportFunction<typeof headerWeather>('/framework/official-ui/weather.ts','headerWeather')();weather.set('owned',must(document.getElementById('weather-heading')),document.body);const shell=document.createElement('section');shell.style.cssText='position:relative;width:640px;height:480px';shell.innerHTML='<header>Settings owner</header><button>Original input</button>';document.body.append(shell);Weather={name:'rain',precipitation:'rain'};const heading=must(shell.firstElementChild);if(!(heading instanceof HTMLElement))throw Error('Missing settings heading');weather.set('settings',heading,shell);weather.refresh();owner={destroy:weather.dispose}}
    if(kind==='hub'){const host=exportFunction<typeof createHost>('/framework/host.ts','createHost')(window),participant=host.register('owner-fixture');Object.assign(window,{DoLFloatingTools:{getPreferences:()=>({enabled:true,hidden:false,mode:'grid'})}});const stop=exportFunction<(host:Host,owner:Participant)=>()=>void>('/framework/official-ui/hub.ts','startOfficialHub')(host,participant);owner={destroy(){stop();participant.dispose();host.dispose();Reflect.deleteProperty(window,'DoLFloatingTools')}}}
    if(!owner)throw Error('Unknown owner kind '+kind);Object.assign(window,{ownerProbe:{owner,stats:()=>({frames:frames.size,timers:timers.size,observers:observers.size,listeners:listeners.length}),late:()=>late.forEach(callback=>callback()),timerDetails:()=>[...timers.values()]} satisfies Probe});
   },kind);
   if(kind==='hub')await page.waitForSelector('.sf-motion-hub');
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const result=await page.evaluate(()=>{const mounted=ownerProbe.stats();ownerProbe.owner.refresh?.();window.dispatchEvent(new Event('resize'));const queued=ownerProbe.stats();ownerProbe.owner.destroy();const disposed=ownerProbe.stats();ownerProbe.late();window.dispatchEvent(new Event('resize'));return{mounted,queued,disposed,late:ownerProbe.stats(),timerDetails:ownerProbe.timerDetails()}});
   results.push({kind,...result});assert.ok(result.mounted.observers+result.mounted.listeners>0,kind+' must exercise real resources');assert.deepEqual(result.disposed,{frames:0,timers:0,observers:0,listeners:0},kind+' resources after dispose');assert.deepEqual(result.late,result.disposed,kind+' late callbacks cannot reacquire resources');
   await page.waitForTimeout(60);assert.deepEqual(errors,[],kind);console.log('PASS actual owner resources and late teardown:',kind);await page.close();
  }
  const hubModule:unknown=require('./evolution-hub-integration.cjs');if(!hubModule||typeof hubModule!=='object'||!('verifyHubIntegration' in hubModule)||typeof hubModule.verifyHubIntegration!=='function')throw Error('Missing Hub integration verifier');
  const verifyHubIntegration=hubModule.verifyHubIntegration as (browser:playwright.Browser,options?:{unsafeConstruction?:boolean;oldGeometry?:boolean;oldScroll?:boolean;previewLayoutOnly?:boolean;oldPreviewStyle?:boolean})=>Promise<unknown>;
  const activeBrowser=browser;assert.ok(activeBrowser);hubIntegration.checks=await withCaseScope('hub',()=>verifyHubIntegration(activeBrowser));
  function rejectCounterexample(error:unknown,kind:string,pattern:RegExp){if(!(error instanceof Error)||!('code' in error)||error.code!=='ERR_ASSERTION'||!pattern.test(error.message))return false;const details='hubIntegration' in error&&error.hubIntegration&&typeof error.hubIntegration==='object'?error.hubIntegration:{};hubIntegration.counterexamples.push({kind,status:'REJECTED',assertion:error.message,...details});return true}
  await assert.rejects(()=>verifyHubIntegration(activeBrowser,{unsafeConstruction:true}),error=>rejectCounterexample(error,'constructor-outside-cleanup',/constructor fallback must remove the already appended canvas/));
  await assert.rejects(()=>verifyHubIntegration(activeBrowser,{oldGeometry:true}),error=>rejectCounterexample(error,'frozen-MotionHub-d3f04ee',/restored Hub geometry must fit the resized hidden viewport|finite restored menu origin/));
  await assert.rejects(()=>verifyHubIntegration(activeBrowser,{oldScroll:true}),error=>rejectCounterexample(error,'old-overflow-specificity',/short viewport utility must scroll within safe bounds/));
  await assert.rejects(()=>verifyHubIntegration(activeBrowser,{previewLayoutOnly:true,oldPreviewStyle:true}),error=>rejectCounterexample(error,'old-preview-main-selector',/preview styles must not collapse actual settings content/));
  console.log('PASS H01 exact constructor, frozen-geometry, short-scroll and preview-style counterexamples rejected');
 }finally{fs.mkdirSync('tests/artifacts/evolution',{recursive:true});fs.writeFileSync('tests/artifacts/evolution/owners'+(baseline?'-baseline':'')+'.json',JSON.stringify({baseline,revision,results,hubIntegration},null,2));await browser?.close();await server.close()}
})().catch(error=>{receipt.terminalFailure(error);process.exitCode=1});
