import {snapshot,entries,validate,slotCapacity,type Snapshot,type Entry} from './data';
import type {WardrobeDataHost,ClothingSlots} from './host';
import type {Item,Slot} from './types';

// M1 controlled metadata, not an author-provided ReOverfits protocol or public API.
export const prototypeSlotNotes:Record<string,string>={
 over_head:'扩展头套 · M1 受控类别说明，穿戴仍由原游戏处理',
 over_upper:'扩展外套上装 · M1 受控类别说明，穿戴仍由原游戏处理',
 over_lower:'扩展外套下装 · M1 受控类别说明，穿戴仍由原游戏处理'
};

/** A page-local projection and binding table. Native objects never enter Vue items. */
export function createWardrobeSource(root:WardrobeDataHost,labels:(s:Snapshot)=>Record<string,string>,current:()=>boolean){
 let disposed=false,revision=0,fingerprint='',location='',inventory:Snapshot['inventory']|undefined;
 let bound:Entry[]=[],items:Item[]=[],slot='';
 function signature(s:Snapshot,key:string){
  // ponytail: selected-slot serialization; measure before adding incremental revisions.
  return JSON.stringify([s.location,s.variables.location,(s.inventory as ClothingSlots)[key],s.setup.clothes[key],s.worn,labels(s),s.variables.options?.images,s.variables.wardrobeDefaults]);
 }
 function read(requested:string){
  if(disposed||!current())return null;
  const s=snapshot(root);if(!s)return null;
  const names=labels(s),slots:Slot[]=Object.entries(names).filter(([key])=>Array.isArray(s.inventory[key])).map(([key,label])=>({key,label,count:(s.inventory as ClothingSlots)[key].length,capacity:slotCapacity(s)}));
  const nextSlot=slots.some(value=>value.key===requested)?requested:slots[0]?.key;
  if(!nextSlot)return null;
  const nextEntries=entries(s,nextSlot),nextFingerprint=signature(s,nextSlot)+JSON.stringify(nextEntries.map(({raw,descriptor,slot,index,...view})=>view));
  const changed=s.inventory!==inventory||s.location!==location||nextSlot!==slot||nextFingerprint!==fingerprint||bound.length!==nextEntries.length||nextEntries.some((e,i)=>e.raw!==bound[i].raw||e.descriptor!==bound[i].descriptor);
  if(changed){
   revision++;bound=nextEntries.map(e=>({...e,key:`${e.slot}:${e.index}:r${revision}`}));
   items=bound.map(({raw:_raw,descriptor:_descriptor,slot:_slot,index:_index,...item})=>Object.freeze({...item,traits:[...item.traits],icons:item.icons.map(icon=>({...icon}))}));
  }
  inventory=s.inventory;location=s.location;slot=nextSlot;fingerprint=nextFingerprint;
  const unknownSlots=Object.entries(s.inventory).filter(([key,value])=>!Object.hasOwn(names,key)&&Array.isArray(value)&&value.length>0&&(Array.isArray(s.setup.clothes[key])||Object.hasOwn(s.worn,key))).map(([key])=>key);
  return {snapshot:s,slot,slots,items,unknownSlots,categoryNote:prototypeSlotNotes[slot]??'',revision};
 }
 function resolve(key:string):Entry|null{
  if(disposed||!current())return null;
  const e=bound.find(entry=>entry.key===key),s=snapshot(root);
  if(!e||!s||s.inventory!==inventory||s.location!==location||signature(s,slot)+JSON.stringify(entries(s,slot).map(({raw,descriptor,slot,index,...view})=>view))!==fingerprint||!validate(s,e))return null;
  return e;
 }
 return {read,resolve,bindings:()=>bound,destroy(){disposed=true;bound=[];items=[];inventory=undefined}};
}
