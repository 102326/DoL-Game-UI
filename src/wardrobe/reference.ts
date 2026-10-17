import type {Binding,ViewContribution,Cleanup} from '../../framework/contracts';
import type {Item} from './types';

export interface ReferenceItem {readonly name:string;readonly colour:string;readonly slot:string;readonly warmth:number|null;readonly durability:number|null;readonly lewd:number|null;readonly outfit:string;readonly detail:string}
export interface ReferenceContext {readonly binding:Binding;remember?(item:ReferenceItem):void;read(key:string):ReferenceItem|null;publish?(view:ViewContribution):Cleanup}
/** Only display values cross into the reference; keys and native objects are not retained. */
export function referenceItem(item:Item,slot:string):Readonly<ReferenceItem>{
 return Object.freeze({name:item.name.slice(0,100),colour:item.colour.slice(0,60),slot,warmth:item.warmth,durability:item.durability,lewd:item.lewd,outfit:item.outfit,detail:item.detail.slice(0,240)});
}
export function compareReferences(a:ReferenceItem,b:ReferenceItem){
 return ([['colour','颜色'],['warmth','保暖'],['durability','耐久 %'],['lewd','暴露'],['outfit','类型']] as const).map(([field,label])=>{
  const left=a[field],right=b[field],unknown=left===null||right===null||left===''||right==='';
  return {field,label,left,right,status:unknown?'unknown':left===right?'same':'different'};
 });
}
