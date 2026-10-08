export interface SaveEntry {key:number;feedback?:'saved'|'deleted';slot:string;identity:string;customName:string;gameTime:string;name:string;description:string;date:string;recent:boolean;saveAction:number;empty:boolean;auto:boolean;actions:{label:string;disabled:boolean}[]}
interface Binding {entry:SaveEntry;row:HTMLElement;container:HTMLElement;controls:HTMLElement[];parents:(HTMLElement|null)[];handlers:(GlobalEventHandlers['onclick'])[];signature:string;revision?:string}
const signature=(row:HTMLElement)=>row.innerHTML;
const blocked=(node:HTMLElement)=>node.matches(':disabled')||!!node.closest('[hidden],[aria-hidden=true],[aria-disabled=true]')||getComputedStyle(node).display==='none'||getComputedStyle(node).visibility==='hidden';

/** Native rows/buttons own saves. Bindings expire; presentation never owns a save payload. */
export function createSaveSource(current:(container:HTMLElement)=>boolean,revision:(entry:SaveEntry,idb:boolean)=>Promise<string|undefined>){
 const bindings=new Map<number,Binding>(),pending=new WeakMap<HTMLElement,string>();let sequence=0,checking=false;
 function read(container:HTMLElement){
  bindings.clear();const entries:SaveEntry[]=[],rows:HTMLElement[]=[];
  for(const row of container.querySelectorAll<HTMLElement>(':scope > .savesListRow')){
   if(row.closest('[hidden],[aria-hidden=true],.hidden'))continue;
   const controls=[...row.querySelectorAll<HTMLElement>('button,input[type="button"],a,img[onclick]')];
   const detail=row.querySelector('.saveDetails');let slot=row.querySelector('.saveId')?.textContent?.trim()??'';
   if(!slot){const match=row.querySelector('.saveGroup .saveButton input')?.getAttribute('onclick')?.match(/^save\((\d+),/);if(match)slot=String(Number(match[1])+1)}
   if(!detail||!controls.length||row.querySelector('a,img[onclick],select,textarea,input:not([type="button"])')||controls.some(n=>!n.matches('button,input[type="button"]'))||!/^\d+$|^A$/.test(slot))continue;
   const saveControl=row.querySelector<HTMLElement>('.saveGroup .saveButton button,.saveGroup .saveButton input');if(!saveControl)continue;
   if([...row.querySelectorAll('*')].some(node=>!node.matches('.saveGroup,.saveId,.saveName,.saveDetails,.saveButton,.deleteButton,button,input[type=button],br')&&!(node.tagName==='SPAN'&&node.parentElement===detail))
    ||detail.querySelectorAll('span:not(.datestamp)').length>1
    ||[...row.childNodes,...row.querySelector('.saveGroup')!.childNodes].some(node=>node.nodeType===Node.TEXT_NODE&&node.textContent?.trim()))continue;
   const date=detail.querySelector('.datestamp')?.textContent?.trim()??'',name=row.querySelector('.saveName')?.textContent?.trim()??'',description=detail.querySelector('span:not(.datestamp)')?.textContent?.trim()??'';
   const auto=slot==='A',loadControl=auto?saveControl:row.querySelectorAll<HTMLElement>('.saveGroup button,.saveGroup input[type=button]')[1];
   // Missing date alone is not an empty save; native disabled load is required too.
   const empty=!date&&!name&&!description&&!!loadControl?.matches(':disabled');
   const entry:SaveEntry={key:++sequence,identity:'',customName:'',gameTime:'',slot,name,description,date,recent:!!date&&!!detail.querySelector('.datestamp.green'),saveAction:auto?-1:controls.indexOf(saveControl),empty,auto,actions:controls.map(n=>({label:n instanceof HTMLInputElement?n.value:n.textContent?.trim()??'',disabled:blocked(n)}))};
   entries.push(entry);rows.push(row);bindings.set(entry.key,{entry,row,container,controls,parents:controls.map(n=>n.parentElement),handlers:controls.map(n=>n.onclick),signature:signature(row)});
  }
  const counts=new Map<string,number>();for(const entry of entries)counts.set(entry.slot,(counts.get(entry.slot)??0)+1);
  for(let i=entries.length-1;i>=0;i--)if(counts.get(entries[i].slot)!>1){bindings.delete(entries[i].key);entries.splice(i,1);rows.splice(i,1)}
  return {entries,rows,unknown:[...container.querySelectorAll(':scope > .savesListRow')].filter(row=>!rows.includes(row as HTMLElement)&&!row.closest('[hidden],[aria-hidden=true],.hidden')&&row.querySelector('.saveId')?.textContent?.trim()!=='#').length};
 }
 function valid(b:Binding,node?:HTMLElement){return current(b.container)&&b.row.isConnected&&b.row.parentElement===b.container&&signature(b.row)===b.signature&&(!node||b.controls.every((n,i)=>n.isConnected&&b.row.contains(n)&&n.parentElement===b.parents[i]&&n.onclick===b.handlers[i])&&!blocked(node))}
 function seal(entries:SaveEntry[],revisions?:Map<number,string>){for(const entry of entries){const b=bindings.get(entry.key);if(b&&valid(b))b.revision=revisions?.get(entry.key)}}
 async function dispatch(key:number,index:number){
  const b=bindings.get(key),node=b?.controls[index];
  if(!b||!node||!valid(b,node))return '槽位或原按钮已更新，请重新打开存档页后选择；也可使用原版界面。';
  if(checking)return '正在核对存档信息，请稍候。';
  if(pending.get(b.row)===b.signature)return '操作已交给原版处理，尚未确认结果；请勿重复操作。';
  checking=true;
  try{
   const now=await revision(b.entry,b.container.id==='saves-list-container');
   if(!valid(b,node)||bindings.get(key)!==b||now!==undefined&&now!==b.revision)return '存档信息已变化或尚未就绪，请稍后重试或重新打开存档页。';
   pending.set(b.row,b.signature);node.click();return '';
  }catch{return '无法核对存档信息，请使用原版界面；本次不会自动重试。'}finally{checking=false}
 }
 return {read,seal,dispatch,clear(){bindings.clear()},destroy(){bindings.clear()}};
}
