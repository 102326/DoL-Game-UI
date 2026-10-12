export const toolIds=['settings','inspector','move'] as const;
export type ToolId=typeof toolIds[number];
export type FloatingPreferences={enabled:boolean;hidden:boolean;mode:'fan'|'grid';x:number;y:number;tools:ToolId[]};
export const floatingKey='DoLGameUI.stoneFree.floating.v1';
export const floatingDefaults:FloatingPreferences={enabled:true,hidden:false,mode:'fan',x:.88,y:.45,tools:[...toolIds]};
export function readFloatingPreferences(raw:string|null):FloatingPreferences{
 const p={...floatingDefaults,tools:[...floatingDefaults.tools]};
 try{if(!raw||raw.length>2048)return p;const v=JSON.parse(raw);if(!v||typeof v!=='object')return p;
  for(const k of ['enabled','hidden'] as const)if(typeof v[k]==='boolean')p[k]=v[k];
  if(v.mode==='fan'||v.mode==='grid')p.mode=v.mode;
  for(const k of ['x','y'] as const)if(typeof v[k]==='number'&&Number.isFinite(v[k]))p[k]=Math.max(0,Math.min(1,v[k]));
  if(Array.isArray(v.tools))p.tools=[...new Set<ToolId>((v.tools as unknown[]).filter((id):id is ToolId=>toolIds.includes(id as ToolId)))];
 }catch{/* Invalid settings never prevent the game from opening. */}
 return p;
}
export type Viewport={left:number;top:number;width:number;height:number};
export const ballSize=52,edge=12;
export function displayPosition(p:Pick<FloatingPreferences,'x'|'y'>,v:Viewport){return{x:v.left+edge+Math.max(0,v.width-ballSize-edge*2)*p.x,y:v.top+edge+Math.max(0,v.height-ballSize-edge*2)*p.y}}
export function positionIntent(x:number,y:number,v:Viewport){return{x:Math.max(0,Math.min(1,(x-v.left-edge)/Math.max(1,v.width-ballSize-edge*2))),y:Math.max(0,Math.min(1,(y-v.top-edge)/Math.max(1,v.height-ballSize-edge*2)))}}
