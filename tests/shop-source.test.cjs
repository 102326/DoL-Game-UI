// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
const {chromium}=require('playwright'),{buildSync}=require('esbuild'),assert=require('node:assert/strict');
const code=buildSync({entryPoints:['src/shop/source.ts'],bundle:true,format:'iife',globalName:'ShopSourceTest',write:false}).outputFiles[0].text;
(async()=>{const browser=await chromium.launch(require('./browser-options.cjs'));try{
 const page=await browser.newPage();await page.setContent('<div id="shop"><div id="clothes-list"><div class="clothing-item"><span class="clothing-name"><a class="link-internal">Coat</a></span><span class="clothing-price">£15</span></div><div class="clothing-details"><div class="clothing-colours-div"></div><div class="buy-buttons"><a class="link-internal">Buy</a><span class="gold">£15</span></div><button id="unknown">Mod action</button></div></div></div>');await page.addScriptTag({content:code});
 const result=await page.evaluate(()=>{
  const shop=document.querySelector('#shop'),variables={clothes_choice:1,money:500,colouraction:'blue'},definition={name:'coat',cost:15};let current=true;
  const source=ShopSourceTest.createShopSource(shop,()=>current,()=>({variables,definition}));const first=source.read(),link=document.querySelector('.buy-buttons a');
  source.select(document.querySelector('.clothing-item'));const projection=source.read();
  variables.money=400;const staleMoney=source.guard(link);source.read();const stillStale=source.guard(link);variables.money=500;
  const valid=source.guard(link);source.read();const replay=source.guard(link);
  link.replaceWith(link.cloneNode(true));source.read();const fresh=document.querySelector('.buy-buttons a');definition.cost=30;const changedDefinition=source.guard(fresh);definition.cost=15;
  current=false;const stalePage=source.guard(fresh);current=true;
  const unknown=source.guard(document.querySelector('#unknown'));source.destroy();const disposed=source.guard(fresh);
  const wrapper=document.createElement('div');wrapper.className='buy-button-inner div-link';const wrapped=document.createElement('a');wrapped.className='link-internal';wrapped.textContent='Native wrapper';wrapper.append(wrapped);document.querySelector('.buy-buttons').replaceChildren(wrapper);
  const wrapperSource=ShopSourceTest.createShopSource(shop,()=>true,()=>({variables,definition}));wrapperSource.read();const wrapperValid=wrapperSource.guard(wrapper),wrapperReplay=wrapperSource.guard(wrapped);wrapperSource.destroy();
  const panel=document.querySelector('.clothing-details');panel.innerHTML='<div class="dgshop-detail-body"></div><div class="dgshop-purchase"><button>Unknown Mod operation</button></div>';
  const fallback=ShopSourceTest.createShopSource(shop,()=>true,()=>({variables,definition}));const footerOnly=fallback.read().hasDetails;fallback.destroy();
  const coat=shop.querySelector('.clothing-item'),second=coat.cloneNode(true);second.querySelector('a').textContent='Dress';coat.after(second);let extraClicks=0;second.querySelector('a').onclick=()=>extraClicks++;
  const nativeDefinition={cn_name_cap:'Coat'};const outcome=ShopSourceTest.createShopSource(shop,()=>true,()=>({variables,definition:nativeDefinition}));
  const attempted=outcome.select(second);outcome.reconcileSelection();const reconciled=outcome.read().selected?.title,changedDisplay=outcome.selectionDisplay()!==attempted;
  const duplicate=coat.cloneNode(true);second.after(duplicate);outcome.select(second);outcome.reconcileSelection();const ambiguous=outcome.read().selected??null;outcome.destroy();
  return {reconciled,changedDisplay,ambiguous,extraClicks,projection:first.items,selected:projection.selected,staleMoney,stillStale,valid,replay,changedDefinition,stalePage,unknown,disposed,footerOnly,wrapperValid,wrapperReplay};
 });
 assert.equal(result.reconciled,'Coat');assert.equal(result.changedDisplay,true);assert.equal(result.ambiguous,null);assert.equal(result.extraClicks,0,'presentation reconciliation never replays an unbound native click');
 assert.deepEqual(result.projection,[{key:'shop:1',title:'Coat',price:'£15',owned:'Coat'}]);assert.equal(result.selected.key,'shop:1');
 for(const k of ['staleMoney','stillStale','replay','changedDefinition','stalePage','disposed'])assert.equal(result[k],'stale',k);
 assert.equal(result.wrapperValid,'valid');assert.equal(result.wrapperReplay,'stale');assert.equal(result.valid,'valid');assert.equal(result.unknown,'native');assert.equal(result.footerOnly,true);console.log('PASS source display projection, stale quote/definition/page, no rebind/replay, unknown native control/footer, rapid unbound selection reconciled to actual definition without replay and ambiguity exits');
}finally{await browser.close()}})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
