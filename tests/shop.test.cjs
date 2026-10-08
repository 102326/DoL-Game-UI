const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const out=process.env.DOL_TEST_OUT||path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
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
 await p.evaluate(()=>{DoLShopUI.setDefaultGender('female');V.money=1000000;SugarCube.Engine.play('Clothing Shop')});await p.waitForSelector('.dgshop-host');
 await p.waitForSelector('.dgshop-entry-categories');
 const entryBaseline=await p.evaluate(()=>{
  const shop=document.querySelector('#clothingShop-div');
  window.entryLinks=[...shop.querySelectorAll('.dgshop-entry-category a')];
  const state=JSON.stringify(V);DoLShopUI.setEnabled(false);
  const native=shop.innerHTML,links=entryLinks.every(n=>n.isConnected);
  DoLShopUI.setEnabled(true);DoLShopUI.setEnabled(false);
  const exact=shop.innerHTML===native;DoLShopUI.setEnabled(true);
  return{count:entryLinks.length,links,exact,state:JSON.stringify(V)===state};
 });
 assert.ok(entryBaseline.count>=13);assert.ok(entryBaseline.links&&entryBaseline.exact&&entryBaseline.state,'entry restoration preserves original nodes, order and state');
 for(const width of [390,1363]){
  await p.setViewportSize({width,height:876});
  for(const scale of [100,150,200]){
   await p.evaluate(scale=>{DoLGameUI.setPreference('fontScale',scale);DoLGameUI.setPreference('buttonScale',scale)},scale);
   assert.ok(await p.locator('.dgshop-entry-categories').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'entry grid fits available width');
  }
 }
 await p.evaluate(()=>{DoLGameUI.setPreference('fontScale',100);DoLGameUI.setPreference('buttonScale',100)});
 await p.setViewportSize({width:1704,height:1136});
 await p.locator('#clothingShop-div a').filter({hasText:/View All|查看全部|查看所有|全部服/}).first().click();await p.waitForSelector('.clothing-item');
 assert.equal(await p.locator('.dgshop-entry-categories').count(),0,'native one-click category transition removes entry layout');
 await p.locator('#textbox--shopnamefiltertextbox').fill('NoSuchClothing_IntegrationTest');
 await p.waitForFunction(()=>document.querySelectorAll('.clothing-item').length===0);
 await p.locator('#textbox--shopnamefiltertextbox').fill('');await p.waitForSelector('.clothing-item');
 await p.locator('.clothing-item').first().click();await p.waitForSelector('.buy-buttons');
 assert.equal(await p.locator('.clothing-item').first().evaluate(e=>getComputedStyle(e).contentVisibility),'auto');
 // Eyes visuals stay local; native swatches and action labels keep their semantics.
 const visualNodes=await p.evaluateHandle(()=>[...document.querySelectorAll('#clothingShop-div input,#clothingShop-div select,#clothingShop-div a')]);
 const swatchBefore=await p.locator('.colour-options-div.primary .bg-blue').first().evaluate(e=>getComputedStyle(e).backgroundColor);
 await p.evaluate(()=>{DoLGameUI.setPreference('visualPattern',true);DoLGameUI.setPreference('visualTier',2)});
 await p.waitForTimeout(200); // Let the existing 150ms product background transition settle.
 assert.equal(await p.locator('.dgshop-host').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(37, 38, 42)');
 const selectionPrefs=await p.evaluate(()=>DoLGameUI.getPreferences());
 for(const tier of [0,1,2]){
  await p.evaluate(tier=>{DoLGameUI.setPreference('visualTier',tier);DoLGameUI.setPreference('visualGlow',true)},tier);
  await p.waitForTimeout(200);
  for(const selector of ['.category-tab.active','.dgshop-selected','.dgshop-purchase .buy-buttons>.buy-button']){
   const quiet=await p.locator(selector).first().evaluate(e=>{const c=getComputedStyle(e),rgb=c.backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number);return{neutral:Math.max(...rgb)-Math.min(...rgb)<=8,noTexture:c.backgroundImage==='none',noBlur:c.backdropFilter==='none',weakEdge:Number(c.borderTopColor.match(/[\d.]+/g)[3]??1)<=.1,indicator:c.boxShadow.includes('inset'),animation:getComputedStyle(e,'::after').animationName}});
   assert.ok(quiet.neutral&&quiet.noTexture&&quiet.noBlur&&quiet.weakEdge&&quiet.indicator,'quiet shop selection '+JSON.stringify({tier,selector,quiet}));
   assert.equal(quiet.animation,'none','shop selection has no legacy Fancy sweep');
  }
 }
 await p.evaluate(prefs=>{DoLGameUI.setPreference('visualTier',prefs.visualTier);DoLGameUI.setPreference('visualGlow',prefs.visualGlow)},selectionPrefs);
 assert.equal(await p.locator('.category-tab.active>img').first().evaluate(e=>getComputedStyle(e).filter),'none','native active category icon remains readable on dark surface');
 assert.notEqual(await p.locator('.dgshop-toolbar').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
 assert.equal(await p.locator('.colour-options-div.primary .bg-blue').first().evaluate(e=>getComputedStyle(e).backgroundColor),swatchBefore);
 assert.ok(await p.evaluate(nodes=>nodes.every(n=>n.isConnected),visualNodes));await visualNodes.dispose();
 await p.evaluate(()=>{DoLGameUI.setPreference('visualPattern',false);DoLGameUI.setPreference('visualTier',0)});
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
 // Selecting the product again resets native colours; explicitly choose the batch colour.
 await colour.click();
 const batch=await p.evaluate(()=>({money:V.money,count:V.wardrobe.upper.length}));await p.locator('#buy-send-home .buy-button-inner').click();
 assert.equal(await p.evaluate(()=>V.money),batch.money-price*2);assert.equal(await p.evaluate(()=>V.wardrobe.upper.length),batch.count+2);

 if(!await p.locator('.try-button').count())await p.locator('.clothing-item').first().click();
 const preTry=await p.evaluate(()=>({money:V.money,worn:JSON.stringify(V.worn)}));
 await p.locator('.try-button').first().click();assert.equal(await p.evaluate(()=>V.money),preTry.money,'trial does not charge');
 await p.locator('.try-button').nth(1).click();
 assert.equal(await p.evaluate(()=>JSON.stringify(V.worn)),preTry.worn,'return restores clothing');
 // A wide viewport with a narrow native shop must not retain two cramped columns.
 await p.setViewportSize({width:1363,height:900});
 await p.locator('#clothingShop-div').evaluate(n=>{n.style.width='460px';n.style.padding='12px';n.style.boxSizing='content-box'});await p.waitForTimeout(100);
 assert.ok(await p.locator('#shopCategories').isVisible(),'padding cannot hide categories without a compact disclosure');
 assert.equal(await p.locator('.dgshop-categories-toggle').count(),0);
 await p.locator('#clothingShop-div').evaluate(n=>{n.style.removeProperty('padding');n.style.removeProperty('box-sizing')});
 await p.locator('#clothingShop-div').evaluate(n=>n.style.width='550px');await p.waitForTimeout(100);
 const containerCheck=await p.locator('#clothingShop-div').evaluate(n=>({width:n.clientWidth,overflow:n.scrollWidth>n.clientWidth+2,narrow:n.classList.contains('dgshop-narrow'),columns:getComputedStyle(n.querySelector('.dgshop-layout')).gridTemplateColumns}));
 assert.equal(containerCheck.width,550);assert.equal(containerCheck.narrow,true);assert.equal(containerCheck.overflow,false);assert.equal(containerCheck.columns.split(' ').length,1);
 await p.locator('.dgshop-close-detail').click();assert.equal(await p.locator('.clothing-details').isVisible(),false);await p.getByRole('button',{name:'查看商品详情',exact:true}).click();assert.ok(await p.locator('.buy-buttons').isVisible());
 await p.screenshot({path:path.join(out,`shop-container550-${variant}.png`)});
 await p.locator('#clothingShop-div').evaluate(n=>n.style.removeProperty('width'));await p.waitForTimeout(100);
 for(const [name,width,height] of [['tablet',1704,1136],['phone',390,844]]){
  await p.setViewportSize({width,height});await p.evaluate(()=>SugarCube.UIBar.stow());await p.locator('.dgshop-host').scrollIntoViewIfNeeded();
  if(width===390){
   if(await p.locator('.dgshop-close-detail').isVisible())await p.locator('.dgshop-close-detail').click();
   await p.waitForSelector('.dgshop-categories-toggle');
   await p.evaluate(()=>{window.phoneCategories=[...document.querySelectorAll('#shopCategories a')].map(n=>({node:n,parent:n.parentNode,next:n.nextSibling}))});
   assert.equal(await p.locator('#shopCategories').isVisible(),false);
   await p.locator('.dgshop-categories-toggle').click();assert.ok(await p.locator('#shopCategories').isVisible());
   assert.ok(await p.locator('#shopCategories .category-tab').evaluateAll(ns=>ns.length>0&&ns.every(n=>n.getBoundingClientRect().height>=44)));
   assert.ok(await p.evaluate(()=>phoneCategories.every(x=>x.node.isConnected&&x.node.parentNode===x.parent&&x.node.nextSibling===x.next)),'category disclosure preserves native nodes and order');
   await p.locator('.dgshop-categories-toggle').click();
   assert.ok(await p.locator('.dgshop-catalog').evaluate(n=>n.scrollWidth<=n.clientWidth+2),'native trait boxes fit phone catalog');
   assert.equal(await p.locator('.dgshop-entry-settings').evaluate(n=>n.open),false);
   await p.locator('.dgshop-entry-settings summary').click();assert.ok(await p.getByLabel('进店默认服装类型').isVisible());await p.locator('.dgshop-entry-settings summary').click();
  }
  if(width<=900&&!await p.locator('.dgshop-close-detail').isVisible())await p.getByRole('button',{name:'查看商品详情',exact:true}).click();
  if(width<=900){
   const beforeDismiss=await p.evaluate(()=>JSON.stringify(V));
   await p.locator('.dgshop-detail-body').click({position:{x:8,y:8}});assert.ok(await p.locator('.clothing-details').isVisible(),'inside detail stays open');
   const drawer=await p.locator('.clothing-details').boundingBox();assert.ok(drawer.y>0);
   assert.equal(await p.evaluate(y=>document.elementFromPoint(innerWidth/2,y)?.classList.contains('dgshop-detail-backdrop'),drawer.y/2),true,'blank area hits backdrop, not native controls');
   await p.mouse.click(width/2,drawer.y/2);assert.equal(await p.locator('.clothing-details').isVisible(),false);
   assert.equal(await p.evaluate(()=>JSON.stringify(V)),beforeDismiss,'dismiss never activates a native operation');
   await p.getByRole('button',{name:'查看商品详情',exact:true}).click();
   const prefs=await p.evaluate(()=>DoLGameUI.getPreferences()),detail=p.locator('.dgshop-open-detail');
   await p.keyboard.press('Tab');await detail.focus();
   for(const [tier,glow] of [[2,true],[2,false],[0,true]]){
    await p.evaluate(([tier,glow])=>{DoLGameUI.setPreference('visualTier',tier);DoLGameUI.setPreference('visualGlow',glow)},[tier,glow]);
    assert.equal(await detail.evaluate(e=>getComputedStyle(e).backgroundImage!=='none'),tier===2&&glow,'narrow shop toolbar focus light follows tier/glow');
   }
   await p.evaluate(prefs=>{DoLGameUI.setPreference('visualTier',prefs.visualTier);DoLGameUI.setPreference('visualGlow',prefs.visualGlow)},prefs);
   await detail.evaluate(e=>e.blur());
  }
  // Long translated shortcut labels must fit, including independent font/button scaling.
  const clear=p.locator('.dgshop-browse-tools .searchGroup button');const oldText=await clear.textContent();
  await clear.evaluate(e=>e.textContent='(Shift + 0) 清零搜索条件');
  for(const [font,button] of [[50,50],[100,100],[200,200],[200,50],[50,200]]){
   await p.evaluate(([font,button])=>{DoLGameUI.setPreference('fontScale',font);DoLGameUI.setPreference('buttonScale',button)},[font,button]);
   const tools=await p.evaluate(()=>{
    const b=document.querySelector('.dgshop-browse-tools .searchGroup button'),label=document.querySelector('.itemsPerPageLabel'),bar=document.querySelector('.dgshop-browse-tools .optionsBar');
    const r=b.getBoundingClientRect(),l=label.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(b);
    return {page:document.documentElement.scrollWidth<=innerWidth+2,bar:bar.scrollWidth<=bar.clientWidth+2,text:[...range.getClientRects()].every(t=>t.left>=r.left-1&&t.right<=r.right+1&&t.top>=r.top-1&&t.bottom<=r.bottom+1),separate:Math.min(r.right,l.right)<=Math.max(r.left,l.left)+1||Math.min(r.bottom,l.bottom)<=Math.max(r.top,l.top)+1};
   });
   assert.ok(Object.values(tools).every(Boolean),'search controls fit '+JSON.stringify({width,font,button,tools}));
   await p.waitForTimeout(250);
   const pager=await p.locator('#shop-pagination').evaluate(e=>{const r=e.getBoundingClientRect(),buttons=[...e.querySelectorAll('.btn-pagination')];return {within:e.scrollWidth<=e.clientWidth+2,buttons:buttons.every(b=>{const q=b.getBoundingClientRect();return q.width>=44&&q.height>=44&&q.left>=r.left-1&&q.right<=r.right+1}),height:r.height};});
   assert.ok(pager.within&&pager.buttons&&pager.height<220,'pagination fits '+JSON.stringify({width,font,button,pager}));
  }
  await clear.evaluate((e,text)=>e.textContent=text,oldText);
  await p.evaluate(()=>{DoLGameUI.setPreference('fontScale',100);DoLGameUI.setPreference('buttonScale',100)});
  await p.screenshot({path:path.join(out,`shop-${variant}-${name}.png`)});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'no horizontal page overflow');
  if(width>900){const toolsRect=await p.locator('.dgshop-browse-tools').boundingBox(),catalogRect=await p.locator('.dgshop-catalog').boundingBox();assert.ok(toolsRect.y+toolsRect.height<=catalogRect.y+2,'tools above catalog');assert.ok(toolsRect.width>catalogRect.width,'tools span both columns');const geometry=await p.evaluate(()=>{const c=document.querySelector('.dgshop-catalog').getBoundingClientRect(),d=document.querySelector('.clothing-details').getBoundingClientRect();return {left:c.right,right:d.left,delta:Math.abs(c.top-d.top)}});assert.ok(geometry.left<=geometry.right&&geometry.delta<2,'catalog and details side by side')}
  await p.locator('.dgshop-detail-body').evaluate(e=>e.scrollTop=e.scrollHeight);const footerRect=await p.locator('.dgshop-purchase').boundingBox();assert.ok(footerRect.y+footerRect.height<=height+2,'purchase stays in view '+JSON.stringify({name,height,footerRect}));
  await p.locator('.clothing-colours-div').scrollIntoViewIfNeeded();
  const geometry=await p.locator('.clothing-colours-div').evaluate(e=>{const m=e.querySelector('#mannequin').getBoundingClientRect(),c=e.querySelector('.colours-container').getBoundingClientRect();return {overlap:Math.min(m.right,c.right)>Math.max(m.left,c.left)&&Math.min(m.bottom,c.bottom)>Math.max(m.top,c.top),width:c.width}});
  assert.equal(geometry.overlap,false,'new flex layout must not overlap mannequin and colours');assert.ok(geometry.width>120);
  assert.equal(await p.locator('.colour-options-div.primary .bg-blue').first().isVisible(),true);
  await p.screenshot({path:path.join(out,`shop-colours-${variant}-${name}.png`)});
  const buttons=await p.locator('.dgshop-purchase .buy-buttons>.buy-button').boundingBox(),trial=await p.locator('.dgshop-purchase .try-button').first().boundingBox();assert.ok(buttons.height<110,'purchase button stays compact');assert.ok(trial.height>=44,'trial touch target');
  assert.equal(await p.locator('.clothing-item').first().evaluate(e=>getComputedStyle(e).isolation),'isolate','badge stays within card stacking context');
  if(width<=900)await p.locator('.dgshop-close-detail').click();
  await p.locator('.filters-button').click();await p.waitForSelector('#filters:not(.hidden)');
  assert.equal(await p.locator('.filters-div').evaluate(e=>e.getBoundingClientRect().right<=innerWidth+1),true);
  assert.ok(await p.locator('#filters .filter-button').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>=44)),'native filter actions retain touch areas');
  const filterNodes=await p.locator('#filters').evaluateHandle(e=>[...e.querySelectorAll('*')]);
  const popupState=await p.evaluate(()=>({V:JSON.stringify(V),prefs:DoLGameUI.getPreferences()}));
  for(const tier of [0,1,2]){
   await p.evaluate(t=>{DoLGameUI.setPreference('visualGlass',true);DoLGameUI.setPreference('visualTier',t)},tier);
   assert.equal(await p.locator('.filters-div').evaluate(e=>getComputedStyle(e).backdropFilter),tier?'blur(24px)':'none','shop popup follows visual tier');
   assert.equal(await p.locator('.filter-block').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','filter sections are not nested cards');
  }
  await p.evaluate(()=>DoLGameUI.setPreference('visualGlass',false));
  assert.equal(await p.locator('.filters-div').evaluate(e=>getComputedStyle(e).backdropFilter),'none','glass switch releases shop blur');
  assert.ok(await p.evaluate(nodes=>nodes.every(n=>n.isConnected),filterNodes));await filterNodes.dispose();
  assert.equal(await p.evaluate(()=>JSON.stringify(V)),popupState.V,'popup material never writes game state');
  await p.evaluate(prefs=>{DoLGameUI.setPreference('visualGlass',prefs.visualGlass);DoLGameUI.setPreference('visualTier',prefs.visualTier)},popupState.prefs);
  // Apply through the native filter control.
  await p.locator('#filters .button-apply').click();
  await p.locator('.clothingshop-options-button').click();await p.waitForSelector('#shop-options:not(.hidden)');
  assert.ok(await p.locator('.options-div').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'native options do not overflow');
  assert.ok(await p.locator('.options-body label').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>=44)),'native option labels retain touch areas');
  await p.locator('#shop-options .button-apply').click();
  const legend=p.locator('#shop-legend');const legendHTML=await legend.innerHTML();
  await p.locator('.shop-legend-button').click();await p.waitForSelector('#shop-legend:not(.hidden)');
  assert.ok(await p.locator('.shop-legend-button').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),'native V1 explanation does not cover its toggle');
  assert.equal(await legend.innerHTML(),legendHTML,'V1 explanation content stays intact');
  await p.locator('.shop-legend-button').click();await p.waitForSelector('#shop-legend.hidden',{state:'attached'});
  if(width<=900){assert.equal(await p.locator('.clothing-details').isVisible(),false);await p.getByRole('button',{name:'查看商品详情',exact:true}).click();assert.equal(await p.locator('.clothing-details').isVisible(),true)}

 }
 await p.setViewportSize({width:1704,height:1136});
 await p.waitForTimeout(250);
 assert.equal(await p.evaluate(()=>($._data(document.querySelector('#shop-pagination .next'),'events')?.click||[]).length),1,'entry default filter must not double-bind native forwarding');
 const firstPage=await p.evaluate(()=>V.shopPage);
 const pageDots=await p.locator('#shop-pagination .shop-pages>.page').count();
 assert.ok(pageDots>1);
 assert.ok(await p.locator('#shop-pagination>.shop-pages-number').isVisible(),'native current/total counter is visible');
 assert.equal(await p.locator('#shop-pagination .shop-pages').isVisible(),false,'long dot strip is suppressed only in the adapter');
 const pageLabel=(await p.locator('#shop-pagination>.shop-pages-number').textContent()).trim();
 await p.locator('#shop-pagination .next').click();
 await p.waitForFunction(page=>V.shopPage===page+1,firstPage);
 assert.notEqual((await p.locator('#shop-pagination>.shop-pages-number').textContent()).trim(),pageLabel,'native counter updates with native forwarding');
 await p.locator('#shop-pagination .prev').click();
 await p.waitForFunction(page=>V.shopPage===page,firstPage);
 assert.equal((await p.locator('#shop-pagination>.shop-pages-number').textContent()).trim(),pageLabel);
 assert.equal(await p.locator('#shop-pagination .shop-pages>.page').count(),pageDots,'original direct-page controls remain available to fallback');
 // More complex garment: secondary colours and pattern controls keep native updates.
 await p.setViewportSize({width:1704,height:1136});
 await p.locator('.clothing-item').filter({hasText:/Evening gown|晚礼服/}).first().click();
 await p.locator('.colour-options-div.secondary .colour-button:has(.bg-red)').click();assert.equal(await p.evaluate(()=>V.accessorycolouraction),'red');
 await p.locator('.colour-options-div.pattern .colour-button').first().click();assert.ok(await p.evaluate(()=>!!V.patternaction));
 await p.locator('.dgshop-detail-body').evaluate(e=>e.scrollTop=0);
 await p.screenshot({path:path.join(out,`shop-complex-${variant}-tablet.png`)});
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
 assert.equal(await p.locator('#test-fast-page .clothing-item').evaluate(n=>n.classList.contains('dgshop-selected')),false,'same-name clone is not the selected native control');
 await p.evaluate(()=>{document.querySelector('#test-fast-page')?.remove();window.testNumberingMarker?.remove();delete window.testNumberingMarker});
 await p.waitForTimeout(300);
 const beforeUnrelated=await p.evaluate(()=>DoLShopUI.getLifecycleCounts());
 await p.evaluate(()=>{const e=document.createElement('span');document.body.append(e);e.textContent='unrelated';e.remove()});await p.waitForTimeout(100);
 assert.deepEqual(await p.evaluate(()=>DoLShopUI.getLifecycleCounts()),beforeUnrelated);
 const savedShopChoice=await p.evaluate(()=>DoLShopUI.getEnabled());
 await p.evaluate(()=>DoLGameUI.openSettings());await p.getByRole('button',{name:'回退原版界面',exact:true}).click();
 assert.equal(await p.evaluate(()=>DoLGameUI.getPreferences().enabled),false);
 assert.equal(await p.evaluate(()=>DoLShopUI.getEnabled()),savedShopChoice,'master fallback preserves the per-page choice');assert.equal(await p.locator('.dgshop-host').count(),0);
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
 // Complete the shop -> wardrobe -> save roundtrip in this isolated browser.
 assert.equal(await p.evaluate(()=>V.wardrobe.upper.length),batch.count+2,'all delivered purchases survive shop navigation');
 const delivered=await p.evaluate(()=>{const i=V.wardrobe.upper.at(-1);return {variable:i.variable,colour:i.colour}});
 assert.equal(delivered.colour,'blue','delivered item retains chosen colour');
 await p.evaluate(()=>{V.location='home';V.wardrobe_location='wardrobe';V.lastWardrobeSlot='upper';SugarCube.Engine.play('Wardrobe')});
 await p.waitForSelector('.dgw-shell');
 const deliveredKey=await p.evaluate(()=>[...document.querySelectorAll('.dgw-item')].find(n=>Number(n.dataset.key.split(':')[1])===V.wardrobe.upper.length-1).dataset.key);
 await p.locator(`.dgw-item[data-key="${deliveredKey}"]`).click();
 assert.deepEqual(await p.evaluate(()=>({variable:V.worn.upper.variable,colour:V.worn.upper.colour})),delivered,'wardrobe equips the purchased item');
 // A native passage transition commits live V changes to the history snapshot.
 await p.evaluate(async()=>{SugarCube.Engine.play('Bedroom');await idb.saveState(1)});
 const inventorySnapshot=()=>JSON.parse(JSON.stringify({money:V.money,wardrobe:V.wardrobe,worn:V.worn,timeStamp:V.timeStamp}));
 const saved=await p.evaluate(inventorySnapshot);
 const exported=await p.evaluate(()=>SugarCube.Save.serialize());
 assert.equal(typeof exported,'string');
 await p.reload({waitUntil:'load'});
 await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options);
 assert.equal(await p.evaluate(()=>!!window.DoLGameUI),false,'fresh native runtime has no injected UI');
 await p.evaluate(async()=>{await idb.getSaveDetails();await idb.loadState(1)});
 assert.deepEqual(await p.evaluate(inventorySnapshot),saved,'native IDB load preserves money, full wardrobe, worn items and game time');
 await p.evaluate(()=>{V.money=1;V.wardrobe.upper=[]});
 assert.notEqual(await p.evaluate(data=>SugarCube.Save.deserialize(data),exported),false);
 assert.deepEqual(await p.evaluate(inventorySnapshot),saved,'native serialized import restores purchases and worn state');
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
 await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 await p.evaluate(()=>SugarCube.Engine.play('Wardrobe'));await p.waitForSelector('.dgw-shell');
 assert.deepEqual(await p.evaluate(()=>({variable:V.worn.upper.variable,colour:V.worn.upper.colour})),delivered,'UI can reopen the loaded wardrobe');
 assert.equal(await p.locator('.error').count(),0);
 console.log('PASS purchase -> wardrobe equip -> IDB/export -> no-UI load/import -> UI wardrobe',variant);
 const unexpected=errors.filter(e=>!e.includes('bannerFallbackImage.onload')||!e.includes('skybox'));assert.deepEqual(unexpected,[]);
 console.log('PASS shop',variant,'native purchase/colour/trial/return, insufficient money, responsive filters, fallback and lifecycle');
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
