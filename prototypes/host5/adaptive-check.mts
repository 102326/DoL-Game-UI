// Candidate ZIPs supply both production components. Only the native document and actions are fixtures.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {loadPackage,readPackage} from './panel-budget/package-input.mts';

const [hostPath,uiPath]=process.argv.slice(2);
assert.ok(hostPath&&uiPath,'Pass the Host and UI player ZIPs');
const host=readPackage(hostPath,'StoneFreeHost'),ui=readPackage(uiPath,'DoLGameUI');
const browser=await chromium.launch({channel:'chrome'});
try {
 const p=await browser.newPage({viewport:{width:1280,height:850},reducedMotion:'reduce'});
 const errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(5000);
 await p.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><aside id="ui-bar"><div id="overlayButtons"></div></aside><main id="passages"><section class="passage" data-passage="Neutral"><div id="clothingShop-div"><div id="clothes-list"><div id="shopCategories"><div class="category-group"></div></div><div class="optionsBar"><div class="searchGroup"><label class="searchBar">搜索<input type="search" aria-label="搜索"></label><button>重置筛选</button></div><label class="itemsPerPageLabel">每页<select><option>20</option></select></label></div><div id="shop-list-pages"></div><div class="clothing-details"></div></div></div></section></main>'}));
 await p.goto('http://127.0.0.1/neutral');
 await p.evaluate(()=>{
  const vars={money:10000,clothingShopSlot:'upper',clothes_choice:0};
  Object.assign(window,{SugarCube:{State:{passage:'Neutral',variables:vars}},setup:{clothes:{upper:Array.from({length:28},()=>({}))}}});
  const group=document.querySelector('.category-group')!;
  for(const name of ['常用一','常用二','常用三','更多一','当前']){
   const tab=document.createElement('button');tab.className=name==='当前'?'category-tab active':'category-tab';tab.textContent=name;
   tab.onclick=()=>tab.dataset.calls=String(1+Number(tab.dataset.calls??0));group.append(tab);
  }
  for(let i=1;i<=28;i++){
   const row=document.createElement('div');row.className='clothing-item';row.id='item-'+i;
   row.innerHTML='<span class="clothing-body"><span class="clothing-name"><a href="#" class="link-internal"></a></span></span><span class="clothing-price">£12,345.67</span>';
   const item=row.querySelector('a')!;item.textContent=i+' · '+ '烟灰色层叠长标题'.repeat(3);
   item.onclick=e=>{
    e.preventDefault();vars.clothes_choice=i-1;
    const details=document.querySelector<HTMLElement>('.clothing-details')!;
    details.innerHTML='<h3>第 '+i+' 项</h3><div class="clothing-colours-div"><label>备注<input type="text"></label></div><p>'+'中性说明。'.repeat(200)+'</p><div class="buy-buttons"><button id="buy" class="link-internal">购买</button></div><div class="try-buttons"><button id="try" class="link-internal">试穿</button></div>';
    for(const b of details.querySelectorAll('button'))b.onclick=()=>b.dataset.calls=String(1+Number(b.dataset.calls??0));
   };
   document.querySelector('#shop-list-pages')!.append(row);
  }
 });
 await loadPackage(p,host);await p.evaluate(()=>window.DoLUiHost!.sceneReady());await loadPackage(p,ui);
 const shop=p.locator('#clothingShop-div'),details=shop.locator('.clothing-details'),work=p.locator('.dmt-workspace');
 const button=(name:string)=>p.locator('#dol-midnight-controls').getByRole('button',{name,exact:true});
 const frames=()=>p.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
 await shop.locator('.dgshop-layout').waitFor();
 await p.locator('#dol-midnight-sidebar-button').click();
 await p.locator('#ui-bar').evaluate(n=>n.classList.add('stowed'));
 await button('左右').click();await p.setViewportSize({width:390,height:700});
 await p.evaluate(()=>Reflect.get(window,'DoLGameUI').setPreference('fontScale',120));
 await frames();assert.equal(await work.getAttribute('data-settings-layout'),'horizontal');
 await p.setViewportSize({width:844,height:390});await frames();
 assert.equal(await work.getAttribute('data-settings-layout'),'vertical');assert.ok(await work.evaluate(n=>n.hasAttribute('data-short-window')&&!n.hasAttribute('data-side-preview')));
 await p.setViewportSize({width:1280,height:860});await frames();
 const actual=await work.evaluate(n=>(n as HTMLElement).offsetWidth);
 assert.equal(await work.evaluate(n=>n.hasAttribute('data-side-preview')),actual>=860*1.2);
 await p.evaluate(()=>Reflect.get(window,'DoLGameUI').setPreference('fontScale',100));await frames();
 assert.ok(await work.evaluate(n=>n.hasAttribute('data-side-preview')));
 await button('材质').click();
 const font=p.locator('.sw-appearance-font input[type=text]');
 await font.evaluate(n=>{for(let d=n.closest('details');d;d=d.parentElement?.closest('details')??null)d.open=true});
 await font.fill('Neutral');await font.evaluate(n=>(n as HTMLInputElement).setSelectionRange(1,4));
 await p.setViewportSize({width:1280,height:444});await frames();
 assert.ok(await work.evaluate(n=>n.hasAttribute('data-side-preview')&&!n.hasAttribute('data-short-window')));
 assert.deepEqual(await font.evaluate(n=>[document.activeElement===n,(n as HTMLInputElement).selectionStart,(n as HTMLInputElement).selectionEnd]),[true,1,4]);
 await p.setViewportSize({width:390,height:700});await frames();
 assert.equal(await work.getAttribute('data-settings-layout'),'horizontal');
 assert.deepEqual(await font.evaluate(n=>[document.activeElement===n,(n as HTMLInputElement).selectionStart,(n as HTMLInputElement).selectionEnd]),[true,1,4]);
 await p.evaluate(()=>Reflect.get(window,'DoLGameUI').setPreference('fontScale',120));await button('关闭').click();
 await p.locator('#dol-midnight-controls').waitFor({state:'hidden'});
 const retired='[data-shop-pin],[data-shop-compare],[data-shop-spatial],.dgshop-reference-mount,.dgshop-reference-comparison';
 assert.equal(await p.locator(retired).count(),0);
 const extra=shop.getByText('更多一',{exact:true}),common=shop.getByText('常用一',{exact:true});
 assert.deepEqual(await Promise.all([common,shop.getByText('当前',{exact:true}),shop.getByLabel('搜索')].map(n=>n.isVisible())),[true,true,true]);
 assert.ok(await extra.isHidden()&&await p.getByText('进店设置',{exact:true}).isVisible());
 const pageSize=shop.getByLabel('每页'),reset=shop.getByRole('button',{name:'重置筛选',includeHidden:true});
 assert.ok(await pageSize.isHidden()&&await reset.isHidden());
 const more=p.getByRole('button',{name:'更多工具'});await more.click();assert.ok(await pageSize.isVisible()&&await reset.isVisible());await extra.click();assert.equal(await extra.getAttribute('data-calls'),'1');
 await more.click();assert.ok(await extra.isHidden());
 // Leave the catalog midway, switch scroll owners without changing the viewport and compare the same item.
 await p.setViewportSize({width:1200,height:700});await frames();
 const catalog=shop.locator('.dgshop-catalog'),anchor=shop.locator('#item-12');
 const offset=async(narrow:boolean)=>anchor.evaluate((n,doc)=>n.getBoundingClientRect().top-(doc?0:n.closest('.dgshop-catalog')!.getBoundingClientRect().top),narrow);
 const align=await offset(false);await catalog.evaluate((n,d)=>n.scrollTop+=d+7,align);await frames();
 const initial=await offset(false);assert.ok(Math.abs(initial)<12);
 await shop.evaluate(n=>(n as HTMLElement).style.width='550px');await frames();
 const onPage=await offset(true);assert.ok(Math.abs(onPage-initial)<4,JSON.stringify({initial,onPage}));
 await shop.evaluate(n=>(n as HTMLElement).style.removeProperty('width'));await frames();
 const restored=await offset(false);assert.ok(Math.abs(restored-initial)<4,JSON.stringify({initial,restored}));
 await p.setViewportSize({width:390,height:700});await frames();
 await shop.locator('#item-12 a').click();await details.locator('#buy').waitFor();
 await p.waitForFunction(()=>document.querySelector('.clothing-details')?.matches(':popover-open'));
 const note=details.getByLabel('备注');await note.fill('abcdef');await note.evaluate(n=>(n as HTMLInputElement).setSelectionRange(1,4));
 await p.setViewportSize({width:390,height:444});await frames();
 assert.ok(await shop.evaluate(n=>n.classList.contains('dgshop-narrow')&&!n.classList.contains('dgshop-short')));
 assert.deepEqual(await note.evaluate(n=>[n===document.activeElement,(n as HTMLInputElement).selectionStart,(n as HTMLInputElement).selectionEnd]),[true,1,4]);
 await p.setViewportSize({width:390,height:700});await frames();
 // A visual-only IME shrink preserves the layout; a simultaneous width change must reflow the same focused input.
 const selectedText=()=>note.evaluate(n=>[document.activeElement===n,(n as HTMLInputElement).value,(n as HTMLInputElement).selectionStart,(n as HTMLInputElement).selectionEnd]);
 await p.evaluate(()=>{const v=visualViewport!;Object.defineProperty(v,'height',{value:444,configurable:true});v.dispatchEvent(new Event('resize'))});await frames();
 assert.deepEqual(await selectedText(),[true,'abcdef',1,4]);
 assert.ok(await shop.evaluate(n=>getComputedStyle(n).getPropertyValue('--dgshop-ime-inset')==='256px'&&!n.classList.contains('dgshop-short')));
 await p.evaluate(()=>{Reflect.deleteProperty(visualViewport!,'height');visualViewport!.dispatchEvent(new Event('resize'))});
 await p.setViewportSize({width:915,height:412});await frames();
 assert.ok(await shop.evaluate(n=>!n.classList.contains('dgshop-narrow')&&n.classList.contains('dgshop-short')));
 assert.deepEqual(await selectedText(),[true,'abcdef',1,4]);
 await p.setViewportSize({width:390,height:700});await frames();
 assert.deepEqual(await selectedText(),[true,'abcdef',1,4]);assert.ok(await details.evaluate(n=>n.matches(':popover-open')));
 assert.equal(await p.locator(retired).count(),0);
 assert.ok(await p.evaluate(()=>!window.DoLUiHost!.views().some(v=>v.id==='shop-snapshot')));
 const buy=details.locator('#buy');await buy.focus();
 const observations=[];
 for(const [width,height,container,narrow,short] of [[844,390,820,true,true],[915,412,820,false,true],[920,1100,860,false,false],[920,1100,550,true,false],[390,700,360,true,false]] as const){
  await p.setViewportSize({width,height});await shop.evaluate((n,w)=>Object.assign((n as HTMLElement).style,{width:w+'px',maxWidth:'100%',boxSizing:'border-box',padding:'0'}),container);
  await frames();
  const result=await shop.evaluate(n=>{
   const d=n.querySelector<HTMLElement>('.clothing-details')!,c=n.querySelector<HTMLElement>('.dgshop-catalog')!,body=d.querySelector<HTMLElement>('.dgshop-detail-body')!;
   return {width:n.clientWidth,narrow:n.classList.contains('dgshop-narrow'),short:n.classList.contains('dgshop-short'),popover:d.matches(':popover-open'),selected:n.querySelector('.dgshop-selected')?.id,focus:document.activeElement?.id,flow:getComputedStyle(body).overflowY,
    onRight:d.getBoundingClientRect().left>=c.getBoundingClientRect().right-1,overflow:n.scrollWidth-n.clientWidth};
  });
  const titleFits=await shop.locator('#item-12').evaluate(n=>{
   const range=document.createRange();range.selectNodeContents(n.querySelector('.clothing-name a')!);
   const price=n.querySelector('.clothing-price')!.getBoundingClientRect();
   return Array.from(range.getClientRects()).every(r=>r.right<=price.left+1||r.left>=price.right-1||r.bottom<=price.top+1||r.top>=price.bottom-1);
  });
  assert.ok(titleFits,'long native title overlaps price at '+result.width);
  observations.push(result);
  assert.equal(result.narrow,narrow,JSON.stringify(result));assert.equal(result.short,short);
  assert.equal(result.selected,'item-12');assert.equal(result.focus,'buy',JSON.stringify(result));
  assert.equal(result.popover,narrow);if(!narrow)assert.ok(result.onRight);
  assert.equal(result.flow==='visible',short&&!narrow);assert.ok(result.overflow<=1,JSON.stringify(result));
 }
 // Native controls are single-use per quote. Editing a quoted field requires a fresh selection.
 const back=details.locator('.dgshop-close-detail'),item=shop.locator('#item-12 a');
 for(const id of ['buy','try']){
  await back.click();assert.ok(await item.evaluate(n=>n===document.activeElement));
  await item.click();const action=details.locator('#'+id);await action.click();assert.equal(await action.getAttribute('data-calls'),'1');
 }
 await back.click();assert.ok(await item.evaluate(n=>n===document.activeElement));
 await p.evaluate(()=>window.DoLUiHost!.invalidateScene());await frames();
 assert.equal(await p.locator('.dgshop-host,.dgshop-detail-backdrop').count(),0);
 assert.equal(await p.locator('#clothes-list > #shopCategories, #clothes-list > #shop-list-pages').count(),2);
 await p.evaluate(()=>{window.DoLUiHost!.sceneReady();Reflect.get(window,'DoLShopUI').refresh()});await p.locator('.dgshop-layout').waitFor();
 await p.evaluate(()=>Reflect.get(window,'DoLShopUI').setEnabled(false));assert.equal(await p.locator('.dgshop-detail-backdrop,.dgshop-layout').count(),0);
 assert.deepEqual(errors,[]);console.log({browser:browser.version(),host:host.sha,ui:ui.sha,observations});
}finally{await browser.close()}
