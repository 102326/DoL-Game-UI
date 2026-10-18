const {chromium}=require('playwright'),assert=require('assert/strict'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1363,height:876}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 async function boot(){await p.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);await p.waitForSelector('#listContainer');await p.addStyleTag({path:'dist/framework/official-ui/style.css'});for(const name of ['host','official-ui'])await p.addScriptTag({path:`dist/framework/${name}/index.js`});await p.waitForFunction(()=>!!window.DoLGameUI);await p.evaluate(()=>DoLGameUI.openSettings());await p.waitForTimeout(750)}
 async function layout(value){await p.getByRole('button',{name:value==='vertical'?'左右':'上下',exact:true}).click()}
 async function aligned(){const r=await p.evaluate(()=>{const a=document.querySelector('.dmt-workspace-nav [aria-current]').getBoundingClientRect(),b=document.querySelector('.dmt-orbit-focus').getBoundingClientRect();return[Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height)]});assert.ok(r.every(n=>n<1.5),JSON.stringify(r))}
 await boot();assert.equal(await p.locator('.dmt-workspace').getAttribute('data-settings-layout'),'horizontal');
 await p.getByRole('button',{name:'材质',exact:true}).click();await p.waitForTimeout(700);await p.locator('.dmt-preview-reference button').click();await p.waitForTimeout(600);
 const before=await p.evaluate(()=>{window.keptPreview=document.querySelector('.dmt-preview-reference');window.keptControls=[...document.querySelectorAll('.dmt-workspace-section input')];window.preferenceInputs=0;window.inputCounter=()=>preferenceInputs++;document.querySelector('.dmt-workspace').addEventListener('input',inputCounter);return DoLGameUI.getPreferences()});
 await layout('vertical');assert.equal(await p.locator('.dmt-workspace').getAttribute('data-settings-layout'),'vertical');
 assert.equal(await p.locator('.dmt-workspace-nav').evaluate(n=>n.getAnimations().some(a=>a.playState==='running')),true,'layout is real spatial reorganization');
 await p.waitForTimeout(750);await aligned();
 assert.equal(await p.evaluate(()=>keptPreview===document.querySelector('.dmt-preview-reference')&&keptControls.every(n=>n.isConnected)),true);
 assert.equal(await p.locator('.dmt-preview-reference').getAttribute('data-preview-state'),'focused');assert.equal(await p.locator('.dmt-workspace-section:not([aria-hidden])').count(),1);
 assert.deepEqual(await p.evaluate(()=>DoLGameUI.getPreferences()),before);assert.equal(await p.evaluate(()=>preferenceInputs),0);
 for(let i=0;i<6;i++)await layout(i%2?'vertical':'horizontal');await p.waitForTimeout(750);await aligned();assert.equal(await p.locator('.dmt-preview-reference').count(),1);
 for(const [width,height]of [[390,844],[844,390],[1363,876]]){await p.setViewportSize({width,height});await p.waitForTimeout(750);const r=await p.locator('.dmt-workspace').evaluate(n=>({choice:n.dataset.settingsLayoutChoice,effective:n.dataset.settingsLayout,overflow:n.scrollWidth>n.clientWidth+1}));assert.equal(r.choice,'vertical');if(width===390)assert.equal(r.effective,'horizontal');if(width===1363)assert.equal(r.effective,'vertical');assert.equal(r.overflow,false);await aligned()}
 await p.evaluate(()=>DoLGameUI.setPreference('fontScale',150));await p.waitForTimeout(750);assert.equal(await p.locator('.dmt-workspace').getAttribute('data-settings-layout'),'horizontal');assert.equal(await p.evaluate(()=>localStorage.getItem('DoLGameUI.settingsLayout.v1')),'vertical');await p.evaluate(()=>DoLGameUI.setPreference('fontScale',100));await p.waitForTimeout(750);
 for(const gate of ['reduce','off','master']){
  if(gate==='reduce')await p.emulateMedia({reducedMotion:'reduce'});if(gate==='off')await p.evaluate(()=>DoLGameUI.setPreference('visualMotion',false));if(gate==='master')await p.evaluate(()=>DoLGameUI.setPreference('enabled',false));
  await layout('horizontal');await layout('vertical');await p.waitForTimeout(90);assert.equal(await p.locator('.dmt-workspace').evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0,gate);await aligned();
  await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>{DoLGameUI.setPreference('enabled',true);DoLGameUI.setPreference('visualMotion',true)});
 }
 await p.locator('.dmt-close').click();await p.waitForTimeout(400);await p.evaluate(()=>DoLGameUI.openSettings());await p.waitForTimeout(650);assert.equal(await p.locator('.dmt-workspace').getAttribute('data-settings-layout'),'vertical');
 await p.evaluate(()=>{document.querySelector('.dmt-workspace').removeEventListener('input',inputCounter);DoLGameUI.destroy()});await boot();assert.equal(await p.locator('.dmt-workspace').getAttribute('data-settings-layout'),'vertical','fresh component reads persisted choice');
 assert.equal(await p.evaluate(()=>DoLGameUI.getPreferences().fontScale),100);await p.evaluate(()=>DoLGameUI.destroy());assert.deepEqual(errors,[]);
 console.log('PASS dual layout persistence, unchanged controls/preview/state/API preferences, FLIP, Orbit, rapid changes, narrow/font fallback and reduced/off/master gates');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
