const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),variant=path.join(root,'dist/framework-vue-comparison');
const out=path.join(root,'tests/artifacts/stone-free-vue','browser-'+Date.now());fs.mkdirSync(out,{recursive:true});
const checks=[],read=p=>fs.readFileSync(p,'utf8'),check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS',name)};
const consumers=['native-status','comparison','workspace','reading-controls'];
const runtime=read(path.join(variant,'runtime/index.js'));
const add=async(p,name,shared)=>{
 const base=path.join(shared?variant:path.join(root,'dist/framework'),name);
 if(fs.existsSync(path.join(base,'style.css')))await p.addStyleTag({path:path.join(base,'style.css')});
 await p.addScriptTag({path:path.join(base,'index.js')});
};
async function fixture(browser){
 const p=await browser.newPage({viewport:{width:1100,height:850}});p.setDefaultTimeout(5000);
 await p.route('http://vue.test/',r=>r.fulfill({contentType:'text/html',body:'<div id="ui-bar"><button id="ui-bar-toggle">Native sidebar</button></div><input id="foreign"><main id="passages">Original reading</main>'}));await p.goto('http://vue.test/');
 await p.evaluate(()=>{window.State={variables:{pain:4,stress:12,tiredness:8}};window.nativeClicks=0;window.SugarCube={UIBar:{isStowed:()=>document.querySelector('#ui-bar').classList.contains('stowed')}};document.querySelector('#ui-bar-toggle').onclick=()=>{nativeClicks++;document.querySelector('#ui-bar').classList.toggle('stowed')};window.pageErrors=[];window.addEventListener('error',e=>pageErrors.push(e.message))});
 await add(p,'host',false);await add(p,'native-reading',false);return p;
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const observations={};
  for(const shared of [false,true])await check(`${shared?'shared':'standalone'} consumer sources complete the same scoped reading task`,async()=>{
   const p=await fixture(browser);if(shared)await p.addScriptTag({content:runtime});for(const name of consumers)await add(p,name,shared);
   await p.getByRole('button',{name:'状态对照',exact:true}).click();await p.getByRole('button',{name:'设为对照',exact:true}).click();await p.evaluate(()=>State.variables.pain=8);
   await p.getByRole('button',{name:'重新读取',exact:true}).click();await p.waitForFunction(()=>document.querySelector('[data-sf-owner="StatusComparison"] tbody tr td:last-child')?.textContent==='4');
   await p.locator('[data-sf-owner="StatusComparison"] dialog header button').click();
   const entry=p.locator('[data-sf-owner="StoneFreeWorkspace"]');await entry.getByRole('button',{name:'信息工作台',exact:true}).click();
   const dialog=entry.locator('dialog');await dialog.locator('article').nth(2).waitFor();await dialog.getByRole('button',{name:'设为对照',exact:true}).click();await p.evaluate(()=>State.variables.pain=11);
   await dialog.getByRole('button',{name:'刷新对照',exact:true}).click();await p.waitForFunction(()=>document.querySelector('[data-view="StatusComparison:comparison"] tbody tr td:last-child')?.textContent==='3');
   assert.equal(await dialog.locator('[data-view="ReadingControls:reading"] button').first().isDisabled(),true);
   await dialog.getByRole('button',{name:'关闭',exact:true}).click();
   const controls=p.locator('[data-sf-owner="ReadingControls"][data-sf-mount="toolbar"]');await controls.getByRole('button',{name:'刷新',exact:true}).click();
   await controls.getByRole('button',{name:'切换侧栏',exact:true}).click();await p.waitForFunction(()=>SugarCube.UIBar.isStowed());await controls.getByRole('button',{name:'切换侧栏',exact:true}).click();await p.waitForFunction(()=>!SugarCube.UIBar.isStowed());
   observations[shared?'shared':'standalone']=await p.evaluate(async()=>({value:(await DoLUiHost.sources('dol.status.experimental')[0].read(DoLUiHost.binding())).value,clicks:nativeClicks,stowed:SugarCube.UIBar.isStowed(),participants:DoLUiHost.getDiagnostics().participants,views:DoLUiHost.getDiagnostics().views,errors:pageErrors}));
   if(shared){
    await check('shared Vue still gives each owned App local failure and teardown',async()=>{
     await add(p,'sdk-probe',true);
     const result=await p.evaluate(async()=>{const before=DoLUiHost.getDiagnostics().mounts.length,owner=DoLUiHost.register('FailingVueApp'),v=StoneFreeVueExperimental.vue;let unmounted=0;
      const handle=StoneFree_sdk_probe.mountVue(owner,{id:'failure',parent:document.body,lifetime:'persistent',load:()=>({setup(){v.onUnmounted(()=>unmounted++);return()=>{throw Error('own render failure')}}})});await handle.ready;
      owner.dispose();return {before,after:DoLUiHost.getDiagnostics().mounts.length,unmounted,reading:!!document.querySelector('[data-sf-owner="ReadingControls"] button')}});
     assert.equal(result.before,result.after);assert.equal(result.reading,true);assert.equal(result.unmounted,1);await controls.getByRole('button',{name:'刷新',exact:true}).click();
    });
    await check('withdrawing one shared consumer leaves other Apps and native controls alive',async()=>{
     await p.evaluate(()=>StoneFree_native_status.dispose());assert.equal(await p.locator('[data-sf-owner="NativeStatus"]').count(),0);assert.equal(await controls.count(),1);await p.getByRole('button',{name:'状态对照',exact:true}).click();await p.getByText('状态提供者当前不可用',{exact:true}).waitFor();await p.locator('[data-sf-owner="StatusComparison"] dialog header button').click();
    });
    await check('removing the runtime namespace does not pretend to unload captured Apps',async()=>{
     await p.evaluate(()=>StoneFreeSharedVuePackage.dispose());assert.equal(await p.evaluate(()=>!!window.StoneFreeVueExperimental),false);await controls.getByRole('button',{name:'切换侧栏',exact:true}).click();await p.waitForFunction(()=>SugarCube.UIBar.isStowed());await controls.getByRole('button',{name:'切换侧栏',exact:true}).click();await p.waitForFunction(()=>!SugarCube.UIBar.isStowed());
    });
   }
   for(const name of ['reading_controls','workspace','comparison','native_status','native_reading'])await p.evaluate(name=>window['StoneFree_'+name].dispose(),name);
   await p.evaluate(()=>StoneFree_host.dispose());assert.equal(await p.locator('[data-sf-owner]').count(),0);assert.equal(await p.locator('#ui-bar-toggle').count(),1);await p.close();
  });
  await check('source-identical variants have equal observed task outcomes',async()=>assert.deepEqual(observations.shared,observations.standalone));
  await check('missing shared runtime never falls back to foreign Vue or installs a partial consumer',async()=>{
   const p=await fixture(browser);await p.evaluate(()=>{window.foreignVueCalls=0;window.Vue={createApp(){foreignVueCalls++}}});for(const name of consumers)await add(p,name,true);
   assert.deepEqual(await p.evaluate(()=>({foreign:foreignVueCalls,participants:DoLUiHost.getDiagnostics().participants,status:StoneFree_native_status.status,errors:pageErrors})),{foreign:0,participants:['NativeReading'],status:'runtime-unavailable',errors:[]});
   await p.addScriptTag({content:runtime});assert.equal(await p.evaluate(()=>DoLUiHost.getDiagnostics().participants.includes('NativeStatus')),false);
   await add(p,'native-status',true);await p.getByRole('button',{name:'状态速览',exact:true}).waitFor();await p.evaluate(()=>{StoneFree_native_status.dispose();StoneFree_native_reading.dispose();StoneFree_host.dispose();StoneFreeSharedVuePackage.dispose()});await p.close();
  });
  await check('wrong version or missing exports refuses the consumer and preserves external namespaces',async()=>{
   const p=await fixture(browser),version=JSON.parse(read(path.join(variant,'inputs.json'))).vueVersion;
   for(const candidate of [{protocol:'0.1-experimental',version:'0.0-incompatible',vue:{}},{protocol:'0.1-experimental',version,vue:{}}]){
    await p.evaluate(candidate=>window.StoneFreeVueExperimental=candidate,candidate);await p.addScriptTag({content:runtime});assert.equal(await p.evaluate(()=>StoneFreeSharedVuePackage.installSharedVue()),null);
    await add(p,'comparison',true);assert.equal(await p.evaluate(()=>StoneFree_comparison.status),'runtime-unavailable');await p.evaluate(()=>StoneFreeSharedVuePackage.dispose());assert.equal(await p.evaluate(()=>!!window.StoneFreeVueExperimental),true);await p.evaluate(()=>delete window.StoneFreeVueExperimental);
   }
   await p.addScriptTag({content:runtime});await p.evaluate(()=>{window.foreign={marker:true};Object.defineProperty(window,'StoneFreeVueExperimental',{value:foreign,configurable:true});StoneFreeSharedVuePackage.dispose()});assert.equal(await p.evaluate(()=>StoneFreeVueExperimental===foreign),true);await p.close();
  });
  await check('a broken dependency accessor cannot crash Host or other consumers',async()=>{
   const p=await fixture(browser);await p.evaluate(()=>Object.defineProperty(window,'StoneFreeVueExperimental',{get(){throw Error('external accessor failed')},configurable:true}));
   await p.addScriptTag({content:runtime});await add(p,'native-status',true);assert.deepEqual(await p.evaluate(()=>({status:StoneFree_native_status.status,participants:DoLUiHost.getDiagnostics().participants,errors:pageErrors})),{status:'runtime-unavailable',participants:['NativeReading'],errors:[]});
   await p.evaluate(()=>{StoneFreeSharedVuePackage.dispose();delete window.StoneFreeVueExperimental;StoneFree_native_reading.dispose();StoneFree_host.dispose()});await p.close();
  });
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'passed',checks,observations,comparison:JSON.parse(read(path.join(variant,'comparison.json'))),limits:['Headless Edge fixture only; no Android, native gameplay, startup or memory claim']},null,2));console.log(out);
 }finally{await browser.close()}
})().catch(e=>{fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({status:'failed',checks,error:e.message},null,2));console.error(e);process.exitCode=1});
