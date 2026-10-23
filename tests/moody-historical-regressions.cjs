// CI #78/#79 counterexamples use real production components in a controlled first-party fixture.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const {settingsSnapshot,assertSettings,waitSettings,waitSettingsClosed,orbitSnapshot,assertOrbit,waitOrbit}=require('./moody-oracles.cjs');
const root=path.resolve(__dirname,'..');
const combatBody='<div id="story"><div id="passages"><div class="passage"><div id="listContainer"><div id="leftaction"><label><input type="radio" name="leftaction" value="rest" checked>Rest</label><label><input type="radio" name="leftaction" value="guard">Guard</label></div><div id="rightaction"><label><input type="radio" name="rightaction" value="rest" checked>Rest</label><label><input type="radio" name="rightaction" value="guard">Guard</label></div></div><div id="next"><a href="#">Continue</a></div></div></div></div>';
function rejectPrecisely(run,code){let rejection;assert.throws(run,error=>{if(error.code!=='ERR_ASSERTION'||!error.message.startsWith(code+':'))return false;rejection=error;return true});console.log(JSON.stringify({counterexample:code,rejected:true}));return rejection;}
function oldGeometry(){return{name:'moody-ci79-old-positioning',enforce:'pre',transform(source,id){
 if(path.normalize(id.split('?')[0])!==path.join(root,'src/ui/OrbitFocus.vue'))return;
 // Exact pre-e23f631 calculation: a display:contents nav yields 0/0 scales.
 const start=source.indexOf(' // A display:contents navigation'),end=source.indexOf(' await nextTick();',start);
 assert.ok(start>=0&&end>start,'historical transform must match the current production placement block');
 return source.slice(0,start)+` const r=ring.getBoundingClientRect(),n=root.getBoundingClientRect();
 const sx=root.offsetWidth/n.width,sy=root.offsetHeight/n.height;
 const from={left:(r.left-n.left)*sx+root.scrollLeft,top:(r.top-n.top)*sy+root.scrollTop,width:r.width*sx,height:r.height*sy};
 const target=button.getBoundingClientRect();
 Object.assign(bounds,{left:(target.left-n.left)*sx+root.scrollLeft-root.clientLeft,top:(target.top-n.top)*sy+root.scrollTop-root.clientTop,width:target.width*sx,height:target.height*sy,radius:Math.min(target.width*sx/2,target.height*sy/2,parseFloat(getComputedStyle(button).borderTopLeftRadius)||11)});
`+source.slice(end);
 }};}
async function serverFor(mutant=false){
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default,tailwind=(await import('@tailwindcss/vite')).default;
 const server=await createServer({root,configFile:false,plugins:[...(mutant?[oldGeometry()]:[]),vue(),tailwind(),{name:'moody-controlled-fixtures',configureServer(s){s.middlewares.use('/__moody__',(q,r)=>{
 const combat=q.url.includes('combat');r.setHeader('Content-Type','text/html');
 r.end('<!doctype html><html data-stone-free="lab" data-dol-midnight data-dgu-visualmotion><body>'+(combat?combatBody:'<button id="background">Original background action</button>')+'<script type="module">'+(combat?`import {createHost} from '/framework/host.ts';import {startCombat} from '/src/combat/main.ts';const host=createHost(window),owner=host.register('combat-ui');window.fixtureOwner=owner;window.DoLMidnightTheme={getPreferences:()=>({combatFocused:true})};startCombat({host,owner});window.fixtureReady=true;`:`import {startTheme} from '/src/theme/controller.ts';startTheme();window.theme=window.DoLMidnightTheme;window.fixtureReady=true;`)+'</script></body></html>');
 })}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 await server.listen();return server;
}
async function combatPage(browser,server,{missingCSS=false}={}){
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__moody__/combat');
 await page.waitForFunction(()=>window.fixtureReady&&document.querySelector('.dcu-arrangement .dmt-orbit-focus'));
 for(const name of ['kraft-work-surfaces','stone-free','dark-acrylic',...(missingCSS?[]:['settings-workspace'])])await page.addStyleTag({path:path.join(root,'src/theme/'+name+'.css')});
 // Read after the real component's scheduled placement and ResizeObserver delivery.
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));return page;
}
(async()=>{
 const browser=await chromium.launch(require('./browser-options.cjs'));let healthy,mutant,page,kind='settings';
 try{
  healthy=await serverFor();page=await browser.newPage({viewport:{width:1363,height:620}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+healthy.httpServer.address().port+'/__moody__/settings');await page.waitForFunction(()=>window.fixtureReady);
  await page.addStyleTag({path:path.join(root,'dist/framework/official-ui/style.css')});await page.evaluate(()=>theme.openSettings());await page.waitForFunction(()=>document.querySelector('#dol-midnight-controls')?.matches(':modal'));await waitSettings(page);
  await page.evaluate(()=>{
   const animate=Element.prototype.animate;window.moodyAnimations=[];window.moodySlow=true;
   Element.prototype.animate=function(...args){const a=animate.apply(this,args);if(this.matches('.dmt-workspace-section')){if(moodySlow){window.moodyStarted??=performance.now();a.updatePlaybackRate(.5)}const receipt={state:'running'};moodyAnimations.push(receipt);void a.finished.then(()=>receipt.state='finished',()=>receipt.state='cancelled')}return a};
   window.moodyStarted=undefined;
  });
  await page.getByRole('button',{name:'材质',exact:true}).click();
  // Reproduce the historical 700ms sampling point; the acceptance wait itself is condition based.
  await page.waitForFunction(()=>performance.now()-moodyStarted>=700&&document.querySelector('#dol-midnight-controls[data-workspace-transition]'));
  const delayed=await settingsSnapshot(page);assert.throws(()=>assert.equal(delayed.sections.filter(s=>s.inert).length,0),{name:'AssertionError',actual:1,expected:0,operator:'strictEqual'});console.log(JSON.stringify({counterexample:'ci78-premature-inert-sample',rejected:true,inertSections:1}));rejectPrecisely(()=>assertSettings(delayed,'dmt-material-heading'),'MOODY_SETTINGS_PENDING');
  await waitSettings(page,'dmt-material-heading');console.log(JSON.stringify({control:'settings-delayed-completion',passed:true,oldSampleMs:700}));
  await page.evaluate(()=>{moodySlow=false});
  for(const name of ['入口','页面','阅读']){await page.getByRole('button',{name,exact:true}).click();await page.waitForFunction(()=>document.querySelector('#dol-midnight-controls[data-workspace-transition]'))}
  await waitSettings(page);const cancellations=await page.evaluate(()=>moodyAnimations.filter(a=>a.state==='cancelled').length);assert.ok(cancellations>=2,'rapid category switches must exercise real animation cancellations');
  await page.evaluate(()=>{const n=document.createElement('section');n.className='dmt-workspace-section';n.setAttribute('inert','');n.setAttribute('aria-hidden','true');n.dataset.moodyResidual='';document.querySelector('.dmt-workspace-page').append(n)});
  await assert.rejects(()=>waitSettings(page,undefined,{timeout:150}),e=>e.code==='ERR_ASSERTION'&&e.message.startsWith('MOODY_SETTINGS_RESIDUAL:'));
  console.log(JSON.stringify({counterexample:'MOODY_SETTINGS_RESIDUAL',rejected:true}));await page.locator('[data-moody-residual]').evaluate(n=>n.remove());await waitSettings(page);
  // main Run39243023242: 450ms is not a completed-close contract.
  // Normalize the injected slow completion to880ms even when approved production pacing changes.
  await page.evaluate(()=>{
   const animate=Element.prototype.animate;window.moodyCloseMode='slow';
   Element.prototype.animate=function(...args){const a=animate.apply(this,args);if(this.matches('.dmt-settings-shell')&&this.closest('[data-sf-leaving]')){window.moodyCloseStarted=performance.now();if(moodyCloseMode==='slow')a.updatePlaybackRate(Number(a.effect.getTiming().duration)/880);else if(moodyCloseMode==='stuck')a.pause()}return a};
  });
  await page.locator('.dmt-close').click();
  await page.waitForFunction(()=>performance.now()-moodyCloseStarted>=450&&document.querySelector('#dol-midnight-controls')?.open&&document.querySelector('#dol-midnight-controls[data-sf-leaving]'));
  const oldClose=await settingsSnapshot(page);assert.throws(()=>assert.equal(oldClose.dialog.open,false),{name:'AssertionError',actual:true,expected:false,operator:'strictEqual'});
  console.log(JSON.stringify({counterexample:'settings-premature-close-sample',rejected:true,open:oldClose.dialog.open}));
  await waitSettingsClosed(page);console.log(JSON.stringify({control:'settings-delayed-close-completion',passed:true,oldSampleMs:450}));
  await page.evaluate(()=>{moodyCloseMode='stuck';theme.openSettings()});await waitSettings(page);
  // Category readiness does not imply the shell's opening fade has completed.
  // Closing at opacity 0 creates a zero-duration animation, not a paused-close witness.
  await page.waitForFunction(()=>{const shell=document.querySelector('.dmt-settings-shell');return shell&&Number(getComputedStyle(shell).opacity)===1&&!shell.getAnimations().some(a=>a.playState==='running'||a.pending)});
  await page.locator('.dmt-close').click();await page.waitForFunction(()=>document.querySelector('#dol-midnight-controls[data-sf-leaving]'));
  const stuckClose=await settingsSnapshot(page);assert.ok(stuckClose.closeAnimations.some(a=>a.state==='paused'),'controlled close animation must actually be paused');
  await assert.rejects(()=>waitSettingsClosed(page,{timeout:150}),e=>e.code==='ERR_ASSERTION'&&e.message.startsWith('MOODY_SETTINGS_CLOSE_PENDING:'));
  console.log(JSON.stringify({counterexample:'MOODY_SETTINGS_CLOSE_PENDING',rejected:true}));
  await page.evaluate(()=>theme.destroy());assert.equal(await page.locator('#dol-midnight-controls,.dmt-settings-context,.dmt-settings-material').count(),0);assert.deepEqual(errors,[]);await page.close();
  kind='combat';page=await combatPage(browser,healthy);const good=await waitOrbit(page);assert.equal(good.navDisplay,'contents');assert.equal(good.baseIsNav,false);console.log(JSON.stringify({control:'combat-current-positioning-and-production-css',passed:true}));await page.close();
  page=await combatPage(browser,healthy,{missingCSS:true});const missing=await orbitSnapshot(page);rejectPrecisely(()=>assertOrbit(missing),'MOODY_ORBIT_POSITION');await page.close();
  mutant=await serverFor(true);page=await combatPage(browser,mutant);await page.waitForFunction(()=>/NaN|Infinity/.test(document.querySelector('.dcu-arrangement .dmt-orbit-focus svg')?.getAttribute('viewBox')||''));const old=await orbitSnapshot(page);assert.equal(old.navDisplay,'contents');const rejection=rejectPrecisely(()=>assertOrbit(old),'MOODY_ORBIT_NONFINITE');
  try{await require('./moody-fixture-evidence.cjs').captureFailure(page,{kind:'combat',error:rejection,snapshot:{...old,expectedCounterexample:true}})}catch{console.error('Expected counterexample evidence unavailable; precise rejection remains verified')}
  console.log('PASS Moody historical regressions: delayed completion accepted, cancelled final state, true residue rejected, healthy geometry, old positioning and missing production CSS rejected');
 }catch(error){try{if(page&&!page.isClosed()){const snapshot=kind==='settings'?await settingsSnapshot(page):await orbitSnapshot(page);await require('./moody-fixture-evidence.cjs').captureFailure(page,{kind,error,snapshot})}}catch{console.error('Moody fixture evidence unavailable; retaining original failure')}throw error}
 finally{await browser.close();await mutant?.close();await healthy?.close()}
})().catch(error=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(error);process.exitCode=1});
