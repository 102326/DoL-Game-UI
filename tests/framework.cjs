const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const {buildSync} = require('esbuild');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tests/artifacts/stone-free-foundation', 'browser-' + Date.now());
fs.mkdirSync(output, {recursive:true});
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const bundle = entry => buildSync({entryPoints:[path.join(root, entry)],bundle:true,write:false,format:'iife',globalName:'TestModule'}).outputFiles[0].text;
const host = bundle('framework/host.ts'), sdk = bundle('framework/vue.ts');
const tests = [];
async function check(name, callback) {await callback();tests.push(name);console.log('PASS', name)}
(async () => {
 const browser = await chromium.launch(require('./browser-options.cjs'));
 try {
  const page = await browser.newPage({viewport:{width:1280,height:900}}), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent('<main id="passages"><div id="scene"><input id="native" value="native"><button id="third-party">Other Mod</button><div id="local"></div></div></main>');
  await page.evaluate(() => {
   window.native = document.querySelector('#native');window.nativeParent = native.parentElement;window.nativeNext = native.nextSibling;
   window.nativeClicks = 0;document.querySelector('#third-party').onclick=()=>nativeClicks++;
   window.nativeKeys = 0;document.addEventListener('keydown',()=>nativeKeys++);
   window.observed = [];const Original=MutationObserver;
   window.MutationObserver=class extends Original {observe(node, options){observed.push({subtree:!!options.subtree});super.observe(node,options)}};
  });
  await page.addScriptTag({content:host});
  await page.evaluate(() => {window.host=TestModule.createHost(window);window.a=host.register('AuthorA');window.b=host.register('AuthorB')});
  await check('independent Host does not require UI/theme/game state',async()=>assert.deepEqual(await page.evaluate(()=>({ui:!!window.DoLGameUI,theme:document.documentElement.hasAttribute('data-dol-midnight'),participants:host.getDiagnostics().participants})),{ui:false,theme:false,participants:['AuthorA','AuthorB']}));
  await check('identity and mount contract rejects duplicates and native theft',async()=>assert.deepEqual(await page.evaluate(()=>{
   let n=0;for(const fn of [()=>host.register('AuthorA'),()=>host.register('../invalid'),()=>a.mount({id:'bad',parent:document.createElement('div'),lifetime:'persistent',setup(){}})]){try{fn()}catch{n++}}return n;
  }),3));
  await page.evaluate(()=>{
   window.cleaned=[];window.currentContext=null;
   window.transient=a.mount({id:'transient',parent:document.querySelector('#local'),lifetime:'passage',setup(c){c.onCleanup(()=>cleaned.push('passage'));c.element.textContent='passage'}});
   window.persistent=a.mount({id:'persistent',parent:document.body,lifetime:'persistent',setup(c){currentContext=c;c.onCleanup(()=>cleaned.push('persistent'));c.element.textContent='persistent'}});
   window.oldBinding=currentContext.binding();window.painted=0;currentContext.onScene(()=>painted++);
  });
  await check('passage invalidation disposes transient UI but invalidates persistent business binding',async()=>{
   await page.evaluate(()=>host.invalidateScene());
   assert.deepEqual(await page.evaluate(()=>({transient:transient.isCurrent(),persistent:persistent.isCurrent(),old:oldBinding.isCurrent(),aborted:oldBinding.signal.aborted,pending:host.binding().isCurrent(),cleaned})),{transient:false,persistent:true,old:false,aborted:true,pending:false,cleaned:['passage']});
   await page.evaluate(()=>host.sceneReady());assert.equal(await page.evaluate(()=>painted),1);
  });
  await check('a binding captured during scene preparation never becomes valid later',async()=>{
   await page.evaluate(()=>{host.invalidateScene();window.pendingBinding=host.binding();host.sceneReady()});
   assert.equal(await page.evaluate(()=>pendingBinding.isCurrent()),false);
  });
  await check('local ancestor replacement releases original mount exactly once',async()=>{
   await page.evaluate(()=>{window.localCleanups=0;window.local=a.mount({id:'local',parent:document.querySelector('#local'),lifetime:'persistent',setup(c){c.onCleanup(()=>localCleanups++)}});document.querySelector('#local').remove()});
   await page.waitForFunction(()=>localCleanups===1);assert.equal(await page.evaluate(()=>local.isCurrent()),false);
   await page.evaluate(()=>{local.dispose();local.dispose()});assert.equal(await page.evaluate(()=>localCleanups),1);
   assert.equal(await page.evaluate(()=>observed.some(x=>x.subtree)),false);
  });
  await check('late async setup cannot resurrect a disposed instance and cleans returned resources',async()=>{
   await page.evaluate(()=>{
    window.resolveLate=null;window.lateCleaned=0;
    window.late=a.mount({id:'late',parent:document.body,lifetime:'persistent',setup:c=>new Promise(resolve=>{resolveLate=()=>resolve(()=>lateCleaned++)})});late.dispose();resolveLate();
   });
   await page.evaluate(()=>late.ready);assert.equal(await page.evaluate(()=>lateCleaned),1);assert.equal(await page.locator('[data-sf-mount="late"]').count(),0);
  });
  await check('mount disposal invalidates its own binding without expiring other mounts',async()=>{
   await page.evaluate(()=>{window.ownBinding=currentContext.binding();persistent.dispose()});
   assert.deepEqual(await page.evaluate(()=>[ownBinding.isCurrent(),ownBinding.signal.aborted,host.binding().isCurrent()]),[false,true,true]);
  });
  await check('failed setup and throwing cleanup do not break peers',async()=>{
   await page.evaluate(()=>{
    a.mount({id:'failure',parent:document.body,lifetime:'persistent',setup(c){c.onCleanup(()=>cleaned.push('after-error'));c.onCleanup(()=>{throw Error('private detail')});throw Error('setup')}});
    window.peer=b.mount({id:'healthy',parent:document.body,lifetime:'persistent',setup(c){c.element.textContent='healthy'}});
   });
   assert.equal(await page.evaluate(()=>peer.isCurrent()),true);assert.equal(await page.evaluate(()=>cleaned.includes('after-error')),true);
   assert.equal(await page.evaluate(()=>JSON.stringify(host.getDiagnostics()).includes('private detail')),false);
  });
  await check('unexpected asynchronous cleanup rejection is contained without unhandled page errors',async()=>{
   await page.evaluate(()=>{const m=a.mount({id:'async-cleanup',parent:document.body,lifetime:'persistent',setup(c){c.onCleanup(async()=>{throw Error('owned cleanup failure')})}});m.dispose()});
   await page.waitForTimeout(0);assert.equal(await page.evaluate(()=>host.getDiagnostics().errors.some(x=>x.stage==='mount-cleanup')),true);
  });
  await check('two opt-in participants negotiate region, shortcut and modal; old releases cannot revoke successors',async()=>{
   assert.equal(await page.evaluate(()=>{
    let passed=0;for(const kind of ['region','shortcut','modal']){
     const first=a.claim(kind,'common');if(!first||b.claim(kind,'common')!==null)continue;
     first.release();const second=b.claim(kind,'common');first.release();if(second?.isCurrent()){passed++;second.release()}
    }return passed;
   }),3);
  });
  await check('sources are sampled/copy-frozen; provider deletion and foreign/stale bindings are explicit',async()=>{
   await page.evaluate(()=>{window.data={pain:4,items:[1]};window.unprovide=a.provide({id:'status',schema:'status.v1',read:()=>data});window.source=host.sources('status.v1')[0]});
   const result=await page.evaluate(async()=>{
    const first=await source.read(host.binding());const frozen=Object.isFrozen(first.value)&&Object.isFrozen(first.value.items);data.items.push(2);
    const second=await source.read(host.binding());const stale=host.binding();host.invalidateScene();host.sceneReady();
    const late=await source.read(stale);const foreign=await source.read({signal:new AbortController().signal,generation:0,isCurrent:()=>true});
    unprovide();const missing=await source.read(host.binding());return {first,second,frozen,late,foreign,missing};
   });
   assert.deepEqual(result.first.value,{pain:4,items:[1]});assert.deepEqual(result.second.value.items,[1,2]);assert.equal(result.frozen,true);
   assert.equal(result.late.reason,'stale');assert.equal(result.foreign.reason,'stale');assert.equal(result.missing.reason,'missing');
  });
  await check('async reads recheck provider ownership and scene after await',async()=>{
   await page.evaluate(()=>{window.resolveRead=null;window.removeSlow=a.provide({id:'slow',schema:'slow.v1',read:()=>new Promise(resolve=>resolveRead=resolve)});window.slowSource=host.sources('slow.v1')[0];window.reading=slowSource.read(host.binding());removeSlow();resolveRead(7)});
   assert.equal((await page.evaluate(()=>reading)).reason,'missing');
  });
  await check('invalid or cyclic projections fail locally and the next source remains usable',async()=>{
   await page.evaluate(()=>{window.cyclic={};cyclic.self=cyclic;a.provide({id:'bad',schema:'bad.v1',read:()=>cyclic})});
   assert.equal((await page.evaluate(()=>host.sources('bad.v1')[0].read(host.binding()))).reason,'invalid-value');
  });
  await check('published views create owned instances and withdrawal closes all of them without exiting the provider',async()=>{
   const result=await page.evaluate(()=>{
    const release=a.provideView({id:'shared',title:'Public view',setup(c){c.element.textContent='owned view'}}),view=host.views()[0];
    const first=view.mount({id:'first-view',parent:document.body,lifetime:'persistent'}),second=view.mount({id:'second-view',parent:document.body,lifetime:'persistent'});
    const before=first.isCurrent()&&second.isCurrent();release();release();
    return {before,after:first.isCurrent()||second.isCurrent(),retired:view.mount({id:'old',parent:document.body,lifetime:'persistent'}),provider:host.getDiagnostics().participants.includes('AuthorA'),frozen:Object.isFrozen(view),privateSetup:'setup' in view};
   });assert.deepEqual(result,{before:true,after:false,retired:null,provider:true,frozen:true,privateSetup:false});
  });
  await check('a view withdrawn synchronously during its setup cannot survive the withdrawal',async()=>{
   const result=await page.evaluate(()=>{
    let withdraw;withdraw=a.provideView({id:'reentrant',title:'Reentrant',setup(){withdraw()}});
    return host.views().find(v=>v.id==='reentrant').mount({id:'reentrant-instance',parent:document.body,lifetime:'persistent'});
   });assert.equal(result,null);assert.equal(await page.locator('[data-sf-mount="reentrant-instance"]').count(),0);
  });
  await check('no native DOM/order/listener or input changes',async()=>{
   await page.locator('#third-party').click();await page.locator('#native').fill('native-updated');await page.keyboard.press('k');
   assert.deepEqual(await page.evaluate(()=>({same:native===document.querySelector('#native')&&native.parentElement===nativeParent&&native.nextSibling===nativeNext,value:native.value,clicks:nativeClicks,keys:nativeKeys})),{same:true,value:'native-updatedk',clicks:1,keys:1});
  });
  await page.addScriptTag({content:sdk});
  await check('Vue lazy load disposed before completion never mounts',async()=>{
   await page.evaluate(()=>{window.lazyResolve=null;window.vueMount=TestModule.mountVue(a,{id:'vue-late',parent:document.body,lifetime:'persistent',load:()=>new Promise(resolve=>lazyResolve=resolve)});vueMount.dispose();lazyResolve({template:'<p>late Vue</p>'})});
   await page.evaluate(()=>vueMount.ready);assert.equal(await page.locator('[data-sf-mount="vue-late"]').count(),0);
  });
  await check('real Vue App unmount hooks run once on disposal and render errors stay local',async()=>{
   // Share one runtime in this individual test so composition hooks target the same App.
   await page.addScriptTag({content:buildSync({stdin:{contents:"export {mountVue} from './framework/vue';export {h,onUnmounted} from 'vue';",resolveDir:root},bundle:true,write:false,format:'iife',globalName:'VueTest'}).outputFiles[0].text});
   await page.evaluate(async()=>{
    window.unmounts=0;
    window.vueApp=VueTest.mountVue(a,{id:'vue-live',parent:document.body,lifetime:'persistent',load:()=>({setup(){VueTest.onUnmounted(()=>unmounts++);return ()=>VueTest.h('button','own Vue')}})});
    await vueApp.ready;vueApp.dispose();vueApp.dispose();
    window.failedApp=VueTest.mountVue(a,{id:'vue-error',parent:document.body,lifetime:'persistent',load:()=>({render(){throw Error('own failure')}})});await failedApp.ready;
   });
   assert.equal(await page.evaluate(()=>unmounts),1);assert.equal(await page.locator('[data-sf-mount="vue-error"]').count(),0);assert.equal(await page.evaluate(()=>peer.isCurrent()),true);
  });
  await check('participant exit releases sources, claims and all mounted views idempotently',async()=>{
   await page.evaluate(()=>{a.claim('region','exit');a.dispose();a.dispose()});
   const diagnostic=await page.evaluate(()=>host.getDiagnostics());assert.deepEqual(diagnostic.participants,['AuthorB']);assert.equal(diagnostic.sources.length,0);assert.equal(diagnostic.claims.length,0);
  });
  await page.evaluate(()=>{host.dispose();host.dispose()});assert.equal(await page.locator('[data-sf-owner]').count(),0);
  assert.deepEqual(errors,[]);
  await page.close();

  // Actual packaged IIFEs, no original UI globals or styles. Each consumer includes its own Vue.
  const p=await browser.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(5000);const sampleErrors=[];
  p.on('pageerror',e=>sampleErrors.push(e.message));await p.setContent('<input id="native" aria-label="原版输入"><button id="foreign">第三方</button><main id="passages"></main>');
  await p.evaluate(()=>{window.State={variables:{pain:4,stress:12,tiredness:8}};window.foreignClicks=0;document.querySelector('#foreign').onclick=()=>foreignClicks++});
  for(const name of ['native-status','comparison']){await p.addStyleTag({content:read(`dist/framework/${name}/style.css`)});await p.addScriptTag({content:read(`dist/framework/${name}/index.js`)})}
  await check('consumers loaded before Host wait without altering the page',async()=>assert.equal(await p.locator('[data-sf-owner]').count(),0));
  await p.addScriptTag({content:read('dist/framework/host/index.js')});await p.getByRole('button',{name:'状态速览',exact:true}).waitFor();
  // This static component fixture has no game bridge; explicitly complete its synthetic scene.
  await p.evaluate(()=>{if(DoLUiHost.binding().isCurrent())throw Error('Unbridged bootstrap must stay pending');DoLUiHost.sceneReady()});
  await check('packaged consumers operate independently with copied public data',async()=>{
   assert.equal(await p.evaluate(()=>!!window.DoLGameUI),false);
   await p.getByRole('button',{name:'状态速览',exact:true}).click();assert.equal(await p.locator('dialog[open] dd').first().innerText(),'4');
   await p.keyboard.press('Escape');await p.getByRole('button',{name:'状态对照',exact:true}).click();
   await p.getByRole('button',{name:'设为对照',exact:true}).click();await p.evaluate(()=>State.variables.pain=7);
   await p.getByRole('button',{name:'重新读取',exact:true}).click();await p.waitForFunction(()=>document.querySelector('dialog[open] tbody tr td:last-child')?.textContent==='3');
  });
  await check('modal negotiation and focus restore are scoped to participating surfaces',async()=>{
   await p.evaluate(()=>document.querySelector('[data-sf-owner="NativeStatus"] button').click());assert.equal(await p.locator('dialog[open]').count(),1);
   await p.keyboard.press('Escape');assert.equal(await p.getByRole('button',{name:'状态对照',exact:true}).evaluate(n=>n===document.activeElement),true);
  });
  await check('native input, IME and nonparticipant clicks are negative controls',async()=>{
   await p.locator('#native').fill('原版');await p.keyboard.press('k');assert.equal(await p.locator('dialog[open]').count(),0);await p.locator('#foreign').click();assert.equal(await p.evaluate(()=>foreignClicks),1);
   await p.getByRole('button',{name:'状态速览',exact:true}).focus();
   const composing=await p.evaluate(()=>{const e=new KeyboardEvent('keydown',{key:'k',isComposing:true,bubbles:true,cancelable:true});document.activeElement.dispatchEvent(e);return e.defaultPrevented});assert.equal(composing,false);assert.equal(await p.locator('dialog[open]').count(),0);
   await p.keyboard.press('k');assert.equal(await p.locator('dialog[open]').count(),1);
   await p.getByRole('textbox',{name:'本地备注',exact:true}).fill('不派发');await p.keyboard.press('k');assert.equal(await p.locator('dialog[open]').count(),1);await p.keyboard.press('Escape');
  });
  await check('390px packaged views fit without primary horizontal scroll',async()=>{
   await p.getByRole('button',{name:'状态对照',exact:true}).click();
   assert.equal(await p.locator('dialog[open]').evaluate(n=>n.scrollWidth<=n.clientWidth),true);
   const box=await p.locator('dialog[open]').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390);
   await p.keyboard.press('Escape');
  });
  await check('same-tick close and reopen cannot be closed by an old native close event',async()=>{
   await p.evaluate(()=>{const owner=document.querySelector('[data-sf-owner="StatusComparison"]');owner.querySelector('button').click();owner.querySelector('dialog header button').click();owner.querySelector('button').click()});
   await p.waitForTimeout(30);assert.equal(await p.locator('dialog[open]').count(),1);await p.keyboard.press('Escape');
  });
  await check('public views also work with the existing official Drawer API, without changing providers',async()=>{
   await p.addStyleTag({content:read('dist/framework/soft-wet-surface/style.css')});
   await p.addScriptTag({content:read('dist/framework/soft-wet-surface/index.js')});
   await p.getByRole('button',{name:'Soft & Wet 工作台',exact:true}).click();
   assert.match(await p.locator('[data-sf-owner="SoftWetSurface"] [role=status]').innerText(),/未启用/);
   await p.addStyleTag({content:read('src/runtime/surfaces.css')});await p.addScriptTag({content:bundle('src/runtime/ui.ts')});
   await p.evaluate(()=>{document.documentElement.setAttribute('data-dol-midnight','');window.officialRuntime=TestModule.createUiRuntime(window,()=>({visualTier:1}));window.DoLGameUI={version:'2.7.0',ui:officialRuntime.api}});
   await p.getByRole('button',{name:'Soft & Wet 工作台',exact:true}).click();
   assert.equal(await p.locator('.dgu-surface[open]').count(),1);await p.waitForFunction(()=>document.querySelector('.dgu-surface [data-view="NativeStatus:status"] dd')?.textContent==='7');
   assert.equal(await p.locator('.dgu-surface [data-view]').count(),2);
   assert.equal(await p.locator('.dgu-surface[open]').evaluate(n=>n.scrollWidth<=n.clientWidth),true);
   await p.locator('.dgu-surface[open]').screenshot({path:path.join(output,'official-390.png')});
   await p.keyboard.press('Escape');assert.equal(await p.locator('.dgu-surface[open]').count(),0);
   assert.equal(await p.evaluate(()=>DoLUiHost.getDiagnostics().claims.some(c=>c.kind==='modal')),false);
  });
  await check('official shell composes unknown opt-in content and isolates withdrawal, errors and replacement',async()=>{
   await p.evaluate(()=>{window.author=DoLUiHost.register('IndependentAuthor');window.authorCleaned=0;
    window.withdraw=author.provideView({id:'note',title:'作者便笺',setup(c){const input=document.createElement('input');input.setAttribute('aria-label','作者输入');c.element.append(input);c.onCleanup(()=>authorCleaned++)}});
    window.withdrawBad=author.provideView({id:'broken',title:'局部失败',setup(){throw Error('Local author failure')}})});
   await p.getByRole('button',{name:'Soft & Wet 工作台',exact:true}).click();
   const drawer=p.locator('.dgu-surface[open]');await drawer.getByRole('textbox',{name:'作者输入',exact:true}).fill('作者自己的界面');
   await drawer.getByText('该视图暂不可用。',{exact:false}).waitFor();assert.equal(await drawer.locator('[data-view]').count(),4);
   await p.evaluate(()=>{withdraw();withdrawBad()});await p.waitForFunction(()=>window.authorCleaned===1);assert.equal(await drawer.locator('[data-view]').count(),2);
   await p.evaluate(()=>{window.withdraw=author.provideView({id:'note',title:'重新声明',setup(c){c.element.textContent='新声明内容';c.onCleanup(()=>authorCleaned++)}})});
   await drawer.getByText('新声明内容',{exact:true}).waitFor();await p.keyboard.press('Escape');await p.waitForFunction(()=>window.authorCleaned===2);
   assert.equal(await p.evaluate(()=>DoLUiHost.getDiagnostics().mounts.filter(x=>x.id.startsWith('official-view-')).length),0);
   await p.evaluate(()=>author.dispose());
  });
  await check('scene invalidation and theme disabling close official contributed views and release modal ownership',async()=>{
   await p.getByRole('button',{name:'Soft & Wet 工作台',exact:true}).click();
   await p.evaluate(()=>DoLUiHost.invalidateScene());await p.waitForFunction(()=>document.querySelectorAll('.dgu-surface[open]').length===0);
   assert.equal(await p.evaluate(()=>DoLUiHost.getDiagnostics().claims.some(c=>c.kind==='modal')),false);
   await p.evaluate(()=>DoLUiHost.sceneReady());await p.getByRole('button',{name:'Soft & Wet 工作台',exact:true}).click();
   await p.evaluate(()=>{document.documentElement.removeAttribute('data-dol-midnight');officialRuntime.api.rescan()});
   await p.waitForFunction(()=>document.querySelectorAll('.dgu-surface[open]').length===0);
   assert.equal(await p.evaluate(()=>DoLUiHost.getDiagnostics().claims.some(c=>c.kind==='modal')),false);
   await p.evaluate(()=>document.documentElement.setAttribute('data-dol-midnight',''));
  });
  await check('official Drawer and nonmodal layout mount independent instances; late setup cannot revive closed content',async()=>{
   await p.setViewportSize({width:1280,height:1000});
   await p.addStyleTag({content:read('dist/framework/alternate-workspace/style.css')});await p.addScriptTag({content:read('dist/framework/alternate-workspace/index.js')});
   await p.getByRole('button',{name:'侧边工作台',exact:true}).click();
   const side=p.locator('[data-sf-owner="AlternateWorkspace"] dialog');
   await side.getByRole('button',{name:'设为对照',exact:true}).click();
   await p.getByRole('button',{name:'Soft & Wet 工作台',exact:true}).click();
   const drawer=p.locator('.dgu-surface[open]');assert.equal(await drawer.locator('[data-view="StatusComparison:comparison"] tbody tr td').nth(1).textContent(),'—');
   assert.equal(await side.locator('[data-view="StatusComparison:comparison"] tbody tr td').nth(1).textContent(),'7');
   await p.keyboard.press('Escape');assert.equal(await side.evaluate(n=>n.open),true);
   await side.getByRole('button',{name:'关闭',exact:true}).click();await p.evaluate(()=>StoneFree_alternate_workspace.dispose());
   await p.evaluate(()=>{window.lateAuthor=DoLUiHost.register('LateAuthor');window.lateCleanup=0;lateAuthor.provideView({id:'late',title:'异步作者',setup:()=>new Promise(resolve=>window.resolveAuthor=()=>resolve(()=>lateCleanup++))})});
   await p.getByRole('button',{name:'Soft & Wet 工作台',exact:true}).click();await p.waitForFunction(()=>typeof resolveAuthor==='function');await p.keyboard.press('Escape');
   await p.evaluate(()=>resolveAuthor());await p.waitForFunction(()=>lateCleanup===1);assert.equal(await p.locator('.dgu-surface').count(),0);await p.evaluate(()=>lateAuthor.dispose());await p.setViewportSize({width:390,height:844});
  });
  await check('official shell handles empty views and Surface failures without leaking claims',async()=>{
   await p.evaluate(()=>{StoneFree_native_status.dispose();StoneFree_comparison.dispose()});
   await p.getByRole('button',{name:'Soft & Wet 工作台',exact:true}).click();await p.getByText('暂无公开视图，独立入口仍可使用。',{exact:true}).waitFor();await p.keyboard.press('Escape');
   await p.evaluate(()=>{window.actualUi=DoLGameUI.ui;DoLGameUI.ui={...actualUi,openDrawer(){throw Error('UI unavailable')}}});
   await p.getByRole('button',{name:'Soft & Wet 工作台',exact:true}).click();await p.locator('[data-sf-owner="SoftWetSurface"]').getByText('当前 Surface 不可用。',{exact:true}).waitFor();
   assert.equal(await p.evaluate(()=>DoLUiHost.getDiagnostics().claims.some(c=>c.kind==='modal')),false);
   await p.evaluate(()=>{DoLGameUI.ui={...actualUi,openDrawer(){return null}}});await p.getByRole('button',{name:'Soft & Wet 工作台',exact:true}).click();
   assert.equal(await p.evaluate(()=>DoLUiHost.getDiagnostics().claims.some(c=>c.kind==='modal')),false);await p.evaluate(()=>{DoLGameUI.ui=actualUi});
   for(const name of ['native-status','comparison'])await p.addScriptTag({content:read(`dist/framework/${name}/index.js`)});
  });
  await check('provider absence and an invalid data shape degrade the independent view',async()=>{
   const q=await browser.newPage();q.setDefaultTimeout(5000);await q.setContent('<main></main>');
   await q.addStyleTag({content:read('dist/framework/comparison/style.css')});
   for(const name of ['host','comparison'])await q.addScriptTag({content:read(`dist/framework/${name}/index.js`)});
   await q.evaluate(()=>DoLUiHost.sceneReady());
   await q.getByRole('button',{name:'状态对照',exact:true}).click();
   assert.match(await q.locator('dialog[open] .sf-subtle').first().innerText(),/不可用/);
   await q.evaluate(()=>{window.probe=DoLUiHost.register('AuthorC');probe.provide({id:'bad',schema:'dol.status.experimental',read:()=>null})});
   await q.waitForFunction(()=>document.querySelector('dialog[open] .sf-subtle')?.textContent==='来源不符合状态数据约定');
   await q.evaluate(()=>probe.dispose());
   await q.waitForFunction(()=>document.querySelector('dialog[open] .sf-subtle')?.textContent==='状态提供者当前不可用');
   await q.evaluate(()=>DoLUiHost.dispose());await q.close();
  });
  await check('Host exit cleans consumers and bridge; it can restart without duplicate Apps',async()=>{
   await p.evaluate(()=>DoLUiHost.dispose());assert.equal(await p.locator('[data-sf-owner]').count(),0);assert.equal(await p.evaluate(()=>!!window.DoLUiHost),false);
   await p.addScriptTag({content:read('dist/framework/host/index.js')});await p.getByRole('button',{name:'状态速览',exact:true}).waitFor();assert.equal(await p.locator('[data-sf-owner]').count(),3);
   await p.evaluate(()=>{DoLUiHost.dispose();officialRuntime.destroy()});
  });
  assert.deepEqual(sampleErrors,[]);await p.close();
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({status:'passed',environment:'Headless Chromium / browser fixture, not Android',tests},null,2));console.log('OUTPUT',output);
 } finally {await browser.close()}
})().catch(e=>{fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({status:'failed',tests,error:e.message},null,2));console.error(e);process.exitCode=1});
