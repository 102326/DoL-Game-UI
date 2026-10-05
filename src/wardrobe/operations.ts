import type {Clothing,ClothingSlots,Inventory} from './host';
import type {Entry,Snapshot} from './data';
export type {Operation} from './types';
export function relatedPieces(inventory:Inventory,slot:string,item:Clothing){
 const result:{slot:string;index:number;raw:Clothing}[]=[];
 for(const [other,name] of Object.entries(item?.outfitPrimary??{})){
  if(typeof name!=='string'||['broken','split'].includes(name))continue;
  const index=((inventory as ClothingSlots)?.[other]??[]).findIndex((part:Clothing)=>part?.name===name&&part.colour===item.colour&&(part.accessory===0||part.accessory_colour===item.accessory_colour)&&(!part.pattern||!item.pattern||part.pattern===0||part.pattern===item.pattern)&&part.outfitSecondary?.[1]===item.name&&(part.colour!=='custom'||item.colourCustom!==undefined&&part.colourCustom===item.colourCustom)&&(part.accessory===0||part.accessory_colour!=='custom'||item.accessory_colourCustom!==undefined&&part.accessory_colourCustom===item.accessory_colourCustom));
  if(index>=0)result.push({slot:other,index,raw:(inventory as ClothingSlots)[other][index]});
 }
 return result;
}
export function pieces(s:Snapshot,e:Entry){return [{slot:e.slot,index:e.index,raw:e.raw},...relatedPieces(s.inventory,e.slot,e.raw)]}
export function canRepair(s:Snapshot){return s.variables.sewingKit===1&&s.variables.location==='home'}
export function destinations(s:Snapshot):{key:string;label:string}[]{
 const v=s.variables,wards=v.wardrobes??{};
 if(!v.settings?.multipleWardrobes||!wards[s.location]?.transfer||Object.values(wards).filter((w:Inventory)=>w?.unlocked&&w.shopSend).length<=1)return [];
 return Object.entries(wards).filter(([key,w]:[string,Inventory])=>key!==s.location&&w?.unlocked&&w.shopSend).map(([key,w]:[string,Inventory])=>({key,label:String(w.cn_name??w.name??key)}));
}
export function targetInventory(s:Snapshot,target?:string){return target==='wardrobe'?s.variables.wardrobe:target?s.variables.wardrobes?.[target]:undefined}
export function transferProblem(s:Snapshot,chosen:Entry[],target?:string):string{
 if(!destinations(s).some(d=>d.key===target))return '目标衣柜当前不可转入';
 const inventory=targetInventory(s,target),counts=new Map<string,number>(),seen=new Set<Clothing>();
 for(const e of chosen)for(const p of pieces(s,e)){if(seen.has(p.raw))continue;seen.add(p.raw);counts.set(p.slot,(counts.get(p.slot)??0)+1)}
 for(const [slot,count]of counts){if(!Array.isArray((inventory as ClothingSlots)?.[slot]))return '目标衣柜缺少对应部位';if(!Number.isFinite(inventory!.space)||(inventory as ClothingSlots)[slot].length+count>inventory!.space!)return '目标衣柜容量不足（包含套装关联部件）'}
 return '';
}
export function repairMinutes(inventory:Inventory,entries:Entry[]){return entries.reduce((n,e)=>n+1+relatedPieces(inventory,e.slot,e.raw).length,0)*5}
