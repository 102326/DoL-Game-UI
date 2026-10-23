// Real OrbitFocus, production CSS and native buttons; no game state.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
 const baseline=process.argv.includes('--baseline'),revision='5b028d0bc5fc9de2e0245d22a925a47b6c325286';
 const old=baseline?cp.execFileSync('git',['show',revision+':src/ui/OrbitFocus.vue'],{encoding:'utf8'}):null;
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[...(baseline?[{name:'frozen-orbit',enforce:'pre',load(id){if(id.replaceAll('\\','/').endsWith('/src/ui/OrbitFocus.vue'))return old}}]:[]),vue(),{name:'orbit-fixture',resolveId(id){if(id==='/__orbit_vue__.js')return '\0orbit-vue'},load(id){if(id==='\0orbit-vue')return "export {createApp,h,reactive,nextTick} from 'vue'"},configureServer(s){s.middlewares.use('/__orbit__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html><body></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 let browser,resources;const results=[];fs.mkdirSync('tests/artifacts/evolution',{recursive:true});
 try{await server.listen();browser=await chromium.launch(require('./browser-options.cjs'));const p=await browser.newPage({viewport:{width:1100,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__orbit__');await p.addStyleTag({path:'dist/framework/official-ui/style.css'});
 await p.evaluate(async()=>{
  const [{createApp,h,reactive,nextTick},{default:OrbitFocus}]=await Promise.all([import('/__orbit_vue__.js'),import('/src/ui/OrbitFocus.vue')]);
  const resizes=new Set(),mutations=new Set(),frames=new Set(),late=[];
  const NativeResize=window.ResizeObserver,NativeMutation=window.MutationObserver,raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window);
  window.ResizeObserver=class extends NativeResize{constructor(callback){super(callback);resizes.add(this);late.push(()=>callback([],this))}disconnect(){resizes.delete(this);super.disconnect()}};
  window.MutationObserver=class extends NativeMutation{constructor(callback){super(callback);mutations.add(this)}disconnect(){mutations.delete(this);super.disconnect()}};
  window.requestAnimationFrame=callback=>{const id=raf(time=>{frames.delete(id);callback(time)});frames.add(id);return id};window.cancelAnimationFrame=id=>{frames.delete(id);caf(id)};
  window.orbitResources={stats:()=>({resize:resizes.size,mutation:mutations.size,frames:frames.size}),late:()=>late.forEach(callback=>callback())};
  document.documentElement.setAttribute('data-stone-free','');document.documentElement.setAttribute('data-dgu-visualMotion','');
  document.body.innerHTML='<div id="fixture" style="position:relative;border:12px solid transparent;width:480px;height:160px;overflow:auto"><div id="mount"></div><div style="height:300px"></div></div>';
  const state=reactive({active:'one'});let calls=0;
  const app=createApp({render:()=>h('nav',{class:'dgu-orbit-nav',style:'display:contents'},[h(OrbitFocus,{active:state.active}),...['one','two'].map(id=>h('button',{'aria-current':state.active===id?'page':undefined,style:'display:block;margin:12px;width:120px;height:48px;border-radius:13px',onClick:()=>{calls++;state.active=id}},id))])});
  app.mount('#mount');window.orbitFixture={state,app,nextTick,calls:()=>calls};
 });
 const aligned=()=>p.evaluate(()=>{const a=document.querySelector('[aria-current=page]').getBoundingClientRect(),b=document.querySelector('.dmt-orbit-focus').getBoundingClientRect();return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height))});
 await p.waitForFunction(()=>document.querySelector('.dmt-orbit-focus')?.getBoundingClientRect().width>0);
 const mountedResources=await p.evaluate(()=>orbitResources.stats());assert.ok(mountedResources.resize>0&&mountedResources.mutation>0,'actual consumer must own live observers before teardown');
 for(const zoom of [1,1.25,.85]){
  await p.evaluate(async zoom=>{document.body.style.zoom=String(zoom);orbitFixture.state.active='one';await orbitFixture.nextTick();window.dispatchEvent(new Event('resize'))},zoom);await p.waitForTimeout(650);
  const result=await p.evaluate(async()=>{
   const ring=document.querySelector('.dmt-orbit-focus'),before=ring.getBoundingClientRect().toJSON();orbitFixture.state.active='two';await orbitFixture.nextTick();await orbitFixture.nextTick();
   const animation=ring.getAnimations().find(a=>a.effect?.target===ring&&a.effect.getKeyframes().some(k=>k.transform));if(!animation)throw Error('Expected real focus migration');animation.pause();animation.currentTime=0;
   const start=ring.getBoundingClientRect().toJSON();animation.finish();return{before,start};
  });results.push({zoom,...result});
  assert.ok(Math.abs(result.start.x-result.before.x)<1.5&&Math.abs(result.start.y-result.before.y)<1.5,'migration must start at the previous visible position: '+JSON.stringify(results.at(-1)));
  assert.ok(await aligned()<1.5);console.log('PASS orbit bordered display:contents continuity at zoom',zoom);
 }
 await p.getByRole('button',{name:'one',exact:true}).click();await p.waitForTimeout(650);assert.equal(await p.evaluate(()=>orbitFixture.calls()),1);
 await p.evaluate(()=>{document.getElementById('fixture').scrollTop=35});await p.waitForTimeout(60);assert.ok(await aligned()<1.5);
 await p.emulateMedia({reducedMotion:'reduce'});await p.getByRole('button',{name:'two',exact:true}).click();await p.waitForTimeout(60);assert.ok(await aligned()<1.5);
 await p.evaluate(async()=>{document.querySelector('[aria-current=page]').hidden=true;orbitFixture.state.active='two';window.dispatchEvent(new Event('resize'))});await p.waitForTimeout(60);
 assert.equal(await p.locator('.dmt-orbit-focus').evaluate(n=>getComputedStyle(n).visibility),'hidden');
 await p.evaluate(()=>{document.querySelector('[aria-current=page]').hidden=false;document.getElementById('fixture').style.display='none';window.dispatchEvent(new Event('resize'))});await p.waitForTimeout(60);
 assert.ok(await p.locator('.dmt-orbit-focus').evaluate(n=>!/(NaN|Infinity)/.test(n.style.cssText)));
 await p.evaluate(()=>{document.getElementById('fixture').style.display='';window.dispatchEvent(new Event('resize'))});await p.waitForTimeout(60);assert.ok(await aligned()<1.5);
 const queued=await p.evaluate(async()=>{orbitFixture.state.active='one';await orbitFixture.nextTick();window.dispatchEvent(new Event('resize'));const queued=orbitResources.stats().frames;orbitFixture.app.unmount();orbitResources.late();window.dispatchEvent(new Event('resize'));return queued});assert.ok(queued>0,'teardown must exercise an actually queued layout frame');await p.waitForTimeout(60);assert.equal(await p.locator('.dmt-orbit-focus').count(),0);assert.deepEqual(errors,[]);
 resources=await p.evaluate(()=>orbitResources.stats());assert.deepEqual(resources,{resize:0,mutation:0,frames:0});
 console.log('PASS orbit scroll, native clicks, reduced motion, hidden/zero-size recovery and pending unmount');
 }finally{fs.writeFileSync('tests/artifacts/evolution/orbit'+(baseline?'-baseline':'')+'.json',JSON.stringify({baseline,revision,results,resources},null,2));await browser?.close();await server.close()}
})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
