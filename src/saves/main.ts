import {isolate,mountUI,unmountUI,supportsDialog,restoreNative} from '../runtime/presentation';
import {createApp,reactive,type App} from 'vue';
import SavePanel from './SavePanel.vue';
import {createSaveTransfer} from './transfer';
import './style.css';
import {createSaveMetadata,type SaveMetadataHost} from './metadata';
import {isMasterEnabled} from '../runtime/master';
import {createSaveSource,type SaveEntry} from './source';
export type {SaveEntry} from './source';
export function startSaves(root:SaveMetadataHost){
 const transfer=createSaveTransfer();
 let metadata:ReturnType<typeof createSaveMetadata>|undefined;
 let enabled=true;try{enabled=root.localStorage.getItem('DoLGameUI.saves.enabled')!=='false'}catch{}
 let container:HTMLElement|null=null,host:HTMLElement|null=null,app:App|undefined,frame=0,destroyed=false;
 let rows:HTMLElement[]=[],dirty=false;
 const state=reactive({entries:[] as SaveEntry[],v2:false,query:'',selectedSlot:'',pending:false,message:'',unknown:0});
 function isCurrent(next:HTMLElement){
  const selector='#saveList #saves-list-container,#saveList #savesListContainer',overlay=next.closest<HTMLElement>('#customOverlay');
  return !destroyed&&isMasterEnabled()&&enabled&&!failed&&next===container&&next.isConnected
   &&document.querySelector(selector)===next&&document.querySelectorAll(selector).length===1
   &&!next.closest('[hidden],[aria-hidden=true],.hidden')&&(!overlay||overlay.dataset.overlay==='saves')
   &&getComputedStyle(next.closest('#saveList')!).display!=='none';
 }
 const source=createSaveSource(isCurrent,(entry,idb)=>metadata?.revision(entry,idb)??Promise.reject(new Error('Save source closed')));

 let footer:HTMLElement|null=null,readGeneration=0;
 const observedSaves=new Map<string,number>();
 const recentFeedback=new Map<string,{kind:'saved'|'deleted';until:number}>();
 const moved:{node:HTMLElement;anchor:Comment}[]=[];
 function closeDetails(){host?.querySelector<HTMLDialogElement>('dialog[open]')?.close?.()}
 function release(){
  readGeneration++;source.clear();state.pending=false;
  closeDetails();
  for(const {node,anchor} of moved){restoreNative(node,anchor,container?.parentNode??null)}moved.length=0;
  footer?.remove();footer=null;
  unmountUI(app);app=undefined;host?.remove();host=null;container?.querySelectorAll('.dgs-native-row').forEach(n=>n.classList.remove('dgs-native-row'));container=null;rows=[]
 }
 function organizeTools(next:HTMLElement,settingsOpen:boolean){
  const parent=next.parentElement;if(!parent)return;
  const groups=[...parent.querySelectorAll<HTMLElement>(':scope > ul.buttons')];
  if(!groups.length)return; // Legacy and unrecognised toolbars remain native.
  footer=document.createElement('section');footer.className='dgs-tools';
  const settings=document.createElement('details');settings.className='dgs-save-settings';settings.open=settingsOpen;
  const summary=document.createElement('summary');summary.textContent='存档设置';settings.append(summary);
  function move(node:HTMLElement,target:HTMLElement){const anchor=document.createComment('dol-save-tools');node.before(anchor);moved.push({node,anchor});target.append(node)}
  for(const group of groups){
   if(group.querySelector('#pageNum')){const area=host?.querySelector<HTMLElement>('.dgs-list-tools');if(area){area.classList.add('dgs-tools');move(group,area)}}
   else if(group.querySelector('#saves-export,#saves-import')){const area=document.createElement('div');area.className='dgs-file-tools';footer.append(area);move(group,area)}
   else if(group.querySelector('input[type="checkbox"],#saves-idb-toggle'))move(group,settings);
  }
  const warning=parent.parentElement?.querySelector<HTMLInputElement>('input[type="radio"][name*="savedetails" i][name*="frequency" i]')?.closest('div');
  if(warning instanceof HTMLElement&&warning.parentElement===parent.parentElement&&!warning.contains(parent))move(warning,settings);
  if(settings.children.length>1)footer.append(settings);
  host?.querySelector('.dgs-detail-tools')?.append(footer);
 }
 let failed=false,failedContainer:HTMLElement|null=null;
 function recover(){failed=true;failedContainer=container;release();transfer.release();metadata?.destroy();metadata=undefined;document.dispatchEvent(new Event('dol-ui-saves-change'))}
 function refresh(){isolate('saves',update,recover)}
 function update(){
  if(destroyed)return;
  if(failed&&failedContainer&&!failedContainer.isConnected){failed=false;failedContainer=null}
  if(!isMasterEnabled()||!enabled||failed||!supportsDialog()){metadata?.destroy();metadata=undefined;transfer.refresh(false);release();return}
  metadata??=createSaveMetadata(root);
  const currentMetadata=metadata;
  currentMetadata.attach();
  transfer.refresh(isMasterEnabled()&&enabled);
  const next=document.querySelector<HTMLElement>('#saveList #saves-list-container,#saveList #savesListContainer');
  if(!next||document.querySelectorAll('#saveList #saves-list-container,#saveList #savesListContainer').length!==1){release();return}
  if(next===container&&host?.isConnected&&!dirty)return;
  dirty=false;
  const settingsOpen=footer?.querySelector<HTMLDetailsElement>('.dgs-save-settings')?.open??false;
  const reuse=next===container&&!!host?.isConnected;
  if(reuse){readGeneration++;source.clear();state.pending=false;rows.forEach(row=>row.classList.remove('dgs-native-row'))}
  else release();container=next;
  const projection=source.read(next),entries=projection.entries;rows=projection.rows;state.unknown=projection.unknown;
  if(!entries.length){release();return}
  state.entries=entries;
  if(!reuse){host=document.createElement('section');host.className='dgs-host dgs-candidate';next.before(host)}
  const generation=readGeneration,idb=next.id==='saves-list-container';
  const projected=state.entries;
  void currentMetadata.read(projected,idb).then(result=>{
   if(generation!==readGeneration||!host?.isConnected)return;
   source.seal(projected,result?.revisions);if(!result)return;const persisted=result.dates;
   for(const entry of state.entries){const slot=`${idb?'idb':'legacy'}:${entry.slot}`,date=persisted.get(slot);if(date===undefined)continue;const before=observedSaves.get(slot);
    if(before!==undefined&&date!==before)recentFeedback.set(slot,{kind:date>0?'saved':'deleted',until:Date.now()+400});
    const feedback=recentFeedback.get(slot);if(feedback&&feedback.until>Date.now())entry.feedback=feedback.kind;else recentFeedback.delete(slot);observedSaves.set(slot,date);
   }
  }).catch(error=>{if(generation===readGeneration)isolate('save metadata',()=>{throw error},recover)});
  const overlay=next.closest('#customOverlay[data-overlay="saves"]');
  if(!reuse){app=createApp(SavePanel,{state,headerTarget:overlay?.querySelector<HTMLElement>('#customOverlayTitle')??undefined,rename:(key:number,name:string)=>currentMetadata.rename(state.entries.find(e=>e.key===key),name),fallback:()=>setEnabled(false),act:async(key:number,index:number)=>{
   if(state.pending)return;state.pending=true;state.message='';const operationGeneration=readGeneration;
   const message=await source.dispatch(key,index);
   if(operationGeneration===readGeneration){state.pending=false;state.message=message}
  }});mountUI(app,host!,recover);organizeTools(next,settingsOpen)}
  rows.forEach(row=>row.classList.add('dgs-native-row'));
  const header=[...next.querySelectorAll(':scope > .savesListRow')].find(row=>row.querySelector('.saveId')?.textContent?.trim()==='#');header?.classList.add('dgs-native-row');
 }
 function schedule(){if(!destroyed&&!frame)frame=requestAnimationFrame(()=>{frame=0;refresh()})}
 const observer=new MutationObserver(records=>{
  if(records.some(r=>container?.contains(r.target)))dirty=true;
  if(dirty||!container?.isConnected||!host?.isConnected)schedule();
 });
 root.jQuery?.(document).on(':oncloseoverlay.dolSaves',closeDetails);
 observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled']});refresh();
 function setEnabled(value:boolean){failed=false;failedContainer=null;enabled=!!value;try{root.localStorage.setItem('DoLGameUI.saves.enabled',String(enabled))}catch{}refresh();document.dispatchEvent(new Event('dol-ui-saves-change'))}
 return {setV2:(value:boolean)=>{state.v2=value},getEnabled:()=>enabled&&!failed,setEnabled,refresh,destroy(){metadata?.destroy();destroyed=true;root.jQuery?.(document).off(':oncloseoverlay.dolSaves',closeDetails);observer.disconnect();if(frame)cancelAnimationFrame(frame);release();transfer.release()}};
}
