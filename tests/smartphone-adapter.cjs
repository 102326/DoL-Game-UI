const assert=require('assert/strict'),fs=require('fs'),{chromium}=require('playwright');
(async()=>{
 const {build}=await import('vite');
 const entry='virtual:smartphone-test',bundle=await build({configFile:false,logLevel:'error',plugins:[{name:'entry',resolveId:id=>id===entry?'\0'+entry:undefined,load:id=>id==='\0'+entry?`import {createUiRuntime} from '/src/runtime/ui.ts';window.createRuntime=createUiRuntime`:undefined}],build:{write:false,rollupOptions:{input:entry,output:{format:'iife',inlineDynamicImports:true}}}});
 const script=require('esbuild').buildSync({entryPoints:['compat/smartphone-soft-wet/smartphone-soft-wet.ts'],bundle:true,write:false,format:'iife'}).outputFiles[0].text;
 const browser=await chromium.launch(require('./browser-options.cjs'));
 try{
  const p=await browser.newPage({viewport:{width:390,height:700}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.setContent(`<html data-stone-free data-dol-midnight data-dgu-visualGlass><style>:root{--phone-width-open:300px;--phone-ratio:.6;--phone-scale:1}.phone-main{position:fixed;right:20px;bottom:20px;width:300px;scale:var(--phone-scale);transform-origin:right bottom}.phone-screen-unlocked{display:flex;flex-direction:column}.phone-content{overflow-y:auto}.phone-tool-bar{display:flex}.hidden{display:none}</style><div id="phone-wrapper"><div id="phone-render"><div id="smart-phone-container" class="phone-main phone-open"><div class="phone-screen-locked" hidden></div><div class="phone-screen-unlocked"><div class="phone-status-bar">Status</div><div id="phone-content" class="phone-content"><div class="footer-actions"><input id="new_task_text"><button id="native">Add</button></div><select><option>a</option><option>b</option></select><div class="unknown" hidden>Hidden</div><div style="height:1600px">Long content</div></div><div class="phone-tool-bar"><span id="home">Home</span><span>Lock</span></div></div></div></div></div></html>`);
  for(const f of ['src/theme/dark-acrylic.css','compat/smartphone-soft-wet/smartphone-soft-wet.css'])await p.addStyleTag({path:f});
  await p.addScriptTag({content:bundle.output.find(n=>n.type==='chunk').code});
  await p.evaluate(()=>{window.version='0.3.91';window.modUtils={getMod:()=>({version}),getSemVerTools:()=>({parseVersion:v=>({version:v}),parseRange:r=>r,satisfies:(v,r)=>v.version===r.slice(1)})};window.runtime=createRuntime(window,()=>({}));window.DoLGameUI={ui:runtime.api};window.calls=0;window.native=document.querySelector('#native');window.parentBefore=native.parentNode;native.onclick=()=>calls++;window.input=document.querySelector('input');window.changes=0;input.oninput=()=>changes++});
  await p.evaluate(()=>{window.delayedPhone=document.querySelector('#smart-phone-container');delayedPhone.remove()});
  await p.addScriptTag({content:script});assert.equal(await p.locator('[data-dgu-adapter-match=full]').count(),0);
  await p.evaluate(()=>document.querySelector('#phone-render').append(delayedPhone));await p.waitForFunction(()=>document.querySelector('[data-dgu-adapter-match=full]'));
  await p.locator('#new_task_text').fill('original input');await p.locator('#native').click();await p.locator('select').selectOption('b');
  assert.equal(await p.evaluate(()=>calls===1&&changes>0&&native.parentNode===parentBefore&&input===document.querySelector('input')&&input.value==='original input'),true);
  await p.evaluate(()=>{const d=document.createElement('div');d.id='smartphone_debug';d.innerHTML='<div id="smart-phone-debug-container" style="position:fixed"><div id="smartphone_debug_msg"></div><input id="excute-js"><a id="debug-execute">Execute</a><input id="excute-sugarcube-path"><input id="excute-sugarcube"><h3 class="gold">Native section</h3><div style="height:900px">Long debug content</div></div>';document.querySelector('#phone-wrapper').parentElement.append(d);window.debugInput=d.querySelector('#excute-js');window.debugParent=debugInput.parentNode;window.debugCalls=0;document.querySelector('#debug-execute').onclick=()=>{debugCalls++;document.querySelector('#smartphone_debug_msg').textContent=debugInput.value}});
  await p.waitForFunction(()=>document.querySelector('#smartphone_debug')?.dataset.dguAdapterMatch==='full');
  await p.locator('#excute-js').fill('1 + 1');await p.locator('#debug-execute').click();assert.equal(await p.evaluate(()=>debugCalls===1&&debugInput===document.querySelector('#excute-js')&&debugInput.parentNode===debugParent),true);assert.equal(await p.locator('#smartphone_debug_msg').innerText(),'1 + 1');
  for(const [width,height] of [[320,568],[900,390]]){await p.setViewportSize({width,height});const r=await p.locator('#smart-phone-debug-container').boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1);assert.ok(await p.locator('#smart-phone-debug-container').evaluate(n=>n.scrollHeight>n.clientHeight))}
  await p.evaluate(()=>document.querySelector('#excute-sugarcube-path').remove());await p.waitForFunction(()=>document.querySelector('#smartphone_debug').dataset.dguAdapterMatch!=='full');assert.equal(await p.locator('#excute-js').inputValue(),'1 + 1');
  await p.evaluate(()=>document.querySelector('#smartphone_debug').remove());
  for(const [width,height,scale] of [[390,700,1],[320,568,1.5],[900,390,1],[1363,900,1]]){
   await p.setViewportSize({width,height});await p.evaluate(scale=>document.documentElement.style.setProperty('--phone-scale',scale),scale);
   const r=await p.locator('#smart-phone-container').boundingBox();assert.ok(r.x>=-1&&r.y>=-1&&r.x+r.width<=width+1&&r.y+r.height<=height+1,JSON.stringify({width,height,scale,r}));
   assert.ok(await p.locator('#phone-content').evaluate(n=>n.scrollHeight>n.clientHeight&&n.clientHeight>0));
   assert.ok(await p.locator('#home').evaluate(n=>n.getBoundingClientRect().height>=44));
  }
  assert.equal(await p.locator('.unknown').isVisible(),false);assert.equal(await p.locator('.phone-tool-bar').evaluate(n=>getComputedStyle(n).backdropFilter),'none');
  await p.evaluate(()=>{version='0.3.92';runtime.api.rescan()});assert.equal(await p.locator('[data-dgu-adapter-match=full]').count(),0);
  await p.evaluate(()=>{version='0.3.91';runtime.api.rescan();document.querySelector('.phone-status-bar').remove()});await p.waitForFunction(()=>!document.querySelector('[data-dgu-adapter-match=full]'));
  await p.evaluate(()=>{document.querySelector('.phone-screen-unlocked').insertAdjacentHTML('afterbegin','<div class="phone-status-bar">Status</div>');runtime.api.rescan()});await p.waitForFunction(()=>document.querySelector('[data-dgu-adapter-match=full]'));
  await p.evaluate(()=>{document.documentElement.removeAttribute('data-dol-midnight');runtime.api.rescan()});assert.equal(await p.locator('[data-dgu-adapter-match=full]').count(),0);
  await p.evaluate(()=>{SmartPhoneSoftWet.destroy();runtime.destroy()});assert.equal(await p.locator('[data-dgu-adapter]').count(),0);assert.deepEqual(errors,[]);
  console.log('PASS phone/debug native controls, async discovery, responsive bounds/scroll, independent structure fallback, unknown version, UI-off and cleanup');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
