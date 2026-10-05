import type {Clothing,ClothingSlots,Inventory,Worn,WardrobeVariables,WardrobeSetup,WardrobeDataHost} from './host';
import {clothingIconLayers} from './icons';
import type {Item} from './types';
export const LABELS:Record<string,string>={head:'头饰',face:'面饰',neck:'颈部',upper:'上装',lower:'下装',under_upper:'内搭上装',under_lower:'内搭下装',hands:'手饰',handheld:'手持物',legs:'腿饰',feet:'鞋子'};
export interface Snapshot {root?:WardrobeDataHost;variables:WardrobeVariables;setup:WardrobeSetup;location:string;inventory:Inventory;worn:Worn}
export interface Entry extends Item {slot:string;index:number;raw:Clothing;descriptor:Clothing|undefined}
export function copy<T>(value:T):T {return structuredClone(value)}
export function snapshot(root:WardrobeDataHost):Snapshot|null {
 const variables=root.SugarCube?.State?.variables??root.State?.variables??root.V;
 const setup=root.SugarCube?.setup??root.setup;
 if(!variables?.worn||!variables.wardrobe||!setup?.clothes)return null;
 const location=variables.wardrobe_location||'wardrobe';
 const inventory=location==='wardrobe'?variables.wardrobe:variables.wardrobes?.[location];
 if(!inventory||inventory.locationRequirement?.length&&!inventory.locationRequirement.includes(variables.location))return null;
 return {root,variables,setup,location,inventory,worn:variables.worn};
}
export function descriptor(s:Snapshot,slot:string,item:Clothing){return s.setup.clothes[slot]?.find((d:Clothing)=>d.variable===item.variable&&d.modder===item.modder)}
export function itemName(s:Snapshot,slot:string,raw:Clothing,d=descriptor(s,slot,raw)):string {
 return String(raw.cn_name_cap??d?.cn_name_cap??d?.cn_name??raw.cn_name??d?.name_cap??raw.name_cap??raw.name??'未命名衣物');
}
export function itemColour(s:Snapshot,raw:Clothing):string {
 if(!raw.colour)return '';
 if(raw.colour==='custom'&&typeof s.root?.getCustomColourName==='function')return String(s.root.getCustomColourName(raw.colourCustom));
 return String(typeof s.setup.colourName==='function'?s.setup.colourName(raw.colour):raw.colour);
}
export function slotCapacity(s:Snapshot):number|null {const n=s.inventory.space;return typeof n==='number'&&Number.isFinite(n)&&n>=0?n:null}
export function itemWarmth(s:Snapshot,raw:Clothing,d:Clothing|undefined):number|null {
 try{const n=typeof s.root?.getTrueWarmth==='function'?s.root.getTrueWarmth(raw):d?.warmth;return Number.isFinite(n)?n!:null}catch{return Number.isFinite(d?.warmth)?d!.warmth!:null}
}
export function itemView(s:Snapshot,slot:string,raw:Clothing,key:string):Item {
 const d=descriptor(s,slot,raw),max=d?.integrity_max;
 const normalise=typeof s.root?.normaliseFileName==='function'?s.root.normaliseFileName:(value:string)=>value.replace(/ /g,'-');
 return {traits:s.variables.wardrobeDefaults?.showTraits&&Array.isArray(raw.type)?raw.type.map(String):[],lewd:Number.isFinite(raw.reveal)?raw.reveal!:null,outfit:raw.outfitPrimary?'套装':raw.outfitSecondary?'套装部件':'单件',key,name:itemName(s,slot,raw,d),colour:itemColour(s,raw),warmth:itemWarmth(s,raw,d),durability:Number.isFinite(raw.integrity)&&max!>0?Math.round(raw.integrity!/max!*100):null,detail:d?String(d.cn_description??d.description??''):'缺少服装定义，请使用原版衣柜',icons:s.variables.options?.images===0?[]:clothingIconLayers(raw,d,normalise),splittable:!!raw.outfitPrimary&&Object.values(raw.outfitPrimary).some(name=>typeof name==='string'&&!['broken','split'].includes(name))};
}
export function entries(s:Snapshot,slot:string):Entry[]{
 return (Array.isArray((s.inventory as ClothingSlots)[slot])?(s.inventory as ClothingSlots)[slot]:[]).flatMap((raw:Clothing,index:number)=>{
  if(raw.outfitSecondary&&!['broken','split'].includes(raw.outfitSecondary[1]))return [];
  const d=descriptor(s,slot,raw);
  return [{...itemView(s,slot,raw,slot+':'+index),slot,index,raw,descriptor:d}];
 });
}
export function validate(s:Snapshot,e:Entry){return (s.inventory as ClothingSlots)[e.slot]?.[e.index]===e.raw&&descriptor(s,e.slot,e.raw)===e.descriptor}
export function project(s:Snapshot,e:Entry):{worn:Worn;changed:string[]}{
 if(!validate(s,e)||!e.descriptor)throw Error('衣柜内容已变化，请重新选择衣物');
 const worn=copy(s.worn),changed=new Set<string>(),targets:Worn={[e.slot]:e.raw};
 for(const [slot,name]of Object.entries(e.raw.outfitPrimary??{})){
  if(name==='broken'||name==='split')continue;
  const primary=e.raw;
  const part=(s.inventory as ClothingSlots)[slot]?.find((p:Clothing)=>p.name===name&&p.colour===primary.colour&&(p.accessory===0||p.accessory_colour===primary.accessory_colour)&&(!p.pattern||!primary.pattern||p.pattern===0||p.pattern===primary.pattern)&&p.outfitSecondary?.[1]===primary.name&&(primary.colour!=='custom'||primary.colourCustom!==undefined&&p.colourCustom===primary.colourCustom)&&(primary.accessory_colour!=='custom'||primary.accessory_colourCustom!==undefined&&p.accessory_colourCustom===primary.accessory_colourCustom));
  if(!part)throw Error('套装关联衣物不完整，请使用原版衣柜处理');targets[slot]=part;
 }
 const removing=new Set<string>();
 function remove(slot:string){
  if(removing.has(slot))return;removing.add(slot);
  const old=worn[slot];if(!old)return;
  if(old.cursed)throw Error('当前衣物受到穿脱限制，请使用原版衣柜');
  const linked=old.outfitSecondary;
  if(linked&&worn[linked[0]]?.name===linked[1])remove(linked[0]);
  for(const [other,name] of Object.entries(old.outfitPrimary??{}))if(worn[other]?.name===name)remove(other);
  const naked=s.setup.clothes[slot]?.[0];if(!naked)throw Error('缺少部位定义：'+slot);
  worn[slot]=copy(naked);changed.add(slot);
 }
 for(const slot of Object.keys(targets))remove(slot);
 for(const [slot,item]of Object.entries(targets)){
  const d=descriptor(s,slot,item);if(!d)throw Error('缺少关联服装定义');
  const value=copy(item);
  const reset:Record<string,string>={state:'state_base',state_top:'state_top_base',exposed:'exposed_base',skirt_down:'skirt_down',vagina_exposed:'vagina_exposed_base',anus_exposed:'anus_exposed_base'};
  for(const [key,base]of Object.entries(reset))if(d[base]!==undefined)value[key]=copy(d[base]);
  worn[slot]=value;changed.add(slot);
 }
 return {worn,changed:[...changed]};
}
