import {createApp,reactive,type App} from 'vue';
import Toolbar from './Toolbar.vue';
import './style.css';
type Runtime=Window & Record<string,any>;
export function startShop(root:Runtime){
 const key='DoLGameUI.shop.enabled';let enabled=true;
 try{enabled=root.localStorage.getItem(key)!=='false'}catch{/* Session preference. */}
 let shop:HTMLElement|null=null,host:HTMLElement|null=null,app:App|undefined,frame=0,destroyed=false;
 let browseTools:HTMLElement|null=null;
 const defaultKey='DoLGameUI.shop.defaultGender';const defaultValues=['game','female','male','female-only','male-only','all'];
 let defaultGender='game';try{const saved=root.localStorage.getItem(defaultKey);if(saved&&defaultValues.includes(saved))defaultGender=saved}catch{/* Session preference. */}
 const entered=new WeakSet<HTMLElement>();
 let list:HTMLElement|null=null,details:HTMLElement|null=null,catalog:HTMLElement|null=null,header:HTMLElement|null=null,detailBody:HTMLElement|null=null,footer:HTMLElement|null=null,close:HTMLButtonElement|null=null;
 // Keep native nodes and their handlers. Anchors allow exact-order restoration.
 const labels=new Map<HTMLElement,string|null>();
 const restoredScroll=new WeakMap<HTMLElement,number>();
 const moves=new Map<Node,Comment>();const owned=new Set<HTMLElement>();
 let scrollTop=0,selected='',focusReturn:HTMLElement|null=null;
 const state=reactive({hasDetails:false,open:false,defaultGender,message:''});const counts={mounts:0,scans:0,fastPaths:0};
 function box(className:string,parent:HTMLElement){const el=document.createElement('div');el.className=className;parent.append(el);owned.add(el);return el}
 function move(node:Node,target:HTMLElement){if(node.parentNode===target)return;if(!moves.has(node)){const anchor=document.createComment('shop-ui-position');node.parentNode?.insertBefore(anchor,node);moves.set(node,anchor)}target.append(node)}
 function restore(){for(const [el,title] of labels){if(title===null)el.removeAttribute('title');else el.title=title}labels.clear();for(const [node,anchor] of moves){if(anchor.isConnected&&node.isConnected)anchor.replaceWith(node);else anchor.remove()}moves.clear();for(const el of owned){el.remove()}owned.clear();details?.classList.remove('dgshop-detail-open');list?.classList.remove('dgshop-layout');shop?.querySelectorAll('.dgshop-selected').forEach(e=>e.classList.remove('dgshop-selected'));list=null;details=null;catalog=null;browseTools=null;header=null;detailBody=null;footer=null;close=null}
 function release(){restore();app?.unmount();app=undefined;host?.remove();host=null;shop?.classList.remove('dgshop-content');state.hasDetails=false;state.open=false;selected='';scrollTop=0}
 function toggle(open=!state.open){state.open=open;details?.classList.toggle('dgshop-detail-open',open);if(!open){const target=focusReturn?.isConnected?focusReturn:catalog?.querySelector<HTMLElement>('.dgshop-selected a')??host?.querySelector<HTMLElement>('button');target?.focus({preventScroll:true})}else if(open&&root.matchMedia('(max-width: 900px)').matches)close?.focus({preventScroll:true})}
 function refresh(){
  if(destroyed)return;observer.disconnect();
  const next=document.querySelector<HTMLElement>('.passage #clothingShop-div');
  if(next!==shop){release();shop=next}
  if(!enabled||!shop){if(host)release();observe();return}
  if(!host?.isConnected){host=document.createElement('div');host.className='dgshop-host';shop.before(host);shop.classList.add('dgshop-content');app=createApp(Toolbar,{state,toggle:()=>toggle(),setDefaultGender});app.mount(host);counts.mounts++}
  counts.scans++;
  // Native replacements may have discarded the old catalog or detail body.
  for(const [node,anchor] of moves)if(!anchor.isConnected||!node.isConnected)moves.delete(node);
  for(const el of owned)if(!el.isConnected)owned.delete(el);
  const nextList=shop.querySelector<HTMLElement>('#clothes-list');
  const nextDetails=nextList?.querySelector<HTMLElement>('.clothing-details')??null;
  if(!nextList||!nextDetails){restore();state.hasDetails=false;observe();return}
  if(!entered.has(shop)){entered.add(shop);if(applyDefaultGender()){schedule();return}}
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
  if(!detailBody?.isConnected||detailBody.parentElement!==details){
   detailBody=box('dgshop-detail-body',details);footer=box('dgshop-purchase',details);
   close=document.createElement('button');close.type='button';close.className='dgshop-close-detail';close.textContent='返回商品列表';close.addEventListener('click',()=>toggle(false));details.prepend(close);owned.add(close);
  }
  for(const node of [...details.childNodes]){
   if(owned.has(node as HTMLElement)||node.nodeType===Node.COMMENT_NODE)continue;
   move(node,node instanceof HTMLElement&&node.matches('.buy-buttons,.try-buttons')?footer!:detailBody!);
  }
  for(const el of details.querySelectorAll<HTMLElement>('.colour-button'))if(!labels.has(el)){labels.set(el,el.getAttribute('title'));el.title=el.textContent?.trim()??''}
  for(const el of labels.keys())if(!el.isConnected)labels.delete(el);
  state.hasDetails=!!details.querySelector('.clothing-colours-div');
  footer!.hidden=!footer!.querySelector('.buy-buttons,.try-buttons');
  details.classList.toggle('dgshop-detail-open',state.open&&state.hasDetails);
  // Catalog replacement after purchase/search must not jump back to the page top.
  // Native pages arrive incrementally: a temporary clamp must not erase the saved position.
  catalog!.scrollTop=scrollTop;restoredScroll.set(catalog!,catalog!.scrollTop);
  if(selected){
   for(const item of catalog!.querySelectorAll<HTMLElement>('.clothing-item'))item.classList.toggle('dgshop-selected',item.querySelector('a')?.textContent?.replace(/^\s*\([^)]*\)\s*/, '').trim()===selected);
  }else{
   // Most catalogue updates have no selection; only clear a stale highlight if present.
   catalog!.querySelectorAll<HTMLElement>('.dgshop-selected').forEach(item=>item.classList.remove('dgshop-selected'));
  }
  observe();
 }
 function applyDefaultGender(){
  if(!enabled||state.defaultGender==='game'||!shop?.querySelector('#clothes-list'))return false;
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
 function updateSelected(items:Iterable<HTMLElement>){for(const item of items)item.classList.toggle('dgshop-selected',!!selected&&item.querySelector('a')?.textContent?.replace(/^\s*\([^)]*\)\s*/, '').trim()===selected)}
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
 function click(event:Event){if(!enabled||!shop?.contains(event.target as Node))return;const target=(event.target as Element).closest<HTMLElement>('.clothing-item,.category-tab,.btn-pagination');if(!target)return;
  if(target.matches('.clothing-item')){selected=target.querySelector('a')?.textContent?.replace(/^\s*\([^)]*\)\s*/, '').trim()??'';focusReturn=target.querySelector('a');state.open=true}else{scrollTop=0;selected='';state.open=false}
  schedule();
 }
 function escape(event:KeyboardEvent){if(event.key==='Escape'&&state.open&&!document.querySelector('dialog[open],#customOverlay:not(.hidden)')&&!shop?.querySelector('.no-click-overlay:not(.hidden)'))toggle(false)}
 const observer=new MutationObserver(records=>{if(!fastPath(records))schedule()});
 const discovery=new MutationObserver(()=>{if(document.querySelector('.passage #clothingShop-div')!==shop)schedule()});
 function setEnabled(value:boolean){if(destroyed)return;enabled=!!value;try{root.localStorage.setItem(key,String(enabled))}catch{/* Session preference. */}refresh();document.dispatchEvent(new Event('dol-ui-shop-change'))}
 document.addEventListener('click',click,true);document.addEventListener('keydown',escape);discovery.observe(document.body,{childList:true,subtree:true});refresh();
 return {getDefaultGender:()=>state.defaultGender,setDefaultGender,getEnabled:()=>enabled,setEnabled,getLifecycleCounts:()=>({...counts}),destroy(){destroyed=true;if(frame)cancelAnimationFrame(frame);observer.disconnect();discovery.disconnect();document.removeEventListener('click',click,true);document.removeEventListener('keydown',escape);release();shop=null}};
}
