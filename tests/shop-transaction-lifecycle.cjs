const {chromium}=require('playwright'),assert=require('node:assert/strict');

(async()=>{
 const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);
 const vite=await createServer({configFile:false,root:process.cwd(),plugins:[vue(),{name:'shop-transaction-test-page',configureServer(server){server.middlewares.use('/__shop_transaction_test__',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body></body></html>')})}}],optimizeDeps:{noDiscovery:true,include:['vue']},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  await vite.listen();const page=await browser.newPage(),address=vite.httpServer.address();await page.goto(`http://127.0.0.1:${address.port}/__shop_transaction_test__`);
  await page.evaluate(async()=>{
   const [{startShop},{createHost}]=await Promise.all([import('/src/shop/main.ts'),import('/framework/host.ts')]);
   const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   window.__shopTransactionFixture=function({framework=true,definition={variable:'shirt'},buyMultiple=1,execute}){
    document.body.innerHTML='<div id="passages"><div class="passage" data-passage="Clothing Shop"><div id="clothingShop-div"><div id="clothes-list"><div class="clothing-item"><span class="clothing-name"><a class="link-internal">Plain shirt</a></span><span class="clothing-price">£15</span></div><div class="clothing-details"><div class="buy-buttons"><div id="buy-send-home"><div class="buy-button-inner buy-multiple div-link"><a class="link-internal"><span>Buy and send home</span></a></div></div><div id="buy-multiple-slider"><input type="range" min="1" max="10" step="1" value="'+buyMultiple+'"></div><span class="gold">£15</span></div></div></div></div></div></div>';
    const variables={clothingShopSlot:'upper',clothes_choice:0,money:100,buyMultiple,wardrobes:{shopReturn:'wardrobe'},wardrobe:{upper:[{variable:'existing'}]}};
    window.SugarCube={State:{passage:'Clothing Shop',variables}};window.setup={clothes:{upper:[definition]}};window.getClothingCost=()=>15;
    const anchor=document.querySelector('#buy-send-home a'),range=document.querySelector('#buy-multiple-slider input'),price=document.querySelector('.buy-buttons .gold'),counter={calls:0,trusted:false,quantityTrusted:false};
    anchor.addEventListener('click',event=>{counter.calls++;counter.trusted=event.isTrusted;execute?.(variables)});
    range.addEventListener('input',event=>{variables.buyMultiple=Number(event.currentTarget.value);price.textContent=`£${15*variables.buyMultiple}`;counter.quantityTrusted=event.isTrusted});
    const host=framework?createHost(window):undefined,owner=host?.register('shop-transaction-test'),ui=startShop(window,host?{host,owner}:undefined);
    return {variables,counter,anchor,range,host,owner,ui,async select(){document.querySelector('.clothing-item a').click();await frame()},async click(node=anchor){node.click();await frame()},destroy(){ui.destroy();owner?.dispose();host?.dispose()}};
   }
   window.__shopTransactionSuccess=window.__shopTransactionFixture({execute(v){v.money-=15*v.buyMultiple;for(let i=0;i<v.buyMultiple;i++)v.wardrobe.upper.push({variable:'shirt'})}});await frame();
  });
  // Use real keyboard input for native quantity and a real browser click for purchase ordering.
  await page.locator('.clothing-item a').click();
  await page.locator('#buy-multiple-slider input[type="range"]').focus();
  await page.locator('#buy-multiple-slider input[type="range"]').press('ArrowRight');
  await page.waitForFunction(()=>window.SugarCube.State.variables.buyMultiple===2);
  await page.locator('#buy-send-home a').click();
  await page.waitForFunction(()=>document.querySelector('.dgshop-transaction[data-transaction-status="confirmed"]'));
  const success=await page.evaluate(()=>{
   const fixture=window.__shopTransactionSuccess,confirmed=document.querySelector('.dgshop-transaction[data-transaction-status="confirmed"]')?.textContent??'';
   const evidence={calls:fixture.counter.calls,trusted:fixture.counter.trusted,quantityTrusted:fixture.counter.quantityTrusted,amount:fixture.variables.buyMultiple,money:fixture.variables.money,count:fixture.variables.wardrobe.upper.filter(item=>item.variable==='shirt').length};return {confirmed,successEvidence:evidence};
  });
  // Restore only the synthetic fixture's pre-buy baseline, then verify a later quote refresh
  // cannot make this already-consumed native control dispatch again.
  await page.evaluate(()=>{window.__shopTransactionSuccess.variables.money=100});
  await page.locator('#buy-multiple-slider input[type="range"]').focus();
  await page.locator('#buy-multiple-slider input[type="range"]').press('ArrowRight');
  await page.waitForFunction(()=>window.SugarCube.State.variables.buyMultiple===3);
  await page.locator('#buy-send-home a').click();
  await page.waitForFunction(()=>document.querySelector('.dgshop-default-message'));
  const consumedControl=await page.evaluate(()=>{const f=window.__shopTransactionSuccess;const result={calls:f.counter.calls,amount:f.variables.buyMultiple,money:f.variables.money,count:f.variables.wardrobe.upper.filter(item=>item.variable==='shirt').length,staleMessage:document.querySelector('.dgshop-default-message')?.textContent??''};f.destroy();return result});
  const rest=await page.evaluate(async()=>{
   const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))),fixture=window.__shopTransactionFixture;

   const unknown=fixture({});await frame();await unknown.select();await unknown.click();
   const unknownStatus=document.querySelector('.dgshop-transaction[data-transaction-status="unknown"]')?.textContent??'';
   const stale=unknown.anchor,clone=stale.cloneNode(true);let cloneCalls=0;clone.addEventListener('click',()=>cloneCalls++);stale.replaceWith(clone);await frame();await unknown.click(clone);
   const blockedAfterReplacement=unknown.counter.calls===1&&cloneCalls===0&&document.querySelector('.dgshop-transaction[data-transaction-status="unknown"]')?.textContent.includes('不要重复购买');unknown.destroy();

   const unsupported=fixture({definition:{variable:'outfit',outfitPrimary:true},execute(v){v.money-=15;v.wardrobe.upper.push({variable:'outfit'})}});await frame();await unsupported.select();await unsupported.click();
   const unsupportedAvailable=unsupported.counter.calls===1&&unsupported.variables.money===85&&unsupported.variables.wardrobe.upper.length===2;
   const unsupportedNotConfirmed=!document.querySelector('.dgshop-transaction[data-transaction-status="confirmed"]')&&document.querySelector('.dgshop-transaction')?.textContent.includes('不额外确认');unsupported.destroy();

   const classic=fixture({framework:false,execute(v){v.money-=15;v.wardrobe.upper.push({variable:'shirt'})}});await frame();await classic.select();await classic.click();
   const classicNative=classic.counter.calls===1&&classic.variables.money===85&&classic.variables.wardrobe.upper.length===2;
   const classicNoFeedback=!document.querySelector('.dgshop-transaction');classic.destroy();
   return {unknownStatus,blockedAfterReplacement,unsupportedAvailable,unsupportedNotConfirmed,classicNative,classicNoFeedback};
  });
  assert.match(success.confirmed,/已核对/);assert.deepEqual(success.successEvidence,{calls:1,trusted:true,quantityTrusted:true,amount:2,money:70,count:2});
  assert.deepEqual({calls:consumedControl.calls,amount:consumedControl.amount,money:consumedControl.money,count:consumedControl.count},{calls:1,amount:3,money:100,count:2});assert.match(consumedControl.staleMessage,/变化/);
  assert.match(rest.unknownStatus,/未能确认/);assert.equal(rest.blockedAfterReplacement,true,'unknown result blocks a cloned replacement control');
  assert.equal(rest.unsupportedAvailable,true,'unsupported outfit purchase still reaches its native handler');assert.equal(rest.unsupportedNotConfirmed,true,'unsupported purchase receives no confirmed status');
  assert.equal(rest.classicNative,true);assert.equal(rest.classicNoFeedback,true);
  console.log('PASS shop transaction lifecycle: real quantity input and purchase, consumed-control quote refresh, unknown replay, unsupported and classic paths');
 }finally{await browser.close();await vite.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
