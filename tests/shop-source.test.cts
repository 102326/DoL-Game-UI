// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import playwright = require('playwright');
import esbuild = require('esbuild');
import assert = require('node:assert/strict');
const {chromium}=playwright,{buildSync}=esbuild;
const code=buildSync({entryPoints:['src/shop/source.ts'],bundle:true,format:'iife',globalName:'ShopSourceTest',write:false}).outputFiles[0]?.text ?? assert.fail('missing shop bundle');
declare const ShopSourceTest:typeof import('../src/shop/source.ts');
(async()=>{const browser=await chromium.launch(require('./browser-options.cjs'));try{
 const page=await browser.newPage();await page.setContent('<div id="shop"><div id="clothes-list"><div class="clothing-item"><span class="clothing-name"><a class="link-internal">Coat</a></span><span class="clothing-price">£15</span></div><div class="clothing-details"><div class="clothing-colours-div"></div><div class="buy-buttons"><a class="link-internal">Buy</a><span class="gold">£15</span></div><button id="unknown">Mod action</button></div></div></div>');await page.addScriptTag({content:code});
 const result=await page.evaluate(()=>{
  const shop=document.querySelector<HTMLElement>('#shop');if(!shop)throw Error('missing shop');const variables={clothes_choice:1,money:500,colouraction:'blue'},definition={name:'coat',cost:15};let current=true;
  const source=ShopSourceTest.createShopSource(shop,()=>current,()=>({variables,definition}));const first=source.read(),link=document.querySelector('.buy-buttons a');
  const item=document.querySelector<HTMLElement>('.clothing-item');if(!item||!link||!first)throw Error('missing initial shop fixture');source.select(item);const projection=source.read();if(!projection)throw Error('missing projection');
  variables.money=400;const staleMoney=source.guard(link);source.read();const stillStale=source.guard(link);variables.money=500;
  const valid=source.guard(link);source.read();const replay=source.guard(link);
  link.replaceWith(link.cloneNode(true));source.read();const fresh=document.querySelector('.buy-buttons a');if(!fresh)throw Error('missing replaced purchase link');definition.cost=30;const changedDefinition=source.guard(fresh);definition.cost=15;
  current=false;const stalePage=source.guard(fresh);current=true;
  const unknownControl=document.querySelector('#unknown');if(!unknownControl)throw Error('missing native mod control');const unknown=source.guard(unknownControl);source.destroy();const disposed=source.guard(fresh);
  const wrapper=document.createElement('div');wrapper.className='buy-button-inner div-link';const wrapped=document.createElement('a');wrapped.className='link-internal';wrapped.textContent='Native wrapper';wrapper.append(wrapped);const buy=document.querySelector('.buy-buttons');if(!buy)throw Error('missing purchase controls');buy.replaceChildren(wrapper);
  const wrapperSource=ShopSourceTest.createShopSource(shop,()=>true,()=>({variables,definition}));wrapperSource.read();const wrapperValid=wrapperSource.guard(wrapper),wrapperReplay=wrapperSource.guard(wrapped);wrapperSource.destroy();
  const panel=document.querySelector('.clothing-details');if(!panel)throw Error('missing native details');panel.innerHTML='<div class="dgshop-detail-body"></div><div class="dgshop-purchase"><button>Unknown Mod operation</button></div>';
  const fallback=ShopSourceTest.createShopSource(shop,()=>true,()=>({variables,definition}));const fallbackState=fallback.read();if(!fallbackState)throw Error('missing footer state');const footerOnly=fallbackState.hasDetails;fallback.destroy();
  const coat=shop.querySelector<HTMLElement>('.clothing-item');if(!coat)throw Error('missing coat');const second=coat.cloneNode(true);if(!(second instanceof HTMLElement))throw Error('invalid cloned row');const secondLink=second.querySelector('a');if(!secondLink)throw Error('missing dress link');secondLink.textContent='Dress';coat.after(second);let extraClicks=0;secondLink.onclick=()=>extraClicks++;
  const nativeDefinition={cn_name_cap:'Coat'};const outcome=ShopSourceTest.createShopSource(shop,()=>true,()=>({variables,definition:nativeDefinition}));
  const attempted=outcome.select(second);outcome.reconcileSelection();const reconciled=outcome.read()?.selected?.title,changedDisplay=outcome.selectionDisplay()!==attempted;
  const duplicate=coat.cloneNode(true);second.after(duplicate);outcome.select(second);outcome.reconcileSelection();const ambiguous=outcome.read()?.selected??null;outcome.destroy();
  return {reconciled,changedDisplay,ambiguous,extraClicks,projection:first.items,selected:projection.selected,staleMoney,stillStale,valid,replay,changedDefinition,stalePage,unknown,disposed,footerOnly,wrapperValid,wrapperReplay};
 });
 assert.equal(result.reconciled,'Coat');assert.equal(result.changedDisplay,true);assert.equal(result.ambiguous,null);assert.equal(result.extraClicks,0,'presentation reconciliation never replays an unbound native click');
 assert.deepEqual(result.projection,[{key:'shop:1',title:'Coat',price:'£15',owned:'Coat'}]);assert.ok(result.selected);assert.equal(result.selected.key,'shop:1');
 for(const k of ['staleMoney','stillStale','replay','changedDefinition','stalePage','disposed'] as const)assert.equal(result[k],'stale',k);
 assert.equal(result.wrapperValid,'valid');assert.equal(result.wrapperReplay,'stale');assert.equal(result.valid,'valid');assert.equal(result.unknown,'native');assert.equal(result.footerOnly,true);console.log('PASS source display projection, stale quote/definition/page, no rebind/replay, unknown native control/footer, rapid unbound selection reconciled to actual definition without replay and ambiguity exits');
}finally{await browser.close()}})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
