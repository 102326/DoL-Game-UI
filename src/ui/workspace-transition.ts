/** Accepted settings V2.3 page entry, shared by native replacement pages without cloning business DOM. */
export function workspaceEnterFrames(direction:number):Keyframe[]{
 const origin=direction>0?'0% 0%':'100% 0%';
 return[
  {transformOrigin:origin,transform:`translate3d(${direction*80}px,16px,-100px) rotateY(${-direction*24}deg) rotateX(7deg)`,opacity:0,clipPath:direction>0?'inset(0 96% 0 0 round 16px)':'inset(0 0 0 96% round 16px)'},
  {clipPath:'inset(0 0% 0 0% round 0px)',offset:.55},
  {transformOrigin:origin,transform:'translate3d(0,0,0) rotateY(0deg) rotateX(0deg)',opacity:1,clipPath:'inset(0 0% 0 0% round 0px)',offset:.78},
  {transformOrigin:origin,transform:'translate3d(0,0,0) rotateY(0deg) rotateX(0deg)',opacity:1,clipPath:'inset(0 0% 0 0% round 0px)'}
 ];
}
