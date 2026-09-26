/** Pure read-only status boundary. The host owns all game state. */
export const STATUS_KEYS = ['pain','tiredness','stress','trauma','control'] as const;
export type StatusKey = typeof STATUS_KEYS[number];
export type Reason = 'missing'|'invalid'|'unreadable'|'unavailable'|'loading'|'disposed';
export interface StatusSnapshot {
 readonly schemaVersion: 1;
 readonly status: 'ready'|'partial'|'unavailable'|'loading'|'disposed';
 readonly values: Readonly<Record<StatusKey,number|null>>;
 readonly reasons: Readonly<Partial<Record<StatusKey,Reason>>>;
}
export interface StatusAPI {
 getSnapshot(): StatusSnapshot;
 subscribe(listener:(snapshot:StatusSnapshot)=>void):()=>void;
 refresh():void;
 dispose():void;
}
export interface StatusHost {
 readVariables():unknown;
 schedule(callback:()=>void):number;
 cancel(id:number):void;
}
export function createStatusService(host:StatusHost){
 let disposed=false,loading=false,pending:number|undefined;
 const listeners=new Set<(s:StatusSnapshot)=>void>();
 function getSnapshot():StatusSnapshot {
  const values={} as Record<StatusKey,number|null>;
  const reasons:Partial<Record<StatusKey,Reason>>={};
  let variables:unknown;
  if(!disposed&&!loading){try{variables=host.readVariables()}catch{/* unavailable host */}}
  let count=0;
  for(const key of STATUS_KEYS){
   values[key]=null;
   if(disposed||loading){reasons[key]=disposed?'disposed':'loading';continue}
   if(!variables||typeof variables!=='object'){reasons[key]='unavailable';continue}
   try{
    const value=(variables as Record<string,unknown>)[key];
    if(value===undefined||value===null){reasons[key]='missing';continue}
    if(typeof value!=='number'||!Number.isFinite(value)){reasons[key]='invalid';continue}
    values[key]=value;count++;
   }catch{reasons[key]='unreadable'}
  }
  return Object.freeze({schemaVersion:1,status:disposed?'disposed':loading?'loading':count===STATUS_KEYS.length?'ready':count?'partial':'unavailable',values:Object.freeze(values),reasons:Object.freeze(reasons)});
 }
 function refresh(){
  if(disposed||pending!==undefined)return;
  pending=host.schedule(()=>{
   pending=undefined;if(disposed)return;
   const snapshot=getSnapshot();
   for(const listener of [...listeners]){
    if(!listeners.has(listener))continue;
    try{listener(snapshot)}catch{/* One consumer cannot break other consumers or game rendering. */}
   }
  });
 }
 const api:StatusAPI=Object.freeze({getSnapshot,refresh,
  subscribe(listener:(s:StatusSnapshot)=>void){
   if(disposed)return()=>{};
   // Each subscription owns its own wrapper, including repeated subscriptions of one function.
   const delivery=(s:StatusSnapshot)=>listener(s);listeners.add(delivery);refresh();
   return()=>{listeners.delete(delivery)};
  },
  dispose(){if(disposed)return;disposed=true;if(pending!==undefined)host.cancel(pending);pending=undefined;listeners.clear()}
 });
 return {api,beginLoad(){if(!disposed){loading=true;refresh()}},renderComplete(){if(!disposed){loading=false;refresh()}}};
}
