export interface Group {key:string;title:string;selected:string;count:number;available:number;known:boolean}
export interface CombatModel {groups:Group[];activeKey?:string;unknown:number;selectedGroups:number;availableActions:number;phase:'selecting'|'selected'|'unavailable';message:string}
