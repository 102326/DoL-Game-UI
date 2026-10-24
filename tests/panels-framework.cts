// @ci-contract {"profiles":["standard","research"],"classification":"contract","granularity":"entry"}
import playwright = require('playwright');
import assert = require('node:assert/strict');
import path = require('node:path');
import cp = require('node:child_process');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {Host,Participant,MountContext,MountRequest} from '../framework/contracts';
import type {PanelControls,PanelKind,StartPanels} from '../src/panels/types';
declare const must:<T>(value:T|null)=>T;
type LifecycleResult={scenario:{overlay?:string;passage?:string};trace:ReturnType<PanelControls['getLifecycleCounts']>} & Record<'claimBeforeDOM'|'retryAfterContention'|'normalReleased'|'released'|'restored'|'contentionNative'|'resumed'|'failureReleased'|'recovered'|'setupReleased'|'setupRecovered'|'ownerStopped'|'nativeSafe',boolean>;
const {chromium}=playwright;
const baseline=process.argv.includes('--baseline'),baselineSource=baseline?cp.execFileSync('git',['show','ca0d606b775ae76f3bc1b321e5b62549afde62cf:src/panels/main.ts'],{encoding:'utf8'}):undefined;
(async()=>{
 const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);
 const vite=await createServer({configFile:false,root:process.cwd(),plugins:[{name:'panels-lifecycle-baseline',enforce:'pre',load(id){if(baseline&&id===path.resolve('src/panels/main.ts'))return baselineSource}},vue(),{name:'panels-framework-test-page',configureServer(server){server.middlewares.use('/__panels_framework_test__',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body></body></html>')})}}],optimizeDeps:{noDiscovery:true,include:['vue']},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 const browser=await chromium.launch(browserOptions);
 try{await vite.listen();const page=await browser.newPage(),address=vite.httpServer?.address();assert.ok(address&&typeof address!=='string');await page.goto(`http://127.0.0.1:${address.port}/__panels_framework_test__`);await page.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null)=>{if(!value)throw Error('Missing panels fixture');return value}}));
  const result=await page.evaluate(async()=>{
   const paths=['/src/panels/main.ts','/framework/host.ts'],[panelsModule,hostModule]:unknown[]=await Promise.all(paths.map(path=>import(path)));if(!panelsModule||typeof panelsModule!=='object'||!('startPanels' in panelsModule)||typeof panelsModule.startPanels!=='function'||!hostModule||typeof hostModule!=='object'||!('createHost' in hostModule)||typeof hostModule.createHost!=='function')throw Error('Missing panels or Host exports');const startPanels=panelsModule.startPanels as StartPanels,createHost=hostModule.createHost as typeof import('../framework/host')['createHost'];
   document.body.innerHTML='<div id="customOverlay" data-overlay="traits"><div id="customOverlayContent"><div id="traitLists"><div><h4 id="native-heading" class="traitHeading" data-dgp-count="original">Trait group</h4><div class="trait" id="native-trait">Native trait</div></div></div><button id="overlay-control">Overlay action</button><div id="unknown-mod-node">Unknown</div></div></div><div id="passages"><div class="passage" data-passage="Settings"><h2 class="settingsHeader" id="passage-heading">Settings group</h2><button id="settings-control">Settings action</button></div></div><div id="peer"></div>';
   Object.assign(window,{jQuery:()=>({on(){},off(){}})});let calls=0;must(document.querySelector('#overlay-control')).addEventListener('click',()=>calls++);
   const content=must(document.querySelector<HTMLElement>('#customOverlayContent')),nodes=[...content.querySelectorAll('*')],nativeHeading=must(document.querySelector<HTMLElement>('#native-heading'));
   const host=createHost(window),owner=host.register('panels'),peer=host.register('peer');peer.mount({id:'keep',parent:must(document.querySelector('#peer')),lifetime:'persistent',setup(){}});
   const api=startPanels(window,{host,owner}),frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await frame();
   const overlayMount=host.getDiagnostics().mounts.some(m=>m.owner==='panels'&&m.id==='panels-overlay'&&m.lifetime==='persistent');
   const passageMount=host.getDiagnostics().mounts.some(m=>m.owner==='panels'&&m.id==='panels-passage'&&m.lifetime==='passage');
   must(document.querySelector<HTMLElement>('#overlay-control')).click();const originalIdentity=nodes.every(node=>node.isConnected&&content.contains(node))&&nativeHeading.dataset.dgpCount!=='original';
   api.setEnabled('traits',false);await frame();const disabled=!document.querySelector('#customOverlay .dgp-host')&&nativeHeading.dataset.dgpCount==='original'&&nodes.every(node=>node.isConnected&&content.contains(node));
   api.setEnabled('traits',true);await frame();const enabled=!!document.querySelector('#customOverlay .dgp-navigation');
   must(document.querySelector('#customOverlay > .dgp-host')).remove();await frame();const hostRemovalReentry=!!document.querySelector('#customOverlay .dgp-navigation');
   const oldOverlay=must(document.querySelector('#customOverlay')),replacement=document.createElement('div');replacement.id='customOverlay';replacement.dataset.overlay='traits';replacement.append(content);oldOverlay.replaceWith(replacement);await frame();
   const overlayReplacement=!!replacement.querySelector('.dgp-navigation')&&nodes.every(node=>node.isConnected&&content.contains(node));
   host.invalidateScene();await frame();const passageInvalidated=!document.querySelector('#passages .dgp-host')&&!!document.querySelector('#customOverlay .dgp-navigation');
   host.sceneReady();api.refresh();await frame();const passageReentry=!!document.querySelector('#passages .dgp-navigation')&&host.getDiagnostics().mounts.some(m=>m.id==='panels-passage'&&m.lifetime==='passage');
   api.setEnabled('settings',false);await frame();const passageDisabled=!document.querySelector('#passages .dgp-host');api.setEnabled('settings',true);await frame();const passageEnabled=!!document.querySelector('#passages .dgp-navigation');
   api.setEnabled('traits',true);owner.dispose();await frame();api.refresh();await frame();
   const ownerDisposed=!document.querySelector('#customOverlay .dgp-host')&&!document.querySelector('#passages .dgp-host')&&host.getDiagnostics().mounts.some(m=>m.owner==='peer'&&m.id==='keep');
   const noRemount=!document.querySelector('.dgp-host')&&nodes.every(node=>node.isConnected&&content.contains(node));must(document.querySelector<HTMLElement>('#overlay-control')).click();
   const classic=startPanels(window);await frame();const classicPath=!!document.querySelector('#customOverlay .dgp-navigation')&&!!document.querySelector('#passages .dgp-navigation');classic.destroy();api.destroy();peer.dispose();host.dispose();
   return {overlayMount,passageMount,originalIdentity,disabled,enabled,hostRemovalReentry,overlayReplacement,passageInvalidated,passageReentry,passageDisabled,passageEnabled,ownerDisposed,noRemount,classicPath,calls};
  });
  for(const key of ['overlayMount','passageMount','originalIdentity','disabled','enabled','hostRemovalReentry','overlayReplacement','passageInvalidated','passageReentry','passageDisabled','passageEnabled','ownerDisposed','noRemount','classicPath'] as const)assert.equal(result[key],true,key);
  assert.equal(result.calls,2,'native overlay handler remains attached to the same node');
  console.log('PASS panels persistent overlay and passage mounts, host/overlay replacement, scene lifetime, owner cleanup and classic path');
  const lifecycleResults:LifecycleResult[]=[];
  const cases:{overlay?:string;passage?:string}[]=[...['traits','journal','statistics','gameFeats','cheats','options'].map(overlay=>({overlay})),...['Attitudes','Livestock Attitudes','Settings','Livestock Settings'].map(passage=>({passage}))];
  for(const scenario of cases){
   const lifecycle=await page.evaluate(async scenario=>{
    const inline=!!scenario.passage,mapping:Record<string,PanelKind>={gameFeats:'feats',options:'settings'},kind:PanelKind=inline?(scenario.passage?.includes('Attitudes')?'attitudes':'settings'):(mapping[scenario.overlay??'']??scenario.overlay??'traits') as PanelKind;
    const paths=['/src/panels/main.ts','/framework/host.ts'],[panelsModule,hostModule]:unknown[]=await Promise.all(paths.map(path=>import(path)));if(!panelsModule||typeof panelsModule!=='object'||!('startPanels' in panelsModule)||typeof panelsModule.startPanels!=='function'||!hostModule||typeof hostModule!=='object'||!('createHost' in hostModule)||typeof hostModule.createHost!=='function')throw Error('Missing panels or Host exports');const startPanels=panelsModule.startPanels as StartPanels,createHost=hostModule.createHost as typeof import('../framework/host')['createHost'];
    for(const key of ['journal','traits','statistics','feats','cheats','attitudes','settings'])localStorage.removeItem('DoLGameUI.'+key+'.enabled');
    document.body.innerHTML='<div id="customOverlay" data-overlay="traits" class="dgp-overlay" data-dgp-panel="original"><div id="customOverlayContent"><div id="traitLists"><h4>Native traits</h4><button id="native">Native</button></div></div></div><div id="passages"><div class="passage dgp-overlay" data-passage="Settings" data-dgp-panel="original"><h2 class="settingsHeader">Native settings</h2><button id="native-passage">Native settings action</button></div></div><div id="peer"></div>';
    must(document.querySelector<HTMLElement>('#customOverlay')).dataset.overlay=scenario.overlay||'traits';must(document.querySelector<HTMLElement>('.passage')).dataset.passage=scenario.passage||'Settings';
    if(!inline){must(document.querySelector<HTMLElement>('#customOverlayContent')).insertAdjacentHTML('afterbegin','<h1 class="header">Journal</h1><div class="foldout"><h2 class="foldoutHeader">Statistics</h2></div><div id="featTypes">Filter</div><div id="featsList">Feats</div><div id="cheatsShown"><h2 class="settingsHeader">Cheats</h2></div><h2 class="settingsHeader">Settings</h2>')}
    Object.assign(window,{jQuery:()=>({on(){},off(){}})});
    const node=must(document.querySelector<HTMLElement>(inline?'.passage':'#customOverlay')),native=must(node.querySelector<HTMLElement>('button')),key=inline?'panels-passage-life':'panels-overlay-life',id=inline?'panels-passage':'panels-overlay';
    let calls=0,mounts=0;native.onclick=()=>calls++;
    const host=createHost(window),owner=host.register('panels'),peer=host.register('peer'),raw=owner.mount.bind(owner),frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    peer.mount({id:'keep',parent:must(document.querySelector('#peer')),lifetime:'persistent',setup(){}});
    let held=peer.claim('region',key);const wrapped={...owner,mount(request:MountRequest){if(request.id===id)mounts++;return raw(request)}};
    const api=startPanels(window,{host,owner:wrapped});await frame();
    const claimBeforeDOM=mounts===0&&!node.querySelector('.dgp-host')&&node.dataset.dgpPanel==='original'&&node.classList.contains('dgp-overlay');
    if(!held)throw Error('Missing peer claim');held.release();api.refresh();await frame();const retryAfterContention=!!node.querySelector('.dgp-navigation');
    if(inline)api.setEnabled(kind,false);else node.classList.add('hidden');await frame();
    held=peer.claim('region',key);const released=!!held,restored=node.dataset.dgpPanel==='original'&&node.classList.contains('dgp-overlay');
    if(inline)api.setEnabled(kind,true);else node.classList.remove('hidden');api.refresh();await frame();const contentionNative=!node.querySelector('.dgp-host');
    held?.release();api.refresh();await frame();const resumed=!!node.querySelector('.dgp-navigation'),trace=api.getLifecycleCounts();api.destroy();
    const normal=startPanels(window,{host,owner});await frame();if(inline)normal.setEnabled(kind,false);else node.classList.add('hidden');await frame();held=peer.claim('region',key);const normalReleased=!!held;held?.release();if(inline)normal.setEnabled(kind,true);else node.classList.remove('hidden');normal.destroy();
    // A failed mount must release its claim, keep native input and allow explicit recovery.
    let fail=true;const faulty={...owner,mount(request:MountRequest){if(request.id===id&&fail){fail=false;throw Error('controlled panel mount failure')}return raw(request)}};
    const failed=startPanels(window,{host,owner:faulty});await frame();held=peer.claim('region',key);const failureReleased=!!held&&!node.querySelector('.dgp-host');held?.release();
    failed.setEnabled(kind,true);await frame();const recovered=!!node.querySelector('.dgp-navigation');failed.destroy();
    let setupFail=true;const setupFault={...owner,mount(request:MountRequest){return raw(request.id===id&&setupFail?{...request,setup(context:MountContext){setupFail=false;request.setup(context);throw Error('controlled setup failure')}}:request)}};
    const setupApi=startPanels(window,{host,owner:setupFault});await frame();held=peer.claim('region',key);const setupReleased=!!held&&!node.querySelector('.dgp-host')&&!!node.querySelector('.dgp-recovery');held?.release();setupApi.setEnabled(kind,true);await frame();const setupRecovered=!!node.querySelector('.dgp-navigation');
    owner.dispose();await frame();setupApi.refresh();await frame();const ownerStopped=!node.querySelector('.dgp-host')&&host.getDiagnostics().mounts.some(m=>m.owner==='peer');
    native.click();const nativeSafe=native.isConnected&&node.contains(native)&&calls===1;setupApi.destroy();peer.dispose();host.dispose();
    return{scenario,inline,normalReleased,claimBeforeDOM,retryAfterContention,released,restored,contentionNative,resumed,failureReleased,recovered,setupReleased,setupRecovered,ownerStopped,nativeSafe,trace};
   },scenario);
   lifecycleResults.push(lifecycle);
   console.log('Panels lifecycle evidence',JSON.stringify(lifecycle));
  }
  for(const lifecycle of lifecycleResults){
   for(const key of ['claimBeforeDOM','retryAfterContention','normalReleased','released','restored','contentionNative','resumed','failureReleased','recovered','setupReleased','setupRecovered','ownerStopped','nativeSafe'] as const)assert.equal(lifecycle[key],true,JSON.stringify(lifecycle.scenario)+': '+key);
   if(!baseline)assert.equal(lifecycle.trace.mountContract,'navigation-mount/v1');
  }

 }finally{await browser.close();await vite.close()}
})().catch(error=>{receipt.terminalFailure(error);process.exitCode=1});
