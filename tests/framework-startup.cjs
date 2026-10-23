// Real built player entries on controlled HTML. No game/Loader or physical-device claim.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright'),version=require('../package.json').version;
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html><body><div id="ui-bar"><div id="overlayButtons"></div></div><main id="passages"><div class="passage" data-passage="Fixture">Controlled startup</div></main></body></html>')});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch(require('./browser-options.cjs'));
 try{
  for(const mode of ['missing-any','healthy','disabled','late-host','wrong-host','missing-host','broken-init','host-stopped']){
   const page=await browser.newPage({viewport:{width:1363,height:876}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
   await page.evaluate(mode=>{if(mode==='missing-any')Object.defineProperty(AbortSignal,'any',{value:undefined,configurable:true});if(mode==='disabled')localStorage.setItem('DoLMidnightTheme.preferences.v1',JSON.stringify({enabled:false}));if(mode==='wrong-host')window.DoLUiHost={protocolVersion:'9',foreign:true};if(mode==='broken-init')window.DoLGameUI={foreign:true}},mode);
   const host=()=>page.addScriptTag({path:path.join(root,'dist/framework/host/index.js')}),ui=()=>page.addScriptTag({path:path.join(root,'dist/framework/official-ui/index.js')});
   await page.addStyleTag({path:path.join(root,'dist/framework/official-ui/style.css')});
   if(!['late-host','missing-host'].includes(mode))await host();await ui();
   if(['late-host','wrong-host','missing-host','broken-init'].includes(mode)){
    const notice=page.locator('#soft-wet-startup-notice');await notice.waitFor();assert.equal(await notice.getAttribute('role'),'alert');assert.match(await notice.textContent(),mode==='wrong-host'?/协议/:mode==='broken-init'?/初始化失败/:/Host/);
    if(mode==='late-host'){await host();await page.waitForFunction(()=>!document.getElementById('soft-wet-startup-notice'))}
    else{await page.getByRole('button',{name:'关闭启动提示',exact:true}).click();assert.equal(await notice.count(),0);await page.evaluate(()=>document.dispatchEvent(new Event('stone-free-host-ready')));assert.equal(await notice.count(),0,'dismissed same reason must stay dismissed');if(mode==='wrong-host')assert.equal(await page.evaluate(()=>DoLUiHost.foreign),true);if(mode==='broken-init')assert.equal(await page.evaluate(()=>DoLGameUI.foreign),true);await page.evaluate(()=>StoneFree_official_ui.dispose());await page.close();continue}
   }
   assert.equal(await page.evaluate(()=>!!window.DoLUiHost),true,mode+': Host must start');
   assert.equal(await page.evaluate(()=>window.DoLGameUI?.version),version);assert.equal(await page.locator('#dol-midnight-sidebar-button').count(),1);
   await page.evaluate(()=>DoLGameUI.openSettings());assert.equal(await page.locator('#dol-midnight-controls').evaluate(n=>n.open),true);assert.equal(await page.locator('#soft-wet-startup-notice').count(),0);
   if(mode==='missing-any'){
    assert.equal(await page.evaluate(()=>typeof AbortSignal.any),'undefined','no global polyfill');
    const signals=await page.evaluate(()=>{
     DoLUiHost.sceneReady();const owner=DoLUiHost.register('StartupSignals');let ctx;const mount=owner.mount({id:'signals',parent:document.body,lifetime:'persistent',setup(c){ctx=c}});
     const active=new Set(),add=ctx.signal.addEventListener.bind(ctx.signal),remove=ctx.signal.removeEventListener.bind(ctx.signal);ctx.signal.addEventListener=(t,f,o)=>{if(t==='abort')active.add(f);return add(t,f,o)};ctx.signal.removeEventListener=(t,f,o)=>{active.delete(f);return remove(t,f,o)};const a=ctx.binding(),same=ctx.binding();for(let i=0;i<50;i++)ctx.binding();if(active.size!==1)throw Error('unbounded owner listeners');DoLUiHost.invalidateScene();const sceneAborted=a.signal.aborted;if(active.size!==0)throw Error('scene abort listeners leaked');DoLUiHost.sceneReady();const b=ctx.binding();mount.dispose();const ownerAborted=b.signal.aborted;if(active.size!==0)throw Error('mount abort listeners leaked');const already=ctx.binding();owner.dispose();return{same:a.signal===same.signal,sceneAborted,ownerAborted,already:already.signal.aborted,current:a.isCurrent()||b.isCurrent()};
    });assert.deepEqual(signals,{same:true,sceneAborted:true,ownerAborted:true,already:true,current:false});
   }
   if(mode==='host-stopped'){await page.evaluate(()=>DoLUiHost.dispose());await page.locator('#soft-wet-startup-notice').waitFor();assert.match(await page.locator('#soft-wet-startup-notice').textContent(),/停止/);await page.evaluate(()=>StoneFree_host.installHost());await page.waitForFunction(()=>!document.getElementById('soft-wet-startup-notice'));assert.equal(await page.evaluate(()=>DoLGameUI.version),version)}
   if(mode==='disabled')assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().enabled),false);
   await page.evaluate(()=>StoneFree_official_ui.dispose());assert.equal(await page.locator('#soft-wet-startup-notice,#dol-midnight-sidebar-button').count(),0);assert.deepEqual(errors,[]);await page.close();
  }
  const bundle=require('esbuild').buildSync({entryPoints:[path.join(root,'framework/signals.ts')],bundle:true,write:false,format:'cjs'}).outputFiles[0].text,mod={exports:{}};new Function('module','exports',bundle)(mod,mod.exports);
  for(const index of [0,1]){const a=new AbortController(),b=new AbortController(),inputs=[a,b],reason={expected:'reason-'+index},counts=new Set();for(const c of inputs){const add=c.signal.addEventListener.bind(c.signal),remove=c.signal.removeEventListener.bind(c.signal);c.signal.addEventListener=(t,f,o)=>{counts.add(f);return add(t,f,o)};c.signal.removeEventListener=(t,f,o)=>{counts.delete(f);return remove(t,f,o)}}const combined=mod.exports.combineSignals(inputs.map(c=>c.signal));assert.equal(counts.size,2);inputs[index].abort(reason);assert.equal(combined.signal.reason,reason);assert.equal(counts.size,0);combined.dispose();assert.equal(inputs[1-index].signal.aborted,false)}
  const first=new AbortController(),second=new AbortController();first.abort('first');second.abort('second');assert.equal(mod.exports.combineSignals([first.signal,second.signal]).signal.reason,'first');const a=new AbortController(),b=new AbortController(),disposed=mod.exports.combineSignals([a.signal,b.signal]);disposed.dispose();a.abort('ignored');assert.equal(disposed.signal.aborted,false);
  console.log('PASS built player startup: missing any without global polyfill, owner/scene cancellation, saved opt-out, late Host, visible/dismissible diagnosis and cleanup; controlled fixture only');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
