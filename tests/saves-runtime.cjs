const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1500,height:1000}});const resizeErrors=[];p.on('pageerror',e=>{if(e.message.includes('ResizeObserver'))resizeErrors.push(e.message);console.log('PAGE ERROR',e.message)});p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
 await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});
 await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});await p.waitForLoadState('networkidle');
 await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');
 await p.evaluate(()=>SugarCube.Engine.play('Bedroom'));await p.waitForLoadState('networkidle');
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 await p.evaluate(async()=>{window.testSaveArea=document.createElement('div');testSaveArea.id='saveList';testSaveArea.style='position:fixed;inset:0;background:#19191f;z-index:99999;overflow:auto;padding:20px';document.body.append(testSaveArea);await idb.saveList()});
 await p.waitForSelector('.dgs-host');
 await p.waitForSelector('.dgs-tools #pageNum');
 await p.locator('.dgs-tools #pageNum').fill('2');await p.locator('.dgs-tools #pageNum').dispatchEvent('change');await p.waitForFunction(()=>[...document.querySelectorAll('.dgs-slot')].some(n=>n.textContent==='11'));
 await p.locator('.dgs-tools #pageNum').fill('1');await p.locator('.dgs-tools #pageNum').dispatchEvent('change');await p.waitForFunction(()=>[...document.querySelectorAll('.dgs-slot')].some(n=>n.textContent==='1'));
 await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await p.locator('.dgs-save-settings summary').click();
 assert.equal(await p.locator('.dgs-save-settings').evaluate(e=>e.open),true);
 // Native row updates can arrive after pagination while the user opens settings.
 await p.evaluate(()=>{const b=document.querySelector('.savesListRow button');const old=b.disabled;b.disabled=!old;b.disabled=old});
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 assert.equal(await p.locator('.dgs-save-settings').evaluate(e=>e.open),true,'native row refresh preserves expanded settings');
 const checkbox=p.locator('.dgs-save-settings input[type=checkbox]').first();assert.ok(await checkbox.isVisible());await checkbox.setChecked(true);assert.equal(await checkbox.isChecked(),true);
 assert.equal(await p.locator('#saves-import').count(),1);
 console.log('IDB list',await p.locator('.dgs-item').count());
 assert.equal(await p.locator('.dgs-entries details').count(),2);
 assert.deepEqual(await p.locator('.dgs-entries details').last().locator('.dgs-slot').allTextContents(),Array.from({length:10},(_,i)=>String(i+1)));
 const slot=await p.locator('.dgs-empty-slot .dgs-slot').first().textContent();
 await p.locator('.dgs-empty-slot').first().click();
 await p.waitForTimeout(300);
 
 const confirm=p.locator('#saveList .saveMenuConfirm').filter({hasText:/save/i});if(await confirm.count())await confirm.first().click();
 await p.waitForFunction(async()=> (await idb.getSaveDetails()).some(d=>d.slot===1));await p.evaluate(()=>idb.saveList());await p.waitForTimeout(150);await p.waitForSelector('.dgs-host');
 assert.ok(await p.locator('.dgs-item').filter({hasText:/./}).count(),'native save creates a populated row');
 await p.locator('.dgs-item').filter({hasText:/\d{4}/}).first().click();
 assert.ok(!(await p.locator('.dgs-detail dd').first().textContent()).includes('尚未'));
 assert.equal(await p.locator('.dgs-item.dgs-recent .dgs-slot').textContent(),'1');
 assert.equal(await p.locator('.dgs-item.dgs-recent .dgs-recent-badge').textContent(),'最近保存');
 assert.equal(await p.locator('.dgs-empty-slot').count(),9);
 await p.waitForFunction(()=>document.querySelector('.dgs-detail')?.textContent.includes('游戏内时间'));
 const savedTime=await p.evaluate(async()=>(await idb.getSaveDetails()).find(d=>d.slot===1)?.data.metadata.dolGameUI?.gameTime);
 assert.ok(savedTime,'new save records in-game timestamp');
 assert.ok((await p.locator('.dgs-detail').textContent()).includes(savedTime));
 const beforeRename=await p.evaluate(async()=>JSON.stringify(await idb.getItem(1)));
 await p.getByLabel('自定义存档名',{exact:true}).fill('回家前 <测试>');await p.getByRole('button',{name:'保存名称',exact:true}).click();
 assert.ok((await p.locator('.dgs-recent').textContent()).includes('回家前 <测试>'));
 assert.equal(await p.evaluate(async()=>JSON.stringify(await idb.getItem(1))),beforeRename,'rename never changes save payload');
 await p.keyboard.press('Escape');await p.evaluate(()=>idb.saveList());await p.waitForSelector('.dgs-recent');
 await p.waitForFunction(()=>document.querySelector('.dgs-recent')?.textContent.includes('回家前 <测试>'));
 await p.locator('.dgs-recent').click();

 for(const width of [390,1500]){
  await p.setViewportSize({width,height:1000});
  await p.keyboard.press('Escape');assert.equal(await p.locator('.dgs-detail').evaluate(e=>e.open),false);
  await p.waitForFunction(()=>document.querySelectorAll('.dgs-entries details:last-of-type .dgs-item').length>=2);
  const cards=await p.locator('.dgs-entries details').last().locator('.dgs-item').evaluateAll(es=>es.slice(0,2).map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y})));
  if(cards.length<2)console.log('GRID DEBUG',await p.locator('.dgs-entries').evaluateAll(es=>es.map(e=>({html:e.innerHTML.slice(0,1000),groups:e.querySelectorAll('details').length,slots:e.querySelectorAll('.dgs-item').length}))));
  assert.equal(Math.abs(cards[0].y-cards[1].y)<2,width>650,'wide screen uses two columns; phone uses one');
  await p.screenshot({path:path.join(__dirname,`artifacts/saves-grid-${width}.png`)});
  await p.locator('.dgs-recent').click();assert.equal(await p.locator('.dgs-detail').evaluate(e=>e.open),true);
  assert.ok(await p.locator('.dgs-detail').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
  await p.screenshot({path:path.join(__dirname,`artifacts/saves-drawer-${width}.png`)});
  await p.locator('.dgs-detail h2').click();assert.equal(await p.locator('.dgs-detail').evaluate(e=>e.open),true,'inside click stays open');
  await p.mouse.click(2,2);assert.equal(await p.locator('.dgs-detail').evaluate(e=>e.open),false,'backdrop click closes');
  await p.locator('.dgs-recent').click();
 }
 await p.keyboard.press('Escape');
 await p.evaluate(()=>DoLGameUI.setPreference('savesV2',true));
 await p.waitForSelector('.dgs-v2');
 assert.equal(await p.locator('.dgs-detail').evaluate(e=>e.matches(':modal')),false);
 await p.locator('.dgs-recent').click();
 assert.equal(await p.locator('.dgs-detail').evaluate(e=>e.matches(':modal')),false,'V2 selects without modal');
 await p.setViewportSize({width:390,height:900});
 await p.waitForFunction(()=>!document.querySelector('.dgs-v2'));
 await p.locator('.dgs-recent').click();
 assert.equal(await p.locator('.dgs-detail').evaluate(e=>e.matches(':modal')),true,'phone keeps modal');
 await p.setViewportSize({width:1500,height:1000});
 await p.waitForSelector('.dgs-v2');
 assert.equal(await p.locator('.dgs-detail').evaluate(e=>e.matches(':modal')),false,'resize releases modal');
 await p.evaluate(()=>DoLGameUI.setPreference('savesV2',false));
 await p.waitForFunction(()=>!document.querySelector('.dgs-v2'));
 await p.locator('.dgs-recent').click();
 // Confirmation remains native; cancel must not mutate the slot.
 await p.evaluate(()=>{idb.updateSettings('warnSave',true);idb.updateSettings('warnLoad',true);idb.updateSettings('warnDelete',true);V.uiSaveProbe='after-save'});
 await p.locator('.dgs-actions button').filter({hasText:/^Save$/}).click();await p.waitForSelector('#saveList .saveMenuConfirm');assert.equal(await p.locator('.dgs-host').count(),0);
 await p.locator('#saveList button.saveMenuConfirm').click();await p.waitForSelector('.dgs-host');
 await p.locator('.dgs-item').filter({hasText:/\d{4}/}).first().click();
 await p.locator('.dgs-actions button').filter({hasText:/^Load$/}).click();await p.waitForSelector('#saveList input.saveMenuConfirm');
 await p.locator('#saveList input.saveMenuConfirm').click();await p.waitForFunction(()=>V.uiSaveProbe===undefined);
 await p.evaluate(()=>idb.saveList());await p.waitForSelector('.dgs-host');
 await p.locator('.dgs-item').filter({hasText:/\d{4}/}).first().click();
 await p.locator('.dgs-actions button').filter({hasText:/^Delete$/}).click();await p.waitForSelector('#saveList input.saveMenuConfirm');
 await p.locator('#saveList input.saveMenuConfirm').click();await p.waitForFunction(async()=>!(await idb.getSaveDetails()).some(d=>d.slot===1));await p.waitForSelector('.dgs-host');
 assert.equal(await p.locator('.dgs-item small').filter({hasText:/\d{4}/}).count(),0);
 await p.screenshot({path:path.join(__dirname,'artifacts/saves-preview-desktop.png')});
 const source=await p.evaluate(()=>[...document.querySelectorAll('.dgs-native-row')].length);assert.ok(source>1);
 for(const width of [390,1024,1500]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(60);assert.ok(await p.evaluate(()=>document.querySelector('.dgs-host').scrollWidth<=document.querySelector('.dgs-host').clientWidth+1));}
 await p.getByRole('button',{name:'原版界面',exact:true}).click();assert.equal(await p.locator('.dgs-host').count(),0);assert.equal(await p.locator('.dgs-native-row').count(),0);assert.equal(await p.locator('.dgs-tools').count(),0);assert.equal(await p.locator('#saveList > ul #pageNum').count(),1);
 await p.evaluate(()=>DoLSavesUI.setEnabled(true));await p.waitForSelector('.dgs-host');
 await p.evaluate(()=>{testSaveArea.replaceChildren();new SugarCube.Wikifier(testSaveArea,'<<saveList>>')});await p.waitForSelector('#savesListContainer');await p.waitForSelector('.dgs-host');
 assert.ok(await p.locator('.dgs-item').count(),'legacy rows adapted');

 // Real overlay path: saving without warning hides overlay; no invisible modal may remain.
 await p.evaluate(()=>{testSaveArea.remove();new SugarCube.Wikifier(null,'<<overlayReplace "saves">>');idb.updateSettings('warnSave',false)});
 await p.waitForSelector('.dgs-host');await p.locator('.dgs-empty-slot').first().click();
 await p.evaluate(()=>{if(!document.querySelector('#customOverlay').classList.contains('hidden'))closeOverlay();new SugarCube.Wikifier(null,'<<overlayReplace "saves">>')});await p.waitForSelector('.dgs-host');
 await p.locator('.dgs-item').filter({hasText:/\d{4}/}).first().click();await p.locator('.dgs-actions button').filter({hasText:/^Save$/}).click();
 assert.equal(await p.locator('.dgs-detail[open]').count(),0,'save releases modal even when original overlay is hidden');
 await p.evaluate(()=>{if(!document.querySelector('#customOverlay').classList.contains('hidden'))closeOverlay();new SugarCube.Wikifier(null,'<<overlayReplace "saves">>')});await p.waitForSelector('.dgs-host');
 await p.locator('.dgs-item').filter({hasText:/\d{4}/}).first().click();await p.evaluate(()=>closeOverlay());assert.equal(await p.locator('.dgs-detail[open]').count(),0,'native close releases modal');
 // Export widget retains real controls and native callbacks; cloud is untouched.
 await p.evaluate(()=>{testSaveArea.remove();DoLSavesUI.setEnabled(false);window.transferArea=document.createElement('div');transferArea.id='customOverlayContent';transferArea.style='position:fixed;inset:0;background:#19191f;z-index:99999;overflow:auto;padding:20px';document.body.append(transferArea);new SugarCube.Wikifier(transferArea,'<<optionsExportImport>>');window.transferInput=document.querySelector('#saveDataInput');window.transferFile=document.querySelector('#saveImport');DoLSavesUI.setEnabled(true)});
 await p.waitForSelector('.dgs-transfer');
 assert.ok(await p.evaluate(()=>document.querySelector('#saveDataInput')===transferInput&&document.querySelector('#saveImport')===transferFile));
 await p.locator('#saveDataInput').fill('test-clear');await p.locator('.dgs-transfer input[onclick*="clearTextBox"]').click();assert.equal(await p.locator('#saveDataInput').inputValue(),'');
 await p.locator('.dgs-transfer input[onclick="getSaveData()"]').click();assert.ok((await p.locator('#saveDataInput').inputValue()).length>100);
 for(const width of [390,1024,1704]){await p.setViewportSize({width,height:1136});await p.waitForTimeout(60);assert.ok(await p.evaluate(()=>document.querySelector('.dgs-transfer').scrollWidth<=document.querySelector('.dgs-transfer').clientWidth+1));}
 await p.screenshot({path:path.join(__dirname,'artifacts/save-transfer-desktop.png')});
 await p.evaluate(()=>DoLSavesUI.setEnabled(false));assert.equal(await p.locator('.dgs-transfer').count(),0);assert.ok(await p.evaluate(()=>transferInput.parentElement===transferArea&&transferFile.parentElement===transferArea));
 await p.evaluate(()=>{transferArea.innerHTML='<section id="cloud-test">Cloud controls</section>';DoLSavesUI.setEnabled(true)});await p.waitForTimeout(80);assert.equal(await p.locator('.dgs-transfer').count(),0);assert.equal(await p.locator('#cloud-test').textContent(),'Cloud controls');
 await p.evaluate(()=>DoLSavesUI.destroy());assert.equal(await p.locator('.dgs-native-row').count(),0);
 assert.deepEqual(resizeErrors,[],'no ResizeObserver errors during V1/V2/resizing');
 console.log('PASS IndexedDB save/load/delete, overwrite cancel, native confirmations, responsive widths, fallback and legacy rendering',slot);
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
