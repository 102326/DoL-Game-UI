// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import playwright = require('playwright');
import esbuild = require('esbuild');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {Host,Participant,Command,Cleanup,Json,CommandResult} from '../framework/contracts';
declare const TestHost:typeof import('../framework/host');
declare const h:Host,DoLUiHost:Host,a:Participant,uncertain:Participant;
declare let calls:number,nativeClicks:number,command:Command;
declare const releaseAsync:Cleanup,resolveCommand:(value:Json)=>void,finishDisposal:(value:Json)=>void;
declare const original:HTMLButtonElement,originalParent:ParentNode|null,replacement:HTMLButtonElement,foreignModal:HTMLDialogElement;
declare const SugarCube:{UIBar:{isStowed:()=>boolean}},State:{variables:{money:number}};
declare const StoneFree_native_reading:{dispose:Cleanup},StoneFree_alternate_workspace:{dispose:Cleanup},StoneFree_workspace:{dispose:Cleanup},StoneFree_reading_controls:{dispose:Cleanup};
declare const StoneFree_host:typeof import('../framework/boot');
const {chromium}=playwright,{buildSync}=esbuild;
function needCommand(host:Host,schema:string,index=0):Command{const command=host.commands(schema)[index];if(!command)throw Error('Missing command '+schema+':'+index);return command}
function node(id:string):HTMLElement{const n=document.getElementById(id);if(!n)throw Error('Missing '+id);return n}
function witness(result:CommandResult){assert.equal(result.status,'returned');const value=result.value;assert.ok(value&&typeof value==='object'&&!Array.isArray(value));return value}
const root=path.resolve(__dirname,'..'),dir=path.join(root,'tests/artifacts/stone-free-reading','browser-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const bundle=(entry:string)=>buildSync({entryPoints:[path.join(root,entry)],bundle:true,write:false,format:'iife',globalName:'TestHost'}).outputFiles[0]?.text??(()=>{throw Error('No bundle output')})();
const checks:string[]=[],check=async(name:string,fn:()=>Promise<void>)=>{await fn();checks.push(name);console.log('PASS',name)};
(async()=>{
 const browser=await chromium.launch(browserOptions);
 try {
  const p=await browser.newPage({viewport:{width:1100,height:850}}),errors:string[]=[];p.setDefaultTimeout(5000);p.on('pageerror',e=>errors.push(e.message));
  await p.setContent('<div id="ui-bar"><button id="ui-bar-toggle">Native sidebar</button></div><input id="foreign"><main id="passages">Reading position</main>');
  await p.addScriptTag({content:bundle('framework/host.ts')});
  await p.addScriptTag({content:needCommand.toString()+';'+node.toString()});
  await p.evaluate(()=>{Object.assign(window,{h:TestHost.createHost(window)});Object.assign(window,{a:h.register('CommandsA')});Object.assign(window,{calls:0})});
  await check('command declarations validate identity, schema and duplicates',async()=>{
   const n=await p.evaluate(()=>{let rejected=0;for(const spec of [{id:'bad?',schema:'ok',title:'a',run(){return null}},{id:'a',schema:'bad?',title:'a',run(){return null}},{id:'a',schema:'ok',title:'',run(){return null}}])try{a.provideCommand(spec)}catch{rejected++}
    Object.assign(window,{remove:a.provideCommand({id:'action',schema:'example.commands',title:'Action',run(){calls++;return {observed:calls}}})});try{a.provideCommand({id:'action',schema:'example.commands',title:'duplicate',run(){return null}})}catch{rejected++}return rejected});assert.equal(n,4);
  });
  await check('forged and expired bindings never dispatch; sequential intentional actions remain legal',async()=>{
   const r=await p.evaluate(async()=>{Object.assign(window,{command:needCommand(h,'example.commands',0)});const fake=await command.invoke({isCurrent:()=>true,signal:new AbortController().signal,generation:0});const old=h.binding();h.invalidateScene();h.sceneReady();const stale=await command.invoke(old),one=await command.invoke(h.binding()),two=await command.invoke(h.binding());return {fake,stale,one,two,calls}});
   assert.equal(r.fake.status,'stale');assert.equal(r.stale.status,'stale');assert.equal(r.calls,2);assert.equal(witness(r.one).observed,1);assert.equal(witness(r.two).observed,2);
  });
  await check('one in-flight command rejects concurrent dispatch across independently read handles',async()=>{
   const r=await p.evaluate(async()=>{Object.assign(window,{releaseAsync:a.provideCommand({id:'slow',schema:'example.async',title:'Slow',run(){calls++;return new Promise<Json>(resolve=>Object.assign(window,{resolveCommand:resolve}))}})});const left=needCommand(h,'example.async',0),right=needCommand(h,'example.async',0);const first=left.invoke(h.binding()),second=await right.invoke(h.binding());resolveCommand({native:true});return {second,first:await first,calls}});
   assert.equal(r.second.status,'busy');assert.equal(r.first.status,'returned');assert.equal(r.calls,3);
  });
  await check('withdrawal after dispatch is unknown; old handles cannot execute a new declaration',async()=>{
   const r=await p.evaluate(async()=>{const old=needCommand(h,'example.async',0),pending=old.invoke(h.binding());releaseAsync();const missing=await old.invoke(h.binding());a.provideCommand({id:'slow',schema:'example.async',title:'new',run(){calls++;return true}});resolveCommand(true);return {pending:await pending,missing,old:await old.invoke(h.binding()),calls}});
   assert.equal(r.pending.status,'unknown');assert.equal(r.missing.status,'missing');assert.equal(r.old.status,'missing');assert.equal(r.calls,4);
  });
  await check('post-dispatch expiry, handler errors and invalid witnesses remain unknown without replay',async()=>{
   const r=await p.evaluate(async()=>{a.provideCommand({id:'expire',schema:'example.fail',title:'Expire',run(){calls++;h.invalidateScene();return {changed:true}}});const expired=await needCommand(h,'example.fail',0).invoke(h.binding());h.sceneReady();a.provideCommand({id:'throw',schema:'example.fail',title:'Throw',run(){calls++;throw Error('after a possible effect')}});a.provideCommand({id:'invalid',schema:'example.fail',title:'Invalid',run(){calls++;return {value:Infinity}}});return {expired,thrown:await needCommand(h,'example.fail',1).invoke(h.binding()),invalid:await needCommand(h,'example.fail',2).invoke(h.binding()),calls}});
   assert.deepEqual([r.expired.status,r.thrown.status,r.invalid.status],['unknown','unknown','unknown']);assert.equal(r.calls,7);
  });
  await check('Host disposal during an asynchronous invocation returns unknown and clears commands',async()=>{
   const r=await p.evaluate(async()=>{a.provideCommand({id:'dispose',schema:'example.dispose',title:'Dispose',run(){return new Promise<Json>(resolve=>Object.assign(window,{finishDisposal:resolve}))}});const pending=needCommand(h,'example.dispose',0).invoke(h.binding());h.dispose();finishDisposal(true);return {result:await pending,commands:h.getDiagnostics().commands.length,capability:h.getCapabilities().commands}});
   assert.equal(r.result.status,'unknown');assert.equal(r.commands,0);assert.equal(r.capability,false);
  });
  await p.evaluate(()=>{Object.assign(window,{SugarCube:{UIBar:{isStowed:()=>node('ui-bar').classList.contains('stowed')}}});Object.assign(window,{State:{variables:{money:1234}}});Object.assign(window,{nativeClicks:0});const button=node('ui-bar-toggle');if(!(button instanceof HTMLButtonElement))throw Error('Not a button');Object.assign(window,{original:button});Object.assign(window,{originalParent:original.parentNode});original.addEventListener('click',()=>{nativeClicks++;node('ui-bar').classList.toggle('stowed')})});
  for(const name of ['host','native-reading','reading-controls','workspace','alternate-workspace']){
   const base=path.join(root,'dist/framework',name);if(fs.existsSync(path.join(base,'style.css')))await p.addStyleTag({path:path.join(base,'style.css')});await p.addScriptTag({path:path.join(base,'index.js')});
  }
  // This controlled fixture has no SugarCube event bridge; complete its scene explicitly.
  await p.evaluate(()=>{if(DoLUiHost.binding().isCurrent())throw Error('Unbridged Host must stay pending');DoLUiHost.sceneReady()});
  const controls=p.locator('[data-sf-owner="ReadingControls"][data-sf-mount="toolbar"]');
  await check('actual independent consumer invokes the original control once and verifies native state',async()=>{
   await controls.getByRole('button',{name:'切换侧栏',exact:true}).click();await p.waitForFunction(()=>node('ui-bar').classList.contains('stowed'));
   assert.equal(await p.evaluate(()=>nativeClicks),1);await controls.getByRole('button',{name:'切换侧栏',exact:true}).click();
   assert.deepEqual(await p.evaluate(()=>({clicks:nativeClicks,stowed:SugarCube.UIBar.isStowed(),money:State.variables.money,same:original===document.querySelector('#ui-bar-toggle')&&original.parentNode===originalParent})),{clicks:2,stowed:false,money:1234,same:true});
  });
  await check('public reading view inside a modal declines original controls outside the modal',async()=>{
   await p.locator('[data-sf-owner="StoneFreeWorkspace"]').getByRole('button',{name:'信息工作台',exact:true}).click();
   const view=p.locator('[data-view="ReadingControls:reading"]');await view.getByRole('button',{name:'切换侧栏',exact:true}).waitFor();assert.equal(await view.getByRole('button',{name:'切换侧栏',exact:true}).isDisabled(),true);
   const reply=await p.evaluate(()=>needCommand(DoLUiHost,'dol.reading.experimental',0).invoke(DoLUiHost.binding()));assert.equal(reply.status,'returned');assert.equal(witness(reply).applied,false);assert.equal(await p.evaluate(()=>nativeClicks),2);
   await p.locator('[data-sf-owner="StoneFreeWorkspace"] dialog').getByRole('button',{name:'关闭',exact:true}).click();
  });
  await check('side workspace preserves native input and reviewed actions without claiming a modal',async()=>{
   const primary=p.locator('[data-sf-owner="StoneFreeWorkspace"]'),side=p.locator('[data-sf-owner="AlternateWorkspace"]'),panel=side.locator('dialog');
   await primary.getByRole('button',{name:'信息工作台',exact:true}).click();await primary.locator('summary').click();await primary.getByRole('button',{name:'释放工作区',exact:true}).click();
   await side.getByRole('button',{name:'侧边工作台',exact:true}).click();
   assert.equal(await panel.evaluate(n=>n instanceof HTMLDialogElement&&n.open&&!n.matches(':modal')&&n.getAttribute('aria-modal')==='false'),true);
   assert.equal(await p.evaluate(()=>DoLUiHost.getDiagnostics().claims.filter(x=>x.kind==='modal').length),0);
   await p.locator('#foreign').fill('native input remains usable');
   const view=side.locator('[data-view="ReadingControls:reading"]');
   for(let i=3;i<=4;i++){await view.getByRole('button',{name:'切换侧栏',exact:true}).click();assert.equal(await p.evaluate(()=>nativeClicks),i)}
   assert.equal(await p.evaluate(()=>SugarCube.UIBar.isStowed()),false);
   await p.evaluate(()=>{Object.assign(window,{foreignModal:document.createElement('dialog')});foreignModal.textContent='Native modal';document.body.append(foreignModal);foreignModal.showModal()});
   const blocked=await p.evaluate(()=>needCommand(DoLUiHost,'dol.reading.experimental',0).invoke(DoLUiHost.binding()));assert.equal(witness(blocked).applied,false);assert.equal(await p.evaluate(()=>nativeClicks),4);
   await p.evaluate(()=>{foreignModal.close();foreignModal.remove()});
   for(const size of [{width:390,height:844},{width:844,height:390},{width:760,height:800},{width:1280,height:900}]){
    await p.setViewportSize(size);const bounds=await panel.evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,overflow:n.scrollWidth>n.clientWidth}});
    assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=size.width&&bounds.bottom<=size.height&&!bounds.overflow,JSON.stringify({size,bounds}));
    await panel.getByRole('button',{name:'关闭',exact:true}).click();await side.getByRole('button',{name:'侧边工作台',exact:true}).click();
   }
   await p.setViewportSize({width:1100,height:850});await panel.screenshot({path:path.join(dir,'side-workspace.png')});
   await panel.getByRole('button',{name:'关闭',exact:true}).focus();await p.keyboard.press('Escape');assert.equal(await panel.evaluate(n=>n instanceof HTMLDialogElement&&n.open),false);
   await side.getByRole('button',{name:'侧边工作台',exact:true}).click();await p.locator('#foreign').focus();await p.keyboard.press('Escape');assert.equal(await panel.evaluate(n=>n instanceof HTMLDialogElement&&n.open),true);
   await p.evaluate(()=>DoLUiHost.invalidateScene());await p.waitForFunction(()=>{const n=document.querySelector('[data-sf-owner="AlternateWorkspace"] dialog');return n instanceof HTMLDialogElement&&!n.open});await p.evaluate(()=>DoLUiHost.sceneReady());
   assert.equal(await p.locator('#foreign').inputValue(),'native input remains usable');
  });
  await check('disabled or covered native targets decline without bypassing foreign UI',async()=>{
   const r=await p.evaluate(async()=>{const cmd=needCommand(DoLUiHost,'dol.reading.experimental',0);original.disabled=true;const disabled=await cmd.invoke(DoLUiHost.binding());original.disabled=false;const cover=document.createElement('div'),rect=original.getBoundingClientRect();Object.assign(cover.style,{position:'fixed',left:rect.x+'px',top:rect.y+'px',width:rect.width+'px',height:rect.height+'px',zIndex:'999999'});document.body.append(cover);try{return {disabled,covered:await cmd.invoke(DoLUiHost.binding()),clicks:nativeClicks}}finally{cover.remove()}});
   assert.equal(witness(r.disabled).applied,false);assert.equal(witness(r.covered).applied,false);assert.equal(witness(r.covered).reason,'native-control-obscured');assert.equal(r.clicks,4);
  });
  await check('replaced native identity declines without clicking a lookalike or mutating foreign state',async()=>{
   const r=await p.evaluate(async()=>{const copy=original.cloneNode(true);if(!(copy instanceof HTMLButtonElement))throw Error('Not a button clone');Object.assign(window,{replacement:copy});replacement.addEventListener('click',()=>nativeClicks+=100);original.replaceWith(replacement);return needCommand(DoLUiHost,'dol.reading.experimental',0).invoke(DoLUiHost.binding())});
   assert.equal(witness(r).applied,false);assert.equal(witness(r).reason,'unsupported-structure');assert.equal(await p.evaluate(()=>nativeClicks),4);await p.evaluate(()=>replacement.replaceWith(original));
  });
  await check('uncertain consumer result disables its own repeat path; no automatic retry',async()=>{
   await p.evaluate(()=>{StoneFree_native_reading.dispose();Object.assign(window,{uncertain:DoLUiHost.register('Uncertain')});uncertain.provide({id:'sidebar',schema:'dol.reading.experimental',read:()=>({available:true,stowed:false,reason:''})});uncertain.provideCommand({id:'toggle-sidebar',schema:'dol.reading.experimental',title:'test failure',run(){nativeClicks++;throw Error('uncertain')}})});
   await controls.getByRole('button',{name:'切换侧栏',exact:true}).click();await controls.getByText('结果未确认，请用原版入口查看；这里不再重复执行。',{exact:true}).waitFor();assert.equal(await controls.getByRole('button',{name:'切换侧栏',exact:true}).isDisabled(),true);assert.equal(await p.evaluate(()=>nativeClicks),5);
  });
  await check('narrow reading controls fit; explicit package disposal preserves native input and removes own resources',async()=>{
   await p.setViewportSize({width:390,height:844});const surface=controls.locator('.sf-reading');await surface.screenshot({path:path.join(dir,'reading-narrow.png')});assert.equal(await surface.evaluate(n=>n.scrollWidth<=n.clientWidth),true);
   const result=await p.evaluate(()=>{uncertain.dispose();StoneFree_alternate_workspace.dispose();StoneFree_workspace.dispose();StoneFree_reading_controls.dispose();StoneFree_host.dispose();const empty=StoneFree_host.installHost();if(!empty)throw Error('Host did not restart');const participants=empty.host.getDiagnostics().participants.length;empty.dispose();return {participants,owned:document.querySelectorAll('[data-sf-owner]').length,native:original.isConnected,money:State.variables.money}});
   assert.deepEqual(result,{participants:0,owned:0,native:true,money:1234});assert.deepEqual(errors,[]);
  });
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({status:'passed',checks,limits:['Browser fixture, not physical touch or native gameplay','Command returned means provider witness available, not universal business success']},null,2));console.log(dir);
 } finally {await browser.close()}
})().catch(e=>{fs.writeFileSync(path.join(dir,'failure.json'),JSON.stringify({status:'failed',checks,error:e instanceof Error?e.message:String(e)},null,2));receipt.terminalFailure(e);process.exitCode=1});
