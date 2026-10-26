// @ci-contract {"profiles":["standard","research"],"classification":"contract","granularity":"entry"}
// Shared coordinate contract on actual native panel consumers; not game acceptance.
import playwright = require('playwright');
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import cp = require('node:child_process');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
const {chromium}=playwright;
const preparationBaseline=process.argv.includes('--baseline-preparation');
const originalPanels=preparationBaseline?cp.execFileSync('git',['show','936ec63288f1e6f66314cde84cebb17c8e77adee:src/panels/main.ts'],{encoding:'utf8'}):undefined;
declare const startPanelFixture:import('../src/panels/types').StartPanels;
type Preparation={lateNative:boolean|'during-read';initial:{mounts:number;scans:number;reads:number;labels:(string|null)[]};failures:number;errors:string[]}&Record<'hiddenClickBlocked'|'hiddenRemoved'|'restored'|'renamed'|'ancestorHidden'|'ancestorRestored'|'inlineRefreshed'|'originalPreserved'|'bodyReplaced'|'rootReplaced'|'stopped',boolean>;
type TraitPreparation={duringCount:boolean;count:string|undefined;traits:number;scans:number;separatorRestored:boolean};
(async()=>{const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[{name:'panel-preparation-baseline',enforce:'pre',load(id){if(preparationBaseline&&id.split('?')[0]===path.resolve('src/panels/main.ts'))return originalPanels}},vue(),{name:'evo-panels',configureServer(s){s.middlewares.use('/__evo_panels__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html><body></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});let browser;
 try{await server.listen();const address=server.httpServer?.address();if(!address||typeof address==='string')throw Error('Missing Vite TCP endpoint');browser=await chromium.launch(browserOptions);const results=[];
 for(const kind of ['journal','traits','statistics','feats','cheats','options']){
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+address.port+'/__evo_panels__');await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
  await page.addScriptTag({type:'module',content:"import {startPanels} from '/src/panels/main.ts';window.startPanelFixture=startPanels"});await page.waitForFunction(()=>typeof startPanelFixture==='function');
  const result=await page.evaluate(async kind=>{
   const attrs=kind==='journal'?'class="header"':kind==='traits'?'class="traitHeading"':kind==='statistics'?'class="foldoutHeader"':kind==='feats'?'':'class="settingsHeader"';
   const tag=kind==='journal'?'h1':kind==='traits'?'h4':'h2',wrap=kind==='traits'?'traitLists':kind==='cheats'?'cheatsShown':'fixture';
   const section=(id:string,label:string)=>kind==='feats'?`<div id="${id==='first'?'featTypes':'featsList'}" style="height:40px">${label}</div>`:`<${tag} id="${id}" ${attrs} style="margin:0;height:40px">${label}</${tag}>`;
   document.body.innerHTML=`<div id="customOverlay" data-overlay="${kind==='feats'?'gameFeats':kind}"><div id="customOverlayContent" style="height:240px;max-height:240px;overflow:auto"><div id="${wrap}" class="${kind==='statistics'?'foldout':''}">${section('first','First')}<div style="height:550px"></div>${section('target','Last')}<div style="height:550px"></div><button id="native">Native</button></div></div></div>`;
   let calls=0;const native=document.querySelector('#native');if(!(native instanceof HTMLButtonElement))throw Error('Missing native action');native.onclick=()=>calls++;native.click();const api=startPanelFixture(window),content=document.querySelector('#customOverlayContent'),target=document.getElementById(kind==='feats'?'featsList':'target');if(!(content instanceof HTMLElement)||!target)throw Error('Missing panel fixture');const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await frame();const results=[];
   for(const zoom of [1,1.25,.85]){document.body.style.zoom=String(zoom);content.scrollTop=0;const select=document.querySelector('.dgp-navigation select');if(!(select instanceof HTMLSelectElement)||select.options.length!==3)throw Error('Expected two actual groups '+kind);select.value='1';select.dispatchEvent(new Event('change',{bubbles:true}));await frame();results.push({zoom,gap:target.getBoundingClientRect().top-content.getBoundingClientRect().top,expected:12*zoom})}
   native.click();api.destroy();return{kind,results,nativePreserved:native.isConnected&&calls===2,remaining:document.querySelectorAll('.dgp-host').length};
  },kind);results.push(result);fs.mkdirSync('tests/artifacts/evolution',{recursive:true});fs.writeFileSync('tests/artifacts/evolution/panels.json',JSON.stringify(results,null,2));for(const g of result.results)assert.ok(Math.abs(g.gap-g.expected)<3,kind+' zoom '+JSON.stringify(g));assert.equal(result.nativePreserved,true);assert.equal(result.remaining,0);console.log('PASS EVO-A2 coordinates',kind);await page.close();
 }
 const preparation:Preparation[]=[];
 for(const lateNative of [false,true,'during-read'] as const){
  const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+address.port+'/__evo_panels__');await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
  await page.addScriptTag({type:'module',content:"import {startPanels} from '/src/panels/main.ts';window.startPanelFixture=startPanels"});await page.waitForFunction(()=>typeof startPanelFixture==='function');
  const result=await page.evaluate(async lateNative=>{
   document.body.innerHTML='<style>.hidden{display:none!important}</style><div id="customOverlay" class="hidden" data-overlay="cheats"><div id="customOverlayContent" style="height:240px;max-height:240px;overflow:auto"><div id="cheatsShown"><h2 id="section-first" class="settingsHeader">First</h2><div style="height:500px"></div><h2 id="section-last" class="settingsHeader">Last</h2><div style="height:500px"></div><button id="native">Native</button></div></div></div><div id="passages"><div class="passage" data-passage="Settings"><h2 class="settingsHeader">Inline</h2></div></div>';
   const must=<T,>(value:T|null)=>{if(!value)throw Error('Missing preparation fixture');return value},overlay=must(document.querySelector<HTMLElement>('#customOverlay')),body=must(document.querySelector<HTMLElement>('#customOverlayContent')),native=must(document.querySelector<HTMLButtonElement>('#native'));
   const settle=async()=>{for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)},labels=(root:ParentNode=overlay)=>[...root.querySelectorAll('.dgp-navigation option')].slice(1).map(n=>n.textContent);
   let calls=0,reads=0,queued=false;native.onclick=()=>calls++;native.click();
   const computed=window.getComputedStyle;
   window.getComputedStyle=function(node,pseudo){if(node.id.startsWith('section-')){reads++;if(lateNative&&!queued){queued=true;const change=()=>{const h=document.createElement('h2');h.className='settingsHeader';h.textContent='Late native';body.querySelector('#cheatsShown')?.append(h)};if(lateNative==='during-read')change();else queueMicrotask(change)}}return computed.call(window,node,pseudo)};
   const api=startPanelFixture(window);
   try{
    overlay.classList.remove('hidden');await settle();const initial={...api.getLifecycleCounts(),reads,labels:labels()};
    // A native change after the read phase still needs a later scan.
    const last=must(document.querySelector<HTMLElement>('#section-last'));body.scrollTop=0;last.hidden=true;const select=must(overlay.querySelector<HTMLSelectElement>('select'));select.value='1';select.dispatchEvent(new Event('change',{bubbles:true}));const hiddenClickBlocked=body.scrollTop===0;await settle();const hiddenRemoved=!labels().includes('Last');
    last.hidden=false;await settle();const restored=labels().includes('Last');
    const first=must(document.querySelector<HTMLElement>('#section-first'));first.textContent='Renamed';await settle();const renamed=labels().includes('Renamed');
    const group=must(body.querySelector<HTMLElement>('#cheatsShown'));group.style.visibility='hidden';await settle();const ancestorHidden=labels().length===0;group.style.visibility='';await settle();const ancestorRestored=labels().includes('Last');
    const inline=must(document.querySelector<HTMLElement>('.passage'));inline.insertAdjacentHTML('beforeend','<h2 class="settingsHeader">Inline native update</h2>');await settle();const inlineRefreshed=labels(inline).includes('Inline native update');
    native.click();const originalPreserved=native===body.querySelector('#native')&&calls===2;
    const replacement=document.createElement('div');replacement.id='customOverlayContent';replacement.innerHTML='<div id="cheatsShown"><h2 class="settingsHeader">Replacement</h2><button id="new-native">New native</button></div>';body.replaceWith(replacement);await settle();const bodyReplaced=labels().join('|')==='Replacement';
    const next=document.createElement('div');next.id='customOverlay';next.dataset.overlay='cheats';next.append(replacement);overlay.replaceWith(next);await settle();const rootReplaced=labels(next).join('|')==='Replacement';
    replacement.querySelector('h2')!.textContent='Pending update';const beforeDestroy=api.getLifecycleCounts().scans;api.destroy();await settle();const stopped=api.getLifecycleCounts().scans===beforeDestroy&&!document.querySelector('.dgp-host');
    return{lateNative,initial,hiddenClickBlocked,hiddenRemoved,restored,renamed,ancestorHidden,ancestorRestored,inlineRefreshed,originalPreserved,bodyReplaced,rootReplaced,stopped,failures:api.getLifecycleCounts().failures};
   }finally{api.destroy();window.getComputedStyle=computed}
  },lateNative);preparation.push({...result,errors});await page.close();
 }
 const traitPreparation:TraitPreparation[]=[];
 for(const duringCount of [false,true]){
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+address.port+'/__evo_panels__');await page.addStyleTag({path:'dist/framework/official-ui/style.css'});await page.addScriptTag({type:'module',content:"import {startPanels} from '/src/panels/main.ts';window.startPanelFixture=startPanels"});await page.waitForFunction(()=>typeof startPanelFixture==='function');
  traitPreparation.push(await page.evaluate(async duringCount=>{
   document.body.innerHTML='<div id="customOverlay" data-overlay="traits"><div id="customOverlayContent"><div id="traitLists"><section id="group"><h4 class="traitHeading">Traits</h4><div class="trait"><span>Name</span> - <small>Description</small></div></section></div></div></div>';
   let injected=false;const computed=window.getComputedStyle,group=document.querySelector('#group')!;
   window.getComputedStyle=function(node,pseudo){if(duringCount&&!injected&&node.matches('.trait')){injected=true;group.insertAdjacentHTML('beforeend','<div class="trait">Native late trait</div>')}return computed.call(window,node,pseudo)};
   const api=startPanelFixture(window);
   try{for(let i=0;i<4;i++)await new Promise(requestAnimationFrame);const result={duringCount,count:document.querySelector<HTMLElement>('h4')!.dataset.dgpCount,traits:group.querySelectorAll('.trait').length,scans:api.getLifecycleCounts().scans};api.destroy();return{...result,separatorRestored:group.textContent!.includes(' - ')}}finally{api.destroy();window.getComputedStyle=computed}
  },duringCount));await page.close();
 }
 fs.writeFileSync('tests/artifacts/evolution/panel-preparation-'+(preparationBaseline?'baseline':'current')+'.json',JSON.stringify({sourceHead:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),preparationBaseline,records:preparation,traitPreparation},null,2));
 // Keep the new scene evidence within the existing controlled CI report;
 // its six original case identities and coordinate observations are unchanged.
 fs.writeFileSync('tests/artifacts/evolution/panels.json',JSON.stringify(results.map(r=>({...r,...(r.kind==='cheats'?{preparation}:r.kind==='traits'?{traitPreparation}:{})})),null,2));
 for(const r of traitPreparation){assert.equal(r.count,String(r.traits),'native mutation during trait reads must refresh the visible count');assert.equal(r.separatorRestored,true);if(r.duringCount)assert.ok(r.scans>=2);else assert.equal(r.scans,1)}
 for(const r of preparation){
  assert.deepEqual(r.errors,[]);assert.equal(r.initial.mounts,1);assert.equal(r.failures,0);
  for(const key of ['hiddenClickBlocked','hiddenRemoved','restored','renamed','ancestorHidden','ancestorRestored','inlineRefreshed','originalPreserved','bodyReplaced','rootReplaced','stopped'] as const)assert.equal(r[key],true,key);
  if(r.lateNative){assert.ok(r.initial.scans>=2,'late native mutation must trigger a fresh scan');assert.ok(r.initial.labels.includes('Late native'))}
  else assert.equal(r.initial.scans,1,'completed initial indexing must not schedule its own redundant scan');
 }
 console.log('PASS panel preparation: self writes settle once; late native changes, live visibility, inline/body/root replacement and teardown remain observable');
 }finally{await browser?.close();await server.close()}
})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
