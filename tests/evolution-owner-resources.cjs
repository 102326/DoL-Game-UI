// Real owners and components; controlled resources, no game variables or player saves.
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const baseline=process.argv.includes('--baseline'),revision='fbf026997c73ac35b22e3a697a13d74e0686a065',results=[],hubIntegration={checks:[],counterexamples:[]};
 const old=baseline?require('node:child_process').execFileSync('git',['show',revision+':src/wardrobe/main.ts'],{encoding:'utf8'}):null;
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[...(baseline?[{name:'frozen-wardrobe-owner',enforce:'pre',load(id){if(id.replaceAll('\\','/').endsWith('/src/wardrobe/main.ts'))return old}}]:[]),vue(),{name:'owner-fixture',resolveId(id){if(id==='/__owner_vue__.js')return '\0owner-vue'},load(id){if(id==='\0owner-vue')return "export {createApp} from 'vue'"},configureServer(s){s.middlewares.use('/__owners__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html data-stone-free data-dgu-visualmotion><body><div id="ui-bar"><button id="original">Original</button><div id="overlayButtons"></div></div><div id="passages"></div><header id="weather-heading">Weather</header></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 let browser;
 try{
  await server.listen();browser=await chromium.launch(require('./browser-options.cjs'));
  for(const kind of ['settings','layout','attributes','social','panels','shop','wardrobe','saves','combat','floating','official-motion','weather','hub']){
   const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__owners__');
   await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
   await page.evaluate(async()=>{
    const paths=['/src/theme/controller.ts','/src/theme/layout.ts','/src/characteristics/main.ts','/src/social/main.ts','/src/panels/main.ts','/src/shop/main.ts','/src/wardrobe/main.ts','/src/saves/main.ts','/src/combat/main.ts','/src/floating/main.ts','/framework/official-ui/motion.ts','/framework/official-ui/weather.ts','/framework/official-ui/hub.ts','/framework/host.ts'];
    window.ownerModules=Object.fromEntries(await Promise.all(paths.map(async path=>[path,await import(path)])));
    const {createApp}=await import('/__owner_vue__.js'),mount=document.createElement('div');document.body.append(mount);const warmup=createApp({render:()=>null});warmup.mount(mount);warmup.unmount();mount.remove();
   });
   await page.evaluate(kind=>{
    const frames=new Map(),timers=new Map(),observers=new Set(),listeners=[],late=[];
    const raf=requestAnimationFrame.bind(window),caf=cancelAnimationFrame.bind(window),later=setTimeout.bind(window),clear=clearTimeout.bind(window),add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;
    window.requestAnimationFrame=callback=>{const id=raf(time=>{frames.delete(id);callback(time)});frames.set(id,callback);return id};window.cancelAnimationFrame=id=>{frames.delete(id);caf(id)};
    window.setTimeout=(callback,delay,...args)=>{const id=later(()=>{timers.delete(id);callback(...args)},delay);timers.set(id,{delay,stack:new Error().stack});return id};window.clearTimeout=id=>{timers.delete(id);clear(id)};
    for(const name of ['MutationObserver','ResizeObserver','IntersectionObserver']){const Native=window[name];window[name]=class extends Native{constructor(callback){super(callback);late.push(()=>callback([],this))}observe(...args){observers.add(this);return super.observe(...args)}disconnect(){observers.delete(this);super.disconnect()}}}
    const globalTarget=target=>target===window||target===document||target===visualViewport||target instanceof MediaQueryList,capture=options=>typeof options==='boolean'?options:!!options?.capture;
    EventTarget.prototype.addEventListener=function(type,callback,options){if(globalTarget(this)&&!listeners.some(x=>x.target===this&&x.type===type&&x.callback===callback&&x.capture===capture(options)))listeners.push({target:this,type,callback,capture:capture(options)});return add.call(this,type,callback,options)};
    EventTarget.prototype.removeEventListener=function(type,callback,options){const i=listeners.findIndex(x=>x.target===this&&x.type===type&&x.callback===callback&&x.capture===capture(options));if(i>=0)listeners.splice(i,1);return remove.call(this,type,callback,options)};
    const m=path=>ownerModules[path];let owner;
    if(kind==='settings'){m('/src/theme/controller.ts').startTheme();owner=DoLMidnightTheme;owner.openSettings()}
    if(kind==='layout'){m('/src/theme/layout.ts').startLayout();owner=DMTLayout;owner.sync({enabled:true,layout:true})}
    if(kind==='attributes')owner=m('/src/characteristics/main.ts').startCharacteristics(window);
    if(kind==='social')owner=m('/src/social/main.ts').startSocial(window);
    if(kind==='panels')owner=m('/src/panels/main.ts').startPanels(window);
    if(kind==='shop')owner=m('/src/shop/main.ts').startShop(window);
    if(kind==='wardrobe')owner=m('/src/wardrobe/main.ts').startWardrobe(window);
    if(kind==='saves')owner=m('/src/saves/main.ts').startSaves(window);
    if(kind==='combat'){m('/src/combat/main.ts').startCombat();owner=DoLCombatUI}
    if(kind==='floating')owner=m('/src/floating/main.ts').startFloatingTools();
    if(kind==='official-motion')owner={destroy:m('/framework/official-ui/motion.ts').startOfficialMotion()};
    if(kind==='weather'){const weather=m('/framework/official-ui/weather.ts').headerWeather();weather.set('owned',document.getElementById('weather-heading'),document.body);const shell=document.createElement('section');shell.style.cssText='position:relative;width:640px;height:480px';shell.innerHTML='<header>Settings owner</header><button>Original input</button>';document.body.append(shell);window.Weather={name:'rain',precipitation:'rain'};weather.set('settings',shell.firstElementChild,shell);weather.refresh();owner={destroy:weather.dispose}}
    if(kind==='hub'){const host=m('/framework/host.ts').createHost(window),participant=host.register('owner-fixture');window.DoLFloatingTools={getPreferences:()=>({enabled:true,hidden:false,mode:'grid'})};const stop=m('/framework/official-ui/hub.ts').startOfficialHub(host,participant);owner={destroy(){stop();participant.dispose();host.dispose();delete window.DoLFloatingTools}}}
    window.ownerProbe={owner,stats:()=>({frames:frames.size,timers:timers.size,observers:observers.size,listeners:listeners.length}),late:()=>late.forEach(callback=>callback()),timerDetails:()=>[...timers.values()]};
   },kind);
   if(kind==='hub')await page.waitForSelector('.sf-motion-hub');
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const result=await page.evaluate(()=>{const mounted=ownerProbe.stats();ownerProbe.owner.refresh?.();window.dispatchEvent(new Event('resize'));const queued=ownerProbe.stats();ownerProbe.owner.destroy();const disposed=ownerProbe.stats();ownerProbe.late();window.dispatchEvent(new Event('resize'));return{mounted,queued,disposed,late:ownerProbe.stats(),timerDetails:ownerProbe.timerDetails()}});
   results.push({kind,...result});assert.ok(result.mounted.observers+result.mounted.listeners>0,kind+' must exercise real resources');assert.deepEqual(result.disposed,{frames:0,timers:0,observers:0,listeners:0},kind+' resources after dispose');assert.deepEqual(result.late,result.disposed,kind+' late callbacks cannot reacquire resources');
   await page.waitForTimeout(60);assert.deepEqual(errors,[],kind);console.log('PASS actual owner resources and late teardown:',kind);await page.close();
  }
  const {verifyHubIntegration}=require('./evolution-hub-integration.cjs');
  hubIntegration.checks=await verifyHubIntegration(browser);
  await assert.rejects(()=>verifyHubIntegration(browser,{unsafeConstruction:true}),error=>{if(error.code!=='ERR_ASSERTION'||!/constructor fallback must remove the already appended canvas/.test(error.message))return false;hubIntegration.counterexamples.push({kind:'constructor-outside-cleanup',status:'REJECTED',assertion:error.message,...error.hubIntegration});return true});
  await assert.rejects(()=>verifyHubIntegration(browser,{oldGeometry:true}),error=>{if(error.code!=='ERR_ASSERTION'||!/restored Hub geometry must fit the resized hidden viewport|finite restored menu origin/.test(error.message))return false;hubIntegration.counterexamples.push({kind:'frozen-MotionHub-d3f04ee',status:'REJECTED',assertion:error.message,...error.hubIntegration});return true});
  await assert.rejects(()=>verifyHubIntegration(browser,{oldScroll:true}),error=>{if(error.code!=='ERR_ASSERTION'||!/short viewport utility must scroll within safe bounds/.test(error.message))return false;hubIntegration.counterexamples.push({kind:'old-overflow-specificity',status:'REJECTED',assertion:error.message,...error.hubIntegration});return true});
  console.log('PASS H01 exact constructor, frozen-geometry and short-scroll counterexamples rejected');
 }finally{fs.mkdirSync('tests/artifacts/evolution',{recursive:true});fs.writeFileSync('tests/artifacts/evolution/owners'+(baseline?'-baseline':'')+'.json',JSON.stringify({baseline,revision,results,hubIntegration},null,2));await browser?.close();await server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
