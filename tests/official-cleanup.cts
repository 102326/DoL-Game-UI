// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"checkpoint","caseSource":"caseCheckpoint"}
import cases = require('../scripts/ci-cases.cjs');
const {caseCheckpoint}=cases;
// Actual official entry, fault injection after real cleanup, controlled HTML only.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import cp = require('node:child_process');
import playwright = require('playwright');
import type {Host} from '../framework/contracts';
type Probe={faults:string[];trace:string[];caught:string[][];active:boolean;initFail?:boolean;reenter?:boolean;readyDuring?:boolean};
declare const DoLUiHost:Host,DoLGameUI:{openSettings():void},HcOfficial:{dispose():void};
declare const __hc:Probe;
async function verifyOfficialCleanup(browser:playwright.Browser,{baseline=false}={}){
 const {build}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default,root=path.resolve(__dirname,'..'),file=path.join(root,'framework/official-ui/main.ts');
 let main=baseline?cp.execFileSync('git',['show','cd67fa4:framework/official-ui/main.ts'],{encoding:'utf8'}):fs.readFileSync(file,'utf8');
 const replace=(a:string,b:string)=>{assert.equal(main.split(a).length,2,'exact injection boundary '+a);main=main.replace(a,b)};
 replace('destroyUi=ui.destroy',"destroyUi=__hcWrap('ui',ui.destroy)");
 replace('stopHub=startOfficialHub(host,owner)',"stopHub=__hcWrap('hub',window.__hc.initFail?(()=>{throw Error('controlled init failure')})():startOfficialHub(host,owner))");
 replace("stopMotion=isolate('official motion',()=>startOfficialMotion())","stopMotion=__hcWrap('motion',isolate('official motion',()=>startOfficialMotion()))");
 replace('shelf.dispose()',"__hcWrap('shelf',()=>shelf.dispose())()");replace('owner.dispose()',"__hcWrap('owner',()=>owner.dispose())()");
 main="function __hcWrap(name,task){return()=>{window.__hc.trace.push(name);task?.();if(name==='motion'&&window.__hc.reenter)HcOfficial.dispose();if(name==='motion'&&window.__hc.readyDuring)document.dispatchEvent(new Event('stone-free-host-ready'));if(window.__hc.faults.includes(name))throw Error('controlled '+name+' failure')}}\n"+main;
 const built=await build({root,configFile:false,logLevel:'error',plugins:[vue(),{name:'hc07-real-entry',enforce:'pre',load(id){if(id===file)return main;if(id===path.join(root,'framework/connect.ts')){const source=fs.readFileSync(id,'utf8'),a='} catch {stop(); warn(failure)}';assert.ok(source.includes(a));return source.replace(a,"} catch(error) {const flat=e=>e instanceof AggregateError?e.errors.flatMap(flat):[String(e?.message||e)];window.__hc.caught.push(flat(error));stop();warn(failure)}")}}}],define:{__STONE_FREE_CONSUMER__:true,'process.env.NODE_ENV':JSON.stringify('production'),__VUE_OPTIONS_API__:false,__VUE_PROD_DEVTOOLS__:false,__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:false},build:{write:false,minify:false,target:'es2022',lib:{entry:file,name:'HcOfficial',formats:['iife']}}});
 const output=Array.isArray(built)?built[0]!.output:'output'in built?built.output:undefined;assert.ok(output);const script=output.find(o=>o.type==='chunk'),css=output.find(o=>o.type==='asset'&&o.fileName.endsWith('.css'));assert.ok(script&&script.type==='chunk');
 const rows:unknown[]=[],out=path.resolve('tests/artifacts/ui41/official-cleanup-'+Date.now());fs.mkdirSync(out,{recursive:true});
 for(const config of [{name:'normal',faults:[]},{name:'motion',faults:['motion']},{name:'hub',faults:['hub']},{name:'shelf',faults:['shelf']},{name:'ui',faults:['ui']},{name:'owner',faults:['owner']},{name:'multiple',faults:['motion','ui','owner']},{name:'reentrant-close',faults:['motion'],reenter:true},{name:'ready-during',faults:['motion'],readyDuring:true},{name:'previous',faults:['owner'],previous:'prior'},{name:'foreign-attribute',faults:['motion'],foreign:true},{name:'initialization-and-cleanup',faults:['ui'],initFail:true}]){
  const page=await browser.newPage({viewport:{width:1100,height:850}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.setContent('<!doctype html><html><body><div id="ui-bar"><div id="overlayButtons"></div></div><main id="passages"><div class="passage">Controlled cleanup</div></main><button id="peer-action">Peer action</button></body></html>');
   await page.evaluate(config=>{Object.assign(window,{__hc:{...config,trace:[],caught:[],active:false}});if(typeof config.previous==='string')document.documentElement.setAttribute('data-stone-free',config.previous);},config);
   await page.addScriptTag({path:path.join(root,'dist/framework/host/index.js')});await page.evaluate(()=>{DoLUiHost.register('CleanupPeer');DoLUiHost.sceneReady()});
   if(css&&css.type==='asset')await page.addStyleTag({content:String(css.source)});await page.addScriptTag({content:script.code});
   if(!config.initFail){await page.evaluate(()=>DoLGameUI.openSettings());assert.equal(await page.locator('#dol-midnight-controls').evaluate(n=>n instanceof HTMLDialogElement&&n.open),true)}
   if(config.foreign)await page.evaluate(()=>document.documentElement.setAttribute('data-stone-free','foreign'));
   await page.evaluate(()=>{__hc.active=true;document.dispatchEvent(new Event('stone-free-host-stopped'));document.dispatchEvent(new Event('stone-free-host-stopped'))});
   const state=await page.evaluate(()=>({trace:[...__hc.trace],caught:__hc.caught,global:!!Reflect.get(window,'DoLGameUI'),nodes:document.querySelectorAll('#dol-midnight-controls,#dol-midnight-sidebar-button,[data-spin-hub]').length,participants:DoLUiHost.getDiagnostics().participants,attribute:document.documentElement.getAttribute('data-stone-free')}));
   assert.equal(state.global,false,config.name+' global removed');assert.equal(state.nodes,0,config.name+' owned UI retired');assert.deepEqual(state.participants,['CleanupPeer'],config.name+' peer preserved');
   assert.deepEqual(state.trace,config.initFail?['shelf','ui','owner']:['motion','hub','shelf','ui','owner'],config.name+' original retirement order, exactly once');
   assert.equal(state.attribute,config.foreign?'foreign':config.previous??null,config.name+' attribute ownership');
   if(config.initFail)assert.ok(state.caught.some(v=>v.includes('controlled init failure')&&v.includes('controlled ui failure')),'initial and cleanup errors both retained');
   if(!config.reenter){await page.evaluate(()=>{__hc.faults=[];__hc.initFail=false;__hc.readyDuring=false;document.dispatchEvent(new Event('stone-free-host-ready'))});assert.equal(await page.evaluate(()=>!!Reflect.get(window,'DoLGameUI')),true,config.name+' reconnects');await page.evaluate(()=>HcOfficial.dispose())}
   await page.evaluate(()=>{DoLUiHost.dispose()});assert.deepEqual(errors,[]);rows.push({name:config.name,...state});
  }finally{await page.close()}
 }
 caseCheckpoint('fault-isolation');
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({baseline,rows,scope:'Real official entry; injected faults follow real cleanup. Post-cleanup fault injection; connect catch is instrumented to observe root errors, while production retains its fixed warning. No game/device or failed-stage internal leak guarantee.'},null,2));console.log('PASS official cleanup: '+rows.length+' actual-entry scenarios; '+out);
}
if(require.main===module)(async()=>{const b=await playwright.chromium.launch(require('./browser-options.cjs'));try{await verifyOfficialCleanup(b,{baseline:process.argv.includes('--baseline')})}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

export = {verifyOfficialCleanup};
