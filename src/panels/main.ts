import {createApp,reactive,type App} from 'vue';
import Navigation from './Navigation.vue';
import './style.css';
export type PanelKind='journal'|'traits'|'statistics'|'feats';
export interface NavigationState{title:string;sections:string[]}
type Runtime=Window & Record<string,any>;
const titles:Record<PanelKind,string>={journal:'日志',traits:'特质',statistics:'统计',feats:'成就'};
const panelKeys:Record<string,PanelKind>={journal:'journal',journalNotes:'journal',traits:'traits',statistics:'statistics',gameFeats:'feats',startFeats:'feats'};
const selectors:Record<PanelKind,string>={
 journal:'h1.header,details.journal > summary,#journalNotesTextarea',
 traits:'#traitListsSearch .foldoutHeader,#traitLists .traitHeading,#traitLists h4',
 statistics:'.foldout > .foldoutHeader,#moneyButton,#spoilerWarning,#spoilerWarningConfirmed > h3',
 feats:'#featTypes,#featsList'
};
const fixedLabels:Record<string,string>={journalNotesTextarea:'笔记编辑',moneyButton:'详细统计',spoilerWarning:'额外统计提示',featTypes:'筛选与排序',featsList:'成就列表'};
export function startPanels(root:Runtime){
 const preferences:Record<PanelKind,boolean>={journal:true,traits:true,statistics:true,feats:true};
 for(const kind of Object.keys(preferences) as PanelKind[])try{preferences[kind]=root.localStorage.getItem(`DoLGameUI.${kind}.enabled`)!=='false'}catch{/* Session fallback. */}
 let overlay:HTMLElement|null=null,content:HTMLElement|null=null,host:HTMLElement|null=null,app:App|undefined,active:PanelKind|undefined,frame=0,destroyed=false;
 let targets:HTMLElement[]=[];
 const state=reactive<NavigationState>({title:'',sections:[]});
 const counts={mounts:0,scans:0};
 function release(){app?.unmount();app=undefined;host?.remove();host=null;overlay?.classList.remove('dgp-overlay');overlay?.removeAttribute('data-dgp-panel');content=null;active=undefined;targets=[]}
 function go(index:number){
  if(!content)return;
  const target=targets[index];
  if(index!==-1&&(!target||!content.contains(target)))return;
  content.scrollTo({top:index<0?0:content.scrollTop+target.getBoundingClientRect().top-content.getBoundingClientRect().top-12,behavior:'auto'});
 }
 function refresh(){
  if(destroyed)return;
  const next=document.getElementById('customOverlay');
  if(next!==overlay){release();observer.disconnect();overlay=next;if(overlay)observer.observe(overlay,{attributes:true,attributeFilter:['data-overlay','class'],childList:true,subtree:true})}
  const kind=panelKeys[overlay?.dataset.overlay??''];
  const body=overlay?.querySelector<HTMLElement>('#customOverlayContent')??null;
  if(!kind||!preferences[kind]||!body||overlay?.classList.contains('hidden')){if(host)release();return}
  if(active!==kind||content!==body||!host?.isConnected){
   release();active=kind;content=body;host=document.createElement('div');host.className='dgp-host';body.before(host);
   state.title=titles[kind];state.sections=[];
   app=createApp(Navigation,{state,go,fallback:()=>setEnabled(kind,false)});app.mount(host);
   overlay!.classList.add('dgp-overlay');overlay!.dataset.dgpPanel=kind;counts.mounts++;
  }
  counts.scans++;
  // Index rendered headings only: do not rerun macros, read hidden feat definitions,
  // clone notes inputs, or cache game variables. Native tabs can replace this body.
  targets=[...body.querySelectorAll<HTMLElement>(selectors[kind])].filter(node=>!node.closest('[hidden],.hidden'));
  const labels=targets.map(node=>fixedLabels[node.id]||node.textContent?.replace(/\s+/g,' ').trim()||titles[kind]);
  if(labels.length!==state.sections.length||labels.some((label,i)=>label!==state.sections[i]))state.sections=labels;
 }
 function schedule(){if(!destroyed&&!frame)frame=requestAnimationFrame(()=>{frame=0;refresh()})}
 const observer=new MutationObserver(records=>{if(records.some(r=>!(host?.contains(r.target)||r.target===host)&&(r.type!=='attributes'||r.target===overlay)))schedule()});
 const discovery=new MutationObserver(()=>{if(document.getElementById('customOverlay')!==overlay)schedule()});
 function setEnabled(kind:PanelKind,value:boolean){if(destroyed||!Object.hasOwn(preferences,kind))return;preferences[kind]=!!value;try{root.localStorage.setItem(`DoLGameUI.${kind}.enabled`,String(!!value))}catch{/* Display changes still apply. */}refresh();document.dispatchEvent(new Event('dol-ui-panels-change'))}
 discovery.observe(document.body,{childList:true,subtree:true});refresh();
 return {getEnabled:(kind:PanelKind)=>preferences[kind],setEnabled,getLifecycleCounts:()=>({...counts}),destroy(){destroyed=true;if(frame)cancelAnimationFrame(frame);discovery.disconnect();observer.disconnect();release();overlay=null}};
}
