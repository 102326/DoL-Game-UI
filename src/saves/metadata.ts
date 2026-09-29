import type {SaveEntry} from './main';
type Runtime=Window & Record<string,any>;
const KEY='DoLGameUI.saveNames.v1';
export function createSaveMetadata(root:Runtime){
 let saveApi:any;
 function onSave(save:any){
  // Only a display snapshot; never touch state/history or native save names.
  try{const t=root.Time;if(!t)return;const fields=[t.year,t.month,t.monthDay,t.hour,t.minute];if(!fields.every(Number.isFinite))return;
   save.metadata??={};save.metadata.dolGameUI={gameTime:`${fields[0]}/${fields[1]}/${fields[2]} ${String(fields[3]).padStart(2,'0')}:${String(fields[4]).padStart(2,'0')}`};
  }catch{/* Missing time or frozen third-party metadata must not interrupt saving. */}
 }
 function attach(){const api=(root.SugarCube?.Save||root.Save)?.onSave;if(api===saveApi||typeof api?.add!=='function')return;saveApi?.delete?.(onSave);saveApi=api;api.add(onSave)}
 async function read(entries:SaveEntry[],idb:boolean){
  attach();let details:any;
  try{details=idb?await root.idb?.getSaveDetails():JSON.parse(root.localStorage.getItem('dolSaveDetails')||'null')}catch{return}
  let aliases:Record<string,unknown>={};try{aliases=JSON.parse(root.localStorage.getItem(KEY)||'{}')||{}}catch{}
  for(const entry of entries){
   if(entry.empty)continue;
   const d=idb?(Array.isArray(details)?details.find((d:any)=>d.slot===(entry.auto?0:Number(entry.slot)))?.data:null):entry.auto?details?.autosave:details?.slots?.[Number(entry.slot)-1];
   if(!d||!Number.isFinite(d.date))continue;
   entry.identity=JSON.stringify([idb?'idb':'legacy',d.id||'',entry.slot,d.date,d.metadata?.saveId??'']);
   const name=d.metadata?.saveName;if(typeof name==='string'&&name)entry.name=name;
   const time=d.metadata?.dolGameUI?.gameTime;if(typeof time==='string'&&time.length<100)entry.gameTime=time;
   if(typeof aliases[entry.identity]==='string')entry.customName=(aliases[entry.identity] as string).slice(0,80);
  }
 }
 function rename(entry:SaveEntry|undefined,name:string){
  if(!entry?.identity||entry.empty)return '存档信息尚未就绪，请稍后重试。';
  const value=name.trim().slice(0,80);
  try{let aliases=JSON.parse(root.localStorage.getItem(KEY)||'{}');if(!aliases||typeof aliases!=='object'||Array.isArray(aliases))aliases={};delete aliases[entry.identity];if(value)aliases[entry.identity]=value;
   // Keep only local labels; pruning never deletes game saves.
   const bounded=Object.fromEntries(Object.entries(aliases).slice(-500));root.localStorage.setItem(KEY,JSON.stringify(bounded));entry.customName=value;return value?'名称已保存。':'已恢复原名称。';
  }catch{return '名称保存失败，原存档未改变。'}
 }
 attach();return {attach,read,rename,destroy(){saveApi?.delete?.(onSave)}};
}
