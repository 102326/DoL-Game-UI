const {chromium}=require('playwright'),{buildSync}=require('esbuild'),assert=require('node:assert/strict');
const code=buildSync({entryPoints:['src/shop/source.ts'],bundle:true,format:'iife',globalName:'ShopStoneFreeTest',write:false}).outputFiles[0].text;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage();await page.setContent('<div id="shop"><div class="clothing-item"><span class="clothing-name"><a class="link-internal">Coat A</a></span><span class="clothing-price">£15</span></div><div class="clothing-item"><span class="clothing-name"><a class="link-internal">Coat B (owned)</a></span><span class="clothing-price">£20</span></div></div>');await page.addScriptTag({content:code});
 const result=await page.evaluate(()=>{
  const shop=document.querySelector('#shop'),source=ShopStoneFreeTest.createShopSource(shop,()=>true,()=>({variables:{money:100},definition:{}}));
  const items=[...shop.querySelectorAll('.clothing-item')];source.select(items[0]);const a=ShopStoneFreeTest.copyShopItem(source.read().selected);
  source.select(items[1]);const b=ShopStoneFreeTest.copyShopItem(source.read().selected);
  items[0].querySelector('.clothing-name a').textContent='Changed later';items[0].querySelector('.clothing-price').textContent='£0';source.destroy();
  return {a,b,aKeys:Object.keys(a),bKeys:Object.keys(b),frozen:Object.isFrozen(a)&&Object.isFrozen(b)};
 });
 assert.deepEqual(result.a,{title:'Coat A',price:'£15',owned:'Coat A'});
 assert.deepEqual(result.b,{title:'Coat B (owned)',price:'£20',owned:'Coat B (owned)'});
 assert.deepEqual(result.aKeys,['title','price','owned']);assert.deepEqual(result.bKeys,['title','price','owned']);assert.equal(result.frozen,true);
 console.log('PASS shop A/B references copy only immutable native display facts');
 const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);
 const vite=await createServer({configFile:false,root:process.cwd(),plugins:[vue(),{name:'shop-test-page',configureServer(server){server.middlewares.use('/__r11_test__',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body></body></html>')})}}],optimizeDeps:{noDiscovery:true,include:['vue']},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 try{await vite.listen();const address=vite.httpServer.address(),page2=await browser.newPage();await page2.goto(`http://127.0.0.1:${address.port}/__r11_test__`);
  const lifecycle=await page2.evaluate(async()=>{
   const [{startShop},{createHost}]=await Promise.all([import('/src/shop/main.ts'),import('/framework/host.ts')]);
   document.body.innerHTML='<div id="passages"><div class="passage" data-passage="Clothing Shop"><div id="clothingShop-div"><div id="clothes-list"><div class="clothing-item"><span class="clothing-name"><a class="link-internal">Coat A</a></span><span class="clothing-price">£15</span></div><div class="clothing-item"><span class="clothing-name"><a class="link-internal">Coat B</a></span><span class="clothing-price">£20</span></div><div class="clothing-details"><div class="buy-buttons"><a class="link-internal">Buy</a><span class="gold">£15</span></div></div></div></div></div></div>';
   window.SugarCube={State:{passage:'Clothing Shop',variables:{clothingShopSlot:'upper',clothes_choice:0,money:100}}};window.setup={clothes:{upper:[{}]}};
   const native=[...document.querySelectorAll('#clothes-list a,#clothes-list .clothing-item')].map(node=>({node,parent:node.parentNode,next:node.nextSibling}));
   const host=createHost(window),owner=host.register('shop-test'),ui=startShop(window,{host,owner});
   const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await frame();
   document.querySelectorAll('.clothing-item')[0].click();await frame();document.querySelector('.dgshop-reference-tools button')?.click();await frame();
   const toolbar=document.querySelector('.dgshop-reference-tools'),aPinned=!!toolbar&&toolbar.textContent.includes('Coat A');
   document.querySelectorAll('.clothing-item')[1].click();await frame();document.querySelectorAll('.dgshop-reference-tools button')[1]?.click();await frame();
   const compared=!!document.querySelector('.dgshop-reference-comparison')&&document.querySelector('.dgshop-reference-comparison').textContent.includes('£15');
   document.querySelector('.dgshop-reference-tools button:nth-of-type(4)')?.click();await frame();
   const closedKeepsA=!!document.querySelector('.dgshop-reference-status')&&!document.querySelector('.dgshop-reference-comparison');
   host.invalidateScene();
   const restored=native.every(({node,parent,next})=>node.isConnected&&node.parentNode===parent&&node.nextSibling===next);
   const invalidated=host.getDiagnostics().mounts.length===0&&document.querySelectorAll('.dgshop-host').length===0;
   ui.refresh();await frame();const stayedUnmounted=host.getDiagnostics().mounts.length===0;
   host.sceneReady();ui.refresh();await frame();
   const remounted=host.getDiagnostics().mounts.length===1&&!!document.querySelector('.dgshop-host');
   ui.destroy();owner.dispose();host.dispose();
   const classic=startShop(window);await frame();document.querySelectorAll('.clothing-item')[0].click();await frame();
   const hiddenOutsideFramework=!document.querySelector('.dgshop-reference-tools');classic.destroy();
   return {aPinned,compared,closedKeepsA,restored,invalidated,stayedUnmounted,remounted,hiddenOutsideFramework};
  });
  for(const key of ['aPinned','compared','closedKeepsA','restored','invalidated','stayedUnmounted','remounted','hiddenOutsideFramework'])assert.equal(lifecycle[key],true,key);
  console.log('PASS shop Framework A/B controls, passage invalidation restoration, pending-scene guard and sceneReady reentry');
 }finally{await vite.close()}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
