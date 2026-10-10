// Isolated original game; never reads or writes a user/device save.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const out=process.env.DOL_TEST_OUT||path.join(__dirname,'artifacts/25-wardrobe-search');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=route==='/game'?path.join(project,'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',route);if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}fs.createReadStream(file).pipe(res)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];try{
 const p=await browser.newPage({viewport:{width:1363,height:900}});p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});
 // Finish the original Start banner request before leaving Start deletes Weather.banner.
 await p.waitForLoadState('networkidle');await p.evaluate(()=>SugarCube.Engine.play('Start2'));
 await p.evaluate(()=>{
  V.location='home';V.wardrobe_location='wardrobe';V.lastWardrobeSlot='upper';V.options.images=0;
  // Start2 wears a linked dress; native lower wear correctly removes its upper part.
  for(const slot of ['upper','lower'])V.worn[slot]=structuredClone(setup.clothes[slot][0]);
  for(const slot of ['upper','lower']){const def=setup.clothes[slot].find(d=>d.name!=='naked'&&!d.outfitPrimary&&!d.outfitSecondary);if(!def)throw Error('missing native clothing fixture');const item=structuredClone(def);item.cn_name_cap='跨类样品';item.colour=item.colour_options?.[0]??0;item.accessory_colour=item.accessory_colour_options?.[0]??0;V.wardrobe[slot]=[item]}
  window.searchNativeItems={upper:V.wardrobe.upper[0],lower:V.wardrobe.lower[0]};
  V.wardrobe.mystery=[structuredClone(V.wardrobe.upper[0])];V.worn.mystery=structuredClone(setup.clothes.upper[0]);setup.clothes.mystery=[structuredClone(setup.clothes.upper[1])];
  SugarCube.Engine.play('Wardrobe');
 });
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});await p.waitForSelector('.dgw-shell');
 const search=p.getByRole('searchbox',{name:'搜索所有分类'}),results=p.locator('.dgw-item');
 assert.equal(await results.count(),1,'ordinary browsing remains in upper category');await search.fill('跨类样品');await p.waitForFunction(()=>document.querySelectorAll('.dgw-item').length===2);
 assert.ok(await results.filter({hasText:'上装'}).count()===1&&await results.filter({hasText:'下装'}).count()===1,'same-name results carry distinct categories');
 assert.ok((await p.locator('.dgw-original-access').innerText()).includes('mystery'),'unknown slot keeps original-access warning');
 const layouts=[];
 for(const width of [1363,390,540,1363]){
  await p.setViewportSize({width,height:900});await p.evaluate(()=>SugarCube.UIBar.stow());await p.waitForTimeout(100);
  const layout=await p.locator('.dgw-root').evaluate(e=>({width:e.clientWidth,overflow:e.scrollWidth>e.clientWidth+2,items:[...e.querySelectorAll('.dgw-item')].map(n=>({height:n.getBoundingClientRect().height,overflow:n.scrollWidth>n.clientWidth+2}))}));
  assert.equal(layout.overflow,false);assert.ok(layout.items.every(i=>i.height>=44&&!i.overflow));layouts.push({viewport:width,...layout});await p.screenshot({path:path.join(out,`search-${width}.png`)});
 }
 const upperBefore=await p.evaluate(()=>JSON.stringify(V.worn.upper));await results.filter({hasText:'下装'}).click();await p.waitForFunction(()=>V.worn.lower.variable===searchNativeItems.lower.variable);
 assert.equal(await p.evaluate(()=>JSON.stringify(V.worn.upper)),upperBefore,'cross-category lower click does not wear upper');assert.equal(await p.evaluate(()=>V.lastWardrobeSlot),'upper','search does not move category cursor');
 await search.fill('not-a-clothing-match');await p.waitForFunction(()=>!document.querySelector('.dgw-item'));assert.ok((await p.locator('.dgw-empty').innerText()).includes('没有符合'));
 await search.fill('跨类样品');await p.waitForSelector('.dgw-item');
 const stale=await p.evaluate(()=>{const before=JSON.stringify(V.worn),button=document.querySelector('.dgw-item');V.wardrobe.upper.unshift(structuredClone(V.wardrobe.upper[0]));button.click();return {unchanged:before===JSON.stringify(V.worn),message:document.querySelector('.dgw-message').textContent}});
 assert.equal(stale.unchanged,true,'stale index cannot dispatch wear');await p.waitForFunction(()=>document.querySelector('.dgw-message').textContent.includes('本次未操作'));
 await p.getByRole('button',{name:'整理模式',exact:true}).click();assert.equal(await p.getByRole('searchbox',{name:'搜索当前分类'}).inputValue(),'','manage mode clears global search');await p.getByRole('button',{name:'退出整理',exact:true}).click();
 await p.setViewportSize({width:390,height:900});await p.locator('.dgw-slot-select').selectOption('lower');await search.fill('跨类样品');await p.waitForFunction(()=>document.querySelector('.dgw-count').textContent.includes('跨分类搜索'));await search.fill('');await p.waitForFunction(()=>!document.querySelector('.dgw-count').textContent.includes('跨分类搜索'));assert.equal(await p.locator('.dgw-slot-select').inputValue(),'lower');
 await p.locator('.dgw-slot-select').selectOption('upper');await p.waitForSelector('.dgw-item');await results.first().click();await p.waitForFunction(()=>V.worn.upper.variable===searchNativeItems.upper.variable);
 await p.getByRole('button',{name:'查看原版及扩展信息',exact:true}).click();assert.ok(await p.locator('#wardrobeList').isVisible(),'original fallback remains accessible');
 assert.deepEqual(await p.locator('.error').allTextContents(),[]);assert.deepEqual(errors,[]);await p.evaluate(()=>DoLGameUI.destroy());assert.equal(await p.locator('.dgw-root').count(),0);
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,environment:'isolated original DoL 0.5.11.9 / Edge',layouts,checks:['same-name cross-category results','native lower wear','stale index refusal','no results','manage/category transitions','single-click wear','unknown original access','cleanup'],physicalAndroid:false},null,2));console.log('PASS wardrobe cross-category search, original native wear, stale refusal, fallback and wide/narrow/wide');
 }finally{await browser.close();server.close()}})().catch(error=>{fs.writeFileSync(path.join(out,`failed-${Date.now()}.json`),JSON.stringify({passed:false,error:error.stack},null,2));console.error(error);process.exitCode=1;server.close()});
