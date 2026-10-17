import {isolate,mountUI,unmountUI,restoreNative} from '../runtime/presentation';
import {createApp,reactive,type App} from 'vue';
import Toolbar from './Toolbar.vue';
import {createShopSource,copyShopItem,purchaseControl,type ShopFacts} from './source';
import './style.css';
import {purchaseWitness,purchaseResult} from './transaction';
import {isMasterEnabled} from '../runtime/master';
import type {NativeEventsHost} from '../runtime/sugarcube';
import type {Host,Participant,Binding,MountHandle} from '../../framework/contracts';
export interface ShopFramework {host:Host;owner:Participant;rememberProduct?:(item:Readonly<{title:string;price:string;owned:string}>)=>void}
type Runtime=NativeEventsHost & {SugarCube?:{
 State?:{passage?:string;variables?:Record<string,unknown> & {shopClothingFilter?:{gender?:{female:boolean;male:boolean;neutral:boolean};active?:boolean}}};
 Wikifier?:new(output:HTMLElement|null,source:string)=>unknown;
}};
export function startShop(root:Runtime,framework?:ShopFramework){
 const key='DoLGameUI.shop.enabled';let enabled=true;
 try{enabled=root.localStorage.getItem(key)!=='false'}catch{/* Session preference. */}
 let shop:HTMLElement|null=null,host:HTMLElement|null=null,app:App|undefined,frame=0,destroyed=false,frameworkBinding:Binding|undefined,frameworkMount:Readonly<MountHandle>|undefined;
 let browseTools:HTMLElement|null=null;
 let backdrop:HTMLButtonElement|null=null;
 let entry:HTMLElement|null=null;
 const entryBreaks=new Set<HTMLElement>();
 const defaultKey='DoLGameUI.shop.defaultGender';const defaultValues=['game','female','male','female-only','male-only','all'];
 let defaultGender='game';try{const saved=root.localStorage.getItem(defaultKey);if(saved&&defaultValues.includes(saved))defaultGender=saved}catch{/* Session preference. */}
 const entered=new WeakSet<HTMLElement>();
 let list:HTMLElement|null=null,details:HTMLElement|null=null,catalog:HTMLElement|null=null,header:HTMLElement|null=null,detailBody:HTMLElement|null=null,footer:HTMLElement|null=null,close:HTMLButtonElement|null=null;
 // Keep native nodes and their handlers. Anchors allow exact-order restoration.
 const labels=new Map<HTMLElement,string|null>();
 const restoredScroll=new WeakMap<HTMLElement,number>();
 const moves=new Map<Node,Comment>();const owned=new Set<HTMLElement>();
 let scrollTop=0,focusReturn:HTMLElement|null=null,source:ReturnType<typeof createShopSource>|undefined,referenceMount:HTMLElement|null=null,referenceSequence=0;
 let resize:ResizeObserver|undefined,resizeFrame=0,transactionCheck=0,quantityCheck=0;
 const state=reactive({hasDetails:false,isEntry:false,open:false,narrow:false,compact:false,categoriesOpen:false,selectedTitle:'',referenceEnabled:!!framework,referenceA:null as Readonly<{title:string;price:string;owned:string}>|null,comparisonB:null as Readonly<{title:string;price:string;owned:string}>|null,comparisonTarget:null as string|null,comparisonOrigin:null as {left:number;top:number;width:number;height:number}|null,transactionStatus:'' as ''|'pending'|'confirmed'|'unknown',transactionMessage:'',defaultGender,message:''});const counts={mounts:0,scans:0,fastPaths:0};
 function current(){const passage=shop?.closest<HTMLElement>('.passage');return !destroyed&&(!frameworkBinding||frameworkBinding.isCurrent())&&!!shop?.isConnected&&!!passage&&!passage.classList.contains('passage-out')&&document.querySelector('#passages .passage:not(.passage-out)')===passage&&(!root.SugarCube?.State?.passage||root.SugarCube.State.passage===passage.dataset.passage)}
 function facts():ShopFacts{const variables=root.SugarCube?.State?.variables;const clothes=(root as unknown as {setup?:{clothes?:Record<string,unknown[]>}}).setup?.clothes;return {variables,definition:clothes?.[String(variables?.clothingShopSlot)]?.[Number(variables?.clothes_choice)]}}
 function syncBackdrop(){if(backdrop)backdrop.hidden=!(state.narrow&&state.open&&state.hasDetails)}
 function resizeLayout(){if(!shop)return;state.narrow=shop.clientWidth<800;state.compact=shop.clientWidth<=480;shop.classList.toggle('dgshop-narrow',state.narrow);shop.classList.toggle('dgshop-compact',state.compact);syncBackdrop()}
 function toggleCategories(){state.categoriesOpen=!state.categoriesOpen;shop?.classList.toggle('dgshop-categories-open',state.categoriesOpen)}
 function scheduleResize(){if(!destroyed&&!resizeFrame)resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;resizeLayout()})}
 function box(className:string,parent:HTMLElement){const el=document.createElement('div');el.className=className;parent.append(el);owned.add(el);return el}
 function move(node:Node,target:HTMLElement){if(node.parentNode===target)return;if(!moves.has(node)){const anchor=document.createComment('shop-ui-position');node.parentNode?.insertBefore(anchor,node);moves.set(node,anchor)}target.append(node)}
 function restore(){for(const [el,title] of labels){if(title===null)el.removeAttribute('title');else el.title=title}labels.clear();for(const [node,anchor] of moves){restoreNative(node,anchor,shop)}moves.clear();for(const el of owned){el.remove()}owned.clear();referenceMount=null;state.comparisonTarget=null;state.comparisonOrigin=null;state.comparisonB=null;details?.classList.remove('dgshop-detail-open');list?.classList.remove('dgshop-layout');shop?.querySelectorAll('.dgshop-selected').forEach(e=>e.classList.remove('dgshop-selected'));list=null;details=null;catalog=null;browseTools=null;header=null;detailBody=null;footer=null;close=null}
 function clearEntry(){for(const el of entryBreaks)el.classList.remove('dgshop-entry-gap');entryBreaks.clear();entry=null;shop?.classList.remove('dgshop-entry')}
 function release(){clearTimeout(transactionCheck);transactionCheck=0;clearTimeout(quantityCheck);quantityCheck=0;const owned=frameworkMount;frameworkMount=undefined;frameworkBinding=undefined;resize?.disconnect();resize=undefined;if(resizeFrame)cancelAnimationFrame(resizeFrame);resizeFrame=0;source?.destroy();source=undefined;clearEntry();unmountUI(app);app=undefined;restore();owned?.dispose();host?.remove();host=null;shop?.classList.remove('dgshop-content','dgshop-narrow','dgshop-has-details','dgshop-categories-open','dgshop-compact');state.hasDetails=false;state.open=false;state.categoriesOpen=false;state.selectedTitle='';state.referenceA=null;state.comparisonB=null;state.comparisonOrigin=null;state.transactionStatus='';state.transactionMessage='';scrollTop=0;focusReturn=null}
 function arrangeEntry(){
  if(entry?.isConnected)return;
  if(!shop)return;
  // Match native category icons, not translated labels or unrelated Mod links.
  const pairs:[HTMLImageElement,HTMLAnchorElement][]=[];
  for(const icon of shop.querySelectorAll<HTMLImageElement>(':scope > img.icon')){
   if(!/\/ui\/clothes\/categories\/[^/]+\.png(?:\?.*)?$/.test(icon.getAttribute('ml-src')??icon.getAttribute('src')??''))continue;
   let next:ChildNode|null=icon.nextSibling;
   while(next?.nodeType===Node.TEXT_NODE&&!next.textContent?.trim())next=next.nextSibling;
   if(next instanceof HTMLAnchorElement&&next.matches('.link-internal'))pairs.push([icon,next]);
  }
  if(!pairs.length)return;
  entry=box('dgshop-entry-categories',shop);pairs[0][0].before(entry);shop.classList.add('dgshop-entry');
  let gap=shop.querySelector(':scope > #warmth-description')?.nextSibling;
  while(gap&&(gap instanceof HTMLBRElement||(gap.nodeType===Node.TEXT_NODE&&!gap.textContent?.trim()))){
   if(gap instanceof HTMLBRElement){gap.classList.add('dgshop-entry-gap');entryBreaks.add(gap)}gap=gap.nextSibling;
  }
  for(const [icon,link]of pairs){
   // Suppress only empty separators immediately following a recognized category.
   let next:ChildNode|null=link.nextSibling;
   while(next&&(next instanceof HTMLBRElement||(next.nodeType===Node.TEXT_NODE&&!next.textContent?.trim()))){
    if(next instanceof HTMLBRElement){next.classList.add('dgshop-entry-gap');entryBreaks.add(next)}next=next.nextSibling;
   }
   const row=box('dgshop-entry-category',entry);move(icon,row);move(link,row);
  }
 }
 function toggle(open=!state.open){state.open=open;details?.classList.toggle('dgshop-detail-open',open);syncBackdrop();if(!open){const target=focusReturn?.isConnected?focusReturn:catalog?.querySelector<HTMLElement>('.dgshop-selected a')??host?.querySelector<HTMLElement>('button');target?.focus({preventScroll:true})}else if(open&&state.narrow)close?.focus({preventScroll:true})}
 function pinReference(){const item=source?.read()?.selected;if(!item||!current())return;const rect=catalog?.querySelector('.dgshop-selected')?.getBoundingClientRect();state.comparisonOrigin=rect?{left:rect.left,top:rect.top,width:rect.width,height:rect.height}:null;state.referenceA=copyShopItem(item);framework?.rememberProduct?.(state.referenceA);state.comparisonB=null}
 function compareReference(origin:HTMLElement){const item=source?.read()?.selected;if(!state.referenceA||!item||!current())return;const bounds=origin.isConnected?origin.getBoundingClientRect():null;state.comparisonOrigin=bounds?{left:bounds.left,top:bounds.top,width:bounds.width,height:bounds.height}:null;state.comparisonB=copyShopItem(item);if(detailBody)detailBody.scrollTop=0;if(state.narrow)toggle(true)}
 function clearReference(){state.referenceA=null;state.comparisonB=null}
 function closeComparison(){const target=focusReturn?.isConnected&&current()?focusReturn:host?.querySelector<HTMLElement>('[data-shop-compare]');state.comparisonB=null;if(state.narrow)toggle(false);requestAnimationFrame(()=>{if(target?.isConnected)target.focus({preventScroll:true})})}
 let failed=false;
 function recover(){failed=true;release();observe();document.dispatchEvent(new Event('dol-ui-shop-change'))}
 function refresh(){isolate('shop',update,recover)}
 function update(){
  if(destroyed)return;observer.disconnect();
  const binding=framework?.host.binding();
  if(framework&&!binding?.isCurrent()){if(host)release();observe();return}
  const next=document.querySelector<HTMLElement>('.passage #clothingShop-div');
  if(next!==shop){release();shop=next}
  if(!isMasterEnabled()||!enabled||failed||!shop){if(shop&&!isMasterEnabled())entered.add(shop);if(host)release();observe();return}
  if(shop.querySelectorAll('#clothes-list').length>1||shop.querySelectorAll('.clothing-details').length>1){release();observe();return}
  if(!host?.isConnected){host=document.createElement('div');host.className='dgshop-host';shop.before(host);shop.classList.add('dgshop-content');source=createShopSource(shop,current,facts);resizeLayout();if(typeof ResizeObserver!=='undefined'){resize=new ResizeObserver(scheduleResize);resize.observe(shop)}
   const mountApp=(parent:HTMLElement)=>{app=createApp(Toolbar,{state,toggle:()=>toggle(),toggleCategories,setDefaultGender,pinReference,compareReference,clearReference,closeComparison});mountUI(app,parent,recover);counts.mounts++};
   if(framework){frameworkBinding=binding;const mountBinding=binding;frameworkMount=framework.owner.mount({id:'shop',parent:host,lifetime:'passage',setup(context){context.onCleanup(()=>{if(frameworkBinding===mountBinding)release()});mountApp(context.element)}})}else mountApp(host);
  }
  counts.scans++;
  // Native replacements may have discarded the old catalog or detail body.
  for(const [node,anchor] of moves)if(!node.isConnected)moves.delete(node);
  for(const el of owned)if(!el.isConnected)owned.delete(el);
  const context=source!.context(),nextList=context.list,nextDetails=context.details;
  state.isEntry=!nextList;
  if(!nextList||!nextDetails){if(list){clearEntry();restore()}state.hasDetails=false;state.comparisonB=null;arrangeEntry();observe();return}
  if(entry){clearEntry();restore()}
  if(!entered.has(shop)){
   entered.add(shop);
   if(state.defaultGender!=='game'){
    const enteredShop=shop;
    // Native linkifyDivs queues ready callbacks. Refresh after them to avoid double binding.
    root.jQuery!(()=>{if(destroyed||!isMasterEnabled()||!enabled||shop!==enteredShop||!enteredShop.isConnected)return;observer.disconnect();applyDefaultGender();schedule()});
   }
  }
  if(nextList!==list||!catalog?.isConnected){
   list=nextList;list.classList.add('dgshop-layout');header=box('dgshop-native-header',list);catalog=box('dgshop-catalog',list);browseTools=box('dgshop-browse-tools',list);
   const scroller=catalog;
   scroller.addEventListener('scroll',()=>{if(scroller===catalog&&scroller.isConnected&&scroller.scrollTop!==restoredScroll.get(scroller)){scrollTop=scroller.scrollTop;restoredScroll.set(scroller,scrollTop)}},{passive:true});
  }
  // Move only within the original #clothes-list. Global IDs and native descendants survive.
  for(const node of [...list!.childNodes]){
   if(node===nextDetails||owned.has(node as HTMLElement)||node.nodeType===Node.COMMENT_NODE)continue;
   if(node instanceof HTMLElement&&node.matches('#shopCategories,.optionsBar,#shop-list-pages,#shop-pagination'))move(node,node.matches('#shopCategories,.optionsBar')?browseTools!:catalog!);
   else move(node,header!);
  }
  details=nextDetails;
  if(!backdrop?.isConnected){backdrop=document.createElement('button');backdrop.type='button';backdrop.className='dgshop-detail-backdrop';backdrop.setAttribute('aria-label','关闭商品详情');backdrop.tabIndex=-1;backdrop.hidden=true;backdrop.addEventListener('click',()=>toggle(false));document.body.append(backdrop);owned.add(backdrop)}
  if(!detailBody?.isConnected||detailBody.parentElement!==details){
   detailBody=box('dgshop-detail-body',details);footer=box('dgshop-purchase',details);
   close=document.createElement('button');close.type='button';close.className='dgshop-close-detail';close.textContent='返回商品列表';close.addEventListener('click',()=>toggle(false));details.prepend(close);owned.add(close);
  }
  for(const node of [...details.childNodes]){
   if(owned.has(node as HTMLElement)||node.nodeType===Node.COMMENT_NODE)continue;
   move(node,node instanceof HTMLElement&&node.matches('.buy-buttons,.try-buttons')?footer!:detailBody!);
  }
  if(framework&&detailBody){if(!referenceMount?.isConnected||referenceMount.parentElement!==detailBody){referenceMount=box('dgshop-reference-mount',detailBody);detailBody.prepend(referenceMount);referenceMount.id=`dgshop-reference-${++referenceSequence}`;state.comparisonTarget=`#${referenceMount.id}`}}
  else{referenceMount=null;state.comparisonTarget=null;state.comparisonB=null}
  for(const el of details.querySelectorAll<HTMLElement>('.colour-button'))if(!labels.has(el)){labels.set(el,el.getAttribute('title'));el.title=el.textContent?.trim()??''}
  for(const el of labels.keys())if(!el.isConnected)labels.delete(el);
  const projection=source!.read();state.hasDetails=projection?.hasDetails??false;state.selectedTitle=projection?.selected?.title??'';shop.classList.toggle('dgshop-has-details',state.hasDetails);
  if(!projection?.selected)state.comparisonB=null;
  footer!.hidden=!footer!.querySelector('.buy-buttons,.try-buttons');
  details.classList.toggle('dgshop-detail-open',state.open&&state.hasDetails);
  syncBackdrop();
  // Catalog replacement after purchase/search must not jump back to the page top.
  // Native pages arrive incrementally: a temporary clamp must not erase the saved position.
  catalog!.scrollTop=scrollTop;restoredScroll.set(catalog!,catalog!.scrollTop);
  updateSelected(catalog!.querySelectorAll<HTMLElement>('.clothing-item'));
  observe();
 }
 function applyDefaultGender(){
  if(!isMasterEnabled()||!enabled||state.defaultGender==='game'||!shop?.querySelector('#clothes-list'))return false;
  const engine=root.SugarCube;const filter=engine?.State?.variables?.shopClothingFilter;
  if(!filter?.gender||typeof engine?.Wikifier!=='function')return false;
  filter.gender.female=state.defaultGender!=='male'&&state.defaultGender!=='male-only';filter.gender.male=state.defaultGender!=='female'&&state.defaultGender!=='female-only';filter.gender.neutral=state.defaultGender!=='female-only'&&state.defaultGender!=='male-only';filter.active=true;
  new engine.Wikifier(null,'<<updateclotheslist>>');return true;
 }
 function setDefaultGender(value:string){
  if(!defaultValues.includes(value))return;
  state.defaultGender=value;try{root.localStorage.setItem(defaultKey,value)}catch{/* Session preference. */}
  state.message=value==='game'?'已取消进店默认，下次进入沿用游戏规则。':'已保存进店默认；店内可用漏斗临时调整。';
  observer.disconnect();applyDefaultGender();schedule();
 }
 function observe(){if(shop)observer.observe(shop,{childList:true,subtree:true})}
 function schedule(){if(!destroyed&&!frame)frame=requestAnimationFrame(()=>{frame=0;refresh()})}
 function updateSelected(items:Iterable<HTMLElement>){for(const item of items)item.classList.toggle('dgshop-selected',source?.selectedItem(item)??false)}
 function fastPath(records:MutationRecord[]){
  const pages=catalog?.querySelector<HTMLElement>('#shop-list-pages');
  if(!pages?.isConnected||!catalog?.isConnected||!list?.isConnected||!records.length)return false;
  // Native hotkey numbering rewrites only text nodes on links after each page is appended.
  // It does not alter the layout nodes or handlers that this adapter manages.
  const isNumberingText=(record:MutationRecord)=>record.target instanceof Element
   &&record.target.matches('a.link-internal.macro-link,button.link-internal.macro-button')
   &&[...record.addedNodes,...record.removedNodes].every(node=>node.nodeType===Node.TEXT_NODE);
  if(records.some(record=>record.type!=='childList'||!(pages.contains(record.target)||isNumberingText(record))))return false;
  const items=new Set<HTMLElement>();
  for(const record of records){
   const target=record.target instanceof Element?record.target:null;
   const parentItem=target?.closest<HTMLElement>('.clothing-item');
   if(parentItem&&catalog.contains(parentItem))items.add(parentItem);
   for(const node of record.addedNodes){
    if(!(node instanceof Element))continue;
    if(node.matches('.clothing-item'))items.add(node as HTMLElement);
    node.querySelectorAll<HTMLElement>('.clothing-item').forEach(item=>items.add(item));
   }
  }
  updateSelected(items);counts.fastPaths++;return true;
 }
 function click(event:Event){if(!isMasterEnabled()||!enabled||failed||!shop?.contains(event.target as Node)||!(event.target instanceof Element))return;
  const original=purchaseControl(event.target as Element),purchase=original?.matches('#buy-send-home .buy-button-inner.buy-multiple a.link-internal')?original:null;
  if(framework&&purchase&&(state.transactionStatus==='pending'||state.transactionStatus==='unknown')){event.preventDefault();event.stopImmediatePropagation();state.transactionMessage='上一笔结果仍未确认。请先核对原版界面，不要重复购买。';return}
  const validity=isolate('shop binding',()=>source?.guard(event.target as Element),recover);
  if(validity===undefined||validity==='stale'||!current()){event.preventDefault();event.stopImmediatePropagation();state.message='商品、配色或报价已变化，本次未操作。请重新选择商品；结果未知时不要重复购买。';schedule();return}
  if(framework&&purchase&&validity==='valid'){
   const costOf=(root as unknown as {getClothingCost?:(item:unknown,slot:string)=>number}).getClothingCost;
   const witness=purchaseWitness(purchase,facts(),costOf);
   if(!witness){state.transactionStatus='';state.transactionMessage='此购买沿用原版结果显示，本界面不额外确认。'}
   else{state.transactionStatus='pending';state.transactionMessage='已交给原版购买，正在核对金钱和衣柜。';
    const scene=shop;
    // A browser may checkpoint microtasks between capture and native bubbling handlers.
    transactionCheck=window.setTimeout(()=>{transactionCheck=0;if(destroyed||shop!==scene||!current())return;state.transactionStatus=purchaseResult(witness,facts(),current());state.transactionMessage=state.transactionStatus==='confirmed'?`已核对：原版已扣款，衣柜新增 ${witness.amount} 件。`:'原操作结果未能确认，请先核对原版界面，不要重复购买。';schedule()},0);
   }
  }
  const target=event.target.closest<HTMLElement>('.clothing-item,.category-tab,.btn-pagination');if(!target)return;
  state.message='';if(state.transactionStatus==='confirmed'){state.transactionStatus='';state.transactionMessage=''}
  if(target.matches('.clothing-item')){source?.select(target);focusReturn=target.querySelector('a');state.open=true;if(state.comparisonB){const item=source?.read()?.selected,rect=target.getBoundingClientRect();if(item){state.comparisonOrigin={left:rect.left,top:rect.top,width:rect.width,height:rect.height};state.comparisonB=copyShopItem(item)}}}else{scrollTop=0;source?.clearSelection();state.open=false}
  schedule();
 }
 function quantity(event:Event){const input=event.target;if(!(input instanceof HTMLInputElement)||!input.matches('#buy-multiple-slider input[type=range]')||!shop?.contains(input)||!current())return;clearTimeout(quantityCheck);quantityCheck=window.setTimeout(()=>{quantityCheck=0;isolate('shop quantity quote',()=>source?.quantityChanged(input),recover)},0)}
 function escape(event:KeyboardEvent){if(event.key==='Escape'&&state.open&&!document.querySelector('dialog[open],#customOverlay:not(.hidden)')&&!shop?.querySelector('.no-click-overlay:not(.hidden)'))toggle(false)}
 const observer=new MutationObserver(records=>{if(!isolate('shop mutation',()=>fastPath(records),recover))schedule()});
 const discovery=new MutationObserver(()=>{if(document.querySelector('.passage #clothingShop-div')!==shop)schedule()});
 function setEnabled(value:boolean){if(destroyed)return;failed=false;enabled=!!value;try{root.localStorage.setItem(key,String(enabled))}catch{/* Session preference. */}refresh();document.dispatchEvent(new Event('dol-ui-shop-change'))}
 document.addEventListener('input',quantity,true);document.addEventListener('change',quantity,true);document.addEventListener('click',click,true);document.addEventListener('keydown',escape);discovery.observe(document.body,{childList:true,subtree:true});refresh();
 return {getDefaultGender:()=>state.defaultGender,setDefaultGender,getEnabled:()=>enabled&&!failed,setEnabled,refresh,getLifecycleCounts:()=>({...counts}),destroy(){destroyed=true;if(frame)cancelAnimationFrame(frame);observer.disconnect();discovery.disconnect();document.removeEventListener('input',quantity,true);document.removeEventListener('change',quantity,true);document.removeEventListener('click',click,true);document.removeEventListener('keydown',escape);release();shop=null}};
}
