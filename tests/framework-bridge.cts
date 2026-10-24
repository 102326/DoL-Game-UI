import playwright = require('playwright');
import esbuild = require('esbuild');
import assert = require('node:assert/strict');
import type {Host,Binding} from '../framework/contracts';
const {chromium}=playwright,{buildSync}=esbuild;
type Failure='none'|'first'|'second'|'off';
type NativeRoot=NonNullable<Parameters<typeof import('../framework/boot').installHost>[0]>;
function installBridgeProbe(){
 const root:NativeRoot=window;
 let handlers:{name:string;fn:()=>void}[]=[],calls=0;
 root.SugarCube={State:{passage:'Start'}};
 const probe={get handlers(){return handlers},publish(fail:Failure){let thrown=false;
  root.jQuery=()=>({on(events,fn){calls++;if(!thrown&&((fail==='first'&&calls===1)||(fail==='second'||fail==='off')&&calls===2)){thrown=true;throw Error('fixture subscription failure')}for(const name of events.split(' '))handlers.push({name,fn})},off(){if(fail==='off')throw Error('fixture unbind failure');handlers=[]}});
 },trigger(name:string){handlers.filter(h=>h.name.split('.')[0]===name).forEach(h=>h.fn())}};
 Object.assign(window,{bridgeProbe:probe});return probe;
}
declare const bridgeProbe:ReturnType<typeof installBridgeProbe>;
declare const DoLUiHost:Host;
declare const host:Host,old:Binding;

const code=buildSync({entryPoints:['framework/boot.ts'],bundle:true,format:'iife',globalName:'Boot',write:false}).outputFiles[0]?.text;if(!code)throw Error('Missing Host bundle');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const fail of ['none','first','second','off'] as const){const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setContent('<div id="passages"><div class="passage" data-passage="Start"><main id="owned"></main></div></div>');await page.evaluate(installBridgeProbe);
  await page.addScriptTag({content:code});assert.equal(await page.evaluate(()=>DoLUiHost.binding().isCurrent()),false,'API-ready without bridge must reject scene operations');
  await page.evaluate(fail=>bridgeProbe.publish(fail),fail);
  if(fail==='off'){await page.waitForFunction(()=>!window.DoLUiHost);assert.equal(await page.evaluate(()=>bridgeProbe.handlers.length),2);await page.evaluate(()=>bridgeProbe.trigger(':passageinit'));assert.deepEqual(errors,[]);await page.close();continue}
  await page.waitForFunction(()=>DoLUiHost.binding().isCurrent());assert.equal(await page.evaluate(()=>bridgeProbe.handlers.length),4);await page.evaluate(()=>{const current=DoLUiHost,owner=current.register('BridgeTest'),parent=document.querySelector('#owned');if(!(parent instanceof HTMLElement))throw Error('Missing mount parent');Object.assign(window,{host:current,old:current.binding()});owner.mount({id:'passage',parent,lifetime:'passage',setup(){}});owner.mount({id:'persistent',parent,lifetime:'persistent',setup(){}});bridgeProbe.trigger(':onloadsave')});assert.deepEqual(await page.evaluate(()=>({old:old.isCurrent(),fresh:host.binding().isCurrent(),ids:host.getDiagnostics().mounts.map(x=>x.id)})),{old:false,fresh:false,ids:['persistent']});await page.evaluate(()=>bridgeProbe.trigger(':passageend'));assert.equal(await page.evaluate(()=>host.binding().isCurrent()),true);await page.evaluate(()=>{host.dispose();bridgeProbe.trigger(':passageinit')});assert.equal(await page.evaluate(()=>bridgeProbe.handlers.length),0);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS Host late jQuery after load, pending scene, subscription rollback/retry, load invalidation, persistent peer and fail-closed disposal');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
