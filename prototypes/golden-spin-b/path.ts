export type Point = {x:number; y:number};
export type Target = Point & {width:number; height:number};
export type Bounds = {left:number; top:number; right:number; bottom:number};
export const clamp01 = (v:number) => Math.max(0,Math.min(1,v));
export const smooth = (v:number) => {const t=clamp01(v);return t*t*t*(10+t*(-15+6*t))};

/** A moving-centre spiral: zero endpoint velocity, phase-coupled real tools. */
export function pose(q:number,index:number,count:number,origin:Point,target:Target,bounds:Bounds,turns=1.15) {
 const delay=Math.min(.19,index*.037),u=clamp01((q-.14-delay)/(.86-delay));
 const s=smooth(u),energy=Math.sin(Math.PI*u)**2,scale=.25+.75*smooth(u/.82)+.045*energy;
 const cx=origin.x+(target.x-origin.x)*s,cy=origin.y+(target.y-origin.y)*s;
 const radius=Math.min(110,Math.hypot(target.x-origin.x,target.y-origin.y)*.48)*Math.sin(Math.PI*u)**2;
 const direction=origin.x<(bounds.left+bounds.right)/2?1:-1;
 const phase=u*Math.PI*2*turns+index*.44;
 // Elliptical room bounds keep the moving control visible, not clipped by its grid.
 const rx=Math.max(0,Math.min(radius,cx-bounds.left-target.width*scale/2,bounds.right-cx-target.width*scale/2));
 const ry=Math.max(0,Math.min(radius,cy-bounds.top-target.height*scale/2,bounds.bottom-cy-target.height*scale/2));
 return {x:cx+direction*rx*Math.sin(phase),y:cy+ry*Math.cos(phase),scale,
  rotation:direction*(-32*(1-s)+26*Math.sin(phase)*Math.sin(Math.PI*u)**2),
  tiltX:22*energy*Math.cos(phase),tiltY:direction*34*energy*Math.sin(phase),
  opacity:smooth(u/.14),u,phase:index/Math.max(1,count)};
}

/** Cubic Hermite clock: reversing first brakes the current signed velocity. */
export function progressAt(t:number,from:number,to:number,velocity:number,duration:number) {
 t=clamp01(t);
 const p=(2*t**3-3*t*t+1)*from+(t**3-2*t*t+t)*velocity*duration+(-2*t**3+3*t*t)*to;
 const v=((6*t*t-6*t)*from+(3*t*t-4*t+1)*velocity*duration+(-6*t*t+6*t)*to)/duration;
 return {q:clamp01(p),velocity:p<=0||p>=1?0:v};
}
