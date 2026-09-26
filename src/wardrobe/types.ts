export type Operation = 'delete'|'separateOutfits'|'repair'|'transfer';
export interface Item {key:string;name:string;colour:string;warmth:number|null;durability:number|null;detail:string;icons:{src:string;className:string;style:string}[];traits:string[];splittable:boolean;lewd:number|null;outfit:string}
export interface Slot {key:string;label:string;count:number;capacity:number|null}
export interface WardrobeModel {
 pendingMode:Operation;canRepair:boolean;destinations:{key:string;label:string}[];pendingMinutes:number|null;wornItem:Item|null;owned:number;capacity:number|null;busy:boolean;pending:{key:string;name:string;colour:string;linked:boolean}[];progress:string;
 slots:Slot[];slot:string;items:Item[];selected:string|null;loading:boolean;
 message:string;previewStatus:string;canWear:boolean;wornName:string;currentWarmth:number|null;
}
