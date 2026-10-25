/** Tint presentation only; density, trajectories and refraction keep their existing owners. */
export function bloodRainPalette(amount:number){
 const t=Number.isFinite(amount)?Math.max(0,Math.min(1,amount)):0;
 const mix=(normal:[number,number,number],blood:[number,number,number])=>normal.map((v,i)=>Math.round(v+((blood[i]??v)-v)*t)).join(',');
 return{amount:t,
  tail:mix([200,222,231],[184,36,52]),head:mix([229,243,247],[235,90,104]),
  micro:mix([194,215,222],[181,58,65]),shadow:mix([0,9,16],[35,3,9]),
  trail:mix([172,201,207],[139,36,45]),rim:mix([184,209,214],[170,54,65]),rimEnd:mix([130,166,182],[128,31,45])};
}
