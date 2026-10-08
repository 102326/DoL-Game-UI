import {snapshot,entries,validate,slotCapacity,type Snapshot,type Entry} from './data';
import type {WardrobeDataHost,ClothingSlots} from './host';
import type {Item,Slot} from './types';

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
  const hiddenCount=(s.inventory as ClothingSlots)[slot].length-items.length;
  return {snapshot:s,slot,slots,items,unknownSlots,categoryNote:hiddenCount>0?`${hiddenCount} 件关联套装部件由主件操作；可在原版信息中查看。`:'',revision};
 }
 function resolveMany(keys:string[]):Entry[]|null{
  if(disposed||!current())return null;
  const chosen=[...new Set(keys)].map(key=>bound.find(entry=>entry.key===key)),s=snapshot(root);
  if(!chosen.length||chosen.some(e=>!e)||!s||s.inventory!==inventory||s.location!==location||signature(s,slot)+JSON.stringify(entries(s,slot).map(({raw,descriptor,slot,index,...view})=>view))!==fingerprint||chosen.some(e=>!validate(s,e!)))return null;
  return current()?chosen as Entry[]:null;
 }
 return {read,resolve:(key:string)=>resolveMany([key])?.[0]??null,resolveMany,destroy(){disposed=true;bound=[];items=[];inventory=undefined}};
}
