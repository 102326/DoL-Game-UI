import {createApp,reactive,type App} from 'vue';
import SavePanel from './SavePanel.vue';
import './style.css';
export interface SaveEntry {key:number;slot:string;name:string;description:string;date:string;empty:boolean;auto:boolean;actions:{label:string;disabled:boolean}[]}
export function startSaves(root:Window & Record<string,any>){
 let enabled=true;try{enabled=root.localStorage.getItem('DoLGameUI.saves.enabled')!=='false'}catch{}
 let container:HTMLElement|null=null,host:HTMLElement|null=null,app:App|undefined,frame=0,destroyed=false;
 let rows:HTMLElement[]=[],buttons:HTMLElement[][]=[],dirty=false;
 const state=reactive({entries:[] as SaveEntry[]});
 let footer:HTMLElement|null=null;
 const moved:{node:HTMLElement;anchor:Comment}[]=[];
 function release(){
  for(const {node,anchor} of moved){if(anchor.isConnected)anchor.replaceWith(node);else anchor.remove()}moved.length=0;
  footer?.remove();footer=null;
  app?.unmount();app=undefined;host?.remove();host=null;container?.querySelectorAll('.dgs-native-row').forEach(n=>n.classList.remove('dgs-native-row'));container=null;rows=[];buttons=[]
 }
 function organizeTools(next:HTMLElement){
  const parent=next.parentElement;if(!parent)return;
  const groups=[...parent.querySelectorAll<HTMLElement>(':scope > ul.buttons')];
  if(!groups.length)return; // Legacy and unrecognised toolbars remain native.
  footer=document.createElement('section');footer.className='dgs-tools';
  const settings=document.createElement('details');settings.className='dgs-save-settings';
  const summary=document.createElement('summary');summary.textContent='存档设置';settings.append(summary);
  function move(node:HTMLElement,target:HTMLElement){const anchor=document.createComment('dol-save-tools');node.before(anchor);moved.push({node,anchor});target.append(node)}
  for(const group of groups){
   if(group.querySelector('#pageNum')){const area=document.createElement('div');area.className='dgs-pagination';footer.append(area);move(group,area)}
   else if(group.querySelector('#saves-export,#saves-import')){const area=document.createElement('div');area.className='dgs-file-tools';footer.append(area);move(group,area)}
   else if(group.querySelector('input[type="checkbox"],#saves-idb-toggle'))move(group,settings);
  }
  const warning=parent.parentElement?.querySelector<HTMLInputElement>('input[type="radio"][name*="savedetails" i][name*="frequency" i]')?.closest('div');
  if(warning instanceof HTMLElement&&warning.parentElement===parent.parentElement&&!warning.contains(parent))move(warning,settings);
  if(settings.children.length>1)footer.append(settings);
  next.after(footer);
 }
 function refresh(){
  if(destroyed)return;
  const next=document.querySelector<HTMLElement>('#saveList #saves-list-container,#saveList #savesListContainer');
  if(!enabled||!next){release();return}
  if(next===container&&host?.isConnected&&!dirty)return;
  dirty=false;
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
   entries.push({key,slot:slot||'空槽',name:row.querySelector('.saveName')?.textContent?.trim()??'',description:detail.querySelector('span:not(.datestamp)')?.textContent?.trim()??'',date,empty:!date,auto:slot==='A',actions:controls.map(n=>({label:n instanceof HTMLInputElement?n.value:n.textContent?.trim()??'',disabled:n.matches(':disabled')}))});
   rows.push(row);buttons.push(controls);
  }
  if(!entries.length){container=null;return}
  state.entries=entries;host=document.createElement('section');host.className='dgs-host';next.before(host);
  app=createApp(SavePanel,{state,fallback:()=>setEnabled(false),act:(key:number,index:number)=>{
   const node=buttons[key]?.[index];if(node?.isConnected&&container?.contains(node)&&!node.matches(':disabled'))node.click();
  }});app.mount(host);
  rows.forEach(row=>row.classList.add('dgs-native-row'));
  const header=next.firstElementChild;if(header?.querySelector('.saveId')?.textContent?.trim()==='#')header.classList.add('dgs-native-row');
  organizeTools(next);
 }
 function schedule(){if(!destroyed&&!frame)frame=requestAnimationFrame(()=>{frame=0;refresh()})}
 const observer=new MutationObserver(records=>{
  if(records.some(r=>container?.contains(r.target)))dirty=true;
  if(dirty||!container?.isConnected||!host?.isConnected)schedule();
 });
 observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled']});refresh();
 function setEnabled(value:boolean){enabled=!!value;try{root.localStorage.setItem('DoLGameUI.saves.enabled',String(enabled))}catch{}refresh();document.dispatchEvent(new Event('dol-ui-saves-change'))}
 return {getEnabled:()=>enabled,setEnabled,destroy(){destroyed=true;observer.disconnect();if(frame)cancelAnimationFrame(frame);release()}};
}
