const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1704,height:1136}});const errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});
 await p.waitForLoadState('networkidle');
 console.log('BOOT',await p.evaluate(()=>({passage:SugarCube.State.passage,keys:Object.keys(V).length,worn:!!V.worn,renderer:!!window.Renderer,skin:!!window.Skin})));
 await p.evaluate(()=>{SugarCube.Engine.play('Start2')});
 await p.waitForLoadState('networkidle');
 console.log('START2',await p.evaluate(()=>({passage:SugarCube.State.passage,worn:!!V.worn,wardrobe:!!V.wardrobe,errors:[...document.querySelectorAll('.error')].map(e=>e.textContent.slice(0,180))})));


 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 async function open(key){await p.evaluate(key=>{if(!document.querySelector('#customOverlay').classList.contains('hidden'))closeOverlay();new SugarCube.Wikifier(null,`<<overlayReplace "${key}">>`)},key)}
 for(const [key,kind] of [['options','settings'],['cheats','cheats'],['journal','journal'],['traits','traits'],['statistics','statistics'],['gameFeats','feats']]){
  await p.evaluate(kind=>DoLPanelsUI.setEnabled(kind,false),kind);await open(key);
  await p.evaluate(()=>{window.nativeBody=document.querySelector('#customOverlayContent');window.nativeHTML=nativeBody.innerHTML;window.nativeNodes=[...nativeBody.querySelectorAll('*')];window.nativeV=JSON.stringify(V)});
  await p.evaluate(kind=>DoLPanelsUI.setEnabled(kind,true),kind);await p.waitForSelector('.dgp-navigation');
  assert.equal(await p.evaluate(()=>nativeBody.innerHTML===nativeHTML),true,`${kind}: content preserved`);
  assert.equal(await p.evaluate(()=>JSON.stringify(V)===nativeV),true,`${kind}: no state writes`);
  assert.equal(await p.evaluate(()=>nativeNodes.every(n=>n.isConnected)),true);
  const select=p.getByLabel('跳到分组',{exact:true});const size=await select.locator('option').count();assert.ok(size>1);
  await select.selectOption(String(size-2));await p.getByRole('button',{name:'回到顶部',exact:true}).click();
  assert.equal(await p.locator('#customOverlayContent').evaluate(e=>e.scrollTop),0);
  for(const [name,width,height] of [['tablet',1704,1136],['phone',390,844]]){
   await p.setViewportSize({width,height});
   await p.screenshot({path:path.join(__dirname,`artifacts/panels-${kind}-${process.env.DOL_WARDROBE_INTEGRATED?'lyra':'vanilla'}-${name}.png`)});
   assert.equal(await p.locator('.dgp-navigation').evaluate(e=>e.getBoundingClientRect().right<=innerWidth+1),true);
   assert.equal(await p.locator('#customOverlayContent').evaluate(e=>e.scrollWidth<=e.clientWidth+2),true,`${kind}: no horizontal overflow`);
  }
  assert.equal(await p.evaluate(kind=>{const before=nativeBody.innerHTML;DoLPanelsUI.setEnabled(kind,false);return nativeBody.innerHTML===before},kind),true,`${kind}: fallback no content loss`);
  assert.equal(await p.locator('.dgp-host').count(),0);
  await p.evaluate(kind=>DoLPanelsUI.setEnabled(kind,true),kind);
 }
 await open('cheats');await p.waitForSelector('.dgp-navigation');
 const money=await p.evaluate(()=>V.money);
 await p.locator('#cheatsShown .numberStepperContainer').first().locator('button').nth(3).click();
 assert.equal(await p.evaluate(()=>V.money),money+1000,'native cheat callback changes money');
 await open('gameFeats');await p.waitForSelector('.dgp-navigation');
 await open('options');await p.waitForSelector('.dgp-navigation');
 const setting=p.locator('#customOverlayContent input[type=checkbox]').first();const before=await setting.isChecked();await setting.setChecked(!before);
 assert.equal(await p.evaluate(()=>V.options.neverNudeMenus),!before);
 for(const tab of ['Theme','Performance','Advanced','Information']){
  await p.locator('#overlayTabs button').filter({hasText:new RegExp('^'+tab+'$')}).click();await p.waitForTimeout(80);
  assert.ok(await p.locator('#customOverlayContent').evaluate(e=>e.scrollWidth<=e.clientWidth+2),tab+' fits phone');
 }
 await p.evaluate(()=>closeOverlay());
 await p.evaluate(()=>{SugarCube.UIBar.stow();V.attitudesExitPassage='Bedroom';SugarCube.Engine.play('Attitudes')});
 await p.waitForSelector('.passage[data-dgp-panel=attitudes]');
 await p.locator('.passage label').filter({hasText:'I like being in control'}).locator('input').check();assert.equal(await p.evaluate(()=>V.assertiveaction),'defiant');
 for(const width of [390,1704]){await p.setViewportSize({width,height:1000});await p.screenshot({path:path.join(__dirname,`artifacts/attitudes-${width}.png`)});assert.ok(await p.locator('.passage').evaluate(e=>e.scrollWidth<=e.clientWidth+2))}
 await p.getByRole('button',{name:'原版态度',exact:true}).click();assert.equal(await p.locator('.passage[data-dgp-panel]').count(),0);
 assert.equal(await p.evaluate(()=>V.assertiveaction),'defiant');
 await p.evaluate(()=>{DoLPanelsUI.setEnabled('attitudes',true);SugarCube.Engine.play('Bedroom')});
 await p.waitForFunction(()=>!document.querySelector('.passage .dgp-host'));
 await p.evaluate(()=>{V.settingsExitPassage='Bedroom';SugarCube.Engine.play('Settings')});await p.waitForSelector('.passage[data-dgp-panel=settings]');
 await p.evaluate(()=>SugarCube.Engine.play('Bedroom'));await p.waitForFunction(()=>!document.querySelector('.passage .dgp-host'));
 await open('gameFeats');await p.waitForSelector('.dgp-navigation');
 // Feat filtering uses the game's original onchange, preserving hidden feat policy.
 await p.locator('#featTypes').selectOption('All');assert.equal(await p.evaluate(()=>V.feats.filter),'All');
 await p.locator('#featSort').selectOption('Date');assert.equal(await p.evaluate(()=>V.feats.sort),'Date');
 await p.locator('input[name="showMissing"]').uncheck();assert.equal(await p.evaluate(()=>V.feats.showmissing),false);
 assert.equal(await p.locator('#featsList .feat').count(),0,'synthetic new game has no earned feats');
 // Native trait search and all three formats retain their update callbacks.
 await open('traits');await p.waitForSelector('.dgp-navigation');await p.locator('#traitListsSearch .foldoutHeader').click();
 await p.locator('#textbox--traitsearch').fill('NoSuchTrait_IntegrationTest');await p.locator('#traitListsSearch a').first().click();
 assert.equal(await p.locator('#traitLists .trait').count(),0);
 await p.locator('#traitListsSearch a').nth(1).click();
 for(const format of ['table','reducedTable','list']){
  if(!await p.locator('#textbox--traitsearch').isVisible())await p.locator('#traitListsSearch .foldoutHeader').click();
  await p.locator('#traitListsSearch select').first().selectOption({value:{table:'0',reducedTable:'1',list:'2'}[format]});await p.locator('#traitListsSearch a').first().click();
  assert.ok(await p.locator('#traitLists .trait').count()>0);assert.equal(await p.evaluate(()=>V.options.traitOverlayFormat),format);
 }
 // Statistics foldouts and spoiler gating remain native.
 await open('statistics');await p.waitForSelector('.dgp-navigation');const fold=p.locator('#customOverlayContent .foldout').first();
 await fold.locator('.foldoutHeader').first().click();assert.equal(await fold.locator('.foldoutBody').first().isVisible(),true);
 await fold.locator('.foldoutHeader').first().click();await p.waitForFunction(()=>{const e=document.querySelector('#customOverlayContent .foldout .foldoutBody');return !!e&&(e.hidden||getComputedStyle(e).display==='none'||e.getClientRects().length===0)});assert.equal(await fold.locator('.foldoutBody').first().isVisible(),false);
 await p.locator('#overlayTabs button').nth(1).click();await p.waitForSelector('#spoilerWarning');assert.equal(await p.locator('#spoilerWarningConfirmed').count(),0);
 // Notes: same overlay key, native tab saves, UI fallback must not replace draft input.
 await open('journal');await p.waitForSelector('.dgp-navigation');await p.locator('#overlayTabs button').nth(1).click();await p.waitForSelector('#textarea--displayedtextarea');
 await p.locator('#journalNotesTextarea input[type=checkbox]').uncheck();await p.locator('#textarea--displayedtextarea').fill('UI regression draft');
 await p.evaluate(()=>{window.noteInput=document.querySelector('#textarea--displayedtextarea');DoLPanelsUI.setEnabled('journal',false);DoLPanelsUI.setEnabled('journal',true)});
 assert.equal(await p.evaluate(()=>noteInput===document.querySelector('#textarea--displayedtextarea')),true);
 assert.equal(await p.locator('#textarea--displayedtextarea').inputValue(),'UI regression draft');
 await p.locator('#overlayTabs button').first().click();
 assert.equal(await p.evaluate(()=>LZString.decompress(V.journalNotes.default)),'UI regression draft');
 await p.locator('#overlayTabs button').nth(1).click();await p.waitForSelector('#textarea--displayedtextarea');
 await p.locator('#journalNotesTextarea input[type=checkbox]').check();await p.locator('#textarea--displayedtextarea').fill('UI regression autosave');
 await p.waitForFunction(()=>LZString.decompress(V.journalNotes.default)==='UI regression autosave');
 await p.locator('#textarea--displayedtextarea').fill('UI regression close save');await p.evaluate(()=>closeOverlay());
 assert.equal(await p.evaluate(()=>LZString.decompress(V.journalNotes.default)),'UI regression close save');
 await p.waitForFunction(()=>!document.querySelector('.dgp-host'));
 await open('journal');await p.waitForSelector('.dgp-navigation');
 await p.evaluate(()=>{const h=document.createElement('h1');h.className='header';h.textContent='Mod Section';document.querySelector('#customOverlayContent').append(h)});
 await p.waitForFunction(()=>[...document.querySelectorAll('.dgp-navigation option')].some(o=>o.textContent==='Mod Section'));
 await p.waitForTimeout(100);const counts=await p.evaluate(()=>DoLPanelsUI.getLifecycleCounts());
 await p.evaluate(()=>{const x=document.createElement('div');document.body.append(x);for(let i=0;i<20;i++)x.textContent=String(i);x.remove()});await p.waitForTimeout(100);
 assert.deepEqual(await p.evaluate(()=>DoLPanelsUI.getLifecycleCounts()),counts);
 await p.evaluate(()=>DoLGameUI.openSettings());await p.getByRole('button',{name:'回退原版界面',exact:true}).click();assert.equal(await p.locator('.dgp-host').count(),0);
 for(const k of ['journal','traits','statistics','feats','cheats','attitudes','settings'])assert.equal(await p.evaluate(k=>DoLPanelsUI.getEnabled(k),k),false);
 await p.getByRole('button',{name:'启用新版界面',exact:true}).click();await p.locator('.dmt-close').click();await p.waitForSelector('.dgp-navigation');
 await p.evaluate(()=>DoLGameUI.destroy());assert.equal(await p.locator('.dgp-host').count(),0);assert.equal(await p.locator('.dgp-overlay').count(),0);
 assert.deepEqual(errors.filter(e=>!(process.env.DOL_WARDROBE_INTEGRATED&&e.includes('skybox')&&e.includes('bannerFallbackImage.onload'))),[]);
 console.log('PASS panels: native DOM/state, notes save and draft, feat filters, trait formats, stats foldouts, spoiler guard, dynamic headings, responsive layout, fallback and teardown');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
