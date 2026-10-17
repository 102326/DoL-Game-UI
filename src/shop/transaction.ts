import type {ShopFacts} from './source';
type RecordValue=Record<string,unknown>;
const record=(v:unknown):v is RecordValue=>!!v&&typeof v==='object'&&!Array.isArray(v);
export interface PurchaseWitness {readonly slot:string;readonly variable:string;readonly money:number;readonly cost:number;readonly amount:number;readonly count:number;readonly length:number;readonly state:RecordValue}
/** Ordinary native send-home batches (1–10). Outfits and unknown destinations stay native-only. */
export function purchaseWitness(control:Element,facts:ShopFacts,costOf?:(item:unknown,slot:string)=>number):PurchaseWitness|null{
 try{
  if(!control.matches('#buy-send-home .buy-button-inner.buy-multiple a.link-internal')||control.closest('.disabled')||!costOf)return null;
  const v=facts.variables,d=facts.definition;if(!v||!record(d)||typeof d.variable!=='string'||d.outfitPrimary||d.outfitSecondary)return null;
  if(!record(v.wardrobes)||v.wardrobes.shopReturn!=='wardrobe'||typeof v.buyMultiple!=='number'||!Number.isInteger(v.buyMultiple)||v.buyMultiple<1||v.buyMultiple>10||typeof v.clothingShopSlot!=='string'||!record(v.wardrobe))return null;
  const slot=v.clothingShopSlot,list=v.wardrobe[slot],amount=v.buyMultiple,cost=costOf(d,slot)*amount;
  if(!Array.isArray(list)||typeof v.money!=='number'||!Number.isFinite(v.money)||!Number.isFinite(cost)||cost<0||v.money<cost)return null;
  return Object.freeze({slot,variable:d.variable,money:v.money,cost,amount,count:list.filter(i=>record(i)&&i.variable===d.variable).length,length:list.length,state:v});
 }catch{return null}
}
export function purchaseResult(before:PurchaseWitness,facts:ShopFacts,current:boolean):'confirmed'|'unknown'{
 const v=facts.variables;if(!current||v!==before.state||!record(v.wardrobe))return 'unknown';
 const list=v.wardrobe[before.slot];
 return Array.isArray(list)&&v.money===before.money-before.cost&&list.length===before.length+before.amount&&list.filter(i=>record(i)&&i.variable===before.variable).length===before.count+before.amount?'confirmed':'unknown';
}
