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
 if(process.env.DOL_WARDROBE_CONTROL){await p.evaluate(()=>SugarCube.Engine.play('Wardrobe'));await p.waitForLoadState('networkidle');fs.writeFileSync(path.join(__dirname,'artifacts/wardrobe-control.json'),JSON.stringify({scope:'Same integrated game, no new UI injected',errors},null,2));console.log('CONTROL_ERRORS',errors);return}
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 await p.evaluate(()=>{V.location='home';V.lastWardrobeSlot='upper';V.wardrobe_location='wardrobe';for(const d of setup.clothes.upper.filter(c=>c.name!=='naked'&&!c.outfitPrimary&&!c.outfitSecondary).slice(0,3)){const item=structuredClone(d);item.colour=item.colour_options?.[0]??0;item.accessory_colour=item.accessory_colour_options?.[0]??0;V.wardrobe.upper.push(item)}SugarCube.Engine.play('Wardrobe')});
 await p.waitForSelector('.dgw-shell');await p.waitForFunction(()=>document.querySelector('.dgw-preview').getAttribute('aria-busy')==='false');
 console.log('PREVIEW',await p.evaluate(()=>({status:document.querySelector('.dgw-render-status').textContent,message:document.querySelector('.dgw-message').textContent,canvas:!!document.querySelector('.dgw-preview canvas')})));
 assert.equal(await p.locator('.dgw-preview canvas').count(),1);
 console.log('ITEMS',await p.locator('.dgw-item strong').allTextContents());
 if(process.env.DOL_WARDROBE_INTEGRATED){assert.ok((await p.locator('.dgw-item strong').allTextContents()).some(n=>n.includes('校服衬衫')));assert.ok((await p.locator('.dgw-item small').allTextContents()).some(n=>n.includes('白色')))}
 await p.evaluate(()=>{window.nativeList=document.querySelector('#wardrobeList');window.nativeExits=document.querySelector('#wardrobeExits');window.nativeOutfits=document.querySelector('#listoutfits');window.renderCount=0;const compose=Renderer.composeLayers;Renderer.composeLayers=function(...args){if(args[0]?.canvas?.getAttribute('aria-label')==='当前角色完整穿搭预览')renderCount++;return compose.apply(this,args)};V.wardrobeOption='delete';});
 assert.equal(await p.locator('.dgw-wear').count(),0,'no confirm step');
 assert.ok(await p.locator('.dgw-actions #listoutfits').count());
 assert.ok(await p.locator('.dgw-actions .wardrobe-action').count());
 // Promoted nodes keep native handlers: saved outfit, create form and random filter.
 const saved=await p.locator('.dgw-actions .outfitContainer button').count();
 if(saved){await p.locator('.dgw-actions .outfitContainer button').first().click();await p.waitForTimeout(100)}
 const create=p.locator('.dgw-actions #listoutfits > label a').first();await create.click();assert.ok(await p.locator('#newClothingSetFromCurrent').isVisible());await create.click();
 const configure=p.locator('.dgw-actions .wardrobe-action a').nth(2);await configure.click();assert.ok(await p.locator('#randomClothingConfigure').isVisible());await configure.click();
 await p.waitForFunction(()=>document.querySelector('.dgw-preview').getAttribute('aria-busy')==='false');
 await p.evaluate(()=>{renderCount=0;V.wardrobeOption='delete'});
 const expected=await p.locator('.dgw-item strong').first().textContent();
 const expectedVariable=await p.evaluate(()=>{const index=Number(document.querySelector('.dgw-item').dataset.key.split(':')[1]);return V.wardrobe.upper[index].variable});
 await p.locator('.dgw-item').first().click();
 await p.waitForFunction(()=>document.querySelector('.dgw-preview').getAttribute('aria-busy')==='false');
 assert.equal(await p.evaluate(()=>V.wardrobeOption),'wear','old delete mode cannot leak into direct wear');
 assert.equal(await p.locator('.dgw-detail > h3').textContent(),expected);
 assert.equal(await p.evaluate(()=>V.worn.upper.variable),expectedVariable,'item click commits to actual worn state');
 await p.waitForTimeout(200);
 assert.equal(await p.evaluate(()=>renderCount),1,'one outfit render per actual wear');
 await p.evaluate(()=>{renderCount=0;window.nativeBeforeCategory=document.querySelector('#wardrobeList').innerHTML;});
 await p.locator('.dgw-slots button').first().click();
 assert.equal(await p.evaluate(()=>document.querySelector('#wardrobeList').innerHTML),await p.evaluate(()=>nativeBeforeCategory),'closed native tools defer list generation');
 // Native controls are kept in the preserved original subtree and switched from
 // the shared settings dialog; there is no longer a wardrobe details toggle.
 await p.evaluate(()=>DoLMidnightTheme.openSettings());
 await p.locator('#dmt-wardrobe').selectOption('original');await p.locator('.dmt-close').click();
 await p.waitForFunction(()=>!document.querySelector('.dgw-shell'));
 await p.waitForFunction(()=>document.querySelector('#wardrobeList').innerHTML!==nativeBeforeCategory);
 assert.equal(await p.evaluate(()=>V.lastWardrobeSlot),'head');
 await p.evaluate(()=>DoLMidnightTheme.openSettings());
 await p.locator('#dmt-wardrobe').selectOption('new');await p.locator('.dmt-close').click();await p.waitForSelector('.dgw-shell');await p.waitForFunction(()=>document.querySelector('.dgw-preview').getAttribute('aria-busy')==='false');
 await p.evaluate(()=>{renderCount=0;window.nativeBeforeCategory=document.querySelector('#wardrobeList').innerHTML});
 await p.locator('.dgw-slots button').filter({hasText:'上装'}).first().click();
 assert.equal(await p.evaluate(()=>document.querySelector('#wardrobeList').innerHTML),await p.evaluate(()=>nativeBeforeCategory),'new UI defers native list generation while original controls are hidden');

 await p.locator('.dgw-slots button').filter({hasText:'上装'}).first().click();
 await p.getByRole('searchbox',{name:'搜索当前分类'}).fill('test');await p.getByRole('searchbox').fill('');
 await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>renderCount),0,'category/search do not redraw');
 // Live descriptor translation wins over an old English instance name.
 await p.evaluate(()=>{const raw=V.wardrobe.upper[0];const d=setup.clothes.upper.find(d=>d.variable===raw.variable&&d.modder===raw.modder);d.cn_name_cap='测试中文衣物';raw.cn_name_cap='测试中文衣物';setup.colourName=()=> '测试颜色';DoLWardrobeUI.refresh()});
 await p.waitForFunction(()=>document.querySelector('.dgw-preview').getAttribute('aria-busy')==='false');
 await p.getByRole('searchbox').fill('测试中文衣物');assert.ok(await p.locator('.dgw-item').count()>0);assert.equal(await p.locator('.dgw-item small').first().textContent(),'测试颜色');await p.getByRole('searchbox').fill('');
 await p.getByRole('combobox',{name:'衣物排序'}).selectOption('warmth');
 await p.locator('.dgw-item').nth(0).click();await p.locator('.dgw-item').nth(1).click();
 await p.waitForFunction(()=>document.querySelector('.dgw-preview').getAttribute('aria-busy')==='false');
 assert.equal(await p.locator('.dgw-preview canvas').count(),1);
 // Category strip delegates to the native wardrobe and preserves the warmth widget.
 await p.evaluate(()=>{window.warmthNode=document.querySelector('#warmthIndicator');window.beforeStrip=V.worn.upper.name;});
 await p.getByRole('button',{name:'脱下当前部位',exact:true}).click();
 await p.waitForFunction(()=>V.worn.upper.name==='naked');
 assert.ok(await p.evaluate(()=>V.wardrobe.upper.some(i=>i.name===beforeStrip)));
 assert.equal(await p.locator('.dgw-detail #warmthIndicator').count(),1);
 await p.locator('.dgw-item').first().click();await p.waitForFunction(()=>document.querySelector('.dgw-preview').getAttribute('aria-busy')==='false');
 await p.getByRole('button',{name:'整理模式',exact:true}).click();
 await p.evaluate(()=>{window.wornBeforeManage=JSON.stringify(V.worn);window.inventoryBefore=JSON.stringify(V.wardrobe)});
 await p.locator('.dgw-item').first().click();await p.locator('.dgw-item').nth(1).click();
 assert.ok(await p.evaluate(()=>JSON.stringify(V.worn)===wornBeforeManage&&JSON.stringify(V.wardrobe)===inventoryBefore),'selection does not equip/discard');
 await p.getByRole('button',{name:'审查丢弃',exact:true}).click();
 assert.ok(await p.evaluate(()=>JSON.stringify(V.wardrobe)===inventoryBefore),'review does not delete');
 await p.screenshot({path:path.join(__dirname,'artifacts/wardrobe-manage-tablet.png'),fullPage:true});
 await p.getByRole('button',{name:'取消',exact:true}).click();
 assert.ok(await p.evaluate(()=>JSON.stringify(V.wardrobe)===inventoryBefore),'cancel is readonly');
 await p.getByRole('button',{name:'审查丢弃',exact:true}).click();
 await p.evaluate(()=>V.wardrobe.upper.reverse());
 await p.getByRole('button',{name:'确认丢弃',exact:true}).click();
 await p.waitForFunction(()=>document.querySelector('.dgw-message').textContent.includes('本次未操作'));
 assert.ok(await p.evaluate(()=>JSON.stringify(V.worn)===wornBeforeManage));
 await p.getByRole('button',{name:'退出整理',exact:true}).click();await p.getByRole('button',{name:'整理模式',exact:true}).click();
 await p.evaluate(()=>{window.deleteTargets=[...document.querySelectorAll('.dgw-item')].slice(0,2).map(n=>V.wardrobe.upper[Number(n.dataset.key.split(':')[1])]);window.beforeDeleteCount=V.wardrobe.upper.length});
 await p.locator('.dgw-item').first().click();await p.locator('.dgw-item').nth(1).click();
 await p.getByRole('button',{name:'审查丢弃',exact:true}).click();await p.getByRole('button',{name:'确认丢弃',exact:true}).click();
 await p.waitForFunction(()=>document.querySelector('.dgw-message').textContent.includes('已丢弃 2'));
 assert.ok(await p.evaluate(()=>deleteTargets.every(i=>!V.wardrobe.upper.includes(i))&&V.wardrobe.upper.length===beforeDeleteCount-2),'batch resolves identities after index shifts');
 assert.equal(await p.evaluate(()=>V.wardrobeOption),'wear');
 assert.ok(await p.evaluate(()=>JSON.stringify(V.worn)===wornBeforeManage),'discard does not change equipped clothes');
 await p.getByRole('button',{name:'退出整理',exact:true}).click();
 // Linked outfit discard follows the original matching rules, without touching saved outfits.
 await p.evaluate(()=>{const d=setup.clothes.upper.find(d=>d.outfitPrimary?.lower&&!['broken','split'].includes(d.outfitPrimary.lower)&&Object.keys(d.outfitPrimary).length===1);const lower=setup.clothes.lower.find(x=>x.name===d.outfitPrimary.lower);window.linkedPrimary=structuredClone(d);window.linkedSecondary=structuredClone(lower);for(const i of [linkedPrimary,linkedSecondary]){i.colour='dgw-test-colour';i.accessory_colour='dgw-test-colour'}linkedPrimary.cn_name_cap='套装删除测试';V.wardrobe.upper.push(linkedPrimary);V.wardrobe.lower.push(linkedSecondary);window.savedOutfitsBefore=JSON.stringify(V.outfit);DoLWardrobeUI.refresh()});
 await p.getByRole('button',{name:'整理模式',exact:true}).click();await p.getByRole('searchbox').fill('套装删除测试');
 await p.getByRole('button',{name:'全选当前筛选',exact:true}).click();await p.getByRole('button',{name:'审查丢弃',exact:true}).click();
 assert.ok((await p.locator('.dgw-confirm').textContent()).includes('关联部件'));
 await p.getByRole('button',{name:'退出整理',exact:true}).click();await p.getByRole('button',{name:'整理模式',exact:true}).click();assert.equal(await p.locator('.dgw-confirm').count(),0,'exit clears pending destructive plan');
 await p.getByRole('button',{name:'全选当前筛选',exact:true}).click();await p.getByRole('button',{name:'审查丢弃',exact:true}).click();await p.getByRole('button',{name:'确认丢弃',exact:true}).click();
 await p.waitForFunction(()=>!V.wardrobe.upper.includes(linkedPrimary)&&!V.wardrobe.lower.includes(linkedSecondary));
 await p.waitForFunction(()=>!document.querySelector('.dgw-confirm'));
 assert.equal(await p.evaluate(()=>JSON.stringify(V.outfit)),await p.evaluate(()=>savedOutfitsBefore));
 await p.getByRole('button',{name:'退出整理',exact:true}).click();await p.getByRole('searchbox').fill('');
 // Icons, actual equipped item, capacity, and native outfit splitting.
 await p.waitForFunction(()=>[...document.querySelectorAll('.dgw-item .dgw-clothing-icon img')].some(i=>i.complete&&i.naturalWidth>0));
 assert.equal(await p.locator('.dgw-equipped-badge').textContent(),'已穿戴');
 assert.equal(await p.locator('.dgw-equipped strong').textContent(),await p.locator('.dgw-detail > h3').textContent());
 const capacity=await p.evaluate(()=>({count:V.wardrobe.upper.length,limit:V.wardrobe.space}));
 assert.ok((await p.locator('.dgw-count').textContent()).includes(`${capacity.count} / ${capacity.limit}`));
 await p.getByRole('searchbox').fill('不存在的服装');
 assert.ok((await p.locator('.dgw-count').textContent()).includes(`${capacity.count} / ${capacity.limit}`),'filter never changes ownership capacity');await p.getByRole('searchbox').fill('');
 await p.evaluate(()=>{const d=setup.clothes.upper.find(d=>d.outfitPrimary?.lower&&!['broken','split'].includes(d.outfitPrimary.lower)&&Object.keys(d.outfitPrimary).length===1);const lower=setup.clothes.lower.find(x=>x.name===d.outfitPrimary.lower);window.splitPrimary=structuredClone(d);window.splitSecondary=structuredClone(lower);for(const i of [splitPrimary,splitSecondary]){i.colour=0;i.accessory_colour=0}splitPrimary.cn_name_cap='剪开测试套装';V.wardrobe.upper.push(splitPrimary);V.wardrobe.lower.push(splitSecondary);window.beforeSplitTime=V.timeStamp;window.beforeSplitInventory=JSON.stringify(V.wardrobe);DoLWardrobeUI.refresh()});
 await p.getByRole('button',{name:'整理模式',exact:true}).click();await p.getByRole('searchbox').fill('剪开测试套装');await p.getByRole('button',{name:'全选当前筛选',exact:true}).click();
 await p.getByRole('button',{name:'剪开套装',exact:true}).click();assert.ok((await p.locator('.dgw-confirm').textContent()).includes('10 分钟'));
 await p.getByRole('button',{name:'取消',exact:true}).click();assert.ok(await p.evaluate(()=>JSON.stringify(V.wardrobe)===beforeSplitInventory&&V.timeStamp===beforeSplitTime),'cancel split is readonly');
 await p.getByRole('button',{name:'剪开套装',exact:true}).click();await p.getByRole('button',{name:'确认剪开',exact:true}).click();
 await p.waitForFunction(()=>document.querySelector('.dgw-message').textContent.includes('已剪开 1'));
 assert.ok(await p.evaluate(()=>splitPrimary.one_piece==='split'&&splitSecondary.one_piece==='split'&&splitSecondary.outfitSecondary[1]==='split'&&V.wardrobe.upper.includes(splitPrimary)&&V.wardrobe.lower.includes(splitSecondary)),'native split preserves both separated pieces');
 assert.equal(await p.evaluate(()=>V.timeStamp-beforeSplitTime),600,'native 10 minute time cost');assert.equal(await p.evaluate(()=>V.wardrobeOption),'wear');
 await p.getByRole('button',{name:'全选当前筛选',exact:true}).click();assert.equal(await p.getByRole('button',{name:'剪开套装',exact:true}).isDisabled(),true,'split outfit cannot split again');
 await p.getByRole('button',{name:'退出整理',exact:true}).click();await p.getByRole('searchbox').fill('');
 const layouts=[];
 for(const [name,width,height] of [['tablet',1704,1136],['tablet-portrait',1136,1704],['phone',390,844],['phone-landscape',844,390],['desktop',1440,900]]){
  await p.setViewportSize({width,height});await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{SugarCube.UIBar.stow();scrollTo(0,0)});
  const geometry=await p.locator('.dgw-root').evaluate(e=>({overflow:e.scrollWidth>e.clientWidth+2,canvasVisible:!!e.querySelector('canvas')?.getClientRects().length}));assert.equal(geometry.overflow,false,name);assert.ok(geometry.canvasVisible);layouts.push({name,width,height,...geometry});

  await p.screenshot({path:path.join(__dirname,'artifacts/wardrobe-'+name+'.png'),fullPage:true});
 }
 await p.locator('.dgw-slots button').first().click();
 await p.evaluate(()=>{window.nativeBeforeFallback=document.querySelector('#wardrobeList').innerHTML;DoLMidnightTheme.openSettings()});
 await p.locator('#dmt-wardrobe').selectOption('original');await p.locator('.dmt-close').click();
 await p.waitForFunction(()=>!document.querySelector('.dgw-shell'));assert.ok(await p.evaluate(()=>document.querySelector('#warmthIndicator')===warmthNode&&document.querySelector('#wardrobeList')===nativeList&&document.querySelector('#wardrobeExits')===nativeExits&&document.querySelector('#listoutfits')===nativeOutfits));
 assert.notEqual(await p.evaluate(()=>document.querySelector('#wardrobeList').innerHTML),await p.evaluate(()=>nativeBeforeFallback),'original fallback flushes pending native category');
 await p.evaluate(()=>DoLMidnightTheme.openSettings());
 await p.locator('#dmt-wardrobe').selectOption('new');await p.locator('.dmt-close').click();await p.waitForSelector('.dgw-shell');await p.waitForFunction(()=>document.querySelector('.dgw-preview').getAttribute('aria-busy')==='false');
 // Controlled load failure must discard the old preview, never offer a stale outfit.
 await p.evaluate(()=>{window.compose=Renderer.composeLayers;Renderer.composeLayers=(_c,_l,_f,listener)=>listener.loadError();DoLWardrobeUI.refresh()});
 await p.waitForFunction(()=>document.querySelector('.dgw-render-status').textContent==='本次预览不可用');assert.equal(await p.locator('.dgw-preview canvas').count(),0);
 await p.evaluate(()=>{Renderer.composeLayers=compose;DoLGameUI.destroy()});assert.equal(await p.locator('.dgw-root').count(),0);assert.equal(await p.locator('#wardrobeList').count(),1);assert.ok(await p.evaluate(()=>document.querySelector('#wardrobeExits')===nativeExits));
 const upstreamErrors=errors.filter(e=>e.includes('bannerFallbackImage.onload')&&e.includes("reading 'skybox'"));
 if(upstreamErrors.length){const control=JSON.parse(fs.readFileSync(path.join(__dirname,'artifacts/wardrobe-control.json'),'utf8'));assert.ok(control.errors.some(e=>e.includes('bannerFallbackImage.onload')&&e.includes("reading 'skybox'")),'upstream exclusion requires recorded no-UI reproduction')}
 assert.deepEqual(errors.filter(e=>!upstreamErrors.includes(e)),[]);assert.equal(await p.locator('.error').count(),0);
 fs.writeFileSync(path.join(__dirname,'artifacts/wardrobe-verification'+(process.env.DOL_WARDROBE_INTEGRATED?'-integrated':'')+'.json'),JSON.stringify({passed:true,upstreamErrors,layouts,scope:'Isolated new-game runtime, no user save, no Android device',management:'strip, readonly selection/cancel, stale review abort, indexed batch, linked outfit, saved outfits unchanged, exit clears review, native warmth restore'},null,2));
 console.log('PASS management: strip, cancel, stale plan, shifted indices, linked outfit discard, warmth; direct native wear, one render per wear, zero render on category/search, localized descriptor/colour labels, promoted native controls, five viewports, restoration, load failure, cleanup.');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
