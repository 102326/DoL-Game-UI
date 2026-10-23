const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[vue(),{name:'combat-select-fixture',configureServer(s){s.middlewares.use('/__combat_select__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html data-stone-free data-dol-midnight data-dgu-visualMotion data-dgu-visualGlass><body><div id="story"><main id="passages"><div class="passage"><div id="listContainer"><div id="mouthaction"><label><input type="radio" name="mouthaction" checked>Request<div id="askDifficulty"><select id="listbox-askaction" aria-label="Original action"><option value="rest">Rest</option><option value="guard">Guard</option><option value="disabled" disabled>Unavailable</option><optgroup label="Unavailable group" disabled><option value="group">Disabled group action</option></optgroup><option value="target">Different target</option></select></div></label></div><div id="leftaction"><label><input type="radio" name="leftaction" checked>Rest</label></div><div id="extension"><select id="unknown"><option>Third party</option></select></div></div><div id="next"><a href="#">Continue</a></div></div></main></div><button id="outside">Outside</button><script type="module">import {startCombat} from "/src/combat/main.ts";import {createHost} from "/framework/host.ts";window.changes=0;window.inputs=0;window.turns=0;window.original=document.querySelector("#listbox-askaction");window.next=document.querySelector("#next a");original.addEventListener("change",()=>changes++);original.addEventListener("input",()=>inputs++);next.addEventListener("click",e=>{e.preventDefault();turns++});const host=createHost(window),owner=host.register("combat-select");window.fixture={host,owner};window.DoLMidnightTheme={getPreferences:()=>({combatFocused:false})};startCombat({host,owner});</script></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 let browser;
 try{
  await server.listen();browser=await chromium.launch(require('./browser-options.cjs'));
  const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__combat_select__');
  await page.waitForSelector('.dcu-shell');
  const select=page.locator('#listbox-askaction');
  assert.equal(await select.evaluate(n=>getComputedStyle(n).appearance),'base-select');
  assert.equal(await page.locator('#unknown').evaluate(n=>getComputedStyle(n).appearance),'auto','unknown extension remains native');
  assert.equal(await select.evaluate(n=>n.getBoundingClientRect().height<=60&&n.getBoundingClientRect().width>=160),true,'closed control stays one row inside its native inline-flex label');
  const counters=()=>page.evaluate(()=>({changes,inputs,turns}));
  await select.click();await page.getByRole('option',{name:'Guard',exact:true}).click();
  assert.equal(await select.inputValue(),'guard');assert.deepEqual(await counters(),{changes:1,inputs:1,turns:0});
  await select.click();await page.getByRole('option',{name:'Guard',exact:true}).click();
  assert.deepEqual(await counters(),{changes:1,inputs:1,turns:0},'reselecting current option does not manufacture change');
  await select.click();const unavailable=page.getByRole('option',{name:'Unavailable',exact:true});
  // Check native disabled semantics and an actual hit, including the surrounding radio label.
  assert.equal(await unavailable.evaluate(n=>n.matches(':disabled')),true);const disabledBox=await unavailable.boundingBox();await page.mouse.click(disabledBox.x+disabledBox.width/2,disabledBox.y+disabledBox.height/2);assert.equal(await select.inputValue(),'guard');assert.deepEqual(await counters(),{changes:1,inputs:1,turns:0});
  assert.equal(await page.getByRole('option',{name:'Disabled group action',exact:true}).evaluate(n=>n.matches(':disabled')),true);
  await page.keyboard.press('Escape');await select.focus();await page.keyboard.press('Space');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  assert.equal(await select.inputValue(),'target','native keyboard skips disabled options and optgroups');
  assert.deepEqual(await counters(),{changes:2,inputs:2,turns:0});
  for(let i=0;i<3;i++){await select.click();await page.keyboard.press('Escape');assert.equal(await select.evaluate(n=>n.matches(':open')),false)}
  await select.click();await page.locator('#outside').click();assert.equal(await select.evaluate(n=>n.matches(':open')),false);
  assert.deepEqual(await counters(),{changes:2,inputs:2,turns:0});
  await page.evaluate(()=>{for(let i=0;i<18;i++)original.add(new Option('Dynamic '+i,'dynamic-'+i));DoLCombatUI.refresh()});
  await page.setViewportSize({width:390,height:600});await select.scrollIntoViewIfNeeded();await select.click();
  await page.getByRole('option',{name:'Dynamic 17',exact:true}).scrollIntoViewIfNeeded();await page.getByRole('option',{name:'Dynamic 17',exact:true}).click();
  assert.equal(await select.inputValue(),'dynamic-17');assert.deepEqual(await counters(),{changes:3,inputs:3,turns:0});
  await page.emulateMedia({reducedMotion:'reduce'});await select.click();
  assert.equal(await select.evaluate(n=>getComputedStyle(n,'::picker(select)').transitionDuration),'0s');
  await page.keyboard.press('Escape');await page.locator('#next a').click();
  assert.deepEqual(await counters(),{changes:3,inputs:3,turns:1},'only the original Continue dispatches a fixture turn');
  assert.equal(await page.evaluate(()=>original===document.querySelector('#listbox-askaction')&&next===document.querySelector('#next a')),true);
  await select.scrollIntoViewIfNeeded();await select.click();
  await page.evaluate(()=>document.querySelector('.passage').replaceChildren(document.createTextNode('Next passage')));
  await page.waitForFunction(()=>!document.querySelector('.dcu-root'));
  assert.equal(await page.evaluate(()=>original.isConnected||original.matches(':open')),false,'passage removal closes the browser-owned picker');
  await page.evaluate(()=>{DoLCombatUI.destroy();fixture.owner.dispose();fixture.host.dispose()});
  assert.equal(await page.locator('.dcu-footer,.dcu-bottom-reserve').count(),0);assert.deepEqual(errors,[]);
  console.log('PASS original select identity/input/change, no duplicate dispatch, disabled options/groups, native keyboard/Escape/outside, dynamic options, narrow scroll, reduced motion, original Continue and Passage cleanup; controlled fixture only');
 }finally{await browser?.close();await server.close()}
})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
