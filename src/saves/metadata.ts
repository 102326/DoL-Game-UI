import type {SaveEntry} from './source';
import type {NativeEventsHost} from '../runtime/sugarcube';
interface SaveMetadata extends Record<string,unknown> {saveId?:unknown;saveName?:unknown;dolGameUI?:{gameTime?:unknown}}
interface SaveDetails {date?:number;id?:unknown;metadata?:SaveMetadata}
interface SavePayload {metadata?:SaveMetadata}
interface SaveHook {add:(handler:(save:SavePayload)=>void)=>unknown;delete?:(handler:(save:SavePayload)=>void)=>unknown}
interface LegacyDetails {autosave?:SaveDetails;slots?:Array<SaveDetails|null>}
interface IndexedDetails {slot:number;data?:SaveDetails}
export type SaveMetadataHost=NativeEventsHost & {
 Time?:{year?:number;month?:number;monthDay?:number;hour?:number;minute?:number};
 SugarCube?:{Save?:{onSave?:SaveHook}};Save?:{onSave?:SaveHook};
 idb?:{getSaveDetails:()=>unknown|Promise<unknown>};
};
const KEY='DoLGameUI.saveNames.v1';
export function createSaveMetadata(root:SaveMetadataHost){
 let saveApi:SaveHook|undefined;
 function onSave(save:SavePayload){
  // Only a display snapshot; never touch state/history or native save names.
  try{const t=root.Time;if(!t)return;const fields=[t.year,t.month,t.monthDay,t.hour,t.minute];if(!fields.every(Number.isFinite))return;
   save.metadata??={};
   const previous=save.metadata.dolGameUI;
   // Preserve other own metadata fields; arrays and exotic objects are not merge contracts.
   if(previous!=null&&(typeof previous!=='object'||Array.isArray(previous)||![Object.prototype,null].includes(Object.getPrototypeOf(previous))))return;
   save.metadata.dolGameUI={...previous,gameTime:`${fields[0]}/${fields[1]}/${fields[2]} ${String(fields[3]).padStart(2,'0')}:${String(fields[4]).padStart(2,'0')}`};
  }catch{/* Missing time or frozen third-party metadata must not interrupt saving. */}
 }
 function attach(){const api=(root.SugarCube?.Save||root.Save)?.onSave;if(api===saveApi||typeof api?.add!=='function')return;saveApi?.delete?.(onSave);saveApi=api;api.add(onSave)}
 async function detailsFor(idb:boolean){
  const value=idb?await root.idb?.getSaveDetails():JSON.parse(root.localStorage.getItem('dolSaveDetails')||'null');
  if(value==null){if(idb&&root.idb)throw new Error('Save details unavailable');return undefined}
  if(idb?!Array.isArray(value):typeof value!=='object')throw new Error('Unknown save details');
  return value;
 }
 function detailFor(details:unknown,entry:SaveEntry,idb:boolean){
  return idb?(details as IndexedDetails[]).find(d=>d.slot===(entry.auto?0:Number(entry.slot)))?.data:entry.auto?(details as LegacyDetails).autosave:(details as LegacyDetails).slots?.[Number(entry.slot)-1];
 }
 function stamp(details:unknown,entry:SaveEntry,idb:boolean){return JSON.stringify([idb?'idb':'legacy',entry.slot,detailFor(details,entry,idb)??null])}
 async function revision(entry:SaveEntry,idb:boolean){const details=await detailsFor(idb);if(details===undefined)throw new Error('Save details unavailable');return stamp(details,entry,idb)}
 async function read(entries:SaveEntry[],idb:boolean){
  attach();let details:unknown;
  try{details=await detailsFor(idb)}catch{return}
  if(details===undefined)return;
  let aliases:Record<string,unknown>={};try{aliases=JSON.parse(root.localStorage.getItem(KEY)||'{}')||{}}catch{}
  const persisted=new Map<string,number>(),revisions=new Map<number,string>();
  for(const entry of entries){
   const d=detailFor(details,entry,idb);
   // A stale native empty row must not overwrite an occupied slot without its confirmation.
   if(entry.empty===!d)revisions.set(entry.key,stamp(details,entry,idb));
   persisted.set(`${idb?'idb':'legacy'}:${entry.slot}`,Number.isFinite(d?.date)?d!.date!:0);
   if(entry.empty||!d||!Number.isFinite(d.date))continue;
   entry.identity=JSON.stringify([idb?'idb':'legacy',d.id||'',entry.slot,d.date,d.metadata?.saveId??'']);
   const name=d.metadata?.saveName;if(typeof name==='string'&&name)entry.name=name;
   const time=d.metadata?.dolGameUI?.gameTime;if(typeof time==='string'&&time.length<100)entry.gameTime=time;
   if(typeof aliases[entry.identity]==='string')entry.customName=(aliases[entry.identity] as string).slice(0,80);
  }
  return {dates:persisted,revisions};
 }
 function rename(entry:SaveEntry|undefined,name:string){
  if(!entry?.identity||entry.empty)return '存档信息尚未就绪，请稍后重试。';
  const value=name.trim().slice(0,80);
  try{let aliases=JSON.parse(root.localStorage.getItem(KEY)||'{}') as Record<string,unknown>|null;if(!aliases||typeof aliases!=='object'||Array.isArray(aliases))aliases={};delete aliases[entry.identity];if(value)aliases[entry.identity]=value;
   // Keep only local labels; pruning never deletes game saves.
   const bounded=Object.fromEntries(Object.entries(aliases).slice(-500));root.localStorage.setItem(KEY,JSON.stringify(bounded));entry.customName=value;return value?'名称已保存。':'已恢复原名称。';
  }catch{return '名称保存失败，原存档未改变。'}
 }
 attach();return {attach,read,revision,rename,destroy(){saveApi?.delete?.(onSave)}};
}
