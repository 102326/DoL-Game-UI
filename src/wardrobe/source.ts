import {snapshot,entries,validate,slotCapacity,type Snapshot,type Entry} from './data';
import type {WardrobeDataHost,ClothingSlots} from './host';
import type {Item,Slot} from './types';

/** A page-local projection and binding table. Native objects never enter Vue items. */
export function createWardrobeSource(root:WardrobeDataHost,labels:(s:Snapshot)=>Record<string,string>,current:()=>boolean){
 let disposed=false,revision=0,fingerprint='',location='',inventory:Snapshot['inventory']|undefined;
 let bound:Entry[]=[],items:Item[]=[],slot='',scope:string[]=[],searching=false;
 function signature(s:Snapshot,keys:string[]){
  return JSON.stringify([s.location,s.variables.location,keys.map(key=>[key,(s.inventory as ClothingSlots)[key],s.setup.clothes[key]]),s.worn,labels(s),s.variables.options?.images,s.variables.wardrobeDefaults]);
 }
 function projected(s:Snapshot,keys:string[]){return keys.flatMap(key=>entries(s,key))}
 function displayFingerprint(s:Snapshot,keys:string[],list=projected(s,keys)){return signature(s,keys)+JSON.stringify(list.map(({raw,descriptor,slot,index,...view})=>view))}
 function read(requested:string,acrossSlots=false){
  if(disposed||!current())return null;
  const s=snapshot(root);if(!s)return null;
  const names=labels(s),slots:Slot[]=Object.entries(names).filter(([key])=>Array.isArray(s.inventory[key])).map(([key,label])=>({key,label,count:(s.inventory as ClothingSlots)[key].length,capacity:slotCapacity(s)}));
  const nextSlot=slots.some(value=>value.key===requested)?requested:slots[0]?.key;
  if(!nextSlot)return null;
  const nextScope=acrossSlots?slots.map(value=>value.key):[nextSlot];
  const nextEntries=projected(s,nextScope),nextFingerprint=displayFingerprint(s,nextScope,nextEntries);
  const changed=acrossSlots!==searching||s.inventory!==inventory||s.location!==location||nextSlot!==slot||nextFingerprint!==fingerprint||bound.length!==nextEntries.length||nextEntries.some((e,i)=>e.raw!==bound[i].raw||e.descriptor!==bound[i].descriptor);
  if(changed){
   revision++;bound=nextEntries.map(e=>({...e,key:`${e.slot}:${e.index}:r${revision}`}));
   items=bound.map(({raw:_raw,descriptor:_descriptor,slot:itemSlot,index:_index,...item})=>Object.freeze({...item,slotLabel:acrossSlots?names[itemSlot]:undefined,traits:[...item.traits],icons:item.icons.map(icon=>({...icon}))}));
  }
  inventory=s.inventory;location=s.location;slot=nextSlot;scope=nextScope;searching=acrossSlots;fingerprint=nextFingerprint;
  // Empty optional vanilla slots need no warning; genuinely new slots remain discoverable.
  const unknownSlots=Object.entries(s.inventory).filter(([key,value])=>!Object.hasOwn(names,key)&&Array.isArray(value)&&(value.length>0||!['over_upper','over_lower','over_head','genitals'].includes(key))&&(Array.isArray(s.setup.clothes[key])||Object.hasOwn(s.worn,key))).map(([key])=>key);
  const hiddenCount=nextScope.reduce((count,key)=>count+(s.inventory as ClothingSlots)[key].length,0)-items.length;
  return {snapshot:s,slot,slots,items,unknownSlots,categoryNote:hiddenCount>0?`${hiddenCount} 件关联套装部件由主件操作；可在原版信息中查看。`:'',revision};
 }
 function resolveMany(keys:string[]):Entry[]|null{
  if(disposed||!current())return null;
  const chosen=[...new Set(keys)].map(key=>bound.find(entry=>entry.key===key)),s=snapshot(root);
  if(!chosen.length||chosen.some(e=>!e)||!s||s.inventory!==inventory||s.location!==location||displayFingerprint(s,scope)!==fingerprint||chosen.some(e=>!validate(s,e!)))return null;
  return current()?chosen as Entry[]:null;
 }
 return {read,resolve:(key:string)=>resolveMany([key])?.[0]??null,resolveMany,destroy(){disposed=true;bound=[];items=[];inventory=undefined}};
}
