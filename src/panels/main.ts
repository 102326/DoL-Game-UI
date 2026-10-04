import {createApp,reactive,type App} from 'vue';
import Navigation from './Navigation.vue';
import {panelPresentation} from './presentation';
import {visible} from './visibility';
import {isMasterEnabled} from '../runtime/master';
import './style.css';
export type PanelKind='journal'|'traits'|'statistics'|'feats'|'cheats'|'attitudes'|'settings';
export interface NavigationState{title:string;sections:string[]}
type Runtime=Window & Record<string,any>;
const titles:Record<PanelKind,string>={journal:'日志',traits:'特质',statistics:'统计',feats:'成就',cheats:'作弊',attitudes:'态度',settings:'游戏设置'};
const panelKeys:Record<string,PanelKind>={options:'settings',cheats:'cheats',journal:'journal',journalNotes:'journal',traits:'traits',statistics:'statistics',gameFeats:'feats',startFeats:'feats'};
const selectors:Record<PanelKind,string>={
 journal:'h1.header,details.journal > summary,#journalNotesTextarea',
 traits:'#traitListsSearch .foldoutHeader,#traitLists .traitHeading,#traitLists h4',
 statistics:'.foldout > .foldoutHeader,#moneyButton,#spoilerWarning,#spoilerWarningConfirmed > h3',
 attitudes:'.settingsHeader',settings:'.settingsHeader',
 cheats:'#cheatsShown .settingsHeader',
 feats:'#featTypes,#featsList'
};
const fixedLabels:Record<string,string>={journalNotesTextarea:'笔记编辑',moneyButton:'详细统计',spoilerWarning:'额外统计提示',featTypes:'筛选与排序',featsList:'成就列表'};
export function startPanels(root:Runtime){
 const preferences:Record<PanelKind,boolean>={journal:true,traits:true,statistics:true,feats:true,cheats:true,attitudes:true,settings:true};
 for(const kind of Object.keys(preferences) as PanelKind[])try{preferences[kind]=root.localStorage.getItem(`DoLGameUI.${kind}.enabled`)!=='false'}catch{/* Session fallback. */}
 let overlay:HTMLElement|null=null,content:HTMLElement|null=null,host:HTMLElement|null=null,app:App|undefined,active:PanelKind|undefined,frame=0,destroyed=false;
 let targets:HTMLElement[]=[];
 const state=reactive<NavigationState>({title:'',sections:[]});
 const counts={mounts:0,scans:0,failures:0};
 let lastFailure='';
 const presentation=panelPresentation(),passagePresentation=panelPresentation();
 function unmount(value:App|undefined){try{value?.unmount()}catch(error){console.warn('DoLGameUI panel cleanup',error)}}
 function release(){presentation.release();unmount(app);app=undefined;host?.remove();host=null;overlay?.classList.remove('dgp-overlay');overlay?.removeAttribute('data-dgp-panel');content=null;active=undefined;targets=[]}
 function go(index:number){
  if(!content)return;
  const target=targets[index];
  if(index!==-1&&(!target||!content.contains(target)||!visible(target)))return;
  content.scrollTo({top:index<0?0:content.scrollTop+target.getBoundingClientRect().top-content.getBoundingClientRect().top-12,behavior:'auto'});
 }
 let seenPassage:Element|null=null;
 let passage:HTMLElement|null=null,passageHost:HTMLElement|null=null,passageApp:App|undefined;
 let passageTargets:HTMLElement[]=[];
 const passageState=reactive<NavigationState>({title:'',sections:[]});
 function releasePassage(){passageObserver.disconnect();passagePresentation.release();unmount(passageApp);passageApp=undefined;passageHost?.remove();passageHost=null;passage?.classList.remove('dgp-overlay');passage?.removeAttribute('data-dgp-panel');passage=null;passageTargets=[]}
 function recover(kind:PanelKind,error:unknown,inline=false){
  if(!isMasterEnabled()){if(inline)releasePassage();else release();return}
  const parent=inline?passage:overlay;
  counts.failures++;lastFailure=String(error);console.warn('DoLGameUI panel reverted',kind,error);
  preferences[kind]=false;try{root.localStorage.setItem(`DoLGameUI.${kind}.enabled`,'false')}catch{}
  if(inline)releasePassage();else release();
  // Native insurance control lives outside the Vue host; cleanup never owns it.
  if(parent?.isConnected){
   parent.querySelector('.dgp-recovery')?.remove();
   const button=document.createElement('button');button.type='button';button.className='dgp-recovery';button.textContent=`返回原版${titles[kind]}`;
   button.addEventListener('click',()=>{setEnabled(kind,false);button.remove()});parent.prepend(button);
  }
  document.dispatchEvent(new Event('dol-ui-panels-change'));
 }
 function mount(value:App,node:HTMLElement,kind:PanelKind,inline=false){
  let mounting=true,mountError:unknown;
  value.config.errorHandler=error=>{if(mounting)mountError=error;else queueMicrotask(()=>{if(node.isConnected)recover(kind,error,inline)})};
  try{value.mount(node);if(mountError)throw mountError}finally{mounting=false}
 }
 function index(body:HTMLElement,kind:PanelKind,state:NavigationState){
  const nodes=[...body.querySelectorAll<HTMLElement>(selectors[kind])].filter(visible);
  const labels=nodes.map(node=>fixedLabels[node.id]||node.textContent?.replace(/\s+/g,' ').trim()||titles[kind]);
  if(labels.length!==state.sections.length||labels.some((label,i)=>label!==state.sections[i]))state.sections=labels;
  return nodes;
 }
 function refreshPassage(){
  const next=document.querySelector<HTMLElement>('#passages .passage:last-child');
  seenPassage=next;
  const name=next?.dataset.passage??'';
  const kind:PanelKind|undefined=['Attitudes','Livestock Attitudes'].includes(name)?'attitudes':['Settings','Livestock Settings'].includes(name)?'settings':undefined;
  if(!isMasterEnabled()||!next||!kind||!preferences[kind]){if(passage)releasePassage();return}
  if(passage!==next||!passageHost?.isConnected){
   releasePassage();passage=next;passage.classList.add('dgp-overlay');passage.dataset.dgpPanel=kind;passageState.title=titles[kind];passageState.sections=[];
   passageHost=document.createElement('div');passageHost.className='dgp-host';passage.prepend(passageHost);
   passageApp=createApp(Navigation,{state:passageState,go:(index:number)=>{const target=index<0?passage:passageTargets[index];if(target&&passage?.contains(target)&&visible(target))target.scrollIntoView({block:'start'})},fallback:()=>setEnabled(kind,false)});
   mount(passageApp,passageHost,kind,true);
   passageObserver.observe(passage,watch);
  }
  passagePresentation.refresh(passage,kind);
  passageTargets=index(passage,kind,passageState);
 }
 function refresh(){
  if(destroyed)return;
  if(!isMasterEnabled())document.querySelectorAll('.dgp-recovery').forEach(n=>n.remove());
  try{refreshPassage()}catch(error){recover(passage?.dataset.dgpPanel as PanelKind||'settings',error,true)}
  try{refreshOverlay()}catch(error){recover(active||panelKeys[overlay?.dataset.overlay??'']||'settings',error)}
 }
 function refreshOverlay(){
  const next=document.getElementById('customOverlay');
  if(next!==overlay){release();observer.disconnect();overlay=next;if(overlay)observer.observe(overlay,watch)}
  const kind=panelKeys[overlay?.dataset.overlay??''];
  const body=overlay?.querySelector<HTMLElement>('#customOverlayContent')??null;
  if(!isMasterEnabled()||!kind||!preferences[kind]||!body||overlay?.classList.contains('hidden')){if(host)release();return}
  if(active!==kind||content!==body||!host?.isConnected){
   release();active=kind;content=body;host=document.createElement('div');host.className='dgp-host';body.before(host);
   state.title=titles[kind];state.sections=[];
   app=createApp(Navigation,{state,go,fallback:()=>setEnabled(kind,false)});mount(app,host,kind);
   overlay!.classList.add('dgp-overlay');overlay!.dataset.dgpPanel=kind;counts.mounts++;
  }
  counts.scans++;
  presentation.refresh(body,kind);
  // Index rendered headings only: do not rerun macros, read hidden feat definitions,
  // clone notes inputs, or cache game variables. Native tabs can replace this body.
  targets=index(body,kind,state);
 }
 function schedule(){if(!destroyed&&!frame)frame=requestAnimationFrame(()=>{frame=0;refresh()})}
 const watch:MutationObserverInit={childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-overlay','hidden','class','style']};
 function changed(records:MutationRecord[],inline=false){
  if(!inline&&!panelKeys[overlay?.dataset.overlay??'']){if(host)schedule();return}
  try{if(records.some(r=>{
   if(host?.contains(r.target)||passageHost?.contains(r.target))return false;
   if(r.type==='childList')return true;
   const node=r.target instanceof Element?r.target:r.target.parentElement;
   if(!node)return false;
   if(r.type==='characterData')return !!node.closest('.settingsHeader,.traitHeading,h4,h1.header,summary,.foldoutHeader,#moneyButton,#spoilerWarning');
   return node===overlay||node===passage||node===content||node.matches('.trait')||!!node.querySelector('.settingsHeader,.traitHeading,h4,h1.header,summary,.foldoutHeader,.trait,#featTypes,#featsList')||node.matches('.settingsHeader,.traitHeading,h4,h1.header,summary,.foldoutHeader,#featTypes,#featsList');
  }))schedule()}catch(error){recover((inline?passage?.dataset.dgpPanel:active) as PanelKind||'settings',error,inline)}
 }
 const observer=new MutationObserver(records=>changed(records)),passageObserver=new MutationObserver(records=>changed(records,true));
 // Discover only root replacement; never watch the entire document subtree.
 const discovery=new MutationObserver(()=>{if(document.getElementById('customOverlay')!==overlay||document.querySelector('#passages .passage:last-child')!==seenPassage)schedule()});
 function setEnabled(kind:PanelKind,value:boolean){if(destroyed||!Object.hasOwn(preferences,kind))return;preferences[kind]=!!value;try{root.localStorage.setItem(`DoLGameUI.${kind}.enabled`,String(!!value))}catch{/* Display changes still apply. */}refresh();document.dispatchEvent(new Event('dol-ui-panels-change'))}
 const overlayParent=document.getElementById('customOverlay')?.parentElement,passages=document.getElementById('passages');
 if(overlayParent)discovery.observe(overlayParent,{childList:true});
 if(passages)discovery.observe(passages,{childList:true});
 root.jQuery?.(document).on(':passageend.dolPanels',schedule);refresh();
 return {getEnabled:(kind:PanelKind)=>preferences[kind],setEnabled,refresh,getLifecycleCounts:()=>({...counts}),getLastFailure:()=>lastFailure,destroy(){destroyed=true;if(frame)cancelAnimationFrame(frame);root.jQuery?.(document).off(':passageend.dolPanels',schedule);discovery.disconnect();observer.disconnect();release();releasePassage();document.querySelectorAll('.dgp-recovery').forEach(n=>n.remove());overlay=null}};
}
