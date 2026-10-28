// @ci-contract {"profiles":["standard","research"],"classification":"contract","granularity":"entry"}
// Real OrbitFocus, production CSS and native buttons; no game state.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import cp = require('node:child_process');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {App,Component} from 'vue';
declare const orbitResources:{stats():{resize:number;mutation:number;frames:number};late():void};
declare const orbitFixture:{state:{active:string};app:Pick<App,'unmount'>;nextTick:typeof import('vue').nextTick;calls():number};
declare const must:<T>(value:T|null)=>T;
const {chromium}=playwright;
(async()=>{
 const baseline=process.argv.includes('--baseline'),revision='5b028d0bc5fc9de2e0245d22a925a47b6c325286';
 const old=baseline?cp.execFileSync('git',['show',revision+':src/ui/OrbitFocus.vue'],{encoding:'utf8'}):undefined;
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[...(baseline?[{name:'frozen-orbit',enforce:'pre' as const,load(id:string){if(id.replaceAll('\\','/').endsWith('/src/ui/OrbitFocus.vue'))return old}}]:[]),vue(),{name:'orbit-fixture',resolveId(id){if(id==='/__orbit_vue__.js')return '\0orbit-vue'},load(id){if(id==='\0orbit-vue')return "export {createApp,h,reactive,nextTick} from 'vue'"},configureServer(s){s.middlewares.use('/__orbit__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html><body></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 let browser,resources;const results=[];fs.mkdirSync('tests/artifacts/evolution',{recursive:true});
 try{await server.listen();const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');const port=address.port;browser=await chromium.launch(browserOptions);const p=await browser.newPage({viewport:{width:1100,height:800}}),errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:'+port+'/__orbit__');await p.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null)=>{if(!value)throw Error('Missing orbit fixture');return value}}));await p.addStyleTag({path:'dist/framework/official-ui/style.css'});
 await p.evaluate(async()=>{
  const paths=['/__orbit_vue__.js','/src/ui/OrbitFocus.vue'],[vueModule,orbitModule]:unknown[]=await Promise.all(paths.map(path=>import(path)));if(!vueModule||typeof vueModule!=='object'||!('createApp' in vueModule)||typeof vueModule.createApp!=='function'||!('h' in vueModule)||typeof vueModule.h!=='function'||!('reactive' in vueModule)||typeof vueModule.reactive!=='function'||!('nextTick' in vueModule)||typeof vueModule.nextTick!=='function')throw Error('Missing Vue fixture exports');if(!orbitModule||typeof orbitModule!=='object'||!('default' in orbitModule)||!orbitModule.default)throw Error('Missing OrbitFocus component');const createApp=vueModule.createApp as typeof import('vue')['createApp'],h=vueModule.h as typeof import('vue')['h'],reactive=vueModule.reactive as typeof import('vue')['reactive'],nextTick=vueModule.nextTick as typeof import('vue')['nextTick'],OrbitFocus=orbitModule.default as Component;
  const resizes=new Set<ResizeObserver>(),mutations=new Set<MutationObserver>(),frames=new Set<number>(),late:(()=>void)[]=[];
  const NativeResize=window.ResizeObserver,NativeMutation=window.MutationObserver,raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window);
  window.ResizeObserver=class extends NativeResize{constructor(callback:ResizeObserverCallback){super(callback);resizes.add(this);late.push(()=>callback([],this))}disconnect(){resizes.delete(this);super.disconnect()}};
  window.MutationObserver=class extends NativeMutation{constructor(callback:MutationCallback){super(callback);mutations.add(this)}disconnect(){mutations.delete(this);super.disconnect()}};
  window.requestAnimationFrame=callback=>{const id=raf(time=>{frames.delete(id);callback(time)});frames.add(id);return id};window.cancelAnimationFrame=id=>{frames.delete(id);caf(id)};
  Object.assign(window,{orbitResources:{stats:()=>({resize:resizes.size,mutation:mutations.size,frames:frames.size}),late:()=>late.forEach(callback=>callback())}});
  document.documentElement.setAttribute('data-stone-free','');document.documentElement.setAttribute('data-dgu-visualMotion','');
  document.body.innerHTML='<div id="fixture" style="position:relative;border:12px solid transparent;width:480px;height:160px;overflow:auto"><div id="mount"></div><div style="height:300px"></div></div>';
  const state=reactive({active:'one'});let calls=0;
  const app=createApp({render:()=>h('nav',{class:'dgu-orbit-nav',style:'display:contents'},[h(OrbitFocus,{active:state.active}),...['one','two'].map(id=>h('button',{'aria-current':state.active===id?'page':undefined,style:'display:block;margin:12px;width:120px;height:48px;border-radius:13px',onClick:()=>{calls++;state.active=id}},id))])});
  app.mount('#mount');Object.assign(window,{orbitFixture:{state,app,nextTick,calls:()=>calls}});
 });
 const aligned=()=>p.evaluate(()=>{const a=must(document.querySelector<HTMLElement>('[aria-current=page]')).getBoundingClientRect(),b=must(document.querySelector<HTMLElement>('.dmt-orbit-focus')).getBoundingClientRect();return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height))});
 await p.waitForFunction(()=>(document.querySelector('.dmt-orbit-focus')?.getBoundingClientRect().width??0)>0);
 const mountedResources=await p.evaluate(()=>orbitResources.stats());assert.ok(mountedResources.resize>0&&mountedResources.mutation>0,'actual consumer must own live observers before teardown');
 const noop=await p.evaluate(async()=>{const ring=must(document.querySelector<HTMLElement>('.dmt-orbit-focus'));orbitFixture.state.active='two';await orbitFixture.nextTick();await orbitFixture.nextTick();const animation=ring.getAnimations().find(a=>a.effect?.getTiming().duration===580);if(!animation)throw Error('Expected live migration before unchanged observer delivery');animation.pause();animation.currentTime=120;orbitResources.late();await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));const result={state:animation.playState,time:animation.currentTime};animation.finish();return result});assert.equal(noop.state,'paused','unchanged geometry must preserve the actual in-flight migration');assert.equal(noop.time,120);
 for(const zoom of [1,1.25,.85]){
  await p.evaluate(async zoom=>{document.body.style.zoom=String(zoom);orbitFixture.state.active='one';await orbitFixture.nextTick();window.dispatchEvent(new Event('resize'))},zoom);await p.waitForTimeout(650);
  const result=await p.evaluate(async()=>{
   const ring=must(document.querySelector<HTMLElement>('.dmt-orbit-focus')),before=ring.getBoundingClientRect().toJSON();orbitFixture.state.active='two';await orbitFixture.nextTick();await orbitFixture.nextTick();
   const animation=ring.getAnimations().find(a=>a.effect instanceof KeyframeEffect&&a.effect.target===ring&&a.effect.getKeyframes().some(k=>k.transform));if(!animation)throw Error('Expected real focus migration');animation.pause();animation.currentTime=0;
   const start=ring.getBoundingClientRect().toJSON();animation.finish();return{before,start};
  });results.push({zoom,...result});
  assert.ok(Math.abs(result.start.x-result.before.x)<1.5&&Math.abs(result.start.y-result.before.y)<1.5,'migration must start at the previous visible position: '+JSON.stringify(results.at(-1)));
  assert.ok(await aligned()<1.5);console.log('PASS orbit bordered display:contents continuity at zoom',zoom);
 }
 await p.getByRole('button',{name:'one',exact:true}).click();await p.waitForTimeout(650);assert.equal(await p.evaluate(()=>orbitFixture.calls()),1);
 await p.evaluate(()=>{must(document.getElementById('fixture')).scrollTop=35});await p.waitForTimeout(60);assert.ok(await aligned()<1.5);
 await p.emulateMedia({reducedMotion:'reduce'});await p.getByRole('button',{name:'two',exact:true}).click();await p.waitForTimeout(60);assert.ok(await aligned()<1.5);
 await p.evaluate(async()=>{must(document.querySelector<HTMLElement>('[aria-current=page]')).hidden=true;orbitFixture.state.active='two';window.dispatchEvent(new Event('resize'))});await p.waitForTimeout(60);
 assert.equal(await p.locator('.dmt-orbit-focus').evaluate(n=>getComputedStyle(n).visibility),'hidden');
 await p.evaluate(()=>{must(document.querySelector<HTMLElement>('[aria-current=page]')).hidden=false;must(document.getElementById('fixture')).style.display='none';window.dispatchEvent(new Event('resize'))});await p.waitForTimeout(60);
 assert.ok(await p.locator('.dmt-orbit-focus').evaluate(n=>!/(NaN|Infinity)/.test(n.style.cssText)));
 await p.evaluate(()=>{must(document.getElementById('fixture')).style.display='';window.dispatchEvent(new Event('resize'))});await p.waitForTimeout(60);assert.ok(await aligned()<1.5);
 const queued=await p.evaluate(async()=>{orbitFixture.state.active='one';await orbitFixture.nextTick();window.dispatchEvent(new Event('resize'));const queued=orbitResources.stats().frames;orbitFixture.app.unmount();orbitResources.late();window.dispatchEvent(new Event('resize'));return queued});assert.ok(queued>0,'teardown must exercise an actually queued layout frame');await p.waitForTimeout(60);assert.equal(await p.locator('.dmt-orbit-focus').count(),0);assert.deepEqual(errors,[]);
 resources=await p.evaluate(()=>orbitResources.stats());assert.deepEqual(resources,{resize:0,mutation:0,frames:0});
 console.log('PASS orbit scroll, native clicks, reduced motion, hidden/zero-size recovery and pending unmount');
 }finally{fs.writeFileSync('tests/artifacts/evolution/orbit'+(baseline?'-baseline':'')+'.json',JSON.stringify({baseline,revision,results,resources},null,2));await browser?.close();await server.close()}
})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
