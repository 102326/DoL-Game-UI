// Actual settings controller/components in a first-party fixture, without game sources.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {waitSettings,waitSettingsClosed,settingsSnapshot}=require('./moody-oracles.cjs');
const {captureFailure}=require('./moody-fixture-evidence.cjs');
(async()=>{
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[vue(),{name:'settings-ci',configureServer(s){s.middlewares.use('/__settings_ci__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html data-stone-free><body><main style="height:2500px"><button id="background">Original background action</button></main><script type="module">import {startTheme} from "/src/theme/controller.ts";startTheme();window.theme=window.DoLMidnightTheme;</script></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 let browser,page;
 try{
  await server.listen();browser=await chromium.launch(require('./browser-options.cjs'));
  const errors=[];page=await browser.newPage({viewport:{width:1363,height:620}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const NativeResize=window.ResizeObserver,raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window),frames=new Set(),workspaceObservers=new Set(),late=[];
   window.ResizeObserver=class extends NativeResize{
    constructor(callback){super(callback);this.deliver=()=>callback([],this)}
    observe(node,...rest){if(node.matches('.dmt-workspace')){workspaceObservers.add(this);late.push(this.deliver)}return super.observe(node,...rest)}
    disconnect(){workspaceObservers.delete(this);super.disconnect()}
   };
   window.requestAnimationFrame=callback=>{const id=raf(time=>{frames.delete(id);callback(time)});frames.add(id);return id};window.cancelAnimationFrame=id=>{frames.delete(id);caf(id)};
   window.settingsResources={stats:()=>({frames:frames.size,workspaces:workspaceObservers.size}),deliver:()=>late.forEach(callback=>callback())};
  });
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__settings_ci__');
  await page.waitForFunction(()=>!!window.theme);
  await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
  await page.evaluate(()=>{
   window.calls=0;window.leaked=[];
   document.querySelector('#background').onclick=()=>calls++;
   for(const type of ['click','input','change','pointerdown','pointerup','keydown','keyup'])document.addEventListener(type,e=>{if(e.target.closest('#dol-midnight-controls'))leaked.push(type)});
   theme.openSettings();
  });
  const dialog=page.locator('#dol-midnight-controls');
  await page.waitForTimeout(700);
  assert.equal(await dialog.evaluate(n=>n.matches(':modal')),true);
  for(const label of ['左右','上下']){
   await page.getByRole('button',{name:label,exact:true}).click();
   await page.waitForTimeout(750);
   const workspace=page.locator('.dmt-workspace');
   assert.equal(await workspace.getAttribute('data-settings-layout'),label==='左右'?'vertical':'horizontal');
   await workspace.evaluate(n=>n.scrollTop=0);
   const box=await workspace.boundingBox();
   const y=await page.evaluate(()=>scrollY);
   await page.mouse.move(box.x+box.width*.65,box.y+box.height*.6);
   await page.mouse.wheel(0,900);await page.waitForTimeout(350);
   assert.ok(await workspace.evaluate(n=>n.scrollTop>0),'long settings body scrolls');
   assert.equal(await page.evaluate(()=>scrollY),y,'background must not scroll');
   await workspace.evaluate(n=>n.scrollTop=0);
   const before=await page.evaluate(()=>theme.getPreferences().comfortable);
   await page.getByLabel('舒适阅读间距',{exact:true}).click();
   assert.equal(await page.evaluate(()=>theme.getPreferences().comfortable),!before);
   const slider=page.getByLabel('字体大小',{exact:true});
   await slider.focus();await page.keyboard.press('ArrowRight');
   assert.equal(await page.evaluate(()=>theme.getPreferences().fontScale),105);
   await page.evaluate(()=>theme.setPreference('fontScale',100));
   assert.equal(await page.evaluate(()=>calls),0);
  }
  for(const name of ['材质','入口','阅读']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(80)}
  // CI #78: accept actual completion while rejecting pending or residual sections.
  await waitSettings(page);
  assert.equal(await page.locator('.dmt-workspace-section[inert]').count(),0);
   assert.equal(await page.locator('.dmt-workspace-section').getAttribute('aria-labelledby'),'dmt-reading-heading');
   assert.equal(await page.getByLabel('舒适阅读间距',{exact:true}).isEnabled(),true);
  assert.deepEqual(await page.evaluate(()=>leaked),[],'settings events cannot leak to delegated game handlers');
  // DoL's global zoom changes body CSS zoom, independently of our font preference.
  await page.evaluate(()=>theme.setPreference('fontScale',80));
  for(const viewport of [{width:400,height:821},{width:821,height:400}]){
   await page.setViewportSize(viewport);
   for(const zoom of [.8,1,1.25]){
    await page.evaluate(zoom=>document.body.style.zoom=String(zoom),zoom);
    await page.waitForTimeout(150);
    const geometry=await page.evaluate(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();return {mask:rect('#dol-midnight-controls'),shell:rect('.dmt-settings-shell'),proxies:document.querySelectorAll('.dmt-settings-context,.dmt-settings-material,.dmt-open-material').length}});
    for(const [key,value]of Object.entries({x:0,y:0,width:viewport.width,height:viewport.height}))assert.ok(Math.abs(geometry.mask[key]-value)<1,`global zoom ${zoom}: input shield ${key} must cover viewport`);
    assert.equal(geometry.proxies,0,'accepted real shell must not retain duplicate material layers');
    assert.ok(geometry.shell.x>=0&&geometry.shell.y>=0&&geometry.shell.right<=viewport.width+1&&geometry.shell.bottom<=viewport.height+1,'zoomed shell stays within viewport');
    assert.equal(await page.evaluate(()=>document.elementFromPoint(innerWidth-1,innerHeight/2)===document.querySelector('#dol-midnight-controls')),true,'zoomed shield still receives input at viewport edge');
    const workspace=page.locator('.dmt-workspace');
    await workspace.evaluate(n=>n.scrollTop=n.scrollHeight);
    assert.ok(await workspace.evaluate(n=>n.scrollTop>0),'zoomed long content remains scrollable');
    await workspace.evaluate(n=>n.scrollTop=0);
    const before=await page.evaluate(()=>theme.getPreferences().comfortable);
    await page.getByLabel('舒适阅读间距',{exact:true}).click();
    assert.equal(await page.evaluate(()=>theme.getPreferences().comfortable),!before,'zoomed original setting remains operable');
    assert.equal(await page.evaluate(()=>calls),0);
   }
  }
  await page.evaluate(()=>{document.body.style.removeProperty('zoom');theme.setPreference('fontScale',100)});
  await page.setViewportSize({width:1363,height:620});
  await page.locator('.dmt-close').click();await waitSettingsClosed(page);
  assert.equal(await dialog.evaluate(n=>n.open),false);
  await page.locator('#background').click();assert.equal(await page.evaluate(()=>calls),1);
  await page.evaluate(()=>theme.destroy());
  assert.equal(await page.locator('.dmt-settings-context,.dmt-settings-material,#dol-midnight-controls').count(),0);
  await page.evaluate(async()=>{const {startTheme}=await import('/src/theme/controller.ts');startTheme();window.theme=window.DoLMidnightTheme;theme.openSettings()});
  await page.waitForTimeout(700);
  assert.equal(await page.locator('.dmt-workspace').getAttribute('data-settings-layout'),'horizontal');
  assert.equal(await page.evaluate(()=>theme.getPreferences().comfortable),true,'persisted preference is read on remount');
  const teardown=await page.evaluate(()=>{const mounted=settingsResources.stats();settingsResources.deliver();const queued=settingsResources.stats();theme.destroy();const disposed=settingsResources.stats();settingsResources.deliver();return{mounted,queued,disposed,late:settingsResources.stats()}});
  teardown.integration=await require('./evolution-settings-integration.cjs').verifySettingsIntegration(browser);
  fs.mkdirSync('tests/artifacts/evolution',{recursive:true});fs.writeFileSync('tests/artifacts/evolution/settings-resources.json',JSON.stringify(teardown,null,2));
  assert.equal(teardown.mounted.workspaces,1);assert.ok(teardown.queued.frames>0,'teardown exercises an actually queued workspace measurement');
  assert.deepEqual(teardown.disposed,{frames:0,workspaces:0});assert.deepEqual(teardown.late,teardown.disposed,'late workspace observer cannot schedule work after unmount');assert.deepEqual(errors,[]);
  console.log('PASS real settings controller: dual layouts, long scroll, modal input boundary, keyboard preference, category interruption, persistence and cleanup; controlled browser fixture only');
 }catch(error){try{if(page&&!error.settingsIntegrationEvidence)await captureFailure(page,{kind:'settings',error,snapshot:await settingsSnapshot(page)})}catch{console.error('Settings fixture evidence unavailable; retaining original failure')}throw error}
 finally{await browser?.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
