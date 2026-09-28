const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1500,height:1000}});p.on('pageerror',e=>console.log('PAGE ERROR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
 await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});
 await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});await p.waitForLoadState('networkidle');
 await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');
 await p.evaluate(()=>SugarCube.Engine.play('Bedroom'));await p.waitForLoadState('networkidle');
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 await p.evaluate(async()=>{window.testSaveArea=document.createElement('div');testSaveArea.id='saveList';testSaveArea.style='position:fixed;inset:0;background:#19191f;z-index:99999;overflow:auto;padding:20px';document.body.append(testSaveArea);await idb.saveList()});
 await p.waitForSelector('.dgs-host');
 await p.waitForSelector('.dgs-tools #pageNum');
 await p.locator('.dgs-tools #pageNum').fill('2');await p.locator('.dgs-tools #pageNum').dispatchEvent('change');await p.waitForFunction(()=>document.querySelector('.dgs-tools #pageNum')?.value==='2');
 await p.locator('.dgs-tools #pageNum').fill('1');await p.locator('.dgs-tools #pageNum').dispatchEvent('change');await p.waitForFunction(()=>document.querySelector('.dgs-tools #pageNum')?.value==='1');
 await p.locator('.dgs-save-settings summary').click();const checkbox=p.locator('.dgs-save-settings input[type=checkbox]').first();await checkbox.setChecked(true);assert.equal(await checkbox.isChecked(),true);
 assert.equal(await p.locator('#saves-import').count(),1);
 console.log('IDB list',await p.locator('.dgs-item').count());
 await p.getByRole('button',{name:'＋ 新建存档',exact:true}).click();
 assert.ok(await p.locator('.dgs-detail').innerText());
 const slot=await p.locator('.dgs-detail .dgs-muted').textContent();
 await p.locator('.dgs-actions button').filter({hasText:/^Save$|^保存$/}).click();
 await p.waitForTimeout(300);
 
 const confirm=p.locator('#saveList .saveMenuConfirm').filter({hasText:/save/i});if(await confirm.count())await confirm.first().click();
 await p.waitForFunction(async()=> (await idb.getSaveDetails()).some(d=>d.slot===1));await p.evaluate(()=>idb.saveList());await p.waitForTimeout(150);await p.waitForSelector('.dgs-host');
 assert.ok(await p.locator('.dgs-item').filter({hasText:/./}).count(),'native save creates a populated row');
 await p.locator('.dgs-item').filter({hasText:/\d{4}/}).first().click();
 assert.ok(!(await p.locator('.dgs-detail dd').first().textContent()).includes('尚未'));
 // Confirmation remains native; cancel must not mutate the slot.
 await p.evaluate(()=>{idb.updateSettings('warnSave',true);idb.updateSettings('warnLoad',true);idb.updateSettings('warnDelete',true);V.uiSaveProbe='after-save'});
 await p.locator('.dgs-actions button').filter({hasText:/^Save$/}).click();await p.waitForSelector('#saveList .saveMenuConfirm');assert.equal(await p.locator('.dgs-host').count(),0);
 await p.locator('#saveList button.saveMenuConfirm').click();await p.waitForSelector('.dgs-host');
 await p.locator('.dgs-actions button').filter({hasText:/^Load$/}).click();await p.waitForSelector('#saveList input.saveMenuConfirm');
 await p.locator('#saveList input.saveMenuConfirm').click();await p.waitForFunction(()=>V.uiSaveProbe===undefined);
 await p.evaluate(()=>idb.saveList());await p.waitForSelector('.dgs-host');
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
 await p.evaluate(()=>DoLSavesUI.destroy());assert.equal(await p.locator('.dgs-native-row').count(),0);
 console.log('PASS IndexedDB save/load/delete, overwrite cancel, native confirmations, responsive widths, fallback and legacy rendering',slot);
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
