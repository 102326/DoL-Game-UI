import {clamp,locate,readPosition,type Area} from '../../framework/motion-hub/geometry';
export const researchPositionKey='Evo42.hub.position.v1';
export interface FreePosition {version:1;x:number;y:number;docked:boolean;side:'left'|'right'}
export const initialPosition=():FreePosition=>({version:1,x:1,y:.58,docked:false,side:'right'});
export function locateFree(p:FreePosition,a:Area){
 const width=p.docked?38:56,height=p.docked?72:56;
 return{x:a.left+12+Math.max(0,a.width-width-24)*(p.docked?(p.side==='right'?1:0):p.x),y:a.top+12+Math.max(0,a.height-height-24)*p.y};
}
export function saveFree(point:{x:number;y:number},a:Area,docked:boolean):FreePosition{
 return{version:1,x:clamp((point.x-a.left-12)/Math.max(1,a.width-80),0,1),y:clamp((point.y-a.top-12)/Math.max(1,a.height-(docked?72:56)-24),0,1),docked,side:point.x<a.left+a.width/2?'left':'right'};
}
export function readFree(raw:string|null,legacy:string|null,a:Area):FreePosition{
 try{if(raw&&raw.length<1024){const p=JSON.parse(raw) as Partial<FreePosition>;if(p.version===1&&typeof p.x==='number'&&Number.isFinite(p.x)&&typeof p.y==='number'&&Number.isFinite(p.y)&&typeof p.docked==='boolean'&&(p.side==='left'||p.side==='right'))return{version:1,x:clamp(p.x,0,1),y:clamp(p.y,0,1),docked:p.docked,side:p.side};}}
 catch{/* Research storage is optional; no writes to the legacy key. */}
 if(legacy){const p=readPosition(legacy);return saveFree(locate(p,a),a,p.docked)}
 return initialPosition();
}
