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
  if(!['traits','settings'].includes(kind))assert.equal(await p.evaluate(()=>nativeBody.innerHTML===nativeHTML),true,`${kind}: content preserved`);
  assert.equal(await p.evaluate(()=>JSON.stringify(V)===nativeV),true,`${kind}: no state writes`);
  assert.equal(await p.evaluate(()=>nativeNodes.every(n=>n.isConnected)),true);
  if(['settings','cheats'].includes(kind)){
   assert.notEqual(await p.locator('#customOverlayContent input[type=checkbox]').first().evaluate(e=>getComputedStyle(e).appearance),'none','native checkbox retains its platform shape');
   if(await p.locator('#customOverlayContent input[type=radio]').count())assert.ok(await p.locator('#customOverlayContent input[type=radio]').first().evaluate(e=>getComputedStyle(e).opacity==='1'&&getComputedStyle(e).position==='static'&&e.getBoundingClientRect().width>=12),'native radio remains visible in original text order');
   assert.equal(await p.evaluate(()=>nativeBody.innerHTML===nativeHTML),true,`${kind}: presentation leaves all original markup and separators intact`);
   assert.equal(await p.locator('#customOverlayContent .settingsToggleItem').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)',`${kind}: rows have no card background`);
  }
  if(kind==='traits'){
   assert.ok((await p.locator('#customOverlay').boundingBox()).height<650,'one-trait overlay shrinks to content');
   assert.equal(await p.locator('#traitLists [data-dgp-count]').first().getAttribute('data-dgp-count'),'1');
   assert.ok(await p.locator('#traitLists .trait').first().evaluate(e=>{const name=e.firstElementChild,description=e.querySelector('small');return description.getBoundingClientRect().top>=name.getBoundingClientRect().bottom}),'trait name and description have separate hierarchy');
  }
  const select=p.getByLabel('跳到分组',{exact:true});const size=await select.locator('option').count();assert.ok(size>1);
  await select.selectOption(String(size-2));await p.getByRole('button',{name:'回到顶部',exact:true}).click();
  assert.equal(await p.locator('#customOverlayContent').evaluate(e=>e.scrollTop),0);
  for(const [name,width,height] of [['tablet',1704,1136],['phone',390,844]]){
   await p.setViewportSize({width,height});
   await p.screenshot({path:path.join(__dirname,`artifacts/panels-${kind}-${process.env.DOL_WARDROBE_INTEGRATED?'lyra':'vanilla'}-${name}.png`)});
   assert.equal(await p.locator('.dgp-navigation').evaluate(e=>e.getBoundingClientRect().right<=innerWidth+1),true);
   assert.equal(await p.locator('#customOverlayContent').evaluate(e=>e.scrollWidth<=e.clientWidth+2),true,`${kind}: no horizontal overflow`);
  }
  assert.equal(await p.evaluate(kind=>{
   const expected=['traits','settings'].includes(kind)?nativeHTML:nativeBody.innerHTML;
   DoLPanelsUI.setEnabled(kind,false);
   // settingsDisableElement writes an empty style attribute via native jQuery.
   return nativeBody.innerHTML.replace(/ style=""/g,'')===expected.replace(/ style=""/g,'');
  },kind),true,`${kind}: fallback restores native markup`);
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
 // Keyboard toggling still reaches the original input and callback.
 await setting.focus();await p.keyboard.press('Space');assert.equal(await setting.isChecked(),before);assert.equal(await p.evaluate(()=>V.options.neverNudeMenus),before);
 const dates=p.locator('#customOverlayContent label:has(>input[name="radiobutton-optionsdateformat"])');
 await dates.nth(1).click();assert.equal(await p.evaluate(()=>V.options.dateFormat),'en-US');
 await dates.nth(1).locator('input').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>V.options.dateFormat),'zh-CN');
 assert.equal(await dates.nth(2).locator('input').isChecked(),true);
 assert.ok(await dates.nth(2).locator('input').evaluate(e=>getComputedStyle(e).outlineStyle==='solid'),'focused native radio has a visible focus ring');
 await p.evaluate(()=>{window.originalIronman=V.ironmanmode;V.ironmanmode=true;settingsDisableElement()});
 const disabledSetting=p.locator('#checkbox-optionsautosavedisabled');await p.waitForFunction(()=>document.querySelector('#checkbox-optionsautosavedisabled').disabled);
 const disabledBefore=await disabledSetting.isChecked(),disabledBox=await disabledSetting.locator('..').boundingBox();await p.mouse.click(disabledBox.x+disabledBox.width/2,disabledBox.y+disabledBox.height/2);assert.equal(await disabledSetting.isChecked(),disabledBefore,'disabled native checkbox cannot toggle');
 await p.evaluate(()=>{V.ironmanmode=originalIronman;settingsDisableElement()});
 for(const tab of ['Theme|主题','Performance|性能','Advanced|高级','Information|信息']){
  await p.locator('#overlayTabs button').filter({hasText:new RegExp('^('+tab+')$')}).click();await p.waitForTimeout(80);
  assert.ok(await p.locator('#customOverlayContent').evaluate(e=>e.scrollWidth<=e.clientWidth+2),tab+' fits phone');
 }
 await p.evaluate(()=>closeOverlay());
 await p.evaluate(()=>{SugarCube.UIBar.stow();V.attitudesExitPassage='Bedroom';SugarCube.Engine.play('Attitudes')});
 await p.waitForSelector('.passage[data-dgp-panel=attitudes]');
 await p.locator('.passage label').filter({hasText:/I like being in control|我喜欢掌握主动/}).locator('input').check();assert.equal(await p.evaluate(()=>V.assertiveaction),'defiant');
 for(const width of [390,1704]){await p.setViewportSize({width,height:1000});await p.screenshot({path:path.join(__dirname,`artifacts/attitudes-${process.env.DOL_WARDROBE_INTEGRATED?'lyra':'vanilla'}-${width}.png`)});assert.ok(await p.locator('.passage').evaluate(e=>e.scrollWidth<=e.clientWidth+2))}
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
 await p.setViewportSize({width:390,height:844});
 // Rendered multi-trait fixture only, not game variables or hidden definitions.
 await p.evaluate(()=>{const group=document.querySelector('#traitLists .trait').parentElement,row=group.querySelector('.trait');for(let i=0;i<60;i++){const copy=row.cloneNode(true);copy.dataset.testTrait='';group.append(copy)}});
 await p.waitForFunction(()=>document.querySelector('#traitLists [data-dgp-count]').dataset.dgpCount==='61');
 assert.ok(await p.locator('#customOverlayContent').evaluate(e=>e.scrollHeight>e.clientHeight),'large trait collection scrolls within viewport');
 assert.ok((await p.locator('#customOverlay').boundingBox()).height<=844-24+1,'large collection caps modal height');
 await p.evaluate(()=>document.querySelectorAll('[data-test-trait]').forEach(e=>e.remove()));
 await p.waitForFunction(()=>document.querySelector('#traitLists [data-dgp-count]').dataset.dgpCount==='1');
 const stable=await p.evaluate(()=>DoLPanelsUI.getLifecycleCounts());await p.waitForTimeout(100);assert.deepEqual(await p.evaluate(()=>DoLPanelsUI.getLifecycleCounts()),stable,'presentation does not cause observer churn');
 // Large text remains readable without horizontal scroll in the two rebuilt pages.
 for(const key of ['traits','options']){
  await open(key);await p.waitForSelector('.dgp-navigation');
  await p.locator('#customOverlayContent').evaluate(e=>e.style.fontSize='32px');
  const largeFits=await p.locator('#customOverlayContent').evaluate(e=>e.scrollWidth<=e.clientWidth+2);
  if(!largeFits){console.log('LARGE_OVERFLOW',key,await p.locator('#customOverlayContent').evaluate(e=>{const right=e.getBoundingClientRect().right;return [...e.querySelectorAll('*')].filter(n=>n.getClientRects().length&&n.getBoundingClientRect().right>right+1).map(n=>({tag:n.tagName,id:n.id,cls:n.className,width:n.getBoundingClientRect().width,right:n.getBoundingClientRect().right,display:getComputedStyle(n).display,minWidth:getComputedStyle(n).minWidth})).slice(0,10)}));await p.screenshot({path:path.join(__dirname,`artifacts/panels-large-overflow-${process.env.DOL_WARDROBE_INTEGRATED?'lyra':'vanilla'}.png`)})}
  assert.ok(largeFits,`${key}: large text fits narrow screen`);
  await p.screenshot({path:path.join(__dirname,`artifacts/panels-${key}-large-${process.env.DOL_WARDROBE_INTEGRATED?'lyra':'vanilla'}.png`)});
  await p.locator('#customOverlayContent').evaluate(e=>e.style.removeProperty('font-size'));
 }
 // Statistics foldouts and spoiler gating remain native.
 await open('statistics');await p.waitForSelector('.dgp-navigation');const fold=p.locator('#customOverlayContent .foldout').first();
 await fold.locator('.foldoutHeader').first().click();assert.equal(await fold.locator('.foldoutBody').first().isVisible(),true);
 await fold.locator('.foldoutHeader').first().click();await p.waitForFunction(()=>{const e=document.querySelector('#customOverlayContent .foldout .foldoutBody');return !!e&&(e.hidden||getComputedStyle(e).display==='none'||e.getClientRects().length===0)});assert.equal(await fold.locator('.foldoutBody').first().isVisible(),false);
 await p.locator('#overlayTabs button').nth(1).click();await p.waitForSelector('#spoilerWarning');assert.equal(await p.locator('#spoilerWarningConfirmed').count(),0);
 // Notes: same overlay key, native tab saves, UI fallback must not replace draft input.
 await open('journal');await p.waitForSelector('.dgp-navigation');await p.locator('#overlayTabs button').nth(1).click();await p.waitForSelector('#textarea--displayedtextarea');
 assert.equal(await p.locator('#customOverlayContent .foldout').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','notes tools use a section, not an entity card');
 assert.ok(await p.locator('#journalNotesTextarea > button').first().evaluate(e=>e.getBoundingClientRect().height>=44),'native note save retains a usable touch area');
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
 assert.equal(await p.evaluate(()=>DoLGameUI.getPreferences().enabled),false);
 for(const k of ['journal','traits','statistics','feats','cheats','attitudes','settings'])assert.equal(await p.evaluate(k=>DoLPanelsUI.getEnabled(k),k),true,'master off retains individual preferences');
 await p.getByRole('button',{name:'启用新版界面',exact:true}).click();await p.locator('.dmt-close').click();await p.waitForSelector('.dgp-navigation');
 await p.evaluate(()=>DoLGameUI.destroy());assert.equal(await p.locator('.dgp-host').count(),0);assert.equal(await p.locator('.dgp-overlay').count(),0);
 assert.deepEqual(errors.filter(e=>!(process.env.DOL_WARDROBE_INTEGRATED&&e.includes('skybox')&&e.includes('bannerFallbackImage.onload'))),[]);
 console.log('PASS panels: native DOM/state, notes save and draft, feat filters, trait formats, stats foldouts, spoiler guard, dynamic headings, responsive layout, fallback and teardown');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
