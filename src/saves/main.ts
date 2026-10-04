import {createApp,reactive,type App} from 'vue';
import SavePanel from './SavePanel.vue';
import {createSaveTransfer} from './transfer';
import './style.css';
import {createSaveMetadata} from './metadata';
import {isMasterEnabled} from '../runtime/master';
export interface SaveEntry {key:number;feedback?:'saved'|'deleted';slot:string;identity:string;customName:string;gameTime:string;name:string;description:string;date:string;recent:boolean;saveAction:number;empty:boolean;auto:boolean;actions:{label:string;disabled:boolean}[]}
export function startSaves(root:Window & Record<string,any>){
 const transfer=createSaveTransfer();
 let metadata:ReturnType<typeof createSaveMetadata>|undefined;
 let enabled=true;try{enabled=root.localStorage.getItem('DoLGameUI.saves.enabled')!=='false'}catch{}
 let container:HTMLElement|null=null,host:HTMLElement|null=null,app:App|undefined,frame=0,destroyed=false;
 let rows:HTMLElement[]=[],buttons:HTMLElement[][]=[],dirty=false;
 const state=reactive({entries:[] as SaveEntry[],v2:false});
 let footer:HTMLElement|null=null,readGeneration=0;
 const observedSaves=new Map<string,number>();
 const recentFeedback=new Map<string,{kind:'saved'|'deleted';until:number}>();
 const moved:{node:HTMLElement;anchor:Comment}[]=[];
 function closeDetails(){host?.querySelector<HTMLDialogElement>('dialog[open]')?.close()}
 function release(){
  readGeneration++;
  closeDetails();
  for(const {node,anchor} of moved){if(anchor.isConnected&&node.isConnected)anchor.replaceWith(node);else anchor.remove()}moved.length=0;
  footer?.remove();footer=null;
  app?.unmount();app=undefined;host?.remove();host=null;container?.querySelectorAll('.dgs-native-row').forEach(n=>n.classList.remove('dgs-native-row'));container=null;rows=[];buttons=[]
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
 function refresh(){
  if(destroyed)return;
  if(!isMasterEnabled()||!enabled){metadata?.destroy();metadata=undefined;transfer.refresh(false);release();return}
  metadata??=createSaveMetadata(root);
  const currentMetadata=metadata;
  currentMetadata.attach();
  transfer.refresh(isMasterEnabled()&&enabled);
  const next=document.querySelector<HTMLElement>('#saveList #saves-list-container,#saveList #savesListContainer');
  if(!isMasterEnabled()||!enabled||!next){release();return}
  if(next===container&&host?.isConnected&&!dirty)return;
  dirty=false;
  const settingsOpen=footer?.querySelector<HTMLDetailsElement>('.dgs-save-settings')?.open??false;
  release();container=next;
  const entries:SaveEntry[]=[];
  for(const row of next.querySelectorAll<HTMLElement>(':scope > .savesListRow')){
   const controls=[...row.querySelectorAll<HTMLElement>('button,input[type="button"],a,img[onclick]')];
   const detail=row.querySelector('.saveDetails');let slot=row.querySelector('.saveId')?.textContent?.trim()??'';
   if(!slot){const match=row.querySelector('.saveGroup .saveButton input')?.getAttribute('onclick')?.match(/^save\((\d+),/);if(match)slot=String(Number(match[1])+1)}
   // Only known plain slot rows are adapted. Ironman and third-party controls stay native.
   if(!detail||!controls.length||row.querySelector('a,img[onclick],select,textarea,input:not([type="button"])')||controls.some(n=>!n.matches('button,input[type="button"]'))||(!/^\d+$|^A$/.test(slot)&&slot!==''))continue;
   if(!slot||!row.querySelector('.saveGroup .saveButton button,.saveGroup .saveButton input'))continue;
   const date=detail.querySelector('.datestamp')?.textContent?.trim()??'';
   const key=entries.length;
   entries.push({key,identity:'',customName:'',gameTime:'',slot:slot||'空槽',name:row.querySelector('.saveName')?.textContent?.trim()??'',description:detail.querySelector('span:not(.datestamp)')?.textContent?.trim()??'',date,recent:!!date&&!!detail.querySelector('.datestamp.green'),saveAction:controls.indexOf(row.querySelector<HTMLElement>('.saveGroup .saveButton button,.saveGroup .saveButton input')!),empty:!date,auto:slot==='A',actions:controls.map(n=>({label:n instanceof HTMLInputElement?n.value:n.textContent?.trim()??'',disabled:n.matches(':disabled')}))});
   rows.push(row);buttons.push(controls);
  }
  if(!entries.length){container=null;return}
  state.entries=entries;host=document.createElement('section');host.className='dgs-host';next.before(host);
  const generation=readGeneration,idb=next.id==='saves-list-container';
  void currentMetadata.read(state.entries,idb).then(persisted=>{
   if(!persisted||generation!==readGeneration||!host?.isConnected)return;
   for(const entry of state.entries){const slot=`${idb?'idb':'legacy'}:${entry.slot}`,date=persisted.get(slot);if(date===undefined)continue;const before=observedSaves.get(slot);
    if(before!==undefined&&date!==before)recentFeedback.set(slot,{kind:date>0?'saved':'deleted',until:Date.now()+400});
    const feedback=recentFeedback.get(slot);if(feedback&&feedback.until>Date.now())entry.feedback=feedback.kind;else recentFeedback.delete(slot);observedSaves.set(slot,date);
   }
  });
  const overlay=next.closest('#customOverlay[data-overlay="saves"]');
  app=createApp(SavePanel,{state,headerTarget:overlay?.querySelector<HTMLElement>('#customOverlayTitle')??undefined,rename:(key:number,name:string)=>currentMetadata.rename(state.entries.find(e=>e.key===key),name),fallback:()=>setEnabled(false),act:(key:number,index:number)=>{
   const node=buttons[key]?.[index];if(node?.isConnected&&container?.contains(node)&&!node.matches(':disabled'))node.click();
  }});app.mount(host);
  rows.forEach(row=>row.classList.add('dgs-native-row'));
  const header=next.firstElementChild;if(header?.querySelector('.saveId')?.textContent?.trim()==='#')header.classList.add('dgs-native-row');
  organizeTools(next,settingsOpen);
 }
 function schedule(){if(!destroyed&&!frame)frame=requestAnimationFrame(()=>{frame=0;refresh()})}
 const observer=new MutationObserver(records=>{
  if(records.some(r=>container?.contains(r.target)))dirty=true;
  if(dirty||!container?.isConnected||!host?.isConnected)schedule();
 });
 root.jQuery?.(document).on(':oncloseoverlay.dolSaves',closeDetails);
 observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled']});refresh();
 function setEnabled(value:boolean){enabled=!!value;try{root.localStorage.setItem('DoLGameUI.saves.enabled',String(enabled))}catch{}refresh();document.dispatchEvent(new Event('dol-ui-saves-change'))}
 return {setV2:(value:boolean)=>{state.v2=value},getEnabled:()=>enabled,setEnabled,refresh,destroy(){metadata?.destroy();destroyed=true;root.jQuery?.(document).off(':oncloseoverlay.dolSaves',closeDetails);observer.disconnect();if(frame)cancelAnimationFrame(frame);release();transfer.release()}};
}
