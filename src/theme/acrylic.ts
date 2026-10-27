// One material axis. Text and hitboxes never inherit the surface's alpha.
export const acrylicDefault=50;
export function acrylicParameters(value:number){
 const amount=Math.max(0,Math.min(100,Number.isFinite(value)?value:acrylicDefault))/100;
 const blend=(low:number,base:number,high:number)=>amount<=.5?low+(base-low)*amount*2:base+(high-base)*(amount-.5)*2;
 return {
  '--dgu-acrylic-axis-shell-alpha':String(blend(.9,.43,.24)),
  '--dgu-acrylic-axis-reading-alpha':String(blend(.6,.28,.12)),
  '--dgu-acrylic-axis-preview-alpha':String(blend(.74,.37,.2)),
  '--dgu-acrylic-axis-blur':`${blend(20,24,28)}px`,
 };
}
