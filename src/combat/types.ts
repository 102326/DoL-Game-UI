export interface Group {key:string;title:string;selected:string;count:number;available:number;known:boolean}
export interface CombatModel {groups:Group[];activeKey?:string;focused?:boolean;focusAvailable?:boolean;editedKeys?:string[];unknown:number;selectedGroups:number;availableActions:number;phase:'selecting'|'selected'|'unavailable';message:string}
export interface CombatControls {version:string;getEnabled:()=>boolean;refresh:()=>void;setEnabled:(value:boolean)=>void;destroy:()=>void}
