import {createNativeWardrobe} from './native';
import {createWardrobePerformance} from './performance';
import {createApp,reactive,type App} from 'vue';
import WardrobePanel from './WardrobePanel.vue';
import {LABELS,snapshot,entries,itemName,itemView,slotCapacity,validate,type Snapshot,type Entry,descriptor} from './data';
import {renderOutfit} from './render';
import {mirrorSidebar} from './sidebar-preview';
import {createWardrobeExtras} from './extras';
import {createOutfitLayout} from './outfit-layout';
import type {WardrobeModel,Operation} from './types';
import {repairMinutes,pieces,canRepair,destinations,targetInventory,transferProblem} from './operations';
import './style.css';
import {isMasterEnabled} from '../runtime/master';
export function startWardrobe(root:any){
 const timing=createWardrobePerformance(),native=createNativeWardrobe(root,timing),extras=createWardrobeExtras(root);
 const KEY='DoLGameUI.wardrobe.v1';let enabled=true,nativeHiddenList=false,disposed=false,queued=false,generation=0;
 try{enabled=localStorage.getItem(KEY)!=='false'}catch{}
 interface Session {passage:HTMLElement;host:HTMLElement;original:HTMLElement;anchor:Comment;toggle:HTMLButtonElement;exit?:HTMLElement;exitAnchor?:Comment;app?:App;view:any;state:WardrobeModel;snapshot:Snapshot;plan?:{mode:Operation;entries:Entry[];location:string;inventory:any;fingerprint:string;target?:string;targetFingerprint?:string};entries?:Entry[];paintKey?:string;refreshQueued?:boolean;moved?:{node:HTMLElement;anchor:Comment}[];nativeOpen?:boolean;nativeListDirty?:boolean}
 let active:Session|undefined,previewAbort:AbortController|undefined;
 const outfits=createOutfitLayout();
 function isCurrentPassage(s:Session){return s.passage.isConnected&&!s.passage.classList.contains('passage-out')&&s.passage.dataset.passage===(root.SugarCube?.State??root.State)?.passage&&document.querySelector('#passages .passage:not(.passage-out)')===s.passage}
 function flushNative(s:Session,force=false){
  if(!s.nativeListDirty||!isCurrentPassage(s)||(!force&&!s.nativeOpen))return;
  if(!native.available()||!s.original.querySelector('#wardrobeList'))return;
  try{
   const output=native.refreshList();
   const error=output.querySelector('.error')||s.original.querySelector('#wardrobeList .error');
   if(error){console.error('[DoLGameUI] native list refresh failed',error);s.state.message='原版衣柜列表刷新失败，请在界面设置中切换原版衣柜检查。';return}
   s.nativeListDirty=false;
  }catch(error){console.error('[DoLGameUI] native list refresh failed',error);s.state.message='原版衣柜列表刷新失败，请在界面设置中切换原版衣柜检查。'}
 }
 function withNativeListHidden<T>(s:Session,operation:()=>T):T{
  if(!nativeHiddenList||s.nativeOpen||!isCurrentPassage(s)||!s.original.isConnected||document.querySelectorAll('#wardrobeList').length!==1)return operation();
  const list=s.original.querySelector<HTMLElement>('#wardrobeList');if(!list?.parentNode)return operation();
  list.removeAttribute('id');s.nativeListDirty=true;
  try{return operation()}finally{list.id='wardrobeList'}
 }
 function release(){const s=active;if(!s)return;flushNative(s,true);generation++;previewAbort?.abort();
  outfits.restore();
  // Restore the actual nodes, including changes made by native widgets.
  for(const {node,anchor} of s.moved??[]){if(node.isConnected&&anchor.parentNode)anchor.replaceWith(node);else anchor.remove()}
  if(s.exit&&s.exitAnchor?.parentNode)s.exitAnchor.replaceWith(s.exit);
  if(s.anchor.parentNode){while(s.original.firstChild)s.anchor.parentNode.insertBefore(s.original.firstChild,s.anchor);}
  s.app?.unmount();s.host.remove();s.toggle.remove();s.anchor.remove();active=undefined;
 }
 async function paint(s:Session){
  previewAbort?.abort();const controller=new AbortController();previewAbort=controller;
  const ticket=++generation;let revision=0;
  const valid=()=>ticket===generation&&active===s&&!controller.signal.aborted;
  const show=(canvas:HTMLCanvasElement)=>{if(!valid())return;revision++;s.view.preview?.replaceChildren(canvas);s.state.previewStatus='当前角色的完整穿搭';s.state.loading=false};
  async function fallback(){
   const attempt=++revision;
   try{const canvas=await renderOutfit(root,s.snapshot,s.snapshot.worn,[],timing);if(valid()&&attempt===revision)show(canvas)}
   catch(error){if(!valid()||attempt!==revision)return;console.error('[DoLGameUI] wardrobe preview failed',error);s.state.previewStatus='本次预览不可用';s.state.message=error instanceof Error?error.message:'请使用原版衣柜'}
   finally{if(valid()&&attempt===revision)s.state.loading=false}
  }
  s.state.canWear=false;s.state.loading=true;s.state.previewStatus='正在生成完整穿搭…';s.view.preview?.replaceChildren();
  const mirrored=s.view.preview?await mirrorSidebar(s.view.preview,controller.signal,()=>{void fallback()},show):null;
  if(!valid())return;
  if(mirrored)show(mirrored);else await fallback();
 }
 function refresh(s:Session,force=false,message=s.state.message){
  return timing.measure('ui.refresh',()=>refreshModel(s,force,message));
 }
 function refreshModel(s:Session,force=false,message=s.state.message){
  if(s.view?.actions)outfits.sync(s.view.actions);
  const fresh=snapshot(root);if(!fresh){release();return}s.snapshot=fresh;
  const labels={...LABELS,...(fresh.variables.debug?{over_head:'外层头饰',over_upper:'外套',over_lower:'外层下装'}:{})};
  s.state.slots=Object.entries(labels).filter(([k])=>Array.isArray(fresh.inventory[k])).map(([key,label])=>({key,label,count:fresh.inventory[key].length,capacity:slotCapacity(fresh)}));
  if(!s.state.slots.some(t=>t.key===s.state.slot))s.state.slot=s.state.slots[0]?.key||'upper';
  s.state.owned=fresh.inventory[s.state.slot]?.length??0;s.state.capacity=slotCapacity(fresh);
  s.state.canRepair=canRepair(fresh);
  s.state.destinations=destinations(fresh);
  const next=entries(fresh,s.state.slot),previous=s.entries;
  const same=previous?.length===next.length&&next.every((e,i)=>{const old=previous[i];return old.raw===e.raw&&old.key===e.key&&old.name===e.name&&old.colour===e.colour&&old.warmth===e.warmth&&old.durability===e.durability&&old.detail===e.detail&&old.splittable===e.splittable&&old.lewd===e.lewd&&old.outfit===e.outfit&&JSON.stringify(old.traits)===JSON.stringify(e.traits)&&JSON.stringify(old.icons)===JSON.stringify(e.icons)});
  s.entries=next;if(!same)s.state.items=next;
  const worn=fresh.worn[s.state.slot];s.state.wornItem=worn&&worn.name!=='naked'?itemView(fresh,s.state.slot,worn,'worn:'+s.state.slot):null;s.state.wornName=worn?itemName(fresh,s.state.slot,worn):'';
  const def=fresh.setup.clothes[s.state.slot]?.find((d:any)=>d.variable===worn?.variable&&d.modder===worn?.modder);s.state.currentWarmth=Number.isFinite(def?.warmth)?def.warmth:null;
  s.state.selected=null;
  const key=JSON.stringify([fresh.worn,fresh.variables.upperTucked,fresh.variables.lowerTucked,fresh.variables.bellyTucked,fresh.variables.facelayer,fresh.variables.dontHide,fresh.variables.upperwet,fresh.variables.lowerwet,fresh.variables.underupperwet,fresh.variables.underlowerwet]);
  if(force||key!==s.paintKey){s.paintKey=key;void paint(s)}
  s.state.message=message;
  try{if(s.view?.equipment&&s.view?.services)extras.render(fresh,s.state.slot,s.view.equipment,s.view.services,()=>queueRefresh(s))}catch(error){s.state.message=error instanceof Error?error.message:'附加衣柜功能不可用，请在界面设置中打开原版衣柜。'}

 }
 function queueRefresh(s:Session){
  if(s.refreshQueued)return;s.refreshQueued=true;
  requestAnimationFrame(()=>{s.refreshQueued=false;if(active===s)refresh(s)});
 }
 function wear(s:Session,e:Entry){
  if(s.state.busy)return;
  const fresh=snapshot(root);if(!fresh)return;
  if(fresh.location!==s.snapshot.location||!validate(fresh,e)){refresh(s);s.state.message='衣柜内容已变化，请重新选择';return}
  if(!native.available()){s.state.message='换装接口尚不可用';return}
  // This is the only write path. Pass the same slot/index as native wearlink_norefresh.
  try{
   s.state.canWear=false;
   const output=withNativeListHidden(s,()=>native.action('wear',e.slot,e.index));
   const error=output.querySelector('.error')||s.passage.querySelector('.error');
   s.state.message=error?'原版换装报告了错误，请在界面设置中切换原版衣柜检查。':(native.message(s.original)||'已由游戏处理换装。');queueRefresh(s);
  }catch{refresh(s);s.state.message='原版换装未完成，请在原版衣柜检查当前装备。'}
 }
 function strip(s:Session){
  if(s.state.busy)return;
  const slot=s.state.slot;if(!s.state.slots.some(t=>t.key===slot))return;
  if(!native.available())return;
  try{withNativeListHidden(s,()=>native.action('wear',slot,'strip'));
   s.state.message=native.message(s.original)||'已由游戏处理脱下操作';queueRefresh(s);
  }catch{s.state.message='脱下操作未完成，请在界面设置中切换原版衣柜检查';queueRefresh(s)}
 }
 function cancel(s:Session){if(s.state.busy)return;s.plan=undefined;s.state.pending=[];s.state.pendingMinutes=null}
 function review(s:Session,keys:string[],mode:Operation='delete',target?:string){
  if(s.state.busy)return;cancel(s);
  const fresh=snapshot(root),chosen=[...new Set(keys)].map(k=>s.entries?.find(e=>e.key===k));
  if(!fresh||!chosen.length||chosen.some(e=>!e||!validate(fresh,e))){s.state.message='衣柜内容已变化，请重新勾选';return}
  const list=chosen as Entry[];
  if(mode==='separateOutfits'&&list.some(e=>!e.splittable)){s.state.message='请选择尚未剪开的套装主件';return}
  s.state.pendingMode=mode;
  if(mode==='repair'&&!canRepair(fresh)){s.state.message='当前没有可用的修理条件';return}
  const targetData=mode==='transfer'?targetInventory(fresh,target):undefined;
  const problem=mode==='transfer'?transferProblem(fresh,list,target):'';
  if(problem){s.state.message=problem;return}
  s.plan={mode,entries:list,location:fresh.location,inventory:fresh.inventory,fingerprint:JSON.stringify(fresh.inventory),target,targetFingerprint:targetData?JSON.stringify(targetData):undefined};
  s.state.pendingMinutes=mode==='repair'?repairMinutes(fresh.inventory,list):mode==='separateOutfits'?10*list.length:null;
  s.state.pending=list.map(e=>({key:e.key,name:e.name,colour:e.colour,linked:!!e.raw.outfitPrimary}));
 }
 async function discard(s:Session){
  const plan=s.plan;if(!plan||s.state.busy)return;
  if(!native.available()){s.state.message='原版处理接口不可用';return}
  const fresh=snapshot(root);
  if(!fresh||fresh.inventory!==plan.inventory||fresh.location!==plan.location||JSON.stringify(fresh.inventory)!==plan.fingerprint){cancel(s);refresh(s);s.state.message='确认期间衣柜发生变化，本次未操作，请重新选择';return}
  s.state.busy=true;s.original.inert=true;s.view.actions.inert=true;s.view.equipment.inert=true;s.view.services.inert=true;
  let done=0,removed=0,skipped=0,reason='',expected=plan.fingerprint;const skippedReasons:string[]=[];
  const count=(inventory:any)=>Object.values(inventory).reduce((n:number,a:any)=>n+(Array.isArray(a)?a.length:0),0);
  try{
   for(const e of plan.entries){
    const current=snapshot(root);
    if(active!==s||!isCurrentPassage(s)||!current||current.inventory!==plan.inventory||current.location!==plan.location||JSON.stringify(current.inventory)!==expected){reason='衣柜或页面发生变化，剩余操作已停止';break}
    const index=current.inventory[e.slot]?.indexOf(e.raw)??-1;
    if(index<0){skipped++;skippedReasons.push(`${e.name}：已随关联操作移除`);continue}
    if(plan.mode==='repair'&&!canRepair(current)){reason='修理条件已变化，剩余操作已停止';break}
    const targetData=plan.mode==='transfer'?targetInventory(current,plan.target):undefined;
    if(plan.mode==='transfer'){
     if(JSON.stringify(targetData)!==plan.targetFingerprint){reason='目标衣柜发生变化，剩余操作已停止';break}
     const problem=transferProblem(current,[e],plan.target);if(problem){reason=problem;break}
    }
    const affected=pieces(current,e),before=count(current.inventory),beforeItem=JSON.stringify(e.raw),output=native.action(plan.mode,e.slot,index,plan.target);
    const after=count(current.inventory);removed+=Math.max(0,before-after);
    const success=plan.mode==='repair'?affected.every(p=>{
      const max=typeof root.clothingData==='function'?root.clothingData(p.slot,p.raw,'integrity_max'):descriptor(current,p.slot,p.raw)?.integrity_max;
      return Number.isFinite(max)&&p.raw.integrity===max;
     }):plan.mode==='transfer'?affected.every(p=>!current.inventory[p.slot].includes(p.raw)&&targetData?.[p.slot]?.includes(p.raw)):plan.mode==='separateOutfits'?e.raw.one_piece==='split'&&JSON.stringify(e.raw)!==beforeItem:!current.inventory[e.slot].includes(e.raw);
    if(success)done++;else {skipped++;skippedReasons.push(`${e.name}：${native.message(s.original)||'游戏未允许本次操作'}`)}
    if(output.querySelector('.error')||s.passage.querySelector('.error')){reason='原版处理报错，剩余操作已停止';break}
    expected=JSON.stringify(current.inventory);
    if(plan.mode==='transfer')plan.targetFingerprint=JSON.stringify(targetData);
    s.state.progress=`已处理 ${done+skipped} / ${plan.entries.length} 项`;
    await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
   }
  }catch{reason='处理异常，剩余操作已停止'}
  finally{
   // Never leave the original wardrobe in destructive mode.
   native.resetMode(fresh.variables);
   s.state.busy=false;s.original.inert=false;if(s.view.equipment)s.view.equipment.inert=false;if(s.view.services)s.view.services.inert=false;if(s.view.actions)s.view.actions.inert=false;s.plan=undefined;s.state.pending=[];s.state.pendingMinutes=null;s.state.progress='';
   if(active===s){try{native.refreshList()}catch{reason+=' 原版列表刷新失败'}refresh(s);s.state.message=plan.mode==='separateOutfits'?`已剪开 ${done} 套，跳过 ${skipped} 项。${reason}${skippedReasons.join('；')}`:plan.mode==='repair'?`已修理 ${done} 件，跳过 ${skipped} 项。${reason}${skippedReasons.join('；')}`:plan.mode==='transfer'?`已转移 ${done} 件，跳过 ${skipped} 项。${reason}${skippedReasons.join('；')}`:`已丢弃 ${done} 个选中项（含关联部件共 ${removed} 件），跳过 ${skipped} 项。${reason}${skippedReasons.join("；")}`;}
  }
 }
 function mount(passage:HTMLElement){
  const data=snapshot(root);if(!data)return;
  const anchor=document.createComment('DoL wardrobe original content');
  const header=passage.querySelector(':scope > #passage-header');
  if(header)header.after(anchor);else passage.prepend(anchor);
  const original=document.createElement('div');original.className='dgw-preserved';
  // Keep the native close/return controls visible and bound to their original events.
  // SugarCube header/footer remain owned by the game and mods (e.g. floating pets).
  for(const node of [...passage.childNodes])if(node!==anchor&&!(node instanceof Element&&node.matches('#passage-header,#passage-footer')))original.append(node);
  const exit=original.querySelector<HTMLElement>('#wardrobeExits')??undefined;
  const exitAnchor=exit?document.createComment('DoL wardrobe exit position'):undefined;
  if(enabled&&exit&&exitAnchor){exit.before(exitAnchor);passage.insertBefore(exit,anchor)}
  const host=document.createElement('div');host.className='dgw-root';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='dgw-fallback';toggle.textContent='启用穿搭衣柜';toggle.hidden=true;toggle.onclick=()=>setEnabled(true);
  passage.insertBefore(toggle,anchor);passage.insertBefore(host,anchor);
  const state=reactive<WardrobeModel>({pendingMode:'delete',canRepair:false,destinations:[],pendingMinutes:null,wornItem:null,owned:0,capacity:null,busy:false,pending:[],progress:'',slots:[],slot:LABELS[data.variables.lastWardrobeSlot]?data.variables.lastWardrobeSlot:'upper',items:[],selected:null,loading:false,message:'',previewStatus:'',canWear:false,wornName:'',currentWarmth:null});
  const s:Session={passage,host,original,anchor,toggle,state,snapshot:data,view:null,exit:enabled?exit:undefined,exitAnchor:enabled?exitAnchor:undefined};active=s;
  if(!enabled){host.className='';host.append(original);return}
  s.app=createApp(WardrobePanel,{model:state,resolveIcon:async(src:string)=>{try{return await root.modUtils?.getImage?.(src)||src}catch{return src}},onSplit:(keys:string[])=>review(s,keys,'separateOutfits'),onRepair:(keys:string[])=>review(s,keys,'repair'),onTransfer:(keys:string[],target:string)=>review(s,keys,'transfer',target),onTowel:(kind:'towel'|'large_towel')=>{if(!state.busy){try{withNativeListHidden(s,()=>native.action('wear',state.slot,kind));state.message=native.message(s.original)||'已由游戏处理毛巾操作'}catch(error){state.message=error instanceof Error?error.message:'毛巾操作失败'}queueRefresh(s)}},onSlot:(key:string)=>{
   if(state.busy||!state.slots.some(t=>t.key===key))return;cancel(s);state.slot=key;
   s.nativeListDirty=true;
   if(native.available()){try{native.setSlot(key);if(s.nativeOpen)flushNative(s)}catch(error){console.error('[DoLGameUI] wardrobe category update failed',error);state.message='原版衣柜分类刷新失败，请在界面设置中切换原版衣柜检查。'} }
   refresh(s);
  },onSelect:(key:string)=>{const e=s.entries?.find(i=>i.key===key);if(e)wear(s,e)},onReview:(keys:string[])=>review(s,keys),onConfirm:()=>void discard(s),onCancel:()=>cancel(s),onStrip:()=>strip(s)});
  s.view=s.app.mount(host);if(s.exit)s.view.exits.append(s.exit);s.view.native.append(original);s.nativeOpen=false;s.nativeListDirty=false;
  s.moved=[];
  const controls=[...original.querySelectorAll<HTMLElement>('.wardrobe-dry,.wardrobe-action,#randomClothingConfigure,#listoutfits')].filter(n=>!n.closest('#wardrobeList,#wardrobeLinks')&&!n.parentElement?.closest('#listoutfits,.wardrobe-action,.wardrobe-dry'));
  for(const node of controls){const a=document.createComment('DoL wardrobe control position');node.before(a);s.moved.push({node,anchor:a});s.view.actions.append(node)}
  for(const node of [...original.querySelectorAll<HTMLElement>('.warmth-scale-container,#warmth-description')]){const a=document.createComment('DoL wardrobe warmth position');node.before(a);s.moved.push({node,anchor:a});s.view.warmth.append(node)}
  refresh(s);
 }
 function scan(){
  if(disposed)return;
  if(!isMasterEnabled()){release();return}
  const list=document.querySelector<HTMLElement>('#passages .passage #wardrobeList');
  const passage=list?.closest<HTMLElement>('.passage');
  if(!passage){release();return}
  if(active?.passage!==passage){release();mount(passage)}
 }
 function schedule(){if(disposed||queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
 function setEnabled(value:boolean){if(active?.state.busy){document.dispatchEvent(new Event('dol-ui-wardrobe-change'));return}enabled=!!value;try{localStorage.setItem(KEY,String(enabled))}catch{}release();schedule();document.dispatchEvent(new Event('dol-ui-wardrobe-change'))}
 function setNativeHiddenList(value:boolean){nativeHiddenList=!!value;if(!nativeHiddenList&&active?.nativeListDirty)flushNative(active,true);}
 const observer=new MutationObserver(records=>{
  if(active?.app&&records.some(r=>active?.original.contains(r.target)||active?.view.actions?.contains(r.target)))queueRefresh(active);
  if(records.some(r=>!(r.target instanceof Element?r.target:r.target.parentElement)?.closest('.dgw-root')))schedule();
 });
 function start(){if(disposed)return;observer.observe(document.getElementById('passages')||document.body,{childList:true,subtree:true});root.jQuery?.(document).on(':passageend.dgw :storyready.dgw',schedule);schedule()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 return {performance:timing,getEnabled:()=>enabled,isBusy:()=>!!active?.state.busy,setEnabled,getNativeHiddenList:()=>nativeHiddenList,setNativeHiddenList,refresh:()=>{if(!isMasterEnabled()){release();return}if(active?.app)refresh(active,true);else schedule()},destroy(){timing.setEnabled(false);timing.reset();disposed=true;observer.disconnect();root.jQuery?.(document).off('.dgw');document.removeEventListener('DOMContentLoaded',start);release()}};
}
