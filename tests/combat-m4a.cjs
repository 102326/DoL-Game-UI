const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=process.env.DOL_TEST_OUT||path.join(__dirname,'artifacts/m4a-20261008');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);
 await p.addStyleTag({path:path.join(root,'dist/game-ui.css')});await p.addScriptTag({path:path.join(root,'dist/game-ui.js')});await p.waitForSelector('.dcu-context');
 await p.evaluate(()=>{window.changes=0;document.querySelector('#listContainer').addEventListener('change',()=>changes++)});
 for(const label of ['防御','等待','防御'])await p.locator('#leftaction label').filter({hasText:label}).first().click();
 assert.equal(await p.evaluate(()=>V.leftaction),'guard');assert.equal(await p.evaluate(()=>changes),3);
 await p.waitForFunction(()=>document.querySelector('.dcu-summary-rail').textContent.includes('防御'));
 // Reject a stale semantic binding before the scheduled DOM scan, then accept a fresh binding.
 assert.equal(await p.evaluate(()=>{const input=document.querySelector('#leftaction input');input.value='updated';return input.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))}),false);
 await p.evaluate(()=>DoLCombatUI.refresh());
 assert.equal(await p.evaluate(()=>{const input=document.querySelector('#leftaction input');input.setAttribute('aria-disabled','true');return input.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))}),false);
 await p.evaluate(()=>{const input=document.querySelector('#leftaction input');input.removeAttribute('aria-disabled');input.closest('label').hidden=true;DoLCombatUI.refresh()});
 assert.equal(await p.locator('#leftaction input').first().isVisible(),false);
 // Unknown controls keep their native events and are not treated as radio proxies.
 await p.evaluate(()=>{const block=document.createElement('div');block.id='m4-extra';block.innerHTML='<label><input id="m4-checkbox" type="checkbox">Mod option</label><button id="m4-button">Mod action</button>';document.querySelector('#listContainer').append(block);window.extra=0;block.querySelector('button').onclick=()=>extra++;DoLCombatUI.refresh()});
 await p.locator('#m4-checkbox').check();await p.locator('#m4-button').click();assert.equal(await p.evaluate(()=>extra),1);assert.ok(await p.locator('.dcu-context').innerText().then(t=>t.includes('扩展')));
 // A wide viewport with a narrow container must still use the compact dock.
 await p.evaluate(()=>document.querySelector('.dcu-root').style.width='550px');await p.waitForFunction(()=>document.querySelector('.dcu-root').hasAttribute('data-dcu-narrow'));
 assert.ok(await p.evaluate(()=>{const root=document.querySelector('.dcu-root'),dock=document.querySelector('.dcu-footer').getBoundingClientRect();return root.scrollWidth<=root.clientWidth+2&&dock.width<=552}));
 await p.screenshot({path:path.join(out,'browser-container550.png'),fullPage:true});
 // Sparse groups share wide space; dense groups remain full width.
 await p.evaluate(()=>{const root=document.querySelector('.dcu-root');root.style.width='';for(const group of document.querySelectorAll('#listContainer>div')){for(const label of [...group.querySelectorAll('label')].slice(2))label.remove()}DoLCombatUI.refresh()});
 await p.waitForFunction(()=>getComputedStyle(document.querySelector('#listContainer')).gridTemplateColumns.split(' ').length===2);
 await p.screenshot({path:path.join(out,'browser-sparse-wide.png'),fullPage:true});
 // Original SugarCube handler owns fixture turn progression; no one-time purchase lock.
 await p.evaluate(()=>SugarCube.Engine.play('Arena'));await p.waitForSelector('.dcu-context');
 await p.locator('#next a').click();await p.waitForFunction(()=>V.turn===1);await p.waitForSelector('.dcu-context');
 await p.locator('#next a').click();await p.waitForFunction(()=>V.turn===2);
 // Failure stays native in this page, but a new native page can mount again.
 await p.evaluate(()=>document.querySelector('#leftaction').scrollIntoView=()=>{throw Error('M4 injected interaction failure')});
 await p.locator('.dcu-nav button').first().click();await p.waitForFunction(()=>!DoLCombatUI.getEnabled());assert.ok(await p.locator('#leftaction input').first().isVisible());
 await p.evaluate(()=>SugarCube.Engine.play('Arena'));await p.waitForSelector('.dcu-context');assert.equal(await p.evaluate(()=>DoLCombatUI.getEnabled()),true);
 await p.evaluate(()=>DoLGameUI.destroy());assert.equal(await p.locator('.dcu-root').count(),0);assert.equal(await p.locator('#next').count(),1);assert.equal(await p.locator('#leftaction input').count(),13);assert.deepEqual(errors,[]);
 // Local source reentry only blocks synchronous dispatch, never the next turn.
 const source=require('esbuild').buildSync({stdin:{contents:"import {createCombatSource} from './src/combat/source';window.testSource=createCombatSource",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'iife'}).outputFiles[0].text;
 await p.addScriptTag({content:source});assert.deepEqual(await p.evaluate(async()=>{const s=testSource([document.querySelector('#listContainer')],()=>true);s.read();const next=document.querySelector('#next a');const first=s.beginContinue(next),duplicate=s.beginContinue(next);await Promise.resolve();const later=s.beginContinue(next);s.destroy();return [first,duplicate,later,s.beginContinue(next)]}),[true,false,true,false]);
 fs.writeFileSync(path.join(out,'browser-targeted.json'),JSON.stringify({passed:true,scope:'Original action-generation fixture and native SugarCube selection/fixture turn handlers; not real combat settlement',checks:['repeat selection','semantic binding expiry','hidden/disabled','unknown native controls','container550','sparse grid','two native fixture turns','next-page recovery','cleanup','synchronous reentry']},null,2));
 console.log('PASS M4-A repeated selection, stale/hidden/disabled guard, unknown controls, container/content layout, native fixture turns, recovery, cleanup and reentry.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
