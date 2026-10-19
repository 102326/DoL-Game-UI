// Actual settings controller/components in a first-party fixture, without game sources.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {waitSettings,settingsSnapshot}=require('./moody-oracles.cjs');
const {captureFailure}=require('./moody-fixture-evidence.cjs');
(async()=>{
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[vue(),{name:'settings-ci',configureServer(s){s.middlewares.use('/__settings_ci__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html data-stone-free><body><main style="height:2500px"><button id="background">Original background action</button></main><script type="module">import {startTheme} from "/src/theme/controller.ts";startTheme();window.theme=window.DoLMidnightTheme;</script></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 let browser,page;
 try{
  await server.listen();browser=await chromium.launch(require('./browser-options.cjs'));
  const errors=[];page=await browser.newPage({viewport:{width:1363,height:620}});
  page.on('pageerror',e=>errors.push(e.message));
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
  await page.locator('.dmt-close').click();await page.waitForTimeout(450);
  assert.equal(await dialog.evaluate(n=>n.open),false);
  await page.locator('#background').click();assert.equal(await page.evaluate(()=>calls),1);
  await page.evaluate(()=>theme.destroy());
  assert.equal(await page.locator('.dmt-settings-context,.dmt-settings-material,#dol-midnight-controls').count(),0);
  await page.evaluate(async()=>{const {startTheme}=await import('/src/theme/controller.ts');startTheme();window.theme=window.DoLMidnightTheme;theme.openSettings()});
  await page.waitForTimeout(700);
  assert.equal(await page.locator('.dmt-workspace').getAttribute('data-settings-layout'),'horizontal');
  assert.equal(await page.evaluate(()=>theme.getPreferences().comfortable),true,'persisted preference is read on remount');
  await page.evaluate(()=>theme.destroy());assert.deepEqual(errors,[]);
  console.log('PASS real settings controller: dual layouts, long scroll, modal input boundary, keyboard preference, category interruption, persistence and cleanup; controlled browser fixture only');
 }catch(error){try{if(page)await captureFailure(page,{kind:'settings',error,snapshot:await settingsSnapshot(page)})}catch{console.error('Settings fixture evidence unavailable; retaining original failure')}throw error}
 finally{await browser?.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
