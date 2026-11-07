import {clamp,readPosition as readLegacy,type Area} from './geometry';
export const positionKey='SoftWet.MotionHub.freePosition.v1';
export interface Position {version:1;x:number;y:number;docked:boolean;side:'left'|'right'}
export const initialPosition=():Position=>({version:1,x:1,y:.58,docked:false,side:'right'});
export function canPersist(raw:string|null){try{const v=raw?JSON.parse(raw):null;return !v||v.version===undefined||v.version===1}catch{return true}}
export function readPosition(raw:string|null,legacy:string|null):Position{
 try{if(raw&&raw.length<=1024){const p=JSON.parse(raw) as Partial<Position>;if(p?.version===1&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&typeof p.x==='number'&&typeof p.y==='number'&&typeof p.docked==='boolean'&&(p.side==='left'||p.side==='right'))return{version:1,x:clamp(p.x,0,1),y:clamp(p.y,0,1),docked:p.docked,side:p.side}}}catch{/* Invalid stored position. */}
 const p=readLegacy(legacy);return{version:1,x:p.side==='left'?0:1,y:p.y,docked:p.docked,side:p.side};
}
export function locate(p:Position,a:Area){const w=p.docked?38:56,h=p.docked?72:56,gap=p.docked?0:12;return{x:a.left+gap+Math.max(0,a.width-w-2*gap)*(p.docked?(p.side==='right'?1:0):p.x),y:a.top+12+Math.max(0,a.height-h-24)*p.y}}
export function savePosition(p:{x:number;y:number},a:Area,docked:boolean):Position{return{version:1,x:clamp((p.x-a.left-12)/Math.max(1,a.width-80),0,1),y:clamp((p.y-a.top-12)/Math.max(1,a.height-(docked?72:56)-24),0,1),docked,side:p.x<a.left+a.width/2?'left':'right'}}
