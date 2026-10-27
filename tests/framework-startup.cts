// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"composed","caseSource":"caseCheckpoint","includes":[{"prefix":"cleanup","source":"tests/official-cleanup.cjs"},{"prefix":"select","source":"tests/owned-select.cjs"}]}
// Real built player entries on controlled HTML. No game/Loader or physical-device claim.
import cases = require('../scripts/ci-cases.cjs');
import assert = require('node:assert/strict');
import http = require('node:http');
import path = require('node:path');
import playwright = require('playwright');
import esbuild = require('esbuild');
import pkg = require('../package.json');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import cleanup = require('./official-cleanup.cjs');
import selects = require('./owned-select.cjs');
import type {Host,MountContext,Cleanup} from '../framework/contracts';
import type {GameUiControls} from '../src/runtime/game-controls';
declare const DoLUiHost:Host;
declare const DoLGameUI:GameUiControls;
declare const StoneFree_host:typeof import('../framework/boot');
declare const StoneFree_official_ui:{dispose:Cleanup};
const {caseCheckpoint}=cases,{chromium}=playwright,version=pkg.version;
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html><body><div id="ui-bar"><div id="overlayButtons"></div></div><main id="passages"><div class="passage" data-passage="Fixture">Controlled startup</div></main></body></html>')});await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 const address=server.address();assert.ok(address&&typeof address!=='string');
 const browser=await chromium.launch(browserOptions);
 try{
  for(const mode of ['missing-any','healthy','disabled','late-host','wrong-host','missing-host','broken-init','host-stopped']){
   const page=await browser.newPage({viewport:{width:1363,height:876}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+address.port);
   await page.evaluate(mode=>{if(mode==='missing-any')Object.defineProperty(AbortSignal,'any',{value:undefined,configurable:true});if(mode==='disabled')localStorage.setItem('DoLMidnightTheme.preferences.v1',JSON.stringify({enabled:false}));if(mode==='wrong-host')Object.assign(window,{DoLUiHost:{protocolVersion:'9',foreign:true}});if(mode==='broken-init')Object.assign(window,{DoLGameUI:{foreign:true}})},mode);
   const host=()=>page.addScriptTag({path:path.join(root,'dist/framework/host/index.js')}),ui=()=>page.addScriptTag({path:path.join(root,'dist/framework/official-ui/index.js')});
   await page.addStyleTag({path:path.join(root,'dist/framework/official-ui/style.css')});
   if(!['late-host','missing-host'].includes(mode))await host();await ui();
   if(['late-host','wrong-host','missing-host','broken-init'].includes(mode)){
    const notice=page.locator('#soft-wet-startup-notice');await notice.waitFor();assert.equal(await notice.getAttribute('role'),'alert');assert.match(await notice.textContent()??'',mode==='wrong-host'?/协议/:mode==='broken-init'?/初始化失败/:/Host/);
    if(mode==='late-host'){await host();await page.waitForFunction(()=>!document.getElementById('soft-wet-startup-notice'))}
    else{await page.getByRole('button',{name:'关闭启动提示',exact:true}).click();assert.equal(await notice.count(),0);await page.evaluate(()=>document.dispatchEvent(new Event('stone-free-host-ready')));assert.equal(await notice.count(),0,'dismissed same reason must stay dismissed');if(mode==='wrong-host')assert.equal(await page.evaluate(()=>Reflect.get(DoLUiHost,'foreign')),true);if(mode==='broken-init')assert.equal(await page.evaluate(()=>Reflect.get(DoLGameUI,'foreign')),true);await page.evaluate(()=>StoneFree_official_ui.dispose());await page.close();caseCheckpoint(mode);continue}
   }
   assert.equal(await page.evaluate(()=>!!window.DoLUiHost),true,mode+': Host must start');
   assert.equal(await page.evaluate(()=>DoLGameUI?.version),version);assert.equal(await page.locator('#dol-midnight-sidebar-button').count(),1);
   await page.evaluate(()=>DoLGameUI.openSettings());assert.equal(await page.locator('#dol-midnight-controls').evaluate(n=>n instanceof HTMLDialogElement&&n.open),true);assert.equal(await page.locator('#soft-wet-startup-notice').count(),0);
   if(mode==='healthy'){
    const picker=page.getByLabel('选项文字对齐',{exact:true});await picker.click();assert.equal(await picker.evaluate(n=>n.matches(':open')),true);
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[aria-label="选项文字对齐"]')?.matches(':open'),null,{timeout:2000});
    assert.equal(await page.locator('#dol-midnight-controls').evaluate(n=>n instanceof HTMLDialogElement&&n.open&&!n.hasAttribute('data-sf-leaving')),true,'picker Escape must not start closing its settings dialog');
    assert.equal(await picker.evaluate(n=>n===document.activeElement),true,'picker returns focus to the native select');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!(document.querySelector('#dol-midnight-controls') instanceof HTMLDialogElement&&document.querySelector<HTMLDialogElement>('#dol-midnight-controls')!.open));
    await page.evaluate(()=>{document.body.insertAdjacentHTML('beforeend','<div id="customOverlay" data-overlay="modloader" data-dgu-adapter="ModHubSoftWet" data-dgu-adapter-match="full"><button class="customOverlayClose">Close fixture</button><select id="overlay-picker" class="modhub-select"><option>First</option><option>Second</option></select></div>');Reflect.set(window,'closeOverlay',()=>{document.getElementById('customOverlay')!.hidden=true;document.body.dataset.pickerCloses='1'})});
    const overlayPicker=page.locator('#overlay-picker');await overlayPicker.click();assert.equal(await overlayPicker.evaluate(n=>n.matches(':open')),true);
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('overlay-picker')?.matches(':open'),null,{timeout:2000});
    assert.equal(await page.locator('#customOverlay').isVisible(),true,'layout capture must let the native overlay picker close first');assert.equal(await page.locator('body').getAttribute('data-picker-closes'),null);
    await page.keyboard.press('Escape');assert.equal(await page.locator('body').getAttribute('data-picker-closes'),'1','second Escape keeps native overlay close dispatch');

   }
   if(mode==='missing-any'){
    assert.equal(await page.evaluate(()=>typeof AbortSignal.any),'undefined','no global polyfill');
    const signals=await page.evaluate(()=>{
     DoLUiHost.sceneReady();const owner=DoLUiHost.register('StartupSignals');let context:MountContext|undefined;const mount=owner.mount({id:'signals',parent:document.body,lifetime:'persistent',setup(c){context=c}});
     const ctx=context;if(!ctx)throw Error('mount setup missing');
     const active=new Set<EventListenerOrEventListenerObject>(),add=ctx.signal.addEventListener.bind(ctx.signal),remove=ctx.signal.removeEventListener.bind(ctx.signal);ctx.signal.addEventListener=(t:string,f:EventListenerOrEventListenerObject,o?:boolean|AddEventListenerOptions)=>{if(t==='abort')active.add(f);return add(t,f,o)};ctx.signal.removeEventListener=(t:string,f:EventListenerOrEventListenerObject,o?:boolean|EventListenerOptions)=>{active.delete(f);return remove(t,f,o)};const a=ctx.binding(),same=ctx.binding();for(let i=0;i<50;i++)ctx.binding();if([...active].length!==1)throw Error('unbounded owner listeners');DoLUiHost.invalidateScene();const sceneAborted=a.signal.aborted;if([...active].length!==0)throw Error('scene abort listeners leaked');DoLUiHost.sceneReady();const b=ctx.binding();mount.dispose();const ownerAborted=b.signal.aborted;if([...active].length!==0)throw Error('mount abort listeners leaked');const already=ctx.binding();owner.dispose();return{same:a.signal===same.signal,sceneAborted,ownerAborted,already:already.signal.aborted,current:a.isCurrent()||b.isCurrent()};
    });assert.deepEqual(signals,{same:true,sceneAborted:true,ownerAborted:true,already:true,current:false});
   }
   if(mode==='host-stopped'){await page.evaluate(()=>DoLUiHost.dispose());await page.locator('#soft-wet-startup-notice').waitFor();assert.match(await page.locator('#soft-wet-startup-notice').textContent()??'',/停止/);await page.evaluate(()=>StoneFree_host.installHost());await page.waitForFunction(()=>!document.getElementById('soft-wet-startup-notice'));assert.equal(await page.evaluate(()=>DoLGameUI.version),version)}
   if(mode==='disabled')assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().enabled),false);
   await page.evaluate(()=>StoneFree_official_ui.dispose());assert.equal(await page.locator('#soft-wet-startup-notice,#dol-midnight-sidebar-button').count(),0);assert.deepEqual(errors,[]);await page.close();caseCheckpoint(mode);
  }
  const bundle=esbuild.buildSync({entryPoints:[path.join(root,'framework/signals.ts')],bundle:true,write:false,format:'cjs'}).outputFiles[0];assert.ok(bundle);const mod:{exports:unknown}={exports:{}};new Function('module','exports',bundle.text)(mod,mod.exports);
  // The emitted bundle is an untyped runtime boundary; validate its export and result.
  const exports=mod.exports;assert.ok(exports&&typeof exports==='object'&&'combineSignals' in exports&&typeof exports.combineSignals==='function');
  const invoke=exports.combineSignals;
  const combineSignals=(signals:readonly AbortSignal[])=>{const result:unknown=invoke(signals);assert.ok(result&&typeof result==='object'&&'signal' in result&&result.signal instanceof AbortSignal&&'dispose' in result&&typeof result.dispose==='function');const dispose=result.dispose;return {signal:result.signal,dispose:()=>dispose()}};
  for(const index of [0,1] as const){const a=new AbortController(),b=new AbortController(),inputs:[AbortController,AbortController]=[a,b],reason={expected:'reason-'+index},counts=new Set<EventListenerOrEventListenerObject>();for(const c of inputs){const add=c.signal.addEventListener.bind(c.signal),remove=c.signal.removeEventListener.bind(c.signal);c.signal.addEventListener=(t:string,f:EventListenerOrEventListenerObject,o?:boolean|AddEventListenerOptions)=>{counts.add(f);return add(t,f,o)};c.signal.removeEventListener=(t:string,f:EventListenerOrEventListenerObject,o?:boolean|EventListenerOptions)=>{counts.delete(f);return remove(t,f,o)}}const combined=combineSignals(inputs.map(c=>c.signal));assert.equal(counts.size,2);inputs[index].abort(reason);assert.equal(combined.signal.reason,reason);assert.equal(counts.size,0);combined.dispose();assert.equal(inputs[index===0?1:0].signal.aborted,false)}
  const first=new AbortController(),second=new AbortController();first.abort('first');second.abort('second');assert.equal(combineSignals([first.signal,second.signal]).signal.reason,'first');const a=new AbortController(),b=new AbortController(),disposed=combineSignals([a.signal,b.signal]);disposed.dispose();a.abort('ignored');assert.equal(disposed.signal.aborted,false);
  caseCheckpoint('signal-composition');
  await cases.withCaseScope('cleanup',()=>cleanup.verifyOfficialCleanup(browser));
  await cases.withCaseScope('select',()=>selects.verifyOwnedSelect(browser));
  console.log('PASS built player startup: missing any without global polyfill, owner/scene cancellation, saved opt-out, late Host, visible/dismissible diagnosis and cleanup; controlled fixture only');
 }finally{await browser.close();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))}
})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
