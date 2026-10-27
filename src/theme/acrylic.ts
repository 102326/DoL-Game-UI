// One material axis. Text and hitboxes never inherit the surface's alpha.
export const acrylicDefault=60;
export function acrylicParameters(value:number){
 const amount=Math.max(0,Math.min(100,Number.isFinite(value)?value:acrylicDefault))/100;
 const pivot=acrylicDefault/100;
 const blend=(low:number,base:number,high:number)=>amount<=pivot?low+(base-low)*amount/pivot:base+(high-base)*(amount-pivot)/(1-pivot);
 const rgb=(low:readonly number[],base:readonly number[],high:readonly number[])=>low.map((v,i)=>Math.round(blend(v,base[i]!,high[i]!))).join(' ');
 const legacy=Math.max(0,(amount-pivot)/(1-pivot));
 // The clear endpoint restores 4.0.1's unblurred face. Alpha alone does not
 // describe perceived transparency: the V1 midpoint still scatters its backdrop.
 return {
  '--dgu-acrylic-axis-shell-rgb':rgb([46,47,50],[20,24,27],[36,38,42]),
  '--dgu-acrylic-axis-reading-rgb':rgb([39,40,43],[11,15,18],[0,0,0]),
  '--dgu-acrylic-axis-preview-rgb':rgb([47,49,52],[28,38,42],[29,30,34]),
  '--dgu-acrylic-axis-shell-alpha':String(blend(.94,.43,.85)),
  '--dgu-acrylic-axis-reading-alpha':String(blend(.55,.28,0)),
  '--dgu-acrylic-axis-preview-alpha':String(blend(.6,.37,.52)),
  '--dgu-acrylic-axis-filter':amount===1?'none':`blur(${blend(24,24,0)}px) saturate(.78)`,
  '--dgu-acrylic-axis-v1-light':String(1-legacy),
  '--dgu-acrylic-axis-legacy-light':String(20/255*legacy),
 };
}
