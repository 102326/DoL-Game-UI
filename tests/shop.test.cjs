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


 const variant=process.env.DOL_WARDROBE_INTEGRATED?'lyra':'vanilla';
 await p.evaluate(()=>DoLGameUI.setPreference('shopDeferredPaint',true));
 await p.evaluate(()=>{V.money=1000000;SugarCube.Engine.play('Clothing Shop')});await p.waitForSelector('.dgshop-host');
 await p.locator('#clothingShop-div a').filter({hasText:/View All|查看全部|查看所有|全部服/}).first().click();await p.waitForSelector('.clothing-item');
 await p.locator('#textbox--shopnamefiltertextbox').fill('NoSuchClothing_IntegrationTest');
 await p.waitForFunction(()=>document.querySelectorAll('.clothing-item').length===0);
 await p.locator('#textbox--shopnamefiltertextbox').fill('');await p.waitForSelector('.clothing-item');
 await p.locator('.clothing-item').first().click();await p.waitForSelector('.buy-buttons');
 assert.equal(await p.locator('.clothing-item').first().evaluate(e=>getComputedStyle(e).contentVisibility),'auto');
 // Enabling and disabling the adapter preserves native controls and game state.
 await p.evaluate(()=>{window.shopNodes=[...document.querySelectorAll('#clothingShop-div input,#clothingShop-div select,#clothingShop-div a')];window.shopState=JSON.stringify(V);DoLShopUI.setEnabled(false);DoLShopUI.setEnabled(true)});
 assert.equal(await p.evaluate(()=>shopNodes.every(n=>n.isConnected)&&JSON.stringify(V)===shopState),true);
 const colour=p.locator('.colour-options-div.primary .colour-button:has(.bg-blue)').first();await colour.click();
 assert.equal(await p.evaluate(()=>V.colouraction),'blue');
 const price=await p.evaluate(()=>getClothingCost(setup.clothes[V.clothingShopSlot][V.clothes_choice],V.clothingShopSlot));
 await p.waitForTimeout(1200);await p.locator('.dgshop-catalog').evaluate(e=>e.scrollTop=80);await p.waitForTimeout(50);
 const savedScroll=await p.locator('.dgshop-catalog').evaluate(e=>e.scrollTop);
 const before=await p.evaluate(()=>({money:V.money,count:V.wardrobe.upper.length}));
 await p.locator('#buy-send-home .buy-button-inner').click();
 assert.equal(await p.evaluate(()=>V.money),before.money-price,'one native purchase, charged exactly once');
 assert.equal(await p.evaluate(()=>V.wardrobe.upper.length),before.count+1,'one item added');
 await p.waitForTimeout(1200);const scrollAfter=await p.locator('.dgshop-catalog').evaluate(e=>({top:e.scrollTop,max:e.scrollHeight-e.clientHeight}));assert.equal(scrollAfter.top,Math.min(savedScroll,scrollAfter.max),'purchase preserves catalog scroll within new bounds');
 if(!await p.locator('#buy-multiple-slider input').count())await p.locator('.clothing-item').first().click();
 await p.locator('#buy-multiple-slider input').evaluate(e=>{e.value='2';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))});
 assert.equal(await p.evaluate(()=>V.buyMultiple),2);
 const batch=await p.evaluate(()=>({money:V.money,count:V.wardrobe.upper.length}));await p.locator('#buy-send-home .buy-button-inner').click();
 assert.equal(await p.evaluate(()=>V.money),batch.money-price*2);assert.equal(await p.evaluate(()=>V.wardrobe.upper.length),batch.count+2);

 if(!await p.locator('.try-button').count())await p.locator('.clothing-item').first().click();
 const preTry=await p.evaluate(()=>({money:V.money,worn:JSON.stringify(V.worn)}));
 await p.locator('.try-button').first().click();assert.equal(await p.evaluate(()=>V.money),preTry.money,'trial does not charge');
 await p.locator('.try-button').nth(1).click();
 assert.equal(await p.evaluate(()=>JSON.stringify(V.worn)),preTry.worn,'return restores clothing');
 for(const [name,width,height] of [['tablet',1704,1136],['phone',390,844]]){
  await p.setViewportSize({width,height});await p.evaluate(()=>SugarCube.UIBar.stow());await p.locator('.dgshop-host').scrollIntoViewIfNeeded();
  if(width<=900&&!await p.locator('.dgshop-close-detail').isVisible())await p.getByRole('button',{name:'查看商品详情',exact:true}).click();
  await p.screenshot({path:path.join(__dirname,`artifacts/shop-${variant}-${name}.png`)});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'no horizontal page overflow');
  if(width>900){const toolsRect=await p.locator('.dgshop-browse-tools').boundingBox(),catalogRect=await p.locator('.dgshop-catalog').boundingBox();assert.ok(toolsRect.y+toolsRect.height<=catalogRect.y+2,'tools above catalog');assert.ok(toolsRect.width>catalogRect.width,'tools span both columns');const geometry=await p.evaluate(()=>{const c=document.querySelector('.dgshop-catalog').getBoundingClientRect(),d=document.querySelector('.clothing-details').getBoundingClientRect();return {left:c.right,right:d.left,delta:Math.abs(c.top-d.top)}});assert.ok(geometry.left<=geometry.right&&geometry.delta<2,'catalog and details side by side')}
  await p.locator('.dgshop-detail-body').evaluate(e=>e.scrollTop=e.scrollHeight);const footerRect=await p.locator('.dgshop-purchase').boundingBox();assert.ok(footerRect.y+footerRect.height<=height+2,'purchase stays in view '+JSON.stringify({name,height,footerRect}));
  await p.locator('.clothing-colours-div').scrollIntoViewIfNeeded();
  const geometry=await p.locator('.clothing-colours-div').evaluate(e=>{const m=e.querySelector('#mannequin').getBoundingClientRect(),c=e.querySelector('.colours-container').getBoundingClientRect();return {overlap:Math.min(m.right,c.right)>Math.max(m.left,c.left)&&Math.min(m.bottom,c.bottom)>Math.max(m.top,c.top),width:c.width}});
  assert.equal(geometry.overlap,false,'new flex layout must not overlap mannequin and colours');assert.ok(geometry.width>120);
  assert.equal(await p.locator('.colour-options-div.primary .bg-blue').first().isVisible(),true);
  await p.screenshot({path:path.join(__dirname,`artifacts/shop-colours-${variant}-${name}.png`)});
  const buttons=await p.locator('.dgshop-purchase .buy-buttons>.buy-button').boundingBox(),trial=await p.locator('.dgshop-purchase .try-button').first().boundingBox();assert.ok(buttons.height<110,'purchase button stays compact');assert.ok(trial.height>=44,'trial touch target');
  assert.equal(await p.locator('.clothing-item').first().evaluate(e=>getComputedStyle(e).isolation),'isolate','badge stays within card stacking context');
  await p.locator('.filters-button').click();await p.waitForSelector('#filters:not(.hidden)');
  assert.equal(await p.locator('.filters-div').evaluate(e=>e.getBoundingClientRect().right<=innerWidth+1),true);
  // Apply through the native filter control.
  await p.locator('#filters .button-apply').click();
  await p.locator('.clothingshop-options-button').click();await p.waitForSelector('#shop-options:not(.hidden)');await p.locator('#shop-options .button-apply').click();
  if(width<=900){await p.getByRole('button',{name:'返回商品列表',exact:true}).click();assert.equal(await p.locator('.clothing-details').isVisible(),false);await p.getByRole('button',{name:'查看商品详情',exact:true}).click();assert.equal(await p.locator('.clothing-details').isVisible(),true)}

 }
 // More complex garment: secondary colours and pattern controls keep native updates.
 await p.setViewportSize({width:1704,height:1136});
 await p.locator('.clothing-item').filter({hasText:/Evening gown|晚礼服/}).first().click();
 await p.locator('.colour-options-div.secondary .colour-button:has(.bg-red)').click();assert.equal(await p.evaluate(()=>V.accessorycolouraction),'red');
 await p.locator('.colour-options-div.pattern .colour-button').first().click();assert.ok(await p.evaluate(()=>!!V.patternaction));
 await p.locator('.dgshop-detail-body').evaluate(e=>e.scrollTop=0);
 await p.screenshot({path:path.join(__dirname,`artifacts/shop-complex-${variant}-tablet.png`)});
 await p.locator('.colour-options-div.primary .bg-custom').click();await p.waitForSelector('.custom-colour-sliders.primary input');
 assert.equal(await p.locator('.dgshop-purchase #buy-send-home').count(),1);
 await p.locator('.colour-options-div.primary .colour-button:has(.bg-blue)').click();
 // Native mod actions survive wrapping and exact fallback restoration.
 await p.evaluate(()=>{const b=document.createElement('button');b.id='test-shop-mod-button';b.textContent='Mod action';b.onclick=()=>window.shopModClicks=(window.shopModClicks??0)+1;document.querySelector('#clothes-list').append(b)});
 await p.locator('#test-shop-mod-button').click();assert.equal(await p.evaluate(()=>window.shopModClicks),1);
 await p.waitForTimeout(1200);await p.evaluate(()=>DoLShopUI.setEnabled(false));
 const originalHTML=await p.locator('#clothes-list').innerHTML();
 await p.evaluate(()=>{DoLShopUI.setEnabled(true);DoLShopUI.setEnabled(false)});
 assert.equal(await p.locator('#clothes-list').innerHTML(),originalHTML,'exact native fallback DOM order');
 await p.evaluate(()=>DoLShopUI.setEnabled(true));await p.locator('#test-shop-mod-button').click();assert.equal(await p.evaluate(()=>window.shopModClicks),2);
 await p.evaluate(()=>{V.money=0;new SugarCube.Wikifier(null,'<<updateclotheslist>>')});
 assert.equal(await p.locator('.buy-buttons a').count(),0,'insufficient money retains native lock');
 await p.evaluate(()=>DoLShopUI.setEnabled(false));assert.equal(await p.locator('.dgshop-host').count(),0);assert.equal(await p.locator('.dgshop-content').count(),0);
 await p.evaluate(()=>DoLShopUI.setEnabled(true));await p.waitForSelector('.dgshop-host');
 const beforeProgressive=await p.evaluate(()=>DoLShopUI.getLifecycleCounts());
 await p.waitForTimeout(3500); // Native shop progressively appends its remaining pages; allow that queue to settle before the isolated mutation check.
 const counts=await p.evaluate(()=>DoLShopUI.getLifecycleCounts());
 assert.ok(counts.fastPaths>=beforeProgressive.fastPaths,'native page appends may use the guarded fast path when observed');
 await p.locator('.clothing-item').first().click();await p.waitForTimeout(1000);
 const beforeInjectedPage=await p.evaluate(()=>DoLShopUI.getLifecycleCounts());
 await p.evaluate(()=>{const pages=document.querySelector('#shop-list-pages'),source=document.querySelector('.dgshop-selected')||document.querySelector('.clothing-item');const page=document.createElement('div');page.id='test-fast-page';page.className='clothing-shop-page';const clone=source.cloneNode(true);clone.classList.remove('dgshop-selected');page.append(clone);pages.append(page);const link=document.querySelector('.dgshop-native-header a.link-internal.macro-link');if(!link)throw Error('native header link missing');const marker=document.createTextNode('(1) ');link.prepend(marker);window.testNumberingMarker=marker});
 await p.waitForTimeout(0);
 const afterFastPath=await p.evaluate(()=>DoLShopUI.getLifecycleCounts());
 assert.equal(afterFastPath.scans,beforeInjectedPage.scans,'page and hotkey-number text mutations keep full refresh count stable '+JSON.stringify({before:beforeInjectedPage,after:afterFastPath}));
 assert.ok(afterFastPath.fastPaths>beforeInjectedPage.fastPaths,'page and hotkey-number text mutations use the fast path');
 await p.waitForFunction(()=>document.querySelector('#test-fast-page .clothing-item')?.classList.contains('dgshop-selected'));
 await p.evaluate(()=>{document.querySelector('#test-fast-page')?.remove();window.testNumberingMarker?.remove();delete window.testNumberingMarker});
 await p.waitForTimeout(300);
 const beforeUnrelated=await p.evaluate(()=>DoLShopUI.getLifecycleCounts());
 await p.evaluate(()=>{const e=document.createElement('span');document.body.append(e);e.textContent='unrelated';e.remove()});await p.waitForTimeout(100);
 assert.deepEqual(await p.evaluate(()=>DoLShopUI.getLifecycleCounts()),beforeUnrelated);
 await p.evaluate(()=>DoLGameUI.openSettings());await p.getByRole('button',{name:'回退原版界面',exact:true}).click();
 assert.equal(await p.evaluate(()=>DoLShopUI.getEnabled()),false);assert.equal(await p.locator('.dgshop-host').count(),0);
 await p.getByRole('button',{name:'启用新版界面',exact:true}).click();await p.locator('.dmt-close').click();await p.waitForSelector('.dgshop-host');
 await p.evaluate(()=>SugarCube.Engine.play('Bedroom'));await p.waitForTimeout(1200);assert.equal(await p.locator('.dgshop-host').count(),0);
 // Saved defaults apply on entry, not on each native list replacement.
 await p.evaluate(()=>{V.money=1000000;SugarCube.Engine.play('Clothing Shop')});await p.waitForSelector('.dgshop-host');
 await p.locator('#clothingShop-div a').filter({hasText:/View All|查看全部|查看所有|全部服/}).first().click();await p.waitForSelector('.clothing-item');
 await p.locator('[aria-label="进店默认服装类型"]').selectOption('female');await p.waitForTimeout(400);
 assert.deepEqual(await p.evaluate(()=>V.shopClothingFilter.gender),{female:true,neutral:true,male:false});
 assert.equal(await p.evaluate(()=>localStorage.getItem('DoLGameUI.shop.defaultGender')),'female');
 assert.equal(await p.evaluate(()=>applyClothingShopFilters(setup.clothes.upper).some(x=>x.gender==='m')),false);
 await p.evaluate(()=>{V.shopClothingFilter.gender.male=true;new SugarCube.Wikifier(null,'<<updateclotheslist>>')});await p.waitForTimeout(400);
 assert.equal(await p.evaluate(()=>V.shopClothingFilter.gender.male),true,'temporary native filter is not overwritten');
 await p.evaluate(()=>SugarCube.Engine.play('Bedroom'));await p.waitForTimeout(100);
 await p.evaluate(()=>SugarCube.Engine.play('Clothing Shop'));await p.waitForSelector('.dgshop-host');await p.waitForTimeout(400);
 await p.locator('#clothingShop-div a').filter({hasText:/View All|查看全部|查看所有|全部服/}).first().click();await p.waitForSelector('.clothing-item');await p.waitForTimeout(400);
 assert.equal(await p.evaluate(()=>V.shopClothingFilter.gender.male),false,'saved default returns on reentry');
 for(const [value,gender] of [['female-only','f'],['male-only','m']]){
  await p.locator('[aria-label="进店默认服装类型"]').selectOption(value);await p.waitForTimeout(400);
  assert.deepEqual(await p.evaluate(()=>V.shopClothingFilter.gender),{female:gender==='f',neutral:false,male:gender==='m'});
  const genders=await p.evaluate(()=>applyClothingShopFilters(setup.clothes.upper).map(x=>x.gender));
  assert.ok(genders.length>0&&genders.every(x=>x===gender),'exclusive gender filtering '+value);
  assert.equal(await p.evaluate(()=>localStorage.getItem('DoLGameUI.shop.defaultGender')),value);
 }
 await p.locator('[aria-label="进店默认服装类型"]').selectOption('all');await p.waitForTimeout(400);
 assert.deepEqual(await p.evaluate(()=>V.shopClothingFilter.gender),{female:true,neutral:true,male:true});
 await p.locator('[aria-label="进店默认服装类型"]').selectOption('game');
 await p.evaluate(()=>{V.shopClothingFilter.gender.female=false;new SugarCube.Wikifier(null,'<<updateclotheslist>>')});await p.waitForTimeout(200);
 assert.equal(await p.evaluate(()=>V.shopClothingFilter.gender.female),false,'game mode leaves native filter untouched');
 const unexpected=errors.filter(e=>!e.includes('bannerFallbackImage.onload')||!e.includes('skybox'));assert.deepEqual(unexpected,[]);
 console.log('PASS shop',variant,'native purchase/colour/trial/return, insufficient money, responsive filters, fallback and lifecycle');
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
